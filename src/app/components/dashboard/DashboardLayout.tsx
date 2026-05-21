'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MobileDashboard } from './MobileDashboard';
import { DesktopGreeting } from './DesktopGreeting';
import { useDashboard } from './context/DashboardContext';
import DashboardQuickActions from './DashboardQuickActions';
import { ProfileProgress } from './ProfileProgress';
import { ChevronDown, Sparkles } from 'lucide-react';

/* ─── Ambient Starfield ──────────────────────────────────────────────────────── */
const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    interface Star { x: number; y: number; z: number; speed: number; r: number; opacity: number; tw: number; ts: number; hue: number; }
    const stars: Star[] = Array.from({ length: 220 }, () => {
      const z = Math.random();
      return { x: Math.random() * canvas.width, y: Math.random() * canvas.height, z, speed: 0.05 + z * 0.22, r: 0.18 + z * 1.5, opacity: 0.1 + z * 0.6, tw: Math.random() * Math.PI * 2, ts: 0.002 + Math.random() * 0.009, hue: [240,270,300,200][Math.floor(Math.random()*4)] };
    });

    const SPARKLE = 14;
    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s, i) => {
        s.y += s.speed * 0.35;
        s.x += (s.z - 0.5) * 0.04;
        if (s.y > canvas.height + 2) { s.y = -2; s.x = Math.random() * canvas.width; }
        if (s.x < -2) s.x = canvas.width + 2;
        if (s.x > canvas.width + 2) s.x = -2;
        const tw = 0.5 + 0.5 * Math.sin(t * s.ts + s.tw);
        const alpha = s.opacity * tw;
        if (i < SPARKLE) {
          const arm = s.r * 4.5;
          ctx.save(); ctx.translate(s.x, s.y); ctx.globalAlpha = alpha * 0.88;
          const g = ctx.createRadialGradient(0,0,0,0,0,arm);
          g.addColorStop(0,`hsla(${s.hue},80%,96%,1)`); g.addColorStop(1,`hsla(${s.hue},60%,70%,0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.ellipse(0,0,arm,s.r*.5,0,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(0,0,s.r*.5,arm,0,0,Math.PI*2); ctx.fill();
          ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(0,0,s.r*.85,0,Math.PI*2);
          ctx.fillStyle=`hsla(${s.hue},40%,100%,1)`; ctx.fill(); ctx.restore();
        } else {
          if (s.z > 0.6) {
            const h = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*4);
            h.addColorStop(0,`hsla(${s.hue},70%,90%,${alpha*.45})`); h.addColorStop(1,`hsla(${s.hue},60%,70%,0)`);
            ctx.beginPath(); ctx.arc(s.x,s.y,s.r*4,0,Math.PI*2); ctx.fillStyle=h; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
          ctx.fillStyle=`hsla(${s.hue},25%,98%,${alpha})`; ctx.fill();
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
};

/* ─── DashboardLayout ────────────────────────────────────────────────────────── */
export const DashboardLayout: React.FC = () => {
  const { updatedNavigationItems, hoveredCard, setHoveredCard, setChatbotOpen, chatbotOpen } = useDashboard();
  const [showExtras, setShowExtras] = useState(false);

  return (
    <>
      <style>{`
        @keyframes blob          { 0%,100%{border-radius:60% 40% 55% 45%/60% 55% 45% 40%} 33%{border-radius:40% 60% 45% 55%/45% 40% 60% 55%} 66%{border-radius:55% 45% 60% 40%/55% 60% 40% 45%} }
        @keyframes nebula-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scan-line     { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes extras-in     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring    { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.04)} }

        .animate-blob            { animation: blob 12s ease-in-out infinite }
        .extras-panel            { animation: extras-in .35s cubic-bezier(.16,1,.3,1) both }
        .toggle-btn {
          width:100%; display:inline-flex; align-items:center; justify-content:space-between;
          border-radius:16px; border:1px solid rgba(255,255,255,.09);
          background:linear-gradient(135deg,rgba(255,255,255,.035) 0%,rgba(100,50,200,.05) 100%);
          backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
          padding:14px 20px; font-size:14px; color:rgba(226,232,240,.85);
          cursor:pointer; position:relative; overflow:hidden;
          box-shadow:0 0 0 1px rgba(255,255,255,.05),0 8px 32px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.07);
          transition:border-color .2s,box-shadow .2s;
        }
        .toggle-btn:hover {
          border-color:rgba(168,85,247,.28);
          box-shadow:0 0 0 1px rgba(168,85,247,.15),0 8px 40px rgba(0,0,0,.35),0 0 24px rgba(168,85,247,.1),inset 0 1px 0 rgba(255,255,255,.09);
        }
        .toggle-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.03),transparent);
          transform:translateX(-100%); transition:transform .5s ease;
        }
        .toggle-btn:hover::before { transform:translateX(100%); }
        .toggle-chevron { transition:transform .3s cubic-bezier(.16,1,.3,1); }
        .toggle-btn[data-open="true"] .toggle-chevron { transform:rotate(180deg); }

        .section-divider {
          height:1px; margin:0 0 24px;
          background:linear-gradient(90deg,transparent,rgba(168,85,247,.25),rgba(236,72,153,.18),rgba(59,130,246,.15),transparent);
        }
      `}</style>

      <div className="h-[100dvh] box-border bg-[#03040f] text-white pt-16 relative overflow-hidden">

        {/* ── Background layers ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>

          {/* Starfield */}
          <StarField />

          {/* Colour nebula wash */}
          <div className="absolute inset-0 opacity-90" style={{
            backgroundImage: `
              radial-gradient(ellipse 78% 62% at 10% 6%,  rgba(110,35,220,.30) 0%, transparent 62%),
              radial-gradient(ellipse 68% 58% at 88% 10%, rgba(210,45,135,.22) 0%, transparent 58%),
              radial-gradient(ellipse 62% 52% at 50% 94%, rgba(25,85,230,.20)  0%, transparent 58%)
            `,
            zIndex: 2,
          }} />

          {/* Slow-rotating nebula ring */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 2 }}>
            <div style={{
              width: '160vmax', height: '160vmax', borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,.035) 20%, rgba(236,72,153,.05) 40%, transparent 50%, rgba(59,130,246,.03) 70%, transparent 85%)',
              animation: 'nebula-rotate 100s linear infinite',
              filter: 'blur(50px)',
            }} />
          </div>

          {/* Subtle scanline sweep */}
          <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(168,85,247,.07), rgba(236,72,153,.05), transparent)',
              animation: 'scan-line 16s linear infinite', animationDelay: '5s',
            }} />
          </div>

          {/* Fine dot grids */}
          <div className="absolute inset-0 opacity-[0.17]" style={{ zIndex: 3, backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-0 opacity-[0.10]" style={{ zIndex: 3, backgroundImage: 'radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px)', backgroundSize: '68px 68px', backgroundPosition: '14px 20px' }} />

          {/* Ambient blobs */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <div className="absolute -top-32 left-[-120px] w-[520px] h-[520px] bg-purple-600/[0.16] rounded-full blur-3xl animate-blob" />
            <div className="absolute top-[-90px] right-[-140px] w-[560px] h-[560px] bg-pink-500/[0.12] rounded-full blur-3xl animate-blob" style={{ animationDelay: '2.5s' }} />
            <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 w-[620px] h-[620px] bg-blue-700/[0.09] rounded-full blur-3xl animate-blob" style={{ animationDelay: '5s' }} />
          </div>

          {/* Horizon floor glow */}
          <div className="absolute bottom-0 left-0 right-0 h-48" style={{ zIndex: 3, background: 'linear-gradient(to top, rgba(70,15,160,.2), transparent)' }} />
        </div>

        {/* ── Content ── */}
        <div className="relative" style={{ zIndex: 10 }}>

          {/* Desktop greeting */}
          <DesktopGreeting />

          {/* Dashboard nav */}
          <div className="relative h-[calc(100dvh-4rem)] overflow-hidden">
            <MobileDashboard
              navigationItems={updatedNavigationItems}
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
              setChatbotOpen={setChatbotOpen}
              chatbotOpen={chatbotOpen}
            />

            {/* Quick actions + profile */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 -mt-2 md:-mt-8">

              {/* Desktop: side-by-side */}
              <div className="hidden lg:grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <DashboardQuickActions />
                </div>
                <div>
                  <ProfileProgress className="h-full" />
                </div>
              </div>

              {/* Mobile / tablet: collapsible */}
              <div className="lg:hidden">
                <div className="fixed left-4 right-4 bottom-4 z-40">
                  <button
                    type="button"
                    data-open={showExtras ? 'true' : 'false'}
                    onClick={() => setShowExtras((v) => !v)}
                    className="toggle-btn"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Quick actions &amp; profile</span>
                    </span>
                    <ChevronDown className="toggle-chevron w-5 h-5 text-slate-400/70" />
                  </button>
                </div>

                {showExtras && (
                  <div className="fixed left-4 right-4 bottom-20 z-40 max-h-[70vh] overflow-auto rounded-3xl border border-white/10 bg-[#050615]/90 backdrop-blur-xl p-4 shadow-2xl shadow-black/60 extras-panel">
                    <div className="grid grid-cols-1 gap-6">
                      <DashboardQuickActions />
                      <ProfileProgress />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
