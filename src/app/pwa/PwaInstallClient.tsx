'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, PlusSquare, Share2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

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
    if (!bipEvent) {
      if (ios) {
        toast.message('To install on iPhone: Share, then Add to Home Screen.');
      } else {
        toast.message('To install: open your browser menu and tap Install app / Add to Home screen.');
      }
      return;
    }
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
    );
  }

  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
        {ios ? (
          <Share2 className="w-5 h-5 text-pink-200" />
        ) : (
          <Download className="w-5 h-5 text-purple-200" />
        )}
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-white">Install the app</h2>
        <p className="mt-1 text-sm text-gray-300/80 leading-relaxed">
          Add Sebenza AI to your home screen for quick access.
        </p>

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

        {ios && (
          <div className="mt-4 text-xs text-gray-400/80 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-gray-200">1</span>
              Tap Share <Share2 className="w-3.5 h-3.5 text-gray-200/80" /> in Safari
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-gray-200">2</span>
              Select Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-gray-200/80" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
