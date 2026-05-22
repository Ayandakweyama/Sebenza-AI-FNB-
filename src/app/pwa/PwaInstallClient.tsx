'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, PlusSquare, Share2, Smartphone } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isIos(userAgent: string) {
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export default function PwaInstallClient() {
  const [bipEvent, setBipEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const ua = useMemo(() => (typeof navigator !== 'undefined' ? navigator.userAgent : ''), []);
  const ios = useMemo(() => (typeof window !== 'undefined' ? isIos(ua) : false), [ua]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setBipEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const onInstall = async () => {
    if (!bipEvent) return;
    setInstalling(true);
    try {
      await bipEvent.prompt();
      await bipEvent.userChoice;
      setBipEvent(null);
    } finally {
      setInstalling(false);
    }
  };

  if (installed) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-200" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">App installed</h2>
            <p className="mt-1 text-sm text-gray-300/80 leading-relaxed">
              Sebenza AI is already installed on this device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (ios) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-pink-200" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">Install on iPhone (Safari)</h2>
            <ol className="mt-3 space-y-2 text-sm text-gray-300/85">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs text-gray-200">1</span>
                Tap the Share button <Share2 className="w-4 h-4 text-gray-200/80" />.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs text-gray-200">2</span>
                Select Add to Home Screen <PlusSquare className="w-4 h-4 text-gray-200/80" />.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs text-gray-200">3</span>
                Confirm to install.
              </li>
            </ol>
            <p className="mt-4 text-xs text-gray-400/70">
              If you opened this inside an in-app browser, use “Open in Safari”.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
          <Download className="w-5 h-5 text-purple-200" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Install on Android (Chrome)</h2>
          <p className="mt-1 text-sm text-gray-300/80 leading-relaxed">
            Install the app for faster access and a full-screen experience.
          </p>

          {bipEvent ? (
            <button
              type="button"
              onClick={onInstall}
              disabled={installing}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-100 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,.9), rgba(168,85,247,.8))',
                boxShadow: '0 0 20px rgba(168,85,247,.30), inset 0 1px 0 rgba(255,255,255,.12)',
                border: '1px solid rgba(168,85,247,.35)',
              }}
            >
              <Download className="w-4 h-4" />
              {installing ? 'Preparing...' : 'Install Sebenza AI'}
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-gray-300/80 leading-relaxed">
                If the install button does not appear, open the browser menu and tap “Install app” or “Add to Home screen”.
              </p>
              <a
                href="https://www.sebenzaai.cv/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-purple-200/90 hover:text-white"
              >
                Open in browser
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

