'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors text-xs font-semibold"
      aria-label="Toggle visual theme"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 text-slate-500" />
          <span className="flex-1 text-left">Switch to Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="flex-1 text-left">Switch to Light</span>
        </>
      )}
    </button>
  );
}
