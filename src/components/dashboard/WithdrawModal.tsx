import React, { useState } from 'react';
import { api } from '../../lib/api.ts';
import type { ClientFinancialOverview, PlatformSettings, CryptoCurrency, WithdrawalRequest } from '../../types/index.ts';
import { X, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WithdrawModalProps {
  overview?: Partial<ClientFinancialOverview>;
  settings?: Partial<PlatformSettings>;
  availableBalanceUSD?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  overview,
  settings,
  availableBalanceUSD,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const effectiveAvailable = availableBalanceUSD ?? overview?.availableBalanceUSD ?? 0;
  const minWithdrawal = settings?.minWithdrawalUSD ?? 50;

  const [currency, setCurrency] = useState<CryptoCurrency>('USDT');
  const [network, setNetwork] = useState<string>('Tron (USDT TRC-20)');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successWithdrawal, setSuccessWithdrawal] = useState<WithdrawalRequest | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountUSD) || 0;
  const isValidAmount =
    numericAmount >= minWithdrawal &&
    numericAmount <= effectiveAvailable;

  const handleCurrencyChange = (c: CryptoCurrency) => {
    setCurrency(c);
    if (c === 'USDT') setNetwork('Tron (USDT TRC-20)');
    if (c === 'BTC') setNetwork('Bitcoin Mainnet (SegWit)');
    if (c === 'ETH') setNetwork('Ethereum (ERC-20)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numericAmount < minWithdrawal) {
      setError(`Minimum withdrawal is $${minWithdrawal} USD.`);
      return;
    }

    if (numericAmount > effectiveAvailable) {
      setError(`Amount exceeds available balance ($${effectiveAvailable.toLocaleString()} USD).`);
      return;
    }

    if (!destinationAddress || destinationAddress.trim().length < 24) {
      setError('Please enter a valid wallet address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitWithdrawal({
        currency,
        network,
        destinationAddress: destinationAddress.trim(),
        amountUSD: numericAmount,
      });
      setSuccessWithdrawal(res.withdrawal);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-5 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Withdraw</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close withdraw modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successWithdrawal ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal Submitted</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ${successWithdrawal.amountUSD.toLocaleString()} USD ({successWithdrawal.currency}) to{' '}
              <span className="font-mono break-all">{successWithdrawal.destinationAddress}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Available Balance</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${effectiveAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>

            {/* Crypto Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Crypto Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['USDT', 'BTC', 'ETH'] as CryptoCurrency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCurrencyChange(c)}
                    className={`min-h-[44px] py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      currency === c
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-teal-500/60'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Choice for USDT */}
            {currency === 'USDT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Tron (USDT TRC-20)', 'Ethereum (USDT ERC-20)'].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setNetwork(net)}
                      className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        network === net
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {net.includes('TRC-20') ? 'TRC-20' : 'ERC-20'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Wallet Address
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Insert your wallet address"
                className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">$</span>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={effectiveAvailable}
                  step="10"
                  required
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  placeholder={`Min $${minWithdrawal}`}
                  className="w-full min-h-[44px] pl-8 pr-16 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setAmountUSD(effectiveAvailable.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !isValidAmount}
                className="w-full min-h-[44px] py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Processing...' : 'Withdraw'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
