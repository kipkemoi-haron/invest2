import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { CryptoWallet, CryptoCurrency, DepositRequest } from '../../types/index.ts';
import { X, Copy, Check, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CRYPTO_OPTIONS: { currency: CryptoCurrency; label: string }[] = [
  { currency: 'USDT', label: 'Tether (USDT)' },
  { currency: 'BTC', label: 'Bitcoin (BTC)' },
  { currency: 'ETH', label: 'Ethereum (ETH)' },
];

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [intendedAmountUSD, setIntendedAmountUSD] = useState<string>('1000');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDeposit, setSuccessDeposit] = useState<DepositRequest | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(null);
      setSelectedWalletId('');
      setSuccessDeposit(null);
      setError(null);
      setCopied(false);
      api
        .getWallets()
        .then((res) => {
          setWallets(res.wallets);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const matchingWallets = selectedCurrency
    ? wallets.filter((w) => w.currency === selectedCurrency)
    : [];

  const currentWallet = selectedCurrency
    ? matchingWallets.find((w) => w.id === selectedWalletId) || matchingWallets[0]
    : undefined;

  const handleSelectCrypto = (curr: CryptoCurrency) => {
    setSelectedCurrency(curr);
    setError(null);
    setCopied(false);
    const match = wallets.find((w) => w.currency === curr);
    setSelectedWalletId(match ? match.id : '');
  };

  const handleCopy = () => {
    if (currentWallet?.address) {
      navigator.clipboard.writeText(currentWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWallet) return;
    setError(null);

    const amount = parseFloat(intendedAmountUSD);
    if (!amount || amount < currentWallet.minDepositUSD) {
      setError(`Minimum deposit is $${currentWallet.minDepositUSD} USD.`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitDeposit({
        currency: currentWallet.currency,
        network: currentWallet.network,
        walletAddress: currentWallet.address,
        intendedAmountUSD: amount,
        cryptoAmount: `${amount.toFixed(2)} USD`,
      });
      setSuccessDeposit(res.deposit);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Deposit</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close deposit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successDeposit ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Deposit Logged</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ${successDeposit.intendedAmountUSD.toLocaleString()} USD ({successDeposit.currency}) — {successDeposit.network}
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Crypto Types */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Crypto Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CRYPTO_OPTIONS.map((opt) => {
                  const isSelected = selectedCurrency === opt.currency;
                  return (
                    <button
                      key={opt.currency}
                      type="button"
                      onClick={() => handleSelectCrypto(opt.currency)}
                      className={`min-h-[44px] px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:border-teal-500/60'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="font-mono text-[11px]">
                        {isSelected ? 'Selected' : 'Get Wallet →'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Network switcher if multiple wallets exist for selected crypto */}
            {selectedCurrency && matchingWallets.length > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {matchingWallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSelectedWalletId(w.id);
                        setCopied(false);
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer truncate ${
                        currentWallet?.id === w.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {w.network}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Revealed Deposit Wallet Address + Deposit Action */}
            {currentWallet && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {currentWallet.currency} Deposit Wallet
                    </span>
                    <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      {currentWallet.network}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <span className="font-mono text-xs text-slate-900 dark:text-slate-100 break-all select-all font-semibold min-w-0">
                      {currentWallet.address}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      min={currentWallet.minDepositUSD || 100}
                      step="10"
                      required
                      value={intendedAmountUSD}
                      onChange={(e) => setIntendedAmountUSD(e.target.value)}
                      placeholder="1000"
                      className="w-full min-h-[44px] pl-8 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Submitting...' : 'Confirm Deposit'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
