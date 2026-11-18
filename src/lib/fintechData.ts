import type { TaskItem, InvitedFriend, ReferralTier, MiningState } from '../types/index.ts';

export const INITIAL_TASKS: TaskItem[] = [
  // Rate Apps
  {
    id: 'task-app-01',
    title: 'Fintech Mobile Wallet UI & Biometrics Audit',
    category: 'Rate Apps',
    description: 'Evaluate facial biometrics login speed, dark mode rendering, and fiat on-ramp responsiveness on iOS/Android.',
    rewardUSDT: 4.50,
    rewardAethel: 80,
    estimatedTime: '3 mins',
    difficulty: 'Easy',
    availableSlots: 42,
    instructions: [
      'Launch the sandbox mobile wallet demo link provided',
      'Test face recognition and seed phrase backup confirmation',
      'Submit a 1-to-5 star rating with 2 sentences of ergonomic feedback',
    ],
  },
  {
    id: 'task-app-02',
    title: 'Crypto Exchange Order Book Usability Test',
    category: 'Rate Apps',
    description: 'Review limit-order placement controls, candle interval toggles, and cross-margin leverage sliders.',
    rewardUSDT: 6.20,
    rewardAethel: 110,
    estimatedTime: '4 mins',
    difficulty: 'Medium',
    availableSlots: 28,
    instructions: [
      'Simulate an order placement on testnet pairing',
      'Check if execution slippage warning is visible and clear',
      'Rate order book depth readability and speed',
    ],
  },
  {
    id: 'task-app-03',
    title: 'DeFi Swap & Gas Estimator Interface Review',
    category: 'Rate Apps',
    description: 'Audit automated gas prioritization settings and token contract verification warnings before swap confirmation.',
    rewardUSDT: 5.00,
    rewardAethel: 90,
    estimatedTime: '3 mins',
    difficulty: 'Easy',
    availableSlots: 35,
    instructions: [
      'Inspect the quote routing breakdown between Uniswap v3 and Curve',
      'Verify that gas estimate matches target EIP-1559 base fee',
      'Submit rating and UX recommendations',
    ],
  },

  // Business & Hotel Recommendations
  {
    id: 'task-hotel-01',
    title: 'Grand Continental Executive Suite & Fiber WiFi Review',
    category: 'Business & Hotel Recommendations',
    description: 'Verify dedicated business workstation ergonomics, secure private VLAN availability, and executive lounge sound isolation.',
    rewardUSDT: 7.50,
    rewardAethel: 135,
    estimatedTime: '5 mins',
    difficulty: 'Medium',
    availableSlots: 19,
    instructions: [
      'Review room photos and verified business travel checklist',
      'Confirm workstation power outlets and HDMI external monitor support',
      'Submit corporate suitability recommendation rating',
    ],
  },
  {
    id: 'task-hotel-02',
    title: 'Metropolitan Tech Hub Coworking Facility Score',
    category: 'Business & Hotel Recommendations',
    description: 'Score conference room soundproofing, standing desk availability, and 24/7 biometric turnstile access.',
    rewardUSDT: 5.80,
    rewardAethel: 105,
    estimatedTime: '4 mins',
    difficulty: 'Easy',
    availableSlots: 51,
    instructions: [
      'Evaluate location accessibility near transit lines',
      'Score sound privacy for international video conferences',
      'Provide recommendation score for remote engineering teams',
    ],
  },
  {
    id: 'task-hotel-03',
    title: 'Boutique Financial District Boutique Hotel Audit',
    category: 'Business & Hotel Recommendations',
    description: 'Assess express check-in kiosk flow, quiet hours compliance, and early breakfast schedule for Wall Street market open.',
    rewardUSDT: 6.00,
    rewardAethel: 100,
    estimatedTime: '3 mins',
    difficulty: 'Easy',
    availableSlots: 24,
    instructions: [
      'Review digital room key integration and checkout speed',
      'Score express continental breakfast timing and quality',
      'Submit concise corporate endorsement review',
    ],
  },

  // Agriculture Surveys
  {
    id: 'task-agri-01',
    title: 'Autonomous Drone Soil Moisture Sensor Field Survey',
    category: 'Agriculture Surveys',
    description: 'Validate drone thermal imaging data against ground capacitance probes across 120-hectare smart vineyard parcel.',
    rewardUSDT: 8.50,
    rewardAethel: 150,
    estimatedTime: '6 mins',
    difficulty: 'Medium',
    availableSlots: 16,
    instructions: [
      'Review normalized difference vegetation index (NDVI) heatmap',
      'Compare root-zone moisture metrics with irrigation schedule',
      'Answer 4 multiple-choice verification questions on soil aeration',
    ],
  },
  {
    id: 'task-agri-02',
    title: 'Hydroponic Automated Nutrient Delivery Efficiency',
    category: 'Agriculture Surveys',
    description: 'Analyze real-time electrical conductivity (EC) logs and pH buffer dosing curves in vertical leafy green greenhouses.',
    rewardUSDT: 9.00,
    rewardAethel: 160,
    estimatedTime: '5 mins',
    difficulty: 'Advanced',
    availableSlots: 12,
    instructions: [
      'Inspect recirculating nutrient film technique flow rates',
      'Identify salinity fluctuations across peak daylight cycles',
      'Submit optimization assessment score',
    ],
  },
  {
    id: 'task-agri-03',
    title: 'Smart Grain Silo IoT Temperature & Aeration Survey',
    category: 'Agriculture Surveys',
    description: 'Review wireless thermistor cable data to prevent hot-spot moisture accumulation in winter wheat storage.',
    rewardUSDT: 6.80,
    rewardAethel: 120,
    estimatedTime: '4 mins',
    difficulty: 'Easy',
    availableSlots: 30,
    instructions: [
      'Check multi-depth temperature gradient charts',
      'Verify automated fan cycle triggers during low ambient humidity',
      'Complete 3-point compliance check',
    ],
  },

  // Remote Job Applications
  {
    id: 'task-job-01',
    title: 'Quantitative Research Analyst Candidate Screening',
    category: 'Remote Job Applications',
    description: 'Evaluate sample backtesting methodology, Sharpe ratio calculations, and Python algorithmic trading script quality.',
    rewardUSDT: 12.00,
    rewardAethel: 215,
    estimatedTime: '7 mins',
    difficulty: 'Advanced',
    availableSlots: 8,
    instructions: [
      'Review candidate methodology statement and statistical assumptions',
      'Score code clarity and risk mitigation parameters',
      'Submit hiring panel recommendation ranking',
    ],
  },
  {
    id: 'task-job-02',
    title: 'Junior Web3 Frontend Engineer Application Review',
    category: 'Remote Job Applications',
    description: 'Score applicant GitHub repository for React 19 hooks discipline, Tailwind styling quality, and wallet connection state.',
    rewardUSDT: 8.00,
    rewardAethel: 140,
    estimatedTime: '5 mins',
    difficulty: 'Medium',
    availableSlots: 15,
    instructions: [
      'Check sample portfolio demo on mobile and desktop viewports',
      'Verify error boundary handling during rejected RPC transactions',
      'Select pass/advance score',
    ],
  },
  {
    id: 'task-job-03',
    title: 'Digital Asset Compliance & KYC Analyst Screening',
    category: 'Remote Job Applications',
    description: 'Audit candidate test scenario identifying suspicious tumbling patterns and Chainalysis risk score interpretations.',
    rewardUSDT: 10.50,
    rewardAethel: 185,
    estimatedTime: '6 mins',
    difficulty: 'Medium',
    availableSlots: 11,
    instructions: [
      'Review synthetic wallet cluster transaction flow diagram',
      'Confirm AML red-flag classification accuracy',
      'Submit evaluation summary',
    ],
  },

  // Daily Check-in
  {
    id: 'task-checkin-01',
    title: 'Daily Platform Check-in & Consecutive Streak Bonus',
    category: 'Daily Check-in',
    description: 'Claim your daily active participant reward. Consecutive logins unlock hash rate boosts and mining cap multipliers.',
    rewardUSDT: 1.50,
    rewardAethel: 25,
    estimatedTime: '10 sec',
    difficulty: 'Easy',
    availableSlots: 1000,
    instructions: [
      'Confirm your daily account activity',
      'Claim instant +1.50 USDT and +25 AETHEL reward',
      'Streak counter increments towards weekly multiplier',
    ],
  },
];

