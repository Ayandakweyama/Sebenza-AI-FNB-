'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const RobotScene = dynamic(() => import('./RobotModel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
    </div>
  ),
});

const HeroRobotCanvas = () => {
  const robotMountRef = useRef<HTMLDivElement>(null);
  const [showRobot, setShowRobot] = useState(false);

  useEffect(() => {
    if (showRobot) return;
    const el = robotMountRef.current;
    if (!el) return;

    let cancelled = false;
    let idleId: number | null = null;

    const schedule = () => {
      if (cancelled) return;

      const run = () => {
        if (!cancelled) setShowRobot(true);
      };

      const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout?: number }) => number);
      if (ric) idleId = ric(run, { timeout: 2000 });
      else idleId = window.setTimeout(run, 250);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          schedule();
          io.disconnect();
        }
      },
      { rootMargin: '240px 0px' },
    );

    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      const cic = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
      if (idleId != null) {
        if (cic) cic(idleId);
        else clearTimeout(idleId);
      }
    };
  }, [showRobot]);

  return (
    <div ref={robotMountRef} className="relative w-full h-full" style={{ perspective: '1200px', zIndex: 5 }}>
      <div className="w-full h-full" style={{ transform: 'translateZ(0)' }}>
        {showRobot ? (
          <RobotScene />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroRobotCanvas;

