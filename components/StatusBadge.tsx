import { cn } from '@/lib/utils';
import type { EvaluationStatus } from '@/types/database';

const STYLES: Record<EvaluationStatus, { style: string; label: string; dot: string }> = {
  pending: { style: 'bg-slate-500/15 text-slate-400 border-slate-500/20', label: 'Pending', dot: 'bg-slate-400' },
  analyzing: { style: 'bg-sky-500/15 text-sky-400 border-sky-500/20', label: 'Analyzing', dot: 'bg-sky-400 animate-pulse' },
  running: { style: 'bg-amber-500/15 text-amber-400 border-amber-500/20', label: 'Running', dot: 'bg-amber-400 animate-pulse' },
  evaluating: { style: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20', label: 'Evaluating', dot: 'bg-cyan-400 animate-pulse' },
  completed: { style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Completed', dot: 'bg-emerald-400' },
  failed: { style: 'bg-rose-500/15 text-rose-400 border-rose-500/20', label: 'Failed', dot: 'bg-rose-400' },
};

interface StatusBadgeProps {
  status: EvaluationStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { style, label, dot } = STYLES[status] || STYLES.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium', style)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
