'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PageLoaderProps {
  children: React.ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== previousPath) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setPreviousPath(pathname);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [pathname, previousPath]);

  return (
    <div className="relative">
      {/* Page transition overlay */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md"
          >
            <ModernPageLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content with animation */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.22, 1, 0.36, 1],
          delay: isLoading ? 0 : 0.1
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ModernPageLoader() {
  return (
    <div className="relative w-full max-w-md mx-auto px-8">
      {/* Background effects matching UI theme */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -15, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main loader */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated logo */}
        <motion.div
          className="mb-8"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-pink-500/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Middle ring */}
            <motion.div
              className="absolute inset-2 w-8 h-8 rounded-full border-2 border-purple-500/50"
              animate={{
                scale: [1, 0.8, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
            
            {/* Inner core */}
            <motion.div
              className="absolute inset-3 w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
            />
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">Loading Page</h3>
          <motion.div
            className="flex gap-2 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-full"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
