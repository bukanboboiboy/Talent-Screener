'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_GATEWAY_URL}/candidates`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      const sortedData = data.sort((a: CandidateResult, b: CandidateResult) => 
        new Date(b.ProcessingTimestamp).getTime() - new Date(a.ProcessingTimestamp).getTime()
      );
      
      setResults(sortedData);
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengambil data dari server.');
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

  if (loading) return <div className="text-center p-10 text-gray-500 animate-pulse">Memuat data...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Rekrutmen</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Versi Preview (Tanpa Login)</p>
        </div>
        <Link href="/" passHref>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Screen CV Baru
            </button>
        </Link>
      </div>

      {/* GRID KARTU */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.CandidateID} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-between">
               <div>
                   {/* Info Kandidat */}
                   <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1 mr-2">
                                {result.Name || "Nama Tidak Terdeteksi"}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                result.Status === 'RECOMMENDED' ? 'bg-green-100 text-green-700' : 
                                result.Status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {result.Status || 'Selesai'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{result.Email || "Email tidak ditemukan"}</p>
                        
                        {/* --- BAGIAN BARU: JOB DESC (DIBATASI) --- */}
                        <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-semibold block mb-1">Melamar untuk:</span>
                            <p className="line-clamp-2"> {/* line-clamp-2 memotong teks jadi 2 baris + titik-titik */}
                                {result.JobDescription || "Tidak ada deskripsi pekerjaan."}
                            </p>
                        </div>
                   </div>

                   {/* Skor Besar */}
                   <div className="flex flex-col items-center justify-center py-2">
                        <div className={`text-5xl font-extrabold ${getScoreColor(result.Score).split(' ')[0]}`}>
                            {result.Score}
                        </div>
                        <span className="text-xs text-gray-400 mt-2 uppercase tracking-wide">AI Score</span>
                   </div>
               </div>

               <div className="mt-6">
                    <button 
                        onClick={() => setSelectedCandidate(result)}
                        className="w-full text-center py-2.5 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-semibold border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                        Lihat Detail Lengkap 
                    </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Belum ada data kandidat.</p>
          </div>
        )}
      </div>

      {/* --- MODAL / POP-UP --- */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Analisis</h2>
                <p className="text-sm text-gray-500">{selectedCandidate.Name}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              
              <div className="flex items-center gap-6 mb-6">
                <div className={`w-20 h-20 flex items-center justify-center rounded-full border-4 text-2xl font-bold ${getScoreColor(selectedCandidate.Score)}`}>
                  {selectedCandidate.Score}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email: {selectedCandidate.Email}</p>
                  <p className="text-sm text-gray-500">Status: <span className="font-semibold">{selectedCandidate.Status}</span></p>
                  <p className="text-xs text-gray-400 mt-1">ID: {selectedCandidate.CandidateID}</p>
                </div>
              </div>

              {/* --- JOB DESC LENGKAP DI SINI --- */}
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    Deskripsi Pekerjaan / Kriteria
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {selectedCandidate.JobDescription || "Tidak ada deskripsi tersedia."}
                </p>
              </div>

              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Ringkasan Evaluasi AI:</h3>
              <ul className="space-y-3">
                {parseSummary(selectedCandidate.Summary).map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <span className="mt-1 min-w-[20px] h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end shrink-0">
              <button onClick={() => setSelectedCandidate(null)} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}