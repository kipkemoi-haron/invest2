import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, Calculator, ShieldCheck } from 'lucide-react';

interface OpportunitiesPageProps {
  onNavigate: (view: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ onNavigate }) => {
  const [selectedHorizon, setSelectedHorizon] = useState<number>(12);
  const [inputPrincipal, setInputPrincipal] = useState<number>(5000);

  const weeklyYield = inputPrincipal * 0.02;
  const totalWeeks = selectedHorizon;
  const totalEarnings = weeklyYield * totalWeeks;
  const totalReturn = inputPrincipal + totalEarnings;

  const tiers = [
    {
      name: '12-Week Standard Term',
      duration: '12 Weeks (84 Days)',
      weeklyRate: '2.0% Weekly',
      minDeposit: '$500 USD',
      target: 'Private & Corporate Treasuries',
      features: [
        'Weekly liquidity of accrued earnings',
        'Principal locked for 12 weeks',
        'Automatic 7-day distribution to Available Balance',
        'Supported currencies: BTC, ETH, USDT',
        'Audited double-entry ledger statement',
      ],
      recommended: true,
    },
    {
      name: '24-Week Strategic Term',
      duration: '24 Weeks (168 Days)',
      weeklyRate: '2.0% Weekly',
      minDeposit: '$5,000 USD',
      target: 'Family Offices & Institutional Desks',
      features: [
        'Weekly earnings distributions',
        'Extended algorithmic liquidity pool allocation',
        'Priority compliance review on withdrawals',
        'Dedicated institutional concierge manager',
        'Quarterly comprehensive CPA audit pack',
      ],
      recommended: false,
    },
    {
      name: '48-Week Sovereign Horizon',
      duration: '48 Weeks (336 Days)',
      weeklyRate: '2.0% Weekly',
      minDeposit: '$25,000 USD',
      target: 'Accredited Funds & High Net Worth',
      features: [
        'Maximum treasury allocation tier',
        'Institutional custody via dedicated MPC sub-wallets',
        'Bespoke reporting and tax ledger integration',
        'Direct consultation with Chief Investment Officer',
        'Tailored OTC multi-sig withdrawal scheduling',
      ],
      recommended: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 lg:py-16 selection:bg-teal-600/10 selection:text-teal-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
            Investment Horizons
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Institutional Digital Asset Opportunities.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Our investment model is anchored on an audited 2.0% weekly return on eligible invested capital. Capital is deployed into risk-neutral market-making and quantitative arbitrage corridors.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between relative ${
                tier.recommended
                  ? 'border-teal-500 bg-white shadow-xl shadow-teal-500/5 ring-1 ring-teal-500'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-teal-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
                  Most Selected
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{tier.target}</p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100">
                  <div className="text-xs text-teal-800 font-semibold">Approved Return Rate</div>
                  <div className="text-2xl font-extrabold text-teal-600 font-mono mt-0.5">
                    {tier.weeklyRate}
                  </div>
                  <div className="text-[11px] text-teal-700/80 mt-1 font-mono">{tier.duration}</div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Terms & Features:
                  </div>
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('sign-up')}
                  className={`w-full min-h-[44px] py-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    tier.recommended
                      ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span>Select {tier.name.split(' ')[0]} Term</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Scenario Simulator */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
              Interactive Modeling
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Scenario Return Simulator</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select term horizon and principal amount to model audited 2% weekly returns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">
                  Investment Principal: <span className="text-teal-600 font-mono font-bold">${inputPrincipal.toLocaleString()} USD</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={inputPrincipal}
                  onChange={(e) => setInputPrincipal(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                  <span>$500 Min</span>
                  <span className="hidden sm:inline">$25,000</span>
                  <span className="hidden sm:inline">$50,000</span>
                  <span>$100,000 Max</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">
                  Select Investment Horizon:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[12, 24, 48].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedHorizon(w)}
                      className={`min-h-[44px] py-2 px-3 text-xs font-mono font-semibold rounded-lg border transition-all ${
                        selectedHorizon === w
                          ? 'border-teal-600 bg-teal-50 text-teal-700 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {w} Weeks
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100">
                <div className="text-[11px] text-teal-800 font-semibold uppercase">Weekly Payout (2.0%)</div>
                <div className="text-2xl font-bold text-teal-600 font-mono mt-1">
                  ${weeklyYield.toFixed(2)}
                </div>
                <div className="text-[11px] text-teal-700/80 mt-1">Credited to Available Balance</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[11px] text-emerald-800 font-semibold uppercase">Total Term Earnings</div>
                <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                  ${totalEarnings.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-700/80 mt-1">Over {selectedHorizon} weekly distributions</div>
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-slate-600">Total Payout at Maturity (Principal + Earnings)</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">
                    ${totalReturn.toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclosure */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed shadow-xs">
          <p className="font-semibold text-slate-900 mb-1">Fiduciary Risk Notice:</p>
          <p>
            Past distributions do not guarantee future yields. All investment activations require executing the Aethelgard Investment Agreement in accordance with applicable regional compliance laws. Principal is held in segregated cold storage vaults.
          </p>
        </div>

      </div>
    </div>
  );
};
