'use client';

import React, { useEffect, useRef } from 'react';

const HeroStarField: React.FC = () => {
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
      radius: number;
      opacity: number;
      twinkleOffset: number;
      twinkleSpeed: number;
      hue: number;
    }

    const buildStars = () => {
      const area = canvas.width * canvas.height;
      const n = Math.max(140, Math.min(320, Math.round(area / 5200)));
      const stars: Star[] = Array.from({ length: n }, () => {
        const z = Math.random();
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z,
          speed: 0.06 + z * 0.3,
          radius: 0.2 + z * 1.8,
          opacity: 0.14 + z * 0.7,
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.002 + Math.random() * 0.01,
          hue: [240, 270, 300, 200, 180][Math.floor(Math.random() * 5)],
        };
      });
      return stars;
    };

    const SPARKLE_COUNT = 18;
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

      if (now - lastFrame < 33) {
        animId = requestAnimationFrame(draw);
        return;
      }

      lastFrame = now;
      t++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s, i) => {
        s.y += s.speed * 0.5;
        s.x += (s.z - 0.5) * 0.055;

        if (s.y > canvas.height + 2) {
          s.y = -2;
          s.x = Math.random() * canvas.width;
        }

        if (s.x < -2) s.x = canvas.width + 2;
        if (s.x > canvas.width + 2) s.x = -2;

        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        const alpha = s.opacity * twinkle;

        if (i < SPARKLE_COUNT) {
          const arm = s.radius * 5;
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.globalAlpha = alpha * 0.9;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, arm);
          grad.addColorStop(0, `hsla(${s.hue},80%,96%,1)`);
          grad.addColorStop(1, `hsla(${s.hue},60%,70%,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, arm, s.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(0, 0, s.radius * 0.5, arm, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(0, 0, s.radius * 0.85, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},40%,100%,1)`;
          ctx.fill();
          ctx.restore();
        } else {
          if (s.z > 0.65) {
            const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 4);
            halo.addColorStop(0, `hsla(${s.hue},70%,90%,${alpha * 0.5})`);
            halo.addColorStop(1, `hsla(${s.hue},60%,70%,0)`);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = halo;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},30%,98%,${alpha})`;
          ctx.fill();
        }
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
      { rootMargin: '200px 0px' },
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

export default HeroStarField;

