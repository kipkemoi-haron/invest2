import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({immediate: true});
}

if (typeof document !== 'undefined') {
  const preventGesture = (e: Event) => {
    e.preventDefault();
  };

  document.addEventListener('gesturestart', preventGesture, {passive: false});
  document.addEventListener('gesturechange', preventGesture, {passive: false});
  document.addEventListener('gestureend', preventGesture, {passive: false});

  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    {passive: false}
  );

  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300 && e.touches.length === 0) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          !target.closest('button, a, label, [role="button"], input, textarea, select')
        ) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    {passive: false}
  );

  document.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    },
    {passive: false}
  );
}

createRoot(document.getElementById('root')!).render(<App />);
