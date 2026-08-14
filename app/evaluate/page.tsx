'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, User, Hash, BookOpen, Zap, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Info, Plus, X, WandSparkles } from 'lucide-react';
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

function RequirementField({label,help,placeholder,value,onChange}:{label:string;help:string;placeholder:string;value:string;onChange:(value:string)=>void}){
  const [draft,setDraft]=useState('');const items=value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  const add=()=>{const item=draft.trim();if(!item)return;onChange([...items,item].filter((v,i,a)=>a.indexOf(v)===i).join('\n'));setDraft('');};
  return <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><label className="block text-sm font-semibold mb-1">{label}</label><p className="text-xs text-muted-foreground mb-3 min-h-[32px]">{help}</p><div className="flex gap-2"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}}} placeholder={placeholder} className="min-w-0 flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-violet-500/50"/><button type="button" onClick={add} className="px-3 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/25" aria-label={`Add ${label}`}><Plus size={16}/></button></div>{items.length>0?<div className="flex flex-wrap gap-2 mt-3">{items.map(item=><span key={item} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1.5 text-xs"><span className="truncate">{item}</span><button type="button" onClick={()=>onChange(items.filter(v=>v!==item).join('\n'))} className="text-muted-foreground hover:text-rose-400" aria-label={`Remove ${item}`}><X size={12}/></button></span>)}</div>:<p className="text-[11px] text-muted-foreground/70 mt-3">Optional — add only requirements that students were explicitly given.</p>}</div>;
}

export default function EvaluatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    repoUrl: '',
    studentName: '',
    studentId: '',
    assignmentTitle: '',
    assignmentBrief: '', requiredPaths: '', requiredFunctions: '', uiRequirements: '', modelRequirements: '', endpoints: '', forbiddenPatterns: '', assignmentWeight: 70,
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
      const createResponse = await fetch('/api/evaluations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      if (!createResponse.ok) throw new Error((await createResponse.json()).error || 'Unable to create evaluation');
      const data = await createResponse.json();

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

        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div><h3 className="text-base font-semibold flex items-center gap-2"><BookOpen size={18} className="text-violet-400" />Instructor Assignment Rubric</h3><p className="text-sm text-muted-foreground mt-1">Tell us what students were asked to build. You can leave any section blank.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setForm(f=>({...f,assignmentBrief:'Build a full-stack application with a clear user workflow, input validation, persistence, error handling, and tests.',requiredPaths:'frontend\nbackend',requiredFunctions:'',uiRequirements:'responsive layout\nloading and error states',modelRequirements:'',endpoints:'GET /health\nPOST /api/items',forbiddenPatterns:'',assignmentWeight:70}))} className="px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/10 text-xs text-violet-300"><WandSparkles size={12} className="inline mr-1"/>Web app template</button><button type="button" onClick={()=>setForm(f=>({...f,assignmentBrief:'Train and evaluate a machine-learning model, expose predictions through an API, and provide a simple interface for entering features.',requiredPaths:'backend\nbackend/static',requiredFunctions:'train_model\npredict',uiRequirements:'prediction form\nvalidation error message',modelRequirements:'LogisticRegression',endpoints:'POST /predict\nGET /health',forbiddenPatterns:'RandomForestClassifier',assignmentWeight:80}))} className="px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-xs text-cyan-300"><WandSparkles size={12} className="inline mr-1"/>ML project template</button></div></div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-4"><div className="flex gap-3"><Info size={17} className="text-sky-400 shrink-0 mt-0.5"/><div><p className="text-sm font-medium">Start with the assignment in your own words</p><p className="text-xs text-muted-foreground mt-1">This description is reviewed through the manual ChatGPT JSON step. The specific items below are checked automatically from GitHub.</p></div></div><textarea value={form.assignmentBrief} onChange={e=>setForm(f=>({...f,assignmentBrief:e.target.value}))} rows={5} placeholder="Example: Students must build a customer-churn predictor using logistic regression. The page should accept customer details, show a clear prediction, and handle invalid input..." className="mt-4 w-full px-4 py-3 bg-black/10 border border-white/10 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-sky-500/50" /></div>
          <div><p className="text-sm font-semibold">Add requirements to check automatically</p><p className="text-xs text-muted-foreground mt-1">Type one requirement and press Enter or the + button.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RequirementField label="Project structure" help="Files or folders students must create." placeholder="e.g. backend/static" value={form.requiredPaths} onChange={value=>setForm(f=>({...f,requiredPaths:value}))}/>
            <RequirementField label="Required functions" help="Function names that must exist in the code." placeholder="e.g. train_model" value={form.requiredFunctions} onChange={value=>setForm(f=>({...f,requiredFunctions:value}))}/>
            <RequirementField label="User interface" help="Visible elements, states, or interactions you expect." placeholder="e.g. validation error message" value={form.uiRequirements} onChange={value=>setForm(f=>({...f,uiRequirements:value}))}/>
            <RequirementField label="Model or algorithm" help="The exact ML technique or class students must use." placeholder="e.g. LogisticRegression" value={form.modelRequirements} onChange={value=>setForm(f=>({...f,modelRequirements:value}))}/>
            <RequirementField label="API endpoints" help="Use METHOD /path. Add a short purpose if useful." placeholder="e.g. POST /predict - predict outcome" value={form.endpoints} onChange={value=>setForm(f=>({...f,endpoints:value}))}/>
            <RequirementField label="Not allowed" help="Libraries, models, or unsafe techniques students must avoid." placeholder="e.g. RandomForestClassifier" value={form.forbiddenPatterns} onChange={value=>setForm(f=>({...f,forbiddenPatterns:value}))}/>
          </div>
          <div className="rounded-xl border border-white/10 p-4"><div className="flex items-center justify-between gap-4"><div><label className="text-sm font-semibold">How important is assignment compliance?</label><p className="text-xs text-muted-foreground mt-1">The remaining {100-form.assignmentWeight}% grades general engineering quality.</p></div><span className="text-xl font-bold text-violet-400 tabular-nums">{form.assignmentWeight}%</span></div><input type="range" min="0" max="100" step="5" value={form.assignmentWeight} onChange={e=>setForm(f=>({...f,assignmentWeight:Number(e.target.value)}))} className="w-full accent-violet-500 mt-4"/><div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>Engineering focused</span><span>Assignment focused</span></div></div>
        </div>

        {/* Scoring breakdown info */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Scoring Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Implementation', points: 20 },
              { label: 'Architecture', points: 15 },
              { label: 'Testing', points: 15 },
              { label: 'Code Quality', points: 15 },
              { label: 'Documentation', points: 15 },
              { label: 'Performance', points: 10 },
              { label: 'Security', points: 10 },
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
