'use client';

import Link from 'next/link';
import React from 'react';
import { ArrowRight, FileText, Scan, Sparkles, Video } from 'lucide-react';

const actions = [
  {
    title: 'Build CV',
    description: 'Create and export a tailored CV',
    href: '/cvbuilder',
    Icon: FileText,
  },
  {
    title: 'ATS Checker',
    description: 'Scan your CV for ATS and job match',
    href: '/ats-checker',
    Icon: Scan,
  },
  {
    title: 'AI Interview',
    description: 'Practice and get feedback',
    href: '/afrigter/video-interview',
    Icon: Video,
  },
];

const DashboardQuickActions = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_70px_rgba(168,85,247,0.10)]">
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />

      <div className="relative px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-300/75">Jump back into your workflow.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200/80">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            Fast start
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map(({ title, description, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]"
              prefetch={false}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(circle at 20% 10%, rgba(168,85,247,.22), transparent 60%)' }} />
              <div className="relative flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                  <Icon className="h-5 w-5 text-purple-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{title}</p>
                    <ArrowRight className="h-4 w-4 text-slate-300/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-200/90" />
                  </div>
                  <p className="mt-1 text-sm text-slate-300/70">{description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardQuickActions;
