'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvaluationLog, LogType } from '@/types/database';

const LOG_STYLES: Record<LogType, { text: string; prefix: string }> = {
  info: { text: 'text-slate-300', prefix: '•' },
  success: { text: 'text-emerald-300', prefix: '✓' },
  warning: { text: 'text-amber-300', prefix: '!' },
  error: { text: 'text-rose-300', prefix: '×' },
  system: { text: 'text-sky-300', prefix: '›' },
};

interface TerminalLogProps {
  logs: EvaluationLog[];
  isRunning?: boolean;
}

export default function TerminalLog({ logs, isRunning }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  async function copyLogs() {
    const value = logs.map(log => `${new Date(log.created_at).toLocaleTimeString('en', { hour12: false })} ${LOG_STYLES[log.log_type]?.prefix || '•'} ${log.message}`).join('\n');
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const currentStep = [...logs].reverse().find(log => log.step)?.step;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[#07101f] shadow-xl shadow-slate-950/15 ring-1 ring-white/5">
      <div className="flex min-h-12 items-center gap-3 border-b border-slate-700/70 bg-[#0d1728] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 border-l border-slate-700 pl-3">
          <Terminal size={14} className="shrink-0 text-sky-400" />
          <span className="truncate font-mono text-xs font-medium text-slate-300">evaluation-terminal</span>
          {currentStep && <span className="hidden rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:inline">{currentStep}</span>}
        </div>
        <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">{logs.length} {logs.length === 1 ? 'event' : 'events'}</span>
        {isRunning && (
          <div className="flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
            running
          </div>
        )}
        {logs.length > 0 && <button type="button" onClick={copyLogs} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200" aria-label="Copy evaluation logs" title="Copy logs">{copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}</button>}
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="max-h-80 min-h-40 space-y-0.5 overflow-y-auto bg-[#07101f] px-4 py-4 font-mono text-xs scrollbar-thin sm:px-5"
      >
        {logs.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center text-slate-500">
            <span className="mr-2 text-sky-400">›</span> Waiting for evaluation to start<span className="terminal-cursor">_</span>
          </div>
        ) : (
          logs.map((log) => {
            const style = LOG_STYLES[log.log_type] || LOG_STYLES.info;
            return (
              <div key={log.id} className={cn('group grid grid-cols-[4.75rem_1rem_minmax(0,1fr)] gap-2 rounded-md px-2 py-1.5 leading-5 transition-colors hover:bg-white/[0.035]', log.log_type === 'error' && 'bg-rose-400/[0.04]')}>
                <span className="shrink-0 select-none tabular-nums text-slate-600">
                  {new Date(log.created_at).toLocaleTimeString('en', { hour12: false })}
                </span>
                <span className={cn('shrink-0 text-center font-bold', style.text)}>{style.prefix}</span>
                <span className={cn('min-w-0 whitespace-pre-wrap break-words', style.text)}>{log.message}</span>
              </div>
            );
          })
        )}
        {isRunning && (
          <div className="grid grid-cols-[4.75rem_1rem_minmax(0,1fr)] gap-2 px-2 py-1.5 text-sky-300">
            <span className="text-slate-600">···</span>
            <span className="text-center">›</span>
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
