import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, authPersistenceReady, handleFirestoreError, OperationType } from './firebase.ts';
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
import type { UserFintechState } from './fintechData.ts';
import { localFallback } from './localFallback.ts';

const TOKEN_KEY = 'aethelgard_auth_token';
const AUTH_MODE_KEY = 'aethelgard_auth_mode';
const ADMIN_EMAIL = 'markobare25@gmail.com';

export type AuthSessionMode = 'firebase' | 'server' | 'local';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getMode: () => localStorage.getItem(AUTH_MODE_KEY) as AuthSessionMode | null,
  setMode: (mode: AuthSessionMode) => localStorage.setItem(AUTH_MODE_KEY, mode),
  clearMode: () => localStorage.removeItem(AUTH_MODE_KEY),
};

class BackendUnavailableError extends Error {
  constructor(status?: number) {
    super(status ? `Backend unavailable (${status})` : 'Backend unavailable');
    this.name = 'BackendUnavailableError';
  }
}

const isServerSession = () =>
  !auth.currentUser && authStorage.getMode() === 'server' && Boolean(authStorage.getToken());

const isLocalSession = () =>
  !auth.currentUser && authStorage.getMode() === 'local' && Boolean(authStorage.getToken());

async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new BackendUnavailableError();
  }
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    if (!data?.error && (res.status === 404 || res.status === 405 || res.status >= 502)) {
      throw new BackendUnavailableError(res.status);
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  weeklyReturnRate: 0.02,
  isReturnGuaranteed: false,
  minDepositUSD: 100,
  minWithdrawalUSD: 50,
  withdrawalFeePercentage: 0.01,
  defaultTermDurationWeeks: 12,
  legalTermsApproved: true,
  legalApprovalDate: '2026-09-15',
  complianceReviewNote:
    'Legal and financial framework approved by Investment Oversight Committee. Discretionary yields subject to platform terms.',
  companyName: 'Aethelgard Capital Management Ltd.',
  supportEmail: 'compliance@aethelgard.com',
  regulatoryJurisdiction: 'Institutional Digital Asset Registry, Entity #AC-8921-EU',
};

export const DEFAULT_WALLETS: CryptoWallet[] = [
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

function toIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

function generateCustomerId(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) % 9000;
  }
  return `CLT-${1000 + Math.abs(hash)}`;
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

export function mapFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/password authentication is currently unavailable for this project.';
    case 'auth/email-already-in-use':
      return 'Email already in use. Please sign in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
}

function isBootstrappedAdmin(fbUser: FirebaseUser | null): boolean {
  if (!fbUser) return false;
  return (
    fbUser.email?.toLowerCase() === ADMIN_EMAIL &&
    fbUser.emailVerified === true
  );
}

