import React, { useState } from 'react';
import { api } from '../../lib/api.ts';
import type { ClientFinancialOverview, PlatformSettings } from '../../types/index.ts';
import { X, TrendingUp, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface InvestModalProps {
  overview: ClientFinancialOverview;
  settings: PlatformSettings;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvestModal: React.FC<InvestModalProps> = ({
  overview,
  settings,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('1000');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const weeklyRate = settings.weeklyReturnRate; // 0.02
  const weeklyEarnings = numericAmount * weeklyRate;
  const durationWeeks = settings.defaultTermDurationWeeks || 12;
  const totalTermEarnings = weeklyEarnings * durationWeeks;

  const hasSufficientBalance = overview.availableBalanceUSD >= numericAmount && numericAmount >= 100;

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount < 100) {
      setError('Minimum investment principal is $100.00 USD.');
      return;
    }

    if (numericAmount > overview.availableBalanceUSD) {
      setError(`Insufficient available balance ($${overview.availableBalanceUSD.toLocaleString()} USD available).`);
      return;
    }

    if (!termsAccepted) {
      setError('You must review and agree to the Aethelgard Investment Agreement.');
      return;
    }

    setLoading(true);
    try {
      await api.activateInvestment({
        principalAmountUSD: numericAmount,
        termsAccepted: true,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Investment activation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900">Activate Capital Investment</h3>
              <p className="text-[11px] text-slate-500 font-medium">Weekly 2.0% Term Yield Allocation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleInvest} className="space-y-4">
          {/* Balance Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">Your Available Balance:</span>
            <span className="font-mono font-bold text-emerald-700">
              ${overview.availableBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
            </span>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investment Principal (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">$</span>
              <input
                type="number"
                min="100"
                step="50"
                max={overview.availableBalanceUSD}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                className="w-full min-h-[44px] pl-8 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setAmount(overview.availableBalanceUSD.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10px] font-mono font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded transition-colors cursor-pointer"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>Min: $100.00</span>
              <span>Rate: {(weeklyRate * 100).toFixed(1)}% / week</span>
            </div>
          </div>

          {/* Projection Summary Box */}
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100 space-y-2 text-xs">
            <div className="flex flex-wrap justify-between gap-1">
              <span className="text-slate-600 font-medium">Weekly Accrued Yield:</span>
              <span className="text-teal-700 font-mono font-bold">
                +${weeklyEarnings.toFixed(2)} USD / week
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-1">
              <span className="text-slate-600 font-medium">Term Horizon:</span>
              <span className="text-slate-800 font-mono">{durationWeeks} Weeks (84 Days)</span>
            </div>
            <div className="flex flex-wrap justify-between gap-1 border-t border-teal-100 pt-2">
              <span className="text-slate-700 font-semibold">Estimated Total Term Yield:</span>
              <span className="text-emerald-700 font-mono font-bold">
                +${totalTermEarnings.toFixed(2)} USD
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 leading-relaxed">
              Formula: Principal (${numericAmount.toLocaleString()}) × 2.0% = ${weeklyEarnings.toFixed(2)} credited weekly to Available Balance. Full principal released at maturity.
            </div>
          </div>

          {/* Legal Acceptance */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-0 shrink-0"
              />
              <span className="leading-relaxed">
                I have reviewed and accept the{' '}
                <span className="text-teal-700 font-semibold">Aethelgard 12-Week Investment Agreement</span>. I acknowledge that returns reflect quantitative trading strategies and that principal is locked until term maturity.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !hasSufficientBalance || !termsAccepted}
              className="w-full min-h-[44px] py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                'Committing Ledger Entry...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>INVEST NOW (${numericAmount.toLocaleString()} USD)</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
