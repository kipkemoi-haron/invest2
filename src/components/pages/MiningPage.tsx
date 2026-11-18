import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, TrendingUp, Users, CheckCircle2, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { REFERRAL_TIERS, TOKEN_PRICE_USDT, type UserFintechState } from '../../lib/fintechData.ts';

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
  const [isMining, setIsMining] = useState<boolean>(fintechState.mining.isMining);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(fintechState.mining.sessionElapsedSeconds);
  const [minedAethel, setMinedAethel] = useState<number>(fintechState.aethelBalance);
  const [sessionMined, setSessionMined] = useState<number>(fintechState.mining.sessionMinedAethel);
  const [claimToast, setClaimToast] = useState<string | null>(null);

  const MAX_CYCLE_SECONDS = 86400; // 24 Hours
  const isCycleExpired = elapsedSeconds >= MAX_CYCLE_SECONDS;

  // Real-time tick effect (increments every second when mining is active)
  useEffect(() => {
    if (!isMining || isCycleExpired) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prevSec) => {
        const nextSec = prevSec + 1;
        if (nextSec >= MAX_CYCLE_SECONDS) {
          setIsMining(false);
          return MAX_CYCLE_SECONDS;
        }
        return nextSec;
      });

      // Realistic mining yield: ~0.045 AETHEL per second
      const increment = 0.045;
      setMinedAethel((prev) => prev + increment);
      setSessionMined((prev) => prev + increment);

      // Periodically sync back to parent state
      onUpdateFintechState((prev) => ({
        ...prev,
        aethelBalance: prev.aethelBalance + increment,
        mining: {
          ...prev.mining,
          sessionElapsedSeconds: Math.min(prev.mining.sessionElapsedSeconds + 1, MAX_CYCLE_SECONDS),
          sessionMinedAethel: prev.mining.sessionMinedAethel + increment,
          totalMinedAethel: prev.aethelBalance + increment,
          isMining: prev.mining.sessionElapsedSeconds + 1 < MAX_CYCLE_SECONDS,
        },
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, isCycleExpired, onUpdateFintechState]);

  const toggleMining = () => {
    if (isCycleExpired) {
      // Need to restart cycle
      restartCycle();
      return;
    }
    const nextState = !isMining;
    setIsMining(nextState);
    onUpdateFintechState((prev) => ({
      ...prev,
      mining: {
        ...prev.mining,
        isMining: nextState,
      },
    }));
  };

  const restartCycle = () => {
    setElapsedSeconds(0);
    setSessionMined(0);
    setIsMining(true);
    setClaimToast('24-Hour Mining Cycle restarted! Active hash rate restored.');
    setTimeout(() => setClaimToast(null), 4000);

    onUpdateFintechState((prev) => ({
      ...prev,
      mining: {
        ...prev.mining,
        isMining: true,
        sessionStartedAt: Date.now(),
        sessionElapsedSeconds: 0,
        sessionMinedAethel: 0,
      },
    }));
  };

  const remainingSeconds = Math.max(0, MAX_CYCLE_SECONDS - elapsedSeconds);
  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minutesLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secondsLeft = remainingSeconds % 60;

  const cycleProgressPercent = Math.min(100, (elapsedSeconds / MAX_CYCLE_SECONDS) * 100);
  const usdtEquivalent = (minedAethel * TOKEN_PRICE_USDT).toFixed(2);
  const sessionUsdtEquivalent = (sessionMined * TOKEN_PRICE_USDT).toFixed(2);

  // Find user's active referral tier (14 referrals = Gold Tier)
  const currentReferrals = fintechState.referralsCount;
  const activeTier = REFERRAL_TIERS.find(
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
            <span className="text-xs text-slate-500 font-mono">Proof-of-Stake Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AETHEL Mining
          </h1>
        </div>

        {/* Token Price Callout */}
        <div className="w-full md:w-auto p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 flex items-center gap-4 shrink-0 shadow-sm">
          <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Live Index Valuation
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              0.056 USDT <span className="text-xs font-normal text-slate-500">per AETHEL</span>
            </div>
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
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  isMining ? 'bg-emerald-500 animate-pulse' : isCycleExpired ? 'bg-teal-500' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {isMining ? 'Active' : isCycleExpired ? 'Completed' : 'Paused'}
              </span>
            </div>
            <div className="font-mono text-slate-500 dark:text-slate-400">
              Hash Rate: <span className="font-bold text-teal-600 dark:text-teal-400">1.45 TH/s</span>
            </div>
          </div>

          {/* Center Progress Ring & Live Balance */}
          <div className="relative py-4 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Active Animated Progress Arc */}
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-1">
                  {isMining ? 'Mining Live' : isCycleExpired ? 'Cycle Complete' : 'Mining Paused'}
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

            {/* Countdown timer */}
            <div className="mt-6 space-y-1.5">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                <span>24-Hour Cycle Countdown</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {String(hoursLeft).padStart(2, '0')}:{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Action Control Button */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            {isCycleExpired ? (
              <button
                type="button"
                onClick={restartCycle}
                className="w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Claim & Restart 24H Cycle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleMining}
                className={`w-full min-h-[44px] py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isMining
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                }`}
              >
                {isMining ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-500" />
                    <span>Pause Mining</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Mining</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Yield Counters & Balance Equivalents (5 cols) */}
        <div className="lg:col-span-5 min-w-0 space-y-6 flex flex-col justify-between">
          {/* Simulated Balance & USDT Equivalent Card */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Simulated AETHEL Holdings
              </span>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-bold">
                1 AETHEL = $0.056 USDT
              </span>
            </div>

            {/* Total Balance */}
            <div className="space-y-1">
              <div className="text-xs text-slate-400">Accumulated Mined Balance:</div>
              <div className="text-2xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight break-words">
                {minedAethel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 ml-2">AETHEL</span>
              </div>
              <div className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 pt-0.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>≈ ${usdtEquivalent} USDT Equivalent</span>
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
                <span>Your Daily Mining Cap:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${activeTier.dailyMiningCapUSDT.toFixed(2)} USDT / day
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              *Daily mining caps are governed by your active referral tier. Invite peers to unlock up to $500.00 USDT daily capacity.
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
                className="min-h-[44px] sm:min-h-0 text-xs font-semibold px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors shrink-0"
              >
                Upgrade Tier
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Invite 12 more colleagues to reach Platinum Tier and raise your daily simulated mining cap to the maximum $500.00 USDT per day.
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
