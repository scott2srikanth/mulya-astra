import { cn } from '@/lib/utils';

interface HiringBadgeProps {
  recommendation: string;
  size?: 'sm' | 'md';
}

const STYLES: Record<string, string> = {
  'Strong Hire': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Hire': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'Potential': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Needs Mentorship': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Not Ready': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export default function HiringBadge({ recommendation, size = 'sm' }: HiringBadgeProps) {
  const style = STYLES[recommendation] || 'bg-muted/50 text-muted-foreground border-border';
  return (
    <span className={cn('inline-flex items-center border rounded-md font-medium', style,
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-sm'
    )}>
      {recommendation}
    </span>
  );
}
