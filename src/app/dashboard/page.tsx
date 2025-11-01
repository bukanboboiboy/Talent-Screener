// file: src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScoreDisplay from '@/components/ScoreDisplay'; // Kita pakai lagi komponen ini

// Tipe data untuk setiap kandidat
interface CandidateResult {
  CandidateID: string;
  Score: number;
  Summary: string;
  ProcessingTimestamp: string;
  // Mungkin ada data lain seperti nama file jika kamu menyimpannya
}

export default function DashboardPage() {
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const response = await fetch('https://bogtrc4td4.execute-api.ap-southeast-1.amazonaws.com/candidates');
        if (!response.ok) {
          throw new Error('Failed to fetch data from the server.');
        }
        const data = await response.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []); // [] berarti useEffect ini hanya berjalan sekali saat halaman dibuka

  if (loading) {
    return <div className="text-center p-10 text-gray-900 dark:text-white">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Screening Dashboard</h1>
          <Link href="/" passHref>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Screen New CV
            </button>
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.CandidateID} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
               {/* Di sini kamu bisa tambahkan nama file jika ada di data */}
               <h3 className="font-bold truncate mb-4 text-gray-900 dark:text-white">Candidate: {result.CandidateID}</h3>
               <ScoreDisplay 
                    score={result.Score}
                    summary={typeof result.Summary === 'string' ? JSON.parse(result.Summary) : []}
               />
            </div>
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-300">No results found. Go ahead and screen your first CV!</p>
        )}
      </div>
    </main>
  );
}