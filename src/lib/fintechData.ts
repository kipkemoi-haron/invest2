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

export const REFERRAL_TIERS: ReferralTier[] = [
  {
    level: 0,
    name: 'Starter Tier',
    minReferrals: 0,
    maxReferrals: 0,
    commissionRate: 0.03, // 3%
    dailyMiningCapUSDT: 5.00,
    perks: ['Standard 5 USDT/day mining cap', '3% Task commission', 'Basic support channel'],
  },
  {
    level: 1,
    name: 'Bronze Tier',
    minReferrals: 1,
    maxReferrals: 3,
    commissionRate: 0.05, // 5%
    dailyMiningCapUSDT: 25.00,
    perks: ['25 USDT/day mining cap (5x multiplier)', '5% Task commission', 'Instant withdrawal processing priority'],
  },
  {
    level: 2,
    name: 'Silver Tier',
    minReferrals: 4,
    maxReferrals: 10,
    commissionRate: 0.08, // 8%
    dailyMiningCapUSDT: 100.00,
    perks: ['100 USDT/day mining cap (20x multiplier)', '8% Task commission', 'Early access to high-reward surveys'],
  },
  {
    level: 3,
    name: 'Gold Tier',
    minReferrals: 11,
    maxReferrals: 25,
    commissionRate: 0.12, // 12%
    dailyMiningCapUSDT: 250.00,
    perks: ['250 USDT/day mining cap (50x multiplier)', '12% Task commission', 'Dedicated compliance manager'],
  },
  {
    level: 4,
    name: 'Platinum Tier',
    minReferrals: 26,
    maxReferrals: null,
    commissionRate: 0.18, // 18%
    dailyMiningCapUSDT: 500.00,
    perks: ['Maximum 500 USDT/day mining cap', '18% Task commission', 'Institutional OTC liquidity & zero fees'],
  },
];

export const INITIAL_INVITED_FRIENDS: InvitedFriend[] = [
  {
    id: 'ref-01',
    name: 'Elena Rostova',
    maskedEmail: 'e.ro***@zurich.ch',
    joinedDate: '2026-10-14',
    tasksCompleted: 42,
    miningActive: true,
    commissionEarnedUSDT: 86.40,
    tier: 'Gold',
  },
  {
    id: 'ref-02',
    name: 'Liam Chen',
    maskedEmail: 'l.ch***@singapore.sg',
    joinedDate: '2026-10-18',
    tasksCompleted: 29,
    miningActive: true,
    commissionEarnedUSDT: 58.20,
    tier: 'Silver',
  },
  {
    id: 'ref-03',
    name: 'Tariq Al-Mansoor',
    maskedEmail: 't.al***@dubai.ae',
    joinedDate: '2026-10-22',
    tasksCompleted: 51,
    miningActive: true,
    commissionEarnedUSDT: 114.75,
    tier: 'Gold',
  },
  {
    id: 'ref-04',
    name: 'Chloe Dubois',
    maskedEmail: 'c.du***@paris.fr',
    joinedDate: '2026-10-27',
    tasksCompleted: 17,
    miningActive: false,
    commissionEarnedUSDT: 32.10,
    tier: 'Bronze',
  },
  {
    id: 'ref-05',
    name: 'Kevin Patel',
    maskedEmail: 'k.pa***@london.uk',
    joinedDate: '2026-11-01',
    tasksCompleted: 12,
    miningActive: true,
    commissionEarnedUSDT: 24.50,
    tier: 'Bronze',
  },
  {
    id: 'ref-06',
    name: 'Hannah Lindqvist',
    maskedEmail: 'h.li***@stockholm.se',
    joinedDate: '2026-11-04',
    tasksCompleted: 8,
    miningActive: true,
    commissionEarnedUSDT: 16.85,
    tier: 'Bronze',
  },
  {
    id: 'ref-07',
    name: 'Mateo Morales',
    maskedEmail: 'm.mo***@madrid.es',
    joinedDate: '2026-11-06',
    tasksCompleted: 5,
    miningActive: false,
    commissionEarnedUSDT: 10.00,
    tier: 'Bronze',
  },
];

export const TOKEN_PRICE_USDT = 0.056; // 0.056 USDT per AETHEL
export const MAX_MINING_SECONDS = 86399; // 23:59:59
export const CYCLE_DURATION_SECONDS = 86400; // 24 Hours -> closes after 23:59:59
export const AETHEL_PER_SECOND = 0.045;
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
    hashRate: 1.45,
    tokenPriceUSDT: TOKEN_PRICE_USDT,
    dailyCapUSDT: 250.00, // Gold Tier for 14 referrals
  },
});
