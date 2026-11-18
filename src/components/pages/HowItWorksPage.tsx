import React, { useState } from 'react';
import {
  Wallet,
  CheckSquare,
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  Landmark,
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (view: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      num: '01',
      title: 'Account Onboarding & Security',
      icon: Wallet,
      summary: 'Instant registration with optional referral code and 2-Factor Authentication.',
      details: [
        'Register your account in less than 60 seconds with email and secure password.',
        'Enter an optional referral code (e.g. AETH-9821) to immediately activate Bronze Tier perks.',
        '2FA authentication screen protects your earnings and cold-storage withdrawal preferences.',
        'Zero initial deposit required to begin completing verification tasks.',
      ],
    },
    {
      num: '02',
      title: 'Complete Tasks & Run Simulated Mining',
      icon: CheckSquare,
      summary: 'Evaluate apps, hotel amenities, agriculture surveys, and mine AETHEL in 24h cycles.',
      details: [
        'Explore 5 curated task categories: Rate Apps, Business Reviews, Agriculture, Remote Jobs, and Daily Check-ins.',
        'Follow step-by-step instructions and submit your evaluation with instant demo validation.',
        'Activate the simulated AETHEL mining engine with one click; watch tokens accumulate in real time at $0.056/token.',
        'Mining cycles run for 24 hours, automatically stopping to require manual claim and restart.',
      ],
    },
    {
      num: '03',
      title: 'Collect Rewards & Expand Referral Network',
      icon: Users,
      summary: 'Direct USDT payouts to your balance and scaling referral tier mining rates.',
      details: [
        'Task rewards and mined AETHEL are credited directly into your verified sample ledger.',
        'Share your unique referral link to unlock higher mining rates from Bronze (10) up to Platinum (500) and earn 1.5% commission on referee investments.',
        'Withdraw funds directly to external USDT, Bitcoin, or Ethereum blockchain addresses.',
      ],
    },
    {
      num: '04',
      title: 'Invest & Earn 2% Weekly',
      icon: TrendingUp,
      summary: 'Allocate wallet capital into investment terms earning 2.0% weekly returns.',
      details: [
        'Open Invest Now from your Balance modal or Wallet view to choose your preferred term horizon.',
        'Track 2.0% growth intervals directly inside your clickable Active Invested card.',
        'Unlock any portion of your active investment back to your available balance anytime for withdrawal.',
      ],
    },
    {
      num: '05',
      title: 'Borrow & Pay 1.5% Monthly',
      icon: Landmark,
      summary: 'Access flexible platform borrowing at a transparent 1.5% monthly interest rate.',
      details: [
        'Click Borrow Now under Manage Funds or inside your Wallet view.',
        'Enter your desired borrow amount and preview exact 1.5% monthly interest charges.',
        'Continue transacting with deposits and investments on the platform to unlock credit access.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Operational Blueprint
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Aethelgard Works
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A transparent, five-step journey from onboarding and tasks to mining, investing, and flexible borrowing.
          </p>
        </div>

        {/* 5 Step Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={`p-6 sm:p-8 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 shadow-md ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                      {step.num}
                    </span>
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {step.summary}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    {step.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Step {idx + 1} of 5</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Callout */}
        <div className="p-8 sm:p-10 rounded-3xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-r from-teal-50/60 via-white to-emerald-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30 text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ready to Explore the Platform?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Launch your task dashboard or start the simulated AETHEL mining engine with real-time token accumulation.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={() => onNavigate('client-dashboard')}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
            >
              <span>Go to Task Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('mining')}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
            >
              <span>AETHEL Mining Simulator</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
