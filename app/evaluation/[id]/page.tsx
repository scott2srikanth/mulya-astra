'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, ArrowLeft, ExternalLink, RefreshCw, FileText, Clock, Cpu, Code as Code2, Eye, Brain, Shield, Users, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle } from 'lucide-react';
import type { AnalysisFinding, CategoryScore, Evaluation, EvaluationAgent, EvaluationLog } from '@/types/database';
import ScoreGauge from '@/components/ScoreGauge';
import StatusBadge from '@/components/StatusBadge';
import GradeTag from '@/components/GradeTag';
import HiringBadge from '@/components/HiringBadge';
import TerminalLog from '@/components/TerminalLog';
import AgentCard from '@/components/AgentCard';
import ManualAiReview from '@/components/ManualAiReview';

const PIPELINE_STEPS = [
  { key: 'clone', label: 'Clone Repository', icon: GitBranch },
  { key: 'analyze', label: 'Analyze Structure', icon: Code2 },
  { key: 'detect', label: 'Detect Tech Stack', icon: Cpu },
  { key: 'evaluate', label: 'AI Evaluation', icon: Brain },
  { key: 'score', label: 'Generate Scores', icon: CheckCircle2 },
];

function getStepStatus(currentStep: string, stepKey: string, progress: number): 'done' | 'active' | 'pending' {
  const stepOrder = ['clone', 'analyze', 'detect', 'evaluate', 'score'];
  const currentIdx = stepOrder.indexOf(currentStep);
  const stepIdx = stepOrder.indexOf(stepKey);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

const SCORE_CATEGORIES = [
  { key: 'coding_score', label: 'Implementation', max: 20 },
  { key: 'architecture_score', label: 'Architecture', max: 15 },
  { key: 'ui_ux_score', label: 'Testing', max: 15 },
  { key: 'problem_solving_score', label: 'Code Quality', max: 15 },
  { key: 'ai_engineering_score', label: 'Documentation', max: 15 },
  { key: 'performance_score', label: 'Performance', max: 10 },
  { key: 'code_quality_score', label: 'Security', max: 10 },
] as const;

export default function EvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [agents, setAgents] = useState<EvaluationAgent[]>([]);
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [findings, setFindings] = useState<AnalysisFinding[]>([]);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const response=await fetch(`/api/evaluations/${id}`, { cache:'no-store' });
    if (response.ok) { const data=await response.json(); setEvaluation(data.evaluation); setAgents(data.agents); setLogs(data.logs); setFindings(data.findings||[]); setCategoryScores(data.categoryScores||[]); }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchAll();
    const timer=setInterval(fetchAll, 1500);
    return () => clearInterval(timer);
  }, [id, fetchAll]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading evaluation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Evaluation not found</h2>
        <Link href="/" className="text-sky-400 hover:text-sky-300">Go back home</Link>
      </div>
    );
  }

  const isRunning = ['pending', 'analyzing', 'running', 'evaluating'].includes(evaluation.status);
  const isCompleted = evaluation.status === 'completed';
  const currentStepKey = evaluation.current_step || 'clone';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold mb-1">
            {evaluation.student_name || 'Unknown Student'}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={evaluation.status} />
            <span className="text-sm text-muted-foreground">{evaluation.assignment_title}</span>
            <a
              href={evaluation.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-mono"
            >
              <GitBranch size={11} />
              {evaluation.repo_name || evaluation.repo_url}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="p-2 glass-card hover:bg-white/10 transition-colors rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={15} className="text-muted-foreground" />
          </button>
          {isCompleted && (
            <Link
              href={`/evaluation/${id}/report`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-sky-500/20"
            >
              <FileText size={14} />
              View Report
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Evaluation Progress</span>
            <span className="text-sm font-bold text-sky-400">{evaluation.progress}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${evaluation.progress}%` }}
            />
          </div>

          {/* Pipeline steps */}
          <div className="flex items-center justify-between gap-2">
            {PIPELINE_STEPS.map((step, i) => {
              const status = getStepStatus(currentStepKey, step.key, evaluation.progress);
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    status === 'done' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                    status === 'active' ? 'bg-sky-500/20 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.3)]' :
                    'bg-white/5 border border-white/10'
                  }`}>
                    {status === 'done'
                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                      : status === 'active'
                        ? <step.icon size={14} className="text-sky-400 animate-pulse" />
                        : <step.icon size={14} className="text-muted-foreground/40" />
                    }
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${
                    status === 'active' ? 'text-sky-400' : status === 'done' ? 'text-emerald-400' : 'text-muted-foreground/40'
                  }`}>{step.label}</span>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`hidden sm:block absolute`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Final score */}
          <div className="glass-card p-6 text-center">
            <ScoreGauge score={evaluation.final_score ?? null} size="lg" label="Total Score" />
            <div className="mt-4 space-y-2">
              {evaluation.grade && <div className="flex justify-center"><GradeTag grade={evaluation.grade} size="md" /></div>}
              {evaluation.hiring_recommendation && (
                <div className="flex justify-center">
                  <HiringBadge recommendation={evaluation.hiring_recommendation} size="md" />
                </div>
              )}
              {evaluation.seniority_level && (
                <p className="text-sm text-muted-foreground">{evaluation.seniority_level} Level</p>
              )}
            </div>
          </div>

          {/* Score breakdown */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              {SCORE_CATEGORIES.map((cat) => {
                const category=cat.label==='Code Quality'?'quality':cat.label.toLowerCase() as CategoryScore['category'];
                const stored=categoryScores.find(item=>item.category===category);
                const noSource=evaluation.repo_stats?.analyzed_file_count===0;
                const score=noSource?(category==='documentation'?Math.min(5,stored?.score||5):0):(stored?.score??evaluation[cat.key as keyof Evaluation] as number|null);
                const max=stored?.max_score??cat.max;
                const pct = score !== null ? (score / max) * 100 : 0;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{cat.label}</span>
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {score !== null ? `${score}/${max}` : `—/${max}`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tech stack */}
          {(evaluation.languages_detected?.length > 0 || evaluation.frameworks_detected?.length > 0) && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tech Stack</h3>
              {evaluation.languages_detected?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.languages_detected.map((lang) => (
                      <span key={lang} className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-md text-xs text-sky-400 font-mono">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {evaluation.frameworks_detected?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Frameworks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.frameworks_detected.map((fw) => (
                      <span key={fw} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400 font-mono">
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {evaluation.ai_tools_detected?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">AI Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.ai_tools_detected.map((tool) => (
                      <span key={tool} className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-xs text-cyan-400 font-mono">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Terminal logs */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock size={14} className="text-sky-400" />
              Evaluation Logs
            </h3>
            <TerminalLog logs={logs} isRunning={isRunning} />
          </div>

          {/* AI Agent results */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Brain size={14} className="text-sky-400" />
              AI Agent Analysis
            </h3>
            {agents.length === 0 ? (
              <div className="glass-card p-8 text-center text-muted-foreground text-sm">
                {isRunning ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                    <p>AI agents will appear here as they complete their analysis...</p>
                  </div>
                ) : 'No agent results yet'}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </div>

          {evaluation.assignment_results && (
            <div className="glass-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h3 className="text-sm font-semibold">Instructor Assignment Compliance</h3><p className="text-xs text-muted-foreground mt-1">Deterministic repository evidence; semantic checks continue in Manual ChatGPT Review.</p></div><div className="flex gap-2"><span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-bold">Compliance {evaluation.assignment_results.compliance_score}%</span><span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold">Engineering {evaluation.assignment_results.engineering_score}%</span></div></div>
              <div className="space-y-2">{evaluation.assignment_results.checks.map(check=><div key={check.id} className="flex gap-3 rounded-lg border border-border p-3"><span className={`text-xs font-bold uppercase ${check.status==='passed'?'text-emerald-400':check.status==='failed'?'text-rose-400':'text-amber-400'}`}>{check.status.replace('_',' ')}</span><div><p className="text-sm">{check.requirement}</p><p className="text-xs text-muted-foreground mt-1">{check.explanation}</p>{check.evidence.length>0&&<p className="text-xs font-mono text-sky-400 mt-1">{check.evidence.join(' · ')}</p>}</div></div>)}</div>
            </div>
          )}

          {/* Summary */}
          {isCompleted && <ManualAiReview evaluationId={id} />}

          {/* Summary */}
          {findings.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Evidence-backed Findings</h3>
              <div className="space-y-3">
                {findings.map(f => <div key={f.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">{f.title}</p><span className={`text-[10px] uppercase font-bold ${['critical','high'].includes(f.severity)?'text-rose-400':f.severity==='medium'?'text-amber-400':'text-sky-400'}`}>{f.severity}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{f.explanation}</p>
                  {f.file_path && <p className="text-xs text-sky-400 font-mono mt-2">{f.file_path}{f.start_line?`:${f.start_line}`:''}</p>}
                  <p className="text-xs text-muted-foreground font-mono mt-2 bg-black/10 rounded p-2">{f.evidence}</p>
                  {f.recommendation && <p className="text-xs text-emerald-400 mt-2">Recommendation: {f.recommendation}</p>}
                </div>)}
              </div>
            </div>
          )}

          {/* Summary */}
          {evaluation.summary && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText size={14} className="text-sky-400" />
                Evaluation Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{evaluation.summary}</p>
            </div>
          )}

          {/* Improvement roadmap */}
          {evaluation.improvement_roadmap && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Improvement Roadmap
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {evaluation.improvement_roadmap}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
