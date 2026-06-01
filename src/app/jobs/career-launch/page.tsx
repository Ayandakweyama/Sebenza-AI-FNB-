'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ExternalLink, Rocket, Sparkles, Star } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { getValidToken } from '@/utils/authHelpers';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';
import * as THREE from 'three';
import HeroStarField from '../../components/home/HeroStarField';

type OpportunityType = 'Graduate Programme' | 'Internship' | 'Learnership' | 'Bursary' | 'Entry-Level Job';

type CareerOpportunity = {
  id: string;
  title: string;
  url: string;
  source: string;
  type: OpportunityType;
  careerField: string | null;
  location: string | null;
  postedDate: string | null;
  closingDate: string | null;
  openingDate: string | null;
  snippet: string | null;
};

function daysUntil(iso: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const diff = Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

function loadTracked() {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = localStorage.getItem('careerLaunchTracked');
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set<string>();
  }
}

function saveTracked(set: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('careerLaunchTracked', JSON.stringify(Array.from(set)));
}

export default function CareerLaunchPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CareerOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<OpportunityType | 'All'>('All');
  const [tracked, setTracked] = useState<Set<string>>(() => loadTracked());
  const [fieldFilter, setFieldFilter] = useState<string>('All fields');

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [audit, setAudit] = useState<{
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    quickFixes: string[];
    scraped: boolean;
  } | null>(null);

  const getAuthHeaders = async () => {
    const token = await getValidToken(getToken, 2);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/career-launch/opportunities', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limitPerType: 10 }),
      });
      const json = (await res.json().catch(() => null)) as { items?: CareerOpportunity[]; error?: string } | null;
      if (!json) throw new Error('Server returned an invalid response');
      setItems(Array.isArray(json.items) ? json.items : []);
      if (json.error) setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load opportunities');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const visible = useMemo(() => {
    const filtered = items.filter((it) => {
      if (typeFilter !== 'All' && it.type !== typeFilter) return false;
      if (fieldFilter !== 'All fields' && (it.careerField || 'General') !== fieldFilter) return false;
      return true;
    });
    return filtered.slice(0, 80);
  }, [fieldFilter, items, typeFilter]);

  const trackedCount = tracked.size;

  const toggleTrack = (url: string) => {
    setTracked((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      saveTracked(next);
      return next;
    });
  };

  const runAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);
    setAudit(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/career-launch/linkedin-audit', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedinUrl.trim(), pastedText: linkedinText.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!json) throw new Error('Server returned an invalid response');
      if (!res.ok) {
        setAuditError(String(json?.error || 'Failed to analyze'));
        return;
      }
      setAudit(json);
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : 'Failed to analyze');
    } finally {
      setAuditLoading(false);
    }
  };

  const typeOptions: Array<OpportunityType | 'All'> = ['All', 'Graduate Programme', 'Internship', 'Learnership', 'Bursary', 'Entry-Level Job'];
  const fieldOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      const f = it.careerField || 'General';
      counts.set(f, (counts.get(f) || 0) + 1);
    }
    const ranked = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const top = ranked.filter((x) => x !== 'General').slice(0, 6);
    const hasGeneral = ranked.includes('General');
    const list = ['All fields', ...top, ...(hasGeneral ? ['General'] : [])];
    return list;
  }, [items]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(ellipse 70% 60% at 10% 10%, rgba(59,130,246,.22) 0%, transparent 62%), radial-gradient(ellipse 60% 55% at 90% 20%, rgba(255,255,255,.08) 0%, transparent 60%)' }} />
        <HeroStarField />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
                <Rocket className="w-4 h-4 text-blue-300" />
                Career Launch
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-white">Graduate Opportunity Radar</h1>
              <p className="mt-3 text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-3xl">
                Scrapes graduate programmes, internships, learnerships, bursaries, and entry-level roles across South Africa — with closing dates and AI grouping.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center justify-center rounded-xl bg-white text-[#050815] px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 text-xs text-red-200 border border-red-500/20 bg-red-500/10 rounded-xl p-3">{error}</div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <div className="text-[11px] text-slate-200/70">Opportunity type</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {typeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      typeFilter === t
                        ? 'border-blue-400/30 bg-gradient-to-r from-blue-500/20 to-cyan-400/10 text-blue-100'
                        : 'border-white/10 bg-white/5 text-slate-200/80 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
              <div className="text-[11px] text-slate-200/70">Career fields</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {fieldOptions.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFieldFilter(f)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                      fieldFilter === f
                        ? 'border-violet-400/30 bg-gradient-to-r from-violet-500/20 to-indigo-400/10 text-violet-100'
                        : 'border-white/10 bg-white/5 text-slate-200/80 hover:bg-white/10'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-base font-semibold text-white">Opportunities</div>
                <div className="text-xs text-slate-200/70">
                  Graduates24 · GraduateEmployers of Choice · StudentRoom · Prosple · Limpopo24
                </div>
              </div>
              <div className="text-xs text-slate-200/70">{visible.length} shown</div>
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              {visible.map((it) => {
                const d = daysUntil(it.closingDate);
                const trackedOn = tracked.has(it.url);
                return (
                  <div
                    key={it.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => window.open(it.url, '_blank', 'noopener,noreferrer')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        window.open(it.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4 cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm font-semibold text-white truncate">{it.title}</div>
                          <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[11px] text-slate-200/80">
                            {it.source}
                          </span>
                          <span className="px-2 py-0.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-[11px] text-blue-100">
                            {it.type}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-200/70 flex flex-wrap gap-x-3 gap-y-1">
                          {it.location ? <span>{it.location}</span> : null}
                          {it.closingDate ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Closes {new Date(it.closingDate).toLocaleDateString('en-ZA')}
                              {typeof d === 'number' ? ` · ${d}d` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Closing date unknown
                            </span>
                          )}
                        </div>
                        {it.snippet ? <div className="mt-2 text-xs text-slate-200/75">{it.snippet}</div> : null}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrack(it.url);
                          }}
                          className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-colors ${
                            trackedOn ? 'border-amber-500/30 bg-amber-500/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-200/70 hover:bg-white/10'
                          }`}
                          aria-label="Track"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(it.url, '_blank', 'noopener,noreferrer');
                          }}
                          className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-slate-200/70 hover:bg-white/10 flex items-center justify-center transition-colors"
                          aria-label="Open"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && !visible.length ? (
                <div className="text-sm text-slate-200/70 rounded-2xl border border-white/10 bg-black/10 p-4">
                  No opportunities yet. Hit Refresh to scrape again.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white">LinkedIn Profile Score</div>
                <div className="text-xs text-slate-200/70">Paste your LinkedIn URL. If scraping fails, paste the profile text and we’ll score it.</div>
              </div>
              <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-3">
              <div>
                <div className="text-xs text-slate-200/70">LinkedIn URL</div>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-handle/"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <div className="text-xs text-slate-200/70">Profile text (optional fallback)</div>
                <textarea
                  value={linkedinText}
                  onChange={(e) => setLinkedinText(e.target.value)}
                  placeholder="Copy/paste your LinkedIn headline, about, experience, skills…"
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void runAudit()}
                  disabled={auditLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-white text-[#050815] px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-60"
                >
                  {auditLoading ? 'Analyzing…' : 'Analyze'}
                </button>
                {auditError ? <div className="text-xs text-red-200">{auditError}</div> : null}
              </div>

              {audit ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">Score</div>
                    <div className="text-sm font-semibold text-blue-100">{audit.score}/100</div>
                  </div>
                  <div className="mt-2 text-xs text-slate-200/75">{audit.summary}</div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs font-semibold text-slate-100">Strengths</div>
                      <div className="mt-2 space-y-1">
                        {audit.strengths.slice(0, 5).map((s) => (
                          <div key={s} className="text-xs text-slate-200/80">
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs font-semibold text-slate-100">Top improvements</div>
                      <div className="mt-2 space-y-1">
                        {audit.improvements.slice(0, 5).map((s) => (
                          <div key={s} className="text-xs text-slate-200/80">
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs font-semibold text-slate-100">Quick fixes</div>
                    <div className="mt-2 space-y-1">
                      {audit.quickFixes.slice(0, 4).map((s) => (
                        <div key={s} className="text-xs text-slate-200/80">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hidden lg:block rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden relative h-[320px] xl:h-[380px]">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 70% 60% at 10% 10%, rgba(99,102,241,.18) 0%, transparent 62%), radial-gradient(ellipse 60% 55% at 90% 20%, rgba(59,130,246,.18) 0%, transparent 60%)',
              }}
            />
            <HeroStarField />
            <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 2, opacity: 0.85 }}>
              <Canvas
                camera={{ position: [0, 0.25, 2.6], fov: 45, near: 0.1, far: 100 }}
                dpr={[1, 1.2]}
                gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
                style={{ background: 'transparent', touchAction: 'none' }}
              >
                <ambientLight intensity={0.9} color="#dbeafe" />
                <directionalLight position={[3, 4, 3]} intensity={1.2} color="#93c5fd" />
                <pointLight position={[-2.5, 1.5, 2.5]} intensity={0.8} color="#60a5fa" />
                <Suspense fallback={null}>
                  <OrbitingRocket modelUrl="/rocket-launch.glb" />
                </Suspense>
              </Canvas>
            </div>

            <div className="relative z-10 p-5 sm:p-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrbitingRocket({ modelUrl }: { modelUrl: string }) {
  const group = useRef<Group>(null);
  const isDraggingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const userRotRef = useRef({ x: 0, y: 0 });
  const { scene } = useGLTF(modelUrl) as unknown as { scene: THREE.Group };
  const model = useMemo(() => scene.clone(true), [scene]);
  const temp = useRef({
    start: new THREE.Vector3(-3.1, -0.2, 0.4),
    end: new THREE.Vector3(3.1, 0.65, -0.2),
    idle: new THREE.Vector3(0, -0.22, 0),
    dir: new THREE.Vector3(),
    v2: new THREE.Vector3(),
  });

  const handlers = useMemo(
    () => ({
      onPointerDown: (e: any) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        lastRef.current = { x: e.clientX, y: e.clientY };
        (e.target as any).setPointerCapture?.(e.pointerId);
      },
      onPointerUp: (e: any) => {
        e.stopPropagation();
        isDraggingRef.current = false;
        lastRef.current = null;
        (e.target as any).releasePointerCapture?.(e.pointerId);
      },
      onPointerCancel: (e: any) => {
        e.stopPropagation();
        isDraggingRef.current = false;
        lastRef.current = null;
        (e.target as any).releasePointerCapture?.(e.pointerId);
      },
      onPointerMove: (e: any) => {
        if (!isDraggingRef.current || !lastRef.current) return;
        e.stopPropagation();
        const dx = e.clientX - lastRef.current.x;
        const dy = e.clientY - lastRef.current.y;
        lastRef.current = { x: e.clientX, y: e.clientY };

        userRotRef.current.y += dx * 0.01;
        userRotRef.current.x += dy * 0.01;
        userRotRef.current.x = Math.max(-0.6, Math.min(0.6, userRotRef.current.x));
      },
    }),
    [],
  );

  const frame = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(1e-6, size.x, size.y, size.z);
    const scale = 1.05 / maxDim;
    return { center, scale };
  }, [model]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cycle = 30;
    const fly = 2.8;
    const phase = ((t % cycle) + cycle) % cycle;
    const k = temp.current;
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

    if (group.current) {
      if (phase < fly) {
        const p = easeOutCubic(phase / fly);
        k.v2.copy(k.start).lerp(k.end, p);
        group.current.position.copy(k.v2);

        k.dir.copy(k.end).sub(k.start).normalize();
        const yaw = Math.atan2(k.dir.x, k.dir.z);
        const pitch = -Math.atan2(k.dir.y, Math.sqrt(k.dir.x * k.dir.x + k.dir.z * k.dir.z));
        group.current.rotation.set(pitch + userRotRef.current.x, yaw + Math.PI / 2 + userRotRef.current.y, -0.18);
      } else {
        const baseY = Math.sin(t * 0.25) * 0.22;
        group.current.position.set(k.idle.x, k.idle.y + Math.sin(t * 0.45) * 0.08, k.idle.z);
        group.current.rotation.set(0.08 + 0.04 * Math.sin(t * 0.35) + userRotRef.current.x, Math.PI / 2 + baseY + userRotRef.current.y, -0.08);
      }
    }
  });

  return (
    <group ref={group} scale={frame.scale} {...handlers}>
      <group position={[-frame.center.x, -frame.center.y, -frame.center.z]}>
        <primitive object={model} />
      </group>
    </group>
  );
}

useGLTF.preload('/rocket-launch.glb');
