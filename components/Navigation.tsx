'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, GitBranch, History, ChartBar as BarChart3, Menu, X, Zap, Sun, Moon, LogOut, ChevronDown, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/evaluate', label: 'Evaluate', icon: GitBranch },
  { href: '/history', label: 'History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const TIER_COLORS: Record<string, string> = {
  free: 'text-muted-foreground',
  pro: 'text-sky-500',
  team: 'text-emerald-500',
  enterprise: 'text-amber-500',
};

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:shadow-sky-500/40 transition-all group-hover:scale-105">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.35"/>
                  <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.65"/>
                  <circle cx="10" cy="10" r="2.2" fill="currentColor"/>
                  <line x1="10" y1="2" x2="10" y2="4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <line x1="18" y1="10" x2="15.2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              {user && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />}
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-tight">
                <span className="text-gradient">Mulya</span>
                <span className="text-foreground">-Astra</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase">Code Intelligence</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {!loading && (
              user ? (
                <>
                  <Link
                    href="/evaluate"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-sky-400 hover:to-cyan-400 transition-all shadow-md shadow-sky-500/20"
                  >
                    <Zap size={13} />
                    Evaluate
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-none">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[90px]">
                          {profile?.display_name || user.email?.split('@')[0]}
                        </span>
                        <span className={cn('text-[10px] capitalize font-medium', TIER_COLORS[profile?.subscription_tier ?? 'free'])}>
                          {profile?.subscription_tier ?? 'free'}
                        </span>
                      </div>
                      <ChevronDown size={11} className="text-muted-foreground hidden sm:block" />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || user.email?.split('@')[0]}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <div className="p-1">
                            <Link href="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                              <Settings size={14} className="text-muted-foreground" /> Account Settings
                            </Link>
                            <Link href="/pricing" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                              <CreditCard size={14} className="text-muted-foreground" /> Subscription
                            </Link>
                          </div>
                          <div className="p-1 border-t border-border">
                            <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors w-full text-left">
                              <LogOut size={14} /> Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-sky-400 hover:to-cyan-400 transition-all shadow-md shadow-sky-500/20">
                    Get Started
                  </Link>
                </>
              )
            )}

            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-border space-y-1 pb-4">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border space-y-1">
              {user ? (
                <>
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                    <Settings size={15} /> Account
                  </Link>
                  <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                    <CreditCard size={15} /> Subscription
                  </Link>
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 rounded-lg w-full text-left">
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-semibold rounded-lg">
                    <Zap size={14} /> Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
