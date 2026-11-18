import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Users, CheckCircle2, ArrowRight, Clock, Lock } from 'lucide-react';
import {
  REFERRAL_TIERS,
  TOKEN_PRICE_USDT,
  MAX_MINING_SECONDS,
  CYCLE_DURATION_SECONDS,
  AETHEL_PER_SECOND,
  formatMiningTimer,
  type UserFintechState,
} from '../../lib/fintechData.ts';

interface MiningPageProps {
  fintechState: UserFintechState;
  onUpdateFintechState: (updater: (prev: UserFintechState) => UserFintechState) => void;
  onNavigate: (view: string) => void;
}

export const MiningPage: React.FC<MiningPageProps> = ({
  fintechState,
  onUpdateFintechState,
  onNavigate,
}) => {
  const [claimToast, setClaimToast] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const { isMining, sessionStartedAt, sessionClosed } = fintechState.mining;

  // Real-time wall-clock tick every second when mining is active
  useEffect(() => {
    if (!isMining || !sessionStartedAt) return;

    const syncTick = () => {
      const current = Date.now();
      setNowMs(current);
      const rawElapsed = Math.max(1, Math.floor((current - sessionStartedAt) / 1000));

      if (rawElapsed >= CYCLE_DURATION_SECONDS) {
        const finalSessionMined = MAX_MINING_SECONDS * AETHEL_PER_SECOND;
        onUpdateFintechState((prev) => {
          if (prev.mining.sessionClosed) return prev;
          const base = prev.mining.sessionBaseAethel ?? prev.aethelBalance;
          const finalTotal = base + finalSessionMined;
          return {
            ...prev,
            aethelBalance: finalTotal,
            mining: {
              ...prev.mining,
              isMining: false,
              sessionClosed: true,
              sessionElapsedSeconds: MAX_MINING_SECONDS,
              sessionMinedAethel: finalSessionMined,
              totalMinedAethel: finalTotal,
            },
          };
        });
      } else {
        onUpdateFintechState((prev) => {
          if (!prev.mining.isMining) return prev;
          const base = prev.mining.sessionBaseAethel ?? prev.aethelBalance;
          const sessionMined = rawElapsed * AETHEL_PER_SECOND;
          const total = base + sessionMined;
          return {
            ...prev,
            aethelBalance: total,
            mining: {
              ...prev.mining,
              sessionElapsedSeconds: rawElapsed,
              sessionMinedAethel: sessionMined,
              totalMinedAethel: total,
            },
          };
        });
      }
    };

    syncTick();
    const interval = setInterval(syncTick, 1000);
    return () => clearInterval(interval);
  }, [isMining, sessionStartedAt, onUpdateFintechState]);

  const rawElapsed =
    isMining && sessionStartedAt
      ? Math.max(1, Math.floor((nowMs - sessionStartedAt) / 1000))
      : fintechState.mining.sessionElapsedSeconds;

  const isCycleClosed = Boolean(sessionClosed) || rawElapsed >= CYCLE_DURATION_SECONDS;
  const displayElapsed = isCycleClosed
    ? MAX_MINING_SECONDS
    : isMining
    ? Math.min(MAX_MINING_SECONDS, Math.max(1, rawElapsed))
    : 0;

  const timerDisplay = formatMiningTimer(displayElapsed);
  const minedAethel = fintechState.aethelBalance;
  const sessionMined = fintechState.mining.sessionMinedAethel;

  const startOrRestartMining = () => {
    const startedAt = Date.now() - 1000; // Immediately starts at 00:00:01
    setNowMs(Date.now());
    onUpdateFintechState((prev) => ({
      ...prev,
      mining: {
        ...prev.mining,
        isMining: true,
        sessionClosed: false,
        sessionStartedAt: startedAt,
        sessionElapsedSeconds: 1,
        sessionBaseAethel: prev.aethelBalance,
        sessionMinedAethel: AETHEL_PER_SECOND,
      },
    }));
    setClaimToast(
      isCycleClosed
        ? '24-Hour Mining Cycle restarted at 00:00:01! Balance remains locked awaiting KYC.'
        : '24-Hour Mining Cycle started at 00:00:01! Mining counts live until 23:59:59.'
    );
    setTimeout(() => setClaimToast(null), 4000);
  };

  const cycleProgressPercent = Math.min(100, (displayElapsed / MAX_MINING_SECONDS) * 100);
  const usdtEquivalent = (minedAethel * TOKEN_PRICE_USDT).toFixed(2);
  const sessionUsdtEquivalent = (sessionMined * TOKEN_PRICE_USDT).toFixed(2);

  // Find user's active referral tier
  const currentReferrals = fintechState.referralsCount;
  const activeTier =
    REFERRAL_TIERS.find(
      (t) =>
        currentReferrals >= t.minReferrals &&
        (t.maxReferrals === null || currentReferrals <= t.maxReferrals)
    ) || REFERRAL_TIERS[0];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Title & Token Valuation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Autonomous Computational Network
            </span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="text-xs text-slate-500 font-mono">24-Hour Real-Time Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AETHEL Mining
          </h1>
        </div>

        {/* Awaiting KYC Banner */}
        <div className="w-full md:w-auto px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/70 flex items-center gap-3 shrink-0 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Awaiting KYC
          </div>
        </div>
      </div>

      {claimToast && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{claimToast}</span>
        </div>
      )}

      {/* Main Mining Cockpit: 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Visual Simulator Core (7 cols) */}
        <div className="lg:col-span-7 min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isMining ? 'bg-emerald-500 animate-pulse' : isCycleClosed ? 'bg-amber-500' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {isMining
                  ? 'Mining Active (00:00:01 → 23:59:59)'
                  : isCycleClosed
                  ? 'Session Closed (24H Complete)'
                  : 'Ready to Start'}
              </span>
            </div>
            <div className="font-mono text-slate-500 dark:text-slate-400">
              Hash Rate: <span className="font-bold text-teal-600 dark:text-teal-400">{fintechState.mining.hashRate.toFixed(2)} TH/s</span>
            </div>
          </div>

          {/* Center Progress Ring & Live Balance */}
          <div className="relative py-4 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-teal-500 transition-all duration-700 ease-out"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - cycleProgressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Centered Inner Balance & Status */}
              <div className="absolute inset-7 rounded-full bg-slate-50/90 dark:bg-slate-950/85 border border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center px-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Awaiting KYC</span>
                </span>
                <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight leading-none max-w-full truncate">
                  {minedAethel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-1">
                  AETHEL
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ≈ ${usdtEquivalent}
                </span>
              </div>
            </div>

            {/* Real-Time Count-Up Timer */}
            <div className="mt-6 space-y-1.5">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                <span>Real-Time Session Counter (00:00:01 – 23:59:59)</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {timerDisplay}
              </div>
            </div>
          </div>

          {/* Action Control Button */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            {isCycleClosed ? (
              <button
                type="button"
                onClick={startOrRestartMining}
                className="w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart 24H Mining Cycle</span>
              </button>
            ) : isMining ? (
              <div className="w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Mining Active — Closes After 23:59:59</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={startOrRestartMining}
                className="w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Mining (24H Cycle)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Yield Counters & Locked Balance */}
        <div className="lg:col-span-5 min-w-0 space-y-6 flex flex-col justify-between">
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mined AETHEL Holdings
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                <Lock className="w-3 h-3" />
                <span>Awaiting KYC</span>
              </span>
            </div>

            {/* Total Balance */}
            <div className="space-y-1">
              <div className="text-xs text-slate-400">Mined Balance (Awaiting KYC):</div>
              <div className="text-2xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight break-words">
                {minedAethel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 ml-2">AETHEL</span>
              </div>
              <div className="text-sm font-mono text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>≈ ${usdtEquivalent} USDT (Awaiting KYC)</span>
              </div>
            </div>

            {/* Current Session Yield */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2">
              <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                <span>Current Session (24h):</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  +{sessionMined.toFixed(2)} AETHEL
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                <span>Session USDT Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  +${sessionUsdtEquivalent} USDT
                </span>
              </div>
              <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Awaiting KYC
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              *Mined AETHEL balances are Awaiting KYC. Sessions run 24 hours from 00:00:01 to 23:59:59 before closing.
            </div>
          </div>

          {/* Referral Tier Multiplier Banner */}
          <div className="p-5 sm:p-6 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {activeTier.name} ({fintechState.referralsCount} Referrals)
                  </div>
                  <div className="text-[11px] text-teal-600 dark:text-teal-400">
                    Active Cap: ${activeTier.dailyMiningCapUSDT} USDT / Day
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('referrals')}
                className="min-h-[44px] sm:min-h-0 text-xs font-semibold px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors shrink-0 cursor-pointer"
              >
                Upgrade Tier
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Invite colleagues to boost your daily simulated mining cap up to $500.00 USDT per day.
            </p>
          </div>
        </div>
      </div>

      {/* Referral Tier Table (Requirement: Referral tier table showing sample daily caps from 0 referrals -> 5 USDT, up to 500 USDT) */}
      <div className="w-full max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Referral Tier & Daily Mining Cap Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Computational mining capacities scale with verified active network referrals.
            </p>
          </div>
          <button
            onClick={() => onNavigate('referrals')}
            className="min-h-[44px] sm:min-h-0 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Referral Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6">Tier Level</th>
                <th className="py-3 px-6">Referral Range</th>
                <th className="py-3 px-6">Daily Mining Cap (USDT)</th>
                <th className="py-3 px-6">Max Daily AETHEL</th>
                <th className="py-3 px-6">Task Commission</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {REFERRAL_TIERS.map((tier) => {
                const isCurrent = activeTier.level === tier.level;
                const maxDailyAethel = (tier.dailyMiningCapUSDT / TOKEN_PRICE_USDT).toFixed(0);

                return (
                  <tr
                    key={tier.level}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-teal-50/50 dark:bg-teal-950/20 font-medium'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                      {tier.name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 font-mono">
                      {tier.maxReferrals === null
                        ? `${tier.minReferrals}+ referrals`
                        : tier.minReferrals === tier.maxReferrals
                        ? `${tier.minReferrals} referrals`
                        : `${tier.minReferrals} – ${tier.maxReferrals} referrals`}
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums text-teal-600 dark:text-teal-400 font-bold">
                      ${tier.dailyMiningCapUSDT.toFixed(2)} USDT / day
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      ~{parseInt(maxDailyAethel).toLocaleString()} AETHEL
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600 dark:text-slate-300">
                      {(tier.commissionRate * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Tier</span>
                        </span>
                      ) : activeTier.level > tier.level ? (
                        <span className="text-[11px] text-slate-400">Unlocked</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
