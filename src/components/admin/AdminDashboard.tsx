import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.ts';
import type {
  AdminPlatformOverview,
  PlatformSettings,
  User,
  DepositRequest,
  Investment,
  WithdrawalRequest,
  CryptoWallet,
  AuditLogItem,
  ClientFinancialOverview,
} from '../../types/index.ts';
import {
  ShieldCheck,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  Settings,
  FileSpreadsheet,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  Plus,
  Play,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'clients' | 'deposits' | 'investments' | 'withdrawals' | 'wallets' | 'settings' | 'reports' | 'audit'
  >('overview');

  const [overview, setOverview] = useState<AdminPlatformOverview | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [clients, setClients] = useState<(User & { financialOverview: ClientFinancialOverview })[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Search & Filter
  const [clientSearch, setClientSearch] = useState('');
  const [depositFilter, setDepositFilter] = useState<string>('ALL');

  // Modals & Forms
  const [editingWallet, setEditingWallet] = useState<Partial<CryptoWallet> | null>(null);
  const [actionTxHash, setActionTxHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Settings form state
  const [settingsRate, setSettingsRate] = useState<string>('0.02');
  const [settingsLegalApproved, setSettingsLegalApproved] = useState<boolean>(true);
  const [settingsMinDeposit, setSettingsMinDeposit] = useState<string>('100');
  const [settingsMinWithdrawal, setSettingsMinWithdrawal] = useState<string>('50');

  const loadAdminData = useCallback(async () => {
    try {
      const [ovRes, clRes, depRes, invRes, withRes, walRes, audRes] = await Promise.all([
        api.getAdminOverview(),
        api.getClients(),
        api.getAllDeposits(),
        api.getAllInvestments(),
        api.getAllWithdrawals(),
        api.getAllWallets(),
        api.getAuditLogs(),
      ]);

      setOverview(ovRes.overview);
      setSettings(ovRes.settings);
      setSettingsRate(ovRes.settings.weeklyReturnRate.toString());
      setSettingsLegalApproved(ovRes.settings.legalTermsApproved);
      setSettingsMinDeposit(ovRes.settings.minDepositUSD.toString());
      setSettingsMinWithdrawal(ovRes.settings.minWithdrawalUSD.toString());

      setClients(clRes.clients);
      setDeposits(depRes.deposits);
      setInvestments(invRes.investments);
      setWithdrawals(withRes.withdrawals);
      setWallets(walRes.wallets);
      setAuditLogs(audRes.auditLogs);
    } catch (err) {
      console.error('Failed fetching admin data:', err);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Actions
  const handleApproveDeposit = async (depositId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.approveDeposit(depositId);
      setStatusMessage(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    const reason = prompt('Please specify rejection reason for client notification:', 'Invalid blockchain transaction hash');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const res = await api.rejectDeposit(depositId, reason);
      setStatusMessage(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRunAccrualBatch = async () => {
    if (!confirm('Run the Weekly Earnings Ledger Batch now? This will calculate and credit 2.0% returns to all active investments.')) return;
    setIsProcessing(true);
    try {
      const res = await api.triggerAccrualBatch();
      setStatusMessage(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleApproveWithdrawal = async (wId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.approveWithdrawal(wId);
      setStatusMessage(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCompleteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawalId || !actionTxHash) return;

    setIsProcessing(true);
    try {
      const res = await api.completeWithdrawal(selectedWithdrawalId, actionTxHash);
      setStatusMessage(res.message);
      setSelectedWithdrawalId(null);
      setActionTxHash('');
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRejectWithdrawal = async (wId: string) => {
    const reason = prompt('Specify rejection reason (Funds will be refunded to client ledger):', 'Compliance authorization requirement unmet');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const res = await api.rejectWithdrawal(wId, reason);
      setStatusMessage(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !editingWallet.currency || !editingWallet.address || !editingWallet.network) return;

    setIsProcessing(true);
    try {
      const res = await api.saveWallet(editingWallet);
      setStatusMessage(res.message);
      setEditingWallet(null);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await api.updateSettings({
        weeklyReturnRate: parseFloat(settingsRate),
        legalTermsApproved: settingsLegalApproved,
        minDepositUSD: parseFloat(settingsMinDeposit),
        minWithdrawalUSD: parseFloat(settingsMinWithdrawal),
      });
      setStatusMessage(res.message);
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleToggleClientStatus = async (customerId: string, current: string) => {
    const newStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateClientStatus(customerId, newStatus);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateKyc = async (customerId: string, newKyc: string) => {
    try {
      await api.updateClientKyc(customerId, newKyc);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportReportCsv = (type: string) => {
    let rows: any[] = [];
    let filename = `Aethelgard_Report_${type}.csv`;

    if (type === 'deposits') {
      rows = [
        ['ID', 'Customer ID', 'Currency', 'Network', 'Amount (USD)', 'Status', 'Tx Hash', 'Date'],
        ...deposits.map((d) => [d.id, d.customerId, d.currency, d.network, d.intendedAmountUSD, d.status, d.txHash || '', d.createdAt]),
      ];
    } else if (type === 'withdrawals') {
      rows = [
        ['ID', 'Customer ID', 'Currency', 'Amount (USD)', 'Fee', 'Net', 'Status', 'Destination', 'Date'],
        ...withdrawals.map((w) => [w.id, w.customerId, w.currency, w.amountUSD, w.feeUSD, w.netAmountUSD, w.status, w.destinationAddress, w.submittedAt]),
      ];
    } else if (type === 'investments') {
      rows = [
        ['ID', 'Customer ID', 'Principal (USD)', 'Weekly Rate', 'Accumulated Yield', 'Status', 'Start Date', 'Maturity Date'],
        ...investments.map((i) => [i.id, i.customerId, i.principalAmountUSD, i.weeklyRate, i.accumulatedEarningsUSD, i.status, i.startDate, i.maturityDate]),
      ];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Admin Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-white">Administrator Compliance Portal</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  MASTER CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional Ledger Management, Blockchain Consensus Probers, Wallet Addresses & Fiduciary Terms
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunAccrualBatch}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Weekly Earnings Batch</span>
            </button>
            <button
              onClick={loadAdminData}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto text-xs font-medium border-t border-slate-800 pt-1 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'clients'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Clients</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {clients.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'deposits'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Deposits & Verification</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {deposits.filter((d) => d.status !== 'CONFIRMED' && d.status !== 'REJECTED').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'investments'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Investments (2% Return)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {investments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'withdrawals'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Withdrawals</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {withdrawals.filter((w) => w.status !== 'COMPLETED' && w.status !== 'REJECTED').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'wallets'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Company Wallets
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Platform Terms
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Financial Reports
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`min-h-[44px] px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Status Toast Notification */}
        {statusMessage && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                <span className="text-[11px] text-slate-400">Total Clients</span>
                <div className="text-2xl font-bold text-white font-mono">{overview?.totalRegisteredClients || 0}</div>
                <div className="text-[10px] text-slate-500">{overview?.verifiedClients || 0} KYC Verified</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                <span className="text-[11px] text-slate-400">Confirmed Deposits</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  ${overview?.totalConfirmedDepositsUSD.toLocaleString() || '0.00'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">On-chain verified</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                <span className="text-[11px] text-slate-400">Invested Capital</span>
                <div className="text-2xl font-bold text-white font-mono">
                  ${overview?.totalInvestedCapitalUSD.toLocaleString() || '0.00'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{overview?.activeInvestmentsCount || 0} active positions</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                <span className="text-[11px] text-slate-400">Distributed Earnings</span>
                <div className="text-2xl font-bold text-amber-400 font-mono">
                  ${overview?.totalRecordedEarningsUSD.toLocaleString() || '0.00'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">2.0% weekly ledger entries</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                <span className="text-[11px] text-slate-400">Pending Deposits</span>
                <div className="text-2xl font-bold text-slate-300 font-mono">
                  ${overview?.pendingDepositsUSD.toLocaleString() || '0.00'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{overview?.pendingDepositsCount || 0} requests awaiting</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 space-y-1">
                <span className="text-[11px] text-slate-400">Pending Withdrawals</span>
                <div className="text-2xl font-bold text-slate-300 font-mono">
                  ${overview?.pendingWithdrawalsUSD.toLocaleString() || '0.00'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{overview?.pendingWithdrawalsCount || 0} in review</div>
              </div>
            </div>

            {/* Quick Actions & Platform Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Approved Investment Terms Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    LEGAL CLEARANCE ACTIVE
                  </span>
                </h3>
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Weekly Return Rate:</span>
                    <span className="text-amber-400 font-bold">{(settings?.weeklyReturnRate || 0.02) * 100}% / week</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Standard Horizon:</span>
                    <span>{settings?.defaultTermDurationWeeks || 12} Weeks</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Legal Review Date:</span>
                    <span>{settings?.legalApprovalDate || '2026-09-15'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Ledger Reconciliation:</span>
                    <span className="text-emerald-400 font-bold">100% BALANCED</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
                <h3 className="text-sm font-bold text-white">Manual Accrual Trigger</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The automated ledger runner computes 2% weekly returns on schedule every 7 days. Administrators can also trigger an immediate batch run to credit active positions and inspect ledger entries.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleRunAccrualBatch}
                    disabled={isProcessing}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Execute Weekly Accrual Ledger Batch</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Pending Deposit Queue Preview */}
            <div className="w-full max-w-full p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Pending Deposits Awaiting Action</h3>
                  <p className="text-xs text-slate-400">Verify blockchain tx hash before approving and crediting client balances.</p>
                </div>
                <button
                  onClick={() => setActiveTab('deposits')}
                  className="min-h-[44px] sm:min-h-0 text-xs text-amber-400 hover:underline self-start sm:self-auto"
                >
                  View All Deposits →
                </button>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Asset</th>
                      <th className="p-2.5">Intended USD</th>
                      <th className="p-2.5">Tx Hash</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {deposits
                      .filter((d) => d.status !== 'CONFIRMED' && d.status !== 'REJECTED')
                      .slice(0, 4)
                      .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 text-white font-bold">{d.id}</td>
                          <td className="p-2.5 text-slate-300">{d.customerId}</td>
                          <td className="p-2.5 text-slate-300">{d.currency} ({d.network})</td>
                          <td className="p-2.5 text-white font-bold">${d.intendedAmountUSD.toLocaleString()} USD</td>
                          <td className="p-2.5 text-amber-400 truncate max-w-[140px]">{d.txHash || 'Awaiting'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {d.status}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApproveDeposit(d.id)}
                                className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(d.id)}
                                className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] hover:bg-red-500/30"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. CLIENT MANAGEMENT TAB */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Client Registry & Ledger Profiles</h2>
                <p className="text-xs text-slate-400">View individual financial ledgers, verify KYC, or suspend accounts.</p>
              </div>

              <div className="relative sm:max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or Customer ID..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="w-full max-w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3 font-medium">Customer ID</th>
                      <th className="p-3 font-medium">Client Name</th>
                      <th className="p-3 font-medium">Email</th>
                      <th className="p-3 font-medium">Country</th>
                      <th className="p-3 font-medium">Total Balance</th>
                      <th className="p-3 font-medium">Available</th>
                      <th className="p-3 font-medium">Invested (2%)</th>
                      <th className="p-3 font-medium">KYC</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {clients
                      .filter(
                        (c) =>
                          c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          c.customerId.toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-white font-bold">{c.customerId}</td>
                          <td className="p-3 text-slate-200">{c.fullName}</td>
                          <td className="p-3 text-slate-400">{c.email}</td>
                          <td className="p-3 text-slate-400">{c.country}</td>
                          <td className="p-3 text-white font-bold">
                            ${c.financialOverview.totalBalanceUSD.toLocaleString()} USD
                          </td>
                          <td className="p-3 text-emerald-400 font-bold">
                            ${c.financialOverview.availableBalanceUSD.toLocaleString()} USD
                          </td>
                          <td className="p-3 text-amber-400 font-bold">
                            ${c.financialOverview.activeInvestmentsUSD.toLocaleString()} USD
                          </td>
                          <td className="p-3">
                            <select
                              value={c.kycStatus}
                              onChange={(e) => handleUpdateKyc(c.customerId, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 min-h-[44px] sm:min-h-0 text-base sm:text-[11px] text-white focus:outline-none"
                            >
                              <option value="UNVERIFIED">UNVERIFIED</option>
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="VERIFIED">VERIFIED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleClientStatus(c.customerId, c.status)}
                              className={`px-2.5 py-1 min-h-[44px] sm:min-h-0 rounded text-[11px] font-bold ${
                                c.status === 'ACTIVE'
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              }`}
                            >
                              {c.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. DEPOSIT MANAGEMENT TAB */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Cryptocurrency Deposits Verification</h2>
                <p className="text-xs text-slate-400">
                  Verify blockchain tx hashes on-chain. Approving automatically writes to the double-entry ledger.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDepositFilter(f)}
                    className={`min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      depositFilter === f
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full max-w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">Deposit ID</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Asset & Network</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Tx Hash</th>
                      <th className="p-3">Confirmations</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {deposits
                      .filter((d) => {
                        if (depositFilter === 'ALL') return true;
                        if (depositFilter === 'CONFIRMED') return d.status === 'CONFIRMED';
                        if (depositFilter === 'REJECTED') return d.status === 'REJECTED';
                        return d.status !== 'CONFIRMED' && d.status !== 'REJECTED';
                      })
                      .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-white font-bold">{d.id}</td>
                          <td className="p-3 text-slate-300">
                            <div>{d.customerId}</div>
                            <div className="text-[10px] text-slate-500">{d.userEmail}</div>
                          </td>
                          <td className="p-3 text-slate-300">
                            <div>{d.currency}</div>
                            <div className="text-[10px] text-slate-500">{d.network}</div>
                          </td>
                          <td className="p-3 text-white font-bold">${d.intendedAmountUSD.toLocaleString()} USD</td>
                          <td className="p-3 text-amber-400 truncate max-w-[160px]">
                            {d.txHash ? (
                              <span title={d.txHash}>{d.txHash}</span>
                            ) : (
                              <span className="text-slate-500 italic">No hash submitted</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">
                            {d.confirmations} / {d.requiredConfirmations}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                d.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : d.status === 'REJECTED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {d.status !== 'CONFIRMED' && d.status !== 'REJECTED' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApproveDeposit(d.id)}
                                  className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectDeposit(d.id)}
                                  className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] hover:bg-red-500/30 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. INVESTMENTS MANAGEMENT TAB */}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Investment Portfolios (2.0% Weekly Strategy)</h2>
                <p className="text-xs text-slate-400">
                  Formula: Weekly Yield = Principal × 2.0%. Real-time ledger monitoring of active terms.
                </p>
              </div>

              <button
                onClick={handleRunAccrualBatch}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Accrual Batch Now</span>
              </button>
            </div>

            <div className="w-full max-w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Principal (USD)</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3">Weekly Yield</th>
                      <th className="p-3">Earned to Date</th>
                      <th className="p-3">Start Date</th>
                      <th className="p-3">Next Accrual</th>
                      <th className="p-3">Maturity Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {investments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-white font-bold">{inv.id}</td>
                        <td className="p-3 text-slate-300">{inv.customerId}</td>
                        <td className="p-3 text-white font-bold">${inv.principalAmountUSD.toLocaleString()} USD</td>
                        <td className="p-3 text-amber-400">{(inv.weeklyRate * 100).toFixed(1)}%</td>
                        <td className="p-3 text-amber-400 font-bold">+${(inv.principalAmountUSD * inv.weeklyRate).toFixed(2)}</td>
                        <td className="p-3 text-emerald-400 font-bold">+${inv.accumulatedEarningsUSD.toFixed(2)}</td>
                        <td className="p-3 text-slate-400">{new Date(inv.startDate).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-300">{new Date(inv.nextAccrualDate).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-400">{new Date(inv.maturityDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Withdrawal Approval Queue</h2>
              <p className="text-xs text-slate-400">
                Review destination wallet addresses, approve, and record completed blockchain transaction hashes.
              </p>
            </div>

            {/* Broadcast Modal if completing */}
            {selectedWithdrawalId && (
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-slate-900 space-y-4 max-w-lg">
                <h3 className="text-sm font-bold text-white">Record Completed Blockchain Transfer</h3>
                <form onSubmit={handleCompleteWithdrawal} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Blockchain Tx Hash / Broadcast Reference
                    </label>
                    <input
                      type="text"
                      required
                      value={actionTxHash}
                      onChange={(e) => setActionTxHash(e.target.value)}
                      placeholder="e.g. 0x9a3e201b... or btc txid"
                      className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                    >
                      Confirm Broadcast Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawalId(null)}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Asset & Net</th>
                      <th className="p-3">Destination Address</th>
                      <th className="p-3">Gross USD</th>
                      <th className="p-3">Net USD</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Tx Ref</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-white font-bold">{w.id}</td>
                        <td className="p-3 text-slate-300">{w.customerId}</td>
                        <td className="p-3 text-slate-300">{w.currency} ({w.network})</td>
                        <td className="p-3 text-slate-300 truncate max-w-[150px]">{w.destinationAddress}</td>
                        <td className="p-3 text-white font-bold">${w.amountUSD.toLocaleString()} USD</td>
                        <td className="p-3 text-emerald-400 font-bold">${w.netAmountUSD.toLocaleString()} USD</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              w.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : w.status === 'REJECTED'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-amber-400 truncate max-w-[140px]">
                          {w.blockchainTxRef || '-'}
                        </td>
                        <td className="p-3">
                          {w.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 mr-2"
                            >
                              Approve
                            </button>
                          )}
                          {w.status === 'APPROVED' && (
                            <button
                              onClick={() => setSelectedWithdrawalId(w.id)}
                              className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400 mr-2"
                            >
                              Record Tx
                            </button>
                          )}
                          {w.status !== 'COMPLETED' && w.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] hover:bg-red-500/30"
                            >
                              Reject & Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. WALLET MANAGEMENT TAB */}
        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Cryptocurrency Wallet Management</h2>
                <p className="text-xs text-slate-400">
                  Add, update, or disable company deposit addresses for BTC, ETH, and USDT.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingWallet({
                    currency: 'USDT',
                    network: 'Ethereum (ERC-20)',
                    address: '',
                    qrCodeNote: 'Official institutional deposit channel.',
                    isActive: true,
                    minDepositUSD: 100,
                    requiredConfirmations: 12,
                  })
                }
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Wallet Address</span>
              </button>
            </div>

            {/* Editing / Adding Form Modal */}
            {editingWallet && (
              <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-slate-900 space-y-4 max-w-xl">
                <h3 className="text-sm font-bold text-white">
                  {editingWallet.id ? 'Edit Company Wallet' : 'Configure New Company Wallet'}
                </h3>
                <form onSubmit={handleSaveWallet} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                      <select
                        value={editingWallet.currency}
                        onChange={(e) =>
                          setEditingWallet({ ...editingWallet, currency: e.target.value as any })
                        }
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs text-white"
                      >
                        <option value="USDT">USDT</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Network Label</label>
                      <input
                        type="text"
                        required
                        value={editingWallet.network || ''}
                        onChange={(e) => setEditingWallet({ ...editingWallet, network: e.target.value })}
                        placeholder="e.g. Tron (USDT TRC-20)"
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Official Wallet Address</label>
                    <input
                      type="text"
                      required
                      value={editingWallet.address || ''}
                      onChange={(e) => setEditingWallet({ ...editingWallet, address: e.target.value })}
                      placeholder="Paste your official cryptocurrency address"
                      className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Min Deposit (USD)</label>
                      <input
                        type="number"
                        value={editingWallet.minDepositUSD || 100}
                        onChange={(e) =>
                          setEditingWallet({ ...editingWallet, minDepositUSD: parseFloat(e.target.value) })
                        }
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Required Confirmations</label>
                      <input
                        type="number"
                        value={editingWallet.requiredConfirmations || 12}
                        onChange={(e) =>
                          setEditingWallet({ ...editingWallet, requiredConfirmations: parseInt(e.target.value, 10) })
                        }
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="min-h-[44px] flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingWallet.isActive !== false}
                        onChange={(e) => setEditingWallet({ ...editingWallet, isActive: e.target.checked })}
                        className="rounded bg-slate-950 border-slate-800 text-amber-500"
                      />
                      <span>Active for Client Deposits</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                    >
                      Save Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingWallet(null)}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wallets.map((w) => (
                <div key={w.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{w.currency}</span>
                      <span className="text-xs font-mono text-slate-400">({w.network})</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        w.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {w.isActive ? 'Active Channel' : 'Disabled'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 break-all select-all font-semibold">
                    {w.address}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                    <span>Min: ${w.minDepositUSD} USD</span>
                    <span>Confirmations: {w.requiredConfirmations} Blocks</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => setEditingWallet(w)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Edit Wallet Address
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white">Platform Parameters & Legal Approvals</h2>
              <p className="text-xs text-slate-400">
                Configure approved return rates, liquidity limits, and regulatory status without editing source code.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Weekly Return Rate (Decimal)
                </label>
                <input
                  type="number"
                  step="0.005"
                  min="0.005"
                  max="0.05"
                  required
                  value={settingsRate}
                  onChange={(e) => setSettingsRate(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default 0.02 equates to 2.0% weekly (Weekly Earnings = Invested Principal × 2.0%).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Deposit (USD)</label>
                  <input
                    type="number"
                    value={settingsMinDeposit}
                    onChange={(e) => setSettingsMinDeposit(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Withdrawal (USD)</label>
                  <input
                    type="number"
                    value={settingsMinWithdrawal}
                    onChange={(e) => setSettingsMinWithdrawal(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsLegalApproved}
                    onChange={(e) => setSettingsLegalApproved(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span>Legal & Regulatory Framework Approved</span>
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When enabled, verified clients may activate investments into the 2% weekly strategy. If unchecked, investment activation is suspended pending jurisdictional review.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                >
                  Save Platform Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 8. FINANCIAL REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Financial Reports & Statements</h2>
              <p className="text-xs text-slate-400">
                Generate and export auditable reports for compliance officers, auditors, and management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
                <h3 className="text-base font-bold text-white">Deposit Ledger Report</h3>
                <p className="text-xs text-slate-400">
                  Full list of on-chain deposits with verified transaction hashes, block confirmations, and customer IDs.
                </p>
                <button
                  onClick={() => exportReportCsv('deposits')}
                  className="w-full min-h-[44px] py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Deposits CSV</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
                <h3 className="text-base font-bold text-white">Withdrawals & Payouts Report</h3>
                <p className="text-xs text-slate-400">
                  Comprehensive record of gross requests, 1% network fees, destination addresses, and blockchain broadcast hashes.
                </p>
                <button
                  onClick={() => exportReportCsv('withdrawals')}
                  className="w-full min-h-[44px] py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Withdrawals CSV</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
                <h3 className="text-base font-bold text-white">Active Investments & Yields</h3>
                <p className="text-xs text-slate-400">
                  Active positions, weekly accruals (2.0%), duration horizons, and maturity dates across all clients.
                </p>
                <button
                  onClick={() => exportReportCsv('investments')}
                  className="w-full min-h-[44px] py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Investments CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. AUDIT LOG TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Immutable Platform Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Detailed record of all administrative logins, approvals, parameter edits, and transaction authorizations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Log ID</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-white font-bold">{log.id}</td>
                        <td className="p-3 text-slate-300">
                          <div>{log.actorEmail}</div>
                          <div className="text-[10px] text-amber-400">{log.actorRole}</div>
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-300">{log.targetType}: {log.targetId}</td>
                        <td className="p-3 text-slate-300 max-w-sm truncate">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
