'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CandidateResult } from '@/types/candidate';
import { getScoreTier } from '@/lib/candidate-utils';
import ScoreRing from '@/components/ScoreRing';
import CandidateModal from '@/components/CandidateModal';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  ArrowRight,
  Briefcase,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

interface UploadItem {
  id: string;
  file: File;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  candidateId?: string;
  candidateName?: string;
  score?: number;
  errorMessage?: string;
  fullResult?: CandidateResult;
}

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
  const [isJobDescError, setIsJobDescError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UploadItem | null>(null);

  // Track active polling intervals to prevent memory leaks on unmount
  const activeIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      activeIntervals.current.forEach((intervalId) => clearInterval(intervalId));
      activeIntervals.current.clear();
    };
  }, []);

  // Update global processing state when queue finishes
  useEffect(() => {
    if (items.length > 0) {
      const stillProcessing = items.some(
        (i) => i.status === 'uploading' || i.status === 'processing'
      );
      if (!stillProcessing) {
        setIsGlobalProcessing(false);
      }
    } else {
      setIsGlobalProcessing(false);
    }
  }, [items]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const pollForResults = async (candidateId: string, itemId: string, token: string) => {
    const maxAttempts = 25;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_GATEWAY_URL}/candidates/${candidateId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data: CandidateResult = await res.json();
          clearInterval(interval);
          activeIntervals.current.delete(itemId);

          setItems((prev) =>
            prev.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  status: 'success',
                  progress: 100,
                  candidateName: data.Name,
                  score: data.Score,
                  fullResult: data,
                };
              }
              return item;
            })
          );
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          activeIntervals.current.delete(itemId);
          handleError(itemId, 'AI analysis timed out. Check dashboard later.');
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 3000);

    activeIntervals.current.set(itemId, interval);
  };

  const handleError = (itemId: string, msg: string) => {
    const interval = activeIntervals.current.get(itemId);
    if (interval) {
      clearInterval(interval);
      activeIntervals.current.delete(itemId);
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: 'error', errorMessage: msg } : item
      )
    );
  };

  const removeItem = (id: string) => {
    const interval = activeIntervals.current.get(id);
    if (interval) {
      clearInterval(interval);
      activeIntervals.current.delete(id);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    activeIntervals.current.forEach((interval) => clearInterval(interval));
    activeIntervals.current.clear();
    setItems([]);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: UploadItem[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'idle',
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const startProcessing = async () => {
    if (!jobDescription.trim()) {
      setIsJobDescError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsGlobalProcessing(true);
    const itemsToProcess = items.filter((i) => i.status === 'idle');

    for (const item of itemsToProcess) {
      setItems((prev) =>
        prev.map((prevItem) =>
          prevItem.id === item.id ? { ...prevItem, status: 'uploading', progress: 30 } : prevItem
        )
      );

      try {
        const base64File = await fileToBase64(item.file);
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        if (!token) {
          throw new Error('Authentication session expired. Please sign in again.');
        }

        const payload = {
          cvFile: base64File,
          jobDescription,
        };

        const response = await fetch(`${API_GATEWAY_URL}/candidates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to upload CV to analysis service');

        const data = await response.json();
        const candidateId = data.candidateId;

        setItems((prev) =>
          prev.map((prevItem) =>
            prevItem.id === item.id
              ? {
                  ...prevItem,
                  status: 'processing',
                  progress: 65,
                  candidateId,
                }
              : prevItem
          )
        );

        pollForResults(candidateId, item.id, token);
      } catch (error: any) {
        handleError(item.id, error.message || 'Failed to process CV.');
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
  });

  const completedCount = items.filter((i) => i.status === 'success').length;
  const pendingCount = items.filter((i) => i.status === 'idle').length;

  return (
    <main className="min-h-screen p-4 sm:p-8 md:p-10 md:ml-64 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200/80 dark:border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Textract + Bedrock Neural Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              Screen Candidate CVs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Batch upload applicant PDF resumes and match them against your position requirements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] px-3 py-1.5 rounded-xl font-mono bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400 shadow-sm">
              Max 10MB · PDF Only
            </span>
          </div>
        </div>

        {/* 1. Job Description Requirements Box */}
        <div
          className={`p-7 rounded-2xl bg-white dark:bg-[#0d1322] border transition-all duration-300 glow-card ${
            isJobDescError
              ? 'border-rose-500/80 ring-4 ring-rose-500/10 dark:ring-rose-500/20'
              : 'border-slate-200/80 dark:border-white/[0.08] focus-within:border-blue-500/60 dark:focus-within:border-blue-500/60 focus-within:ring-4 focus-within:ring-blue-500/10'
          }`}
        >
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <label htmlFor="job-description" className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Target Role Description & Skills Criteria
              </label>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {isJobDescError && (
                <span className="text-rose-500 font-semibold flex items-center gap-1 animate-pulse text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> Required for evaluation
                </span>
              )}
              <span className="font-mono text-slate-400 dark:text-zinc-500 text-[11px]">
                {jobDescription.length} chars
              </span>
            </div>
          </div>

          <textarea
            id="job-description"
            className="w-full p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#080b12] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-0 text-xs sm:text-sm leading-relaxed min-h-[140px] font-sans resize-y"
            placeholder="e.g. Senior Cloud Architect: 5+ years AWS experience, deep mastery of ECS/EKS, Terraform/IaC, Serverless (Lambda, EventBridge), security architectures, and distributed systems..."
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              if (e.target.value.trim()) setIsJobDescError(false);
            }}
            disabled={isGlobalProcessing}
          />
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2.5">
            Bedrock cross-examines applicant work history, projects, and skills strictly against this description.
          </p>
        </div>

        {/* 2. Interactive Dropzone with Glow & Ring */}
        <div
          {...getRootProps()}
          className={`relative group rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
            isDragActive
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/25'
              : isDragReject
              ? 'border-rose-500 bg-rose-500/5'
              : 'border-slate-300/80 dark:border-white/[0.12] hover:border-blue-500/70 bg-white dark:bg-[#0d1322] hover:bg-slate-50/70 dark:hover:bg-[#101728] glow-card animate-pulse-glow'
          }`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragActive
                  ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-zinc-300 group-hover:scale-105 group-hover:bg-blue-500/10 group-hover:text-blue-500'
              }`}
            >
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-slate-800 dark:text-zinc-100">
                {isDragActive ? (
                  <span className="text-blue-500 dark:text-blue-400">Drop PDF files here</span>
                ) : (
                  <>
                    <span className="text-blue-600 dark:text-blue-400 hover:underline">
                      Click to browse
                    </span>{' '}
                    or drag & drop applicant CVs
                  </>
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Supports single or multi-file uploads. Files are processed through an isolated OCR pipeline.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.06]">
              <FileText className="w-3 h-3" />
              PDF Documents Only (Max 10MB)
            </div>
          </div>
        </div>

        {/* 3. File Queue and Controls */}
        {items.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0d1322] overflow-hidden glow-card">
            {/* Header / Action bar */}
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                  {items.length}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Active Screening Batch
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {completedCount} evaluated · {pendingCount} queued for analysis
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={clearAll}
                  disabled={isGlobalProcessing}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                >
                  Clear Queue
                </button>

                <button
                  onClick={startProcessing}
                  disabled={isGlobalProcessing || pendingCount === 0}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isGlobalProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Screening Candidates...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start AI Screening ({pendingCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Queue Item Rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {items.map((item) => {
                const tier = item.score !== undefined ? getScoreTier(item.score) : null;

                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left: File metadata & state */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          item.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            : item.status === 'error'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : item.status === 'processing' || item.status === 'uploading'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-zinc-500 border-slate-200 dark:border-white/[0.06]'
                        }`}
                      >
                        {item.status === 'success' && <FileCheck className="w-5 h-5" />}
                        {item.status === 'error' && <AlertCircle className="w-5 h-5" />}
                        {(item.status === 'processing' || item.status === 'uploading') && (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        )}
                        {item.status === 'idle' && <FileText className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {item.file.name}
                          </p>
                          {item.candidateName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate max-w-[150px]">
                              {item.candidateName}
                            </span>
                          )}
                        </div>

                        {/* Status message or progress bar */}
                        <div className="flex items-center gap-2 text-xs">
                          {item.status === 'idle' && (
                            <span className="text-slate-400 dark:text-zinc-500 text-[11px] font-mono">
                              Ready ({(item.file.size / 1024).toFixed(0)} KB)
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Uploading document to analysis service...
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1.5 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                              Bedrock neural evaluation in progress...
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-rose-500 font-medium flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {item.errorMessage || 'Screening error'}
                            </span>
                          )}
                          {item.status === 'success' && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Evaluation complete
                            </span>
                          )}
                        </div>

                        {(item.status === 'uploading' || item.status === 'processing') && (
                          <div className="w-full max-w-xs h-1 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Score Ring and Action */}
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {item.status === 'success' && item.score !== undefined && (
                        <div className="flex items-center gap-3">
                          <ScoreRing score={item.score} size="sm" />
                          {tier && (
                            <span
                              className={`hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tier.colorClass}`}
                            >
                              {tier.label}
                            </span>
                          )}
                        </div>
                      )}

                      {item.status === 'success' && item.fullResult ? (
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-sm"
                        >
                          <span>Inspect Report</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={item.status === 'uploading' || item.status === 'processing'}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Shared Reusable Candidate Modal */}
      {selectedItem?.fullResult && (
        <CandidateModal
          candidate={selectedItem.fullResult}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </main>
  );
}
