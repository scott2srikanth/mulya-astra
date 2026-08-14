'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Search, GitBranch, ArrowRight, Filter, Dessert as SortDesc, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react';
import type { Evaluation, EvaluationStatus } from '@/types/database';
import ScoreGauge from '@/components/ScoreGauge';
import StatusBadge from '@/components/StatusBadge';
import GradeTag from '@/components/GradeTag';
import HiringBadge from '@/components/HiringBadge';

const STATUS_OPTIONS: (EvaluationStatus | 'all')[] = ['all', 'completed', 'evaluating', 'running', 'analyzing', 'pending', 'failed'];

export default function HistoryPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filtered, setFiltered] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  useEffect(() => {
    let result = [...evaluations];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.student_name.toLowerCase().includes(q) ||
        e.repo_url.toLowerCase().includes(q) ||
        e.assignment_title.toLowerCase().includes(q) ||
        e.student_id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }
    if (sortBy === 'score') {
      result.sort((a, b) => (b.final_score ?? -1) - (a.final_score ?? -1));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    setFiltered(result);
  }, [evaluations, search, statusFilter, sortBy]);

  async function fetchEvaluations() {
    const response=await fetch('/api/evaluations', {cache:'no-store'});
    if (response.ok) setEvaluations(await response.json());
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const response=await fetch(`/api/evaluations/${id}`, {method:'DELETE'});
    if (response.ok) setEvaluations(prev => prev.filter(e => e.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="text-sky-400" size={24} />
          <h1 className="text-3xl font-extrabold">Evaluation History</h1>
        </div>
        <p className="text-muted-foreground">All submitted repositories and their evaluation results.</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, repo, assignment..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-sky-500/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as EvaluationStatus | 'all')}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:border-sky-500/40 transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="bg-background">
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <SortDesc size={14} className="text-muted-foreground shrink-0" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'score')}
            className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground focus:outline-none focus:border-sky-500/40 transition-all cursor-pointer"
          >
            <option value="date" className="bg-background">Sort by Date</option>
            <option value="score" className="bg-background">Sort by Score</option>
          </select>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-sm w-full">
            <AlertTriangle className="text-amber-400 w-8 h-8 mx-auto mb-3" />
            <h3 className="text-base font-bold text-center mb-2">Delete Evaluation?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 glass-card text-sm hover:bg-white/10 transition-colors rounded-lg"
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm rounded-lg hover:bg-rose-500/30 transition-colors"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
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
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground font-medium">No evaluations found</p>
          {search || statusFilter !== 'all' ? (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="text-sm text-sky-400 hover:text-sky-300 mt-2 inline-block"
            >
              Clear filters
            </button>
          ) : (
            <Link href="/evaluate" className="text-sm text-sky-400 hover:text-sky-300 mt-2 inline-block">
              Start your first evaluation
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} evaluation{filtered.length !== 1 ? 's' : ''}</p>
          <div className="space-y-2">
            {filtered.map((ev) => (
              <div key={ev.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-white/8 transition-colors">
                <ScoreGauge score={ev.final_score ?? null} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-semibold text-foreground truncate">{ev.student_name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">#{ev.student_id}</span>
                    <StatusBadge status={ev.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <GitBranch size={11} />
                    <span className="font-mono truncate">{ev.repo_name || ev.repo_url}</span>
                    <span className="hidden sm:inline text-muted-foreground/40">•</span>
                    <span className="hidden sm:inline">{ev.assignment_title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    {ev.grade && <GradeTag grade={ev.grade} />}
                    {ev.hiring_recommendation && <HiringBadge recommendation={ev.hiring_recommendation} />}
                  </div>
                  <span className="hidden md:block text-xs text-muted-foreground">
                    {new Date(ev.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setDeleteId(ev.id)}
                    className="p-1.5 text-muted-foreground/40 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                  <Link
                    href={`/evaluation/${ev.id}`}
                    className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 hover:bg-sky-500/20 transition-colors"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
