import type {
  User,
  CryptoWallet,
  DepositRequest,
  Investment,
  WithdrawalRequest,
  LedgerEntry,
  PlatformSettings,
  NotificationItem,
  ClientFinancialOverview,
} from '../types/index.ts';
import { getDefaultFintechState, type UserFintechState } from './fintechData.ts';

const LOCAL_DB_KEY = 'aethelgard_local_db_v1';

interface LocalUserRecord extends User {
  passwordHash: string;
  salt: string;
  fintechState: UserFintechState;
}

interface LocalDbSchema {
  users: LocalUserRecord[];
  deposits: (DepositRequest & { userId: string })[];
  investments: (Investment & { userId: string })[];
  withdrawals: (WithdrawalRequest & { userId: string })[];
  ledger: (LedgerEntry & { userId: string })[];
  notifications: (NotificationItem & { userId: string })[];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(36).substring(2, 14);
}

function sanitizeUser(record: LocalUserRecord): User {
  const { passwordHash: _, salt: __, fintechState: ___, ...user } = record;
  return user;
}

async function loadDb(): Promise<LocalDbSchema> {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDbSchema;
      if (Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // Fall through to fresh initialization
  }

  const demoSalt = 'aethelgard-demo-salt';
  const demoHash = await hashPassword('Password123!', demoSalt);

  const initial: LocalDbSchema = {
    users: [
      {
        id: 'usr-client-01',
        customerId: 'CLT-8921',
        fullName: 'Jane Toni',
        email: 'janeatoni3@gmail.com',
        phone: '+1 (555) 382-9104',
        country: 'United States',
        role: 'CLIENT',
        kycStatus: 'VERIFIED',
        status: 'ACTIVE',
        twoFactorEnabled: false,
        createdAt: '2026-02-01T10:15:00.000Z',
        salt: demoSalt,
        passwordHash: demoHash,
        fintechState: {
          ...getDefaultFintechState(),
          sampleBalanceUSDT: 2600,
          investedBalanceUSDT: 2500,
        },
      },
    ],
    deposits: [],
    investments: [],
    withdrawals: [],
    ledger: [],
    notifications: [],
  };
  saveDb(initial);
  return initial;
}

function saveDb(db: LocalDbSchema): void {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed saving local account state:', err);
  }
}

function makeToken(user: User): string {
  return `local:${user.id}:${user.customerId}`;
}

async function requireUser(db: LocalDbSchema, token: string | null): Promise<LocalUserRecord> {
  if (!token || !token.startsWith('local:')) {
    throw new Error('Authentication required. Please sign in.');
  }
  const parts = token.split(':');
  const userId = parts[1];
  const customerId = parts[2];
  const user = db.users.find((u) => u.id === userId && u.customerId === customerId);
  if (!user) {
    throw new Error('Session expired. Please sign in again.');
  }
  return user;
}

