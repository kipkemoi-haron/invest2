import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.ts';
import type { CryptoWallet, CryptoCurrency, DepositRequest } from '../../types/index.ts';
import { X, Copy, Check, QrCode, AlertCircle, ShieldCheck, ArrowRight, Upload } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [wallets, setWallets] = useState<CryptoWallet[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('USDT');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [intendedAmountUSD, setIntendedAmountUSD] = useState<string>('1000');
  const [txHash, setTxHash] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDeposit, setSuccessDeposit] = useState<DepositRequest | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSuccessDeposit(null);
      setError(null);
      api.getWallets().then((res) => {
        setWallets(res.wallets);
        const first = res.wallets.find((w) => w.currency === 'USDT');
        if (first) setSelectedWalletId(first.id);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentWallet = wallets.find((w) => w.id === selectedWalletId) || wallets.find((w) => w.currency === selectedCurrency);

  const handleCurrencyChange = (curr: CryptoCurrency) => {
    setSelectedCurrency(curr);
    const match = wallets.find((w) => w.currency === curr);
    if (match) setSelectedWalletId(match.id);
  };

  const handleCopy = () => {
    if (currentWallet?.address) {
      navigator.clipboard.writeText(currentWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFakeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFileName(e.target.files[0].name);
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
        cryptoAmount: `${amount.toFixed(2)} USD Eq.`,
        txHash: txHash ? txHash.trim() : undefined,
        proofFileName: proofFileName || undefined,
      });
      setSuccessDeposit(res.deposit);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Deposit recording failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Fund Account via Cryptocurrency</h3>
            <p className="text-[11px] text-slate-500 font-medium">Official Institutional Company Deposit Vault</p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successDeposit ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Deposit Submission Recorded</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your deposit reference <span className="font-mono text-teal-700 font-bold">#{successDeposit.id}</span> of ${successDeposit.intendedAmountUSD.toLocaleString()} USD ({successDeposit.currency}) has been logged.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left font-mono space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-teal-700 font-bold">{successDeposit.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network:</span>
                <span className="font-semibold text-slate-900">{successDeposit.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Required Confirmations:</span>
                <span>{successDeposit.requiredConfirmations} Blocks</span>
              </div>
              {successDeposit.txHash && (
                <div className="flex justify-between truncate">
                  <span className="text-slate-500">Tx Hash:</span>
                  <span className="truncate max-w-[200px] text-teal-700">{successDeposit.txHash}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Note: Once required block confirmations are verified by our node probers, the funds will immediately appear in your Available Balance.
            </p>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                1. Select Cryptocurrency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['USDT', 'BTC', 'ETH'] as CryptoCurrency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCurrencyChange(c)}
                    className={`min-h-[44px] py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedCurrency === c
                        ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Sub-Selector if multiple exist */}
            {wallets.filter((w) => w.currency === selectedCurrency).length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supported Network Channel:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {wallets
                    .filter((w) => w.currency === selectedCurrency)
                    .map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWalletId(w.id)}
                        className={`min-h-[44px] p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                          selectedWalletId === w.id
                            ? 'border-teal-600 bg-teal-50 text-teal-700 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="truncate font-semibold">{w.network}</div>
                        <div className="text-[10px] text-slate-500">{w.requiredConfirmations} Conf. required</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Official Wallet Address Display */}
            {currentWallet && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="text-slate-600 font-medium">Official Company Deposit Address:</span>
                  <span className="text-[11px] font-mono text-teal-700 font-bold">
                    {currentWallet.network}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                  <span className="font-mono text-xs text-slate-900 break-all select-all font-semibold min-w-0">
                    {currentWallet.address}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold shrink-0 hover:bg-teal-700 shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY ADDRESS</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  {currentWallet.qrCodeNote} Minimum deposit: ${currentWallet.minDepositUSD} USD.
                </div>
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Intended Deposit Amount (USD Equivalent)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">$</span>
                <input
                  type="number"
                  min={currentWallet?.minDepositUSD || 100}
                  step="50"
                  required
                  value={intendedAmountUSD}
                  onChange={(e) => setIntendedAmountUSD(e.target.value)}
                  placeholder="1000"
                  className="w-full min-h-[44px] pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Transaction Hash */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Blockchain Transaction Hash / TxID
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="e.g. 0x8f3c7e912ab4... or btc txid"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base sm:text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                You may submit your TxID now or enter it from your deposits table once your transfer broadcasts.
              </p>
            </div>

            {/* Payment Evidence Upload Simulation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Optional Payment Evidence / Receipt Screenshot
              </label>
              <label className="min-h-[44px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-xs">
                <span className="text-slate-600 break-words">
                  {proofFileName || 'Upload transfer screenshot or receipt (PNG, JPG, PDF)'}
                </span>
                <span className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded font-medium flex items-center gap-1.5 shadow-xs shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFakeFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Submitting to Blockchain Prober...' : 'Submit Deposit Notification'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
