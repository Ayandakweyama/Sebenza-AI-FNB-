'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Brain, Compass, LineChart, Newspaper, Sparkles, Target } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

export function CareerInsightsSidebar({
  selectedJob,
  applicationsSent,
  alertsActive,
  savedJobs,
}: {
  selectedJob: { title: string; company: string; location: string; url: string } | null;
  applicationsSent: number;
  alertsActive: number;
  savedJobs: number;
}) {
  const { profile } = useProfile();
  const [news, setNews] = useState<
    { title: string; url: string; source: string; publishedAt: string | null; sentiment: 'positive' | 'neutral' | 'negative'; topic: string }[]
  >([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [certifications, setCertifications] = useState<{ name: string; reason?: string }[]>([]);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
  const [certSource, setCertSource] = useState<'ai' | 'fallback'>('fallback');

  useEffect(() => {
    let cancelled = false;
    setIsLoadingNews(true);
    fetch('/api/market-news')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (cancelled) return;
        setNews(Array.isArray(d.items) ? d.items : []);
      })
      .catch(() => {
        if (cancelled) return;
        setNews([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingNews(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const certRequestKey = useMemo(() => {
    const education =
      profile?.education?.map((e: any) => ({
        institution: String(e?.institution || ''),
        degree: String(e?.degree || ''),
        fieldOfStudy: String(e?.fieldOfStudy || ''),
        description: String(e?.description || ''),
      })) || [];
    const technicalSkills = profile?.technicalSkills?.map((s: any) => String(s?.name || '')).filter(Boolean) || [];
    const industries = Array.isArray((profile as any)?.industries) ? ((profile as any).industries as any[]).map((i) => String(i || '')).filter(Boolean) : [];
    const jobTitle = String((profile as any)?.jobTitle || '');
    const selectedJobTitle = String(selectedJob?.title || '');
    return JSON.stringify({ education, technicalSkills, industries, jobTitle, selectedJobTitle });
  }, [profile, selectedJob?.title]);

  useEffect(() => {
    let cancelled = false;
    const parsed = JSON.parse(certRequestKey) as any;
    const hasAnyProfileSignal =
      (Array.isArray(parsed.education) && parsed.education.some((e: any) => e.degree || e.fieldOfStudy || e.institution)) ||
      (Array.isArray(parsed.technicalSkills) && parsed.technicalSkills.length > 0) ||
      (Array.isArray(parsed.industries) && parsed.industries.length > 0) ||
      !!parsed.jobTitle ||
      !!parsed.selectedJobTitle;

    if (!hasAnyProfileSignal) {
      setCertifications([]);
      setCertSource('fallback');
      return;
    }

    setIsLoadingCertifications(true);
    fetch('/api/certifications/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: certRequestKey,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setCertSource(d?.source === 'ai' ? 'ai' : 'fallback');
        setCertifications(Array.isArray(d?.certifications) ? d.certifications : []);
      })
      .catch(() => {
        if (cancelled) return;
        setCertSource('fallback');
        setCertifications([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingCertifications(false);
      });

    return () => {
      cancelled = true;
    };
  }, [certRequestKey]);

  const sentiment = useMemo(() => {
    if (!news.length) return { label: 'Neutral', color: 'text-slate-200/80', score: 0 };
    const map = { positive: 1, neutral: 0, negative: -1 } as const;
    const score = Math.round((news.slice(0, 10).reduce((a, b) => a + map[b.sentiment], 0) / Math.max(1, Math.min(10, news.length))) * 100) / 100;
    if (score >= 0.3) return { label: 'Positive', color: 'text-emerald-200', score };
    if (score <= -0.3) return { label: 'Negative', color: 'text-red-200', score };
    return { label: 'Neutral', color: 'text-slate-200/80', score };
  }, [news]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">AI Career Insights</div>
          <div className="text-xs text-slate-200/70">Roadmap · skills gap · salary signal · market pulse</div>
        </div>
        <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
          <Brain className="w-4 h-4 text-blue-300" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-300" />
            Personalized actions
          </div>
          <div className="mt-3 space-y-2">
            <InsightLink href="/afrigter/career-roadmap" icon={<Compass className="w-4 h-4" />} title="Career Roadmap" desc="Step-by-step plan with animated guidance" />
            <InsightLink href="/afrigter/skill-gap" icon={<Target className="w-4 h-4" />} title="Skills Gap Analysis" desc="Missing skills + learning path from your CV" />
            <InsightLink href="/afrigter/career-advice" icon={<Brain className="w-4 h-4" />} title="Career Advice" desc="Ask the AI mentor anything, instantly" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-200/70">
            Recommended certifications{certSource === 'ai' ? ' (AI)' : ''}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {isLoadingCertifications ? (
              <div className="text-xs text-slate-200/70">Generating recommendations…</div>
            ) : certifications.length ? (
              certifications.map((c) => (
                <span
                  key={c.name}
                  title={c.reason || ''}
                  className="px-2 py-1 rounded-lg bg-black/10 border border-white/10 text-xs text-slate-100"
                >
                  {c.name}
                </span>
              ))
            ) : (
              <div className="text-xs text-slate-200/70">Add your education on your profile to unlock recommendations.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-300" />
            Signals
          </div>
          <div className="mt-3 space-y-3">
            <SignalRow label="Interview readiness" value={Math.min(100, 40 + savedJobs * 4 + applicationsSent * 3)} />
            <SignalRow label="Salary signal confidence" value={Math.min(100, 30 + applicationsSent * 5)} />
            <SignalRow label="Market alignment" value={Math.min(100, 45 + alertsActive * 6)} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-300" />
              Workforce news
            </div>
            <div className={`text-xs font-semibold ${sentiment.color}`}>{sentiment.label}</div>
          </div>
          <div className="mt-2 text-[11px] text-slate-200/70">
            Latest South Africa headlines that can affect hiring, unemployment, policy, and the economy.
          </div>
          <div className="mt-3 space-y-2">
            {isLoadingNews ? (
              <div className="text-xs text-slate-200/70">Loading market headlines…</div>
            ) : news.length ? (
              news.slice(0, 6).map((n) => (
                <a
                  key={n.url}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-white/10 bg-black/10 p-3 hover:bg-black/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-white/90 leading-snug line-clamp-2">{n.title}</div>
                      <div className="mt-1 text-[11px] text-slate-200/70 truncate">
                        {n.source}
                        {n.topic ? ` · ${n.topic}` : ''}
                      </div>
                    </div>
                    <span className={badgeClass(n.sentiment)}>{badgeLabel(n.sentiment)}</span>
                  </div>
                </a>
              ))
            ) : (
              <div className="text-xs text-slate-200/70">No headlines available right now.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-2">
            <BadgeCheck className="w-4 h-4 text-blue-300 mt-0.5" />
            <div className="text-xs text-slate-200/80 leading-relaxed">
              Track your saved jobs and applications regularly — consistent activity improves your hiring outcomes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function badgeLabel(s: 'positive' | 'neutral' | 'negative') {
  if (s === 'positive') return 'Up';
  if (s === 'negative') return 'Down';
  return 'Flat';
}

function badgeClass(s: 'positive' | 'neutral' | 'negative') {
  if (s === 'positive') return 'text-[11px] px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 flex-shrink-0';
  if (s === 'negative') return 'text-[11px] px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/25 text-red-200 flex-shrink-0';
  return 'text-[11px] px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-slate-100 flex-shrink-0';
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
      <div className="text-[11px] text-slate-200/70">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{Number(value || 0).toLocaleString('en-US')}</div>
    </div>
  );
}

function InsightLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors p-3"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl border border-white/10 bg-black/10 flex items-center justify-center text-blue-200">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white group-hover:text-white">{title}</div>
          <div className="text-xs text-slate-200/70 leading-relaxed">{desc}</div>
        </div>
      </div>
    </Link>
  );
}

function SignalRow({ label, value }: { label: string; value: number }) {
  const v = Math.min(100, Math.max(0, Math.round(value || 0)));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-200/70">
        <span>{label}</span>
        <span className="text-slate-100">{v}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/6 border border-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${v}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-300"
        />
      </div>
    </div>
  );
}
