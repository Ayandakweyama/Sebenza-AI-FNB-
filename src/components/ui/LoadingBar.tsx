'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  progress?: number;
}

export default function LoadingBar({ isLoading, progress = 0 }: LoadingBarProps) {
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // Simulate progress when not explicitly provided
      if (progress === 0) {
        const interval = setInterval(() => {
          setInternalProgress(prev => {
            const next = prev + Math.random() * 15;
            return next > 90 ? 90 : next;
          });
        }, 200);

        return () => clearInterval(interval);
      }
    } else {
      setInternalProgress(100);
      const timeout = setTimeout(() => setInternalProgress(0), 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, progress]);

  const actualProgress = progress > 0 ? progress : internalProgress;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-slate-800/50 backdrop-blur-sm">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 relative"
          style={{ width: `${actualProgress}%` }}
          initial={{ width: "0%" }}
          animate={{ width: `${actualProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Glow effect */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-purple-500/50 to-transparent"
            animate={{
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Full-screen loading overlay with progress bar
export function FullScreenLoading({ isLoading, progress }: LoadingBarProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md"
        >
          {/* Background animation */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                x: [0, -30, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Loading content */}
          <div className="relative z-10 w-full max-w-md px-8">
            {/* Logo animation */}
            <motion.div
              className="mb-8 flex justify-center"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/20 rounded-lg" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-purple-500/30"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>

            {/* Loading text */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">Loading Amazing Content</h2>
              <p className="text-slate-400">Please wait while we prepare everything for you...</p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Loading</span>
                <span>{Math.round(progress || 0)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative"
                  style={{ width: `${progress || 0}%` }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress || 0}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Loading dots */}
            <motion.div
              className="flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
