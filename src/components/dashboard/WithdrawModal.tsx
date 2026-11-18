import React, { useState } from 'react';
import { api } from '../../lib/api.ts';
import type { ClientFinancialOverview, PlatformSettings, CryptoCurrency, WithdrawalRequest } from '../../types/index.ts';
import { X, ArrowRight, AlertCircle, ShieldCheck, Lock } from 'lucide-react';

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
  const effectiveAvailable = availableBalanceUSD ?? overview?.availableBalanceUSD ?? 1248.50;
  const minWithdrawal = settings?.minWithdrawalUSD ?? 50;
  const feePercentage = settings?.withdrawalFeePercentage ?? 0.01;

  const [currency, setCurrency] = useState<CryptoCurrency>('USDT');
  const [network, setNetwork] = useState<string>('Tron (USDT TRC-20)');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [amountUSD, setAmountUSD] = useState<string>('500');
  const [securityCode, setSecurityCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successWithdrawal, setSuccessWithdrawal] = useState<WithdrawalRequest | null>(null);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountUSD) || 0;
  const feeUSD = Math.round(numericAmount * feePercentage * 100) / 100;
  const netAmountUSD = Math.max(0, numericAmount - feeUSD);

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
      setError(`Amount exceeds Available Balance ($${effectiveAvailable.toLocaleString()} USD).`);
      return;
    }

    if (!destinationAddress || destinationAddress.trim().length < 24) {
      setError('Please provide a valid destination cryptocurrency wallet address.');
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
      setError(err.message || 'Withdrawal submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-5 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Request Capital Withdrawal</h3>
            <p className="text-[11px] text-slate-400">Direct Settlement to Your Personal Wallet</p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successWithdrawal ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Withdrawal Request Dispatched</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Withdrawal reference <span className="font-mono text-amber-400 font-bold">#{successWithdrawal.id}</span> of ${successWithdrawal.amountUSD.toLocaleString()} USD has been locked from available balance and placed in the compliance review queue.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-amber-400 font-bold">{successWithdrawal.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Net Transfer:</span>
                <span className="text-white font-bold">${successWithdrawal.netAmountUSD.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between truncate">
                <span className="text-slate-500">Destination:</span>
                <span className="truncate max-w-[200px]">{successWithdrawal.destinationAddress}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Available Balance Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Available Liquid Balance:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${effectiveAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
              </span>
            </div>

            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Settlement Cryptocurrency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['USDT', 'BTC', 'ETH'] as CryptoCurrency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCurrencyChange(c)}
                    className={`min-h-[44px] py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      currency === c
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Network */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {currency === 'USDT' && (
                  <>
                    <option value="Tron (USDT TRC-20)">Tron (USDT TRC-20) - Low Network Fee</option>
                    <option value="Ethereum (USDT ERC-20)">Ethereum (USDT ERC-20)</option>
                  </>
                )}
                {currency === 'BTC' && (
                  <option value="Bitcoin Mainnet (SegWit)">Bitcoin Mainnet (SegWit / Native)</option>
                )}
                {currency === 'ETH' && (
                  <option value="Ethereum (ERC-20)">Ethereum Mainnet (ETH)</option>
                )}
              </select>
            </div>

            {/* Destination Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Destination Wallet Address
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Enter your external wallet address"
                className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Withdrawal Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">$</span>
                <input
                  type="number"
                  min={minWithdrawal}
                  max={effectiveAvailable}
                  step="25"
                  required
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  placeholder="500"
                  className="w-full min-h-[44px] pl-8 pr-16 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setAmountUSD(effectiveAvailable.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 rounded transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Fee & Net Received */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex flex-wrap justify-between gap-1 text-slate-400">
                <span>Requested Amount:</span>
                <span>${numericAmount.toFixed(2)} USD</span>
              </div>
              <div className="flex flex-wrap justify-between gap-1 text-slate-400">
                <span>Network & Processing Fee (1.0%):</span>
                <span>-${feeUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex flex-wrap justify-between gap-1 text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Net Transfer Amount:</span>
                <span>${netAmountUSD.toFixed(2)} USD</span>
              </div>
            </div>

            {/* 2FA confirmation prompt */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Security Authorization Code (Optional / Demo)</span>
              </label>
              <input
                type="text"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                placeholder="Enter 6-digit authenticator code or leave blank"
                className="w-full min-h-[44px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isValidAmount}
                className="w-full min-h-[44px] py-3 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting Request...' : `Submit Withdrawal ($${numericAmount.toLocaleString()} USD)`}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
