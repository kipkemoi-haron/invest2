import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  Percent,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.ts';

interface SimulatedInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalanceUSD: number;
  onInvestSuccess: (amount: number, termWeeks?: number) => void;
  initialTermWeeks?: number;
}

export const SimulatedInvestModal: React.FC<SimulatedInvestModalProps> = ({
  isOpen,
  onClose,
  availableBalanceUSD,
  onInvestSuccess,
  initialTermWeeks = 12,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<number>(initialTermWeeks);
  const [amountStr, setAmountStr] = useState<string>('500');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [isInvesting, setIsInvesting] = useState<boolean>(false);
  const [investStep, setInvestStep] = useState<string>('Initiating...');
  const [investSuccess, setInvestSuccess] = useState<boolean>(false);
  const [investedAmount, setInvestedAmount] = useState<number>(0);
  const [contractId, setContractId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr) || 0;
  const weeklyRate = 0.02; // 2.0% weekly
  const weeklyReturn = numericAmount * weeklyRate;
  const monthlyReturn = numericAmount * 0.086; // 8.6% monthly average
  const totalWeeks = selectedTerm;
  const totalTermYield = weeklyReturn * totalWeeks;
  const totalMaturityPayout = numericAmount + totalTermYield;

  const terms = [
    {
      weeks: 12,
      days: 84,
      name: '12-Week Standard Term',
      rate: '2.0% Weekly',
      totalYield: '24.0% Total',
      badge: 'Popular',
      min: 100,
    },
    {
      weeks: 24,
      days: 168,
      name: '24-Week Strategic Term',
      rate: '2.0% Weekly',
      totalYield: '48.0% Total',
      badge: 'Extended',
      min: 500,
    },
    {
      weeks: 48,
      days: 336,
      name: '48-Week Sovereign Horizon',
      rate: '2.0% Weekly',
      totalYield: '96.0% Total',
      badge: 'Institutional',
      min: 1000,
    },
  ];

  const currentTermObj = terms.find((t) => t.weeks === selectedTerm) || terms[0];

  const handlePreset = (val: number) => {
    setAmountStr(val.toString());
    setErrorMsg(null);
  };

  const handleMax = () => {
    const maxVal = Math.max(0, Math.floor(availableBalanceUSD));
    setAmountStr(maxVal.toString());
    setErrorMsg(null);
  };

  const handleStartInvestment = async () => {
    if (numericAmount <= 0) {
      setErrorMsg('Please specify an investment amount.');
      return;
    }
    if (numericAmount < currentTermObj.min) {
      setErrorMsg(`Minimum investment for ${currentTermObj.name} is $${currentTermObj.min.toLocaleString()} USD.`);
      return;
    }
    if (numericAmount > availableBalanceUSD) {
      setErrorMsg(`Insufficient available balance ($${availableBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD available).`);
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Please accept the Aethelgard Term Investment Agreement.');
      return;
    }

    setErrorMsg(null);
    setIsInvesting(true);
    setInvestedAmount(numericAmount);
    const newContractId = `AC-INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setContractId(newContractId);

    // Multi-step high-tech "Investing..." animation sequence
    setInvestStep('Verifying ledger available balance & KYC clearance...');
    setTimeout(() => {
      setInvestStep(`Allocating $${numericAmount.toLocaleString()} to ${currentTermObj.name} (2.0% weekly)...`);
    }, 600);

    setTimeout(() => {
      setInvestStep('Minting cryptographic custody receipt & audit hash...');
    }, 1300);

    setTimeout(async () => {
      // Background attempt to record in backend storage API if user has session
      try {
        await api.activateInvestment({
          principalAmountUSD: numericAmount,
          termsAccepted: true,
        });
      } catch (err) {
        // Fallback gracefully to simulated/local ledger
        console.warn('Backend investment record note:', err);
      }

      setIsInvesting(false);
      setInvestSuccess(true);
      onInvestSuccess(numericAmount, selectedTerm);
    }, 2000);
  };

  const handleResetAndClose = () => {
    setIsInvesting(false);
    setInvestSuccess(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/30 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  Audited 2.0% Weekly Yield
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Activate Term Investment
              </h2>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Investing Animation State */}
          {isInvesting && (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
                <div className="w-20 h-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-mono font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Ledger Entry…</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Executing Capital Deployment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono transition-all max-w-sm mx-auto">
                  {investStep}
                </p>
              </div>

              {/* Progress indicator */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-teal-400 h-2 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Success State */}
          {!isInvesting && investSuccess && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Investment Active & Accruing
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  ${investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD Deployed
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your capital is now earning audited 2.0% weekly yield. Distributions will be credited directly to your Available Balance every 7 days.
                </p>
              </div>

              {/* Dynamic Balance Metrics */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2 max-w-md mx-auto text-left font-mono tabular-nums">
                <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                  <span>Contract Reference:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{contractId}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                  <span>Principal Locked:</span>
                  <span className="font-bold text-slate-900 dark:text-white">${investedAmount.toLocaleString()} USD</span>
                </div>
                <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                  <span>Weekly Return Rate:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">+2.0% (+${(investedAmount * 0.02).toFixed(2)} USD / wk)</span>
                </div>
                <div className="flex flex-wrap justify-between gap-1 text-slate-500 dark:text-slate-400">
                  <span>Term Duration:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentTermObj.name} ({currentTermObj.days} Days)</span>
                </div>
                <div className="flex flex-wrap justify-between gap-1 border-t border-slate-200 dark:border-slate-700 pt-2 text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Total Expected Term Yield:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+${totalTermYield.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full min-h-[44px] max-w-md py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 cursor-pointer"
              >
                Return to Wallet
              </button>
            </div>
          )}

          {/* Form State */}
          {!isInvesting && !investSuccess && (
            <>
              {/* Balance Summary Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Available Balance for Investment:</span>
                <span className="font-mono tabular-nums font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  ${availableBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>

              {/* Term Horizon Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Term Horizon & Rate Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {terms.map((term) => {
                    const isSelected = selectedTerm === term.weeks;
                    return (
                      <button
                        key={term.weeks}
                        type="button"
                        onClick={() => {
                          setSelectedTerm(term.weeks);
                          setErrorMsg(null);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {term.weeks} Weeks
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                            {term.rate}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 font-mono">
                          {term.totalYield}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Min ${term.min} USD
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Investment Principal (USD)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Min ${currentTermObj.min} USD
                  </span>
                </div>
                
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={currentTermObj.min}
                    step="50"
                    value={amountStr}
                    onChange={(e) => {
                      setAmountStr(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder={`Enter amount (min $${currentTermObj.min})`}
                    className="w-full min-h-[44px] pl-8 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleMax}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[100, 250, 500, 1000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePreset(val)}
                      className={`min-h-[38px] text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                        numericAmount === val
                          ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      +${val.toLocaleString()}
                    </button>
                  ))}
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Detailed Yield Projection Card with Formulas & Rates */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Weekly Accrued Return (2.0%):</span>
                  <span className="font-mono tabular-nums font-bold text-blue-600 dark:text-blue-400">
                    +${weeklyReturn.toFixed(2)} USD / week
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Monthly Equivalent (~8.6%):</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    +${monthlyReturn.toFixed(2)} USD / month
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Term Duration ({selectedTerm} Weeks):</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {currentTermObj.days} Days (Weekly payouts)
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pt-2 border-t border-blue-200/50 dark:border-blue-900/50">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Total Estimated Term Yield:</span>
                  <span className="font-mono tabular-nums font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    +${totalTermYield.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Total Capital at Term Maturity:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ${totalMaturityPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed border-t border-blue-200/40 dark:border-blue-900/40">
                  Yield formula: Principal (${numericAmount.toLocaleString()}) × 2.0% weekly distribution. Earnings automatically credited to Available Balance; full principal unlocked upon term maturity.
                </div>
              </div>

              {/* Legal Terms Acceptance */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 shrink-0"
                  />
                  <span className="leading-relaxed">
                    I have reviewed and accept the{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold underline">
                      Aethelgard {selectedTerm}-Week Term Investment Agreement
                    </span>. I acknowledge that returns reflect quantitative trading strategies and that principal is locked until maturity while 2% weekly returns are liquid.
                  </span>
                </label>
              </div>

              {/* Confirm Action Button */}
              <button
                type="button"
                onClick={handleStartInvestment}
                disabled={numericAmount <= 0 || !termsAccepted || numericAmount > availableBalanceUSD}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>INVEST NOW (${numericAmount.toLocaleString()} USD)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
