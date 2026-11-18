import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CheckSquare,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowDownLeft,
  Search,
  Clock,
  CheckCircle2,
  Smartphone,
  Building2,
  Sprout,
  Briefcase,
  CalendarCheck,
  Wallet,
} from 'lucide-react';
import {
  INITIAL_TASKS,
  REFERRAL_TIERS,
  TOKEN_PRICE_USDT,
  type UserFintechState,
} from '../../lib/fintechData.ts';
import { api } from '../../lib/api.ts';
import type { TaskCategory, TaskItem } from '../../types/index.ts';
import { TaskExecutionModal } from './TaskExecutionModal.tsx';
import { SimulatedInvestModal } from './SimulatedInvestModal.tsx';
import { DepositModal } from './DepositModal.tsx';
import { WithdrawModal } from './WithdrawModal.tsx';

interface ClientDashboardProps {
  onNavigate?: (view: string) => void;
  initialTab?: string;
  fintechState: UserFintechState;
  onUpdateFintechState: React.Dispatch<React.SetStateAction<UserFintechState>>;
  cloudLoaded: boolean;
}

const MAX_CYCLE_SECONDS = 86400; // 24 Hours

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  initialTab = 'dashboard',
  fintechState,
  onUpdateFintechState,
  cloudLoaded,
}) => {
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState<string>(initialTab);
  const [selectedInvestTerm, setSelectedInvestTerm] = useState<number>(12);

  // Task Feed Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeTaskModal, setActiveTaskModal] = useState<TaskItem | null>(null);
  const [investModalOpen, setInvestModalOpen] = useState<boolean>(false);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveNav(initialTab);
  }, [initialTab]);

  // Keep live mining timer and AETHEL balance ticking on the dashboard
  useEffect(() => {
    if (!fintechState.mining.isMining) return;
    if (fintechState.mining.sessionElapsedSeconds >= MAX_CYCLE_SECONDS) return;

    const interval = setInterval(() => {
      onUpdateFintechState((prev) => {
        if (!prev.mining.isMining || prev.mining.sessionElapsedSeconds >= MAX_CYCLE_SECONDS) {
          return prev;
        }
        const nextElapsed = Math.min(prev.mining.sessionElapsedSeconds + 1, MAX_CYCLE_SECONDS);
        const increment = 0.045;
        const nextAethel = prev.aethelBalance + increment;
        return {
          ...prev,
          aethelBalance: nextAethel,
          mining: {
            ...prev.mining,
            sessionElapsedSeconds: nextElapsed,
            sessionMinedAethel: prev.mining.sessionMinedAethel + increment,
            totalMinedAethel: nextAethel,
            isMining: nextElapsed < MAX_CYCLE_SECONDS,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fintechState.mining.isMining, fintechState.mining.sessionElapsedSeconds >= MAX_CYCLE_SECONDS, onUpdateFintechState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Task Completion handler
  const handleTaskComplete = (taskId: string, rewardUSDT: number, rewardAethel: number) => {
    onUpdateFintechState((prev) => {
      const nextTasksCount = prev.tasksCompletedCount + 1;
      const nextSampleBalance = prev.sampleBalanceUSDT + rewardUSDT;
      const nextAethelBalance = prev.aethelBalance + rewardAethel;
      const nextCompletedIds = prev.completedTaskIds.includes(taskId)
        ? prev.completedTaskIds
        : [...prev.completedTaskIds, taskId];

      const nextState: UserFintechState = {
        ...prev,
        tasksCompletedCount: nextTasksCount,
        sampleBalanceUSDT: nextSampleBalance,
        aethelBalance: nextAethelBalance,
        completedTaskIds: nextCompletedIds,
      };
      if (user && cloudLoaded) {
        api.saveUserFintechStateToCloud(nextState).catch(console.error);
      }
      return nextState;
    });

    showToast(`Task verified! +$${rewardUSDT.toFixed(2)} USDT & +${rewardAethel} AETHEL credited.`);
  };

  // Investment Success Handler
  const handleInvestSuccess = (amountUSD: number, termWeeks: number = 12) => {
    onUpdateFintechState((prev) => {
      const nextState: UserFintechState = {
        ...prev,
        sampleBalanceUSDT: Math.max(0, prev.sampleBalanceUSDT - amountUSD),
        investedBalanceUSDT: prev.investedBalanceUSDT + amountUSD,
      };
      if (user && cloudLoaded) {
        api.saveUserFintechStateToCloud(nextState).catch(console.error);
      }
      return nextState;
    });

    showToast(`$${amountUSD.toLocaleString()} USD invested in ${termWeeks}-Week Term! Accruing 2.0% weekly yield.`);
  };

  const categories: (string | TaskCategory)[] = [
    'All',
    'Rate Apps',
    'Business & Hotel Recommendations',
    'Agriculture Surveys',
    'Remote Job Applications',
    'Daily Check-in',
  ];

  const filteredTasks = INITIAL_TASKS.filter((task) => {
    const matchesCategory =
      selectedCategory === 'All' ? true : task.category === selectedCategory;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeIcon = (category: TaskCategory) => {
    switch (category) {
      case 'Rate Apps':
        return <Smartphone className="w-3.5 h-3.5 text-teal-500" />;
      case 'Business & Hotel Recommendations':
        return <Building2 className="w-3.5 h-3.5 text-teal-500" />;
      case 'Agriculture Surveys':
        return <Sprout className="w-3.5 h-3.5 text-teal-500" />;
      case 'Remote Job Applications':
        return <Briefcase className="w-3.5 h-3.5 text-teal-500" />;
      case 'Daily Check-in':
        return <CalendarCheck className="w-3.5 h-3.5 text-teal-500" />;
    }
  };

  const remainingActiveTasks = Math.max(0, INITIAL_TASKS.length - fintechState.completedTaskIds.length);
  const elapsedSeconds = fintechState.mining.sessionElapsedSeconds;
  const isCycleExpired = elapsedSeconds >= MAX_CYCLE_SECONDS;
  const isMiningActive = fintechState.mining.isMining && !isCycleExpired;
  const remainingSeconds = Math.max(0, MAX_CYCLE_SECONDS - elapsedSeconds);
  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minutesLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secondsLeft = remainingSeconds % 60;
  const cycleCountdown = `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  const activeTier =
    REFERRAL_TIERS.find(
      (t) =>
        fintechState.referralsCount >= t.minReferrals &&
        (t.maxReferrals === null || fintechState.referralsCount <= t.maxReferrals)
    ) || REFERRAL_TIERS[0];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Main Content Viewport */}
      <main className="w-full min-w-0 px-4 sm:px-8 py-6 sm:py-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Section Heading for Secondary Views */}
        {activeNav !== 'dashboard' && (
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeNav === 'tasks'
                ? 'Task Marketplace'
                : activeNav === 'invest'
                ? 'My Investments'
                : activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
            </h1>
          </div>
        )}

        {/* 1. STREAMLINED HOMEPAGE DASHBOARD (Exact 4 Cards Top-to-Bottom) */}
        {activeNav === 'dashboard' && (
          <div className="max-w-3xl mx-auto flex flex-col space-y-4">
            {/* 1. Balance Card */}
            <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Balance</span>
                <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400 font-semibold">USDT</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white break-words">
                ${fintechState.sampleBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Active Yield Allocation</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  +${fintechState.investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </section>

            {/* 2. Tasks Completed Card */}
            <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Tasks Completed</span>
                <CheckSquare className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {fintechState.tasksCompletedCount}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Remaining Active</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {remainingActiveTasks} available
                </span>
              </div>
            </section>

            {/* 3. Aethel Balance (Mining) Card */}
            <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-teal-500" />
                    <span>Aethel Balance (Mining)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-teal-600 dark:text-teal-400">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMiningActive ? 'bg-emerald-500 animate-pulse' : isCycleExpired ? 'bg-teal-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{isMiningActive ? 'Active' : isCycleExpired ? 'Cycle Complete' : 'Paused'}</span>
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                  {fintechState.aethelBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">AETHEL</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                  ≈ ${(fintechState.aethelBalance * TOKEN_PRICE_USDT).toFixed(2)} USDT (${TOKEN_PRICE_USDT}/token)
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[11px] text-slate-400">Mining Engine</div>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {isMiningActive ? 'Running' : isCycleExpired ? 'Completed' : 'Paused'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Hash Rate</div>
                  <div className="font-mono font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                    {fintechState.mining.hashRate.toFixed(2)} TH/s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Cycle Countdown</div>
                  <div className="font-mono font-bold tabular-nums text-slate-900 dark:text-white mt-0.5">
                    {cycleCountdown}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Referrals Card (Strictly Last Item at Bottom) */}
            <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Referrals</span>
                <Users className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {fintechState.referralsCount}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                  {activeTier.name} ({(activeTier.commissionRate * 100).toFixed(0)}% Task Comm.)
                </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  ${activeTier.dailyMiningCapUSDT.toFixed(0)} USDT/day cap
                </span>
              </div>
            </section>
          </div>
        )}

        {/* 2. TASK MARKETPLACE (Accessed via Hamburger Menu -> Tasks) */}
        {activeNav === 'tasks' && (
          <section className="space-y-6 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Available Task Marketplace</span>
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({filteredTasks.length} listings)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete app ratings, location evaluations, surveys, and applications to earn immediate rewards.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Interactive Category Filter Tabs (Requirement: Organized in tabs/categories) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs max-w-full">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Task Card Grid (Requirement: title, short description, sample reward, estimated time, difficulty, and a "Start" button) */}
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-400">
                  No tasks found in category "{selectedCategory}". Select "All" or refine your search query.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((task) => {
                  const isCompleted = fintechState.completedTaskIds.includes(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isCompleted
                          ? 'border-emerald-300 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Category Badge & Difficulty */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                            {getCategoryBadgeIcon(task.category)}
                            <span className="text-[11px] truncate max-w-[140px]">{task.category}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {task.difficulty}
                          </span>
                        </div>

                        {/* Task Title & Description */}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Metadata: Est. Time & Reward */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.estimatedTime}</span>
                          </div>

                          <div className="font-mono tabular-nums font-bold text-teal-600 dark:text-teal-400 text-sm">
                            +${task.rewardUSDT.toFixed(2)} <span className="text-xs text-slate-400">USDT</span>
                          </div>
                        </div>
                      </div>

                      {/* Start / Completed Button */}
                      <div className="pt-2">
                        {isCompleted ? (
                          <div className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Task completed (demo)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTaskModal(task)}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 group"
                          >
                            <span>Start Task</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Invest Now Dedicated View (Rates, Horizons & Portfolios) */}
        {activeNav === 'invest' && (
          <section className="space-y-8 animate-fade-in">
            {/* Investment Hero Banner */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 text-white border border-blue-800/40 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Audited 2.0% Weekly Term Returns</span>
                </div>
                
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Institutional Capital Growth & Arbitrage Horizons
                </h2>
                
                <p className="text-sm text-slate-300 leading-relaxed">
                  Allocate capital into risk-neutral market-making liquidity pools and quantitative arbitrage corridors. Weekly accrued profits (2.0%/wk) are liquid and distributed every 7 days directly to your Available Balance.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedInvestTerm(12);
                      setInvestModalOpen(true);
                    }}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>INVEST NOW</span>
                  </button>
                  <button
                    onClick={() => setDepositModalOpen(true)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-teal-400" />
                    <span>Deposit Funds</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Available to Invest</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  ${fintechState.sampleBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400">Liquid capital ready for deployment</div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Invested</div>
                <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                  ${fintechState.investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Locked in term contracts</div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Weekly Run Rate (2.0%)</div>
                <div className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  +${(fintechState.investedBalanceUSDT * 0.02).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">Per 7-day accrual distribution</div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accrual Status</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Audited</span>
                </div>
                <div className="text-[11px] text-slate-400">Discretionary trading verified</div>
              </div>
            </div>

            {/* Investment Term Horizon Plans */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Available Term Horizons & Rate Tiers
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your preferred capital lock duration and automatic weekly disbursement schedule.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 12-Week */}
                <div className="p-6 rounded-2xl border-2 border-blue-500/80 bg-white dark:bg-slate-900 shadow-lg relative flex flex-col justify-between space-y-5">
                  <div className="absolute -top-3 right-5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] uppercase">
                    Most Popular
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Standard Term
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      12 Weeks (84 Days)
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Weekly Rate:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">2.0% Weekly</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Term Yield:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">24.0% Total</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Minimum Capital:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">$100 USD</span>
                      </div>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Weekly automated liquid earnings distribution</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Principal returned in full at 84-day maturity</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Eligible for reinvestment and compounding</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvestTerm(12);
                      setInvestModalOpen(true);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Invest 12-Week (2.0%/wk)</span>
                  </button>
                </div>

                {/* 24-Week */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      Strategic Term
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      24 Weeks (168 Days)
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Weekly Rate:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">2.0% Weekly</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Term Yield:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">48.0% Total</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Minimum Capital:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">$500 USD</span>
                      </div>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span>Priority compliance processing on withdrawals</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span>Extended algorithmic market-making liquidity</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span>Quarterly comprehensive CPA audit ledger</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvestTerm(24);
                      setInvestModalOpen(true);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span>Invest 24-Week (2.0%/wk)</span>
                  </button>
                </div>

                {/* 48-Week */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      Sovereign Horizon
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      48 Weeks (336 Days)
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Weekly Rate:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">2.0% Weekly</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Term Yield:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">96.0% Total</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Minimum Capital:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">$1,000 USD</span>
                      </div>
                    </div>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Dedicated multi-party cold vault custody</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Maximum annual yield horizon (96.0%)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Direct institutional concierge assistance</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInvestTerm(48);
                      setInvestModalOpen(true);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-purple-500 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                    <span>Invest 48-Week (2.0%/wk)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Investments Ledger */}
            <div className="w-full max-w-full p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Active Investment Positions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time status of your term holdings and weekly accrual calendar.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedInvestTerm(12);
                    setInvestModalOpen(true);
                  }}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs uppercase flex items-center justify-center gap-1 hover:bg-blue-500 cursor-pointer shrink-0"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>New Investment</span>
                </button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Contract Ref</th>
                      <th className="px-4 py-3">Term Horizon</th>
                      <th className="px-4 py-3">Principal (USD)</th>
                      <th className="px-4 py-3">Weekly Accrual (2%)</th>
                      <th className="px-4 py-3">Next Distribution</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 font-bold text-blue-600 dark:text-blue-400">AC-INV-8921-A</td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">12 Weeks (Standard)</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        ${fintechState.investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 text-emerald-600 font-bold">
                        +${(fintechState.investedBalanceUSDT * 0.02).toFixed(2)} / wk
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">Sunday 00:00 UTC</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Accruing 2.0%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Other Nav Tab Views (Wallet, History, Support, Settings) */}
        {activeNav === 'wallet' && (
          <section className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-teal-500" />
                  <span>Cryptocurrency Custody & Ledger</span>
                </h3>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  ${fintechState.sampleBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT Available
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deposit digital assets or execute audited withdrawals directly to external Web3 cold-storage addresses.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                <button
                  onClick={() => setDepositModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500 cursor-pointer"
                >
                  New Deposit
                </button>
                <button
                  onClick={() => setWithdrawModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Request Withdrawal
                </button>
              </div>
            </div>
          </section>
        )}

        {activeNav === 'history' && (
          <section className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Activity & Verification History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit trail of tasks submitted, simulated yield allocations, and deposit confirmations.
            </p>
            <div className="text-xs font-mono space-y-2 text-slate-500">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span>Task Completed: Autonomous Drone Soil Moisture Survey</span>
                <span className="text-teal-600 font-bold shrink-0">+$8.50 USDT · +150 AETHEL</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span>Daily Check-in Streak Day 6</span>
                <span className="text-teal-600 font-bold shrink-0">+$1.50 USDT · +25 AETHEL</span>
              </div>
            </div>
          </section>
        )}

        {activeNav === 'support' && (
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Platform Support & Ticket Desk
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need assistance with task validation or withdrawal review? Our 24/7 compliance desk is active.
            </p>
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900/50 text-xs text-slate-700 dark:text-slate-300">
              Direct Inquiries: <span className="font-mono font-bold text-teal-600">support@aethelgard.io</span>
            </div>
          </section>
        )}

        {activeNav === 'settings' && (
          <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Account Security & Compliance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Two-Factor Authentication is currently enabled on your account.
            </p>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200">2-Factor Authentication (2FA)</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-[10px]">
                ACTIVE
              </span>
            </div>
          </section>
        )}
      </main>

      {/* Task Execution Interactive Modal */}
      {activeTaskModal && (
        <TaskExecutionModal
          task={activeTaskModal}
          isOpen={!!activeTaskModal}
          onClose={() => setActiveTaskModal(null)}
          onComplete={handleTaskComplete}
        />
      )}

      {/* Required Single, Secondary "Invest" Simulated Panel / Modal */}
      <SimulatedInvestModal
        isOpen={investModalOpen}
        onClose={() => setInvestModalOpen(false)}
        availableBalanceUSD={fintechState.sampleBalanceUSDT}
        onInvestSuccess={handleInvestSuccess}
        initialTermWeeks={selectedInvestTerm}
      />

      {/* Deposit & Withdraw Modals */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          setDepositModalOpen(false);
          showToast('Deposit record logged. Blockchain verification queue active.');
        }}
      />

      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        availableBalanceUSD={fintechState.sampleBalanceUSDT}
        onSuccess={() => {
          setWithdrawModalOpen(false);
          api.getUserFintechStateFromCloud().then((cloud) => {
            if (cloud) {
              onUpdateFintechState((prev) => ({ ...prev, ...cloud }));
            }
          }).catch(console.error);
          showToast('Withdrawal submitted for compliance review.');
        }}
      />
    </div>
  );
};
