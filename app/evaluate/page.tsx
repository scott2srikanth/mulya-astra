'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, User, Hash, BookOpen, Zap, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function isValidGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' && parsed.pathname.split('/').filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function extractRepoName(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts.slice(0, 2).join('/');
  } catch {
    return '';
  }
}

const EXAMPLE_REPOS = [
  { url: 'https://github.com/vercel/next.js', label: 'Next.js' },
  { url: 'https://github.com/facebook/react', label: 'React' },
  { url: 'https://github.com/tiangolo/fastapi', label: 'FastAPI' },
];

export default function EvaluatePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  const [form, setForm] = useState({
    repoUrl: '',
    studentName: '',
    studentId: '',
    assignmentTitle: '',
  });
  const [urlError, setUrlError] = useState('');

  function handleUrlChange(val: string) {
    setForm(f => ({ ...f, repoUrl: val }));
    if (val && !isValidGithubUrl(val)) {
      setUrlError('Please enter a valid GitHub repository URL');
    } else {
      setUrlError('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidGithubUrl(form.repoUrl)) {
      setUrlError('Please enter a valid GitHub repository URL');
      return;
    }
    setLoading(true);
    try {
      const repoName = extractRepoName(form.repoUrl);
      const { data, error } = await supabase
        .from('evaluations')
        .insert({
          repo_url: form.repoUrl,
          repo_name: repoName,
          student_name: form.studentName || 'Unknown Student',
          student_id: form.studentId || 'N/A',
          assignment_title: form.assignmentTitle || 'General Evaluation',
          status: 'pending',
          progress: 0,
          languages_detected: [],
          frameworks_detected: [],
          ai_tools_detected: [],
          repo_stats: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Kick off evaluation
      fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationId: data.id, repoUrl: form.repoUrl }),
      }).catch(() => {});

      toast({ title: 'Evaluation started!', description: 'Redirecting to live results...' });
      router.push(`/evaluation/${data.id}`);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to start evaluation. Please try again.', variant: 'destructive' });
      setLoading(false);
    }
  }

  const urlValid = form.repoUrl && isValidGithubUrl(form.repoUrl);
  const repoName = urlValid ? extractRepoName(form.repoUrl) : '';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-xs font-semibold mb-4 tracking-wider uppercase">
          <Zap size={12} />
          New Evaluation
        </div>
        <h1 className="text-4xl font-extrabold mb-3">Submit a Repository</h1>
        <p className="text-muted-foreground text-lg">
          Enter a GitHub repository URL to start an AI-powered evaluation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repo URL */}
        <div className="glass-card p-6">
          <label className="block text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <GitBranch size={16} className="text-sky-400" />
            GitHub Repository URL
            <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="url"
              value={form.repoUrl}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://github.com/username/repository"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground text-sm font-mono focus:outline-none focus:border-sky-500/50 focus:bg-white/8 transition-all pr-10"
            />
            <div className="absolute right-3 top-3.5">
              {form.repoUrl && (
                urlValid
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : <AlertCircle size={16} className="text-rose-400" />
              )}
            </div>
          </div>
          {urlError && (
            <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
              <AlertCircle size={12} /> {urlError}
            </p>
          )}
          {urlValid && repoName && (
            <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Repository: <span className="font-mono">{repoName}</span>
            </p>
          )}

          {/* Example repos */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Info size={11} /> Try an example:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_REPOS.map((repo) => (
                <button
                  key={repo.url}
                  type="button"
                  onClick={() => handleUrlChange(repo.url)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-sky-500/30 transition-colors font-mono"
                >
                  {repo.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User size={16} className="text-sky-400" />
            Student Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Student Name
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={form.studentName}
                  onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
                  placeholder="Jane Doe"
                  className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Student ID
              </label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={form.studentId}
                  onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                  placeholder="STU-2024-001"
                  className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Assignment Title
            </label>
            <div className="relative">
              <BookOpen size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
              <input
                type="text"
                value={form.assignmentTitle}
                onChange={e => setForm(f => ({ ...f, assignmentTitle: e.target.value }))}
                placeholder="Final Project — Full Stack Web App"
                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-sky-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Scoring breakdown info */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Scoring Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Coding Skills', points: 25 },
              { label: 'Architecture', points: 15 },
              { label: 'UI/UX', points: 15 },
              { label: 'Problem Solving', points: 15 },
              { label: 'AI Engineering', points: 10 },
              { label: 'Performance', points: 10 },
              { label: 'Code Quality', points: 5 },
              { label: 'Documentation', points: 5 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-2.5 bg-white/3 rounded-lg">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-bold text-sky-400">{item.points}pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.repoUrl || !!urlError}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold rounded-xl hover:from-sky-400 hover:to-cyan-400 transition-all duration-200 shadow-xl shadow-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Evaluation...
            </>
          ) : (
            <>
              <Zap size={18} />
              Start AI Evaluation
            </>
          )}
        </button>
      </form>
    </div>
  );
}
