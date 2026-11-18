import React, { useState } from 'react';
import {
  X,
  Landmark,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { BORROW_MONTHLY_INTEREST_RATE } from '../../lib/fintechData.ts';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueTransacting?: () => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  onClose,
  onContinueTransacting,
}) => {
  const [amountStr, setAmountStr] = useState<string>('500');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr) || 0;
  const monthlyInterest = numericAmount * BORROW_MONTHLY_INTEREST_RATE;
  const totalOneMonth = numericAmount + monthlyInterest;

  const handleClose = () => {
    setErrorMsg(null);
    setSubmittedNotice(false);
    onClose();
  };

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount to borrow.');
      return;
    }
    setErrorMsg(null);
    setSubmittedNotice(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900 inline-flex items-center gap-1">
                <Percent className="w-3 h-3" />
                <span>1.5% Monthly Interest</span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5">
                Borrow Funds
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close borrow modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {submittedNotice ? (
            <div className="py-4 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-8 ring-amber-500/10">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Transaction Activity Required
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Continue transacting so that you can borrow
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your credit request for{' '}
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>{' '}
                  at <span className="font-mono font-bold">1.5% monthly interest</span> requires more completed deposit, investment, and wallet transaction history to unlock borrowing.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2 text-left">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Requested Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Interest Rate:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">1.5% / month</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Interest Charge:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    +${monthlyInterest.toFixed(2)} USDT / mo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSubmittedNotice(false)}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Change Amount
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onContinueTransacting?.();
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue Transacting</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBorrowSubmit} className="space-y-5">
              {/* Rate highlight */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Borrowing Interest Rate
                </span>
                <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                  1.5% Monthly
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Amount to Borrow (USD / USDT)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amountStr}
                    onChange={(e) => {
                      setAmountStr(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Insert amount you want to borrow"
                    className="w-full min-h-[44px] pl-8 pr-16 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-slate-400">
                    USDT
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[100, 500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setAmountStr(val.toString());
                        setErrorMsg(null);
                      }}
                      className={`min-h-[38px] text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                        numericAmount === val
                          ? 'bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      ${val.toLocaleString()}
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

              {/* Interest Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Borrow Principal:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Interest (1.5%):</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    +${monthlyInterest.toFixed(2)} USDT / month
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-200">1-Month Repayment Total:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ${totalOneMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={numericAmount <= 0}
                className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>BORROW NOW</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
