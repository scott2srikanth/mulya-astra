'use client';

import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

function getScoreColor(score: number | null) {
  if (score === null) return { stroke: '#334155', text: 'text-muted-foreground' };
  if (score >= 90) return { stroke: '#10b981', text: 'text-emerald-400' };
  if (score >= 80) return { stroke: '#22d3ee', text: 'text-cyan-400' };
  if (score >= 70) return { stroke: '#0ea5e9', text: 'text-sky-400' };
  if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-400' };
  return { stroke: '#ef4444', text: 'text-rose-400' };
}

const SIZES = {
  sm: { size: 52, strokeWidth: 5, fontSize: 'text-[11px]', labelSize: 'text-[8px]' },
  md: { size: 80, strokeWidth: 7, fontSize: 'text-sm', labelSize: 'text-[10px]' },
  lg: { size: 120, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-xs' },
};

export default function ScoreGauge({ score, size = 'md', label }: ScoreGaugeProps) {
  const { size: dim, strokeWidth, fontSize, labelSize } = SIZES[size];
  const radius = (dim - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score !== null ? (score / 100) * circumference : 0;
  const offset = circumference - progress;
  const { stroke, text } = getScoreColor(score);
  const cx = dim / 2;
  const cy = dim / 2;

  return (
    <div className="relative inline-flex items-center justify-center flex-col">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold tabular-nums leading-none', fontSize, text)}>
          {score !== null ? score : '—'}
        </span>
        {label && <span className={cn('text-muted-foreground font-medium mt-0.5', labelSize)}>{label}</span>}
      </div>
    </div>
  );
}
