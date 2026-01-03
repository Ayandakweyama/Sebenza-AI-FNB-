'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function PageTransition({ children, isLoading = false }: PageTransitionProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
        >
          <ModernPageLoader />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.1 
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModernPageLoader() {
  return (
    <div className="relative">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main loader content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo/Icon animation */}
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
              className="w-16 h-16 rounded-full border-2 border-purple-500/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Middle ring */}
            <motion.div
              className="absolute inset-2 w-12 h-12 rounded-full border-2 border-blue-500/50"
              animate={{
                scale: [1, 0.8, 1],
                opacity: [1, 0.8, 1],
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
              className="absolute inset-4 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"
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
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Loading Sebenza AI</h2>
          <motion.div
            className="flex gap-2 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1,
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
          className="mt-8 w-64"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