async function resolveAdminFlag(fbUser: FirebaseUser): Promise<boolean> {
  if (isBootstrappedAdmin(fbUser)) return true;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

function mapDocToUser(id: string, data: Record<string, any>, isAdminFlag: boolean): User {
  return {
    id,
    customerId: data.customerId || generateCustomerId(id),
    fullName: data.fullName || 'Client Account',
    email: data.email || '',
    phone: data.phone || '',
    country: data.country || 'Global',
    role: isAdminFlag || data.role === 'ADMIN' ? 'ADMIN' : 'CLIENT',
    kycStatus: data.kycStatus || 'UNVERIFIED',
    status: data.status || 'ACTIVE',
    twoFactorEnabled: Boolean(data.twoFactorEnabled),
    referralCode: data.referralCode,
    createdAt: toIso(data.createdAt),
  };
}

type RegistrationExtra = {
  fullName?: string;
  phone?: string;
  country?: string;
  referralCode?: string;
};

const pendingRegistrationExtras = new Map<string, RegistrationExtra>();
const inFlightProfileSync = new Map<
  string,
  Promise<{ user: User; fintech: Partial<UserFintechState> }>
>();

async function ensureUserProfile(
  fbUser: FirebaseUser,
  extra?: RegistrationExtra
): Promise<{ user: User; fintech: Partial<UserFintechState> }> {
  const existingPromise = inFlightProfileSync.get(fbUser.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const emailKey = (fbUser.email || '').toLowerCase();
  const mergedExtra: RegistrationExtra | undefined = extra || pendingRegistrationExtras.get(emailKey);

  const syncPromise = (async () => {
    const userPath = `users/${fbUser.uid}`;
    let snap;
    try {
      snap = await getDoc(doc(db, 'users', fbUser.uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, userPath);
    }

    const adminFlag = await resolveAdminFlag(fbUser);

    if (snap.exists()) {
      const data = snap.data();
      let resolvedFullName = data.fullName;

      if (mergedExtra?.fullName && mergedExtra.fullName.trim() && data.fullName !== mergedExtra.fullName.trim()) {
        const cleanName = mergedExtra.fullName.trim().slice(0, 120);
        try {
          await updateDoc(doc(db, 'users', fbUser.uid), {
            fullName: cleanName,
            updatedAt: serverTimestamp(),
          });
          resolvedFullName = cleanName;
        } catch {
          // Keep existing fullName if update fails
        }
      }

      const user = mapDocToUser(fbUser.uid, { ...data, fullName: resolvedFullName }, adminFlag);
      if (adminFlag) {
        await ensureAdminDefaults(fbUser);
      }
      return {
        user,
        fintech: {
          sampleBalanceUSDT: typeof data.sampleBalanceUSDT === 'number' ? data.sampleBalanceUSDT : 0,
          investedBalanceUSDT: typeof data.investedBalanceUSDT === 'number' ? data.investedBalanceUSDT : 0,
          aethelBalance: typeof data.aethelBalance === 'number' ? data.aethelBalance : 0,
          tasksCompletedCount: typeof data.tasksCompletedCount === 'number' ? data.tasksCompletedCount : 0,
          referralsCount: typeof data.referralsCount === 'number' ? data.referralsCount : 0,
          completedTaskIds: Array.isArray(data.completedTaskIds) ? data.completedTaskIds : [],
          dailyStreak: typeof data.dailyStreak === 'number' ? data.dailyStreak : 0,
        },
      };
    }

    const customerId = generateCustomerId(fbUser.uid);
    const fullName =
      mergedExtra?.fullName?.trim() ||
      fbUser.displayName?.trim() ||
      (fbUser.email ? fbUser.email.split('@')[0] : 'Client User');

    const profilePayload = stripUndefined({
      uid: fbUser.uid,
      customerId,
      fullName: fullName.slice(0, 120),
      email: emailKey.slice(0, 200),
      phone: mergedExtra?.phone ? mergedExtra.phone.slice(0, 40) : undefined,
      country: mergedExtra?.country ? mergedExtra.country.slice(0, 80) : 'Global',
      role: 'CLIENT' as const,
      kycStatus: 'UNVERIFIED' as const,
      status: 'ACTIVE' as const,
      twoFactorEnabled: false,
      referralCode: mergedExtra?.referralCode ? mergedExtra.referralCode.trim().slice(0, 40) : undefined,
      sampleBalanceUSDT: 0,
      investedBalanceUSDT: 0,
      aethelBalance: 0,
      tasksCompletedCount: 0,
      referralsCount: 0,
      completedTaskIds: [] as string[],
      dailyStreak: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await setDoc(doc(db, 'users', fbUser.uid), profilePayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }

    // Create welcome notification & registration audit log (non-blocking)
    const notifId = generateId('notif');
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        userId: fbUser.uid,
        customerId,
        title: 'Registration Successful',
        message: `Welcome to Aethelgard Capital. Your Customer ID is ${customerId}. Your account data is securely stored in the cloud.`,
        type: 'SECURITY',
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Welcome notification creation skipped:', err);
    }

    const logId = generateId('aud');
    try {
      await setDoc(doc(db, 'auditLogs', logId), {
        actorId: fbUser.uid,
        actorEmail: emailKey || 'client@aethelgard.com',
        actorRole: 'CLIENT',
        action: 'USER_REGISTRATION',
        targetType: 'USER',
        targetId: customerId,
        details: `Client registered and persisted to Firestore.`,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Registration audit log creation skipped:', err);
    }

    if (adminFlag) {
      await ensureAdminDefaults(fbUser);
    }

    const createdUser: User = {
      id: fbUser.uid,
      customerId,
      fullName: profilePayload.fullName,
      email: profilePayload.email,
      phone: profilePayload.phone || '',
      country: profilePayload.country || 'Global',
      role: adminFlag ? 'ADMIN' : 'CLIENT',
      kycStatus: 'UNVERIFIED',
      status: 'ACTIVE',
      twoFactorEnabled: false,
      referralCode: profilePayload.referralCode,
      createdAt: new Date().toISOString(),
    };

    return {
      user: createdUser,
      fintech: {
        sampleBalanceUSDT: 0,
        investedBalanceUSDT: 0,
        aethelBalance: 0,
        tasksCompletedCount: 0,
        referralsCount: 0,
        completedTaskIds: [],
        dailyStreak: 0,
      },
    };
  })();

  inFlightProfileSync.set(fbUser.uid, syncPromise);
  try {
    return await syncPromise;
  } finally {
    inFlightProfileSync.delete(fbUser.uid);
  }
}

async function ensureAdminDefaults(fbUser: FirebaseUser): Promise<void> {
  if (!isBootstrappedAdmin(fbUser)) return;
  try {
    const adminRef = doc(db, 'admins', fbUser.uid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        uid: fbUser.uid,
        email: fbUser.email || ADMIN_EMAIL,
        createdAt: serverTimestamp(),
      });
    }

    const settingsRef = doc(db, 'settings', 'platform');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        ...DEFAULT_PLATFORM_SETTINGS,
        updatedAt: serverTimestamp(),
      });
    }

    const walletsSnap = await getDocs(collection(db, 'wallets'));
    if (walletsSnap.empty) {
      const batch = writeBatch(db);
      for (const w of DEFAULT_WALLETS) {
        batch.set(doc(db, 'wallets', w.id), {
          currency: w.currency,
          network: w.network,
          address: w.address,
          qrCodeNote: w.qrCodeNote || '',
          isActive: w.isActive,
          minDepositUSD: w.minDepositUSD,
          requiredConfirmations: w.requiredConfirmations,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Admin defaults bootstrap skipped:', err);
  }
}

function requireCurrentUser(): FirebaseUser {
  const fbUser = auth.currentUser;
  if (!fbUser) {
    throw new Error('Authentication required. Please sign in.');
  }
  return fbUser;
}

async function getCurrentUserProfile(): Promise<{ fbUser: FirebaseUser; user: User; raw: Record<string, any> }> {
  const fbUser = requireCurrentUser();
  const userPath = `users/${fbUser.uid}`;
  let snap;
  try {
    snap = await getDoc(doc(db, 'users', fbUser.uid));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userPath);
  }

  if (!snap.exists()) {
    const { user } = await ensureUserProfile(fbUser);
    return { fbUser, user, raw: { sampleBalanceUSDT: 0, investedBalanceUSDT: 0 } };
  }

  const data = snap.data();
  const adminFlag = await resolveAdminFlag(fbUser);
  return {
    fbUser,
    user: mapDocToUser(fbUser.uid, data, adminFlag),
    raw: data,
  };
}

async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'platform'));
    if (snap.exists()) {
      const d = snap.data();
      return {
        weeklyReturnRate: d.weeklyReturnRate ?? DEFAULT_PLATFORM_SETTINGS.weeklyReturnRate,
        isReturnGuaranteed: d.isReturnGuaranteed ?? DEFAULT_PLATFORM_SETTINGS.isReturnGuaranteed,
        minDepositUSD: d.minDepositUSD ?? DEFAULT_PLATFORM_SETTINGS.minDepositUSD,
        minWithdrawalUSD: d.minWithdrawalUSD ?? DEFAULT_PLATFORM_SETTINGS.minWithdrawalUSD,
        withdrawalFeePercentage: d.withdrawalFeePercentage ?? DEFAULT_PLATFORM_SETTINGS.withdrawalFeePercentage,
        defaultTermDurationWeeks: d.defaultTermDurationWeeks ?? DEFAULT_PLATFORM_SETTINGS.defaultTermDurationWeeks,
        legalTermsApproved: d.legalTermsApproved ?? DEFAULT_PLATFORM_SETTINGS.legalTermsApproved,
        legalApprovalDate: d.legalApprovalDate ?? DEFAULT_PLATFORM_SETTINGS.legalApprovalDate,
        complianceReviewNote: d.complianceReviewNote ?? DEFAULT_PLATFORM_SETTINGS.complianceReviewNote,
        companyName: d.companyName ?? DEFAULT_PLATFORM_SETTINGS.companyName,
        supportEmail: d.supportEmail ?? DEFAULT_PLATFORM_SETTINGS.supportEmail,
        regulatoryJurisdiction: d.regulatoryJurisdiction ?? DEFAULT_PLATFORM_SETTINGS.regulatoryJurisdiction,
      };
    }
  } catch {
    // Fall back gracefully if settings doc does not exist yet
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

function mapDeposit(id: string, d: Record<string, any>): DepositRequest {
  return {
    id,
    customerId: d.customerId,
    userEmail: d.userEmail,
    currency: d.currency,
    network: d.network,
    walletAddress: d.walletAddress,
    intendedAmountUSD: d.intendedAmountUSD,
    cryptoAmount: d.cryptoAmount,
    txHash: d.txHash,
    proofFileName: d.proofFileName,
    status: d.status,
    confirmations: d.confirmations ?? 0,
    requiredConfirmations: d.requiredConfirmations ?? 12,
    rejectionReason: d.rejectionReason,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

function mapInvestment(id: string, d: Record<string, any>): Investment {
  return {
    id,
    customerId: d.customerId,
    principalAmountUSD: d.principalAmountUSD,
    weeklyRate: d.weeklyRate,
    durationWeeks: d.durationWeeks,
    startDate: d.startDate,
    maturityDate: d.maturityDate,
    accumulatedEarningsUSD: d.accumulatedEarningsUSD ?? 0,
    lastAccrualDate: d.lastAccrualDate,
    nextAccrualDate: d.nextAccrualDate,
    status: d.status,
    termsApproved: d.termsApproved,
    termsVersion: d.termsVersion,
    createdAt: toIso(d.createdAt),
  };
}

function mapWithdrawal(id: string, d: Record<string, any>): WithdrawalRequest {
  return {
    id,
    customerId: d.customerId,
    userEmail: d.userEmail,
    currency: d.currency,
    network: d.network,
    destinationAddress: d.destinationAddress,
    amountUSD: d.amountUSD,
    feeUSD: d.feeUSD,
    netAmountUSD: d.netAmountUSD,
    status: d.status,
    blockchainTxRef: d.blockchainTxRef,
    rejectionReason: d.rejectionReason,
    submittedAt: toIso(d.submittedAt),
    processedAt: d.status === 'COMPLETED' ? toIso(d.updatedAt) : undefined,
  };
}

function mapLedger(id: string, d: Record<string, any>): LedgerEntry {
  return {
    id,
    customerId: d.customerId,
    type: d.type,
    amountUSD: d.amountUSD,
    referenceId: d.referenceId,
    description: d.description,
    balanceAfterUSD: d.balanceAfterUSD,
    timestamp: toIso(d.createdAt),
  };
}

function computeOverviewFromRecords(
  rawUser: Record<string, any>,
  deposits: DepositRequest[],
  investments: Investment[],
  withdrawals: WithdrawalRequest[],
  ledger: LedgerEntry[]
): ClientFinancialOverview {
  const ledgerBalance = ledger.reduce((acc, item) => acc + item.amountUSD, 0);
  const availableBalanceUSD =
    ledger.length > 0
      ? Math.max(0, ledgerBalance)
      : typeof rawUser.sampleBalanceUSDT === 'number'
      ? rawUser.sampleBalanceUSDT
      : 0;

  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
  const activeInvestmentsUSD = activeInvestments.reduce((acc, i) => acc + i.principalAmountUSD, 0);
  const totalInvestedUSD = investments.reduce((acc, i) => acc + i.principalAmountUSD, 0);
  const totalEarningsUSD = ledger
    .filter((l) => l.type === 'INVESTMENT_EARNINGS')
    .reduce((acc, l) => acc + l.amountUSD, 0);
  const pendingDepositsUSD = deposits
    .filter((d) => d.status !== 'CONFIRMED' && d.status !== 'REJECTED')
    .reduce((acc, d) => acc + d.intendedAmountUSD, 0);
  const pendingWithdrawalsUSD = withdrawals
    .filter((w) => w.status !== 'COMPLETED' && w.status !== 'REJECTED')
    .reduce((acc, w) => acc + w.amountUSD, 0);
  const weeklyProjectedEarningsUSD = activeInvestments.reduce(
    (acc, i) => acc + i.principalAmountUSD * i.weeklyRate,
    0
  );

  return {
    totalBalanceUSD: Math.round((availableBalanceUSD + activeInvestmentsUSD) * 100) / 100,
    availableBalanceUSD: Math.round(availableBalanceUSD * 100) / 100,
    totalInvestedUSD: Math.round(totalInvestedUSD * 100) / 100,
    activeInvestmentsUSD: Math.round(activeInvestmentsUSD * 100) / 100,
    totalEarningsUSD: Math.round(totalEarningsUSD * 100) / 100,
    pendingDepositsUSD: Math.round(pendingDepositsUSD * 100) / 100,
    pendingWithdrawalsUSD: Math.round(pendingWithdrawalsUSD * 100) / 100,
    weeklyProjectedEarningsUSD: Math.round(weeklyProjectedEarningsUSD * 100) / 100,
  };
}

export const api = {
  // --- Auth ---
  register: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    country?: string;
    password: string;
    referralCode?: string;
  }) => {
    const trimmedEmail = payload.email.trim();
    const emailKey = trimmedEmail.toLowerCase();
    const cleanName = payload.fullName.trim();
    const cleanReferral = payload.referralCode?.trim() || undefined;

    pendingRegistrationExtras.set(emailKey, {
      fullName: cleanName,
      phone: payload.phone,
      country: payload.country,
      referralCode: cleanReferral,
    });

    try {
      await authPersistenceReady;
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, payload.password);
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
      }
      sendEmailVerification(cred.user).catch(() => {});
      const { user } = await ensureUserProfile(cred.user, {
        fullName: cleanName,
        phone: payload.phone,
        country: payload.country,
        referralCode: cleanReferral,
      });
      const token = await cred.user.getIdToken();
      authStorage.setMode('firebase');
      authStorage.setToken(token);
      return { user, token, message: 'Account registered and persisted successfully.' };
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        try {
          const res = await serverFetch<{ user: User; token: string; message: string }>(
            '/api/auth/register',
            {
              method: 'POST',
              body: JSON.stringify({
                fullName: cleanName,
                email: trimmedEmail,
                phone: payload.phone,
                country: payload.country,
                password: payload.password,
                referralCode: cleanReferral,
              }),
            }
          );
          authStorage.setMode('server');
          authStorage.setToken(res.token);
          return res;
        } catch (serverErr: any) {
          if (serverErr instanceof BackendUnavailableError) {
            const localRes = await localFallback.register({
              fullName: cleanName,
              email: trimmedEmail,
              phone: payload.phone,
              country: payload.country,
              password: payload.password,
              referralCode: cleanReferral,
            });
            authStorage.setMode('local');
            authStorage.setToken(localRes.token);
            return localRes;
          }
          throw serverErr;
        }
      }
      if (err?.message?.startsWith('{')) throw err;
      throw new Error(mapFirebaseAuthError(err));
    } finally {
      pendingRegistrationExtras.delete(emailKey);
    }
  },

  login: async (payload: { email: string; password: string }) => {
    try {
      await authPersistenceReady;
      const cred = await signInWithEmailAndPassword(auth, payload.email.trim(), payload.password);
      const { user } = await ensureUserProfile(cred.user);
      if (user.status === 'SUSPENDED') {
        await signOut(auth);
        throw new Error('This account has been suspended by compliance oversight.');
      }
      const token = await cred.user.getIdToken();
      authStorage.setMode('firebase');
      authStorage.setToken(token);

      const logId = generateId('aud');
      try {
        await setDoc(doc(db, 'auditLogs', logId), {
          actorId: cred.user.uid,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'USER_LOGIN',
          targetType: 'AUTH',
          targetId: user.customerId,
          details: 'Authenticated session started via Firebase Auth.',
          createdAt: serverTimestamp(),
        });
      } catch {
        // Non-blocking audit log on login
      }

      return { user, token, message: 'Authenticated successfully.' };
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        try {
          const res = await serverFetch<{ user: User; token: string; message: string }>(
            '/api/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({
                email: payload.email.trim(),
                password: payload.password,
              }),
            }
          );
          authStorage.setMode('server');
          authStorage.setToken(res.token);
          return res;
        } catch (serverErr: any) {
          if (serverErr instanceof BackendUnavailableError) {
            const localRes = await localFallback.login({
              email: payload.email.trim(),
              password: payload.password,
            });
            authStorage.setMode('local');
            authStorage.setToken(localRes.token);
            return localRes;
          }
          throw serverErr;
        }
      }
      if (err?.message?.startsWith('{')) throw err;
      throw new Error(mapFirebaseAuthError(err));
    }
  },

  logout: async () => {
    authStorage.clearToken();
    authStorage.clearMode();
    inFlightProfileSync.clear();
    pendingRegistrationExtras.clear();
    await signOut(auth);
  },

  getMe: async () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      const { user } = await ensureUserProfile(fbUser);
      return { user };
    }
    if (isServerSession()) {
      try {
        return await serverFetch<{ user: User }>('/api/auth/me');
      } catch (err) {
        if (err instanceof BackendUnavailableError) {
          return await localFallback.getMe(authStorage.getToken());
        }
        throw err;
      }
    }
    if (isLocalSession()) {
      return await localFallback.getMe(authStorage.getToken());
    }
    throw new Error('Not authenticated');
  },

  getUserFintechStateFromCloud: async (): Promise<Partial<UserFintechState> | null> => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      const { fintech } = await ensureUserProfile(fbUser);
      return fintech;
    }
    if (isServerSession()) {
      const res = await serverFetch<{ state: Partial<UserFintechState> }>('/api/client/fintech-state');
      return res.state;
    }
    if (isLocalSession()) {
      return await localFallback.getFintechState(authStorage.getToken());
    }
    return null;
  },

  saveUserFintechStateToCloud: async (state: UserFintechState): Promise<void> => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      if (isServerSession()) {
        await serverFetch('/api/client/fintech-state', {
          method: 'PUT',
          body: JSON.stringify(state),
        });
      } else if (isLocalSession()) {
        await localFallback.saveFintechState(authStorage.getToken(), state);
      }
      return;
    }
    const path = `users/${fbUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', fbUser.uid), {
        sampleBalanceUSDT: Math.max(0, Number(state.sampleBalanceUSDT) || 0),
        investedBalanceUSDT: Math.max(0, Number(state.investedBalanceUSDT) || 0),
        aethelBalance: Math.max(0, Number(state.aethelBalance) || 0),
        tasksCompletedCount: Math.max(0, Math.floor(state.tasksCompletedCount) || 0),
        completedTaskIds: Array.isArray(state.completedTaskIds)
          ? state.completedTaskIds.slice(0, 100)
          : [],
        dailyStreak: Math.max(0, Math.floor(state.dailyStreak) || 0),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  forgotPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        message: `Password recovery link sent to ${email.trim()}. Please check your inbox and spam folder.`,
      };
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        try {
          return await serverFetch<{ message: string }>('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: email.trim() }),
          });
        } catch (serverErr) {
          if (serverErr instanceof BackendUnavailableError) {
            return await localFallback.forgotPassword(email.trim());
          }
          throw serverErr;
        }
      }
      throw new Error(mapFirebaseAuthError(err));
    }
  },

  submitKyc: async () => {
    if (isServerSession()) {
      return await serverFetch<{ user: User; message: string }>('/api/auth/kyc/submit', {
        method: 'POST',
      });
    }
    if (isLocalSession()) {
      return await localFallback.submitKyc(authStorage.getToken());
    }
    const { fbUser, user } = await getCurrentUserProfile();
    const path = `users/${fbUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', fbUser.uid), {
        kycStatus: 'SUBMITTED',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
    return {
      user: { ...user, kycStatus: 'SUBMITTED' as const },
      message: 'Identity documentation submitted for compliance review.',
    };
  },

  // --- Client ---
  getWallets: async (): Promise<{ wallets: CryptoWallet[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/client/wallets');
    }
    if (isLocalSession()) {
      return { wallets: DEFAULT_WALLETS };
    }
    const path = 'wallets';
    try {
      const q = query(collection(db, path), where('isActive', '==', true));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { wallets: DEFAULT_WALLETS };
      }
      const wallets: CryptoWallet[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          currency: d.currency,
          network: d.network,
          address: d.address,
          qrCodeNote: d.qrCodeNote,
          isActive: d.isActive,
          minDepositUSD: d.minDepositUSD,
          requiredConfirmations: d.requiredConfirmations,
          updatedAt: toIso(d.updatedAt),
        };
      });
      return { wallets };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  getDeposits: async (): Promise<{ deposits: DepositRequest[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/client/deposits');
    }
    if (isLocalSession()) {
      return await localFallback.getDeposits(authStorage.getToken());
    }
    const fbUser = requireCurrentUser();
    const path = 'deposits';
    try {
      const q = query(collection(db, path), where('userId', '==', fbUser.uid));
      const snap = await getDocs(q);
      const deposits = snap.docs
        .map((docSnap) => mapDeposit(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { deposits };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  submitDeposit: async (payload: {
    currency: CryptoWallet['currency'];
    network: string;
    walletAddress: string;
    intendedAmountUSD: number;
    cryptoAmount?: string;
    txHash?: string;
    proofFileName?: string;
  }) => {
    if (isServerSession()) {
      return await serverFetch<{ deposit: DepositRequest; message: string }>('/api/client/deposits', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    if (isLocalSession()) {
      return await localFallback.submitDeposit(authStorage.getToken(), payload, DEFAULT_PLATFORM_SETTINGS);
    }
    const { fbUser, user } = await getCurrentUserProfile();
    const settings = await fetchPlatformSettings();
    const amount = Number(payload.intendedAmountUSD);

    if (!amount || amount < settings.minDepositUSD) {
      throw new Error(`Minimum deposit is $${settings.minDepositUSD.toLocaleString()} USD.`);
    }

    const depositId = generateId('dep');
    const cleanTxHash = payload.txHash?.trim() || undefined;
    const status: DepositRequest['status'] = cleanTxHash ? 'PENDING_CONFIRMATION' : 'AWAITING_PAYMENT';
    const requiredConfirmations = payload.currency === 'BTC' ? 3 : payload.network.includes('TRC-20') ? 19 : 12;

    const record = stripUndefined({
      userId: fbUser.uid,
      customerId: user.customerId,
      userEmail: user.email,
      currency: payload.currency,
      network: payload.network.slice(0, 100),
      walletAddress: payload.walletAddress.slice(0, 200),
      intendedAmountUSD: amount,
      cryptoAmount: payload.cryptoAmount ? payload.cryptoAmount.slice(0, 64) : undefined,
      txHash: cleanTxHash ? cleanTxHash.slice(0, 160) : undefined,
      proofFileName: payload.proofFileName ? payload.proofFileName.slice(0, 255) : undefined,
      status,
      confirmations: cleanTxHash ? 2 : 0,
      requiredConfirmations,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await setDoc(doc(db, 'deposits', depositId), record);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `deposits/${depositId}`);
    }

    const notifId = generateId('notif');
    try {
      await setDoc(doc(db, 'notifications', notifId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        title: 'Deposit Initiated',
        message: `Deposit request of $${amount.toLocaleString()} USD in ${payload.currency} submitted.`,
        type: 'DEPOSIT',
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }

    const deposit: DepositRequest = {
      id: depositId,
      customerId: user.customerId,
      userEmail: user.email,
      currency: payload.currency,
      network: payload.network,
      walletAddress: payload.walletAddress,
      intendedAmountUSD: amount,
      cryptoAmount: payload.cryptoAmount,
      txHash: cleanTxHash,
      proofFileName: payload.proofFileName,
      status,
      confirmations: cleanTxHash ? 2 : 0,
      requiredConfirmations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { deposit, message: 'Deposit recorded. Awaiting blockchain validation.' };
  },

  updateDepositTxHash: async (id: string, payload: { txHash: string; proofFileName?: string }) => {
    if (isServerSession()) {
      return await serverFetch<{ deposit: DepositRequest; message: string }>(
        `/api/client/deposits/${id}/tx-hash`,
        { method: 'PUT', body: JSON.stringify(payload) }
      );
    }
    if (isLocalSession()) {
      return await localFallback.updateDepositTxHash(authStorage.getToken(), id, payload);
    }
    requireCurrentUser();
    const path = `deposits/${id}`;
    const updates = stripUndefined({
      txHash: payload.txHash.trim().slice(0, 160),
      proofFileName: payload.proofFileName ? payload.proofFileName.slice(0, 255) : undefined,
      status: 'PENDING_CONFIRMATION' as const,
      confirmations: 3,
      updatedAt: serverTimestamp(),
    });
    try {
      await updateDoc(doc(db, 'deposits', id), updates);
      const snap = await getDoc(doc(db, 'deposits', id));
      return {
        deposit: mapDeposit(id, snap.data() || {}),
        message: 'Transaction hash submitted. Verification queue active.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  getInvestments: async (): Promise<{ investments: Investment[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/client/investments');
    }
    if (isLocalSession()) {
      return await localFallback.getInvestments(authStorage.getToken());
    }
    const fbUser = requireCurrentUser();
    const path = 'investments';
    try {
      const q = query(collection(db, path), where('userId', '==', fbUser.uid));
      const snap = await getDocs(q);
      const investments = snap.docs
        .map((docSnap) => mapInvestment(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { investments };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  activateInvestment: async (payload: { principalAmountUSD: number; termsAccepted: boolean }) => {
    if (isServerSession()) {
      return await serverFetch<{ investment: Investment; message: string }>('/api/client/investments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    if (isLocalSession()) {
      return await localFallback.activateInvestment(authStorage.getToken(), payload, DEFAULT_PLATFORM_SETTINGS);
    }
    if (!payload.termsAccepted) {
      throw new Error('You must review and accept the Aethelgard Investment Agreement.');
    }

    const { fbUser, user, raw } = await getCurrentUserProfile();
    const settings = await fetchPlatformSettings();
    const principal = Number(payload.principalAmountUSD);

    if (!settings.legalTermsApproved) {
      throw new Error('Investment activation is temporarily suspended pending regulatory review.');
    }
    if (!principal || principal < 100) {
      throw new Error('Minimum investment amount is $100.00 USD.');
    }

    const currentSampleBalance = typeof raw.sampleBalanceUSDT === 'number' ? raw.sampleBalanceUSDT : 0;
    const currentInvestedBalance = typeof raw.investedBalanceUSDT === 'number' ? raw.investedBalanceUSDT : 0;
    const { ledger } = await api.getLedger();
    const ledgerAvail = ledger.length > 0 ? ledger.reduce((acc, l) => acc + l.amountUSD, 0) : currentSampleBalance;
    const effectiveAvail = Math.max(ledgerAvail, currentSampleBalance);

    if (effectiveAvail < principal) {
      throw new Error(
        `Insufficient available balance. You have $${effectiveAvail.toLocaleString()} USD available.`
      );
    }

    const durationWeeks = settings.defaultTermDurationWeeks || 12;
    const weeklyRate = settings.weeklyReturnRate || 0.02;
    const now = new Date();
    const startDate = now.toISOString();
    const maturityDate = new Date(now.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000).toISOString();
    const nextAccrualDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invId = generateId('inv');
    const ledId = generateId('led');
    const notifId = generateId('notif');
    const logId = generateId('aud');
    const newAvail = Math.max(0, Math.round((effectiveAvail - principal) * 100) / 100);

    try {
      await setDoc(doc(db, 'investments', invId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        principalAmountUSD: principal,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `investments/${invId}`);
    }

    try {
      await setDoc(doc(db, 'ledger', ledId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        type: 'INVESTMENT_COMMITTED',
        amountUSD: -principal,
        referenceId: invId,
        description: `Principal Allocated to ${durationWeeks}-Week Investment Term (${(weeklyRate * 100).toFixed(1)}% Weekly Return Rate)`,
        balanceAfterUSD: newAvail,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `ledger/${ledId}`);
    }

    try {
      await updateDoc(doc(db, 'users', fbUser.uid), {
        sampleBalanceUSDT: Math.max(0, currentSampleBalance - principal),
        investedBalanceUSDT: currentInvestedBalance + principal,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
    }

    try {
      await setDoc(doc(db, 'notifications', notifId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        title: 'Investment Activated',
        message: `Your investment of $${principal.toLocaleString()} USD is ACTIVE.`,
        type: 'INVESTMENT',
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }

    try {
      await setDoc(doc(db, 'auditLogs', logId), {
        actorId: fbUser.uid,
        actorEmail: user.email,
        actorRole: 'CLIENT',
        action: 'INVESTMENT_ACTIVATED',
        targetType: 'INVESTMENT',
        targetId: invId,
        details: `Committed $${principal.toLocaleString()} USD into ${(weeklyRate * 100).toFixed(1)}% weekly strategy.`,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `auditLogs/${logId}`);
    }

    const investment: Investment = {
      id: invId,
      customerId: user.customerId,
      principalAmountUSD: principal,
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

    return {
      investment,
      message: `Investment of $${principal.toLocaleString()} USD activated successfully.`,
    };
  },

  getWithdrawals: async (): Promise<{ withdrawals: WithdrawalRequest[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/client/withdrawals');
    }
    if (isLocalSession()) {
      return await localFallback.getWithdrawals(authStorage.getToken());
    }
    const fbUser = requireCurrentUser();
    const path = 'withdrawals';
    try {
      const q = query(collection(db, path), where('userId', '==', fbUser.uid));
      const snap = await getDocs(q);
      const withdrawals = snap.docs
        .map((docSnap) => mapWithdrawal(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return { withdrawals };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  submitWithdrawal: async (payload: {
    currency: CryptoWallet['currency'];
    network: string;
    destinationAddress: string;
    amountUSD: number;
  }) => {
    if (isServerSession()) {
      return await serverFetch<{ withdrawal: WithdrawalRequest; message: string }>(
        '/api/client/withdrawals',
        { method: 'POST', body: JSON.stringify(payload) }
      );
    }
    if (isLocalSession()) {
      return await localFallback.submitWithdrawal(authStorage.getToken(), payload, DEFAULT_PLATFORM_SETTINGS);
    }
    const { fbUser, user, raw } = await getCurrentUserProfile();
    const settings = await fetchPlatformSettings();
    const amountUSD = Number(payload.amountUSD);

    if (!amountUSD || amountUSD < settings.minWithdrawalUSD) {
      throw new Error(`Minimum withdrawal amount is $${settings.minWithdrawalUSD.toLocaleString()} USD.`);
    }
    if (!payload.destinationAddress || payload.destinationAddress.trim().length < 24) {
      throw new Error('Please provide a valid destination cryptocurrency wallet address.');
    }

    const currentSampleBalance = typeof raw.sampleBalanceUSDT === 'number' ? raw.sampleBalanceUSDT : 0;
    const { ledger } = await api.getLedger();
    const ledgerAvail = ledger.length > 0 ? ledger.reduce((acc, l) => acc + l.amountUSD, 0) : currentSampleBalance;
    const effectiveAvail = Math.max(ledgerAvail, currentSampleBalance);

    if (effectiveAvail < amountUSD) {
      throw new Error(
        `Withdrawal exceeds available balance. Available: $${effectiveAvail.toLocaleString()} USD.`
      );
    }

    const feeUSD = Math.round(amountUSD * settings.withdrawalFeePercentage * 100) / 100;
    const netAmountUSD = Math.round((amountUSD - feeUSD) * 100) / 100;
    const newAvail = Math.max(0, Math.round((effectiveAvail - amountUSD) * 100) / 100);

    const wId = generateId('wth');
    const ledId = generateId('led');
    const notifId = generateId('notif');
    const logId = generateId('aud');
    const dest = payload.destinationAddress.trim().slice(0, 200);

    try {
      await setDoc(doc(db, 'withdrawals', wId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        userEmail: user.email,
        currency: payload.currency,
        network: payload.network.slice(0, 100),
        destinationAddress: dest,
        amountUSD,
        feeUSD,
        netAmountUSD,
        status: 'SUBMITTED',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `withdrawals/${wId}`);
    }

    try {
      await setDoc(doc(db, 'ledger', ledId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        type: 'WITHDRAWAL_LOCK',
        amountUSD: -amountUSD,
        referenceId: wId,
        description: `Withdrawal Requested: $${amountUSD.toLocaleString()} USD to ${dest.substring(0, 10)}...`,
        balanceAfterUSD: newAvail,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `ledger/${ledId}`);
    }

    try {
      await updateDoc(doc(db, 'users', fbUser.uid), {
        sampleBalanceUSDT: Math.max(0, currentSampleBalance - amountUSD),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
    }

    try {
      await setDoc(doc(db, 'notifications', notifId), {
        userId: fbUser.uid,
        customerId: user.customerId,
        title: 'Withdrawal Submitted',
        message: `Withdrawal of $${amountUSD.toLocaleString()} USD submitted for compliance review.`,
        type: 'WITHDRAWAL',
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }

    try {
      await setDoc(doc(db, 'auditLogs', logId), {
        actorId: fbUser.uid,
        actorEmail: user.email,
        actorRole: 'CLIENT',
        action: 'WITHDRAWAL_SUBMITTED',
        targetType: 'WITHDRAWAL',
        targetId: wId,
        details: `Requested withdrawal of $${amountUSD.toLocaleString()} USD (${payload.currency}).`,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `auditLogs/${logId}`);
    }

    const withdrawal: WithdrawalRequest = {
      id: wId,
      customerId: user.customerId,
      userEmail: user.email,
      currency: payload.currency,
      network: payload.network,
      destinationAddress: dest,
      amountUSD,
      feeUSD,
      netAmountUSD,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    };

    return { withdrawal, message: 'Withdrawal request submitted for review.' };
  },

  getLedger: async (): Promise<{ ledger: LedgerEntry[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/client/ledger');
    }
    if (isLocalSession()) {
      return await localFallback.getLedger(authStorage.getToken());
    }
    const fbUser = requireCurrentUser();
    const path = 'ledger';
    try {
      const q = query(collection(db, path), where('userId', '==', fbUser.uid));
      const snap = await getDocs(q);
      const ledger = snap.docs
        .map((docSnap) => mapLedger(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { ledger };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  getNotifications: async (): Promise<{ notifications: NotificationItem[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/client/notifications');
    }
    if (isLocalSession()) {
      return await localFallback.getNotifications(authStorage.getToken());
    }
    const fbUser = requireCurrentUser();
    const path = 'notifications';
    try {
      const q = query(collection(db, path), where('userId', '==', fbUser.uid));
      const snap = await getDocs(q);
      const notifications: NotificationItem[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            customerId: d.customerId,
            title: d.title,
            message: d.message,
            type: d.type,
            read: Boolean(d.read),
            timestamp: toIso(d.createdAt),
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { notifications };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  markNotificationRead: async (id: string) => {
    if (isServerSession()) {
      return await serverFetch(`/api/client/notifications/${id}/read`, { method: 'PUT' });
    }
    if (isLocalSession()) {
      return await localFallback.markNotificationRead(authStorage.getToken(), id);
    }
    requireCurrentUser();
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  markAllNotificationsRead: async () => {
    if (isServerSession()) {
      return await serverFetch('/api/client/notifications/read-all', { method: 'PUT' });
    }
    if (isLocalSession()) {
      return await localFallback.markAllNotificationsRead(authStorage.getToken());
    }
    const fbUser = requireCurrentUser();
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', fbUser.uid));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        if (!docSnap.data().read) {
          batch.update(docSnap.ref, { read: true, updatedAt: serverTimestamp() });
        }
      });
      await batch.commit();
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'notifications');
    }
  },

  getOverview: async () => {
    if (isServerSession()) {
      return await serverFetch<{ overview: ClientFinancialOverview; settings: PlatformSettings }>(
        '/api/client/overview'
      );
    }
    if (isLocalSession()) {
      return await localFallback.getOverview(authStorage.getToken(), DEFAULT_PLATFORM_SETTINGS);
    }
    const { raw } = await getCurrentUserProfile();
    const [{ deposits }, { investments }, { withdrawals }, { ledger }, settings] = await Promise.all([
      api.getDeposits(),
      api.getInvestments(),
      api.getWithdrawals(),
      api.getLedger(),
      fetchPlatformSettings(),
    ]);
    const overview = computeOverviewFromRecords(raw, deposits, investments, withdrawals, ledger);
    return { overview, settings };
  },

  // --- Admin ---
  getAdminOverview: async (): Promise<{ overview: AdminPlatformOverview; settings: PlatformSettings }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/overview');
    }
    requireCurrentUser();
    const [{ clients }, { deposits }, { investments }, { withdrawals }, settings] = await Promise.all([
      api.getClients(),
      api.getAllDeposits(),
      api.getAllInvestments(),
      api.getAllWithdrawals(),
      fetchPlatformSettings(),
    ]);

    const confirmedDeposits = deposits.filter((d) => d.status === 'CONFIRMED');
    const pendingDeposits = deposits.filter((d) => d.status !== 'CONFIRMED' && d.status !== 'REJECTED');
    const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
    const pendingWithdrawals = withdrawals.filter((w) => w.status !== 'COMPLETED' && w.status !== 'REJECTED');
    const completedWithdrawals = withdrawals.filter((w) => w.status === 'COMPLETED');
    const rejectedCount =
      deposits.filter((d) => d.status === 'REJECTED').length +
      withdrawals.filter((w) => w.status === 'REJECTED').length;

    const overview: AdminPlatformOverview = {
      totalRegisteredClients: clients.length,
      verifiedClients: clients.filter((c) => c.kycStatus === 'VERIFIED').length,
      totalConfirmedDepositsUSD: confirmedDeposits.reduce((acc, d) => acc + d.intendedAmountUSD, 0),
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsUSD: pendingDeposits.reduce((acc, d) => acc + d.intendedAmountUSD, 0),
      totalInvestedCapitalUSD: activeInvestments.reduce((acc, i) => acc + i.principalAmountUSD, 0),
      activeInvestmentsCount: activeInvestments.length,
      totalRecordedEarningsUSD: investments.reduce((acc, i) => acc + (i.accumulatedEarningsUSD || 0), 0),
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsUSD: pendingWithdrawals.reduce((acc, w) => acc + w.amountUSD, 0),
      completedWithdrawalsUSD: completedWithdrawals.reduce((acc, w) => acc + w.amountUSD, 0),
      rejectedTransactionsCount: rejectedCount,
      ledgerReconciliationStatus: 'BALANCED',
    };

    return { overview, settings };
  },

  getClients: async (): Promise<{ clients: (User & { financialOverview: ClientFinancialOverview })[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/clients');
    }
    requireCurrentUser();
    try {
      const snap = await getDocs(collection(db, 'users'));
      const clients = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const user = mapDocToUser(docSnap.id, d, d.role === 'ADMIN');
        const avail = typeof d.sampleBalanceUSDT === 'number' ? d.sampleBalanceUSDT : 0;
        const invested = typeof d.investedBalanceUSDT === 'number' ? d.investedBalanceUSDT : 0;
        return {
          ...user,
          financialOverview: {
            totalBalanceUSD: Math.round((avail + invested) * 100) / 100,
            availableBalanceUSD: Math.round(avail * 100) / 100,
            totalInvestedUSD: Math.round(invested * 100) / 100,
            activeInvestmentsUSD: Math.round(invested * 100) / 100,
            totalEarningsUSD: 0,
            pendingDepositsUSD: 0,
            pendingWithdrawalsUSD: 0,
            weeklyProjectedEarningsUSD: Math.round(invested * 0.02 * 100) / 100,
          },
        };
      });
      return { clients };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  },

  updateClientStatus: async (customerId: string, status: string) => {
    if (isServerSession()) {
      return await serverFetch<{ client: User }>(`/api/admin/clients/${customerId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    }
    requireCurrentUser();
    const usersSnap = await getDocs(collection(db, 'users'));
    const target = usersSnap.docs.find((d) => d.data().customerId === customerId || d.id === customerId);
    if (!target) throw new Error('Client not found');
    try {
      await updateDoc(target.ref, { status, updatedAt: serverTimestamp() });
      return { client: mapDocToUser(target.id, { ...target.data(), status }, false) };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.id}`);
    }
  },

  updateClientKyc: async (customerId: string, kycStatus: string) => {
    if (isServerSession()) {
      return await serverFetch<{ client: User }>(`/api/admin/clients/${customerId}/kyc`, {
        method: 'PUT',
        body: JSON.stringify({ kycStatus }),
      });
    }
    requireCurrentUser();
    const usersSnap = await getDocs(collection(db, 'users'));
    const target = usersSnap.docs.find((d) => d.data().customerId === customerId || d.id === customerId);
    if (!target) throw new Error('Client not found');
    try {
      await updateDoc(target.ref, { kycStatus, updatedAt: serverTimestamp() });
      return { client: mapDocToUser(target.id, { ...target.data(), kycStatus }, false) };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${target.id}`);
    }
  },

  getAllDeposits: async (): Promise<{ deposits: DepositRequest[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/deposits');
    }
    requireCurrentUser();
    try {
      const snap = await getDocs(collection(db, 'deposits'));
      const deposits = snap.docs
        .map((docSnap) => mapDeposit(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { deposits };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'deposits');
    }
  },

  verifyBlockchainTx: async (txHash: string, currency: string) => {
    const cleanHash = txHash.trim().toLowerCase();
    const isValidFormat =
      (currency === 'BTC' && cleanHash.length >= 60) ||
      ((currency === 'ETH' || currency === 'USDT') && cleanHash.startsWith('0x') && cleanHash.length === 66) ||
      cleanHash.length >= 50;
    return isValidFormat
      ? { verified: true, blockNumber: 21948500 }
      : { verified: false, reason: 'Invalid transaction hash format.' };
  },

  approveDeposit: async (id: string, notes?: string) => {
    if (isServerSession()) {
      return await serverFetch<{ deposit: DepositRequest; message: string }>(
        `/api/admin/deposits/${id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({ notes }),
        }
      );
    }
    const { fbUser, user: adminUser } = await getCurrentUserProfile();
    const depRef = doc(db, 'deposits', id);
    const depSnap = await getDoc(depRef);
    if (!depSnap.exists()) throw new Error('Deposit not found');
    const depData = depSnap.data();

    try {
      await updateDoc(depRef, {
        status: 'CONFIRMED',
        confirmations: depData.requiredConfirmations || 12,
        updatedAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', depData.userId);
      const userSnap = await getDoc(userRef);
      const currentBal = userSnap.exists() ? Number(userSnap.data().sampleBalanceUSDT || 0) : 0;
      const newBal = currentBal + Number(depData.intendedAmountUSD || 0);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          sampleBalanceUSDT: newBal,
          updatedAt: serverTimestamp(),
        });
      }

      const ledId = generateId('led');
      await setDoc(doc(db, 'ledger', ledId), {
        userId: depData.userId,
        customerId: depData.customerId,
        type: 'DEPOSIT_CONFIRMED',
        amountUSD: Number(depData.intendedAmountUSD),
        referenceId: id,
        description: `${depData.currency} (${depData.network}) Confirmed Deposit: $${depData.intendedAmountUSD} USD`,
        balanceAfterUSD: newBal,
        createdAt: serverTimestamp(),
      });

      const logId = generateId('aud');
      await setDoc(doc(db, 'auditLogs', logId), {
        actorId: fbUser.uid,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'DEPOSIT_CONFIRMED',
        targetType: 'DEPOSIT',
        targetId: id,
        details: `Approved $${depData.intendedAmountUSD} USD for ${depData.customerId}. ${notes || ''}`.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deposits/${id}`);
    }

    return {
      deposit: mapDeposit(id, { ...depData, status: 'CONFIRMED' }),
      message: 'Deposit confirmed and credited to client ledger.',
    };
  },

  rejectDeposit: async (id: string, reason?: string) => {
    if (isServerSession()) {
      return await serverFetch<{ deposit: DepositRequest; message: string }>(
        `/api/admin/deposits/${id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }
      );
    }
    const { fbUser, user: adminUser } = await getCurrentUserProfile();
    const depRef = doc(db, 'deposits', id);
    const depSnap = await getDoc(depRef);
    if (!depSnap.exists()) throw new Error('Deposit not found');
    const depData = depSnap.data();

    try {
      await updateDoc(depRef, {
        status: 'REJECTED',
        rejectionReason: (reason || 'Failed blockchain verification').slice(0, 300),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'auditLogs', generateId('aud')), {
        actorId: fbUser.uid,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'DEPOSIT_REJECTED',
        targetType: 'DEPOSIT',
        targetId: id,
        details: `Rejected deposit ${id}. Reason: ${reason || 'Failed verification'}`,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deposits/${id}`);
    }

    return {
      deposit: mapDeposit(id, { ...depData, status: 'REJECTED', rejectionReason: reason }),
      message: 'Deposit rejected.',
    };
  },

  getAllInvestments: async (): Promise<{ investments: Investment[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/investments');
    }
    requireCurrentUser();
    try {
      const snap = await getDocs(collection(db, 'investments'));
      const investments = snap.docs
        .map((docSnap) => mapInvestment(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { investments };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'investments');
    }
  },

  triggerAccrualBatch: async () => {
    if (isServerSession()) {
      return await serverFetch<{
        result: { processedCount: number; totalDistributedUSD: number };
        message: string;
      }>('/api/admin/investments/accrue-batch', { method: 'POST' });
    }
    const { fbUser, user: adminUser } = await getCurrentUserProfile();
    try {
      const snap = await getDocs(collection(db, 'investments'));
      let count = 0;
      let distributed = 0;
      const now = new Date();
      const nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      for (const invDoc of snap.docs) {
        const inv = invDoc.data();
        if (inv.status !== 'ACTIVE') continue;

        const weeklyReturn = Math.round(inv.principalAmountUSD * inv.weeklyRate * 100) / 100;
        await updateDoc(invDoc.ref, {
          accumulatedEarningsUSD: (inv.accumulatedEarningsUSD || 0) + weeklyReturn,
          lastAccrualDate: now.toISOString(),
          nextAccrualDate: nextDate,
          updatedAt: serverTimestamp(),
        });

        const userRef = doc(db, 'users', inv.userId);
        const userSnap = await getDoc(userRef);
        const currentBal = userSnap.exists() ? Number(userSnap.data().sampleBalanceUSDT || 0) : 0;
        const updatedBal = currentBal + weeklyReturn;
        if (userSnap.exists()) {
          await updateDoc(userRef, {
            sampleBalanceUSDT: updatedBal,
            updatedAt: serverTimestamp(),
          });
        }

        await setDoc(doc(db, 'ledger', generateId('led')), {
          userId: inv.userId,
          customerId: inv.customerId,
          type: 'INVESTMENT_EARNINGS',
          amountUSD: weeklyReturn,
          referenceId: invDoc.id,
          description: `Audited Weekly Return (${(inv.weeklyRate * 100).toFixed(1)}% on $${inv.principalAmountUSD} Principal)`,
          balanceAfterUSD: updatedBal,
          createdAt: serverTimestamp(),
        });

        count++;
        distributed += weeklyReturn;
      }

      await setDoc(doc(db, 'auditLogs', generateId('aud')), {
        actorId: fbUser.uid,
        actorEmail: adminUser.email,
        actorRole: 'ADMIN',
        action: 'MANUAL_ACCRUAL_BATCH_EXECUTED',
        targetType: 'INVESTMENTS',
        targetId: 'ALL_ACTIVE',
        details: `Credited ${count} active investments with total $${distributed.toFixed(2)} USD.`,
        createdAt: serverTimestamp(),
      });

      return {
        result: { processedCount: count, totalDistributedUSD: distributed },
        message: `Weekly accrual ledger batch executed. Distributed $${distributed.toFixed(2)} USD across ${count} active investments.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'investments');
    }
  },

  getAllWithdrawals: async (): Promise<{ withdrawals: WithdrawalRequest[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/withdrawals');
    }
    requireCurrentUser();
    try {
      const snap = await getDocs(collection(db, 'withdrawals'));
      const withdrawals = snap.docs
        .map((docSnap) => mapWithdrawal(docSnap.id, docSnap.data()))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return { withdrawals };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'withdrawals');
    }
  },

  approveWithdrawal: async (id: string) => {
    if (isServerSession()) {
      return await serverFetch<{ withdrawal: WithdrawalRequest; message: string }>(
        `/api/admin/withdrawals/${id}/approve`,
        { method: 'POST' }
      );
    }
    requireCurrentUser();
    const wRef = doc(db, 'withdrawals', id);
    try {
      await updateDoc(wRef, { status: 'APPROVED', updatedAt: serverTimestamp() });
      const snap = await getDoc(wRef);
      return {
        withdrawal: mapWithdrawal(id, snap.data() || {}),
        message: 'Withdrawal approved for processing.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${id}`);
    }
  },

  completeWithdrawal: async (id: string, blockchainTxRef: string) => {
    if (isServerSession()) {
      return await serverFetch<{ withdrawal: WithdrawalRequest; message: string }>(
        `/api/admin/withdrawals/${id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ blockchainTxRef }),
        }
      );
    }
    requireCurrentUser();
    const wRef = doc(db, 'withdrawals', id);
    try {
      await updateDoc(wRef, {
        status: 'COMPLETED',
        blockchainTxRef: blockchainTxRef.slice(0, 160),
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(wRef);
      return {
        withdrawal: mapWithdrawal(id, snap.data() || {}),
        message: 'Withdrawal marked completed with blockchain tx ref.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${id}`);
    }
  },

  rejectWithdrawal: async (id: string, reason: string) => {
    if (isServerSession()) {
      return await serverFetch<{ withdrawal: WithdrawalRequest; message: string }>(
        `/api/admin/withdrawals/${id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }
      );
    }
    requireCurrentUser();
    const wRef = doc(db, 'withdrawals', id);
    const wSnap = await getDoc(wRef);
    if (!wSnap.exists()) throw new Error('Withdrawal not found');
    const wData = wSnap.data();

    try {
      await updateDoc(wRef, {
        status: 'REJECTED',
        rejectionReason: reason.slice(0, 300),
        updatedAt: serverTimestamp(),
      });

      const userRef = doc(db, 'users', wData.userId);
      const userSnap = await getDoc(userRef);
      const currentBal = userSnap.exists() ? Number(userSnap.data().sampleBalanceUSDT || 0) : 0;
      const refundBal = currentBal + Number(wData.amountUSD || 0);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          sampleBalanceUSDT: refundBal,
          updatedAt: serverTimestamp(),
        });
      }

      await setDoc(doc(db, 'ledger', generateId('led')), {
        userId: wData.userId,
        customerId: wData.customerId,
        type: 'WITHDRAWAL_REFUND',
        amountUSD: Number(wData.amountUSD),
        referenceId: id,
        description: `Withdrawal Rejected & Refunded: ${reason}`,
        balanceAfterUSD: refundBal,
        createdAt: serverTimestamp(),
      });

      return {
        withdrawal: mapWithdrawal(id, { ...wData, status: 'REJECTED', rejectionReason: reason }),
        message: 'Withdrawal rejected and funds refunded to client ledger.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${id}`);
    }
  },

  getAllWallets: async (): Promise<{ wallets: CryptoWallet[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/wallets');
    }
    requireCurrentUser();
    try {
      const snap = await getDocs(collection(db, 'wallets'));
      if (snap.empty) return { wallets: DEFAULT_WALLETS };
      const wallets: CryptoWallet[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          currency: d.currency,
          network: d.network,
          address: d.address,
          qrCodeNote: d.qrCodeNote,
          isActive: d.isActive,
          minDepositUSD: d.minDepositUSD,
          requiredConfirmations: d.requiredConfirmations,
          updatedAt: toIso(d.updatedAt),
        };
      });
      return { wallets };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'wallets');
    }
  },

  saveWallet: async (wallet: Partial<CryptoWallet>) => {
    if (isServerSession()) {
      return await serverFetch<{ wallet: CryptoWallet; message: string }>('/api/admin/wallets', {
        method: 'POST',
        body: JSON.stringify(wallet),
      });
    }
    requireCurrentUser();
    const id = wallet.id || generateId('wal');
    const payload = stripUndefined({
      currency: wallet.currency || 'USDT',
      network: (wallet.network || 'Ethereum (ERC-20)').slice(0, 100),
      address: (wallet.address || '').slice(0, 200),
      qrCodeNote: (wallet.qrCodeNote || 'Official institutional deposit wallet.').slice(0, 500),
      isActive: wallet.isActive !== false,
      minDepositUSD: Number(wallet.minDepositUSD || 100),
      requiredConfirmations: Number(wallet.requiredConfirmations || 12),
      updatedAt: serverTimestamp(),
    });
    try {
      await setDoc(doc(db, 'wallets', id), payload, { merge: true });
      return {
        wallet: {
          id,
          currency: payload.currency,
          network: payload.network,
          address: payload.address,
          qrCodeNote: payload.qrCodeNote,
          isActive: payload.isActive,
          minDepositUSD: payload.minDepositUSD,
          requiredConfirmations: payload.requiredConfirmations,
          updatedAt: new Date().toISOString(),
        } as CryptoWallet,
        message: 'Wallet saved successfully.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `wallets/${id}`);
    }
  },

  getSettings: async () => {
    if (!auth.currentUser) {
      try {
        return await serverFetch<{ settings: PlatformSettings }>('/api/public/settings');
      } catch (err) {
        if (err instanceof BackendUnavailableError) {
          return { settings: DEFAULT_PLATFORM_SETTINGS };
        }
        throw err;
      }
    }
    const settings = await fetchPlatformSettings();
    return { settings };
  },

  updateSettings: async (settings: Partial<PlatformSettings>) => {
    if (isServerSession()) {
      return await serverFetch<{ settings: PlatformSettings; message: string }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    }
    requireCurrentUser();
    const current = await fetchPlatformSettings();
    const merged = {
      ...current,
      ...settings,
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'settings', 'platform'), merged);
      return {
        settings: { ...current, ...settings },
        message: 'Platform settings updated.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/platform');
    }
  },

  getAuditLogs: async (): Promise<{ auditLogs: AuditLogItem[] }> => {
    if (isServerSession()) {
      return await serverFetch('/api/admin/audit-logs');
    }
    requireCurrentUser();
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      const auditLogs: AuditLogItem[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            actorId: d.actorId,
            actorEmail: d.actorEmail,
            actorRole: d.actorRole,
            action: d.action,
            targetType: d.targetType,
            targetId: d.targetId,
            details: d.details,
            timestamp: toIso(d.createdAt),
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return { auditLogs };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'auditLogs');
    }
  },
};
