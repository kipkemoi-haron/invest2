import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { storage } from './src/server/storage.ts';
import type { User } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth Middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = storage.verifySessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  req.user = user;
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Administrative clearance required for this operation.' });
      return;
    }
    next();
  });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, country, password, confirmPassword, referralCode } = req.body;
    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'All mandatory registration fields must be completed.' });
      return;
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const { user, token } = storage.registerUser({
      fullName,
      email,
      phone,
      country,
      password,
      referralCode,
    });

    res.status(201).json({ user, token, message: 'Account successfully registered.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const { user, token } = storage.loginUser(email, password);
    res.json({ user, token, message: 'Authenticated successfully.' });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = storage.findUserByEmail(email);
  if (!user) {
    // Standard security response: don't reveal email existence
    res.json({ message: 'If this email is registered, password recovery instructions have been sent.' });
    return;
  }
  res.json({
    message: `Password reset instructions dispatched to ${email}. For demonstration, you may log in with the current or seed credentials.`,
  });
});

app.post('/api/auth/kyc/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = storage.updateKycStatus(req.user!.customerId, 'SUBMITTED', req.user!);
    res.json({ user: updated, message: 'Identity documentation submitted for compliance review.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- PUBLIC & CLIENT ROUTES ---

app.get('/api/public/settings', (_req: Request, res: Response) => {
  res.json({ settings: storage.getSettings() });
});

app.get('/api/client/fintech-state', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = storage.getUserFintechState(req.user!.customerId);
    res.json({ state });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/client/fintech-state', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const state = storage.saveUserFintechState(req.user!.customerId, req.body || {});
    res.json({ state });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/client/overview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = storage.getClientFinancialOverview(req.user!.customerId);
    const settings = storage.getSettings();
    res.json({ overview, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/client/wallets', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ wallets: storage.getActiveWallets() });
});

app.post('/api/client/deposits', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currency, network, walletAddress, intendedAmountUSD, cryptoAmount, txHash, proofFileName } = req.body;
    const deposit = storage.submitDepositRequest({
      customerId: req.user!.customerId,
      userEmail: req.user!.email,
      currency,
      network,
      walletAddress,
      intendedAmountUSD: parseFloat(intendedAmountUSD),
      cryptoAmount,
      txHash,
      proofFileName,
    });
    res.status(201).json({ deposit, message: 'Deposit recorded. Awaiting blockchain validation.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/client/deposits/:id/tx-hash', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { txHash, proofFileName } = req.body;
    const deposit = storage.updateDepositTxHash(req.params.id, req.user!.customerId, txHash, proofFileName);
    res.json({ deposit, message: 'Transaction hash submitted. Verification queue active.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/client/deposits', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ deposits: storage.getClientDeposits(req.user!.customerId) });
});

app.post('/api/client/investments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { principalAmountUSD, termsAccepted } = req.body;
    const inv = storage.activateInvestment(
      req.user!.customerId,
      parseFloat(principalAmountUSD),
      termsAccepted === true
    );
    res.status(201).json({
      investment: inv,
      message: `Investment of $${inv.principalAmountUSD.toLocaleString()} USD activated successfully.`,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/client/investments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ investments: storage.getClientInvestments(req.user!.customerId) });
});

app.post('/api/client/withdrawals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currency, network, destinationAddress, amountUSD } = req.body;
    const w = storage.submitWithdrawalRequest({
      customerId: req.user!.customerId,
      userEmail: req.user!.email,
      currency,
      network,
      destinationAddress,
      amountUSD: parseFloat(amountUSD),
    });
    res.status(201).json({ withdrawal: w, message: 'Withdrawal request submitted for review.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/client/withdrawals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ withdrawals: storage.getClientWithdrawals(req.user!.customerId) });
});

app.get('/api/client/ledger', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ ledger: storage.getClientLedger(req.user!.customerId) });
});

app.get('/api/client/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ notifications: storage.getNotifications(req.user!.customerId) });
});

app.put('/api/client/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  storage.markNotificationRead(req.params.id, req.user!.customerId);
  res.json({ success: true });
});

app.put('/api/client/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  storage.markAllNotificationsRead(req.user!.customerId);
  res.json({ success: true });
});

// --- ADMIN ROUTES ---

