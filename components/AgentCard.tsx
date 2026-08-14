'use client';

import { Code as Code2, Cpu, Eye, Brain, Shield, Users, CircleCheck as CheckCircle2, Loader as Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EvaluationAgent, AgentType, AgentStatus } from '@/types/database';
import ScoreGauge from './ScoreGauge';

const AGENT_CONFIG: Record<AgentType, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
}> = {
  frontend_engineer: { icon: Code2, label: 'Frontend Engineer', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  backend_architect: { icon: Cpu, label: 'Backend Architect', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ui_ux_reviewer: { icon: Eye, label: 'UI/UX Reviewer', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ai_ml_engineer: { icon: Brain, label: 'AI/ML Engineer', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  security_reviewer: { icon: Shield, label: 'Security Reviewer', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  product_reviewer: { icon: Users, label: 'Product Reviewer', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
};

interface AgentCardProps {
  agent: EvaluationAgent;
  compact?: boolean;
}

function StatusIcon({ status }: { status: AgentStatus }) {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (status === 'analyzing') return <Loader2 size={14} className="text-sky-400 animate-spin" />;
  return <Clock size={14} className="text-muted-foreground" />;
}

export default function AgentCard({ agent, compact }: AgentCardProps) {
  const config = AGENT_CONFIG[agent.agent_type];
  if (!config) return null;
  const { icon: Icon, label, color, bg, border } = config;

  if (compact) {
    return (
      <div className={cn('p-4 rounded-xl border flex items-center gap-4', bg, border)}>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bg, border, 'border')}>
          <Icon className={color} size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <StatusIcon status={agent.status} />
          </div>
          {agent.status === 'analyzing' && (
            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full animate-pulse w-2/3" />
            </div>
          )}
        </div>
        {agent.score !== null && (
          <ScoreGauge score={agent.score} size="sm" />
        )}
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-5 border', border)}>
      <div className="flex items-start gap-4 mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg, border, 'border')}>
          <Icon className={color} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground">{label}</h3>
            <StatusIcon status={agent.status} />
          </div>
          {agent.score !== null && (
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{agent.score}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
          )}
          {agent.score === null && agent.status === 'completed' && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Not applicable</p>
          )}
        </div>
      </div>

      {agent.findings && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">{agent.findings}</p>
      )}

      {agent.strengths && agent.strengths.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Strengths</p>
          <ul className="space-y-1">
            {agent.strengths.slice(0, 3).map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-emerald-400 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {agent.weaknesses && agent.weaknesses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-rose-400 mb-2 uppercase tracking-wider">Weaknesses</p>
          <ul className="space-y-1">
            {agent.weaknesses.slice(0, 3).map((w, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-rose-400 shrink-0">−</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {agent.suggestions && agent.suggestions.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-400">Recommended actions</p>
          <ul className="space-y-1">
            {agent.suggestions.slice(0, 3).map((suggestion, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="shrink-0 text-sky-400">→</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
