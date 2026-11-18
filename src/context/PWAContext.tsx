import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isIOSSafari: boolean;
  isOnline: boolean;
  showInstallModal: boolean;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  triggerInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function detectIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const hasTouch =
    (typeof document !== 'undefined' && 'ontouchend' in document) ||
    navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/.test(ua) || (ua.includes('mac') && hasTouch);
}

function detectIOSSafari(): boolean {
  if (!detectIOSDevice() || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const isOtherIOSBrowser = /(crios|fxios|edgios|opios|duckduckgo|gsa|fbav|fban|instagram|line)/.test(ua);
  return /safari/.test(ua) && !isOtherIOSBrowser;
}

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(() => detectIOSDevice());
  const [isIOSSafari, setIsIOSSafari] = useState<boolean>(() => detectIOSSafari());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  useEffect(() => {
    setIsInstalled(detectStandalone());
    setIsIOS(detectIOSDevice());
    setIsIOSSafari(detectIOSSafari());

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mediaQuery.addEventListener?.('change', handleDisplayChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener?.('change', handleDisplayChange);
    };
  }, []);

  const dismissBanner = useCallback(() => setIsBannerDismissed(true), []);
  const openInstallModal = useCallback(() => setShowInstallModal(true), []);
  const closeInstallModal = useCallback(() => setShowInstallModal(false), []);

  const triggerInstall = useCallback(async () => {
    if (isIOS) {
      setShowInstallModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowInstallModal(false);
          return;
        }
      } catch {
        // Fall through to manual install modal if prompt fails
      }
    }
    setShowInstallModal(true);
  }, [deferredPrompt, isIOS]);

  return (
    <PWAContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt),
        isInstalled,
        isIOS,
        isIOSSafari,
        isOnline,
        showInstallModal,
        isBannerDismissed,
        dismissBanner,
        openInstallModal,
        closeInstallModal,
        triggerInstall,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export function usePWA() {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error('usePWA must be used within a PWAProvider');
  return ctx;
}
