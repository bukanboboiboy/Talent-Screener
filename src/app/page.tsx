'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  BarChart3,
  Sun,
  Moon,
  Cpu,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    configureAmplify();

    const checkAuth = async () => {
      try {
        await getCurrentUser();
        router.push('/dashboard');
      } catch {
        // User not logged in, stay on landing page
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-zinc-100 selection:bg-blue-500/20 selection:text-blue-500 transition-colors">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-zinc-50">
                  Talent Screener
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  AI Core v2.0
                </span>
              </div>
            </div>

            {/* Nav actions */}
            <div className="flex items-center gap-3">
              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              <Link href="/login">
                <button className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Sign In
                </button>
              </Link>

              <Link href="/register">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/15 to-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Cpu className="w-3.5 h-3.5" />
            <span>Automated Candidate Screening with AWS Bedrock</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 leading-[1.08]">
            Screen Hundreds of CVs.{' '}
            <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Zero Guesswork.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate recruiter fatigue. Extract structured candidate signals, quantify alignment on a 0–100 scale, and identify top talent in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/45 hover:-translate-y-0.5">
                <span>Start Screening Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-[#0d1322] hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] transition-all hover:-translate-y-0.5">
                Sign In to Workspace
              </button>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">100%</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Automated Extraction</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">&lt; 10s</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Analysis Turnaround</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 font-mono">0–100</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Fit Scoring Index</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/70 dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] glow-card hover-lift">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50">∞</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Batch PDF Capacity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-[#0b0f1a]/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
              Enterprise Recruitment Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Built on scalable AWS serverless architecture with strict data protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] space-y-4 glow-card hover-lift">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Textract OCR & Extraction
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Extracts key credentials, past employment histories, and educational backgrounds directly from raw PDF documents.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] space-y-4 glow-card hover-lift">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Bedrock Semantic Scoring
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Scores alignment against the custom job description using deep reasoning models to detect real skill fit beyond mere keyword matching.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] space-y-4 glow-card hover-lift">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Cognito Auth & Security
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Enterprise identity management with AWS Cognito User Pools, JWT token-based verification, and strict session isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Workflow */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">
              Streamlined Flow
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
              How Talent Screener Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] space-y-3 glow-card hover-lift">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                01
              </span>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">Paste Requirements</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Define the requirements, must-have technologies, and minimum seniority for your open position.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] space-y-3 glow-card hover-lift">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                02
              </span>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">Batch Upload CVs</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Drag and drop PDF resumes into the interactive dropzone. Files are pushed directly to API Gateway.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/[0.08] space-y-3 glow-card hover-lift">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                03
              </span>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm sm:text-base">Make Informed Decisions</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Inspect 0-100 fit scores, recommendation tags, and transparent AI reasoning breakdown for each applicant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#090d16] text-center text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Talent Screener · Skripsi Bukan Boboiboy. All rights reserved.</p>
          <p className="font-mono text-[11px]">Powered by Next.js 16 + AWS Cloud</p>
        </div>
      </footer>
    </div>
  );
}
