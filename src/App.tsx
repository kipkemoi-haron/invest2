/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { AppDownloadBanner, InstallAppModal, OfflineIndicator } from './components/layout/PWAComponents.tsx';
import { HomePage } from './components/pages/HomePage.tsx';
import { HowItWorksPage } from './components/pages/HowItWorksPage.tsx';
import { FaqPage } from './components/pages/FaqPage.tsx';
import { LegalPage } from './components/pages/LegalPage.tsx';
import { AuthPages } from './components/pages/AuthPages.tsx';
import { MiningPage } from './components/pages/MiningPage.tsx';
import { ReferralsPage } from './components/pages/ReferralsPage.tsx';
import { OpportunitiesPage } from './components/pages/OpportunitiesPage.tsx';
import { ClientDashboard } from './components/dashboard/ClientDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import {
  getDefaultFintechState,
  getStoredFintechState,
  saveFintechState,
  type UserFintechState,
} from './lib/fintechData.ts';
import { api } from './lib/api.ts';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [fintechState, setFintechState] = useState<UserFintechState>(() => getStoredFintechState());
  const [cloudLoaded, setCloudLoaded] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setCloudLoaded(false);
    if (!user) {
      setFintechState(getDefaultFintechState());
      return;
    }
    api
      .getUserFintechStateFromCloud()
      .then((cloudState) => {
        if (!active) return;
        if (cloudState) {
          setFintechState((prev) => ({
            ...getDefaultFintechState(),
            ...prev,
            ...cloudState,
          }));
        }
        setCloudLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        if (active) setCloudLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    saveFintechState(fintechState);
  }, [fintechState]);

  useEffect(() => {
    if (
      !isLoading &&
      user &&
      (currentView === 'home' ||
        currentView === 'sign-in' ||
        currentView === 'sign-up' ||
        currentView === 'forgot-password')
    ) {
      setCurrentView(user.role === 'ADMIN' ? 'admin-dashboard' : 'client-dashboard');
    }
  }, [isLoading, user, currentView]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clientDashboardViews = [
    'client-dashboard',
    'tasks',
    'invest',
    'wallet',
    'history',
    'support',
    'settings',
  ];

  const isClientDashboardView = clientDashboardViews.includes(currentView);

  const isAuthOrProtectedView =
    currentView === 'sign-in' ||
    currentView === 'sign-up' ||
    currentView === 'forgot-password' ||
    isClientDashboardView ||
    currentView === 'admin-dashboard';

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <AppDownloadBanner />
      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 w-full min-w-0">
        {currentView === 'home' && !user && <HomePage onNavigate={handleNavigate} />}
        {currentView === 'how-it-works' && <HowItWorksPage onNavigate={handleNavigate} />}
        {currentView === 'opportunities' && <OpportunitiesPage onNavigate={handleNavigate} />}
        {currentView === 'faq' && <FaqPage onNavigate={handleNavigate} />}

        {/* Dedicated Mining & Referrals Pages */}
        {currentView === 'mining' && (
          <MiningPage
            fintechState={fintechState}
            onUpdateFintechState={setFintechState}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'referrals' && (
          <ReferralsPage
            fintechState={fintechState}
            onNavigate={handleNavigate}
          />
        )}

        {/* Loading gate while restoring persisted Firebase session */}
        {isLoading && isAuthOrProtectedView && (
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
              <span className="text-xs font-medium">Restoring session...</span>
            </div>
          </div>
        )}

        {/* Auth Pages */}
        {!isLoading && !user && currentView === 'sign-in' && (
          <AuthPages initialView="sign-in" onNavigate={handleNavigate} />
        )}
        {!isLoading && !user && currentView === 'sign-up' && (
          <AuthPages initialView="sign-up" onNavigate={handleNavigate} />
        )}
        {!isLoading && !user && currentView === 'forgot-password' && (
          <AuthPages initialView="forgot-password" onNavigate={handleNavigate} />
        )}

        {/* Legal Pages */}
        {currentView === 'legal-terms' && <LegalPage initialTab="terms" onNavigate={handleNavigate} />}
        {currentView === 'legal-privacy' && <LegalPage initialTab="privacy" onNavigate={handleNavigate} />}
        {currentView === 'legal-agreement' && <LegalPage initialTab="agreement" onNavigate={handleNavigate} />}
        {currentView === 'legal-risk' && <LegalPage initialTab="risk" onNavigate={handleNavigate} />}
        {currentView === 'legal-aml' && <LegalPage initialTab="aml" onNavigate={handleNavigate} />}
        {currentView === 'legal-withdrawal' && <LegalPage initialTab="withdrawal" onNavigate={handleNavigate} />}
        {currentView === 'legal-deposit' && <LegalPage initialTab="deposit" onNavigate={handleNavigate} />}
        {currentView === 'legal-cookies' && <LegalPage initialTab="cookies" onNavigate={handleNavigate} />}

        {/* Main Dashboard & Secondary Hamburger Views */}
        {!isLoading && isClientDashboardView && (
          user ? (
            <ClientDashboard
              initialTab={currentView === 'client-dashboard' ? 'dashboard' : currentView}
              fintechState={fintechState}
              onUpdateFintechState={setFintechState}
              cloudLoaded={cloudLoaded}
              onNavigate={handleNavigate}
            />
          ) : (
            <AuthPages initialView="sign-in" onNavigate={handleNavigate} />
          )
        )}

        {/* Admin Dashboard */}
        {!isLoading && currentView === 'admin-dashboard' && (
          user?.role === 'ADMIN' ? (
            <AdminDashboard onNavigate={handleNavigate} />
          ) : (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4 max-w-md shadow-md">
                <div className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
                  Access Restricted
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Administrative Clearance Required
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Please sign in with an authorized administrator account.
                </p>
                <button
                  onClick={() => handleNavigate('sign-in')}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 transition-colors shadow-sm"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          )
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
      <InstallAppModal />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PWAProvider>
          <MainApp />
        </PWAProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
