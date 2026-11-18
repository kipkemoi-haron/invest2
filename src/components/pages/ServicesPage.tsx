import React from 'react';
import { ArrowRight, Layers, Landmark, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';

interface ServicesPageProps {
  onNavigate: (view: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  const services = [
    {
      num: '01',
      title: 'Digital Asset Treasury Management',
      desc: 'Bespoke yield optimization for corporate balance sheets and private investment vehicles. Deploy cash reserves into algorithmic stablecoin and teal-chip crypto strategies with predictable 2% weekly returns.',
      features: ['Automated 7-day distribution cycles', 'Full accounting ledger statements', 'Principal preservation covenants'],
    },
    {
      num: '02',
      title: 'Quantitative Arbitrage & Market-Making',
      desc: 'High-frequency, market-neutral liquidity provision across centralized and decentralized venues. Captures inter-exchange pricing spreads and liquidity rebates with zero directional exposure to market downturns.',
      features: ['Risk-neutral execution algorithms', 'Sub-millisecond node connectivity', 'Dynamic collateral risk modeling'],
    },
    {
      num: '03',
      title: 'MPC Cold-Storage Fiduciary Custody',
      desc: 'Enterprise security infrastructure powered by multi-party computation (MPC) and air-gapped hardware security modules (HSM). Assets remain segregated and untouchable without quorum authorization.',
      features: ['FIPS 140-2 Level 3 HSM certified', 'Multi-sig geographic distribution', 'Comprehensive custody insurance policies'],
    },
    {
      num: '04',
      title: 'Institutional OTC Liquidity & Settlement',
      desc: 'High-volume block trading and immediate settlement for Bitcoin, Ethereum, and Tether with zero price slippage and direct banking integration.',
      features: ['Dedicated OTC concierge desk', 'Immediate T+0 settlement available', 'Custom compliance travel-rule audit files'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 lg:py-16 selection:bg-teal-600/10 selection:text-teal-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
            Enterprise Solutions
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Digital Asset Financial Services.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Tailored solutions bridging cryptographic networks with institutional risk controls, double-entry financial ledger accounting, and compliant custody.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((srv) => (
            <div key={srv.num} className="p-8 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-teal-300 transition-colors space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="font-mono text-xs font-bold text-teal-600">SERVICE {srv.num}</span>
                <span className="text-[11px] font-mono text-slate-400">Institutional Fiduciary Tier</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{srv.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{srv.desc}</p>
              
              <div className="space-y-2.5 pt-2">
                {srv.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => onNavigate('contact')}
                  className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  <span>Inquire Regarding Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Advisory Consultation */}
        <div className="p-6 sm:p-8 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-600 to-indigo-700 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-md shadow-teal-500/10">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-bold text-white">Need Bespoke Corporate Treasury Structuring?</h3>
            <p className="text-sm text-teal-100 leading-relaxed">
              Speak with our senior investment analysts to establish custom allocation limits, multi-signatory approval rules, and automated tax reporting.
            </p>
          </div>
          <button
            onClick={() => onNavigate('contact')}
            className="w-full md:w-auto min-h-[44px] px-6 py-3 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer text-center"
          >
            Contact Fiduciary Desk
          </button>
        </div>

      </div>
    </div>
  );
};
