import React from 'react';
import { Download } from 'lucide-react';
import { usePWA } from '../../context/PWAContext.tsx';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { isInstalled, isInstallable, triggerInstall } = usePWA();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Wordmark & Company details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Aethelgard
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
              Modern fintech earning ecosystem featuring verified application evaluations, agricultural telemetry surveys, and simulated AETHEL computational mining.
            </p>
            <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
              <p>Platform Protocol: v4.2-Live</p>
              <p>Valuation Index: 0.056 USDT / AETHEL</p>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
              Ecosystem
            </p>
            <ul className="space-y-0.5 sm:space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Tasks Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('mining')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  AETHEL Mining Simulator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('referrals')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Referral Network
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  FAQ &amp; Guidance
                </button>
              </li>
              {!isInstalled && (
                <li className="pt-1">
                  <button
                    onClick={triggerInstall}
                    className="min-h-[44px] inline-flex items-center gap-1.5 font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-500 transition-colors text-left cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isInstallable ? 'Install App' : 'Download App (PWA / APK)'}</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Task Categories */}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
              Task Categories
            </p>
            <ul className="space-y-0.5 sm:space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Rate Apps
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Business & Hotel Reviews
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Agriculture Surveys
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Remote Job Applications
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Daily Streak Bonus
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Governance (Requirement: Terms, Privacy, Risk Disclosure) */}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
              Legal & Disclosures
            </p>
            <ul className="space-y-0.5 sm:space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('legal-terms')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal-privacy')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal-risk')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Risk Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal-aml')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  AML & Compliance
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('legal-withdrawal')}
                  className="min-h-[44px] sm:min-h-0 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left"
                >
                  Withdrawal Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Aethelgard. All rights reserved. Simulated tasks & computational mining platform.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-teal-600 dark:text-teal-400 font-mono">Status: Operational</span>
            <span>·</span>
            <span>Zero-Tolerance Fraud Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
