import React from 'react';
import { Shield, Award, Users, Landmark, Scale, CheckCircle2 } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 lg:py-16 selection:bg-teal-600/10 selection:text-teal-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Page Header */}
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
            About Aethelgard Capital
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Institutional Digital Asset Wealth Management.
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Founded in Geneva with regional desks in London and Singapore, Aethelgard Capital delivers disciplined, algorithmic yield strategies and fiduciary cold-storage solutions to corporate treasuries, family offices, and accredited private investors.
          </p>
        </div>

        {/* Corporate Visual & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white">
              <img
                src="/src/assets/images/corporate_leadership_1793984578343.jpg"
                alt="Aethelgard Capital Executive Boardroom"
                className="w-full h-80 sm:h-96 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Fiduciary Responsibility in the Digital Asset Era
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We bridge traditional financial stewardship with the speed and programmability of blockchain technology. Rather than relying on speculative retail speculation or opaque lending rehypothecation, we operate a mathematically auditable digital asset treasury.
            </p>
            <div className="space-y-3 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Legally registered entity (#AC-8921-EU) with audited internal controls</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Double-entry ledger ensuring 100% balance reconciliation at all times</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-party computation (MPC) cold custody across banking vaults</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Institutional Pillars */}
        <div className="space-y-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
              Foundational Values
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Our Operating Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <Scale className="w-6 h-6 text-teal-600" />
              <h4 className="text-base font-semibold text-slate-900">Auditable Ledger Integrity</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every credit, debit, investment allocation, and weekly return is recorded in an immutable financial ledger with unique transaction references. We never display fictitious frontend profits.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <Shield className="w-6 h-6 text-emerald-600" />
              <h4 className="text-base font-semibold text-slate-900">No-Compromise Custody</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Digital assets under custody are segregated from operational expenses. Over 99.8% of assets reside in air-gapped cold storage with hardware security modules and multi-signature authorization.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <Landmark className="w-6 h-6 text-cyan-600" />
              <h4 className="text-base font-semibold text-slate-900">Regulatory Transparency</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We adhere to strict AML and KYC compliance protocols, FATF Travel Rule guidelines, and clear legal disclosure regarding the nature of digital asset yields.
              </p>
            </div>
          </div>
        </div>

        {/* Leadership & Executive Board */}
        <div className="space-y-8 border-t border-slate-200 pt-16">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">
              Executive Committee
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Leadership & Oversight</h2>
            <p className="text-slate-600 text-sm mt-2">
              Seasoned professionals spanning quantitative finance, risk engineering, and compliance law.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="text-base font-bold text-slate-900">Marcus Vance, CFA</div>
              <div className="text-xs font-mono text-teal-600 font-semibold">Chief Investment Officer (CIO)</div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                Former Head of Quantitative Trading at Credit Suisse Asset Management. 19 years specializing in volatility arbitrage and institutional fixed-income liquidity.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="text-base font-bold text-slate-900">Dr. Aris Thorne</div>
              <div className="text-xs font-mono text-teal-600 font-semibold">Chief Risk Officer (CRO)</div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                Ph.D. in Computational Mathematics from ETH Zurich. Specialist in high-frequency cryptographic verification, algorithmic hedging, and liquidity stress-testing.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="text-base font-bold text-slate-900">Victoria Lindholm, LL.M.</div>
              <div className="text-xs font-mono text-teal-600 font-semibold">Head of Legal & Regulatory Compliance</div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2">
                Specialist in European digital asset regulations (MiCA), cross-border securities law, and anti-money laundering frameworks.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-teal-50 to-indigo-50 text-center space-y-4 shadow-xs">
          <h3 className="text-2xl font-bold text-slate-900">Partner with Aethelgard Capital</h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Experience an institutional digital asset wealth platform designed for investors who prioritize verifiable accounting and capital protection.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('sign-up')}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
            >
              Open an Account Today
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
