'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Brain, Zap, GitBranch, ChartBar as BarChart3, TrendingUp, Clock, CircleCheck as CheckCircle2, ArrowRight, Star, Users, Code as Code2, Shield, Cpu, Eye } from 'lucide-react';
import type { Evaluation } from '@/types/database';
import ScoreGauge from '@/components/ScoreGauge';
import GradeTag from '@/components/GradeTag';
import HiringBadge from '@/components/HiringBadge';
import StatusBadge from '@/components/StatusBadge';

const AGENT_CARDS = [
  { icon: Code2, label: 'Frontend Engineer', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { icon: Cpu, label: 'Backend Architect', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { icon: Eye, label: 'UI/UX Reviewer', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { icon: Brain, label: 'AI/ML Engineer', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { icon: Shield, label: 'Security Reviewer', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { icon: Users, label: 'Product Reviewer', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
];

const FEATURES = [
  { icon: GitBranch, title: 'Auto Repo Analysis', desc: 'Clones and deep-analyzes any public GitHub repository in seconds.' },
  { icon: Brain, title: 'Multi-Agent AI Review', desc: '6 specialized AI agents evaluate different aspects independently.' },
  { icon: BarChart3, title: 'Detailed Scoring', desc: '100-point weighted scoring across 8 engineering dimensions.' },
  { icon: Zap, title: 'Instant Reports', desc: 'Professional PDF/Markdown reports generated automatically.' },
];

export default function DashboardPage() {
  const [recentEvaluations, setRecentEvaluations] = useState<Evaluation[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0, hireRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch('/api/evaluations', { cache: 'no-store' });
      const data: Evaluation[] = response.ok ? (await response.json()).slice(0, 5) : [];

      if (data) {
        setRecentEvaluations(data as Evaluation[]);
        const completed = data.filter(e => e.status === 'completed');
        const scores = completed.map(e => e.final_score).filter(Boolean) as number[];
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const hires = completed.filter(e => e.hiring_recommendation === 'Strong Hire' || e.hiring_recommendation === 'Hire');
        setStats({
          total: data.length,
          completed: completed.length,
          avgScore,
          hireRate: completed.length ? Math.round((hires.length / completed.length) * 100) : 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs font-semibold mb-6 tracking-wider uppercase">
          <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
          AI-Powered Code Evaluation Platform
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
          Evaluate GitHub Projects
          <br />
          <span className="text-gradient">with AI Precision</span>
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Submit any GitHub repository and receive a comprehensive 100-point AI evaluation across code quality,
          architecture, UI/UX, performance, and more — in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/evaluate"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold rounded-xl hover:from-sky-400 hover:to-cyan-400 transition-all duration-200 shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 text-base"
          >
            <Zap size={18} />
            Start Evaluation
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-2.5 px-8 py-4 glass-card text-foreground font-semibold rounded-xl hover:bg-white/10 transition-all duration-200 text-base"
          >
            <BarChart3 size={18} />
            View Results
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {[
          { label: 'Total Evaluations', value: stats.total, icon: GitBranch, color: 'text-sky-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Avg Score', value: stats.avgScore ? `${stats.avgScore}/100` : '—', icon: TrendingUp, color: 'text-amber-400' },
          { label: 'Hire Rate', value: stats.hireRate ? `${stats.hireRate}%` : '—', icon: Star, color: 'text-cyan-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-6">
            <div className={`flex items-center gap-2 mb-3 ${stat.color}`}>
              <stat.icon size={16} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{loading ? '—' : stat.value}</div>
          </div>
        ))}
      </div>

      {/* AI Agents */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="text-sky-400" size={22} />
          <h2 className="text-2xl font-bold">Multi-Agent Evaluation System</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AGENT_CARDS.map((agent) => (
            <div
              key={agent.label}
              className={`p-4 rounded-xl border ${agent.bg} ${agent.border} flex flex-col items-center gap-3 text-center group hover:scale-105 transition-transform cursor-default`}
            >
              <div className={`w-10 h-10 rounded-lg ${agent.bg} ${agent.border} border flex items-center justify-center`}>
                <agent.icon className={agent.color} size={18} />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">{agent.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Clock className="text-sky-400" size={22} />
            <h2 className="text-2xl font-bold">Recent Evaluations</h2>
          </div>
          <Link href="/history" className="text-sm text-sky-400 hover:text-sky-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentEvaluations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg font-medium">No evaluations yet</p>
            <p className="text-muted-foreground text-sm mt-1 mb-6">Start by submitting a GitHub repository</p>
            <Link
              href="/evaluate"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500/15 text-sky-400 border border-sky-500/20 rounded-lg text-sm font-medium hover:bg-sky-500/25 transition-colors"
            >
              <Zap size={14} />
              Evaluate Now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvaluations.map((evaluation) => (
              <Link
                key={evaluation.id}
                href={`/evaluation/${evaluation.id}`}
                className="glass-card p-5 flex items-center gap-5 hover:bg-white/8 transition-colors group block"
              >
                <div className="flex-shrink-0">
                  <ScoreGauge score={evaluation.final_score ?? null} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-foreground truncate">{evaluation.student_name || 'Unknown Student'}</span>
                    <StatusBadge status={evaluation.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch size={12} />
                    <span className="truncate">{evaluation.repo_name || evaluation.repo_url}</span>
                  </div>
                  {evaluation.assignment_title && (
                    <div className="text-xs text-muted-foreground mt-0.5">{evaluation.assignment_title}</div>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  {evaluation.grade && <GradeTag grade={evaluation.grade} />}
                  {evaluation.hiring_recommendation && (
                    <HiringBadge recommendation={evaluation.hiring_recommendation} />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(evaluation.created_at).toLocaleDateString()}
                  </span>
                </div>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-sky-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Zap className="text-sky-400" size={22} />
          <h2 className="text-2xl font-bold">Platform Capabilities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-card p-6 group hover:border-sky-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors">
                <feature.icon className="text-sky-400" size={18} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
