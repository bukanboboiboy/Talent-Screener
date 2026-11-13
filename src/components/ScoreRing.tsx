'use client';

import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ScoreRing({ score, size = 'sm', showLabel = false }: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score || 0)));

  // Dimensions configuration
  const config = {
    sm: {
      dimension: 38,
      strokeWidth: 3.5,
      radius: 15,
      fontSize: 'text-[11px]',
      labelSize: 'text-[7px]',
    },
    md: {
      dimension: 56,
      strokeWidth: 5,
      radius: 22,
      fontSize: 'text-sm font-bold',
      labelSize: 'text-[8px]',
    },
    lg: {
      dimension: 110,
      strokeWidth: 9,
      radius: 46,
      fontSize: 'text-3xl font-extrabold',
      labelSize: 'text-[10px]',
    },
  }[size];

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const color =
    clampedScore >= 80
      ? { stroke: '#10b981', text: 'text-emerald-500 dark:text-emerald-400', glow: 'shadow-emerald-500/20' }
      : clampedScore >= 60
      ? { stroke: '#f59e0b', text: 'text-amber-500 dark:text-amber-400', glow: 'shadow-amber-500/20' }
      : { stroke: '#f43f5e', text: 'text-rose-500 dark:text-rose-400', glow: 'shadow-rose-500/20' };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 font-mono ${color.text}`}
      style={{ width: config.dimension, height: config.dimension }}
      title={`AI Match Score: ${clampedScore}/100`}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
      >
        {/* Track */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={config.radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-slate-200 dark:text-zinc-800/80"
        />
        {/* Progress */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={config.radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={`${config.fontSize} font-bold`}>{clampedScore}</span>
        {showLabel && size === 'lg' && (
          <span className={`${config.labelSize} uppercase tracking-wider text-slate-400 dark:text-zinc-500 mt-0.5`}>
            out of 100
          </span>
        )}
      </div>
    </div>
  );
}
