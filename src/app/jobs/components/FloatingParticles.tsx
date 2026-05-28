'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type Particle = {
  id: string;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

export function FloatingParticles({ count = 18 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i}-${Math.random().toString(16).slice(2)}`,
      left: `${Math.round(Math.random() * 100)}%`,
      top: `${Math.round(Math.random() * 100)}%`,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 2.5,
      duration: 6 + Math.random() * 9,
      opacity: 0.12 + Math.random() * 0.18,
    }));
  }, [count]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'rgba(255,255,255,1)',
            opacity: p.opacity,
            filter: 'blur(0.2px)',
          }}
          animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
