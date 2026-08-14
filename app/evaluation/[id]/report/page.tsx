'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, GitBranch, User, Hash, BookOpen, Brain, CircleCheck as CheckCircle2, Star, TrendingUp, TriangleAlert as AlertTriangle, Code as Code2, Cpu, Eye, Shield, Users, FileText, Printer } from 'lucide-react';
import type { Evaluation, EvaluationAgent } from '@/types/database';
import ScoreGauge from '@/components/ScoreGauge';
import GradeTag from '@/components/GradeTag';
import HiringBadge from '@/components/HiringBadge';
import AgentCard from '@/components/AgentCard';

const SCORE_CATEGORIES = [
  { key: 'coding_score', label: 'Coding Skills', max: 25, icon: Code2, color: 'text-sky-400' },
  { key: 'architecture_score', label: 'Architecture', max: 15, icon: Cpu, color: 'text-emerald-400' },
  { key: 'ui_ux_score', label: 'UI/UX Design', max: 15, icon: Eye, color: 'text-amber-400' },
  { key: 'problem_solving_score', label: 'Problem Solving', max: 15, icon: Brain, color: 'text-cyan-400' },
  { key: 'ai_engineering_score', label: 'AI Engineering', max: 10, icon: Brain, color: 'text-teal-400' },
  { key: 'performance_score', label: 'Performance', max: 10, icon: TrendingUp, color: 'text-violet-400' },
  { key: 'code_quality_score', label: 'Code Quality', max: 5, icon: Star, color: 'text-rose-400' },
  { key: 'documentation_score', label: 'Documentation', max: 5, icon: FileText, color: 'text-slate-400' },
] as const;

