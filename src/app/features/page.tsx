'use client';

import Link from 'next/link';
import {
  ScanSearch,
  FileText,
  Wand2,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    title: 'ATS Checker',
    description: 'See how your resume reads for ATS systems, with improvements that go beyond basic keyword matching.',
    href: '/ats-checker',
    Icon: ScanSearch,
  },
  {
    title: 'Application Assistant',
    description: 'Generate tailored CV recommendations, cover letters, and application answers from your profile and CV.',
    href: '/applications',
    Icon: FileText,
  },
  {
    title: 'CV Builder',
    description: 'Build and export a clean, customizable CV with section visibility, order, and style controls.',
    href: '/cvbuilder',
    Icon: Wand2,
  },
  {
    title: 'Job Matcher',
    description: 'Upload your CV, scrape jobs from multiple sources, and see best-fit matches with scoring and guidance.',
    href: '/jobs/matcher',
    Icon: Target,
  },
  {
    title: 'Job Portal',
    description: 'Browse, save, and manage job activity from one place with a UI built for speed.',
    href: '/jobs',
    Icon: Briefcase,
  },
  {
    title: 'Afrigter (AI Tips)',
    description: 'Get structured career advice and targeted improvements based on your experience level.',
    href: '/afrigter',
    Icon: Sparkles,
  },
];

export default function FeaturesPage() {
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200/90">
              <Sparkles className="h-4 w-4 text-pink-300" />
              <span>Features</span>
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold text-white leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                Explore what Sebenza AI can do
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-300/85 leading-relaxed">
              Pick a tool to jump straight in.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ title, description, href, Icon }) => (
              <Link
                key={title}
                href={href}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.08)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/25"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-70 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 mb-4 shadow-[0_0_20px_rgba(236,72,153,0.08)]">
                    <Icon className="w-5 h-5 text-pink-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm text-gray-300/75 leading-relaxed">{description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-200/90">
                    Open
                    <ArrowRight className="w-4 h-4 text-purple-200 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
