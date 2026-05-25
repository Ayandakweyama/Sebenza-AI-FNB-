'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type RoadmapStep = {
  title: string;
  content: string;
};

function parseRoadmapSteps(markdown: string): RoadmapStep[] {
  const normalized = (markdown || '').replace(/\r\n/g, '\n');
  const parts = normalized.split(/\n(?=###\s*Step\s+\d+)/g);

  const steps: RoadmapStep[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const titleMatch = trimmed.match(/^###\s*(Step\s+\d+[^\n]*)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();
    const content = trimmed.replace(/^###\s*Step\s+\d+[^\n]*\n?/, '').trim();
    steps.push({ title, content });
  }

  return steps;
}

export default function RoadmapStepViewer({ markdown }: { markdown: string }) {
  const steps = useMemo(() => parseRoadmapSteps(markdown), [markdown]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  if (steps.length < 2) {
    return (
      <div className="prose prose-invert max-w-none">
        <MarkdownRenderer content={markdown} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
          {steps.map((s, idx) => (
            <button
              key={`${s.title}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={[
                'shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
                idx === activeIndex
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-slate-900/20 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600'
              ].join(' ')}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((v) => Math.max(0, v - 1))}
            disabled={activeIndex === 0}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900/40 border border-slate-700/60 text-slate-200 hover:bg-slate-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((v) => Math.min(steps.length - 1, v + 1))}
            disabled={activeIndex === steps.length - 1}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900/40 border border-slate-700/60 text-slate-200 hover:bg-slate-900/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative perspective-1000">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key={active.title}
              initial={{ opacity: 0, rotateY: 28, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, rotateY: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -18, y: -12, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-pink-500/8 to-blue-500/10 shadow-2xl shadow-pink-500/15 backdrop-blur-xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/22 via-purple-500/10 to-transparent opacity-70" />
              <div className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">{active.title}</h3>
                  <div className="text-xs text-slate-300">
                    {activeIndex + 1}/{steps.length}
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={active.content} />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
