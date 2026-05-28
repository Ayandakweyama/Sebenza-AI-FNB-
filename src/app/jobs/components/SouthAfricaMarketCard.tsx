'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Globe, TrendingUp } from 'lucide-react';
import { OrbitControls } from '@react-three/drei';
import type { Job } from '@/hooks/useJobScraper';
import { useProfile } from '@/contexts/ProfileContext';

type Province = {
  id: string;
  name: string;
  geo: { lat: number; lon: number };
};

type ProvinceView = Province & ProvinceStats;

const BASE_PROVINCES: Province[] = [
  {
    id: 'gauteng',
    name: 'Gauteng',
    geo: { lat: -26.2041, lon: 28.0473 },
  },
  {
    id: 'western-cape',
    name: 'Western Cape',
    geo: { lat: -33.9249, lon: 18.4241 },
  },
  {
    id: 'kwazulu-natal',
    name: 'KwaZulu-Natal',
    geo: { lat: -29.8587, lon: 31.0218 },
  },
  {
    id: 'eastern-cape',
    name: 'Eastern Cape',
    geo: { lat: -33.9608, lon: 25.6022 },
  },
  {
    id: 'free-state',
    name: 'Free State',
    geo: { lat: -29.0852, lon: 26.1596 },
  },
  {
    id: 'mpumalanga',
    name: 'Mpumalanga',
    geo: { lat: -25.4658, lon: 30.9853 },
  },
  {
    id: 'limpopo',
    name: 'Limpopo',
    geo: { lat: -23.9045, lon: 29.4689 },
  },
  {
    id: 'north-west',
    name: 'North West',
    geo: { lat: -25.8652, lon: 25.6442 },
  },
  {
    id: 'northern-cape',
    name: 'Northern Cape',
    geo: { lat: -28.7282, lon: 24.7499 },
  },
];

const SA_BOUNDS = {
  lonMin: 16.45,
  lonMax: 33.35,
  latMin: -34.95,
  latMax: -22.05,
} as const;

const MAP_PLANE = {
  width: 3.2,
  height: 2.1,
} as const;

type ProvinceStats = {
  id: string;
  jobs: number;
  demand: number;
  growth: number;
  topCompanies: string[];
  topSkills: string[];
};