export const REFERRAL_INVESTMENT_COMMISSION_RATE = 0.015; // 1.5% of referred customer's investment
export const BORROW_MONTHLY_INTEREST_RATE = 0.015; // 1.5% monthly borrowing interest

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    level: 0,
    name: 'Starter Tier',
    minReferrals: 0,
    maxReferrals: 0,
    miningRateMultiplier: 1.0,
    miningRatePercent: 100,
    commissionRate: REFERRAL_INVESTMENT_COMMISSION_RATE,
    dailyMiningCapUSDT: 5.0,
    perks: [
      'Normal 100% mining rate (0.045 AETHEL/sec)',
      'Bronze unlocks after 10 referrals',
      '1.5% commission on referee investments',
    ],
  },
  {
    level: 1,
    name: 'Bronze Tier',
    minReferrals: 10,
    maxReferrals: 99,
    miningRateMultiplier: 1.5,
    miningRatePercent: 150,
    commissionRate: REFERRAL_INVESTMENT_COMMISSION_RATE,
    dailyMiningCapUSDT: 25.0,
    perks: [
      '150% mining rate (+50% speed boost) at 10 referrals',
      '25 USDT/day mining cap',
      '1.5% commission on referee investments',
    ],
  },
  {
    level: 2,
    name: 'Silver Tier',
    minReferrals: 100,
    maxReferrals: 249,
    miningRateMultiplier: 2.25,
    miningRatePercent: 225,
    commissionRate: REFERRAL_INVESTMENT_COMMISSION_RATE,
    dailyMiningCapUSDT: 100.0,
    perks: [
      '225% mining rate (+125% speed boost) at 100 referrals',
      '100 USDT/day mining cap',
      '1.5% commission on referee investments',
    ],
  },
  {
    level: 3,
    name: 'Gold Tier',
    minReferrals: 250,
    maxReferrals: 499,
    miningRateMultiplier: 3.5,
    miningRatePercent: 350,
    commissionRate: REFERRAL_INVESTMENT_COMMISSION_RATE,
    dailyMiningCapUSDT: 250.0,
    perks: [
      '350% mining rate (+250% speed boost) at 250 referrals',
      '250 USDT/day mining cap',
      '1.5% commission on referee investments',
    ],
  },
  {
    level: 4,
    name: 'Platinum Tier',
    minReferrals: 500,
    maxReferrals: null,
    miningRateMultiplier: 5.0,
    miningRatePercent: 500,
    commissionRate: REFERRAL_INVESTMENT_COMMISSION_RATE,
    dailyMiningCapUSDT: 500.0,
    perks: [
      '500% mining rate (+400% speed boost) at 500 referrals',
      'Maximum 500 USDT/day mining cap',
      '1.5% commission on referee investments',
    ],
  },
];

