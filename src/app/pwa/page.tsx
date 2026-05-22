import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';
import PwaInstallClient from './PwaInstallClient';

export const metadata: Metadata = {
  title: 'Install the App',
  description: 'Install Sebenza AI on your phone for faster access and a full-screen experience.',
};

export default function PwaPage() {
  return (
    <div className="min-h-screen bg-[#050615] overflow-hidden">
      <section className="relative pt-[80px] pb-20">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_15%_10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,0.14),transparent_55%)] [background-size:200%_200%] animate-gradient-shift" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:26px_26px] [background-position:0_0]" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px] [background-position:12px_18px]" />
        <div className="absolute inset-0">
          <div className="absolute -top-24 left-[-120px] w-[420px] h-[420px] bg-purple-500/25 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-[-80px] right-[-140px] w-[480px] h-[480px] bg-pink-500/20 rounded-full blur-3xl animate-blob [animation-delay:2s]" />
          <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-500/15 rounded-full blur-3xl animate-blob [animation-delay:4s]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm text-gray-200/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-200" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Install Sebenza AI
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-300/80 leading-relaxed">
                  Add Sebenza AI to your home screen for quick access and a full-screen app experience.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-7">
              <PwaInstallClient />
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <ShieldCheck className="w-4 h-4 text-pink-200 mt-0.5" />
                <p className="text-xs text-gray-300/80 leading-relaxed">
                  If you do not see the install prompt, open the site in your full browser (not inside an in-app browser).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
