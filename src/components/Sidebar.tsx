'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import ThemeToggle from './ThemeToggle';
import {
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    configureAmplify();
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const hideSidebar = ['/', '/login', '/register', '/forgot', '/reset-password'];

  if (hideSidebar.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/login');
    }
  };

  const menuItems = [
    {
      name: 'Screen Resumes',
      href: '/upload',
      icon: <FileUp className="w-4 h-4" />,
    },
    {
      name: 'Evaluation Board',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#090d16] border-r border-slate-200/80 dark:border-white/[0.08]">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08]">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-zinc-50 block leading-tight">
              Talent Screener
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              AWS Bedrock Engine
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Workflows
        </p>

        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-zinc-400'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </Link>
          );
        })}
      </nav>

      {/* Cognito Security Badge */}
      <div className="p-4 mx-3 mb-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cognito Protected</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
          TLS + IAM Token Auth
        </p>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-1">
        <ThemeToggle />

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white dark:bg-[#0d1322] text-slate-700 dark:text-zinc-200 rounded-xl shadow-md border border-slate-200 dark:border-white/[0.08]"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 z-30 h-full w-64 shadow-sm">
        <SidebarContent />
      </aside>
    </>
  );
}