export function getReferralTierForCount(referralsCount: number): ReferralTier {
  const count = Math.max(0, Math.floor(referralsCount) || 0);
  if (count >= 500) return REFERRAL_TIERS[4];
  if (count >= 250) return REFERRAL_TIERS[3];
  if (count >= 100) return REFERRAL_TIERS[2];
  if (count >= 10) return REFERRAL_TIERS[1];
  return REFERRAL_TIERS[0];
}

export function getNextReferralTier(referralsCount: number): ReferralTier | null {
  const current = getReferralTierForCount(referralsCount);
  const nextIndex = REFERRAL_TIERS.findIndex((t) => t.level === current.level) + 1;
  return nextIndex < REFERRAL_TIERS.length ? REFERRAL_TIERS[nextIndex] : null;
}

export const INITIAL_INVITED_FRIENDS: InvitedFriend[] = [
  {
    id: 'ref-01',
    name: 'Elena Rostova',
    maskedEmail: 'e.ro***@zurich.ch',
    joinedDate: '2026-10-14',
    investedAmountUSDT: 5000.0,
    tasksCompleted: 42,
    miningActive: true,
    commissionEarnedUSDT: 75.0, // 1.5% of $5,000
    tier: 'Gold',
  },
  {
    id: 'ref-02',
    name: 'Liam Chen',
    maskedEmail: 'l.ch***@singapore.sg',
    joinedDate: '2026-10-18',
    investedAmountUSDT: 3200.0,
    tasksCompleted: 29,
    miningActive: true,
    commissionEarnedUSDT: 48.0, // 1.5% of $3,200
    tier: 'Silver',
  },
  {
    id: 'ref-03',
    name: 'Tariq Al-Mansoor',
    maskedEmail: 't.al***@dubai.ae',
    joinedDate: '2026-10-22',
    investedAmountUSDT: 8000.0,
    tasksCompleted: 51,
    miningActive: true,
    commissionEarnedUSDT: 120.0, // 1.5% of $8,000
    tier: 'Gold',
  },
  {
    id: 'ref-04',
    name: 'Chloe Dubois',
    maskedEmail: 'c.du***@paris.fr',
    joinedDate: '2026-10-27',
    investedAmountUSDT: 2000.0,
    tasksCompleted: 17,
    miningActive: false,
    commissionEarnedUSDT: 30.0, // 1.5% of $2,000
    tier: 'Bronze',
  },
  {
    id: 'ref-05',
    name: 'Kevin Patel',
    maskedEmail: 'k.pa***@london.uk',
    joinedDate: '2026-11-01',
    investedAmountUSDT: 1500.0,
    tasksCompleted: 12,
    miningActive: true,
    commissionEarnedUSDT: 22.5, // 1.5% of $1,500
    tier: 'Bronze',
  },
  {
    id: 'ref-06',
    name: 'Hannah Lindqvist',
    maskedEmail: 'h.li***@stockholm.se',
    joinedDate: '2026-11-04',
    investedAmountUSDT: 1000.0,
    tasksCompleted: 8,
    miningActive: true,
    commissionEarnedUSDT: 15.0, // 1.5% of $1,000
    tier: 'Bronze',
  },
  {
    id: 'ref-07',
    name: 'Mateo Morales',
    maskedEmail: 'm.mo***@madrid.es',
    joinedDate: '2026-11-06',
    investedAmountUSDT: 600.0,
    tasksCompleted: 5,
    miningActive: false,
    commissionEarnedUSDT: 9.0, // 1.5% of $600
    tier: 'Bronze',
  },
];