app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    overview: storage.getAdminOverview(),
    settings: storage.getSettings(),
  });
});

app.get('/api/admin/clients', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ clients: storage.getAllClients() });
});

app.put('/api/admin/clients/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const client = storage.updateClientStatus(req.params.id, status, req.user!);
    res.json({ client });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/clients/:id/kyc', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { kycStatus } = req.body;
    const client = storage.updateKycStatus(req.params.id, kycStatus, req.user!);
    res.json({ client });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/deposits', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ deposits: storage.getAllDeposits() });
});

app.post('/api/admin/deposits/verify-blockchain', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { txHash, currency } = req.body;
  const result = storage.verifyBlockchainTx(txHash, currency);
  res.json(result);
});

app.post('/api/admin/deposits/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const deposit = storage.approveDeposit(req.params.id, req.user!, notes);
    res.json({ deposit, message: 'Deposit confirmed and credited to client ledger.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/deposits/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const deposit = storage.rejectDeposit(req.params.id, req.user!, reason || 'Failed blockchain verification');
    res.json({ deposit, message: 'Deposit rejected.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/investments', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ investments: storage.getAllInvestments() });
});

app.post('/api/admin/investments/accrue-batch', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const result = storage.forceAccrualBatch(req.user!);
  res.json({
    result,
    message: `Weekly accrual ledger batch executed. Distributed $${result.totalDistributedUSD.toFixed(2)} USD across ${result.processedCount} active investments.`,
  });
});

app.get('/api/admin/withdrawals', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ withdrawals: storage.getAllWithdrawals() });
});

app.post('/api/admin/withdrawals/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const w = storage.approveWithdrawal(req.params.id, req.user!);
    res.json({ withdrawal: w, message: 'Withdrawal approved for processing.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawals/:id/complete', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { blockchainTxRef } = req.body;
    if (!blockchainTxRef) {
      res.status(400).json({ error: 'Blockchain transaction hash reference is required.' });
      return;
    }
    const w = storage.completeWithdrawal(req.params.id, blockchainTxRef, req.user!);
    res.json({ withdrawal: w, message: 'Withdrawal marked completed with blockchain tx ref.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawals/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const w = storage.rejectWithdrawal(req.params.id, reason || 'Compliance check rejection', req.user!);
    res.json({ withdrawal: w, message: 'Withdrawal rejected and funds refunded to client ledger.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/wallets', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ wallets: storage.getAllWallets() });
});

app.post('/api/admin/wallets', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = storage.upsertWallet(req.body, req.user!);
    res.json({ wallet, message: 'Wallet saved successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ settings: storage.getSettings() });
});

app.put('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = storage.updateSettings(req.body, req.user!);
    res.json({ settings, message: 'Platform settings updated.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ auditLogs: storage.getAuditLogs() });
});

// Periodic accrual worker (runs every 30 minutes in background)
setInterval(() => {
  storage.processScheduledAccruals();
}, 30 * 60 * 1000);

// Serve Android APK binary if hosted at public/app.apk or dist/app.apk without falling back to index.html
app.get('/app.apk', (_req: Request, res: Response) => {
  const candidates = [
    path.resolve(__dirname, 'public', 'app.apk'),
    path.resolve(__dirname, 'dist', 'app.apk'),
  ];
  const apkPath = candidates.find((p) => fs.existsSync(p));
  if (!apkPath) {
    res.status(404).json({ error: 'Android APK binary not yet hosted at /public/app.apk.' });
    return;
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="Aethelgard.apk"');
  res.sendFile(apkPath);
});

// --- STATIC OR VITE MIDDLEWARE ---
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
      plugins: [
        {
          name: 'disable-hmr-websocket',
          transform(code, id) {
            if (id.replace(/\\/g, '/').endsWith('/vite/dist/client/client.mjs')) {
              return code
                .replace(
                  'transport.connect(createHMRHandler(handleMessage));',
                  '/* HMR disabled: WebSocket connection skipped */'
                )
                .replace(
                  'else throw new SendBeforeConnectError("send was called before connect");',
                  'else return;'
                );
            }
          },
        },
      ],
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      try {
        const indexHtmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexHtmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aethelgard Capital Institutional Platform active on port ${PORT}`);
  });
}

startServer();
