'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Building2, Rocket, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'For individuals exploring AI-powered evaluation.',
    color: 'text-muted-foreground',
    borderClass: 'border-border',
    features: [
      '5 evaluations / month',
      'GitHub public repos only',
      'Basic score breakdown',
      'PDF report export',
      '7-day history retention',
      'Community support',
    ],
    cta: 'Get Started Free',
    ctaHref: '/signup',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Rocket,
    monthlyPrice: 29,
    annualPrice: 23,
    description: 'For developers, freelancers, and individual evaluators.',
    color: 'text-sky-500',
    borderClass: 'border-sky-500/40',
    features: [
      '100 evaluations / month',
      'Public & private repos',
      'Full 6-agent AI analysis',
      'PDF + Markdown + JSON export',
      '90-day history retention',
      'Advanced analytics dashboard',
      'Priority email support',
      'Custom rubric templates',
    ],
    cta: 'Start Pro Trial',
    ctaHref: null,
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'team',
    name: 'Team',
    icon: Building2,
    monthlyPrice: 99,
    annualPrice: 79,
    description: 'For bootcamps, colleges, and small hiring teams.',
    color: 'text-emerald-500',
    borderClass: 'border-emerald-500/30',
    features: [
      'Unlimited evaluations',
      'Up to 10 team members',
      'Shared evaluation dashboard',
      'Bulk submission via CSV',
      'Custom scoring rubrics',
      'API access',
      '1-year history retention',
      'Dedicated support channel',
    ],
    cta: 'Start Team Trial',
    ctaHref: null,
    highlight: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    monthlyPrice: null,
    annualPrice: null,
    description: 'For large organizations with custom requirements.',
    color: 'text-amber-500',
    borderClass: 'border-amber-500/30',
    features: [
      'Unlimited everything',
      'Unlimited team members',
      'SSO / SAML integration',
      'On-premise deployment option',
      'Custom AI model fine-tuning',
      'White-label reports',
      'SLA guarantee',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:sales@skrdy.io',
    highlight: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const { user } = useAuth();

  function handlePlanCta(plan: typeof plans[0]) {
    if (plan.ctaHref) return plan.ctaHref;
    return 'https://bolt.new/setup/stripe';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs font-semibold text-sky-600 dark:text-sky-400 mb-4">
          <Zap size={11} />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl font-extrabold mb-4">
          Choose your{' '}
          <span className="text-gradient">plan</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Start free and scale as you grow. Every plan includes AI-powered evaluation, automated scoring, and professional reports.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={cn('text-sm font-medium', !annual ? 'text-foreground' : 'text-muted-foreground')}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              annual ? 'bg-sky-500' : 'bg-muted'
            )}
          >
            <span className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              annual ? 'translate-x-5' : 'translate-x-0'
            )} />
          </button>
          <span className={cn('text-sm font-medium', annual ? 'text-foreground' : 'text-muted-foreground')}>
            Annual
            <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded">SAVE 20%</span>
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map(plan => {
          const Icon = plan.icon;
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const isCurrentPlan = user && false; // placeholder

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-all',
                plan.highlight
                  ? 'bg-gradient-to-b from-sky-500/10 to-card border-sky-500/40 shadow-xl shadow-sky-500/10'
                  : 'bg-card border-border hover:border-muted-foreground/30',
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="mb-5">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', `bg-current/10`)}>
                  <Icon size={20} className={plan.color} />
                </div>
                <h3 className="font-extrabold text-lg text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-6">
                {price === null ? (
                  <div className="text-3xl font-extrabold text-foreground">Custom</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold text-foreground">${price}</span>
                    <span className="text-muted-foreground text-sm mb-1">/mo</span>
                  </div>
                )}
                {annual && price !== null && price > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">Billed annually (${(price * 12).toLocaleString()}/yr)</p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={handlePlanCta(plan)}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  plan.highlight
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400 shadow-lg shadow-sky-500/25'
                    : 'border border-border text-foreground hover:bg-muted'
                )}
              >
                {plan.cta}
                <ArrowRight size={13} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* FAQ teaser */}
      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include a{' '}
          <span className="font-semibold text-foreground">14-day free trial</span>
          {' '}on paid tiers. No credit card required to start.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Questions?{' '}
          <a href="mailto:hello@skrdy.io" className="text-primary hover:underline">Contact us</a>
          {' '}— we respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
