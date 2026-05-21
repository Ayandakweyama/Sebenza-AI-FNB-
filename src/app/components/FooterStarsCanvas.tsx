'use client';

import React, { useEffect, useRef } from 'react';

const FooterStarsCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animId: number | null = null;
    let lastFrame = 0;
    let t = 0;
    let isTabVisible = document.visibilityState !== 'hidden';
    let isIntersecting = true;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    interface Star {
      x: number;
      y: number;
      z: number;
      speed: number;
      r: number;
      opacity: number;
      tw: number;
      ts: number;
      hue: number;
    }

    const buildStars = (): Star[] => {
      const stars: Star[] = Array.from({ length: 160 }, () => {
        const z = Math.random();
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z,
          speed: 0.06 + z * 0.26,
          r: 0.2 + z * 1.3,
          opacity: 0.14 + z * 0.6,
          tw: Math.random() * Math.PI * 2,
          ts: 0.003 + Math.random() * 0.009,
          hue: [240, 270, 300, 200][Math.floor(Math.random() * 4)],
        };
      });
      return stars;
    };

    let stars: Star[] = [];

    const rebuild = () => {
      resize();
      stars = buildStars();
    };

    const draw = (now: number) => {
      if (!isTabVisible || !isIntersecting) {
        animId = null;
        return;
      }

      if (now - lastFrame < 40) {
        animId = requestAnimationFrame(draw);
        return;
      }

      lastFrame = now;
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((s) => {
        s.y += s.speed * 0.4;
        if (s.y > canvas.height + 2) {
          s.y = -2;
          s.x = Math.random() * canvas.width;
        }

        const tw = 0.5 + 0.5 * Math.sin(t * s.ts + s.tw);
        const alpha = s.opacity * tw;

        if (s.z > 0.7) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          g.addColorStop(0, `hsla(${s.hue},70%,90%,${alpha * 0.5})`);
          g.addColorStop(1, `hsla(${s.hue},60%,70%,0)`);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},25%,98%,${alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (animId != null) return;
      animId = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (animId != null) cancelAnimationFrame(animId);
      animId = null;
    };

    const onVisibilityChange = () => {
      isTabVisible = document.visibilityState !== 'hidden';
      if (isTabVisible && isIntersecting) start();
      else stop();
    };

    const io = new IntersectionObserver(
      (entries) => {
        isIntersecting = entries.some((e) => e.isIntersecting);
        if (isTabVisible && isIntersecting) start();
        else stop();
      },
      { rootMargin: '240px 0px' },
    );

    rebuild();
    window.addEventListener('resize', rebuild);
    document.addEventListener('visibilitychange', onVisibilityChange);
    io.observe(canvas);
    start();

    return () => {
      stop();
      window.removeEventListener('resize', rebuild);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

export default FooterStarsCanvas;