function normalize(s: unknown) {
  return typeof s === 'string' ? s.toLowerCase().trim() : '';
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function inferProvinceId(location: string) {
  const s = normalize(location);
  if (!s) return null;
  if (/(gauteng|johannesburg|pretoria|sandton|midrand|centurion)/.test(s)) return 'gauteng';
  if (/(western cape|cape town|stellenbosch|paarl|george)/.test(s)) return 'western-cape';
  if (/(kwazulu|kzn|durban|pietermaritzburg|umhlanga)/.test(s)) return 'kwazulu-natal';
  if (/(eastern cape|gqeberha|port elizabeth|east london)/.test(s)) return 'eastern-cape';
  if (/(free state|bloemfontein)/.test(s)) return 'free-state';
  if (/(mpumalanga|nelspruit|mbombela)/.test(s)) return 'mpumalanga';
  if (/(limpopo|polokwane)/.test(s)) return 'limpopo';
  if (/(north west|north-west|rustenburg|mahikeng|mafikeng)/.test(s)) return 'north-west';
  if (/(northern cape|kimberley|upington)/.test(s)) return 'northern-cape';
  return null;
}

function matchesIndustry(job: Job, industry: string) {
  const target = normalize(industry);
  if (!target) return true;
  const hay = `${job.industry || ''} ${job.title || ''} ${job.company || ''} ${job.description || ''} ${job.jobType || ''}`.toLowerCase();
  if (hay.includes(target)) return true;

  if (target.includes('tech') || target.includes('software') || target.includes('it')) {
    return /(developer|engineer|software|frontend|backend|full[- ]stack|devops|cloud|data|ai|ml|typescript|react|node|python)/.test(hay);
  }
  if (target.includes('finance') || target.includes('bank') || target.includes('account')) {
    return /(finance|bank|account|accountant|credit|risk|audit|investment|cfa|treasury)/.test(hay);
  }
  if (target.includes('health') || target.includes('medical')) {
    return /(health|medical|clinic|nurse|doctor|pharma|hospital)/.test(hay);
  }
  if (target.includes('education')) {
    return /(teacher|lecturer|education|school|university|tutor)/.test(hay);
  }
  if (target.includes('sales') || target.includes('marketing')) {
    return /(sales|account executive|business development|marketing|seo|brand|campaign)/.test(hay);
  }

  return false;
}

function MapScene({
  provinces,
  onHover,
  textureUrl,
}: {
  provinces: ProvinceView[];
  onHover: (p: ProvinceView | null) => void;
  textureUrl: string;
}) {
  const group = useRef<Group>(null);
  const plane = useRef<Mesh>(null);
  const [mapTexture, setMapTexture] = useState<THREE.Texture | null>(null);
  const [alphaBounds, setAlphaBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (t) => {
        if (cancelled) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        setMapTexture(t);

        try {
          const img = t.image as HTMLImageElement;
          if (!img?.width || !img?.height) {
            setAlphaBounds(null);
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setAlphaBounds(null);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, img.width, img.height);
          let minX = img.width;
          let maxX = 0;
          let minY = img.height;
          let maxY = 0;
          let found = false;

          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const a = data[(y * img.width + x) * 4 + 3];
              if (a > 18) {
                found = true;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (!found) {
            setAlphaBounds(null);
            return;
          }

          const w = MAP_PLANE.width;
          const h = MAP_PLANE.height;

          const minXw = -w / 2 + (minX / img.width) * w;
          const maxXw = -w / 2 + ((maxX + 1) / img.width) * w;

          const maxYw = h / 2 - (minY / img.height) * h;
          const minYw = h / 2 - ((maxY + 1) / img.height) * h;

          setAlphaBounds({ minX: minXw, maxX: maxXw, minY: minYw, maxY: maxYw });
        } catch {
          setAlphaBounds(null);
        }
      },
      undefined,
      () => {
        if (cancelled) return;
        setMapTexture(null);
        setAlphaBounds(null);
      }
    );
    return () => {
      cancelled = true;
      setMapTexture((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [textureUrl]);

  const heatTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    g.addColorStop(0, 'rgba(59,130,246,0.65)');
    g.addColorStop(0.5, 'rgba(99,102,241,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = 0.04 * Math.sin(t * 0.35);
    }
    if (plane.current) {
      plane.current.material.opacity = 0.22 + 0.06 * Math.sin(t * 0.9);
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh ref={plane} position={[0, 0, -0.08]}>
        <planeGeometry args={[MAP_PLANE.width, MAP_PLANE.height]} />
        <meshBasicMaterial map={heatTexture ?? undefined} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0, -0.035]}>
        <boxGeometry args={[MAP_PLANE.width, MAP_PLANE.height, 0.055]} />
        <meshStandardMaterial color="#060a18" roughness={0.8} metalness={0.05} emissive="#0b2a6a" emissiveIntensity={0.07} />
      </mesh>

      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[MAP_PLANE.width, MAP_PLANE.height]} />
        <meshStandardMaterial
          map={mapTexture ?? undefined}
          transparent
          opacity={mapTexture ? 1 : 0.18}
          roughness={0.65}
          metalness={0.05}
          emissive="#0b2a6a"
          emissiveIntensity={0.12}
          alphaTest={0.12}
        />
      </mesh>

      <mesh position={[0, 0, -0.001]} scale={[1.02, 1.02, 1]}>
        <planeGeometry args={[MAP_PLANE.width, MAP_PLANE.height]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {provinces.map((p) => (
        <ProvinceNode key={p.id} province={p} onHover={onHover} bounds={alphaBounds} />
      ))}
    </group>
  );
}

function ProvinceNode({
  province,
  onHover,
  bounds,
}: {
  province: ProvinceView;
  onHover: (p: ProvinceView | null) => void;
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
}) {
  const ref = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);

  const position = useMemo<[number, number, number]>(() => {
    const u = (province.geo.lon - SA_BOUNDS.lonMin) / (SA_BOUNDS.lonMax - SA_BOUNDS.lonMin);
    const v = (province.geo.lat - SA_BOUNDS.latMin) / (SA_BOUNDS.latMax - SA_BOUNDS.latMin);

    const uu = clamp01(u);
    const vv = clamp01(v);

    const minX = bounds?.minX ?? -MAP_PLANE.width / 2;
    const maxX = bounds?.maxX ?? MAP_PLANE.width / 2;
    const minY = bounds?.minY ?? -MAP_PLANE.height / 2;
    const maxY = bounds?.maxY ?? MAP_PLANE.height / 2;

    const x = THREE.MathUtils.lerp(minX, maxX, uu);
    const y = THREE.MathUtils.lerp(maxY, minY, vv);
    return [x, y, 0.02];
  }, [bounds?.maxX, bounds?.maxY, bounds?.minX, bounds?.minY, province.geo.lat, province.geo.lon]);

  const color = useMemo(() => {
    const v = Math.min(1, Math.max(0, province.demand));
    const c = new THREE.Color();
    c.setHSL(0.58 - v * 0.18, 0.95, 0.55 + v * 0.12);
    return c;
  }, [province.demand]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current) {
      const s = 1 + 0.18 * Math.sin(t * 1.25 + province.demand * 6);
      ring.current.scale.set(s, s, s);
      (ring.current.material as any).opacity = 0.18 + 0.08 * Math.sin(t * 1.35 + province.demand * 4);
    }
    if (ref.current) {
      ref.current.position.z = 0.03 + 0.01 * Math.sin(t * 1.1 + province.demand * 5);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ring}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(province);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        <ringGeometry args={[0.08, 0.14, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      <mesh
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(province);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
      >
        <sphereGeometry args={[0.06 + province.demand * 0.02, 24, 24]} />
        <meshStandardMaterial
          color="#0b122b"
          emissive={color}
          emissiveIntensity={0.85 + province.demand * 0.7}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

export function SouthAfricaMarketCard({ jobs }: { jobs?: Job[] }) {
  const [hovered, setHovered] = useState<ProvinceView | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const { profile } = useProfile();

  const industries = useMemo(() => {
    const v = (profile as any)?.industries as string[] | undefined;
    return Array.isArray(v) ? v.filter(Boolean) : [];
  }, [profile]);

  const [selectedIndustry, setSelectedIndustry] = useState('');

  useEffect(() => {
    if (selectedIndustry) return;
    if (industries.length) setSelectedIndustry(industries[0]);
  }, [industries, selectedIndustry]);

  const market = useMemo(() => {
    const allJobs = Array.isArray(jobs) ? jobs : [];
    const industryJobs = selectedIndustry ? allJobs.filter((j) => matchesIndustry(j, selectedIndustry)) : allJobs;

    const byProvince = new Map<string, Job[]>();
    for (const j of industryJobs) {
      const pid = inferProvinceId(j.location || '');
      if (!pid) continue;
      const arr = byProvince.get(pid) || [];
      arr.push(j);
      byProvince.set(pid, arr);
    }

    const provinceStats: Record<string, ProvinceStats> = {};
    let maxJobs = 0;
    for (const p of BASE_PROVINCES) {
      const arr = byProvince.get(p.id) || [];
      maxJobs = Math.max(maxJobs, arr.length);
    }

    for (const p of BASE_PROVINCES) {
      const arr = byProvince.get(p.id) || [];
      const jobCount = arr.length;
      const demand = maxJobs ? jobCount / maxJobs : 0;

      const companies = new Map<string, number>();
      const skills = new Map<string, number>();
      for (const j of arr) {
        const c = (j.company || '').trim();
        if (c) companies.set(c, (companies.get(c) || 0) + 1);

        const text = `${j.title || ''} ${j.description || ''}`.toLowerCase();
        const skillHits: [RegExp, string][] = [
          [/\breact\b/, 'React'],
          [/\btypescript\b/, 'TypeScript'],
          [/\bpython\b/, 'Python'],
          [/\bjava\b/, 'Java'],
          [/\baws\b/, 'AWS'],
          [/\bazure\b/, 'Azure'],
          [/\bsql\b/, 'SQL'],
          [/\bpower bi\b/, 'Power BI'],
          [/\bexcel\b/, 'Excel'],
          [/\bsecurity\b|\bcyber\b/, 'Security'],
        ];
        for (const [re, label] of skillHits) {
          if (re.test(text)) skills.set(label, (skills.get(label) || 0) + 1);
        }
      }

      const topCompanies = [...companies.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((e) => e[0]);
      const topSkills = [...skills.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map((e) => e[0]);

      provinceStats[p.id] = {
        id: p.id,
        jobs: jobCount,
        demand: clamp01(demand),
        growth: Math.round((0.08 + 0.22 * clamp01(demand)) * 100),
        topCompanies,
        topSkills,
      };
    }

    const total = industryJobs.length;
    const remoteCount = industryJobs.filter((j) => /remote|hybrid/i.test(j.location || '')).length;
    const remoteShare = total ? Math.round((remoteCount / total) * 100) : 0;

    return {
      industryJobs,
      provinceStats,
      totals: { total, remoteShare },
    };
  }, [jobs, selectedIndustry]);

  const provinces = useMemo(() => {
    return BASE_PROVINCES.map((p) => ({
      ...p,
      ...(market.provinceStats[p.id] || {
        id: p.id,
        jobs: 0,
        demand: 0,
        growth: 0,
        topCompanies: [],
        topSkills: [],
      }),
    }));
  }, [market.provinceStats]);

  const insights = useMemo(() => {
    const label = selectedIndustry || 'your industry';
    if (!market.totals.total) {
      return [
        `Complete a search in the Unified Job Feed to populate real-time analytics for ${label}.`,
        `Once jobs are loaded, province demand signals update automatically for ${label}.`,
      ];
    }
    return [
      `${market.totals.total.toLocaleString('en-US')} live postings detected for ${label} across supported sources.`,
      `${market.totals.remoteShare}% of roles appear remote or hybrid for ${label}.`,
      `Hover provinces to see top companies and skills for ${label}.`,
      `Signals refresh whenever you run a new job search.`,
    ];
  }, [market.totals.remoteShare, market.totals.total, selectedIndustry]);

  useEffect(() => {
    const id = setInterval(() => setTickerIndex((i) => (i + 1) % insights.length), 5200);
    return () => clearInterval(id);
  }, [insights.length]);

  const active = hovered ?? provinces[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20%' }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">South African Job Market Analytics</div>
          <div className="text-xs text-slate-200/70">Live demand heat + AI insights + province drilldown</div>
        </div>
        <div className="flex items-center gap-2">
          {industries.length ? (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedIndustry('')}
                className={`px-2 py-1 rounded-lg border text-[11px] ${
                  selectedIndustry
                    ? 'border-white/10 bg-white/5 text-slate-200/80 hover:bg-white/10'
                    : 'border-blue-500/30 bg-blue-500/15 text-blue-100'
                }`}
              >
                All
              </button>
              {industries.slice(0, 3).map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-2 py-1 rounded-lg border text-[11px] ${
                    selectedIndustry === ind
                      ? 'border-blue-500/30 bg-blue-500/15 text-blue-100'
                      : 'border-white/10 bg-white/5 text-slate-200/80 hover:bg-white/10'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          ) : null}

          <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-7 relative h-[420px] sm:h-[460px]">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(ellipse 70% 60% at 10% 10%, rgba(59,130,246,.18) 0%, transparent 62%), radial-gradient(ellipse 55% 50% at 90% 80%, rgba(99,102,241,.16) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 pointer-events-none">
            <Canvas
              camera={{ position: [0, 0.35, 3.4], fov: 45, near: 0.1, far: 100 }}
              dpr={[1, 1.25]}
              gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
              style={{ filter: 'blur(10px)', opacity: 0.55 }}
            >
              <ambientLight intensity={0.65} color="#dbeafe" />
              <directionalLight position={[3, 4, 4]} intensity={1.25} color="#93c5fd" />
              <pointLight position={[-2.5, 2, 2.5]} intensity={0.8} color="#60a5fa" />
              <MapScene provinces={provinces} onHover={setHovered} textureUrl="/south-africa.png" />
              <OrbitControls
                enableDamping
                dampingFactor={0.08}
                enablePan={false}
                minDistance={2.4}
                maxDistance={6.5}
                minPolarAngle={0.6}
                maxPolarAngle={1.7}
                rotateSpeed={0.6}
                zoomSpeed={0.9}
              />
            </Canvas>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-5 sm:mx-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3 text-center">
              <div className="text-sm font-semibold text-white">3D South Africa model is under construction</div>
              <div className="mt-1 text-xs text-slate-200/80">Live market view will be enabled soon.</div>
            </div>
          </div>

          {hovered ? (
            <div className="absolute left-4 top-4 right-4 sm:right-auto sm:w-[320px] rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{hovered.name}</div>
                  <div className="text-xs text-slate-200/70">{hovered.jobs.toLocaleString('en-US')} roles detected</div>
                </div>
                <div className="text-xs text-blue-200 border border-blue-500/20 bg-blue-500/10 px-2 py-1 rounded-lg">
                  {Math.round(hovered.growth)}% signal
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-200/80">
                <div className="text-slate-100 font-semibold">Top companies</div>
                <div className="mt-1">{(hovered.topCompanies.length ? hovered.topCompanies : ['—']).join(' · ')}</div>
              </div>
              <div className="mt-3 text-xs text-slate-200/80">
                <div className="text-slate-100 font-semibold">Trending skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(hovered.topSkills.length ? hovered.topSkills : ['—']).map((s) => (
                    <span key={s} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-100">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5 p-5 sm:p-6 space-y-4 border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-300" />
                Demand Snapshot
              </div>
              <div className="text-xs text-slate-200/70">
                {selectedIndustry ? `${selectedIndustry} · ` : ''}
                {active.name}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Bar label="Hiring intensity" value={Math.min(100, Math.round(active.demand * 100))} />
              <Bar label="Remote / hybrid share" value={Math.min(100, market.totals.remoteShare)} />
              <Bar label="Growth signal" value={Math.min(100, Math.round(active.growth))} />
              <Bar label="Coverage" value={Math.min(100, market.totals.total ? 100 : 0)} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-200/70">AI insight ticker</div>
            <div className="mt-2 text-sm text-slate-100 leading-relaxed">
              {insights[tickerIndex]}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniMetric label="Industry roles" value={market.totals.total.toLocaleString('en-US')} />
            <MiniMetric label="Remote share" value={`${market.totals.remoteShare}%`} />
            <MiniMetric label="Fastest signal" value={`${active.name} ${Math.round(active.growth)}%`} />
            <MiniMetric label="Province jobs" value={active.jobs.toLocaleString('en-US')} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
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
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-300"
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
      <div className="text-[11px] text-slate-200/70">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
