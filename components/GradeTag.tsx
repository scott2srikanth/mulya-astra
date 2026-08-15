import { cn } from '@/lib/utils';

interface GradeTagProps {
  grade: string;
  size?: 'sm' | 'md';
}

const GRADE_STYLES: Record<string, string> = {
  Exceptional: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Excellent: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  Good: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Average: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Needs Improvement': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export default function GradeTag({ grade, size = 'sm' }: GradeTagProps) {
  const style = GRADE_STYLES[grade] || 'bg-muted/50 text-muted-foreground border-border';
  return (
    <span className={cn('inline-flex items-center border rounded-md font-semibold', style,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      {grade}
    </span>
  );
}
