'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RouteTransitionProps {
  children: React.ReactNode;
  routeKey: string;
}

export default function RouteTransition({ children, routeKey }: RouteTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [children, routeKey]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={routeKey}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -20 }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full"
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>

      {/* Transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 pointer-events-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <motion.div
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: 'left' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing route transitions
export function useRouteTransition() {
  const [transitionKey, setTransitionKey] = useState(0);

  const triggerTransition = () => {
    setTransitionKey(prev => prev + 1);
  };

  return { transitionKey, triggerTransition };
}
