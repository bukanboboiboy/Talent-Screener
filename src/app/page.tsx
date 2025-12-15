'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';

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

  const pollForResults = async (candidateId: string, itemId: string) => {
    const maxAttempts = 20; 
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_GATEWAY_URL}/candidates/${candidateId}`);
        
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
        
        const payload = {
            cvFile: base64File,
            jobDescription: jobDescription
        };

        const response = await fetch(`${API_GATEWAY_URL}/candidates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        pollForResults(candidateId, item.id);

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-10 relative">
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload CV Kandidat</h1>
        </div>

        {/* INPUT JOB DESC */}
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6 transition-all duration-300 ${isJobDescError ? 'ring-2 ring-red-100 border-red-500' : ''}`}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex justify-between">
                <span>Posisi & Deskripsi Pekerjaan (Job Description)</span>
                {isJobDescError && (
                    <span className="text-red-500 text-xs font-normal animate-pulse">
                        ⚠️ Wajib diisi sebelum memproses
                    </span>
                )}
            </label>
            
            <textarea
                className={`w-full p-4 border rounded-lg focus:ring-2 bg-gray-50 dark:bg-gray-900 dark:text-white h-32 transition-all
                ${isJobDescError 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10 placeholder-red-300' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                placeholder={isJobDescError ? "Mohon isi deskripsi pekerjaan di sini agar AI bisa bekerja..." : "Contoh: Dibutuhkan DevOps Engineer yang menguasai AWS, Docker, dan Kubernetes..."}
                value={jobDescription}
                onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (e.target.value.trim()) setIsJobDescError(false); // Hilangkan merah kalau user mulai ngetik
                }}
                disabled={isGlobalProcessing || items.some(i => i.status === 'processing')}
            />
            
            {/* Pesan error di bawah kotak */}
            {isJobDescError ? (
                <p className="text-xs text-red-500 mt-2 font-medium">
                    * AI membutuhkan Job Description untuk menilai kecocokan kandidat.
                </p>
            ) : (
                <p className="text-xs text-gray-500 mt-2">
                    * Deskripsi ini akan digunakan AI untuk menilai kecocokan kandidat.
                </p>
            )}
        </div>

        {/* DROPZONE */}
        <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-8
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400'}`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Drag & drop file PDF di sini</p>
                <p className="text-sm text-gray-500 mt-1">atau klik untuk memilih file</p>
            </div>
        </div>

        {/* QUEUE LIST */}
        {items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-white">Antrean Upload ({items.length})</h3>
                    <div className="flex gap-3">
                        <button onClick={() => setItems([])} className="text-sm text-red-500 hover:text-red-700 font-medium" disabled={isGlobalProcessing}>Clear All</button>
                        <button 
                            onClick={startProcessing}
                            disabled={isGlobalProcessing || !items.some(i => i.status === 'idle')}
                            className={`px-4 py-2 rounded-lg text-white font-medium text-sm transition-all
                            ${isGlobalProcessing || !items.some(i => i.status === 'idle') ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                        >
                            {isGlobalProcessing ? 'Sedang Memproses...' : 'Mulai Analisis'}
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                            <div className="flex items-center gap-4 flex-1">
                                {/* Icon Status */}
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 shrink-0">
                                    {item.status === 'idle' && <span className="text-gray-500">📄</span>}
                                    {(item.status === 'uploading' || item.status === 'processing') && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                                    {item.status === 'success' && <span className="text-green-500 text-xl">✅</span>}
                                    {item.status === 'error' && <span className="text-red-500 text-xl">❌</span>}
                                </div>

                                {/* Info */}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{item.file.name}</p>
                                    <div className="text-xs mt-1">
                                        {item.status === 'idle' && <span className="text-gray-500">Menunggu antrean...</span>}
                                        {item.status === 'uploading' && <span className="text-blue-500">Mengunggah...</span>}
                                        {item.status === 'processing' && <span className="text-purple-500 animate-pulse">AI sedang menganalisis...</span>}
                                        {item.status === 'success' && <span className="font-bold text-gray-800 dark:text-gray-200">{item.candidateName}</span>}
                                        {item.status === 'error' && <span className="text-red-500">{item.errorMessage}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Score & Action */}
                            <div className="flex items-center gap-6">
                                {item.status === 'success' && item.score !== undefined && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase">Score</p>
                                        <p className={`text-lg font-bold ${getScoreColor(item.score).split(' ')[0]}`}>
                                            {item.score} <span className="text-xs text-gray-400 font-normal">/ 100</span>
                                        </p>
                                    </div>
                                )}

                                {item.status === 'success' ? (
                                    // UBAH DARI LINK KE BUTTON
                                    <button 
                                        onClick={() => setSelectedItem(item)}
                                        className="text-sm text-blue-600 hover:underline font-medium"
                                    >
                                        View Details
                                    </button>
                                ) : (
                                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition" disabled={item.status === 'uploading' || item.status === 'processing'}>✕</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* --- POP-UP MODAL (Copy dari Dashboard) --- */}
      {selectedItem && selectedItem.fullResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Analisis</h2>
                <p className="text-sm text-gray-500">{selectedItem.fullResult.Name}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-6 mb-6">
                <div className={`w-20 h-20 flex items-center justify-center rounded-full border-4 text-2xl font-bold ${getScoreColor(selectedItem.fullResult.Score)}`}>
                  {selectedItem.fullResult.Score}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email: {selectedItem.fullResult.Email}</p>
                  <p className="text-sm text-gray-500">Status: <span className="font-semibold">{selectedItem.fullResult.Status}</span></p>
                </div>
              </div>

              {/* Job Desc */}
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                    Deskripsi Pekerjaan
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {selectedItem.fullResult.JobDescription || "Tidak ada deskripsi tersedia."}
                </p>
              </div>

              <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Ringkasan Evaluasi AI:</h3>
              <ul className="space-y-3">
                {parseSummary(selectedItem.fullResult.Summary).map((point: string, index: number) => (
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
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}