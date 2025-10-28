// file: src/hooks/useUploadQueue.ts
import { useState, useCallback, useRef } from 'react';

// Tipe data untuk setiap item dalam antrian upload kita
export interface UploadItem {
  id: string; // ID unik untuk setiap file
  file: File;
  status: 'pending' | 'uploading' | 'polling' | 'success' | 'error';
  result?: any; // Nanti diisi hasil analisis
  candidateId?: string;
  message: string;
}

// Helper function untuk mengubah file menjadi Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export function useUploadQueue() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fungsi untuk menambahkan file ke antrian
  const addToQueue = useCallback((files: File[]) => {
    const newUploads = files.map(file => ({
      id: `upload-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending' as const,
      message: 'In queue...'
    }));
    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  // Fungsi internal untuk mengupdate status sebuah item
  const updateUpload = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  }, []);

  // Fungsi untuk menghapus item dari antrian
  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);
  
  const clearQueue = useCallback(() => {
    setUploads([]);
  }, []);

  // --- INI BAGIAN UTAMA YANG SAYA MODIFIKASI DARI SARAN AMAZON Q ---
  const processUpload = async (upload: UploadItem, jobDescription: string) => {
    try {
      // 1. Update status ke 'uploading'
      updateUpload(upload.id, { status: 'uploading', message: 'Sending to server...' });
      const base64CV = await fileToBase64(upload.file);

      // 2. Kirim ke API Gateway-mu
      const response = await fetch('https://bogtrc4td4.execute-api.ap-southeast-1.amazonaws.com/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, cvFile: base64CV }),
      });

      if (response.status !== 202) {
        const errorData = await response.json().catch(() => ({ message: `Server error: ${response.statusText}` }));
        throw new Error(errorData.message || `Server error: ${response.statusText}`);
      }

      const data = await response.json();

      // 3. Update status ke 'polling' (sukses upload, menunggu hasil)
      updateUpload(upload.id, {
        status: 'polling',
        candidateId: data.candidateId,
        message: 'Processing... waiting for analysis.',
      });

    } catch (error: any) {
      updateUpload(upload.id, {
        status: 'error',
        message: error.message || 'Upload failed',
      });
    }
  };

  const processQueue = useCallback(async (jobDescription: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const pendingUploads = uploads.filter(u => u.status === 'pending');
    const CONCURRENT_LIMIT = 3; // Proses 3 file secara bersamaan

    for (let i = 0; i < pendingUploads.length; i += CONCURRENT_LIMIT) {
      const chunk = pendingUploads.slice(i, i + CONCURRENT_LIMIT);
      await Promise.all(
        chunk.map(upload => processUpload(upload, jobDescription))
      );
    }

    setIsProcessing(false);
  }, [uploads, isProcessing, updateUpload]);

  // Fungsi polling tetap mirip, tapi sekarang terintegrasi dengan hook
  const pollResults = useCallback(() => {
    const itemsToPoll = uploads.filter(u => u.status === 'polling' && u.candidateId);
    if (itemsToPoll.length === 0) return;

    itemsToPoll.forEach(item => {
        fetch(`https://bogtrc4td4.execute-api.ap-southeast-1.amazonaws.com/candidates/${item.candidateId}`)
            .then(res => {
                if (res.status === 200) return res.json();
                if (res.status === 404) return null;
                throw new Error('Failed to fetch result');
            })
            .then(data => {
                if (data) {
                    updateUpload(item.id, { status: 'success', result: data, message: 'Analysis complete!' });
                }
            })
            .catch(err => {
                updateUpload(item.id, { status: 'error', message: err.message });
            });
    });

  }, [uploads, updateUpload]);

  return { uploads, isProcessing, addToQueue, removeUpload, processQueue, clearQueue, pollResults };
}