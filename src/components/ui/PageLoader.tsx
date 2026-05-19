'use client';

import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface PageLoaderProps {
  children: React.ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);
  const [loadPhase, setLoadPhase] = useState<'enter' | 'active' | 'exit'>('enter');

  useEffect(() => {
    if (pathname !== previousPath) {
      setIsLoading(true);
      setLoadPhase('enter');

      const activeTimer = setTimeout(() => setLoadPhase('active'), 200);
      const exitTimer = setTimeout(() => setLoadPhase('exit'), 600);
      const doneTimer = setTimeout(() => {
        setIsLoading(false);
        setPreviousPath(pathname);
      }, 900);

      return () => {
        clearTimeout(activeTimer);
        clearTimeout(exitTimer);
        clearTimeout(doneTimer);
      };
    }
  }, [pathname, previousPath]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="page-loader-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            {/* Layered ambient background */}
            <div className="absolute inset-0 bg-background/75" />
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{
                background: `
                  radial-gradient(ellipse 60% 50% at 25% 20%, rgba(236, 72, 153, 0.12) 0%, transparent 70%),
                  radial-gradient(ellipse 50% 60% at 75% 80%, rgba(139, 92, 246, 0.10) 0%, transparent 70%),
                  radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168, 85, 247, 0.06) 0%, transparent 60%)
                `
              }}
            />

            {/* Subtle noise texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '128px'
              }}
            />

            <TransitionLoader phase={loadPhase} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1],
          delay: isLoading ? 0 : 0.05,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── Orbital Loader ────────────────────────────────────────────────── */

function TransitionLoader({ phase }: { phase: 'enter' | 'active' | 'exit' }) {
  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, [0, 1], ['0%', '100%']);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctrl = animate(progress, 1, {
      duration: 0.85,
      ease: [0.4, 0, 0.2, 1],
      onUpdate(latest) {
        if (counterRef.current) {
          counterRef.current.textContent = `${Math.round(latest * 100)}`;
        }
      },
    });
    return () => ctrl.stop();
  }, [progress]);

  return (
    <div className="relative flex flex-col items-center" style={{ width: 340 }}>
      {/* Card shell */}
      <motion.div
        className="relative w-full overflow-hidden"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          borderRadius: 20,
          background: 'rgba(var(--background-rgb, 255 255 255) / 0.06)',
          border: '1px solid rgba(255 255 255 / 0.10)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.4 }}
        />

        <div className="px-10 py-10 flex flex-col items-center gap-8">
          {/* Orbital spinner */}
          <OrbitalSpinner />

          {/* Label + counter */}
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex items-baseline justify-between w-full">
              <motion.span
                className="text-sm font-medium tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Loading
              </motion.span>
              <motion.div
                className="flex items-baseline gap-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <span
                  ref={counterRef}
                  className="text-2xl font-semibold tabular-nums"
                  style={{
                    background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  0
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>%</span>
              </motion.div>
            </div>

            {/* Track */}
            <div
              className="w-full rounded-full overflow-hidden"
              style={{
                height: 3,
                background: 'rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.2)',
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: progressWidth,
                  background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #ec4899)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 0 8px rgba(168,85,247,0.6)',
                }}
                animate={{ backgroundPosition: ['0% 0', '100% 0'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ambient glow beneath card */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: 180,
          height: 24,
          background: 'radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5], scaleX: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ── Three-ring orbital system ─────────────────────────────────────── */

function OrbitalSpinner() {
  return (
    <div className="relative" style={{ width: 88, height: 88, perspective: 900 }}>
      {/* Outer ring — slow rotation, tilted plane */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: '1.5px solid transparent',
          borderTopColor: 'rgba(236,72,153,0.7)',
          borderRightColor: 'rgba(236,72,153,0.2)',
          rotateX: 55,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Middle ring — counter-rotate, different tilt */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 12,
          border: '1.5px solid transparent',
          borderTopColor: 'rgba(139,92,246,0.8)',
          borderBottomColor: 'rgba(139,92,246,0.2)',
          rotateX: -45,
          rotateZ: 30,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner ring — fastest */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 24,
          border: '1.5px solid transparent',
          borderLeftColor: 'rgba(167,139,250,0.9)',
          borderRightColor: 'rgba(167,139,250,0.15)',
          rotateY: 60,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Core pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{
            width: 18,
            height: 18,
            background: 'radial-gradient(circle at 35% 35%, #f9a8d4, #7c3aed)',
            boxShadow: '0 0 16px rgba(124,58,237,0.7), 0 0 4px rgba(249,168,212,0.5)',
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Orbiting dot on outer ring */}
      <motion.div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transformOrigin: '0 0',
          marginLeft: -3,
          marginTop: -3,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      >
        <motion.div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#f472b6',
            transform: 'translateX(38px)',
            boxShadow: '0 0 8px rgba(244,114,182,0.9)',
          }}
        />
      </motion.div>

      {/* Orbiting dot on middle ring */}
      <motion.div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transformOrigin: '0 0',
          marginLeft: -2.5,
          marginTop: -2.5,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
      >
        <motion.div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#a78bfa',
            transform: 'translateX(26px)',
            boxShadow: '0 0 6px rgba(167,139,250,0.9)',
          }}
        />
      </motion.div>
    </div>
  );
}