export const TOKEN_PRICE_USDT = 0.056; // 0.056 USDT per AETHEL
export const MAX_MINING_SECONDS = 86399; // 23:59:59
export const CYCLE_DURATION_SECONDS = 86400; // 24 Hours -> closes after 23:59:59
export const AETHEL_PER_SECOND = 0.045;
export const BASE_HASH_RATE_TH = 1.45;
export const INVESTMENT_24H_RATE = 0.02; // 2.0% increase every 24 hours
export const CYCLE_24H_MS = 24 * 60 * 60 * 1000;

export interface InvestmentAccrualRecord {
  id: string;
  cycleNumber: number;
  timestamp: number;
  principalBaseUSDT: number;
  increaseAmountUSDT: number;
  totalInvestedAfterUSDT: number;
}

export interface UpcomingTaskCategory {
  id: string;
  title: string;
  description: string;
  estimatedReward: string;
  status: 'Coming Soon';
}

export const UPCOMING_TASK_CATEGORIES: UpcomingTaskCategory[] = [
  {
    id: 'upcoming-watch-ads',
    title: 'Watch Ads',
    description: 'View verified partner brand video spots and sponsor campaigns for instant micro-rewards.',
    estimatedReward: '$0.50 – $2.00 USDT / ad',
    status: 'Coming Soon',
  },
  {
    id: 'upcoming-freelancing',
    title: 'Freelancing',
    description: 'Take on curated remote micro-contracts in QA testing, content moderation, and research.',
    estimatedReward: '$15.00 – $75.00 USDT / gig',
    status: 'Coming Soon',
  },
  {
    id: 'upcoming-youtube',
    title: 'YouTube Videos',
    description: 'Watch, evaluate, and submit retention & quality feedback on partner YouTube creator videos.',
    estimatedReward: '$1.50 – $5.00 USDT / video',
    status: 'Coming Soon',
  },
  {
    id: 'upcoming-tiktok',
    title: 'TikTok Reviews',
    description: 'Audit short-form creator clips, hashtag accuracy, and campaign brand compliance on TikTok.',
    estimatedReward: '$1.25 – $4.00 USDT / review',
    status: 'Coming Soon',
  },
  {
    id: 'upcoming-facebook',
    title: 'Facebook Reviews',
    description: 'Verify local business pages, marketplace listings, and sponsored community posts on Facebook.',
    estimatedReward: '$1.50 – $4.50 USDT / review',
    status: 'Coming Soon',
  },
  {
    id: 'upcoming-instagram',
    title: 'Instagram Reviews',
    description: 'Score sponsored Reels, story placements, and brand engagement campaigns on Instagram.',
    estimatedReward: '$1.50 – $5.00 USDT / review',
    status: 'Coming Soon',
  },
];

