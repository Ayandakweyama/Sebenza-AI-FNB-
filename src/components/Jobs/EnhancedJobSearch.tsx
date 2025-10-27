'use client';

import { useState, useCallback } from 'react';
import { Search, MapPin, Filter, Briefcase, DollarSign, Clock, Building2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedJobSearchProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

export interface SearchParams {
  query: string;
  location: string;
  jobType?: string;
  salaryRange?: string;
  experience?: string;
  remote?: boolean;
  sources?: string[];
  maxPages?: number;
}

export function EnhancedJobSearch({ onSearch, isLoading = false }: EnhancedJobSearchProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('South Africa');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [jobType, setJobType] = useState('all');
  const [salaryRange, setSalaryRange] = useState('all');
  const [experience, setExperience] = useState('all');
  const [remote, setRemote] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(['indeed', 'pnet', 'careerjunction', 'linkedin']);
  const [maxPages, setMaxPages] = useState(2);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && location.trim()) {
      onSearch({
        query,
        location,
        jobType: jobType !== 'all' ? jobType : undefined,
        salaryRange: salaryRange !== 'all' ? salaryRange : undefined,
        experience: experience !== 'all' ? experience : undefined,
        remote,
        sources: selectedSources,
        maxPages
      });
    }
  }, [query, location, jobType, salaryRange, experience, remote, selectedSources, maxPages, onSearch]);

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Main Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex-1 md:max-w-xs relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {isLoading ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Briefcase className="inline w-4 h-4 mr-1" />
                      Job Type
                    </label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="freelance">Freelance</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <DollarSign className="inline w-4 h-4 mr-1" />
                      Salary Range
                    </label>
                    <select
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">Any Salary</option>
                      <option value="0-50k">R0 - R50,000</option>
                      <option value="50k-100k">R50,000 - R100,000</option>
                      <option value="100k-200k">R100,000 - R200,000</option>
                      <option value="200k+">R200,000+</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Clock className="inline w-4 h-4 mr-1" />
                      Experience Level
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="entry">Entry Level</option>
                      <option value="junior">Junior (1-3 years)</option>
                      <option value="mid">Mid-Level (3-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                      <option value="lead">Lead/Principal</option>
                    </select>
                  </div>
                </div>

                {/* Job Sources */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Building2 className="inline w-4 h-4 mr-1" />
                    Job Sources
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['indeed', 'pnet', 'careerjunction', 'linkedin'].map(source => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => toggleSource(source)}
                        className={`px-3 py-1 rounded-lg border transition-all ${
                          selectedSources.includes(source)
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {source.charAt(0).toUpperCase() + source.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remote}
                      onChange={(e) => setRemote(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-300">Remote Jobs Only</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300">Pages to search:</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={maxPages}
                      onChange={(e) => setMaxPages(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
