'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function isMobileUserAgent(ua: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

function isIos(ua: string) {
  return /iPad|iPhone|iPod/i.test(ua);
}

const storageKey = 'sebenza:pwaPromptDismissedAt';
const dismissTtlMs = 7 * 24 * 60 * 60 * 1000;

export default function PwaInstallPrompt() {
  const pathname = usePathname();
  const router = useRouter();
  const [bipEvent, setBipEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const shownRef = useRef(false);

  const ua = useMemo(() => (typeof navigator !== 'undefined' ? navigator.userAgent : ''), []);
  const isMobile = useMemo(() => (typeof window !== 'undefined' ? isMobileUserAgent(ua) : false), [ua]);
  const ios = useMemo(() => (typeof window !== 'undefined' ? isIos(ua) : false), [ua]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobile) return;
    if (pathname === '/pwa') return;
    if (isStandalone()) return;

    const dismissedAt = Number(localStorage.getItem(storageKey) || 0);
    if (dismissedAt && Date.now() - dismissedAt < dismissTtlMs) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      localStorage.setItem(storageKey, `${Date.now()}`);
      setBipEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [isMobile, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isMobile) return;
    if (pathname === '/pwa') return;
    if (isStandalone()) return;
    if (shownRef.current) return;

    const dismissedAt = Number(localStorage.getItem(storageKey) || 0);
    if (dismissedAt && Date.now() - dismissedAt < dismissTtlMs) return;

    const timer = setTimeout(() => {
      shownRef.current = true;

      const id = toast.custom((t) => (
        <div className="w-[min(420px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#050615]/80 backdrop-blur-xl shadow-2xl shadow-black/60 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-purple-200" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Install Sebenza AI</p>
                  <p className="mt-0.5 text-xs text-gray-300/80 leading-relaxed">
                    Add the app to your home screen for faster access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(storageKey, `${Date.now()}`);
                    toast.dismiss(t);
                  }}
                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-200/80"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (bipEvent) {
                        await bipEvent.prompt();
                        await bipEvent.userChoice;
                        localStorage.setItem(storageKey, `${Date.now()}`);
                      } else {
                        router.push('/pwa');
                      }
                    } finally {
                      toast.dismiss(t);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,.9), rgba(168,85,247,.8))',
                    border: '1px solid rgba(168,85,247,.35)',
                    boxShadow: '0 0 18px rgba(168,85,247,.22)',
                  }}
                >
                  {bipEvent ? 'Install' : ios ? 'View steps' : 'Install'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(storageKey, `${Date.now()}`);
                    toast.dismiss(t);
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-gray-200/80 border border-white/10 bg-white/5"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      ));

      return id;
    }, 2500);

    return () => clearTimeout(timer);
  }, [bipEvent, ios, isMobile, pathname, router]);

  return null;
}

