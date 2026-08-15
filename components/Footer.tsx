import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-500/20">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-white">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.35"/>
                  <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.65"/>
                  <circle cx="10" cy="10" r="2.2" fill="currentColor"/>
                  <line x1="10" y1="2" x2="10" y2="4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <line x1="18" y1="10" x2="15.2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                <span className="text-gradient">Mulya</span>
                <span className="text-foreground">-Astra</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered GitHub project evaluation for bootcamps, colleges, and hiring teams.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                { href: '/evaluate', label: 'New Evaluation' },
                { href: '/history', label: 'History' },
                { href: '/analytics', label: 'Analytics' },
                { href: '/pricing', label: 'Pricing' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                { href: '/login', label: 'Sign In' },
                { href: '/signup', label: 'Get Started Free' },
                { href: '/account', label: 'Settings' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} <span className="font-semibold text-foreground">Skrdy Innovations</span>. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Mulya-Astra v1.0 &bull; Built with <span className="text-rose-400 mx-0.5">&#9829;</span> by Skrdy Innovations
          </p>
        </div>
      </div>
    </footer>
  );
}
