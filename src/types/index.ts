export type Role = 'CLIENT' | 'ADMIN';
export type KycStatus = 'UNVERIFIED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  customerId: string; // e.g. CLT-8921
  fullName: string;
  email: string;
  phone: string;
  country: string;
  role: Role;
  kycStatus: KycStatus;
  status: AccountStatus;
  twoFactorEnabled: boolean;
  referralCode?: string;
  referredBy?: string;
  createdAt: string;
}

export type CryptoCurrency = 'BTC' | 'ETH' | 'USDT';

export interface CryptoWallet {
  id: string;
  currency: CryptoCurrency;
  network: string; // e.g. 'Bitcoin Mainnet', 'ERC-20', 'TRC-20', 'Arbitrum'
  address: string;
  qrCodeNote?: string;
  isActive: boolean;
  minDepositUSD: number;
  requiredConfirmations: number;
  updatedAt: string;
}

export type DepositStatus =
  | 'AWAITING_PAYMENT'
  | 'PENDING_CONFIRMATION'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED';

export interface DepositRequest {
  id: string;
  customerId: string;
  userEmail: string;
  currency: CryptoCurrency;
  network: string;
  walletAddress: string;
  intendedAmountUSD: number;
  cryptoAmount?: string;
  txHash?: string;
  proofFileName?: string;
  status: DepositStatus;
  confirmations: number;
  requiredConfirmations: number;
  rejectionReason?: string;
  blockchainVerification?: {
    verified: boolean;
    blockNumber?: number;
    senderAddress?: string;
    actualAmount?: string;
    verifiedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type InvestmentStatus = 'ACTIVE' | 'MATURED' | 'CANCELLED';

export interface Investment {
  id: string;
  customerId: string;
  principalAmountUSD: number;
  weeklyRate: number; // e.g. 0.02 for 2.0%
  durationWeeks: number;
  startDate: string;
  maturityDate: string;
  accumulatedEarningsUSD: number;
  lastAccrualDate: string;
  nextAccrualDate: string;
  status: InvestmentStatus;
  termsApproved: boolean;
  termsVersion: string;
  createdAt: string;
}

export type WithdrawalStatus =
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  customerId: string;
  userEmail: string;
  currency: CryptoCurrency;
  network: string;
  destinationAddress: string;
  amountUSD: number;
  feeUSD: number;
  netAmountUSD: number;
  status: WithdrawalStatus;
  blockchainTxRef?: string;
  rejectionReason?: string;
  submittedAt: string;
  processedAt?: string;
}

export type LedgerTransactionType =
  | 'DEPOSIT_CONFIRMED'
  | 'INVESTMENT_COMMITTED'
  | 'INVESTMENT_EARNINGS'
  | 'INVESTMENT_PRINCIPAL_RELEASE'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_PROCESSED'
  | 'WITHDRAWAL_REFUND';

export interface LedgerEntry {
  id: string;
  customerId: string;
  type: LedgerTransactionType;
  amountUSD: number; // positive = credit to available balance, negative = debit
  referenceId: string; // depositId, investmentId, withdrawalId
  description: string;
  balanceAfterUSD: number;
  timestamp: string;
}

export interface ClientFinancialOverview {
  totalBalanceUSD: number;
  availableBalanceUSD: number;
  totalInvestedUSD: number;
  activeInvestmentsUSD: number;
  totalEarningsUSD: number;
  pendingDepositsUSD: number;
  pendingWithdrawalsUSD: number;
  weeklyProjectedEarningsUSD: number;
}

export interface PlatformSettings {
  weeklyReturnRate: number; // default 0.02
  isReturnGuaranteed: boolean;
  minDepositUSD: number;
  minWithdrawalUSD: number;
  withdrawalFeePercentage: number;
  defaultTermDurationWeeks: number;
  legalTermsApproved: boolean;
  legalApprovalDate: string;
  complianceReviewNote: string;
  companyName: string;
  supportEmail: string;
  regulatoryJurisdiction: string;
}

export interface NotificationItem {
  id: string;
  customerId: string;
  title: string;
  message: string;
  type: 'DEPOSIT' | 'INVESTMENT' | 'EARNINGS' | 'WITHDRAWAL' | 'SECURITY' | 'SYSTEM';
  read: boolean;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AdminPlatformOverview {
  totalRegisteredClients: number;
  verifiedClients: number;
  totalConfirmedDepositsUSD: number;
  pendingDepositsCount: number;
  pendingDepositsUSD: number;
  totalInvestedCapitalUSD: number;
  activeInvestmentsCount: number;
  totalRecordedEarningsUSD: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsUSD: number;
  completedWithdrawalsUSD: number;
  rejectedTransactionsCount: number;
  ledgerReconciliationStatus: 'BALANCED' | 'DISCREPANCY';
}

export type TaskCategory =
  | 'Rate Apps'
  | 'Business & Hotel Recommendations'
  | 'Agriculture Surveys'
  | 'Remote Job Applications'
  | 'Daily Check-in';

export type TaskDifficulty = 'Easy' | 'Medium' | 'Advanced';

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  rewardUSDT: number;
  rewardAethel: number;
  estimatedTime: string;
  difficulty: TaskDifficulty;
  availableSlots: number;
  completed?: boolean;
  instructions: string[];
}

export interface MiningState {
  isMining: boolean;
  sessionStartedAt: number | null;
  sessionElapsedSeconds: number;
  sessionClosed?: boolean;
  sessionBaseAethel?: number;
  totalMinedAethel: number;
  sessionMinedAethel: number;
  hashRate: number;
  tokenPriceUSDT: number;
  dailyCapUSDT: number;
}

export interface InvitedFriend {
  id: string;
  name: string;
  maskedEmail: string;
  joinedDate: string;
  investedAmountUSDT: number;
  tasksCompleted: number;
  miningActive: boolean;
  commissionEarnedUSDT: number;
  tier: string;
}

export interface ReferralTier {
  level: number;
  name: string;
  minReferrals: number;
  maxReferrals: number | null;
  miningRateMultiplier: number;
  miningRatePercent: number;
  commissionRate: number;
  dailyMiningCapUSDT: number;
  perks: string[];
}

