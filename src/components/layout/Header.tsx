import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { usePWA } from '../../context/PWAContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  ArrowRight,
  Zap,
  CheckSquare,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Download,
  Smartphone,
  Wallet,
  History,
  LifeBuoy,
  Settings,
  Users,
  Sun,
  Moon,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const { isInstalled, triggerInstall } = usePWA();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = (view: string) => {
    onNavigate(view);
    setMenuOpen(false);
  };

  const homeTarget = user
    ? user.role === 'ADMIN'
      ? 'admin-dashboard'
      : 'client-dashboard'
    : 'home';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand logo with single word Aethelgard */}
        <button
          onClick={() => handleLinkClick(homeTarget)}
          className="text-left font-bold tracking-tight text-slate-900 dark:text-white text-lg sm:text-xl whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
            A
          </div>
          <span>Aethelgard</span>
        </button>

        {/* Right: Hamburger Menu Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Drawer / Dropdown Menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-1.5">
            {user && (
              <div className="px-3.5 py-2.5 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.fullName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold shrink-0">
                  {user.role === 'ADMIN' ? 'ADMIN' : 'PRO'}
                </span>
              </div>
            )}

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Menu Navigation
            </div>

            <button
              onClick={() => handleLinkClick('client-dashboard')}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                currentView === 'client-dashboard'
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-teal-500" />
                <span>Dashboard</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => handleLinkClick('wallet')}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                currentView === 'wallet' || currentView === 'invest'
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-500" />
                <span>Wallet</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Balance · My Investments</span>
            </button>

            <button
              onClick={() => handleLinkClick('tasks')}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                currentView === 'tasks'
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-500" />
                <span>Tasks</span>
              </span>
              <span className="text-[10px] font-mono bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded">
                Earn
              </span>
            </button>

            <button
              onClick={() => handleLinkClick('mining')}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                currentView === 'mining'
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-500" />
                <span>Mining</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            </button>

            <button
              onClick={() => handleLinkClick('referrals')}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                currentView === 'referrals'
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-500" />
                <span>Referrals</span>
              </span>
              <span className="text-[10px] font-mono text-teal-600 font-bold">18% Comm.</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => handleLinkClick('history')}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    currentView === 'history'
                      ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <span>History</span>
                  </span>
                </button>

                <button
                  onClick={() => handleLinkClick('support')}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    currentView === 'support'
                      ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-slate-400" />
                    <span>Support</span>
                  </span>
                </button>

                <button
                  onClick={() => handleLinkClick('settings')}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    currentView === 'settings'
                      ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </span>
                </button>
              </>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <button
                onClick={() => handleLinkClick('how-it-works')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'how-it-works'
                    ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>How It Works</span>
              </button>

              <button
                onClick={() => handleLinkClick('faq')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  currentView === 'faq'
                    ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>FAQ</span>
              </button>

              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => handleLinkClick('admin-dashboard')}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                    currentView === 'admin-dashboard'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Admin Portal</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    triggerInstall();
                  }}
                  className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-950 transition-all text-left cursor-pointer border border-teal-200/70 dark:border-teal-800/60"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Download App</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                    <Download className="w-3.5 h-3.5" />
                    <span>Mobile App</span>
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-500" />
                  )}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400">{theme}</span>
              </button>

              {user ? (
                <button
                  onClick={async () => {
                    await logout();
                    handleLinkClick('home');
                  }}
                  className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-left cursor-pointer"
                >
                  <span>Sign Out</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <button
                    onClick={() => handleLinkClick('sign-in')}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleLinkClick('sign-up')}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold text-center cursor-pointer"
                  >
                    Start Earning
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
