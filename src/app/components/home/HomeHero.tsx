import React from 'react';
import { CheckCircle } from 'lucide-react';
import HeroStarField from './HeroStarField';
import HeroRobotCanvas from './HeroRobotCanvas';

/* ─── Orbit Ring ─────────────────────────────────────────────────────────────── */
const OrbitRing: React.FC<{
  size: string; duration: string; color: string; delay?: string; tilt?: string;
}> = ({ size, duration, color, delay = '0s', tilt = 'rotateX(72deg)' }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: '900px' }}>
    <div style={{
      width: size, height: size,
      border: `1px solid ${color}`,
      borderRadius: '50%',
      transform: tilt,
      animation: `orbit-spin ${duration} linear infinite`,
      animationDelay: delay,
      boxShadow: `0 0 12px 1px ${color}`,
    }} />
  </div>
);

/* ─── HeroSection ────────────────────────────────────────────────────────────── */
const HeroSection = () => {
  return (
    <>
      <style>{`
        @keyframes orbit-spin     { from{transform:rotateX(72deg) rotateZ(0deg)}     to{transform:rotateX(72deg) rotateZ(360deg)} }
        @keyframes orbit-spin-b   { from{transform:rotateX(55deg) rotateZ(0deg)}     to{transform:rotateX(55deg) rotateZ(-360deg)} }
        @keyframes orbit-spin-c   { from{transform:rotateX(80deg) rotateY(20deg) rotateZ(0deg)} to{transform:rotateX(80deg) rotateY(20deg) rotateZ(360deg)} }
        @keyframes float-hero     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-20px)} }
        @keyframes glow-pulse     { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.85;transform:scale(1.14)} }
        @keyframes gradient-shift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes blob           { 0%,100%{border-radius:60% 40% 55% 45%/60% 55% 45% 40%} 33%{border-radius:40% 60% 45% 55%/45% 40% 60% 55%} 66%{border-radius:55% 45% 60% 40%/55% 60% 40% 45%} }
        @keyframes particle-float { 0%{transform:translateY(0) translateX(0) scale(1);opacity:.7} 50%{transform:translateY(-30px) translateX(8px) scale(1.25);opacity:1} 100%{transform:translateY(-60px) translateX(-4px) scale(.75);opacity:0} }
        @keyframes text-reveal    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes badge-reveal   { from{opacity:0;transform:translateY(16px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes nebula-rotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scan-line      { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }

        .hero-title-1 { animation: text-reveal .9s cubic-bezier(.16,1,.3,1) .3s both }
        .hero-title-2 { animation: text-reveal .9s cubic-bezier(.16,1,.3,1) .5s both }
        .hero-body    { animation: text-reveal .9s cubic-bezier(.16,1,.3,1) .7s both }
        .hero-badge-0 { animation: badge-reveal .7s cubic-bezier(.16,1,.3,1) .9s both }
        .hero-badge-1 { animation: badge-reveal .7s cubic-bezier(.16,1,.3,1) 1.05s both }
        .hero-badge-2 { animation: badge-reveal .7s cubic-bezier(.16,1,.3,1) 1.2s both }
        .hero-robot   { animation: float-hero 7s ease-in-out infinite }

        .animate-gradient-shift { animation: gradient-shift 14s ease infinite; background-size:200% 200% }
        .animate-blob           { animation: blob 11s ease-in-out infinite }
      `}</style>

      <section className="min-h-screen pt-[60px] md:pt-[80px] lg:pt-[60px] bg-[#03040f] flex items-start md:items-center justify-center relative overflow-hidden">

        {/* ── Stars ── */}
        <HeroStarField />

        {/* ── Colour nebula wash ── */}
        <div className="absolute inset-0 animate-gradient-shift pointer-events-none" style={{
          backgroundImage: `
            radial-gradient(ellipse 75% 60% at 12% 8%,  rgba(110,35,220,.30) 0%, transparent 62%),
            radial-gradient(ellipse 65% 55% at 85% 12%, rgba(210,45,135,.22) 0%, transparent 58%),
            radial-gradient(ellipse 60% 50% at 50% 92%, rgba(25,85,230,.20)  0%, transparent 58%)
          `,
          zIndex: 2,
        }} />

        {/* ── Slow-rotating nebula ring (purely atmospheric) ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
          <div style={{
            width: '140vmax', height: '140vmax',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,.04) 20%, rgba(236,72,153,.06) 40%, transparent 50%, rgba(59,130,246,.04) 70%, transparent 85%)',
            animation: 'nebula-rotate 90s linear infinite',
            filter: 'blur(40px)',
          }} />
        </div>

        {/* ── Subtle scanline shimmer ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(168,85,247,.08), rgba(236,72,153,.06), transparent)',
            animation: 'scan-line 12s linear infinite',
            animationDelay: '4s',
          }} />
        </div>

        {/* ── Fine dot grid ── */}
        <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ zIndex: 2, backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* ── Ambient blobs ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
          <div className="absolute -top-32 left-[-100px] w-[500px] h-[500px] bg-purple-600/18 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-[-80px] right-[-130px] w-[540px] h-[540px] bg-pink-500/14 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2.5s' }} />
          <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '5s' }} />
        </div>

        {/* ── Horizon floor glow ── */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ zIndex: 2, background: 'linear-gradient(to top, rgba(70,15,160,.22), transparent)' }} />

        {/* ── Main layout ── */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:-mt-6" style={{ zIndex: 10 }}>
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-16">

            {/* ── Left: Raw text, no card ── */}
            <div className="flex-1 w-full text-center lg:text-left">

              {/* Eyebrow tag */}
              <div className="hero-badge-0 inline-flex items-center gap-2 mb-6">
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '5px 14px 5px 10px',
                  borderRadius: '100px',
                  border: '1px solid rgba(168,85,247,.3)',
                  background: 'rgba(168,85,247,.08)',
                  fontSize: '12px', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase',
                  color: 'rgba(200,170,255,.9)',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(168,85,247,1)', boxShadow: '0 0 8px rgba(168,85,247,1)', flexShrink: 0 }} />
                  Powered by advanced AI
                </span>
              </div>

              <h1 className="font-bold text-white leading-[1.04] tracking-tight mb-6">
                <span className="hero-title-1 block text-[clamp(2.6rem,7vw,5rem)]" style={{
                  background: 'linear-gradient(105deg, #fff 30%, rgba(216,180,254,.85) 60%, rgba(249,168,212,.7) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  AI-Powered Career
                </span>
                <span className="hero-title-2 block text-[clamp(2.6rem,7vw,5rem)]" style={{
                  background: 'linear-gradient(105deg, rgba(232,121,249,.9) 0%, rgba(167,139,250,.85) 45%, rgba(255,255,255,.75) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Acceleration
                </span>
              </h1>

              <p className="hero-body text-[clamp(1rem,2.2vw,1.25rem)] leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8" style={{ color: 'rgba(209,213,219,.8)' }}>
                Transform your job search with intelligent resume analysis, personalized cover letters,
                and strategic career guidance powered by advanced AI technology.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {['Free Trial', 'No Credit Card', 'Instant Setup'].map((text, i) => (
                  <div
                    key={i}
                    className={`hero-badge-${i} inline-flex items-center gap-2 text-sm`}
                    style={{
                      padding: '8px 16px', borderRadius: '100px',
                      border: '1px solid rgba(255,255,255,.08)',
                      background: 'rgba(255,255,255,.04)',
                      color: 'rgba(209,213,219,.85)',
                    }}
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Robot – no card wrapper ── */}
            <div
              className="hero-robot flex-1 w-full h-[420px] sm:h-[480px] lg:h-[560px] relative"
              style={{ animationDelay: '0.8s', transformStyle: 'preserve-3d' }}
            >
              {/* Deep ambient orb */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
                <div style={{
                  width: '72%', height: '72%', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(139,92,246,.2) 0%, rgba(80,40,200,.08) 50%, transparent 70%)',
                  filter: 'blur(36px)',
                  animation: 'glow-pulse 4.5s ease-in-out infinite',
                }} />
              </div>

              {/* Secondary pink orb offset */}
              <div className="absolute pointer-events-none" style={{
                top: '20%', right: '5%', width: '45%', height: '45%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(236,72,153,.12) 0%, transparent 70%)',
                filter: 'blur(28px)',
                animation: 'glow-pulse 6s ease-in-out infinite',
                animationDelay: '2s',
                zIndex: 1,
              }} />

              {/* Orbiting rings */}
              <OrbitRing size="88%"  duration="15s" color="rgba(168,85,247,.30)" delay="0s"   tilt="rotateX(72deg)" />
              <OrbitRing size="70%"  duration="9s"  color="rgba(236,72,153,.22)" delay="-3s"  tilt="rotateX(55deg) rotateZ(30deg)" />
              <OrbitRing size="108%" duration="22s" color="rgba(59,130,246,.16)" delay="-7s"  tilt="rotateX(80deg) rotateY(18deg)" />

              {/* Floating particles */}
              {[
                { top:'16%', left:'10%', color:'rgba(168,85,247,.95)', size:5, dur:'3.2s', del:'0s'    },
                { top:'68%', left:'7%',  color:'rgba(236,72,153,.85)', size:4, dur:'4.0s', del:'-1.6s' },
                { top:'28%', left:'90%', color:'rgba(99,210,255,.9)',  size:6, dur:'3.6s', del:'-0.9s' },
                { top:'78%', left:'86%', color:'rgba(168,85,247,.75)', size:3, dur:'5.2s', del:'-2.4s' },
                { top:'8%',  left:'52%', color:'rgba(255,175,115,.8)', size:4, dur:'2.8s', del:'-1.1s' },
                { top:'50%', left:'2%',  color:'rgba(99,210,255,.7)',  size:3, dur:'4.5s', del:'-3s'   },
              ].map((p, i) => (
                <div key={i} className="absolute rounded-full pointer-events-none" style={{
                  top: p.top, left: p.left,
                  width: p.size, height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                  animation: `particle-float ${p.dur} ease-in-out infinite`,
                  animationDelay: p.del,
                  zIndex: 3,
                }} />
              ))}

              {/* Ground shadow ellipse */}
              <div className="absolute pointer-events-none" style={{
                bottom: '-18px', left: '50%', transform: 'translateX(-50%)',
                width: '70%', height: '40px',
                background: 'radial-gradient(ellipse, rgba(139,92,246,.5) 0%, transparent 70%)',
                filter: 'blur(16px)',
                animation: 'glow-pulse 4s ease-in-out infinite',
                animationDelay: '0.5s',
                zIndex: 1,
              }} />

              {/* Robot scene – completely frameless */}
              <HeroRobotCanvas />
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
