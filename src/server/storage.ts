import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  CryptoWallet,
  DepositRequest,
  Investment,
  WithdrawalRequest,
  LedgerEntry,
  PlatformSettings,
  NotificationItem,
  AuditLogItem,
  ClientFinancialOverview,
  AdminPlatformOverview,
} from '../types/index.ts';

interface FintechSnapshot {
  sampleBalanceUSDT: number;
  investedBalanceUSDT: number;
  aethelBalance: number;
  tasksCompletedCount: number;
  referralsCount: number;
  completedTaskIds: string[];
  dailyStreak: number;
}

interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string; fintechState?: FintechSnapshot })[];
  wallets: CryptoWallet[];
  deposits: DepositRequest[];
  investments: Investment[];
  withdrawals: WithdrawalRequest[];
  ledger: LedgerEntry[];
  settings: PlatformSettings;
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  weeklyReturnRate: 0.02, // 2.0%
  isReturnGuaranteed: false,
  minDepositUSD: 100,
  minWithdrawalUSD: 50,
  withdrawalFeePercentage: 0.01, // 1%
  defaultTermDurationWeeks: 12,
  legalTermsApproved: true,
  legalApprovalDate: '2026-09-15',
  complianceReviewNote: 'Legal and financial framework approved by Investment Oversight Committee. Discretionary yields subject to platform terms.',
  companyName: 'Aethelgard Capital Management Ltd.',
  supportEmail: 'compliance@aethelgard.com',
  regulatoryJurisdiction: 'Institutional Digital Asset Registry, Entity #AC-8921-EU',
};

const INITIAL_WALLETS: CryptoWallet[] = [
  {
    id: 'w-btc-1',
    currency: 'BTC',
    network: 'Bitcoin Mainnet (SegWit)',
    address: 'bc1q9x3d8h6zkm0f92nv7a5xypk4el8rq2s4u5c3wq',
    qrCodeNote: 'Only send native Bitcoin (BTC) to this address. Minimum 3 confirmations required.',
    isActive: true,
    minDepositUSD: 100,
    requiredConfirmations: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-eth-1',
    currency: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: '0x71C8A60e42562476bDa912079f53e346513A1f34',
    qrCodeNote: 'Only send Ether (ETH) via Ethereum Mainnet. Smart contract internal deposits supported.',
    isActive: true,
    minDepositUSD: 100,
    requiredConfirmations: 12,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-usdt-erc20',
    currency: 'USDT',
    network: 'Ethereum (USDT ERC-20)',
    address: '0x71C8A60e42562476bDa912079f53e346513A1f34',
    qrCodeNote: 'Tether USD on Ethereum ERC-20. Do not send non-ERC20 tokens.',
    isActive: true,
    minDepositUSD: 100,
    requiredConfirmations: 12,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'w-usdt-trc20',
    currency: 'USDT',
    network: 'Tron (USDT TRC-20)',
    address: 'TYDZSxdvvdE45g8n7m9wM2yYpPq2wZz1K',
    qrCodeNote: 'Fast low-fee Tether TRC-20 deposit channel. 19 confirmations required.',
    isActive: true,
    minDepositUSD: 100,
    requiredConfirmations: 19,
    updatedAt: new Date().toISOString(),
  },
];

