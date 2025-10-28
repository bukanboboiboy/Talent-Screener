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
    return <div className="text-center p-10">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Screening Dashboard</h1>
          <Link href="/" passHref>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              + Screen New CV
            </button>
          </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.length > 0 ? (
          results.map((result) => (
            <div key={result.CandidateID} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
               {/* Di sini kamu bisa tambahkan nama file jika ada di data */}
               <h3 className="font-bold truncate mb-4">Candidate: {result.CandidateID}</h3>
               <ScoreDisplay 
                    score={result.Score}
                    summary={typeof result.Summary === 'string' ? JSON.parse(result.Summary) : []}
               />
            </div>
          ))
        ) : (
          <p>No results found. Go ahead and screen your first CV!</p>
        )}
      </div>
    </main>
  );
}