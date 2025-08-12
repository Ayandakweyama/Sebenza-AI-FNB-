'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TinderJobInterface } from '@/components/Jobs/TinderJobInterface';
import { JobSearchResults } from '@/app/components/Jobs/JobSearchResults';
import { LayoutGrid, Heart, Search } from 'lucide-react';

type ViewMode = 'tinder' | 'list';

export default function AllJobsClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('tinder');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header with view toggle */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Find Your Next Opportunity
              </h1>
              <p className="text-gray-600 mt-2">
                Discover and apply to jobs from multiple sources
              </p>
            </div>

            {/* View mode toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
              <motion.button
                onClick={() => setViewMode('tinder')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'tinder'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart className="w-5 h-5" />
                Swipe Mode
              </motion.button>
              
              <motion.button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LayoutGrid className="w-5 h-5" />
                List Mode
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="flex-1">
        {viewMode === 'tinder' ? (
          <TinderJobInterface 
            initialQuery="software engineer"
            initialLocation="South Africa"
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <JobSearchResults 
              initialQuery="software engineer"
              initialLocation="South Africa"
              onJobSelect={(job) => console.log('Selected job:', job)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
