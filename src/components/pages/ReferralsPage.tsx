import React, { useState } from 'react';
import { Copy, Check, Users, TrendingUp, Award, Search, Zap, Calculator } from 'lucide-react';
import {
  INITIAL_INVITED_FRIENDS,
  REFERRAL_TIERS,
  REFERRAL_INVESTMENT_COMMISSION_RATE,
  getReferralTierForCount,
  getNextReferralTier,
  type UserFintechState,
} from '../../lib/fintechData.ts';

interface ReferralsPageProps {
  fintechState: UserFintechState;
  onNavigate: (view: string) => void;
}

export const ReferralsPage: React.FC<ReferralsPageProps> = ({
  fintechState,
  onNavigate,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'idle'>('all');
  const [sampleRefereeInvestStr, setSampleRefereeInvestStr] = useState<string>('5000');

  const referralCode = 'AETH-9821';
  const referralLink = `https://aethelgard.io/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentReferrals = fintechState.referralsCount;
  const activeTier = getReferralTierForCount(currentReferrals);
  const nextTier = getNextReferralTier(currentReferrals);

  const totalCommissionEarned = INITIAL_INVITED_FRIENDS.reduce(
    (sum, f) => sum + f.commissionEarnedUSDT,
    0
  );

  const sampleInvestAmount = Math.max(0, parseFloat(sampleRefereeInvestStr) || 0);
  const sampleCommissionEarned = sampleInvestAmount * REFERRAL_INVESTMENT_COMMISSION_RATE;

  const filteredFriends = INITIAL_INVITED_FRIENDS.filter((friend) => {
    const matchesSearch =
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.maskedEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? friend.miningActive
        : !friend.miningActive;
    return matchesSearch && matchesStatus;
  });

  const formatTierThreshold = (minReferrals: number, maxReferrals: number | null) => {
    if (minReferrals === 0 && maxReferrals === 0) {
      return '0–0 Referrals (Base)';
    }
    if (maxReferrals === null) {
      return `Unlocks at ${minReferrals}+ Referrals`;
    }
    return `Unlocks at ${minReferrals} Referrals (${minReferrals}–${maxReferrals})`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Network Scaling Program
            </span>
            <span className="text-slate-400 hidden sm:inline">·</span>
            <span className="text-xs text-slate-500 font-mono">1.5% Investment Commission + Mining Boosts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Referrals & Mining Rate Tiers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Earn a direct 1.5% commission on every investment made by your referred customers (e.g., $5,000 invested earns you $75.00 USDT) while unlocking faster AETHEL mining rates across Bronze, Silver, Gold, and Platinum tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('mining')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-teal-500" />
            <span>Open Mining Rate ({activeTier.miningRatePercent}%)</span>
          </button>
        </div>
      </div>

      {/* Top Referral Link & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Referral Link Card (7 cols) */}
        <div className="lg:col-span-7 min-w-0 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
          <div>
            <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
              Your Exclusive Referral Link
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Earn 1.5% on Referee Investments & Unlock Higher Mining Rates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Every verified referral counts toward unlocking higher mining speed multipliers and pays 1.5% commission on their invested capital.
            </p>
          </div>

          {/* Copy Link Input Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 min-w-0 min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">
              <span className="truncate">{referralLink}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Share Channels */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold text-slate-400">Quick Share:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Aethelgard for audited returns and AETHEL mining: ${referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center"
            >
              Twitter / X
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Aethelgard digital asset investment & mining platform!')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center"
            >
              Telegram
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out Aethelgard: ${referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors inline-flex items-center"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Overview Stats (5 cols) */}
        <div className="lg:col-span-5 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-500" />
              <span>Total Referrals</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {currentReferrals}
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400">
              {nextTier
                ? `${Math.max(0, nextTier.minReferrals - currentReferrals)} more for ${nextTier.name.split(' ')[0]}`
                : 'Maximum tier unlocked'}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Commission Earned</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              ${totalCommissionEarned.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
              1.5% on referee investments
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Current Tier</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {activeTier.name.split(' ')[0]}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              1.5% investment commission
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-500" />
              <span>Mining Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
              {activeTier.miningRatePercent}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              ${activeTier.dailyMiningCapUSDT} USDT/day cap
            </div>
          </div>
        </div>
      </div>

      {/* 1.5% Investment Commission Calculator */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span>1.5% Referral Investment Commission Calculator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              You earn 1.5% of the investment amount made by each referred customer (for example, $5,000 invested pays $75.00 USDT).
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold">
            Rate: 1.5% per Investment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Referred Customer Investment Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="100"
                value={sampleRefereeInvestStr}
                onChange={(e) => setSampleRefereeInvestStr(e.target.value)}
                className="w-full min-h-[44px] pl-8 pr-16 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-slate-400">
                USDT
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSampleRefereeInvestStr(val.toString())}
                  className={`px-3 py-1 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                    sampleInvestAmount === val
                      ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-700 dark:text-teal-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  ${val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Your 1.5% Referral Commission
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                ${sampleInvestAmount.toLocaleString()} × 1.5%
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              +${sampleCommissionEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-semibold ml-1">USDT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Tiers Unlocking Mining Rates */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Referral Tiers & Mining Rate Unlocks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Starter Tier (0–0) mines at the normal 100% rate. Unlock Bronze (10+), Silver (100+), Gold (250+), and Platinum (500+) to multiply your mining rate.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {REFERRAL_TIERS.map((tier) => {
            const isCurrent = activeTier.level === tier.level;
            const isUnlocked = activeTier.level >= tier.level;

            return (
              <div
                key={tier.level}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 shadow-md ring-2 ring-teal-500/20'
                    : isUnlocked
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      Tier {tier.level}
                    </span>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                        ACTIVE
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Locked</span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {tier.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {formatTierThreshold(tier.minReferrals, tier.maxReferrals)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Mining Rate:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        {tier.miningRatePercent}% {tier.level === 0 ? '(Normal)' : `(${tier.miningRateMultiplier}x)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Daily Cap:</span>
                      <span className="font-bold text-slate-900 dark:text-white">${tier.dailyMiningCapUSDT} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Inv. Comm.:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">1.5%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  {tier.perks[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invited Friends Table */}
      <div className="w-full max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm space-y-0">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Referred Customers & 1.5% Investment Commissions ({INITIAL_INVITED_FRIENDS.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tracking of referred customer investments and 1.5% commissions paid to your account.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-52">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              {(['all', 'active', 'idle'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'active' ? 'Mining' : 'Idle'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-6">Member Name</th>
                <th className="py-3 px-6">Masked Account</th>
                <th className="py-3 px-6">Join Date</th>
                <th className="py-3 px-6">Invested Amount</th>
                <th className="py-3 px-6">Mining Status</th>
                <th className="py-3 px-6 text-right">1.5% Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFriends.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredFriends.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                      {f.name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">
                      {f.maskedEmail}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400">
                      {f.joinedDate}
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                      ${f.investedAmountUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </td>
                    <td className="py-3.5 px-6">
                      {f.miningActive ? (
                        <span className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                          <span>Active 24h</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span>Standby</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      +${f.commissionEarnedUSDT.toFixed(2)} USDT
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
