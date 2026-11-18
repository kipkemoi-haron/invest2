import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  WifiOff,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import { usePWA } from '../../context/PWAContext.tsx';

export const AppDownloadBanner: React.FC = () => {
  const { isInstalled, isBannerDismissed, dismissBanner, triggerInstall } = usePWA();

  if (isInstalled || isBannerDismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Mobile app download notice"
      className="w-full bg-slate-900 dark:bg-slate-900 border-b border-slate-800 text-white"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <img
            src="/pwa-192x192.png"
            alt="Aethelgard App Icon"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover shrink-0 ring-1 ring-white/15 bg-slate-800"
          />
          <p className="text-xs sm:text-[13px] font-medium text-slate-100 leading-snug">
            Get the mobile app for faster access and real-time notifications
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={triggerInstall}
            className="min-h-[44px] sm:min-h-[36px] px-3 sm:px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-xs whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Download App</span>
          </button>

          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss app download banner"
            className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:right-auto max-w-[calc(100vw-2rem)] z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Cached resources active</span>
    </div>
  );
};

export const InstallAppModal: React.FC = () => {
  const {
    showInstallModal,
    closeInstallModal,
    isInstallable,
    isIOS,
    isIOSSafari,
    triggerInstall,
  } = usePWA();
  const [apkAvailable, setApkAvailable] = useState<boolean | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!showInstallModal || isIOS) return;
    let active = true;
    fetch('/app.apk', { method: 'HEAD' })
      .then((res) => {
        if (!active) return;
        const ct = res.headers.get('content-type') || '';
        setApkAvailable(res.ok && !ct.includes('text/html'));
      })
      .catch(() => {
        if (active) setApkAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [showInstallModal, isIOS]);

  if (!showInstallModal) return null;

  const handleCopyUrl = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in"
      onClick={closeInstallModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/apple-touch-icon.png"
              alt="Aethelgard App Icon"
              className="w-11 h-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <div className="min-w-0">
              <h3
                id="install-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {isIOS ? 'Install on iPhone / iPad' : 'Install Aethelgard App'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save to your Home Screen as a standalone app
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeInstallModal}
            aria-label="Close install instructions"
            className="min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* One-Tap Native Prompt on supported browsers */}
        {!isIOS && isInstallable && (
          <button
            type="button"
            onClick={triggerInstall}
            className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install Directly to Home Screen</span>
          </button>
        )}

        {/* Non-Safari iOS Browser Notice */}
        {isIOS && !isIOSSafari && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 p-3.5 space-y-2.5">
            <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                Open this page in <strong>Safari</strong> to add Aethelgard to your iPhone Home Screen.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{linkCopied ? 'Link Copied for Safari' : 'Copy Link to Open in Safari'}</span>
            </button>
          </div>
        )}

        {/* iOS Safari Step-by-Step Instructions */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              iPhone &amp; iPad (Safari)
            </span>
            {isIOS && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {isIOSSafari ? 'Safari Detected' : 'iOS Device'}
              </span>
            )}
          </div>

          <ol className="text-xs text-slate-700 dark:text-slate-200 space-y-3">
            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white">
                  1. Tap the Share button in Safari
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Located in Safari&apos;s bottom toolbar on iPhone (or top-right on iPad).
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-900 dark:text-white">
                  2. Scroll down and select &apos;Add to Home Screen&apos;
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Then tap <strong>Add</strong> in the top-right corner to launch full-screen.
                </p>
              </div>
            </li>
          </ol>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Opens as a full-screen standalone app directly from your Home Screen.</span>
          </div>
        </div>

        {/* Android / Desktop Instructions (Hidden on iOS for a clean iPhone experience) */}
        {!isIOS && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Android (Chrome)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In Chrome, tap the menu (<strong>⋮</strong>) and choose <strong>Install app</strong> or{' '}
              <strong>Add to Home screen</strong>.
            </p>

            {apkAvailable && (
              <a
                href="/app.apk"
                download="Aethelgard.apk"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK (app.apk)</span>
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={closeInstallModal}
          className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
