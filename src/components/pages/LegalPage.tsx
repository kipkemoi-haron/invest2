import React, { useState } from 'react';
import { FileText, ShieldAlert, Scale, CheckCircle2, Lock, FileSpreadsheet } from 'lucide-react';

interface LegalPageProps {
  initialTab?: string;
  onNavigate: (view: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'terms', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'agreement', label: 'Investment Agreement (2% Term)' },
    { id: 'risk', label: 'Risk Disclosure' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'aml', label: 'AML & KYC Policy' },
    { id: 'withdrawal', label: 'Withdrawal Policy' },
    { id: 'deposit', label: 'Deposit Policy' },
    { id: 'cookies', label: 'Cookie Policy' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 lg:py-16 transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Regulatory & Compliance Framework
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Legal Documentation & Disclosures
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            All user accounts, micro-task evaluations, and digital asset custody operate in accordance with international digital asset transparency standards and anti-money laundering protocols.
          </p>
        </div>

        {/* Tab Strip */}
        <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 rounded-xl overflow-x-auto max-w-full">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Legal Content Card */}
        <div className="p-5 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-slate-700 dark:text-slate-300 leading-relaxed text-sm space-y-8">
          
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">General Terms and Conditions of Service</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Version 4.2 · Updated February 2026 · Entity #AC-8921-EU</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Scope of Agreement</h3>
                <p>
                  These Terms and Conditions govern the contractual relationship between Aethelgard Capital Management Ltd. ("the Company", "Platform") and any individual or corporate entity registering an account ("the Client", "User"). By creating an account, accessing the Client Portal, or funding any digital asset address, you acknowledge full legal capacity and assent to these terms.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Nature of the Service & Regulatory Status</h3>
                <p>
                  Aethelgard Capital Management Ltd. operates a proprietary algorithmic treasury management and digital asset custody software system. <strong className="text-slate-900 font-semibold">The Company is not a bank, not a depository credit institution, and does not hold banking licenses in the United States, United Kingdom, or Switzerland.</strong> Funds held in client accounts are digital assets and are not insured by the FDIC, FSCS, or FINMA statutory deposit guarantee funds.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">3. Account Eligibility & Customer IDs</h3>
                <p>
                  Every registered user is assigned a distinct customer identifier (e.g. CLT-XXXX). Clients must provide truthful, complete registration information and undergo customer due diligence. Account sharing, multiple accounts per individual, and third-party delegation without verified power of attorney are strictly prohibited.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">4. Financial Ledger Integrity</h3>
                <p>
                  Balances displayed on the Client Dashboard reflect real, audited entries in the platform's double-entry database ledger. In the event of network forks, blockchain reorganizations, or systemic consensus errors, ledger reconciliation records shall prevail.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'agreement' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Master Investment Agreement (2.0% Weekly Term Facility)</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Form AC-INV-2026 · Standard 12-Week Allocation Horizon</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Eligible Invested Principal Allocation</h3>
                <p>
                  Upon clicking "INVEST NOW" in the Client Portal, the Client instructs the Platform to lock a specified amount of verified Available Balance into the 12-Week Term Strategy. Locked principal is deployed into institutional liquidity pools, quantitative arbitrage nodes, and collateralized lending operations.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Yield Calculation Formula</h3>
                <p>
                  Earnings accrue on an auditable 7-day calendar basis using the exact formula:
                </p>
                <div className="p-4 rounded-xl bg-teal-50/70 font-mono text-sm font-semibold text-teal-900 border border-teal-200">
                  Weekly Yield = Eligible Invested Principal × 0.02 (2.00%)
                </div>
                <p>
                  Weekly distributions are credited automatically to the Client's Available Balance and may be withdrawn or held as liquid reserves. Principal remains locked until the agreed maturity date.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">3. Non-Guaranteed Return Acknowledgment</h3>
                <p>
                  The Client explicitly understands and accepts that past weekly yields of 2.0% are derived from algorithmic trading models and do not constitute sovereign, statutory, or unconditional debt guarantees. Returns remain dependent on platform risk limits and continuous liquidity conditions.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">4. Maturity and Principal Return</h3>
                <p>
                  Upon completion of the 12-week (84-day) term duration, 100% of the invested principal is released from the active investment ledger directly into the Client's Available Balance, free of lockups or penalties.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Comprehensive Risk Disclosure Notice</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Mandatory Disclosure for Digital Asset Participants</p>
              </div>

              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm leading-relaxed">
                  <strong className="font-bold">WARNING:</strong> Digital asset investments involve substantial risk of loss. You should not commit capital that you cannot afford to lose entirely.
                </div>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Market Volatility</h3>
                <p>
                  Cryptocurrencies, including Bitcoin (BTC) and Ethereum (ETH), experience sharp price swings within short intervals. Even USD-pegged stablecoins (such as USDT) bear smart-contract, depeg, and issuer solvency risks.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Blockchain and Smart Contract Execution</h3>
                <p>
                  Transactions on distributed ledgers are irreversible. Submitting an incorrect destination wallet address or selecting an incompatible blockchain network may cause permanent loss of funds.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">3. Regulatory Uncertainty</h3>
                <p>
                  The legal and tax classification of digital asset earnings varies widely by jurisdiction. The Client remains solely responsible for reporting all earnings and paying applicable capital gains or income taxes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Privacy and Data Protection Policy</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Compliant with Swiss FADP & EU GDPR Directives</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Data Collected</h3>
                <p>
                  We collect identification data (full name, email, telephone number, country of residence), session logs, IP addresses, blockchain transaction hashes, and customer support correspondence strictly for compliance and service delivery.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Data Retention & Fiduciary Secrecy</h3>
                <p>
                  Client financial transaction records and ledger logs are permanently retained in secured databases to ensure complete auditability. We do not sell, rent, or trade client personal or financial information to advertising networks.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'aml' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Anti-Money Laundering (AML) & Know Your Customer (KYC) Policy</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">FATF Recommendations & International Sanctions Screening</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Customer Due Diligence (CDD)</h3>
                <p>
                  In accordance with Financial Action Task Force (FATF) standards, Aethelgard Capital screens all clients against global sanctions lists (OFAC, UN, EU, SECO) and Politically Exposed Persons (PEP) registries.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Suspicious Activity Reporting</h3>
                <p>
                  Transactions exhibiting indicators of money laundering, terrorist financing, mixing service origin, or stolen cryptocurrency will be suspended immediately and referred to relevant financial intelligence authorities.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'withdrawal' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Withdrawal and Settlement Policy</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Liquidity Schedules & Security Authorization</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Available Balance Withdrawals</h3>
                <p>
                  Clients may request withdrawals from their Available Balance at any time. The system prevents requests exceeding the Available Balance. A standard 1.0% processing fee is deducted from the gross withdrawal amount to offset on-chain network miner fees.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Administrative Authorization & Broadcast</h3>
                <p>
                  To protect client funds against unauthorized account takeover, withdrawals undergo compliance review before broadcast. Once processed, the exact blockchain transaction reference is recorded in the client's financial ledger.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Deposit & Custody Policy</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Consensus Verification & Supported Cryptocurrencies</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Verification Standard</h3>
                <p>
                  No client account will ever be credited merely on the basis of a screenshot or unconfirmed transaction identifier. Every deposit must achieve required on-chain block confirmations before crediting.
                </p>

                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">2. Admin-Managed Wallets</h3>
                <p>
                  Official deposit addresses are maintained and verified by authorized compliance administrators. Clients must ensure that only the exact supported asset and network (e.g., USDT on ERC-20 or TRC-20) is transferred.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Cookie and Session Storage Policy</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Strict Functional Session Tokens Only</p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">1. Functional Storage</h3>
                <p>
                  The platform utilizes strictly functional local storage tokens and session parameters to authenticate user identity, prevent cross-site request forgery, and remember theme preferences. We do not use third-party behavioral tracking cookies.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
