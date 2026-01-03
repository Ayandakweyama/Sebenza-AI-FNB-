'use client';

import { useRef, useCallback } from 'react';

/**
 * Custom hook to debounce function calls
 * Prevents rapid repeated calls during Fast Refresh or other rapid events
 */
export function useDebounce(callback: (...args: any[]) => any, delay: number) {
  const timeoutRef = useRef<any>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

/**
 * Custom hook to throttle function calls
 * Ensures function is called at most once per specified period
 */
export function useThrottle(callback: (...args: any[]) => any, delay: number) {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
}

/**
 * Custom hook to prevent duplicate rapid API calls
 * Combines debouncing with a flag to prevent concurrent calls
 */
export function usePreventDuplicateCalls(callback: (...args: any[]) => Promise<any>, delay: number = 1000) {
  const isCallingRef = useRef(false);
  const timeoutRef = useRef<any>();
  
  return useCallback(async (...args: any[]) => {
    // If already calling, debounce the next attempt
    if (isCallingRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
      
      return;
    }
    
    isCallingRef.current = true;
    
    try {
      const result = await callback(...args);
      return result;
    } finally {
      isCallingRef.current = false;
    }
  }, [callback, delay]);
}
