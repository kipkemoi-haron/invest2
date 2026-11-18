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
  Unlock,
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
  Landmark,
} from 'lucide-react';
import {
  INITIAL_TASKS,
  UPCOMING_TASK_CATEGORIES,
  TOKEN_PRICE_USDT,
  MAX_MINING_SECONDS,
  CYCLE_DURATION_SECONDS,
  AETHEL_PER_SECOND,
  BASE_HASH_RATE_TH,
  INVESTMENT_24H_RATE,
  CYCLE_24H_MS,
  formatMiningTimer,
  formatCountdownTimer,
  computeLockedTaskBalanceUSDT,
  getReferralTierForCount,
  type InvestmentAccrualRecord,
  type UserFintechState,
} from '../../lib/fintechData.ts';
import { api } from '../../lib/api.ts';
import type { TaskCategory, TaskItem } from '../../types/index.ts';
import { TaskExecutionModal } from './TaskExecutionModal.tsx';
import { SimulatedInvestModal } from './SimulatedInvestModal.tsx';
import { DepositModal } from './DepositModal.tsx';
import { WithdrawModal } from './WithdrawModal.tsx';
import { BorrowModal } from './BorrowModal.tsx';

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

  const normalizeTab = (tab: string) => (tab === 'invest' ? 'wallet' : tab);
  const [activeNav, setActiveNav] = useState<string>(() => normalizeTab(initialTab));
  const [selectedInvestTerm, setSelectedInvestTerm] = useState<number>(12);

  // Task Feed Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dashboard Clickable Card Modals
  const [balanceModalOpen, setBalanceModalOpen] = useState<boolean>(false);
  const [tasksOverviewModalOpen, setTasksOverviewModalOpen] = useState<boolean>(false);
  const [tasksOverviewTab, setTasksOverviewTab] = useState<'pending' | 'completed' | 'upcoming'>('pending');
  const [miningModalOpen, setMiningModalOpen] = useState<boolean>(false);
  const [activeInvestedModalOpen, setActiveInvestedModalOpen] = useState<boolean>(false);
  const [unlockAmountStr, setUnlockAmountStr] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [taskWithdrawNotice, setTaskWithdrawNotice] = useState<boolean>(false);
  const [miningWithdrawNotice, setMiningWithdrawNotice] = useState<boolean>(false);

  // Action Modals
  const [activeTaskModal, setActiveTaskModal] = useState<TaskItem | null>(null);
  const [investModalOpen, setInvestModalOpen] = useState<boolean>(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState<boolean>(false);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Wall-clock tick for real-time 00:00:01 -> 23:59:59 mining counter & 24h investment countdown
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const activeTier = getReferralTierForCount(fintechState.referralsCount);
  const effectiveAethelPerSecond = AETHEL_PER_SECOND * activeTier.miningRateMultiplier;
  const effectiveHashRate = Number((BASE_HASH_RATE_TH * activeTier.miningRateMultiplier).toFixed(2));

  useEffect(() => {
    setActiveNav(normalizeTab(initialTab));
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
        const finalSessionMined = MAX_MINING_SECONDS * effectiveAethelPerSecond;
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
              hashRate: effectiveHashRate,
              dailyCapUSDT: activeTier.dailyMiningCapUSDT,
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
          const sessionMined = rawElapsed * effectiveAethelPerSecond;
          const total = base + sessionMined;
          return {
            ...prev,
            aethelBalance: total,
            mining: {
              ...prev.mining,
              sessionElapsedSeconds: rawElapsed,
              sessionMinedAethel: sessionMined,
              totalMinedAethel: total,
              hashRate: effectiveHashRate,
              dailyCapUSDT: activeTier.dailyMiningCapUSDT,
            },
          };
        });
      }
    };

    syncTick();
    const interval = setInterval(syncTick, 1000);
    return () => clearInterval(interval);
  }, [
    isMining,
    sessionStartedAt,
    effectiveAethelPerSecond,
    effectiveHashRate,
    activeTier.dailyMiningCapUSDT,
    user,
    cloudLoaded,
    onUpdateFintechState,
  ]);

  // Real-time 24-hour 2.0% investment accrual & live countdown tick
  useEffect(() => {
    if (fintechState.investedBalanceUSDT <= 0) return;

    const process24hAccrual = () => {
      const current = Date.now();
      setNowMs(current);

      const lastAt = fintechState.investmentLastAccrualAt;
      if (!lastAt) {
        onUpdateFintechState((prev) => {
          if (prev.investedBalanceUSDT <= 0 || prev.investmentLastAccrualAt) return prev;
          return {
            ...prev,
            investmentStartedAt: prev.investmentStartedAt ?? current,
            investmentLastAccrualAt: current,
          };
        });
        return;
      }

      const elapsed = current - lastAt;
      if (elapsed >= CYCLE_24H_MS) {
        const cycles = Math.min(365, Math.floor(elapsed / CYCLE_24H_MS));
        onUpdateFintechState((prev) => {
          if (prev.investedBalanceUSDT <= 0 || !prev.investmentLastAccrualAt) return prev;
          const prevLast = prev.investmentLastAccrualAt;
          const dueCycles = Math.min(365, Math.floor((current - prevLast) / CYCLE_24H_MS));
          if (dueCycles <= 0) return prev;

          let runningInvested = prev.investedBalanceUSDT;
          let addedTotal = 0;
          const newRecords: InvestmentAccrualRecord[] = [];
          const baseCycleNum = prev.investmentCycleCount || 0;

          for (let i = 1; i <= dueCycles; i++) {
            const inc = Math.round(runningInvested * INVESTMENT_24H_RATE * 100) / 100;
            const after = Math.round((runningInvested + inc) * 100) / 100;
            newRecords.unshift({
              id: `acc-${prevLast + i * CYCLE_24H_MS}`,
              cycleNumber: baseCycleNum + i,
              timestamp: prevLast + i * CYCLE_24H_MS,
              principalBaseUSDT: runningInvested,
              increaseAmountUSDT: inc,
              totalInvestedAfterUSDT: after,
            });
            runningInvested = after;
            addedTotal += inc;
          }

          const nextState: UserFintechState = {
            ...prev,
            investedBalanceUSDT: runningInvested,
            investmentLastAccrualAt: prevLast + dueCycles * CYCLE_24H_MS,
            investmentAccruedUSDT: Math.round(((prev.investmentAccruedUSDT || 0) + addedTotal) * 100) / 100,
            investmentCycleCount: baseCycleNum + dueCycles,
            investmentHistory: [...newRecords, ...(prev.investmentHistory || [])].slice(0, 50),
          };
          if (user && cloudLoaded) {
            api.saveUserFintechStateToCloud(nextState).catch(console.error);
          }
          return nextState;
        });
      }
    };

    process24hAccrual();
    const shouldTick = activeNav === 'wallet' || activeInvestedModalOpen;
    const interval = setInterval(process24hAccrual, shouldTick ? 1000 : 15000);
    return () => clearInterval(interval);
  }, [
    fintechState.investedBalanceUSDT,
    fintechState.investmentLastAccrualAt,
    activeNav,
    activeInvestedModalOpen,
    user,
    cloudLoaded,
    onUpdateFintechState,
  ]);

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
          sessionMinedAethel: effectiveAethelPerSecond,
          hashRate: effectiveHashRate,
          dailyCapUSDT: activeTier.dailyMiningCapUSDT,
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

  // Investment Success Handler — increases invested balance & initializes 24h cycle if needed
  const handleInvestSuccess = (amountUSD: number, termWeeks: number = 12) => {
    const now = Date.now();
    onUpdateFintechState((prev) => {
      const wasZero = prev.investedBalanceUSDT <= 0;
      const nextState: UserFintechState = {
        ...prev,
        sampleBalanceUSDT: Math.max(0, Math.round((prev.sampleBalanceUSDT - amountUSD) * 100) / 100),
        investedBalanceUSDT: Math.round((prev.investedBalanceUSDT + amountUSD) * 100) / 100,
        investmentStartedAt: wasZero ? now : (prev.investmentStartedAt ?? now),
        investmentLastAccrualAt: wasZero ? now : (prev.investmentLastAccrualAt ?? now),
        investmentAccruedUSDT: wasZero ? 0 : (prev.investmentAccruedUSDT ?? 0),
        investmentCycleCount: wasZero ? 0 : (prev.investmentCycleCount ?? 0),
        investmentHistory: wasZero ? [] : (prev.investmentHistory ?? []),
      };
      if (user && cloudLoaded) {
        api.saveUserFintechStateToCloud(nextState).catch(console.error);
      }
      return nextState;
    });

    showToast(
      `$${amountUSD.toLocaleString()} USD invested in ${termWeeks}-Week Term! Accruing 2.0% every 24 hours.`
    );
  };

  // Unlock Invested Amount anytime so user can withdraw from investment
  const handleUnlockInvestment = (amountToUnlock: number, openWithdrawAfter = false) => {
    setUnlockError(null);
    if (!Number.isFinite(amountToUnlock) || amountToUnlock <= 0) {
      setUnlockError('Enter a valid amount to unlock.');
      return;
    }
    if (amountToUnlock > fintechState.investedBalanceUSDT + 0.001) {
      setUnlockError('Amount exceeds your active invested balance.');
      return;
    }

    const clampedUnlock = Math.min(
      fintechState.investedBalanceUSDT,
      Math.round(amountToUnlock * 100) / 100
    );

    onUpdateFintechState((prev) => {
      const remainingInvested = Math.max(
        0,
        Math.round((prev.investedBalanceUSDT - clampedUnlock) * 100) / 100
      );
      const nextAvailable = Math.round((prev.sampleBalanceUSDT + clampedUnlock) * 100) / 100;
      const nextState: UserFintechState = {
        ...prev,
        sampleBalanceUSDT: nextAvailable,
        investedBalanceUSDT: remainingInvested,
        investmentStartedAt: remainingInvested > 0 ? prev.investmentStartedAt : null,
        investmentLastAccrualAt: remainingInvested > 0 ? prev.investmentLastAccrualAt : null,
      };
      if (user && cloudLoaded) {
        api.saveUserFintechStateToCloud(nextState).catch(console.error);
      }
      return nextState;
    });

    setUnlockAmountStr('');
    setActiveInvestedModalOpen(false);
    showToast(
      `Unlocked $${clampedUnlock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT to Available Balance.`
    );
    if (openWithdrawAfter) {
      setWithdrawModalOpen(true);
    }
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
  const investedBalanceUSDT = fintechState.investedBalanceUSDT;
  const totalBalanceUSDT = fintechState.sampleBalanceUSDT + investedBalanceUSDT;

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
                : activeNav === 'wallet'
                ? 'Wallet'
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
            <button
              type="button"
              onClick={() => onNavigate?.('referrals')}
              className="w-full text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/60 dark:hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Referrals</span>
                <Users className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {fintechState.referralsCount}
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                  {activeTier.name} · {activeTier.miningRatePercent}% Mining Rate · 1.5% Inv. Comm.
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                  <span>Open Referrals</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
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

        {/* Wallet View (Total Balance + My Investments below it) */}
        {activeNav === 'wallet' && (
          <section className="space-y-6 animate-fade-in">
            {/* Top Wallet Card — Total Balance ONLY */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs font-medium">
                  Total Balance
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">
                  ${totalBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
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

            {/* My Investments Section (Below Total Balance) */}
            <div id="my-investments" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>My Investments</span>
                </h2>
              </div>

              {/* 1. Available to Invest | 2. Active Invested (Clickable) | 3. Weekly Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Available to Invest */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Available to Invest
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    ${fintechState.sampleBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Liquid capital ready for deployment
                  </div>
                </div>

                {/* 2. Active Invested (Clickable: 24h 2.0% growth & unlock anytime) */}
                <button
                  type="button"
                  onClick={() => {
                    setUnlockError(null);
                    setUnlockAmountStr('');
                    setActiveInvestedModalOpen(true);
                  }}
                  className="text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/70 dark:hover:border-blue-500/60 shadow-sm hover:shadow-md transition-all space-y-2 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Active Invested
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                      <span>24h Growth · Unlock</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    ${fintechState.investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {fintechState.investedBalanceUSDT > 0
                      ? `+2.0% (+$${(fintechState.investedBalanceUSDT * INVESTMENT_24H_RATE).toFixed(2)}) every 24h`
                      : 'Click to view details'}
                  </div>
                </button>

                {/* 3. Weekly Rate */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Weekly Rate (2.0%)
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                    +${(fintechState.investedBalanceUSDT * 0.02).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    2.0% weekly return rate
                  </div>
                </div>
              </div>

              {/* 4. Invest Now & Borrow Now Buttons */}
              <div className="flex flex-col items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvestTerm(12);
                    setInvestModalOpen(true);
                  }}
                  className="w-full sm:w-64 min-h-[44px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>INVEST NOW</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBorrowModalOpen(true)}
                  className="w-full sm:w-64 min-h-[44px] px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Landmark className="w-4 h-4" />
                  <span>BORROW NOW</span>
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

      <BorrowModal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        onContinueTransacting={() => {
          setActiveNav('wallet');
          onNavigate?.('wallet');
        }}
      />

      {/* 1. Balance Breakdown Modal (Total Balance + Invested Amount + Deposit/Withdraw + Invest Now + Borrow Now) */}
      {balanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 sticky top-0 z-10 backdrop-blur-md">
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

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Invested Amount</span>
                <div className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  ${investedBalanceUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-xs font-semibold text-slate-400">USDT</span>
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

              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setBalanceModalOpen(false);
                    setSelectedInvestTerm(12);
                    setInvestModalOpen(true);
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>INVEST NOW</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBalanceModalOpen(false);
                    setBorrowModalOpen(true);
                  }}
                  className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Landmark className="w-4 h-4" />
                  <span>BORROW NOW</span>
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
                  <span>
                    Rate: {effectiveHashRate.toFixed(2)} TH/s ({activeTier.miningRatePercent}% {activeTier.name})
                  </span>
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
      {/* 4. Active Invested Modal (24h +2.0% Growth Tracker & Anytime Unlock to Withdraw) */}
      {activeInvestedModalOpen && (() => {
        const activeAmt = fintechState.investedBalanceUSDT;
        const next24hIncrease = Math.round(activeAmt * INVESTMENT_24H_RATE * 100) / 100;
        const projectedAfter24h = Math.round((activeAmt + next24hIncrease) * 100) / 100;
        const lastAt = fintechState.investmentLastAccrualAt ?? nowMs;
        const elapsed24h = Math.max(0, nowMs - lastAt);
        const remaining24h = Math.max(0, CYCLE_24H_MS - elapsed24h);
        const progress24h = Math.min(100, (elapsed24h / CYCLE_24H_MS) * 100);
        const unlockNumeric = parseFloat(unlockAmountStr) || 0;
        const historyList = fintechState.investmentHistory || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Active Invested
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      +2.0% every 24 hours · Unlock anytime
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInvestedModalOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close active invested modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
                {/* Summary Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-300">
                      Total Active Invested
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold">
                      +2.0% / 24h
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold font-mono tabular-nums">
                    ${activeAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-sm font-semibold text-blue-400">USDT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Next 24h Increase (+2.0%)</span>
                      <span className="font-mono font-bold text-emerald-400">
                        +${next24hIncrease.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total 24h Gains Credited</span>
                      <span className="font-mono font-bold text-white">
                        +${(fintechState.investmentAccruedUSDT || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live 24-Hour Countdown */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Next 2.0% Increase In</span>
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {activeAmt > 0 ? formatCountdownTimer(remaining24h) : 'Inactive'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${activeAmt > 0 ? progress24h : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Projected After 24h:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ${projectedAfter24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </span>
                  </div>
                </div>

                {/* 24-Hour Increase History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      24-Hour Return Increases (+2.0%)
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {fintechState.investmentCycleCount || 0} completed
                    </span>
                  </div>
                  {historyList.length === 0 ? (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                      <span>
                        {activeAmt > 0
                          ? `Cycle #1 (+2.0% = +$${next24hIncrease.toFixed(2)} USDT) credits automatically after 24 hours.`
                          : 'Invest funds to start accruing +2.0% every 24 hours.'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {historyList.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 text-xs font-mono"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Cycle #{item.cycleNumber}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                              +${item.increaseAmountUSDT.toFixed(2)} (+2.0%)
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Total: ${item.totalInvestedAfterUSDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unlock Invested Amount Anytime */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Unlock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Unlock Invested Amount
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unlock any portion of your active invested funds anytime to move them to your Available Balance for withdrawal.
                  </p>

                  {activeAmt > 0 ? (
                    <>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={activeAmt}
                          step="10"
                          value={unlockAmountStr}
                          onChange={(e) => {
                            setUnlockAmountStr(e.target.value);
                            setUnlockError(null);
                          }}
                          placeholder={`Enter amount (max $${activeAmt.toFixed(2)})`}
                          className="w-full min-h-[44px] pl-8 pr-16 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base sm:text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUnlockAmountStr(activeAmt.toFixed(2));
                            setUnlockError(null);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg cursor-pointer"
                        >
                          MAX
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[0.25, 0.5, 1].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setUnlockAmountStr((activeAmt * pct).toFixed(2));
                              setUnlockError(null);
                            }}
                            className="min-h-[36px] py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            {pct === 1 ? 'Unlock All (100%)' : `${pct * 100}%`}
                          </button>
                        ))}
                      </div>

                      {unlockError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium">
                          {unlockError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={unlockNumeric <= 0 || unlockNumeric > activeAmt + 0.001}
                          onClick={() => handleUnlockInvestment(unlockNumeric, false)}
                          className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock to Balance</span>
                        </button>
                        <button
                          type="button"
                          disabled={unlockNumeric <= 0 || unlockNumeric > activeAmt + 0.001}
                          onClick={() => handleUnlockInvestment(unlockNumeric, true)}
                          className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Unlock & Withdraw</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveInvestedModalOpen(false);
                        setSelectedInvestTerm(12);
                        setInvestModalOpen(true);
                      }}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Invest Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