function getHiringColor(rec: string | null) {
  if (!rec) return 'text-muted-foreground';
  const map: Record<string, string> = {
    'Strong Hire': 'text-emerald-400',
    'Hire': 'text-sky-400',
    'Potential': 'text-cyan-400',
    'Needs Mentorship': 'text-amber-400',
    'Not Ready': 'text-rose-400',
  };
  return map[rec] || 'text-muted-foreground';
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [agents, setAgents] = useState<EvaluationAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response=await fetch(`/api/evaluations/${id}`, { cache:'no-store' });
      if (response.ok) { const data=await response.json(); setEvaluation(data.evaluation); setAgents(data.agents); }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  function downloadJSON() {
    if (!evaluation) return;
    const data = { evaluation, agents };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evalai-report-${evaluation.student_name?.replace(/\s+/g, '-').toLowerCase()}-${id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadMarkdown() {
    if (!evaluation) return;
    const md = generateMarkdown(evaluation, agents);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evalai-report-${evaluation.student_name?.replace(/\s+/g, '-').toLowerCase()}-${id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-muted-foreground">Report not found</p>
        <Link href="/" className="text-sky-400 hover:text-sky-300 text-sm mt-2 inline-block">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Actions */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4 print:hidden">
        <Link href={`/evaluation/${id}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Evaluation
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 glass-card text-sm hover:bg-white/10 transition-colors rounded-lg">
            <Printer size={14} /> Print
          </button>
          <button onClick={downloadMarkdown} className="flex items-center gap-2 px-3 py-2 glass-card text-sm hover:bg-white/10 transition-colors rounded-lg">
            <Download size={14} /> Markdown
          </button>
          <button onClick={downloadJSON} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-500/20">
            <Download size={14} /> JSON Report
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="space-y-6">
        {/* Header card */}
        <div className="glass-card p-8 gradient-border">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
                  <Brain size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">EvalAI Report</p>
                  <p className="text-xs text-muted-foreground font-mono">{new Date(evaluation.created_at).toLocaleDateString('en', { dateStyle: 'full' })}</p>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-1">{evaluation.student_name || 'Unknown Student'}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mb-4">
                <span className="flex items-center gap-1"><Hash size={12} />{evaluation.student_id}</span>
                <span className="flex items-center gap-1"><BookOpen size={12} />{evaluation.assignment_title}</span>
                <a href={evaluation.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-mono text-xs">
                  <GitBranch size={12} />{evaluation.repo_name || evaluation.repo_url}
                </a>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {evaluation.grade && <GradeTag grade={evaluation.grade} size="md" />}
                {evaluation.hiring_recommendation && <HiringBadge recommendation={evaluation.hiring_recommendation} size="md" />}
                {evaluation.seniority_level && (
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-sm font-medium text-muted-foreground">
                    {evaluation.seniority_level}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center">
              <ScoreGauge score={evaluation.final_score ?? null} size="lg" label="Final Score" />
              {evaluation.confidence_level && (
                <p className="text-xs text-muted-foreground mt-2">{evaluation.confidence_level} confidence</p>
              )}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <TrendingUp size={18} className="text-sky-400" />
            Score Breakdown
          </h2>
          <div className="grid gap-4">
            {SCORE_CATEGORIES.map((cat) => {
              const score = evaluation[cat.key as keyof Evaluation] as number | null;
              const pct = score !== null ? (score / cat.max) * 100 : 0;
              return (
                <div key={cat.key} className="flex items-center gap-4">
                  <div className="w-36 shrink-0">
                    <div className="flex items-center gap-2">
                      <cat.icon size={13} className={cat.color} />
                      <span className="text-sm text-muted-foreground">{cat.label}</span>
                    </div>
                  </div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {score !== null ? score : '—'}<span className="text-muted-foreground font-normal">/{cat.max}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        {(evaluation.languages_detected?.length > 0 || evaluation.frameworks_detected?.length > 0 || evaluation.ai_tools_detected?.length > 0) && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Code2 size={18} className="text-sky-400" />
              Detected Tech Stack
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {evaluation.languages_detected?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.languages_detected.map((l) => (
                      <span key={l} className="px-2 py-1 bg-sky-500/10 border border-sky-500/20 rounded-md text-xs text-sky-400 font-mono">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {evaluation.frameworks_detected?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Frameworks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.frameworks_detected.map((f) => (
                      <span key={f} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400 font-mono">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {evaluation.ai_tools_detected?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.ai_tools_detected.map((t) => (
                      <span key={t} className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-xs text-cyan-400 font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evaluation Summary */}
        {evaluation.summary && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <FileText size={18} className="text-sky-400" />
              Evaluation Summary
            </h2>
            <p className="text-muted-foreground leading-relaxed">{evaluation.summary}</p>
          </div>
        )}

        {/* Agent results */}
        {agents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Brain size={18} className="text-sky-400" />
              AI Agent Findings
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {agents.filter(a => a.status === 'completed').map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {/* Improvement roadmap */}
        {evaluation.improvement_roadmap && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Improvement Roadmap
            </h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
              {evaluation.improvement_roadmap}
            </div>
          </div>
        )}

        {/* Hiring decision */}
        {evaluation.hiring_recommendation && (
          <div className="glass-card p-6 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Hiring Recommendation</p>
            <p className={`text-4xl font-extrabold mb-2 ${getHiringColor(evaluation.hiring_recommendation)}`}>
              {evaluation.hiring_recommendation}
            </p>
            {evaluation.confidence_level && (
              <p className="text-sm text-muted-foreground">{evaluation.confidence_level} confidence level</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          Generated by EvalAI — AI-Powered GitHub Project Evaluator &bull; {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function generateMarkdown(ev: Evaluation, agents: EvaluationAgent[]): string {
  const lines = [
    `# EvalAI Evaluation Report`,
    ``,
    `**Student:** ${ev.student_name || 'Unknown'}`,
    `**Student ID:** ${ev.student_id || 'N/A'}`,
    `**Assignment:** ${ev.assignment_title || 'N/A'}`,
    `**Repository:** ${ev.repo_url}`,
    `**Date:** ${new Date(ev.created_at).toLocaleDateString()}`,
    ``,
    `---`,
    ``,
    `## Final Score: ${ev.final_score ?? 'N/A'}/100`,
    ``,
    `**Grade:** ${ev.grade || 'N/A'}`,
    `**Hiring Recommendation:** ${ev.hiring_recommendation || 'N/A'}`,
    `**Seniority Level:** ${ev.seniority_level || 'N/A'}`,
    ``,
    `## Score Breakdown`,
    ``,
    `| Category | Score | Max |`,
    `|---|---|---|`,
    `| Coding Skills | ${ev.coding_score ?? '—'} | 25 |`,
    `| Architecture | ${ev.architecture_score ?? '—'} | 15 |`,
    `| UI/UX | ${ev.ui_ux_score ?? '—'} | 15 |`,
    `| Problem Solving | ${ev.problem_solving_score ?? '—'} | 15 |`,
    `| AI Engineering | ${ev.ai_engineering_score ?? '—'} | 10 |`,
    `| Performance | ${ev.performance_score ?? '—'} | 10 |`,
    `| Code Quality | ${ev.code_quality_score ?? '—'} | 5 |`,
    `| Documentation | ${ev.documentation_score ?? '—'} | 5 |`,
    ``,
  ];

  if (ev.summary) {
    lines.push(`## Summary`, ``, ev.summary, ``);
  }

  if (agents.length > 0) {
    lines.push(`## AI Agent Findings`, ``);
    for (const agent of agents.filter(a => a.status === 'completed')) {
      lines.push(`### ${agent.agent_name || agent.agent_type}`, `**Score:** ${agent.score ?? 'N/A'}/100`, ``);
      if (agent.findings) lines.push(agent.findings, ``);
      if (agent.strengths?.length) {
        lines.push(`**Strengths:**`);
        agent.strengths.forEach(s => lines.push(`- ${s}`));
        lines.push(``);
      }
      if (agent.weaknesses?.length) {
        lines.push(`**Weaknesses:**`);
        agent.weaknesses.forEach(w => lines.push(`- ${w}`));
        lines.push(``);
      }
    }
  }

  if (ev.improvement_roadmap) {
    lines.push(`## Improvement Roadmap`, ``, ev.improvement_roadmap, ``);
  }

  lines.push(`---`, `*Generated by EvalAI*`);
  return lines.join('\n');
}
