'use client';

import { useState, useEffect } from 'react';
import JobsContainer from '@/app/components/Jobs/JobsContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrendingUp, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function JobsPage() {
  const [stats, setStats] = useState({
    saved: 0,
    viewed: 0,
    avgMatch: 0,
    lastUpdated: new Date()
  });

  // Mock data for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        saved: Math.min(prev.saved + Math.floor(Math.random() * 2), 5),
        viewed: Math.min(prev.viewed + Math.floor(Math.random() * 3), 10),
        avgMatch: Math.min(prev.avgMatch + (Math.random() * 5 - 2), 95),
        lastUpdated: new Date()
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24">
      <section className="container mx-auto px-4 py-8">
        {/* Stats Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Find Your Perfect Job
              </h1>
              <p className="text-muted-foreground mt-2">
                Swipe to explore opportunities that match your profile
              </p>
            </div>
            
            {/* Stats Overview */}
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-slate-100 w-full md:w-auto"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <FiTrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Saved Jobs</p>
                      <p className="text-lg font-semibold text-slate-800">{stats.saved}</p>
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-200" />
                  
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FiCheckCircle className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Avg. Match</p>
                      <p className="text-lg font-semibold text-slate-800">{Math.round(stats.avgMatch)}%</p>
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-200" />
                  
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <FiClock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Last Updated</p>
                      <p className="text-sm font-medium text-slate-700">{formatTimeAgo(stats.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <p className="text-muted-foreground max-w-2xl">
            Our AI analyzes your profile to surface the most relevant opportunities. 
            Swipe right to save jobs you're interested in.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <JobsContainer />
        </div>
      </section>
    </main>
  );
}
