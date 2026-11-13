'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CandidateResult } from '@/types/candidate';
import { getScoreTier } from '@/lib/candidate-utils';
import ScoreRing from '@/components/ScoreRing';
import CandidateModal from '@/components/CandidateModal';
import {
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  ArrowUpRight,
  Briefcase,
  Mail,
  Calendar,
  Sparkles,
  Filter,
  LayoutList,
  LayoutGrid,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

export default function DashboardPage() {
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECOMMENDED' | 'REJECTED'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);

  // Authenticate session and fetch candidate records
  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();

        if (idToken) {
          await fetchResults(idToken);
        } else {
          setError('Session not found. Please sign in again.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Session retrieval error:', err);
        setError('Failed to retrieve authentication session.');
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchResults = async (token: string) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_GATEWAY_URL}/candidates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const sortedData = (Array.isArray(data) ? data : []).sort(
        (a: CandidateResult, b: CandidateResult) => {
          const timeA = a.ProcessingTimestamp ? new Date(a.ProcessingTimestamp).getTime() : 0;
          const timeB = b.ProcessingTimestamp ? new Date(b.ProcessingTimestamp).getTime() : 0;
          return timeB - timeA;
        }
      );

      setResults(sortedData);
    } catch (err: any) {
      console.error('Error fetching candidate records:', err.message);
      setError(`Failed to fetch records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on search query and status filter
  const filteredResults = useMemo(() => {
    return results.filter((candidate) => {
      if (statusFilter !== 'ALL' && candidate.Status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (candidate.Name || '').toLowerCase();
      const email = (candidate.Email || '').toLowerCase();
      const jobDesc = (candidate.JobDescription || '').toLowerCase();

      return name.includes(q) || email.includes(q) || jobDesc.includes(q);
    });
  }, [results, searchQuery, statusFilter]);

  // Cohort analytics
  const totalCount = results.length;
  const recommendedCount = results.filter((r) => r.Status === 'RECOMMENDED').length;
  const rejectedCount = results.filter((r) => r.Status === 'REJECTED').length;
  const avgScore =
    totalCount > 0
      ? Math.round(results.reduce((acc, curr) => acc + (curr.Score || 0), 0) / totalCount)
      : 0;

  return (
    <main className="min-h-screen p-4 sm:p-8 md:p-10 md:ml-64 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3 h-3" />
              <span>AWS Bedrock Cohort Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              Candidate Evaluation Board
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Continuous candidate screening telemetry, match scores, and automated qualification status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/upload">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                <Plus className="w-4 h-4" />
                <span>Screen Resumes</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] uppercase font-bold tracking-wider">Total Evaluated</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              {totalCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
              <span>Bedrock + Textract parsed</span>
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] uppercase font-bold tracking-wider">Recommended</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {recommendedCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5">
              {totalCount > 0 ? Math.round((recommendedCount / totalCount) * 100) : 0}% candidate acceptance
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] uppercase font-bold tracking-wider">Mean Fit Score</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 font-mono">
              {avgScore}
              <span className="text-xs font-normal text-slate-400 dark:text-zinc-500 ml-1">/100</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5">Average cohort alignment</p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-3">
              <span className="text-[11px] uppercase font-bold tracking-wider">Rejected</span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {rejectedCount}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1.5">Below requirement cutoff</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name, email, or role keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-transparent border-0 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/[0.08] pt-2 sm:pt-0 sm:pl-3">
            {/* Status Segmented Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl">
              {(['ALL', 'RECOMMENDED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === filter
                      ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'RECOMMENDED' ? 'Recommended' : 'Rejected'}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
                title="Compact List View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section: List Table or Cards */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0d1322] p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="w-36 h-4 rounded bg-slate-200 dark:bg-zinc-800" />
                    <div className="w-48 h-3 rounded bg-slate-100 dark:bg-zinc-850" />
                  </div>
                </div>
                <div className="w-24 h-6 rounded-full bg-slate-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
            <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        ) : filteredResults.length > 0 ? (
          viewMode === 'list' ? (
            /* COMPACT LIST / TABLE FORMAT (Vercel / Linear inspired) */
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0d1322] overflow-hidden shadow-sm">
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-100 dark:border-white/[0.06] text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 bg-slate-50/50 dark:bg-white/[0.01]">
                <div className="col-span-1 text-center">Score</div>
                <div className="col-span-4 sm:col-span-3">Candidate</div>
                <div className="hidden sm:block sm:col-span-4">Applied Role Requirements</div>
                <div className="col-span-4 sm:col-span-2 text-center">Recommendation</div>
                <div className="col-span-3 sm:col-span-2 text-right">Action</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredResults.map((candidate) => {
                  const tier = getScoreTier(candidate.Score);
                  const isRecommended = candidate.Status === 'RECOMMENDED';

                  return (
                    <div
                      key={candidate.CandidateID}
                      onClick={() => setSelectedCandidate(candidate)}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/40 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* 1. Score with circular progress ring */}
                      <div className="col-span-1 flex justify-center">
                        <ScoreRing score={candidate.Score} size="sm" />
                      </div>

                      {/* 2. Candidate Info */}
                      <div className="col-span-4 sm:col-span-3 min-w-0 pr-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                          {candidate.Name || 'Candidate Record'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate font-mono">
                          {candidate.Email || 'No email provided'}
                        </p>
                      </div>

                      {/* 3. Role Requirements */}
                      <div className="hidden sm:block sm:col-span-4 min-w-0 pr-4">
                        <div className="inline-flex items-center gap-1.5 max-w-full">
                          <span className="text-xs text-slate-600 dark:text-zinc-400 truncate font-sans">
                            {candidate.JobDescription || 'Role requirements recorded'}
                          </span>
                        </div>
                      </div>

                      {/* 4. Recommendation & Match Tier */}
                      <div className="col-span-4 sm:col-span-2 flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isRecommended
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRecommended ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isRecommended ? 'Recommended' : 'Rejected'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          {tier.label}
                        </span>
                      </div>

                      {/* 5. Quick View Action */}
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(candidate);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all shadow-sm group-hover:bg-blue-600 group-hover:text-white"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CARD GRID FORMAT */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((candidate) => {
                const tier = getScoreTier(candidate.Score);
                const isRecommended = candidate.Status === 'RECOMMENDED';

                return (
                  <div
                    key={candidate.CandidateID}
                    onClick={() => setSelectedCandidate(candidate)}
                    className="p-6 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift cursor-pointer flex flex-col justify-between space-y-5 group"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Info and Score Ring */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                            {candidate.Name || 'Candidate Record'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate font-mono mt-0.5">
                            {candidate.Email || 'No email detected'}
                          </p>
                        </div>
                        <ScoreRing score={candidate.Score} size="md" />
                      </div>

                      {/* Pills */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isRecommended
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRecommended ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isRecommended ? 'Recommended' : 'Rejected'}
                        </span>

                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${tier.colorClass}`}
                        >
                          {tier.label}
                        </span>
                      </div>

                      {/* Applied Role Snippet */}
                      <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Target Role
                        </p>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {candidate.JobDescription || 'Role requirements recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                        {candidate.ProcessingTimestamp
                          ? new Date(candidate.ProcessingTimestamp).toLocaleDateString()
                          : 'Evaluated'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>View report</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0d1322] border border-dashed border-slate-200 dark:border-white/[0.08] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-400 dark:text-zinc-500 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                No candidate records match your query
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No evaluations match "${searchQuery}". Reset filters to see cohort.`
                  : 'Screen candidate resumes to populate your evaluation board.'}
              </p>
            </div>
            <Link href="/upload" className="inline-block pt-1">
              <button className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Screen Resumes
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Shared Reusable Candidate Modal */}
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </main>
  );
}
