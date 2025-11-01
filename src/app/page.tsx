// file: src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadQueue, UploadItem } from '@/hooks/useUploadQueue';
import { Button } from '@/components/ui/button';
import ScoreDisplay from '@/components/ScoreDisplay';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper untuk warna status (tidak berubah)
const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'polling': return 'bg-yellow-100 text-yellow-800';
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

// Helper untuk ikon status (tidak berubah)
const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '📤';
      case 'polling': return '⚙️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
};

export default function HomePage() {
  const [jobDescription, setJobDescription] = useState('');
  const { uploads, isProcessing, addToQueue, removeUpload, processQueue, clearQueue, pollResults } = useUploadQueue();
  const [selectedUpload, setSelectedUpload] = useState<UploadItem | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      addToQueue(acceptedFiles);
    },
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: true,
    noClick: true,
  });

  const handleStartProcessing = () => {
    if (!jobDescription.trim()) {
      alert('Please provide a job description.');
      return;
    }
    processQueue(jobDescription);
  };
  
  useEffect(() => {
    const isPollingActive = uploads.some(u => u.status === 'polling');
    if (!isPollingActive) return;

    const intervalId = setInterval(() => {
      pollResults();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [uploads, pollResults]);

  return (
    <div {...getRootProps()} className={`min-h-screen transition-colors ${isDragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border-2 border-dashed border-blue-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Drop your CVs here</h3>
              <p className="text-gray-600 dark:text-gray-300">PDF and DOCX files supported</p>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Talent Screener AI</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Batch Process Multiple CVs with Advanced State Management</p>
      </div>
      
      {/* Form Input */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. Job Description</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Enter the job description..."
          className="w-full h-24 p-3 border rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
          disabled={isProcessing}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">2. Upload CVs</h2>
        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => document.querySelector('input[type="file"]')?.click()}>
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium mb-2">Drop files anywhere on this page</p>
          <p className="text-sm">or click here to browse files</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PDF and DOCX files supported</p>
        </div>
      </div>

      {/* Upload Queue */}
      {uploads.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Queue ({uploads.length})</h3>
            <div className="flex gap-2">
              <Button onClick={handleStartProcessing} disabled={isProcessing || uploads.every(u => u.status !== 'pending')}>
                {isProcessing ? 'Processing...' : 'Start Processing'}
              </Button>
              <Button variant="outline" onClick={clearQueue} disabled={isProcessing}>
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <span className="text-2xl">{getStatusIcon(upload.status)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-gray-900 dark:text-white">{upload.file.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{upload.message}</p>
                  {upload.status === 'success' && upload.result && (
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      Score: {upload.result.Score} / 100
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(upload.status)}`}>
                    {upload.status.toUpperCase()}
                </span>
                
                {/* --- BAGIAN YANG DIPERBAIKI --- */}
                {/* Tombol "View Details" hanya akan muncul jika status 'success' */}
                {upload.status === 'success' && (
                    <Button variant="secondary" size="sm" onClick={() => setSelectedUpload(upload)}>
                        View Details
                    </Button>
                )}
                {/* ---------------------------------- */}

                <Button variant="ghost" size="sm" onClick={() => removeUpload(upload.id)} disabled={isProcessing}>
                  X
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Komponen Modal (Dialog) */}
        <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="truncate">Analysis for: {selectedUpload?.file.name}</DialogTitle>
                </DialogHeader>
                {selectedUpload?.result && (
                    <div className="py-4">
                        <ScoreDisplay
                            score={selectedUpload.result.Score}
                            // Ditambahkan pengecekan untuk memastikan 'Summary' adalah string sebelum di-parse
                            // Ini membuat kode lebih aman (robust)
                            summary={
                                typeof selectedUpload.result.Summary === 'string' 
                                ? JSON.parse(selectedUpload.result.Summary) 
                                : []
                            }
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}