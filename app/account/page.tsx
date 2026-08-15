'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Building2, Save, LogOut, CreditCard, Shield, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: 'text-muted-foreground', bg: 'bg-muted' },
  pro:        { label: 'Pro',        color: 'text-sky-600 dark:text-sky-400',     bg: 'bg-sky-500/10' },
  team:       { label: 'Team',       color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  enterprise: { label: 'Enterprise', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
};

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();

  const [form, setForm] = useState({ display_name: '', company: '' });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        company: profile.company || '',
      });
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: form.display_name.trim(), company: form.company.trim() })
      .eq('id', user!.id);
    if (error) {
      setSaveError(error.message);
      setSaveStatus('error');
    } else {
      await refreshProfile();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tier = profile?.subscription_tier ?? 'free';
  const tierConfig = TIER_CONFIG[tier];
  const evaluationsUsed = profile?.evaluations_used ?? 0;
  const evaluationsLimit = tier === 'free' ? 5 : tier === 'pro' ? 100 : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, subscription, and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-sky-500/25">
              {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">{profile?.display_name || user.email?.split('@')[0]}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className={cn('inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold', tierConfig.bg, tierConfig.color)}>
                <Shield size={10} />
                {tierConfig.label} Plan
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Display Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={user.email ?? ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-input rounded-xl text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Email address cannot be changed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Organization / Company</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Your company or institution"
                  className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-input rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={14} className="shrink-0" />
                Profile saved successfully.
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertCircle size={14} className="shrink-0" />
                {saveError}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:from-sky-400 hover:to-cyan-400 transition-all shadow-md shadow-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Subscription card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <CreditCard size={16} className="text-sky-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Subscription</h3>
                <p className="text-xs text-muted-foreground">Your current plan and usage</p>
              </div>
            </div>
            <span className={cn('px-3 py-1 rounded-full text-xs font-bold', tierConfig.bg, tierConfig.color)}>
              {tierConfig.label}
            </span>
          </div>

          {evaluationsLimit !== null && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground font-medium">Evaluations used this month</span>
                <span className="font-bold text-foreground">{evaluationsUsed} / {evaluationsLimit}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    evaluationsUsed / evaluationsLimit > 0.8 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-cyan-500'
                  )}
                  style={{ width: `${Math.min(100, (evaluationsUsed / evaluationsLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {evaluationsLimit === null && (
            <p className="text-sm text-muted-foreground mb-5">
              <span className="font-semibold text-foreground">Unlimited evaluations</span> included in your plan.
            </p>
          )}

          {tier === 'free' && (
            <Link
              href="/pricing"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/20 hover:border-sky-500/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-sky-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Upgrade to Pro</p>
                  <p className="text-xs text-muted-foreground">100 evaluations/month + full 6-agent AI analysis</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          )}

          {tier !== 'free' && (
            <Link
              href="/pricing"
              className="text-sm text-primary hover:underline font-medium"
            >
              Manage subscription &rarr;
            </Link>
          )}
        </div>

        {/* Danger zone */}
        <div className="glass-card p-6 border-rose-500/20">
          <h3 className="font-bold text-foreground mb-1">Sign Out</h3>
          <p className="text-xs text-muted-foreground mb-4">Sign out of your Mulya-Astra account on this device.</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-500 border border-rose-500/30 rounded-xl hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
