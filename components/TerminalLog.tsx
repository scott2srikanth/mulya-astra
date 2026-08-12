'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvaluationLog, LogType } from '@/types/database';

const LOG_STYLES: Record<LogType, { text: string; prefix: string }> = {
  info: { text: 'text-slate-300', prefix: '●' },
  success: { text: 'text-emerald-400', prefix: '✓' },
  warning: { text: 'text-amber-400', prefix: '⚠' },
  error: { text: 'text-rose-400', prefix: '✗' },
  system: { text: 'text-sky-400', prefix: '▸' },
};

interface TerminalLogProps {
  logs: EvaluationLog[];
  isRunning?: boolean;
}

export default function TerminalLog({ logs, isRunning }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Terminal size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-mono">evaluation-terminal</span>
        </div>
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-sky-400">
            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
            running
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto scrollbar-thin bg-black/30"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground">Waiting for evaluation to start...</div>
        ) : (
          logs.map((log) => {
            const style = LOG_STYLES[log.log_type] || LOG_STYLES.info;
            return (
              <div key={log.id} className="flex gap-3 leading-relaxed">
                <span className="text-muted-foreground/50 shrink-0 select-none tabular-nums">
                  {new Date(log.created_at).toLocaleTimeString('en', { hour12: false })}
                </span>
                <span className={cn('shrink-0', style.text)}>{style.prefix}</span>
                <span className={cn('break-all', style.text)}>{log.message}</span>
              </div>
            );
          })
        )}
        {isRunning && (
          <div className="flex gap-3 text-sky-400">
            <span className="text-muted-foreground/50">...</span>
            <span>▸</span>
            <span className="flex items-center gap-1">
              Processing
              <span className="terminal-cursor">_</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
