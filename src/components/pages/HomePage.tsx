import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Building2,
  Sprout,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  Users,
  Award,
} from 'lucide-react';
import { REFERRAL_TIERS, TOKEN_PRICE_USDT } from '../../lib/fintechData.ts';

interface HomePageProps {
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do tasks and sample rewards work on Aethelgard?',
      a: 'Users evaluate partner applications, conduct business and hotel quality assessments, review agricultural sensor telemetry, and score remote applicant portfolios. Each completed task is verified and credits instant USDT cash and AETHEL token rewards directly to your balance.',
    },
    {
      q: 'What is AETHEL Mining and how is token price determined?',
      a: 'AETHEL Mining is our simulated distributed proof-of-stake computational network. The AETHEL index is pegged at 0.056 USDT per token. Your mining simulator generates tokens in real time and automatically stops at 24 hours to prevent resource exhaustion until claimed and restarted.',
    },
    {
      q: 'How do referral tiers increase mining rates and commissions?',
      a: 'Starter Tier (0 referrals) mines at the normal 100% rate (5.00 USDT daily cap). Inviting peers unlocks higher mining rates: Bronze (10+ referrals, 150% rate), Silver (100+ referrals, 225% rate), Gold (250+ referrals, 350% rate), and Platinum (500+ referrals, 500% rate). Plus, you earn a direct 1.5% commission on every investment made by your referred customers.',
    },
    {
      q: 'Can I withdraw my task rewards and mining balance?',
      a: 'Yes. Verified earnings in your Available Balance can be withdrawn to external USDT (ERC-20 / TRC-20), Bitcoin, or Ethereum cold-storage wallets. Standard processing completes within 12–24 hours.',
    },
    {
      q: 'How does the secondary simulated investment feature work?',
      a: 'From the dashboard, users can click the secondary "Invest" button to allocate sample balance to institutional weekly yield contracts (2.0% weekly target) with an instant interactive animation and balance update.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-teal-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Complete Micro-Tasks.{' '}
                <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                  Mine AETHEL Tokens.
                </span>{' '}
                Earn Digital Assets.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Evaluate mobile fintech apps, score corporate hotel amenities, analyze agricultural telemetry, and participate in real-time 24-hour computational mining with direct USDT payouts.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('client-dashboard')}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 group"
                >
                  <span>Start Earning Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('mining')}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Zap className="w-4 h-4 text-teal-500" />
                  <span>Launch Mining Simulator</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>AETHEL Index: $0.056 USDT</span>
                </div>
                <span className="hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>24-Hour Mining Cycles</span>
                </div>
                <span className="hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500 shrink-0" />
                  <span>Up to 500 USDT Daily Cap</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero High-Tech Visual */}
            <div className="lg:col-span-5 relative min-w-0">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-950 group">
                <img
                  src="/src/assets/images/fintech_task_hero_1794218673954.jpg"
                  alt="Aethelgard Fintech Dashboard & Yield Interface"
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "HOW IT WORKS" (5 steps) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Clear Five-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A frictionless workflow designed for independent evaluators, remote workers, and crypto asset accumulators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-mono text-xl font-bold flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Create Account & Connect
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Register in under 60 seconds. Optional referral codes unlock starting hash rate multipliers and 2FA authentication safeguards your digital asset credentials.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-mono text-xl font-bold flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Complete Tasks & Mine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select tasks across app ratings, corporate hotel reviews, agriculture telemetry, or remote applications. Activate your 24-hour simulated AETHEL mining simulator with a single click.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-mono text-xl font-bold flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Receive Rewards & Withdraw
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Earnings accumulate in real-time in your available sample ledger. Withdraw directly to your cold-storage USDT, BTC, or ETH wallets with audited double-entry safety.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono text-xl font-bold flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
              04
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Invest & Earn 2% Weekly
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Allocate funds from your wallet to earn 2.0% weekly returns, track 24-hour compounding increases, and unlock your invested amount anytime for withdrawal.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm relative">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-mono text-xl font-bold flex items-center justify-center border border-amber-200/50 dark:border-amber-800/50">
              05
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Borrow & Pay 1.5% Monthly
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Request flexible liquidity directly from your Balance or Wallet at a transparent 1.5% monthly interest rate as you keep transacting on the platform.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED TASK CATEGORIES (Requirement: featured task categories) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Earn on Your Schedule
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Featured Task Categories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Diverse micro-evaluations with transparent per-task rewards and instant validation.
            </p>
          </div>

          <button
            onClick={() => onNavigate('client-dashboard')}
            className="min-h-[44px] text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 self-start md:self-auto"
          >
            <span>Browse Full Task Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Category 1 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 w-fit">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Rate Apps
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit mobile wallet UI, biometrics latency, and order book interactions.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
              From $4.50 USDT
            </div>
          </div>

          {/* Category 2 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 w-fit">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Business & Hotel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluate high-speed WiFi, conference facilities, and corporate workspaces.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
              From $5.80 USDT
            </div>
          </div>

          {/* Category 3 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 w-fit">
                <Sprout className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Agriculture Surveys
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit autonomous drone telemetry, soil moisture probes, and hydroponics.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
              From $6.80 USDT
            </div>
          </div>

          {/* Category 4 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 w-fit">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Remote Applications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Score developer code submissions, AML scenarios, and research portfolios.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
              From $8.00 USDT
            </div>
          </div>

          {/* Category 5 */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 w-fit">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Daily Check-in
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maintain your consecutive login streak to claim bonus USDT and hash rate boosts.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
              Daily Streak Reward
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIMULATED MINING SPOTLIGHT SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="p-6 sm:p-12 rounded-3xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
          <div className="space-y-5 max-w-xl w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase font-mono">
              <Zap className="w-3.5 h-3.5 text-teal-500" />
              <span>Simulated Protocol Mining</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AETHEL Mining at 0.056 USDT
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every participant operates a simulated computational validator. The token index is pegged at 0.056 USDT. Mining cycles run up to 24 hours with daily caps scaling from 5 USDT to 500 USDT via verified referrals.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => onNavigate('mining')}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
              >
                <span>Launch Mining Cockpit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('referrals')}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <span>View Referral Tiers</span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Sample Mining Snapshot</span>
              <span className="font-mono text-teal-600 font-bold">1.45 TH/s</span>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-400">AETHEL Mined:</div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                4,820.00 AETHEL
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600">
                ≈ $269.92 USDT ($0.056 Index)
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              24-Hour Cycle Governance: Stops automatically every 24 hours to require manual claim and active validation.
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION (Requirement: FAQ) */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Clear Guidance
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Answers regarding task verification, simulated mining cycles, and digital asset custody.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full min-h-[44px] p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