export function formatMiningTimer(totalSeconds: number): string {
  const clamped = Math.max(0, Math.min(MAX_MINING_SECONDS, Math.floor(totalSeconds)));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatCountdownTimer(remainingMs: number): string {
  const clampedSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hrs = Math.floor(clampedSeconds / 3600);
  const mins = Math.floor((clampedSeconds % 3600) / 60);
  const secs = clampedSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeLockedTaskBalanceUSDT(
  completedTaskIds: string[],
  storedLockedBalance?: number
): number {
  const fromIds = INITIAL_TASKS.filter((t) => completedTaskIds.includes(t.id)).reduce(
    (sum, t) => sum + t.rewardUSDT,
    0
  );
  if (typeof storedLockedBalance === 'number' && Number.isFinite(storedLockedBalance)) {
    return Math.max(fromIds, storedLockedBalance);
  }
  return fromIds;
}

export interface UserFintechState {
  sampleBalanceUSDT: number;
  investedBalanceUSDT: number;
  investmentStartedAt?: number | null;
  investmentLastAccrualAt?: number | null;
  investmentAccruedUSDT?: number;
  investmentCycleCount?: number;
  investmentHistory?: InvestmentAccrualRecord[];
  taskLockedBalanceUSDT: number;
  aethelBalance: number;
  tasksCompletedCount: number;
  referralsCount: number;
  completedTaskIds: string[];
  mining: MiningState;
  dailyStreak: number;
  lastCheckInDate: string | null;
}

const STORAGE_KEY = 'aethelgard_fintech_state_v1';

export const getStoredFintechState = (): UserFintechState => {
  if (typeof window === 'undefined') {
    return getDefaultFintechState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const defaults = getDefaultFintechState();
      return {
        ...defaults,
        ...parsed,
        investmentHistory: Array.isArray(parsed.investmentHistory) ? parsed.investmentHistory : [],
        mining: {
          ...defaults.mining,
          ...(parsed.mining || {}),
        },
      };
    }
  } catch (e) {
    console.error('Failed reading fintech state from storage:', e);
  }
  return getDefaultFintechState();
};

export const saveFintechState = (state: UserFintechState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed writing fintech state to storage:', e);
  }
};

export const getDefaultFintechState = (): UserFintechState => ({
  sampleBalanceUSDT: 1248.50,
  investedBalanceUSDT: 15000.00,
  investmentStartedAt: null,
  investmentLastAccrualAt: null,
  investmentAccruedUSDT: 0,
  investmentCycleCount: 0,
  investmentHistory: [],
  taskLockedBalanceUSDT: 13.50,
  aethelBalance: 4820.00,
  tasksCompletedCount: 3,
  referralsCount: 14,
  completedTaskIds: ['task-app-01', 'task-hotel-01', 'task-checkin-01'],
  dailyStreak: 6,
  lastCheckInDate: null,
  mining: {
    isMining: false,
    sessionStartedAt: null,
    sessionElapsedSeconds: 0,
    sessionClosed: false,
    sessionBaseAethel: 4820.00,
    totalMinedAethel: 4820.00,
    sessionMinedAethel: 0,
    hashRate: 2.18, // 1.5x Bronze Tier for 14 referrals
    tokenPriceUSDT: TOKEN_PRICE_USDT,
    dailyCapUSDT: 25.00, // Bronze Tier for 14 referrals
  },
});