export const localFallback = {
  register: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    password: string;
    referralCode?: string;
  }) => {
    const db = await loadDb();
    const cleanEmail = payload.email.trim().toLowerCase();
    if (!payload.fullName.trim() || !cleanEmail || !payload.password) {
      throw new Error('All mandatory registration fields must be completed.');
    }
    if (payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email already in use. Please sign in instead.');
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(payload.password, salt);
    const count = db.users.filter((u) => u.role === 'CLIENT').length + 1;
    const customerId = `CLT-${8900 + count}`;
    const userId = generateId('usr');

    const newUser: LocalUserRecord = {
      id: userId,
      customerId,
      fullName: payload.fullName.trim().slice(0, 120),
      email: cleanEmail.slice(0, 200),
      phone: payload.phone || '',
      country: payload.country || 'Global',
      role: 'CLIENT',
      kycStatus: 'UNVERIFIED',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      referralCode: payload.referralCode?.trim() || undefined,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
      fintechState: getDefaultFintechState(),
    };

    db.users.push(newUser);
    db.notifications.unshift({
      id: generateId('notif'),
      userId,
      customerId,
      title: 'Registration Successful',
      message: `Welcome to Aethelgard Capital. Your Customer ID is ${customerId}.`,
      type: 'SECURITY',
      read: false,
      timestamp: new Date().toISOString(),
    });
    saveDb(db);

    const user = sanitizeUser(newUser);
    return { user, token: makeToken(user), message: 'Account registered successfully.' };
  },

  login: async (payload: { email: string; password: string }) => {
    const db = await loadDb();
    const cleanEmail = payload.email.trim().toLowerCase();
    const record = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!record) {
      throw new Error('Incorrect email or password.');
    }
    if (record.status === 'SUSPENDED') {
      throw new Error('This account has been suspended by compliance oversight.');
    }
    const candidateHash = await hashPassword(payload.password, record.salt);
    if (candidateHash !== record.passwordHash) {
      throw new Error('Incorrect email or password.');
    }
    const user = sanitizeUser(record);
    return { user, token: makeToken(user), message: 'Authenticated successfully.' };
  },

  forgotPassword: async (email: string) => {
    return {
      message: `If ${email.trim()} is registered, password recovery instructions have been sent.`,
    };
  },

  getMe: async (token: string | null): Promise<{ user: User }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return { user: sanitizeUser(record) };
  },

  submitKyc: async (token: string | null): Promise<{ user: User; message: string }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    record.kycStatus = 'SUBMITTED';
    saveDb(db);
    return {
      user: sanitizeUser(record),
      message: 'Identity documentation submitted for compliance review.',
    };
  },

  getFintechState: async (token: string | null): Promise<Partial<UserFintechState>> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return record.fintechState;
  },

  saveFintechState: async (token: string | null, state: UserFintechState): Promise<void> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    record.fintechState = {
      ...getDefaultFintechState(),
      ...record.fintechState,
      sampleBalanceUSDT: Math.max(0, Number(state.sampleBalanceUSDT) || 0),
      investedBalanceUSDT: Math.max(0, Number(state.investedBalanceUSDT) || 0),
      aethelBalance: Math.max(0, Number(state.aethelBalance) || 0),
      tasksCompletedCount: Math.max(0, Math.floor(state.tasksCompletedCount) || 0),
      referralsCount: Math.max(0, Math.floor(state.referralsCount) || 0),
      completedTaskIds: Array.isArray(state.completedTaskIds) ? state.completedTaskIds.slice(0, 100) : [],
      dailyStreak: Math.max(0, Math.floor(state.dailyStreak) || 0),
      mining: state.mining || record.fintechState?.mining || getDefaultFintechState().mining,
      lastCheckInDate: state.lastCheckInDate ?? record.fintechState?.lastCheckInDate ?? null,
    };
    saveDb(db);
  },

  getDeposits: async (token: string | null): Promise<{ deposits: DepositRequest[] }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return {
      deposits: db.deposits
        .filter((d) => d.userId === record.id)
        .map(({ userId: _, ...rest }) => rest),
    };
  },

  submitDeposit: async (
    token: string | null,
    payload: {
      currency: CryptoWallet['currency'];
      network: string;
      walletAddress: string;
      intendedAmountUSD: number;
      cryptoAmount?: string;
      txHash?: string;
      proofFileName?: string;
    },
    settings: PlatformSettings
  ) => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    const amount = Number(payload.intendedAmountUSD);
    if (!amount || amount < settings.minDepositUSD) {
      throw new Error(`Minimum deposit is $${settings.minDepositUSD.toLocaleString()} USD.`);
    }
    const cleanTxHash = payload.txHash?.trim() || undefined;
    const deposit: DepositRequest = {
      id: generateId('dep'),
      customerId: record.customerId,
      userEmail: record.email,
      currency: payload.currency,
      network: payload.network,
      walletAddress: payload.walletAddress,
      intendedAmountUSD: amount,
      cryptoAmount: payload.cryptoAmount,
      txHash: cleanTxHash,
      proofFileName: payload.proofFileName,
      status: cleanTxHash ? 'PENDING_CONFIRMATION' : 'AWAITING_PAYMENT',
      confirmations: cleanTxHash ? 2 : 0,
      requiredConfirmations: payload.currency === 'BTC' ? 3 : payload.network.includes('TRC-20') ? 19 : 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.deposits.unshift({ ...deposit, userId: record.id });
    saveDb(db);
    return { deposit, message: 'Deposit recorded. Awaiting blockchain validation.' };
  },

  updateDepositTxHash: async (
    token: string | null,
    id: string,
    payload: { txHash: string; proofFileName?: string }
  ) => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    const dep = db.deposits.find((d) => d.id === id && d.userId === record.id);
    if (!dep) throw new Error('Deposit not found');
    dep.txHash = payload.txHash.trim();
    if (payload.proofFileName) dep.proofFileName = payload.proofFileName;
    dep.status = 'PENDING_CONFIRMATION';
    dep.confirmations = 3;
    dep.updatedAt = new Date().toISOString();
    saveDb(db);
    const { userId: _, ...clean } = dep;
    return { deposit: clean, message: 'Transaction hash submitted. Verification queue active.' };
  },

  getInvestments: async (token: string | null): Promise<{ investments: Investment[] }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return {
      investments: db.investments
        .filter((i) => i.userId === record.id)
        .map(({ userId: _, ...rest }) => rest),
    };
  },

  activateInvestment: async (
    token: string | null,
    payload: { principalAmountUSD: number; termsAccepted: boolean },
    settings: PlatformSettings
  ) => {
    if (!payload.termsAccepted) {
      throw new Error('You must review and accept the Aethelgard Investment Agreement.');
    }
    const db = await loadDb();
    const record = await requireUser(db, token);
    const principal = Number(payload.principalAmountUSD);
    if (!principal || principal < 100) {
      throw new Error('Minimum investment amount is $100.00 USD.');
    }
    const avail = record.fintechState.sampleBalanceUSDT || 0;
    if (avail < principal) {
      throw new Error(`Insufficient available balance. You have $${avail.toLocaleString()} USD available.`);
    }
    const now = new Date();
    const durationWeeks = settings.defaultTermDurationWeeks || 12;
    const weeklyRate = settings.weeklyReturnRate || 0.02;
    const inv: Investment = {
      id: generateId('inv'),
      customerId: record.customerId,
      principalAmountUSD: principal,
      weeklyRate,
      durationWeeks,
      startDate: now.toISOString(),
      maturityDate: new Date(now.getTime() + durationWeeks * 7 * 86400000).toISOString(),
      accumulatedEarningsUSD: 0,
      lastAccrualDate: now.toISOString(),
      nextAccrualDate: new Date(now.getTime() + 7 * 86400000).toISOString(),
      status: 'ACTIVE',
      termsApproved: true,
      termsVersion: 'v2.4-2026',
      createdAt: now.toISOString(),
    };
    record.fintechState.sampleBalanceUSDT = Math.max(0, avail - principal);
    record.fintechState.investedBalanceUSDT = (record.fintechState.investedBalanceUSDT || 0) + principal;
    db.investments.unshift({ ...inv, userId: record.id });
    db.ledger.unshift({
      id: generateId('led'),
      userId: record.id,
      customerId: record.customerId,
      type: 'INVESTMENT_COMMITTED',
      amountUSD: -principal,
      referenceId: inv.id,
      description: `Principal Allocated to ${durationWeeks}-Week Investment Term (${(weeklyRate * 100).toFixed(1)}% Weekly Return Rate)`,
      balanceAfterUSD: record.fintechState.sampleBalanceUSDT,
      timestamp: now.toISOString(),
    });
    saveDb(db);
    return { investment: inv, message: `Investment of $${principal.toLocaleString()} USD activated successfully.` };
  },

  getWithdrawals: async (token: string | null): Promise<{ withdrawals: WithdrawalRequest[] }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return {
      withdrawals: db.withdrawals
        .filter((w) => w.userId === record.id)
        .map(({ userId: _, ...rest }) => rest),
    };
  },

  submitWithdrawal: async (
    token: string | null,
    payload: {
      currency: CryptoWallet['currency'];
      network: string;
      destinationAddress: string;
      amountUSD: number;
    },
    settings: PlatformSettings
  ) => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    const amountUSD = Number(payload.amountUSD);
    if (!amountUSD || amountUSD < settings.minWithdrawalUSD) {
      throw new Error(`Minimum withdrawal amount is $${settings.minWithdrawalUSD.toLocaleString()} USD.`);
    }
    if (!payload.destinationAddress || payload.destinationAddress.trim().length < 24) {
      throw new Error('Please provide a valid destination cryptocurrency wallet address.');
    }
    const avail = record.fintechState.sampleBalanceUSDT || 0;
    if (avail < amountUSD) {
      throw new Error(`Withdrawal exceeds available balance. Available: $${avail.toLocaleString()} USD.`);
    }
    const feeUSD = Math.round(amountUSD * settings.withdrawalFeePercentage * 100) / 100;
    const netAmountUSD = Math.round((amountUSD - feeUSD) * 100) / 100;
    const now = new Date().toISOString();
    const withdrawal: WithdrawalRequest = {
      id: generateId('wth'),
      customerId: record.customerId,
      userEmail: record.email,
      currency: payload.currency,
      network: payload.network,
      destinationAddress: payload.destinationAddress.trim(),
      amountUSD,
      feeUSD,
      netAmountUSD,
      status: 'SUBMITTED',
      submittedAt: now,
    };
    record.fintechState.sampleBalanceUSDT = Math.max(0, avail - amountUSD);
    db.withdrawals.unshift({ ...withdrawal, userId: record.id });
    db.ledger.unshift({
      id: generateId('led'),
      userId: record.id,
      customerId: record.customerId,
      type: 'WITHDRAWAL_LOCK',
      amountUSD: -amountUSD,
      referenceId: withdrawal.id,
      description: `Withdrawal Requested: $${amountUSD.toLocaleString()} USD`,
      balanceAfterUSD: record.fintechState.sampleBalanceUSDT,
      timestamp: now,
    });
    saveDb(db);
    return { withdrawal, message: 'Withdrawal request submitted for review.' };
  },

  getLedger: async (token: string | null): Promise<{ ledger: LedgerEntry[] }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return {
      ledger: db.ledger
        .filter((l) => l.userId === record.id)
        .map(({ userId: _, ...rest }) => rest),
    };
  },

  getNotifications: async (token: string | null): Promise<{ notifications: NotificationItem[] }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    return {
      notifications: db.notifications
        .filter((n) => n.userId === record.id)
        .map(({ userId: _, ...rest }) => rest),
    };
  },

  markNotificationRead: async (token: string | null, id: string) => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    const notif = db.notifications.find((n) => n.id === id && n.userId === record.id);
    if (notif) {
      notif.read = true;
      saveDb(db);
    }
    return { success: true };
  },

  markAllNotificationsRead: async (token: string | null) => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    db.notifications.forEach((n) => {
      if (n.userId === record.id) n.read = true;
    });
    saveDb(db);
    return { success: true };
  },

  getOverview: async (
    token: string | null,
    settings: PlatformSettings
  ): Promise<{ overview: ClientFinancialOverview; settings: PlatformSettings }> => {
    const db = await loadDb();
    const record = await requireUser(db, token);
    const avail = record.fintechState.sampleBalanceUSDT || 0;
    const activeInvestments = db.investments.filter((i) => i.userId === record.id && i.status === 'ACTIVE');
    const activeInvested =
      activeInvestments.length > 0
        ? activeInvestments.reduce((sum, i) => sum + i.principalAmountUSD, 0)
        : record.fintechState.investedBalanceUSDT || 0;
    const pendingDepositsUSD = db.deposits
      .filter((d) => d.userId === record.id && d.status !== 'CONFIRMED' && d.status !== 'REJECTED')
      .reduce((sum, d) => sum + d.intendedAmountUSD, 0);
    const pendingWithdrawalsUSD = db.withdrawals
      .filter((w) => w.userId === record.id && w.status !== 'COMPLETED' && w.status !== 'REJECTED')
      .reduce((sum, w) => sum + w.amountUSD, 0);

    return {
      overview: {
        totalBalanceUSD: Math.round((avail + activeInvested) * 100) / 100,
        availableBalanceUSD: Math.round(avail * 100) / 100,
        totalInvestedUSD: Math.round(activeInvested * 100) / 100,
        activeInvestmentsUSD: Math.round(activeInvested * 100) / 100,
        totalEarningsUSD: 0,
        pendingDepositsUSD: Math.round(pendingDepositsUSD * 100) / 100,
        pendingWithdrawalsUSD: Math.round(pendingWithdrawalsUSD * 100) / 100,
        weeklyProjectedEarningsUSD: Math.round(activeInvested * settings.weeklyReturnRate * 100) / 100,
      },
      settings,
    };
  },
};
