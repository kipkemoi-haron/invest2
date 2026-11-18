import React, { useState } from 'react';
import { Search, ChevronDown, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

interface FaqPageProps {
  onNavigate: (view: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const categories = [
    { id: 'all', label: 'All Inquiries' },
    { id: 'tasks', label: 'Tasks & Rewards' },
    { id: 'mining', label: 'AETHEL Mining' },
    { id: 'referrals', label: 'Referral Tiers' },
    { id: 'withdrawals', label: 'Withdrawals & Balances' },
  ];

  const allFaqs = [
    {
      cat: 'tasks',
      q: 'How are task rewards calculated and credited?',
      a: 'Each task card in the marketplace displays its explicit payout in both USDT and AETHEL tokens (e.g. +$4.50 USDT & +80 AETHEL). Upon completing the interactive verification flow and submitting, the rewards are automatically verified and credited directly to your Sample Balance.',
    },
    {
      cat: 'tasks',
      q: 'What types of tasks are available on the platform?',
      a: 'We feature 5 primary categories: Rate Apps (evaluating mobile wallets and exchanges), Business & Hotel Recommendations (workstations and fiber WiFi audits), Agriculture Surveys (drone NDVI and soil sensor telemetry), Remote Job Applications (scoring applicant portfolios), and Daily Check-ins (claiming consecutive streak rewards).',
    },
    {
      cat: 'mining',
      q: 'How does AETHEL Mining work and what is the token valuation?',
      a: 'The AETHEL Mining simulator simulates a distributed computational proof-of-stake node. The token valuation index is pegged at 0.056 USDT per AETHEL. Your simulated miner generates fractional tokens in real-time as long as the engine is active.',
    },
    {
      cat: 'mining',
      q: 'Why does mining stop every 24 hours?',
      a: 'Mining cycles are strictly capped at 24 hours (86,400 seconds) to ensure active participant validation and avoid idle unattended computational drain. When the 24-hour cycle expires, click "Claim Cycle Earnings & Restart 24H Session" to continue.',
    },
    {
      cat: 'referrals',
      q: 'How do referral tiers increase daily mining caps?',
      a: 'Every user starts at Tier 0 with a 5.00 USDT daily mining cap. By inviting friends with your referral link, you progress to Bronze (25 USDT), Silver (100 USDT), Gold (250 USDT), and Platinum (up to 500 USDT/day) along with peer commission bonuses up to 18%.',
    },
    {
      cat: 'withdrawals',
      q: 'How do I withdraw my earnings?',
      a: 'Click the "Withdraw" button on your dashboard, choose your cryptocurrency (USDT ERC-20/TRC-20, BTC, or ETH), provide your destination wallet address, and specify the amount. Standard processing takes 12–24 hours.',
    },
    {
      cat: 'withdrawals',
      q: 'What does the secondary "Invest" button on the dashboard do?',
      a: 'The secondary "Invest" button allows you to commit a portion of your sample balance into institutional 2.0% weekly yield contracts. Clicking it launches the simulated panel with an "Investing…" animation and dynamically updates your balance.',
    },
  ];

  const filteredFaqs = allFaqs.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.cat === selectedCategory;
    const matchesSearch =
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.a.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            Helpdesk & Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to know about evaluating tasks, simulated AETHEL mining, referral bonus caps, and balance management.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-4 py-3 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 rounded-lg font-semibold transition-colors ${
                selectedCategory === c.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-3 pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No matching questions found for "{searchTerm}".
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full min-h-[44px] p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
