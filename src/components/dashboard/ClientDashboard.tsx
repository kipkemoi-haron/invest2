import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  CheckSquare,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Clock,
  CheckCircle2,
  Smartphone,
  Building2,
  Sprout,
  Briefcase,
  CalendarCheck,
  Wallet,
  Lock,
  Play,
  RotateCcw,
  X,
  ChevronRight,
  Tv,
  Laptop,
  Youtube,
  Video,
  ThumbsUp,
  Instagram,
} from 'lucide-react';
import {
  INITIAL_TASKS,
  UPCOMING_TASK_CATEGORIES,
  REFERRAL_TIERS,
  TOKEN_PRICE_USDT,
  MAX_MINING_SECONDS,
  CYCLE_DURATION_SECONDS,
  AETHEL_PER_SECOND,
  formatMiningTimer,
  computeLockedTaskBalanceUSDT,
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

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onNavigate,
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

  // Dashboard Clickable Card Modals
  const [balanceModalOpen, setBalanceModalOpen] = useState<boolean>(false);
  const [tasksOverviewModalOpen, setTasksOverviewModalOpen] = useState<boolean>(false);
  const [tasksOverviewTab, setTasksOverviewTab] = useState<'pending' | 'completed' | 'upcoming'>('pending');
  const [miningModalOpen, setMiningModalOpen] = useState<boolean>(false);
  const [taskWithdrawNotice, setTaskWithdrawNotice] = useState<boolean>(false);
  const [miningWithdrawNotice, setMiningWithdrawNotice] = useState<boolean>(false);

  // Action Modals
  const [activeTaskModal, setActiveTaskModal] = useState<TaskItem | null>(null);
  const [investModalOpen, setInvestModalOpen] = useState<boolean>(false);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Wall-clock tick for real-time 00:00:01 -> 23:59:59 mining counter
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    setActiveNav(initialTab);
  }, [initialTab]);

  // Real-time wall-clock mining counter (00:00:01 -> 23:59:59, then closes after 24h)
  const { isMining, sessionStartedAt, sessionClosed } = fintechState.mining;

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
          const nextState: UserFintechState = {
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
          if (user && cloudLoaded) {
            api.saveUserFintechStateToCloud(nextState).catch(console.error);
          }
          return nextState;
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
  }, [isMining, sessionStartedAt, user, cloudLoaded, onUpdateFintechState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Start or Restart 24-Hour Mining Session (00:00:01 -> 23:59:59)
  const handleStartOrRestartMining = () => {
    const startedAt = Date.now() - 1000; // Immediately starts at 00:00:01
    setNowMs(Date.now());
    const wasClosed = isCycleClosed;
    onUpdateFintechState((prev) => {
      const nextState: UserFintechState = {
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
      };
      if (user && cloudLoaded) {
        api.saveUserFintechStateToCloud(nextState).catch(console.error);
      }
      return nextState;
    });
    showToast(
      wasClosed
        ? '24-Hour mining restarted at 00:00:01. Balance remains locked awaiting KYC.'
        : 'Mining started at 00:00:01! Session closes automatically after 23:59:59.'
    );
  };

  // Task Completion handler (credits Locked Task Funds awaiting KYC, NOT deposited/invested Balance)
  const handleTaskComplete = (taskId: string, rewardUSDT: number, rewardAethel: number) => {
    onUpdateFintechState((prev) => {
      const alreadyDone = prev.completedTaskIds.includes(taskId);
      const nextTasksCount = alreadyDone ? prev.tasksCompletedCount : prev.tasksCompletedCount + 1;
      const nextLockedTaskBalance = alreadyDone
        ? computeLockedTaskBalanceUSDT(prev.completedTaskIds, prev.taskLockedBalanceUSDT)
        : computeLockedTaskBalanceUSDT(prev.completedTaskIds, prev.taskLockedBalanceUSDT) + rewardUSDT;
      const nextAethelBalance = alreadyDone ? prev.aethelBalance : prev.aethelBalance + rewardAethel;
      const nextCompletedIds = alreadyDone
        ? prev.completedTaskIds
        : [...prev.completedTaskIds, taskId];

      const nextState: UserFintechState = {
        ...prev,
        tasksCompletedCount: nextTasksCount,
        taskLockedBalanceUSDT: nextLockedTaskBalance,
        aethelBalance: nextAethelBalance,
        completedTaskIds: nextCompletedIds,
      };
      if (user && cloudLoaded) {
        api.saveUserFintechStateToCloud(nextState).catch(console.error);
      }
      return nextState;
    });

    showToast(
      `Task verified! +$${rewardUSDT.toFixed(2)} USDT added to Locked Funds (awaiting KYC).`
    );
  };

  // Investment Success Handler — increases invested balance (and total balance reflects deposited + invested)
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

    showToast(
      `$${amountUSD.toLocaleString()} USD invested in ${termWeeks}-Week Term! Accruing 2.0% weekly yield.`
    );
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

  const getUpcomingIcon = (id: string) => {
    switch (id) {
      case 'upcoming-watch-ads':
        return <Tv className="w-4 h-4 text-amber-500" />;
      case 'upcoming-freelancing':
        return <Laptop className="w-4 h-4 text-amber-500" />;
      case 'upcoming-youtube':
        return <Youtube className="w-4 h-4 text-amber-500" />;
      case 'upcoming-tiktok':
        return <Video className="w-4 h-4 text-amber-500" />;
      case 'upcoming-facebook':
        return <ThumbsUp className="w-4 h-4 text-amber-500" />;
      case 'upcoming-instagram':
        return <Instagram className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  // Financial & Task Computations
  const depositedBalanceUSDT = fintechState.sampleBalanceUSDT;
  const investedBalanceUSDT = fintechState.investedBalanceUSDT;
  const totalBalanceUSDT = depositedBalanceUSDT + investedBalanceUSDT;

  const completedTasksList = INITIAL_TASKS.filter((t) =>
    fintechState.completedTaskIds.includes(t.id)
  );
  const pendingTasksList = INITIAL_TASKS.filter(
    (t) => !fintechState.completedTaskIds.includes(t.id)
  );
  const lockedTaskBalanceUSDT = computeLockedTaskBalanceUSDT(
    fintechState.completedTaskIds,
    fintechState.taskLockedBalanceUSDT
  );

  // Real-time mining timer computations (00:00:01 -> 23:59:59)
  const rawElapsed =
    isMining && sessionStartedAt
      ? Math.max(1, Math.floor((nowMs - sessionStartedAt) / 1000))
      : fintechState.mining.sessionElapsedSeconds;

  const isCycleClosed = Boolean(sessionClosed) || rawElapsed >= CYCLE_DURATION_SECONDS;
  const isMiningActive = isMining && !isCycleClosed;
  const displayElapsed = isCycleClosed
    ? MAX_MINING_SECONDS
    : isMiningActive
    ? Math.min(MAX_MINING_SECONDS, Math.max(1, rawElapsed))
    : 0;
  const miningTimerDisplay = formatMiningTimer(displayElapsed);
  const miningProgressPercent = Math.min(100, (displayElapsed / MAX_MINING_SECONDS) * 100);

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

        {/* 1. STREAMLINED HOMEPAGE DASHBOARD */}
        {activeNav === 'dashboard' && (
          <div className="max-w-3xl mx-auto flex flex-col space-y-4">
            {/* 1. Clickable Balance Card */}
            <button
              type="button"
              onClick={() => setBalanceModalOpen(true)}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/60 dark:hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-teal-500" />
                  <span>Balance</span>
                </span>
                <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                  USDT
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white break-words">
                ${totalBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs">
                <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <span>Manage Funds</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>

            {/* 2. Clickable Tasks Card */}
            <button
              type="button"
              onClick={() => {
                setTasksOverviewTab('pending');
                setTaskWithdrawNotice(false);
                setTasksOverviewModalOpen(true);
              }}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/60 dark:hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-teal-500" />
                  <span>Tasks</span>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                  {completedTasksList.length}
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Done</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs">
                <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <span>Open Tasks</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>

            {/* 3. Clickable Mining Card */}
            <button
              type="button"
              onClick={() => {
                setMiningWithdrawNotice(false);
                setMiningModalOpen(true);
              }}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/60 dark:hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-teal-500" />
                  <span>Mining</span>
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {fintechState.aethelBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">AETHEL</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs">
                <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <span>Open Mining</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>

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
            {/* Task Balance Banner with Withdraw to Balance */}
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Task Balance</div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                    ${lockedTaskBalanceUSDT.toFixed(2)} <span className="text-xs text-teal-600 dark:text-teal-400">USDT</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTaskWithdrawNotice(true)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdraw to Balance</span>
                </button>
              </div>
              {taskWithdrawNotice && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Awaiting KYC (coming soon)</span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Available Task Marketplace</span>
                  <span className="text-xs font-mono font-normal text-slate-400">
                    ({filteredTasks.length} listings)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete app ratings, location evaluations, surveys, and applications to earn task rewards.
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

            {/* Interactive Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs max-w-full">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
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

            {/* Task Card Grid */}
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
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                            {getCategoryBadgeIcon(task.category)}
                            <span className="text-[11px] truncate max-w-[140px]">{task.category}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {task.difficulty}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-1">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

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

                      <div className="pt-2">
                        {isCompleted ? (
                          <div className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Completed · Awaiting KYC</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTaskModal(task)}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 group cursor-pointer"
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

            {/* Upcoming Earning Categories (Coming Soon) */}
            <div className="pt-4 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Upcoming Task Streams</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase">
                    Coming Soon
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  New media, social review, and freelance task streams launching soon.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {UPCOMING_TASK_CATEGORIES.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {getUpcomingIcon(item.id)}
                          <span>{item.title}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Est. Reward</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{item.estimatedReward}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Balance</span>
                  <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                    ${totalBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Invested Amount</span>
                  <span className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                    ${investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdraw</span>
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
          api.getUserFintechStateFromCloud().then((cloud) => {
            if (cloud) {
              onUpdateFintechState((prev) => ({ ...prev, ...cloud }));
            }
          }).catch(console.error);
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

      {/* 1. Balance Breakdown Modal (Deposited + Invested + Deposit/Withdraw Actions) */}
      {balanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Balance
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBalanceModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close balance modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                  Total Balance
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums">
                  ${totalBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-sm font-semibold text-teal-400">USDT</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Deposited Balance</span>
                  <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    ${depositedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Invested Amount</span>
                  <div className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                    ${investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setBalanceModalOpen(false);
                    setDepositModalOpen(true);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Deposit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBalanceModalOpen(false);
                    setWithdrawModalOpen(true);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tasks Overview Modal (Completed, Not Yet Done, Upcoming + Awaiting KYC) */}
      {tasksOverviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Tasks
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTasksOverviewModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close tasks overview modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Task Balance Card + Withdraw to Balance */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Task Balance</div>
                    <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                      ${lockedTaskBalanceUSDT.toFixed(2)} <span className="text-xs text-teal-600 dark:text-teal-400">USDT</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTaskWithdrawNotice(true)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Withdraw to Balance</span>
                  </button>
                </div>
                {taskWithdrawNotice && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Awaiting KYC (coming soon)</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTasksOverviewTab('pending')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tasksOverviewTab === 'pending'
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Available ({pendingTasksList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTasksOverviewTab('completed')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tasksOverviewTab === 'completed'
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Completed ({completedTasksList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTasksOverviewTab('upcoming')}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tasksOverviewTab === 'upcoming'
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Upcoming ({UPCOMING_TASK_CATEGORIES.length})
                </button>
              </div>

              {/* Tab Panels */}
              {tasksOverviewTab === 'completed' && (
                <div className="space-y-2.5">
                  {completedTasksList.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      No tasks completed yet.
                    </div>
                  ) : (
                    completedTasksList.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {getCategoryBadgeIcon(task.category)}
                            <span>{task.category}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right font-mono">
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              +${task.rewardUSDT.toFixed(2)} USDT
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tasksOverviewTab === 'pending' && (
                <div className="space-y-2.5">
                  {pendingTasksList.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                      All currently listed tasks have been completed! Check Upcoming streams for new releases.
                    </div>
                  ) : (
                    pendingTasksList.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {getCategoryBadgeIcon(task.category)}
                            <span>{task.category}</span>
                            <span>·</span>
                            <span className="font-mono">{task.estimatedTime}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                            +${task.rewardUSDT.toFixed(2)} USDT
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTasksOverviewModalOpen(false);
                              setActiveTaskModal(task);
                            }}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Start Task</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tasksOverviewTab === 'upcoming' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {UPCOMING_TASK_CATEGORIES.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                            {getUpcomingIcon(item.id)}
                            <span>{item.title}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Est. Payout</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.estimatedReward}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Mining Control Modal (00:00:01 -> 23:59:59 Real-Time Counter + Awaiting KYC) */}
      {miningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Mining
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMiningModalOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close mining modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Mining Balance Banner + Withdraw to Balance */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                      Mining Balance
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums mt-0.5">
                      {fintechState.aethelBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-sm text-teal-400">AETHEL</span>
                    </div>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">
                      ≈ ${(fintechState.aethelBalance * TOKEN_PRICE_USDT).toFixed(2)} USDT
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMiningWithdrawNotice(true)}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Withdraw to Balance</span>
                  </button>
                </div>
                {miningWithdrawNotice && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Awaiting KYC (coming soon)</span>
                  </div>
                )}
              </div>

              {/* Real-Time Timer & Progress */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-500" />
                    <span>24H Cycle Counter (00:00:01 → 23:59:59)</span>
                  </span>
                  <span
                    className={`font-mono font-bold text-[11px] ${
                      isMiningActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isCycleClosed
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isMiningActive ? 'ACTIVE' : isCycleClosed ? 'CLOSED (24H COMPLETE)' : 'READY'}
                  </span>
                </div>

                <div className="text-3xl font-extrabold font-mono tabular-nums text-center py-2 text-slate-900 dark:text-white tracking-wider">
                  {miningTimerDisplay}
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${miningProgressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Hash Rate: {fintechState.mining.hashRate.toFixed(2)} TH/s</span>
                  <span>Session Mined: +{fintechState.mining.sessionMinedAethel.toFixed(2)} AETHEL</span>
                </div>
              </div>

              {/* Primary Mining Button */}
              <div className="space-y-2.5">
                {isCycleClosed ? (
                  <button
                    type="button"
                    onClick={handleStartOrRestartMining}
                    className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart 24H Mining Cycle (00:00:01)</span>
                  </button>
                ) : isMiningActive ? (
                  <div className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Mining Active ({miningTimerDisplay} / 23:59:59) — Auto-closes after 24H</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartOrRestartMining}
                    className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Mining (00:00:01 → 23:59:59)</span>
                  </button>
                )}

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      setMiningModalOpen(false);
                      onNavigate('mining');
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Full Mining Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
