'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';

// URL API Gateway
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

// Interface untuk data lengkap dari Backend
interface BackendResult {
  CandidateID: string;
  Name: string;
  Email: string;
  Score: number;
  Status: string;
  Summary: string;
  JobDescription: string;
}

interface UploadItem {
  id: string;
  file: File;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  candidateId?: string;
  candidateName?: string;
  score?: number;
  errorMessage?: string;
  fullResult?: BackendResult; // Kita simpan data lengkapnya di sini buat Pop-up
}

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [isJobDescError, setIsJobDescError] = useState(false);
  // State untuk Pop-up
  const [selectedItem, setSelectedItem] = useState<UploadItem | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const pollForResults = async (candidateId: string, itemId: string, token: string) => {
    const maxAttempts = 20;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        // Send token with polling request
        const res = await fetch(`${API_GATEWAY_URL}/candidates/${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data: BackendResult = await res.json();

          clearInterval(interval);

          setItems(prev => prev.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                status: 'success',
                progress: 100,
                candidateName: data.Name,
                score: data.Score,
                fullResult: data // SIMPAN DATA LENGKAP DI SINI
              };
            }
            return item;
          }));

          checkIfAllDone();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          handleError(itemId, "Analisis timeout.");
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);
  };

  const handleError = (itemId: string, msg: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: 'error', errorMessage: msg } : item
    ));
    checkIfAllDone();
  };

  const checkIfAllDone = () => {
    setItems(currentItems => {
      const stillProcessing = currentItems.some(i => i.status === 'uploading' || i.status === 'processing');
      if (!stillProcessing) setIsGlobalProcessing(false);
      return currentItems;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: UploadItem[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'idle',
      progress: 0
    }));

    setItems(prev => [...prev, ...newItems]);
  }, []);

  const startProcessing = async () => {
    if (!jobDescription.trim()) {
      setIsJobDescError(true); // Nyalakan tanda error merah
      // Opsional: Scroll ke atas biar user lihat
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsGlobalProcessing(true);
    const itemsToProcess = items.filter(i => i.status === 'idle');

    for (const item of itemsToProcess) {
      setItems(prev => prev.map(prevItem =>
        prevItem.id === item.id ? { ...prevItem, status: 'uploading', progress: 30 } : prevItem
      ));

      try {
        const base64File = await fileToBase64(item.file);

        // Ambil token user untuk Authorization
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        if (!token) {
          throw new Error("Token tidak ditemukan. Silakan login kembali.");
        }

        const payload = {
          cvFile: base64File,
          jobDescription: jobDescription
        };

        const response = await fetch(`${API_GATEWAY_URL}/candidates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Kirim token
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Gagal upload");

        const data = await response.json();
        const candidateId = data.candidateId;

        setItems(prev => prev.map(prevItem =>
          prevItem.id === item.id ? {
            ...prevItem,
            status: 'processing',
            progress: 60,
            candidateId: candidateId
          } : prevItem
        ));

        // Start polling for results with token
        pollForResults(candidateId, item.id, token);

      } catch (error) {
        handleError(item.id, "Gagal mengunggah file.");
      }
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 md:ml-64 relative">

      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Upload CV Kandidat</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Upload and analyze candidate resumes with AI-powered screening</p>
            </div>
          </div>
        </div>

        {/* INPUT JOB DESC - Enhanced */}
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 mb-8 transition-all duration-300 ${isJobDescError ? 'border-red-500 ring-4 ring-red-100 dark:ring-red-900/30' : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'}`}>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Posisi & Deskripsi Pekerjaan
            </span>
            <div className="flex items-center gap-3">
              {isJobDescError && (
                <span className="text-red-500 text-xs font-normal animate-pulse">
                  ⚠️ Required
                </span>
              )}
              <span className="text-xs text-gray-500">{jobDescription.length} characters</span>
            </div>
          </label>

          <textarea
            className={`w-full p-4 border-2 rounded-xl focus:ring-4 bg-gray-50 dark:bg-gray-900 dark:text-white h-36 transition-all font-mono text-sm
                ${isJobDescError
                ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30 bg-red-50 dark:bg-red-900/10 placeholder-red-400'
                : 'border-gray-200 dark:border-gray-700 focus:ring-blue-200 dark:focus:ring-blue-900/30 focus:border-blue-500'
              }`}
            placeholder={isJobDescError ? "⚠️ Mohon isi deskripsi pekerjaan di sini agar AI bisa bekerja..." : "Example: Dibutuhkan DevOps Engineer yang menguasai AWS, Docker, Kubernetes, CI/CD pipelines, dan memiliki pengalaman 3+ tahun..."}
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (e.target.value.trim()) setIsJobDescError(false);
            }}
            disabled={isGlobalProcessing || items.some(i => i.status === 'processing')}
          />

          {isJobDescError ? (
            <div className="flex items-center gap-2 mt-3 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              AI membutuhkan Job Description untuk menilai kecocokan kandidat
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Deskripsi ini akan digunakan AI untuk menilai kecocokan kandidat
            </div>
          )}
        </div>

        {/* DROPZONE - Enhanced */}
        <div
          {...getRootProps()}
          className={`group border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 mb-8 relative overflow-hidden
            ${isDragActive
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-blue-900/30 scale-105 shadow-2xl ring-4 ring-blue-200 dark:ring-blue-800'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:shadow-xl hover:scale-102'}`}
        >
          <input {...getInputProps()} />

          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>

          <div className="relative flex flex-col items-center">
            {/* Animated Icon */}
            <div className={`mb-6 transition-all duration-500 ${isDragActive ? 'animate-bounce scale-125' : 'group-hover:scale-110'}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-50 rounded-full animate-pulse"></div>
                <svg className="w-20 h-20 text-blue-600 dark:text-blue-400 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <p className={`text-xl font-bold mb-2 transition-colors ${isDragActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
              {isDragActive ? '📥 Drop files here' : '📄 Drag & drop PDF files here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse your computer</p>

            {/* File Type Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              PDF files only
            </div>
          </div>
        </div>

        {/* QUEUE LIST - Enhanced */}
        {items.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {items.length}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">File Queue</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{items.filter(i => i.status === 'success').length} completed</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setItems([])}
                  className="px-4 py-2 text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg font-medium transition-all hover:shadow-lg disabled:opacity-50"
                  disabled={isGlobalProcessing}
                >
                  Clear All
                </button>
                <button
                  onClick={startProcessing}
                  disabled={isGlobalProcessing || !items.some(i => i.status === 'idle')}
                  className={`px-6 py-2 rounded-lg text-white font-bold text-sm transition-all transform 
                    ${isGlobalProcessing || !items.some(i => i.status === 'idle')
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl hover:scale-105'}`}
                >
                  {isGlobalProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>🚀 Start Analysis</>
                  )}
                </button>
              </div>
            </div>

            {/* File Cards */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700 p-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-750 dark:hover:to-transparent transition-all duration-200 rounded-lg group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Enhanced Status Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
                      ${item.status === 'idle' && 'bg-gray-100 dark:bg-gray-700'}
                      ${(item.status === 'uploading' || item.status === 'processing') && 'bg-blue-50 dark:bg-blue-900/20'}
                      ${item.status === 'success' && 'bg-green-50 dark:bg-green-900/20'}
                      ${item.status === 'error' && 'bg-red-50 dark:bg-red-900/20'}`}
                    >
                      {item.status === 'idle' && <span className="text-2xl">📄</span>}
                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {item.status === 'success' && <span className="text-2xl animate-bounce">✅</span>}
                      {item.status === 'error' && <span className="text-2xl">❌</span>}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {item.file.name}
                        </p>
                        {item.status === 'success' && item.candidateName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {item.candidateName}
                          </span>
                        )}
                      </div>

                      {/* Status Text */}
                      <div className="text-xs mt-1 flex items-center gap-2">
                        {item.status === 'idle' && <span className="text-gray-500">⏳ Waiting in queue...</span>}
                        {item.status === 'uploading' && (
                          <span className="text-blue-600 font-medium flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                            Uploading to server...
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium animate-pulse flex items-center gap-1">
                            <div className="w-3 h-3 bg-purple-600 rounded-full animate-ping"></div>
                            AI analyzing resume...
                          </span>
                        )}
                        {item.status === 'error' && <span className="text-red-500 font-medium">{item.errorMessage}</span>}
                        {item.status === 'success' && (
                          <span className="text-green-600 dark:text-green-400 font-medium">✓ Analysis complete</span>
                        )}
                      </div>

                      {/* Progress Bar for uploading/processing */}
                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full transition-all duration-500 animate-pulse"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score & Action */}
                  <div className="flex items-center gap-4 ml-4">
                    {item.status === 'success' && item.score !== undefined && (
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 shadow-md ${getScoreColor(item.score)}`}>
                          <span className="text-xl font-bold">{item.score}</span>
                          <span className="text-[10px] opacity-75">/ 100</span>
                        </div>
                      </div>
                    )}

                    {item.status === 'success' ? (
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg transform hover:scale-105"
                      >
                        View →
                      </button>
                    ) : (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all"
                        disabled={item.status === 'uploading' || item.status === 'processing'}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL / POP-UP - Enhanced */}
      {selectedItem && selectedItem.fullResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all animate-fade-in"
          onClick={() => setSelectedItem(null)} // Close on backdrop click
        >
          <div
            className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all animate-scale-in"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >

            {/* Modal Header - Enhanced */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Candidate Analysis</h2>
                <p className="text-blue-100 mt-1 font-medium">{selectedItem.fullResult.Name}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
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
                  <div className={`w-32 h-32 rounded-2xl flex flex-col items-center justify-center border-4 shadow-xl ${getScoreColor(selectedItem.fullResult.Score)}`}>
                    <span className="text-5xl font-extrabold">{selectedItem.fullResult.Score}</span>
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
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedItem.fullResult.Email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-3 py- rounded-full text-sm font-bold ${selectedItem.fullResult.Status === 'RECOMMENDED'
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-200'
                        : 'bg-red-100 text-red-700 ring-2 ring-red-200'
                        }`}>
                        {selectedItem.fullResult.Status}
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
                  {selectedItem.fullResult.JobDescription || "No job description available."}
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
                  {parseSummary(selectedItem.fullResult.Summary).map((point: string, index: number) => (
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