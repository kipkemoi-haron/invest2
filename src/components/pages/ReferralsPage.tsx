import React, { useState } from 'react';
import { Copy, Check, Users, Sparkles, TrendingUp, Share2, Award, Search, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { INITIAL_INVITED_FRIENDS, REFERRAL_TIERS, type UserFintechState } from '../../lib/fintechData.ts';

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

  const referralCode = 'AETH-9821';
  const referralLink = `https://aethelgard.io/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentReferrals = fintechState.referralsCount;
  const activeTier = REFERRAL_TIERS.find(
    (t) =>
      currentReferrals >= t.minReferrals &&
      (t.maxReferrals === null || currentReferrals <= t.maxReferrals)
  ) || REFERRAL_TIERS[0];

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
            <span className="text-xs text-slate-500 font-mono">Multi-Tier Revenue Share</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Referrals & Peer Network
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Invite colleagues, traders, and data evaluators. Earn direct cash commissions on their completed tasks and expand your daily AETHEL computational mining cap up to 500 USDT/day.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('mining')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-teal-500" />
            <span>Check Mining Cap</span>
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
              Share and Earn Up to 18% Task Commissions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              New users get a welcome streak bonus and instant access to all task categories.
            </p>
          </div>

          {/* Copy Link Input Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 min-w-0 min-h-[44px] flex items-center px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">
              <span className="truncate">{referralLink}</span>
            </div>
            <button
              onClick={handleCopy}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
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
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Earn cryptocurrency rewards evaluating apps and running simulated AETHEL mining on Aethelgard: ${referralLink}`)}`, '_blank')}
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Twitter / X
            </button>
            <button
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join Aethelgard digital asset task and mining platform!')}`, '_blank')}
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              Telegram
            </button>
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out Aethelgard: ${referralLink}`)}`, '_blank')}
              className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              WhatsApp
            </button>
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
              11 currently mining
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Commission Earned</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              $342.80
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
              USDT paid to date
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
              {(activeTier.commissionRate * 100).toFixed(0)}% task commission
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-500" />
              <span>Mining Cap</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
              ${activeTier.dailyMiningCapUSDT}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              USDT daily capacity
            </div>
          </div>
        </div>
      </div>

      {/* Sample Bonus Tiers Cards (Requirement: sample bonus tiers) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Referral Bonus Tiers & Milestone Rewards
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Progress through referral tiers to elevate your computational mining capacity and peer commission share.
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
                    : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {tier.maxReferrals === null
                        ? `${tier.minReferrals}+ Referrals`
                        : `${tier.minReferrals} – ${tier.maxReferrals} Referrals`}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Commission:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{(tier.commissionRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 text-[11px]">Daily Cap:</span>
                      <span className="font-bold text-slate-900 dark:text-white">${tier.dailyMiningCapUSDT} USDT</span>
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

      {/* Invited Friends Table (Requirement: invited-friends table) */}
      <div className="w-full max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm space-y-0">
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Invited Network Members ({INITIAL_INVITED_FRIENDS.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tracking of tasks evaluated and commissions generated by your referral tree.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-52">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search friend..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              {(['all', 'active', 'idle'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-lg font-medium transition-colors ${
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
                <th className="py-3 px-6">Tasks Done</th>
                <th className="py-3 px-6">Mining Status</th>
                <th className="py-3 px-6 text-right">Commission Earned</th>
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
                    <td className="py-3.5 px-6 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {f.tasksCompleted} tasks
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
