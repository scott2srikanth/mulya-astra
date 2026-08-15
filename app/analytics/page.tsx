'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChartBar as BarChart3, TrendingUp, Users, Brain, Code as Code2, Star, Award, Target } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Evaluation } from '@/types/database';

const HIRING_COLORS: Record<string, string> = {
  'Strong Hire': '#10b981',
  'Hire': '#0ea5e9',
  'Potential': '#06b6d4',
  'Needs Mentorship': '#f59e0b',
  'Not Ready': '#ef4444',
};

const GRADE_COLORS: Record<string, string> = {
  Exceptional: '#10b981',
  Excellent: '#22d3ee',
  Good: '#0ea5e9',
  Average: '#f59e0b',
  'Needs Improvement': '#ef4444',
};

function computeStats(evaluations: Evaluation[]) {
  const completed = evaluations.filter(e => e.status === 'completed');
  const scores = completed.map(e => e.final_score).filter(Boolean) as number[];
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const hiringCount: Record<string, number> = {};
  const gradeCount: Record<string, number> = {};
  const seniorityCount: Record<string, number> = {};

  completed.forEach(e => {
    if (e.hiring_recommendation) hiringCount[e.hiring_recommendation] = (hiringCount[e.hiring_recommendation] || 0) + 1;
    if (e.grade) gradeCount[e.grade] = (gradeCount[e.grade] || 0) + 1;
    if (e.seniority_level) seniorityCount[e.seniority_level] = (seniorityCount[e.seniority_level] || 0) + 1;
  });

  const radarData = [
    { subject: 'Coding', avg: avgOf(completed, 'coding_score', 25) },
    { subject: 'Architecture', avg: avgOf(completed, 'architecture_score', 15) },
    { subject: 'UI/UX', avg: avgOf(completed, 'ui_ux_score', 15) },
    { subject: 'Problem Solving', avg: avgOf(completed, 'problem_solving_score', 15) },
    { subject: 'AI Eng.', avg: avgOf(completed, 'ai_engineering_score', 10) },
    { subject: 'Performance', avg: avgOf(completed, 'performance_score', 10) },
  ];

  // Score distribution buckets
  const dist = [
    { range: '90-100', count: scores.filter(s => s >= 90).length, fill: '#10b981' },
    { range: '80-89', count: scores.filter(s => s >= 80 && s < 90).length, fill: '#22d3ee' },
    { range: '70-79', count: scores.filter(s => s >= 70 && s < 80).length, fill: '#0ea5e9' },
    { range: '60-69', count: scores.filter(s => s >= 60 && s < 70).length, fill: '#f59e0b' },
    { range: '<60', count: scores.filter(s => s < 60).length, fill: '#ef4444' },
  ];

  return { completed, avgScore, hiringCount, gradeCount, seniorityCount, radarData, dist };
}

function avgOf(items: Evaluation[], key: keyof Evaluation, max: number): number {
  const vals = items.map(e => e[key] as number | null).filter(v => v !== null) as number[];
  if (!vals.length) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / max) * 100);
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase.from('evaluations').select('*').then(({ data }) => {
      if (data) setEvaluations(data as Evaluation[]);
      setLoading(false);
    });
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { completed, avgScore, hiringCount, gradeCount, seniorityCount, radarData, dist } = computeStats(evaluations);

  const hiringPie = Object.entries(hiringCount).map(([name, value]) => ({ name, value, fill: HIRING_COLORS[name] || '#888' }));
  const gradePie = Object.entries(gradeCount).map(([name, value]) => ({ name, value, fill: GRADE_COLORS[name] || '#888' }));

  const hireEligible = completed.filter(e => e.hiring_recommendation === 'Strong Hire' || e.hiring_recommendation === 'Hire').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="text-sky-400" size={24} />
          <h1 className="text-3xl font-extrabold">Analytics Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Aggregate insights across all evaluations.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Users, label: 'Total Evaluations', value: evaluations.length, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
          { icon: Award, label: 'Completed', value: completed.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { icon: TrendingUp, label: 'Avg Score', value: avgScore ? `${avgScore}/100` : '—', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { icon: Star, label: 'Hire Rate', value: completed.length ? `${Math.round((hireEligible / completed.length) * 100)}%` : '—', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`p-5 rounded-xl border ${stat.bg} ${stat.border}`}>
            <div className={`flex items-center gap-2 mb-3 ${stat.color}`}>
              <stat.icon size={15} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {completed.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground font-medium">No completed evaluations to analyze</p>
          <p className="text-muted-foreground text-sm mt-1">Complete some evaluations to see analytics here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <Target size={16} className="text-sky-400" />
              Score Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dist} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(222 47% 6%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar - avg competency */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <Brain size={16} className="text-sky-400" />
              Average Competency Profile
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Radar name="Average" dataKey="avg" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Hiring breakdown pie */}
          {hiringPie.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-5 flex items-center gap-2">
                <Star size={16} className="text-sky-400" />
                Hiring Recommendations
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={hiringPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {hiringPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 47% 6%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Grade breakdown */}
          {gradePie.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-5 flex items-center gap-2">
                <Award size={16} className="text-sky-400" />
                Grade Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={gradePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {gradePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 47% 6%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
