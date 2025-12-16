'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

interface CandidateResult {
  CandidateID: string;
  Name: string;
  Email: string;
  Score: number;
  Status: string;
  Summary: string;
  JobDescription: string; // Tambahan Baru
  ProcessingTimestamp: string;
}

export default function DashboardPage() {
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [token, setToken] = useState<string | null>(null); // State untuk simpan token user

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);

  // Ambil token user dari AWS Amplify dan fetch data
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Ambil Token (Langkah 1)
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (idToken) {
          setToken(idToken);

          // 2. Panggil API sambil bawa Token (Langkah 2)
          await fetchResults(idToken);
        } else {
          console.warn("⚠️ Token tidak ditemukan. User mungkin belum login.");
          setError('Session tidak ditemukan. Silakan login kembali.');
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Gagal mengambil session user.");
        setError('Gagal mengambil session user.');
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchResults = async (token: string) => {
    try {
      setLoading(true);

      // --- BAGIAN PENTING: KIRIM TOKEN DI HEADER ---
      const response = await fetch(`${API_GATEWAY_URL}/candidates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Tempel "KTP" user di sini dengan format Bearer
          'Authorization': `Bearer ${token}`
        }
      });
      // ---------------------------------------------

      if (!response.ok) {
        // Log error details without exposing token
        const errorText = await response.text();
        console.error("❌ API Error:", response.status, response.statusText);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const sortedData = data.sort((a: CandidateResult, b: CandidateResult) =>
        new Date(b.ProcessingTimestamp).getTime() - new Date(a.ProcessingTimestamp).getTime()
      );

      setResults(sortedData);
    } catch (err: any) {
      console.error('❌ Error fetching data:', err.message);
      setError(`Gagal mengambil data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const parseSummary = (summaryString: string) => {
    try {
      const parsed = JSON.parse(summaryString);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return ["Gagal memuat detail ringkasan."];
    }
  };

  // Filter results based on search query
  const filteredResults = results.filter((candidate) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const name = (candidate.Name || '').toLowerCase();
    const email = (candidate.Email || '').toLowerCase();
    const jobDesc = (candidate.JobDescription || '').toLowerCase();

    return name.includes(query) || email.includes(query) || jobDesc.includes(query);
  });

  if (loading) return <div className="text-center p-10 text-gray-500 animate-pulse">Memuat data...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 md:ml-64 relative">

      {/* HEADER - Enhanced */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard Rekrutmen</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage candidate screening results</p>
            </div>
          </div>

          {/* Action Button */}
          <Link href="/" passHref>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Screen New CV
            </button>
          </Link>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Candidates</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{results.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Recommended</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{results.filter(r => r.Status === 'RECOMMENDED').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-5 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-1">{results.filter(r => r.Status === 'REJECTED').length}</p>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - NEW */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or job description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Found <span className="font-bold text-blue-600 dark:text-blue-400">{filteredResults.length}</span> candidate{filteredResults.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* GRID KARTU - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <div
              key={result.CandidateID}
              className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between transform hover:scale-102"
            >
              <div>
                {/* Info Kandidat */}
                <div className="mb-5 pb-5 border-b-2 border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {result.Name || "Nama Tidak Terdeteksi"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        {result.Email || "Email tidak ditemukan"}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold shrink-0 shadow-sm
                      ${result.Status === 'RECOMMENDED' ? 'bg-green-100 text-green-700' :
                        result.Status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {result.Status || 'Selesai'}
                    </span>
                  </div>

                  {/* Job Description Preview */}
                  <div className="mt-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-bold text-xs text-gray-700 dark:text-gray-300">Applied for:</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {result.JobDescription || "Tidak ada deskripsi pekerjaan."}
                    </p>
                  </div>
                </div>

                {/* Enhanced Score Display */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center border-4 shadow-lg transform group-hover:scale-110 transition-transform ${getScoreColor(result.Score)}`}>
                    <span className="text-4xl font-extrabold">{result.Score}</span>
                    <span className="text-[10px] opacity-75 mt-1">/ 100</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-3 uppercase tracking-wider font-medium">AI Score</span>
                </div>
              </div>

              {/* Enhanced Action Button */}
              <div className="mt-6">
                <button
                  onClick={() => setSelectedCandidate(result)}
                  className="w-full text-center py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Full Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No candidate data yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Upload resumes to start screening</p>
          </div>
        )}
      </div>

      {/* --- MODAL / POP-UP - Enhanced --- */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all animate-fade-in"
          onClick={() => setSelectedCandidate(null)} // Close on backdrop click
        >
          <div
            className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all animate-scale-in"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >

            {/* Modal Header - Enhanced */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Candidate Analysis</h2>
                <p className="text-blue-100 mt-1 font-medium">{selectedCandidate.Name}</p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) - Enhanced */}
            <div className="p-8 overflow-y-auto">

              {/* Score & Info Section */}
              <div className="flex flex-col md:flex-row gap-6 mb-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600">
                {/* Score Display */}
                <div className="flex justify-center md:justify-start">
                  <div className={`w-32 h-32 rounded-2xl flex flex-col items-center justify-center border-4 shadow-xl ${getScoreColor(selectedCandidate.Score)}`}>
                    <span className="text-5xl font-extrabold">{selectedCandidate.Score}</span>
                    <span className="text-xs opacity-75 mt-2">/ 100</span>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedCandidate.Email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${selectedCandidate.Status === 'RECOMMENDED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {selectedCandidate.Status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description Section */}
              <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200">Job Requirements</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {selectedCandidate.JobDescription || "No job description available."}
                </p>
              </div>

              {/* AI Evaluation Summary */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Evaluation Summary</h3>
                </div>
                <ul className="space-y-3">
                  {parseSummary(selectedCandidate.Summary).map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-700/50 dark:to-transparent p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                      <span className="mt-0.5 min-w-[28px] h-7 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold rounded-lg shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}