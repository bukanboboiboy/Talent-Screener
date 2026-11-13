'use client';

import React, { useEffect } from 'react';
import { CandidateResult } from '@/types/candidate';
import { getScoreTier, parseSummary } from '@/lib/candidate-utils';
import ScoreRing from '@/components/ScoreRing';
import {
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Sparkles,
  Calendar,
  Layers,
  Cpu,
} from 'lucide-react';

interface CandidateModalProps {
  candidate: CandidateResult | null;
  onClose: () => void;
}

export default function CandidateModal({ candidate, onClose }: CandidateModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!candidate) return null;

  const summaryPoints = parseSummary(candidate.Summary);
  const isRecommended = candidate.Status === 'RECOMMENDED';
  const tier = getScoreTier(candidate.Score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#0c121d] border border-slate-200 dark:border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden transform transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  {candidate.Name || 'Candidate Profile'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isRecommended
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRecommended ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {isRecommended ? 'Recommended' : 'Rejected'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                Record ID: {candidate.CandidateID}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-7 sm:p-8 space-y-6">
          {/* Top Score & Candidate Stat Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Circular Score Gauge */}
            <div className="sm:col-span-1 p-6 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] flex flex-col items-center justify-center text-center space-y-3">
              <ScoreRing score={candidate.Score} size="lg" showLabel />
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${tier.colorClass}`}
                >
                  {tier.label}
                </span>
              </div>
            </div>

            {/* Candidate Metadata Summary */}
            <div className="sm:col-span-2 p-6 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">
                    Candidate Email
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-200 truncate font-mono">
                    {candidate.Email || 'No email detected in CV'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">
                    Evaluation Engine
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-200">
                    AWS Bedrock + Textract AI Pipeline
                  </p>
                </div>
              </div>

              {candidate.ProcessingTimestamp && (
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-200/60 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">
                      Evaluated At
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-zinc-200 font-mono text-xs">
                      {new Date(candidate.ProcessingTimestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Applied Role & Job Description */}
          <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-200 font-semibold text-xs uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              <span>Target Role Requirements</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed font-sans pt-1">
              {candidate.JobDescription || 'No role description provided during screening.'}
            </p>
          </div>

          {/* AI Insights & Reasoning Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-200 font-semibold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Screening Observations & Fit Analysis</span>
            </div>

            <div className="space-y-2.5">
              {summaryPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] hover:border-blue-500/30 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-7 py-4 border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