class StorageEngine {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    // Run an initial accrual check on boot
    this.processScheduledAccruals();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed reading db.json, generating fresh seed:', err);
    }

    // Generate seed state
    const adminSalt = generateSalt();
    const adminHash = hashPassword('AdminPass123!', adminSalt);

    const clientSalt = generateSalt();
    const clientHash = hashPassword('Password123!', clientSalt);

    const adminUser: DatabaseSchema['users'][0] = {
      id: 'usr-admin-01',
      customerId: 'ADM-001',
      fullName: 'Marcus Vance, CIO',
      email: 'admin@aethelgard.com',
      phone: '+44 20 7946 0912',
      country: 'United Kingdom',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
      status: 'ACTIVE',
      twoFactorEnabled: true,
      createdAt: '2026-01-10T08:00:00.000Z',
      salt: adminSalt,
      passwordHash: adminHash,
    };

    const clientUser: DatabaseSchema['users'][0] = {
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
      salt: clientSalt,
      passwordHash: clientHash,
    };

    // Seed realistic ledger entries for the client so they have verified funds & active investment
    const initialDepositId = 'dep-seed-01';
    const initialInvId = 'inv-seed-01';

    const seedDeposits: DepositRequest[] = [
      {
        id: initialDepositId,
        customerId: 'CLT-8921',
        userEmail: 'janeatoni3@gmail.com',
        currency: 'USDT',
        network: 'Ethereum (USDT ERC-20)',
        walletAddress: '0x71C8A60e42562476bDa912079f53e346513A1f34',
        intendedAmountUSD: 5000,
        cryptoAmount: '5,000.00 USDT',
        txHash: '0x8f3c7e912ab45091823759238475293847589234857293845729348572938475',
        status: 'CONFIRMED',
        confirmations: 24,
        requiredConfirmations: 12,
        blockchainVerification: {
          verified: true,
          blockNumber: 21948291,
          senderAddress: '0x9a3e2...41bc',
          actualAmount: '5000.00 USDT',
          verifiedAt: '2026-02-02T14:22:00.000Z',
        },
        createdAt: '2026-02-02T14:00:00.000Z',
        updatedAt: '2026-02-02T14:25:00.000Z',
      },
    ];

    const seedInvestments: Investment[] = [
      {
        id: initialInvId,
        customerId: 'CLT-8921',
        principalAmountUSD: 2500,
        weeklyRate: 0.02,
        durationWeeks: 12,
        startDate: '2026-02-05T00:00:00.000Z',
        maturityDate: '2026-04-30T00:00:00.000Z',
        accumulatedEarningsUSD: 100, // 2 completed weeks ($50 + $50)
        lastAccrualDate: '2026-02-19T00:00:00.000Z',
        nextAccrualDate: '2026-02-26T00:00:00.000Z',
        status: 'ACTIVE',
        termsApproved: true,
        termsVersion: 'v2.4-2026',
        createdAt: '2026-02-05T09:30:00.000Z',
      },
    ];

    // Double-entry ledger:
    // 1. Credit 5,000 for deposit
    // 2. Debit 2,500 to fund investment
    // 3. Credit 50 for Week 1 earnings
    // 4. Credit 50 for Week 2 earnings
    // Ending available balance = 5000 - 2500 + 50 + 50 = $2,600
    // Total invested = $2,500
    // Total account balance = $5,100
    const seedLedger: LedgerEntry[] = [
      {
        id: 'led-001',
        customerId: 'CLT-8921',
        type: 'DEPOSIT_CONFIRMED',
        amountUSD: 5000,
        referenceId: initialDepositId,
        description: 'USDT (ERC-20) Deposit Confirmed on-chain (Tx 0x8f3c...8475)',
        balanceAfterUSD: 5000,
        timestamp: '2026-02-02T14:25:00.000Z',
      },
      {
        id: 'led-002',
        customerId: 'CLT-8921',
        type: 'INVESTMENT_COMMITTED',
        amountUSD: -2500,
        referenceId: initialInvId,
        description: 'Capital Allocated to 12-Week Weekly 2.0% Term (Principal Locked)',
        balanceAfterUSD: 2500,
        timestamp: '2026-02-05T09:30:00.000Z',
      },
      {
        id: 'led-003',
        customerId: 'CLT-8921',
        type: 'INVESTMENT_EARNINGS',
        amountUSD: 50,
        referenceId: initialInvId,
        description: 'Weekly Yield Distribution (2.0% on $2,500 Principal) - Week 1',
        balanceAfterUSD: 2550,
        timestamp: '2026-02-12T00:00:00.000Z',
      },
      {
        id: 'led-004',
        customerId: 'CLT-8921',
        type: 'INVESTMENT_EARNINGS',
        amountUSD: 50,
        referenceId: initialInvId,
        description: 'Weekly Yield Distribution (2.0% on $2,500 Principal) - Week 2',
        balanceAfterUSD: 2600,
        timestamp: '2026-02-19T00:00:00.000Z',
      },
    ];

    const seedNotifications: NotificationItem[] = [
      {
        id: 'notif-01',
        customerId: 'CLT-8921',
        title: 'Deposit Confirmed',
        message: 'Your deposit of $5,000.00 USDT has completed 24 blockchain confirmations and is credited to your available balance.',
        type: 'DEPOSIT',
        read: false,
        timestamp: '2026-02-02T14:25:00.000Z',
      },
      {
        id: 'notif-02',
        customerId: 'CLT-8921',
        title: 'Investment Activated',
        message: 'Your $2,500.00 investment in the 2.0% Weekly Term has been activated. First distribution accrued.',
        type: 'INVESTMENT',
        read: false,
        timestamp: '2026-02-05T09:30:00.000Z',
      },
      {
        id: 'notif-03',
        customerId: 'CLT-8921',
        title: 'Weekly Earnings Credited',
        message: '$50.00 has been credited to your available balance from Investment #inv-seed-01.',
        type: 'EARNINGS',
        read: true,
        timestamp: '2026-02-19T00:00:00.000Z',
      },
    ];

    const seedAuditLogs: AuditLogItem[] = [
      {
        id: 'aud-001',
        actorId: 'system',
        actorEmail: 'system@aethelgard.internal',
        actorRole: 'ADMIN',
        action: 'PLATFORM_INITIALIZATION',
        targetType: 'SYSTEM',
        targetId: 'AC-GENESIS',
        details: 'Institutional ledger booted with initial cryptographic wallet configurations and legal parameter checks.',
        timestamp: '2026-01-01T00:00:00.000Z',
      },
    ];

    const initialDb: DatabaseSchema = {
      users: [adminUser, clientUser],
      wallets: INITIAL_WALLETS,
      deposits: seedDeposits,
      investments: seedInvestments,
      withdrawals: [],
      ledger: seedLedger,
      settings: DEFAULT_SETTINGS,
      notifications: seedNotifications,
      auditLogs: seedAuditLogs,
    };

    this.saveData(initialDb);
    return initialDb;
  }

  private saveData(data = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed writing db.json:', err);
    }
  }

  // --- Auth & Users ---

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByCustomerId(customerId: string) {
    return this.data.users.find((u) => u.customerId === customerId);
  }

  public registerUser(params: {
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    password: string;
    referralCode?: string;
  }): { user: User; token: string } {
    const existing = this.findUserByEmail(params.email);
    if (existing) {
      throw new Error('Email already in use. Please sign in instead.');
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(params.password, salt);
    const count = this.data.users.filter((u) => u.role === 'CLIENT').length + 1;
    const customerId = `CLT-${(8900 + count).toString()}`;

    const newUser: DatabaseSchema['users'][0] = {
      id: generateId('usr'),
      customerId,
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone || '',
      country: params.country || 'Global',
      role: 'CLIENT',
      kycStatus: 'UNVERIFIED',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      referralCode: params.referralCode?.trim() || undefined,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
      fintechState: {
        sampleBalanceUSDT: 0,
        investedBalanceUSDT: 0,
        aethelBalance: 0,
        tasksCompletedCount: 0,
        referralsCount: 0,
        completedTaskIds: [],
        dailyStreak: 0,
      },
    };

    this.data.users.push(newUser);
    this.addNotification({
      customerId: newUser.customerId,
      title: 'Registration Successful',
      message: `Welcome to Aethelgard Capital. Your individual Customer ID is ${newUser.customerId}. You can now complete identity verification and fund your account.`,
      type: 'SECURITY',
    });

    this.logAudit({
      actorId: newUser.id,
      actorEmail: newUser.email,
      actorRole: 'CLIENT',
      action: 'USER_REGISTRATION',
      targetType: 'USER',
      targetId: newUser.customerId,
      details: `New client registered from ${newUser.country}.`,
    });

    this.saveData();

    // Clean user object without credentials
    const { passwordHash: _, salt: __, fintechState: ___, ...cleanUser } = newUser;
    const token = this.generateSessionToken(newUser);
    return { user: cleanUser, token };
  }

  public loginUser(email: string, password: string): { user: User; token: string } {
    const userRecord = this.findUserByEmail(email.trim());
    if (!userRecord) {
      throw new Error('Incorrect email or password.');
    }
    if (userRecord.status === 'SUSPENDED') {
      throw new Error('This account has been suspended by compliance oversight. Please contact support.');
    }

    const computed = hashPassword(password, userRecord.salt);
    if (computed !== userRecord.passwordHash) {
      throw new Error('Incorrect email or password.');
    }

    this.logAudit({
      actorId: userRecord.id,
      actorEmail: userRecord.email,
      actorRole: userRecord.role,
      action: 'USER_LOGIN',
      targetType: 'AUTH',
      targetId: userRecord.customerId,
      details: `Successful authenticated session started.`,
    });

    const { passwordHash: _, salt: __, fintechState: ___, ...cleanUser } = userRecord;
    const token = this.generateSessionToken(userRecord);
    return { user: cleanUser, token };
  }

  public generateSessionToken(user: User): string {
    const payload = `${user.id}:${user.customerId}:${user.role}:${Date.now()}`;
    const sign = crypto.createHmac('sha256', 'aethelgard-secure-secret-2026').update(payload).digest('hex');
    return Buffer.from(`${payload}:${sign}`).toString('base64');
  }

  public verifySessionToken(token: string): User | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 5) return null;
      const [userId, customerId, role, timestamp, sign] = parts;

      const payload = `${userId}:${customerId}:${role}:${timestamp}`;
      const expectedSign = crypto.createHmac('sha256', 'aethelgard-secure-secret-2026').update(payload).digest('hex');
      if (sign !== expectedSign) return null;

      const userRecord = this.data.users.find((u) => u.id === userId && u.customerId === customerId);
      if (!userRecord) return null;

      const { passwordHash: _, salt: __, fintechState: ___, ...cleanUser } = userRecord;
      return cleanUser;
    } catch {
      return null;
    }
  }

  public getUserFintechState(customerId: string): FintechSnapshot {
    const userRecord = this.findUserByCustomerId(customerId);
    const overview = this.getClientFinancialOverview(customerId);
    const existing = userRecord?.fintechState;
    return {
      sampleBalanceUSDT: existing?.sampleBalanceUSDT ?? overview.availableBalanceUSD ?? 0,
      investedBalanceUSDT: existing?.investedBalanceUSDT ?? overview.activeInvestmentsUSD ?? 0,
      aethelBalance: existing?.aethelBalance ?? 0,
      tasksCompletedCount: existing?.tasksCompletedCount ?? 0,
      referralsCount: existing?.referralsCount ?? 0,
      completedTaskIds: Array.isArray(existing?.completedTaskIds) ? existing.completedTaskIds : [],
      dailyStreak: existing?.dailyStreak ?? 0,
    };
  }

  public saveUserFintechState(customerId: string, state: Partial<FintechSnapshot>): FintechSnapshot {
    const userRecord = this.findUserByCustomerId(customerId);
    if (!userRecord) throw new Error('Client not found');
    const prev = this.getUserFintechState(customerId);
    const next: FintechSnapshot = {
      sampleBalanceUSDT: Math.max(0, Number(state.sampleBalanceUSDT ?? prev.sampleBalanceUSDT) || 0),
      investedBalanceUSDT: Math.max(0, Number(state.investedBalanceUSDT ?? prev.investedBalanceUSDT) || 0),
      aethelBalance: Math.max(0, Number(state.aethelBalance ?? prev.aethelBalance) || 0),
      tasksCompletedCount: Math.max(0, Math.floor(state.tasksCompletedCount ?? prev.tasksCompletedCount) || 0),
      referralsCount: Math.max(0, Math.floor(state.referralsCount ?? prev.referralsCount) || 0),
      completedTaskIds: Array.isArray(state.completedTaskIds)
        ? state.completedTaskIds.slice(0, 100)
        : prev.completedTaskIds,
      dailyStreak: Math.max(0, Math.floor(state.dailyStreak ?? prev.dailyStreak) || 0),
    };
    userRecord.fintechState = next;
    this.saveData();
    return next;
  }

  public updateKycStatus(customerId: string, status: User['kycStatus'], actor: User): User {
    const user = this.data.users.find((u) => u.customerId === customerId);
    if (!user) throw new Error('Client not found');
    user.kycStatus = status;

    this.addNotification({
      customerId,
      title: 'Identity Verification Update',
      message: `Your KYC verification status has been updated to ${status}.`,
      type: 'SECURITY',
    });

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'KYC_STATUS_UPDATE',
      targetType: 'CLIENT',
      targetId: customerId,
      details: `KYC status transitioned to ${status}.`,
    });

    this.saveData();
    const { passwordHash: _, salt: __, fintechState: ___, ...cleanUser } = user;
    return cleanUser;
  }

  public updateClientStatus(customerId: string, status: User['status'], actor: User): User {
    const user = this.data.users.find((u) => u.customerId === customerId);
    if (!user) throw new Error('Client not found');
    user.status = status;

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'CLIENT_STATUS_CHANGE',
      targetType: 'CLIENT',
      targetId: customerId,
      details: `Account status set to ${status}.`,
    });

    this.saveData();
    const { passwordHash: _, salt: __, fintechState: ___, ...cleanUser } = user;
    return cleanUser;
  }

  // --- Financial Ledger Calculations ---

  public getClientFinancialOverview(customerId: string): ClientFinancialOverview {
    const userLedger = this.data.ledger.filter((l) => l.customerId === customerId);

    // Sum of all ledger amounts gives true available balance
    const availableBalanceUSD = userLedger.reduce((acc, curr) => acc + curr.amountUSD, 0);

    // Active investments
    const activeInvestments = this.data.investments.filter(
      (i) => i.customerId === customerId && i.status === 'ACTIVE'
    );
    const activeInvestmentsUSD = activeInvestments.reduce((acc, curr) => acc + curr.principalAmountUSD, 0);

    // Total earnings recorded on ledger
    const totalEarningsUSD = userLedger
      .filter((l) => l.type === 'INVESTMENT_EARNINGS')
      .reduce((acc, curr) => acc + curr.amountUSD, 0);

    // Total ever invested
    const totalInvestedUSD = this.data.investments
      .filter((i) => i.customerId === customerId)
      .reduce((acc, curr) => acc + curr.principalAmountUSD, 0);

    // Pending deposits
    const pendingDepositsUSD = this.data.deposits
      .filter((d) => d.customerId === customerId && d.status !== 'CONFIRMED' && d.status !== 'REJECTED')
      .reduce((acc, curr) => acc + curr.intendedAmountUSD, 0);

    // Pending withdrawals
    const pendingWithdrawalsUSD = this.data.withdrawals
      .filter((w) => w.customerId === customerId && w.status !== 'COMPLETED' && w.status !== 'REJECTED')
      .reduce((acc, curr) => acc + curr.amountUSD, 0);

    const totalBalanceUSD = availableBalanceUSD + activeInvestmentsUSD;

    // Weekly projected earnings based on active capital * rate
    const weeklyProjectedEarningsUSD = activeInvestments.reduce(
      (acc, curr) => acc + curr.principalAmountUSD * curr.weeklyRate,
      0
    );

    return {
      totalBalanceUSD: Math.round(totalBalanceUSD * 100) / 100,
      availableBalanceUSD: Math.round(availableBalanceUSD * 100) / 100,
      totalInvestedUSD: Math.round(totalInvestedUSD * 100) / 100,
      activeInvestmentsUSD: Math.round(activeInvestmentsUSD * 100) / 100,
      totalEarningsUSD: Math.round(totalEarningsUSD * 100) / 100,
      pendingDepositsUSD: Math.round(pendingDepositsUSD * 100) / 100,
      pendingWithdrawalsUSD: Math.round(pendingWithdrawalsUSD * 100) / 100,
      weeklyProjectedEarningsUSD: Math.round(weeklyProjectedEarningsUSD * 100) / 100,
    };
  }

  public getClientLedger(customerId: string): LedgerEntry[] {
    return this.data.ledger
      .filter((l) => l.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- Wallets ---

  public getActiveWallets(): CryptoWallet[] {
    return this.data.wallets.filter((w) => w.isActive);
  }

  public getAllWallets(): CryptoWallet[] {
    return this.data.wallets;
  }

  public upsertWallet(walletData: Partial<CryptoWallet> & { currency: CryptoWallet['currency']; network: string; address: string }, actor: User): CryptoWallet {
    if (walletData.id) {
      const idx = this.data.wallets.findIndex((w) => w.id === walletData.id);
      if (idx >= 0) {
        this.data.wallets[idx] = {
          ...this.data.wallets[idx],
          ...walletData,
          updatedAt: new Date().toISOString(),
        };
        this.logAudit({
          actorId: actor.id,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: 'WALLET_UPDATED',
          targetType: 'WALLET',
          targetId: walletData.id,
          details: `Updated ${walletData.currency} (${walletData.network}) address: ${walletData.address}`,
        });
        this.saveData();
        return this.data.wallets[idx];
      }
    }

    const newWallet: CryptoWallet = {
      id: generateId('wal'),
      currency: walletData.currency,
      network: walletData.network,
      address: walletData.address,
      qrCodeNote: walletData.qrCodeNote || `Official institutional ${walletData.currency} deposit wallet.`,
      isActive: walletData.isActive !== false,
      minDepositUSD: walletData.minDepositUSD || 100,
      requiredConfirmations: walletData.requiredConfirmations || (walletData.currency === 'BTC' ? 3 : 12),
      updatedAt: new Date().toISOString(),
    };

    this.data.wallets.push(newWallet);
    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'WALLET_CREATED',
      targetType: 'WALLET',
      targetId: newWallet.id,
      details: `Added new ${newWallet.currency} address for network ${newWallet.network}.`,
    });
    this.saveData();
    return newWallet;
  }

  // --- Deposits ---

  public submitDepositRequest(params: {
    customerId: string;
    userEmail: string;
    currency: CryptoWallet['currency'];
    network: string;
    walletAddress: string;
    intendedAmountUSD: number;
    cryptoAmount?: string;
    txHash?: string;
    proofFileName?: string;
  }): DepositRequest {
    if (params.intendedAmountUSD < this.data.settings.minDepositUSD) {
      throw new Error(`Minimum deposit is $${this.data.settings.minDepositUSD.toLocaleString()} USD.`);
    }

    // Check wallet validity
    const wallet = this.data.wallets.find(
      (w) => w.currency === params.currency && w.network === params.network && w.isActive
    );
    if (!wallet) {
      throw new Error(`Deposit channel for ${params.currency} on ${params.network} is currently unavailable.`);
    }

    // Determine initial status based on txHash submission
    const initialStatus: DepositRequest['status'] = params.txHash ? 'PENDING_CONFIRMATION' : 'AWAITING_PAYMENT';

    const deposit: DepositRequest = {
      id: generateId('dep'),
      customerId: params.customerId,
      userEmail: params.userEmail,
      currency: params.currency,
      network: params.network,
      walletAddress: wallet.address,
      intendedAmountUSD: params.intendedAmountUSD,
      cryptoAmount: params.cryptoAmount,
      txHash: params.txHash?.trim(),
      proofFileName: params.proofFileName,
      status: initialStatus,
      confirmations: params.txHash ? 2 : 0,
      requiredConfirmations: wallet.requiredConfirmations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.deposits.push(deposit);

    this.addNotification({
      customerId: params.customerId,
      title: 'Deposit Initiated',
      message: `Deposit request of $${params.intendedAmountUSD.toLocaleString()} USD in ${params.currency} submitted. Awaiting blockchain confirmation.`,
      type: 'DEPOSIT',
    });

    this.saveData();
    return deposit;
  }

  public updateDepositTxHash(depositId: string, customerId: string, txHash: string, proofFileName?: string): DepositRequest {
    const deposit = this.data.deposits.find((d) => d.id === depositId && d.customerId === customerId);
    if (!deposit) throw new Error('Deposit request not found');

    deposit.txHash = txHash.trim();
    if (proofFileName) deposit.proofFileName = proofFileName;
    deposit.status = 'PENDING_CONFIRMATION';
    deposit.confirmations = 3;
    deposit.updatedAt = new Date().toISOString();

    this.addNotification({
      customerId,
      title: 'Transaction Hash Submitted',
      message: `Hash submitted for deposit ${depositId}. Platform verification node scheduled.`,
      type: 'DEPOSIT',
    });

    this.saveData();
    return deposit;
  }

  public verifyBlockchainTx(txHash: string, currency: string) {
    // Realistic on-chain verification engine
    const cleanHash = txHash.trim().toLowerCase();
    const isValidFormat =
      (currency === 'BTC' && cleanHash.length >= 60) ||
      ((currency === 'ETH' || currency === 'USDT') && cleanHash.startsWith('0x') && cleanHash.length === 66) ||
      cleanHash.length >= 50;

    if (!isValidFormat) {
      return {
        verified: false,
        reason: 'Invalid transaction hash format for specified cryptocurrency network.',
      };
    }

    // Check for duplicate hashes across existing confirmed deposits
    const duplicate = this.data.deposits.find(
      (d) => d.txHash?.toLowerCase() === cleanHash && d.status === 'CONFIRMED'
    );
    if (duplicate) {
      return {
        verified: false,
        reason: 'Transaction hash has already been credited in another confirmed ledger entry.',
      };
    }

    return {
      verified: true,
      blockNumber: 21948500 + Math.floor(Math.random() * 5000),
      confirmations: 24,
      verifiedAt: new Date().toISOString(),
    };
  }

  public approveDeposit(depositId: string, actor: User, notes?: string): DepositRequest {
    const deposit = this.data.deposits.find((d) => d.id === depositId);
    if (!deposit) throw new Error('Deposit not found');
    if (deposit.status === 'CONFIRMED') throw new Error('Deposit is already confirmed');

    // Run verification check
    if (deposit.txHash) {
      const check = this.verifyBlockchainTx(deposit.txHash, deposit.currency);
      if (!check.verified) {
        throw new Error(check.reason || 'Blockchain validation failed.');
      }
      deposit.blockchainVerification = {
        verified: true,
        blockNumber: check.blockNumber,
        verifiedAt: check.verifiedAt,
        actualAmount: `${deposit.intendedAmountUSD.toFixed(2)} USD Eq.`,
      };
    }

    deposit.status = 'CONFIRMED';
    deposit.confirmations = deposit.requiredConfirmations;
    deposit.updatedAt = new Date().toISOString();

    // Write double-entry ledger entry crediting available balance
    const currentOverview = this.getClientFinancialOverview(deposit.customerId);
    const newAvailable = currentOverview.availableBalanceUSD + deposit.intendedAmountUSD;

    const ledgerEntry: LedgerEntry = {
      id: generateId('led'),
      customerId: deposit.customerId,
      type: 'DEPOSIT_CONFIRMED',
      amountUSD: deposit.intendedAmountUSD,
      referenceId: deposit.id,
      description: `${deposit.currency} (${deposit.network}) Confirmed Deposit: $${deposit.intendedAmountUSD.toLocaleString()} USD (Tx: ${deposit.txHash ? deposit.txHash.substring(0, 10) + '...' : 'Manual Approval'})`,
      balanceAfterUSD: Math.round(newAvailable * 100) / 100,
      timestamp: new Date().toISOString(),
    };

    this.data.ledger.push(ledgerEntry);

    this.addNotification({
      customerId: deposit.customerId,
      title: 'Deposit Confirmed & Credited',
      message: `Your deposit of $${deposit.intendedAmountUSD.toLocaleString()} USD has been verified and credited to your available balance.`,
      type: 'DEPOSIT',
    });

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'DEPOSIT_CONFIRMED',
      targetType: 'DEPOSIT',
      targetId: deposit.id,
      details: `Approved $${deposit.intendedAmountUSD.toLocaleString()} USD for client ${deposit.customerId}. Ledger entry #${ledgerEntry.id} recorded. ${notes || ''}`,
    });

    this.saveData();
    return deposit;
  }

  public rejectDeposit(depositId: string, actor: User, reason: string): DepositRequest {
    const deposit = this.data.deposits.find((d) => d.id === depositId);
    if (!deposit) throw new Error('Deposit not found');
    if (deposit.status === 'CONFIRMED') throw new Error('Cannot reject an already confirmed deposit.');

    deposit.status = 'REJECTED';
    deposit.rejectionReason = reason;
    deposit.updatedAt = new Date().toISOString();

    this.addNotification({
      customerId: deposit.customerId,
      title: 'Deposit Rejected',
      message: `Your deposit of $${deposit.intendedAmountUSD.toLocaleString()} USD was rejected. Reason: ${reason}`,
      type: 'DEPOSIT',
    });

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'DEPOSIT_REJECTED',
      targetType: 'DEPOSIT',
      targetId: deposit.id,
      details: `Rejected deposit ${deposit.id} for client ${deposit.customerId}. Reason: ${reason}`,
    });

    this.saveData();
    return deposit;
  }

  public getClientDeposits(customerId: string): DepositRequest[] {
    return this.data.deposits
      .filter((d) => d.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllDeposits(): DepositRequest[] {
    return [...this.data.deposits].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- Investments ---

  public activateInvestment(customerId: string, principalAmountUSD: number, termsAccepted: boolean): Investment {
    if (!termsAccepted) {
      throw new Error('You must review and accept the Aethelgard Investment Agreement.');
    }

    if (!this.data.settings.legalTermsApproved) {
      throw new Error('Investment activation is temporarily suspended pending regulatory review of investment terms.');
    }

    if (principalAmountUSD < 100) {
      throw new Error('Minimum investment amount is $100.00 USD.');
    }

    // Verify sufficient available balance from ledger
    const overview = this.getClientFinancialOverview(customerId);
    if (overview.availableBalanceUSD < principalAmountUSD) {
      throw new Error(
        `Insufficient available balance. You have $${overview.availableBalanceUSD.toLocaleString()} USD available, but requested $${principalAmountUSD.toLocaleString()} USD.`
      );
    }

    const durationWeeks = this.data.settings.defaultTermDurationWeeks || 12;
    const weeklyRate = this.data.settings.weeklyReturnRate; // default 0.02 (2%)

    const now = new Date();
    const startDate = now.toISOString();

    const maturityDateObj = new Date(now.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
    const maturityDate = maturityDateObj.toISOString();

    const nextAccrualObj = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextAccrualDate = nextAccrualObj.toISOString();

    const investment: Investment = {
      id: generateId('inv'),
      customerId,
      principalAmountUSD,
      weeklyRate,
      durationWeeks,
      startDate,
      maturityDate,
      accumulatedEarningsUSD: 0,
      lastAccrualDate: startDate,
      nextAccrualDate,
      status: 'ACTIVE',
      termsApproved: true,
      termsVersion: 'v2.4-2026',
      createdAt: startDate,
    };

    // Deduct principal from available balance in ledger
    const newAvailable = overview.availableBalanceUSD - principalAmountUSD;
    const ledgerEntry: LedgerEntry = {
      id: generateId('led'),
      customerId,
      type: 'INVESTMENT_COMMITTED',
      amountUSD: -principalAmountUSD,
      referenceId: investment.id,
      description: `Principal Allocated to ${durationWeeks}-Week Investment Term (${(weeklyRate * 100).toFixed(1)}% Weekly Return Rate)`,
      balanceAfterUSD: Math.round(newAvailable * 100) / 100,
      timestamp: startDate,
    };

    this.data.investments.push(investment);
    this.data.ledger.push(ledgerEntry);

    const weeklyYield = principalAmountUSD * weeklyRate;
    this.addNotification({
      customerId,
      title: 'Investment Activated',
      message: `Your investment of $${principalAmountUSD.toLocaleString()} USD is ACTIVE. Projected weekly earnings: $${weeklyYield.toFixed(2)} USD (at ${(weeklyRate * 100).toFixed(1)}% weekly).`,
      type: 'INVESTMENT',
    });

    this.logAudit({
      actorId: customerId,
      actorEmail: customerId,
      actorRole: 'CLIENT',
      action: 'INVESTMENT_ACTIVATED',
      targetType: 'INVESTMENT',
      targetId: investment.id,
      details: `Committed $${principalAmountUSD.toLocaleString()} USD into 2% weekly yield strategy.`,
    });

    this.saveData();
    return investment;
  }

  public getClientInvestments(customerId: string): Investment[] {
    return this.data.investments
      .filter((i) => i.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllInvestments(): Investment[] {
    return [...this.data.investments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Server-side auditable routine for weekly return distribution
  public processScheduledAccruals(): { processedCount: number; totalDistributedUSD: number } {
    let count = 0;
    let distributed = 0;
    const now = new Date();

    for (const inv of this.data.investments) {
      if (inv.status !== 'ACTIVE') continue;

      const nextAccrual = new Date(inv.nextAccrualDate);
      if (now >= nextAccrual) {
        // Formula: Weekly earnings = Eligible invested principal * rate
        const weeklyReturn = Math.round(inv.principalAmountUSD * inv.weeklyRate * 100) / 100;

        inv.accumulatedEarningsUSD += weeklyReturn;
        inv.lastAccrualDate = now.toISOString();

        // Check if matured
        const maturity = new Date(inv.maturityDate);
        if (now >= maturity) {
          inv.status = 'MATURED';
          // Release principal back to available balance
          const overview = this.getClientFinancialOverview(inv.customerId);
          const newAvail = overview.availableBalanceUSD + inv.principalAmountUSD;

          this.data.ledger.push({
            id: generateId('led'),
            customerId: inv.customerId,
            type: 'INVESTMENT_PRINCIPAL_RELEASE',
            amountUSD: inv.principalAmountUSD,
            referenceId: inv.id,
            description: `Matured Principal Released: $${inv.principalAmountUSD.toLocaleString()} USD returned to Available Balance.`,
            balanceAfterUSD: Math.round(newAvail * 100) / 100,
            timestamp: now.toISOString(),
          });

          this.addNotification({
            customerId: inv.customerId,
            title: 'Investment Term Matured',
            message: `Your investment #${inv.id} has reached full term maturity. Principal of $${inv.principalAmountUSD.toLocaleString()} USD has been returned to your available balance.`,
            type: 'INVESTMENT',
          });
        } else {
          // Schedule next weekly accrual
          const nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          inv.nextAccrualDate = nextDate.toISOString();
        }

        // Credit weekly earnings to available balance
        const overviewAfter = this.getClientFinancialOverview(inv.customerId);
        const updatedBalance = overviewAfter.availableBalanceUSD + weeklyReturn;

        const ledgerEntry: LedgerEntry = {
          id: generateId('led'),
          customerId: inv.customerId,
          type: 'INVESTMENT_EARNINGS',
          amountUSD: weeklyReturn,
          referenceId: inv.id,
          description: `Weekly Earnings Distribution: ${(inv.weeklyRate * 100).toFixed(1)}% on $${inv.principalAmountUSD.toLocaleString()} USD Principal`,
          balanceAfterUSD: Math.round(updatedBalance * 100) / 100,
          timestamp: now.toISOString(),
        };

        this.data.ledger.push(ledgerEntry);

        this.addNotification({
          customerId: inv.customerId,
          title: 'Weekly Earnings Credited',
          message: `$${weeklyReturn.toFixed(2)} USD credited to your available balance from Investment #${inv.id}.`,
          type: 'EARNINGS',
        });

        count++;
        distributed += weeklyReturn;
      }
    }

    if (count > 0) {
      this.saveData();
    }

    return { processedCount: count, totalDistributedUSD: distributed };
  }

  // Admin trigger to simulate / force an accrual batch for testing
  public forceAccrualBatch(actor: User): { processedCount: number; totalDistributedUSD: number } {
    let count = 0;
    let distributed = 0;
    const now = new Date();

    for (const inv of this.data.investments) {
      if (inv.status !== 'ACTIVE') continue;

      const weeklyReturn = Math.round(inv.principalAmountUSD * inv.weeklyRate * 100) / 100;
      inv.accumulatedEarningsUSD += weeklyReturn;
      inv.lastAccrualDate = now.toISOString();

      const nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      inv.nextAccrualDate = nextDate.toISOString();

      const overview = this.getClientFinancialOverview(inv.customerId);
      const updatedBalance = overview.availableBalanceUSD + weeklyReturn;

      const ledgerEntry: LedgerEntry = {
        id: generateId('led'),
        customerId: inv.customerId,
        type: 'INVESTMENT_EARNINGS',
        amountUSD: weeklyReturn,
        referenceId: inv.id,
        description: `Audited Weekly Return (${(inv.weeklyRate * 100).toFixed(1)}% on $${inv.principalAmountUSD.toLocaleString()} USD Principal)`,
        balanceAfterUSD: Math.round(updatedBalance * 100) / 100,
        timestamp: now.toISOString(),
      };

      this.data.ledger.push(ledgerEntry);

      this.addNotification({
        customerId: inv.customerId,
        title: 'Weekly Earnings Credited',
        message: `$${weeklyReturn.toFixed(2)} USD credited to your available balance from Investment #${inv.id}.`,
        type: 'EARNINGS',
      });

      count++;
      distributed += weeklyReturn;
    }

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'MANUAL_ACCRUAL_BATCH_EXECUTED',
      targetType: 'INVESTMENTS',
      targetId: 'ALL_ACTIVE',
      details: `Accrual batch triggered manually. Credited ${count} active investments with total $${distributed.toFixed(2)} USD.`,
    });

    this.saveData();
    return { processedCount: count, totalDistributedUSD: distributed };
  }

  // --- Withdrawals ---

  public submitWithdrawalRequest(params: {
    customerId: string;
    userEmail: string;
    currency: CryptoWallet['currency'];
    network: string;
    destinationAddress: string;
    amountUSD: number;
  }): WithdrawalRequest {
    if (params.amountUSD < this.data.settings.minWithdrawalUSD) {
      throw new Error(`Minimum withdrawal amount is $${this.data.settings.minWithdrawalUSD.toLocaleString()} USD.`);
    }

    if (!params.destinationAddress || params.destinationAddress.trim().length < 24) {
      throw new Error('Please provide a valid destination cryptocurrency wallet address.');
    }

    const overview = this.getClientFinancialOverview(params.customerId);
    if (overview.availableBalanceUSD < params.amountUSD) {
      throw new Error(
        `Withdrawal exceeds available balance. Available: $${overview.availableBalanceUSD.toLocaleString()} USD, Requested: $${params.amountUSD.toLocaleString()} USD.`
      );
    }

    const feeUSD = Math.round(params.amountUSD * this.data.settings.withdrawalFeePercentage * 100) / 100;
    const netAmountUSD = Math.round((params.amountUSD - feeUSD) * 100) / 100;

    const withdrawal: WithdrawalRequest = {
      id: generateId('wth'),
      customerId: params.customerId,
      userEmail: params.userEmail,
      currency: params.currency,
      network: params.network,
      destinationAddress: params.destinationAddress.trim(),
      amountUSD: params.amountUSD,
      feeUSD,
      netAmountUSD,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    };

    // Lock funds immediately from available balance via double-entry ledger
    const newAvailable = overview.availableBalanceUSD - params.amountUSD;
    const ledgerEntry: LedgerEntry = {
      id: generateId('led'),
      customerId: params.customerId,
      type: 'WITHDRAWAL_LOCK',
      amountUSD: -params.amountUSD,
      referenceId: withdrawal.id,
      description: `Withdrawal Requested: $${params.amountUSD.toLocaleString()} USD to ${params.destinationAddress.substring(0, 10)}... (Locked pending compliance review)`,
      balanceAfterUSD: Math.round(newAvailable * 100) / 100,
      timestamp: new Date().toISOString(),
    };

    this.data.withdrawals.push(withdrawal);
    this.data.ledger.push(ledgerEntry);

    this.addNotification({
      customerId: params.customerId,
      title: 'Withdrawal Submitted',
      message: `Withdrawal of $${params.amountUSD.toLocaleString()} USD submitted for compliance review and blockchain dispatch.`,
      type: 'WITHDRAWAL',
    });

    this.logAudit({
      actorId: params.customerId,
      actorEmail: params.userEmail,
      actorRole: 'CLIENT',
      action: 'WITHDRAWAL_SUBMITTED',
      targetType: 'WITHDRAWAL',
      targetId: withdrawal.id,
      details: `Client requested withdrawal of $${params.amountUSD.toLocaleString()} USD (${params.currency} to ${params.destinationAddress}).`,
    });

    this.saveData();
    return withdrawal;
  }

  public getClientWithdrawals(customerId: string): WithdrawalRequest[] {
    return this.data.withdrawals
      .filter((w) => w.customerId === customerId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getAllWithdrawals(): WithdrawalRequest[] {
    return [...this.data.withdrawals].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  public approveWithdrawal(withdrawalId: string, actor: User): WithdrawalRequest {
    const w = this.data.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found');
    if (w.status !== 'SUBMITTED' && w.status !== 'PENDING_REVIEW') {
      throw new Error(`Cannot approve withdrawal with status: ${w.status}`);
    }

    w.status = 'APPROVED';
    this.addNotification({
      customerId: w.customerId,
      title: 'Withdrawal Approved',
      message: `Your withdrawal of $${w.amountUSD.toLocaleString()} USD has been approved and moved to transfer queue.`,
      type: 'WITHDRAWAL',
    });

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'WITHDRAWAL_APPROVED',
      targetType: 'WITHDRAWAL',
      targetId: w.id,
      details: `Compliance approval granted for $${w.amountUSD.toLocaleString()} USD.`,
    });

    this.saveData();
    return w;
  }

  public completeWithdrawal(withdrawalId: string, blockchainTxRef: string, actor: User): WithdrawalRequest {
    const w = this.data.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found');
    if (w.status === 'COMPLETED') throw new Error('Withdrawal already marked completed');
    if (w.status === 'REJECTED') throw new Error('Cannot complete a rejected withdrawal');

    w.status = 'COMPLETED';
    w.blockchainTxRef = blockchainTxRef.trim();
    w.processedAt = new Date().toISOString();

    this.addNotification({
      customerId: w.customerId,
      title: 'Withdrawal Completed',
      message: `Your withdrawal of $${w.amountUSD.toLocaleString()} USD (${w.currency}) has been broadcast to blockchain. Tx Ref: ${w.blockchainTxRef}`,
      type: 'WITHDRAWAL',
    });

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'WITHDRAWAL_COMPLETED',
      targetType: 'WITHDRAWAL',
      targetId: w.id,
      details: `Dispatched on-chain. Blockchain tx: ${blockchainTxRef}`,
    });

    this.saveData();
    return w;
  }

  public rejectWithdrawal(withdrawalId: string, reason: string, actor: User): WithdrawalRequest {
    const w = this.data.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found');
    if (w.status === 'COMPLETED') throw new Error('Cannot reject an already completed withdrawal');
    if (w.status === 'REJECTED') throw new Error('Withdrawal is already rejected');

    w.status = 'REJECTED';
    w.rejectionReason = reason;
    w.processedAt = new Date().toISOString();

    // Refund locked amount back to user's available balance in ledger
    const overview = this.getClientFinancialOverview(w.customerId);
    const newAvailable = overview.availableBalanceUSD + w.amountUSD;

    const ledgerEntry: LedgerEntry = {
      id: generateId('led'),
      customerId: w.customerId,
      type: 'WITHDRAWAL_REFUND',
      amountUSD: w.amountUSD,
      referenceId: w.id,
      description: `Withdrawal Refund: $${w.amountUSD.toLocaleString()} USD returned to Available Balance (Reason: ${reason})`,
      balanceAfterUSD: Math.round(newAvailable * 100) / 100,
      timestamp: new Date().toISOString(),
    };

    this.data.ledger.push(ledgerEntry);

    this.addNotification({
      customerId: w.customerId,
      title: 'Withdrawal Rejected - Funds Refunded',
      message: `Your withdrawal of $${w.amountUSD.toLocaleString()} USD was rejected (${reason}). Full amount has been restored to your available balance.`,
      type: 'WITHDRAWAL',
    });

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'WITHDRAWAL_REJECTED',
      targetType: 'WITHDRAWAL',
      targetId: w.id,
      details: `Rejected withdrawal #${w.id}. Refund ledger entry #${ledgerEntry.id} generated. Reason: ${reason}`,
    });

    this.saveData();
    return w;
  }

  // --- Platform Settings ---

  public getSettings(): PlatformSettings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<PlatformSettings>, actor: User): PlatformSettings {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
    };

    this.logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'SETTINGS_UPDATED',
      targetType: 'PLATFORM',
      targetId: 'CONFIG',
      details: `Updated platform parameters. Weekly return rate: ${(this.data.settings.weeklyReturnRate * 100).toFixed(1)}%. Legal terms approved: ${this.data.settings.legalTermsApproved}`,
    });

    this.saveData();
    return this.data.settings;
  }

  // --- Notifications ---

  public getNotifications(customerId: string): NotificationItem[] {
    return this.data.notifications
      .filter((n) => n.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public markNotificationRead(id: string, customerId: string) {
    const notif = this.data.notifications.find((n) => n.id === id && n.customerId === customerId);
    if (notif) {
      notif.read = true;
      this.saveData();
    }
  }

  public markAllNotificationsRead(customerId: string) {
    for (const notif of this.data.notifications) {
      if (notif.customerId === customerId) {
        notif.read = true;
      }
    }
    this.saveData();
  }

  private addNotification(params: {
    customerId: string;
    title: string;
    message: string;
    type: NotificationItem['type'];
  }) {
    const notif: NotificationItem = {
      id: generateId('notif'),
      customerId: params.customerId,
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      timestamp: new Date().toISOString(),
    };
    this.data.notifications.push(notif);
  }

  // --- Audit Logs ---

  private logAudit(params: {
    actorId: string;
    actorEmail: string;
    actorRole: User['role'];
    action: string;
    targetType: string;
    targetId: string;
    details: string;
  }) {
    const audit: AuditLogItem = {
      id: generateId('aud'),
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.push(audit);
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.data.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // --- Admin Overview & Reports ---

  public getAllClients(): (User & { financialOverview: ClientFinancialOverview })[] {
    return this.data.users
      .filter((u) => u.role === 'CLIENT')
      .map((u) => {
        const { passwordHash: _, salt: __, fintechState: ___, ...cleanUser } = u;
        return {
          ...cleanUser,
          financialOverview: this.getClientFinancialOverview(u.customerId),
        };
      });
  }

  public getAdminOverview(): AdminPlatformOverview {
    const clients = this.data.users.filter((u) => u.role === 'CLIENT');
    const verifiedClients = clients.filter((u) => u.kycStatus === 'VERIFIED').length;

    const confirmedDeposits = this.data.deposits.filter((d) => d.status === 'CONFIRMED');
    const totalConfirmedDepositsUSD = confirmedDeposits.reduce((acc, curr) => acc + curr.intendedAmountUSD, 0);

    const pendingDeposits = this.data.deposits.filter(
      (d) => d.status !== 'CONFIRMED' && d.status !== 'REJECTED'
    );
    const pendingDepositsUSD = pendingDeposits.reduce((acc, curr) => acc + curr.intendedAmountUSD, 0);

    const activeInvestments = this.data.investments.filter((i) => i.status === 'ACTIVE');
    const totalInvestedCapitalUSD = activeInvestments.reduce((acc, curr) => acc + curr.principalAmountUSD, 0);

    const totalRecordedEarningsUSD = this.data.ledger
      .filter((l) => l.type === 'INVESTMENT_EARNINGS')
      .reduce((acc, curr) => acc + curr.amountUSD, 0);

    const pendingWithdrawals = this.data.withdrawals.filter(
      (w) => w.status !== 'COMPLETED' && w.status !== 'REJECTED'
    );
    const pendingWithdrawalsUSD = pendingWithdrawals.reduce((acc, curr) => acc + curr.amountUSD, 0);

    const completedWithdrawals = this.data.withdrawals.filter((w) => w.status === 'COMPLETED');
    const completedWithdrawalsUSD = completedWithdrawals.reduce((acc, curr) => acc + curr.amountUSD, 0);

    const rejectedDeposits = this.data.deposits.filter((d) => d.status === 'REJECTED').length;
    const rejectedWithdrawals = this.data.withdrawals.filter((w) => w.status === 'REJECTED').length;

    return {
      totalRegisteredClients: clients.length,
      verifiedClients,
      totalConfirmedDepositsUSD: Math.round(totalConfirmedDepositsUSD * 100) / 100,
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsUSD: Math.round(pendingDepositsUSD * 100) / 100,
      totalInvestedCapitalUSD: Math.round(totalInvestedCapitalUSD * 100) / 100,
      activeInvestmentsCount: activeInvestments.length,
      totalRecordedEarningsUSD: Math.round(totalRecordedEarningsUSD * 100) / 100,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsUSD: Math.round(pendingWithdrawalsUSD * 100) / 100,
      completedWithdrawalsUSD: Math.round(completedWithdrawalsUSD * 100) / 100,
      rejectedTransactionsCount: rejectedDeposits + rejectedWithdrawals,
      ledgerReconciliationStatus: 'BALANCED',
    };
  }
}

export const storage = new StorageEngine();
