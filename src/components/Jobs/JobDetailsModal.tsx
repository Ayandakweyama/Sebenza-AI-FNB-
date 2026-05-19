'use client';

import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Building2, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  ExternalLink,
  Clock,
  Bookmark,
  Heart,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { Job } from '@/hooks/useJobScraper';
import { useState } from 'react';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (job: Job) => void;
  onSave?: (job: Job) => void;
  onSkip?: (job: Job) => void;
}

const JobDetailsModal = memo(function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onApply,
  onSave
}: JobDetailsModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!job) return null;

  // Handle save
  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(job);
  };

  // Handle apply - disabled for now
  const handleApply = () => {
    // Coming soon - AI agent will handle applications
    // onApply?.(job);
    // if (job.url) {
    //   window.open(job.url, '_blank');
    // }
  };

  // Handle copy link
  const handleCopyLink = async () => {
    if (job.url) {
      try {
        await navigator.clipboard.writeText(job.url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share && job.url) {
      navigator.share({
        title: job.title,
        text: `Check out this job at ${job.company}: ${job.title}`,
        url: job.url,
      }).catch(console.error);
    } else {
      handleCopyLink();
    }
  };

  // Format salary
  const formatSalary = (salary: string) => {
    if (!salary || salary.toLowerCase().includes('not specified')) {
      return 'Salary not specified';
    }
    return salary;
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently posted';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Parse and format description
  const formatDescription = (description: string): string[] => {
    if (!description) return ['No description available'];
    
    // Split by common separators and create paragraphs
    const paragraphs = description
      .split(/\n\n|\r\n\r\n|\.(?=\s*[A-Z])|(?:\s*•\s*)|(?:\s*-\s*)/)
      .filter(p => p.trim().length > 10)
      .map(p => p.trim());

    // Return at least one paragraph
    return paragraphs.length > 0 ? paragraphs : [description.trim() || 'No description available'];
  };

  const descriptionParagraphs = formatDescription(job.description || '');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Job header info */}
              <div className="pr-16">
                <h1 className="text-3xl font-bold mb-3 leading-tight">
                  {job.title}
                </h1>
                
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6" />
                  <span className="text-xl font-medium">{job.company}</span>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{formatDate(job.postedDate)}</span>
                  </div>
                  {job.source && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      <span className="capitalize">{job.source}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-200px)]">
              {/* Main content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Job details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-700">Salary</h3>
                    </div>
                    <p className="text-green-800 font-semibold text-xl">
                      {formatSalary(job.salary)}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-700">Job Type</h3>
                    </div>
                    <p className="text-blue-800 font-semibold text-xl">
                      {job.jobType || 'Full-time'}
                    </p>
                  </div>

                  {job.industry && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-700">Industry</h3>
                      </div>
                      <p className="text-blue-800 font-semibold text-xl">
                        {job.industry}
                      </p>
                    </div>
                  )}

                  {job.reference && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-6 h-6 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-700">Reference</h3>
                      </div>
                      <p className="text-gray-800 font-mono text-sm">
                        {job.reference}
                      </p>
                    </div>
                  )}
                </div>

                {/* Job description */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Job Description</h3>
                  <div className="prose prose-lg max-w-none">
                    {descriptionParagraphs.length > 0 ? (
                      descriptionParagraphs.map((paragraph: string, index: number) => (
                        <p key={index} className="text-gray-700 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No description available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar actions */}
              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Actions</h3>
                
                <div className="space-y-4">
                  {/* Apply button - Coming Soon */}
                  <div className="relative">
                    <motion.button
                      disabled
                      className="w-full bg-gray-400 cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 opacity-60"
                    >
                      <Heart className="w-6 h-6" />
                      Apply for this job
                    </motion.button>
                    <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-blue-700">AI Agent Coming Soon!</span>
                      </div>
                      <p className="text-xs text-gray-700">
                        Our self-applying AI agent will automatically apply to jobs for you. Available exclusively for Pro users.
                      </p>
                    </div>
                  </div>

                  {/* Save button */}
                  <motion.button
                    onClick={handleSave}
                    className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 ${
                      isSaved 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save job'}
                  </motion.button>

                  {/* Share button */}
                  <motion.button
                    onClick={handleShare}
                    className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-5 h-5 text-green-600" />
                        Link copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-5 h-5" />
                        Share job
                      </>
                    )}
                  </motion.button>

                  {/* Copy link button */}
                  {job.url && (
                    <motion.button
                      onClick={handleCopyLink}
                      className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Copy className="w-5 h-5" />
                      Copy link
                    </motion.button>
                  )}

                  {/* View original button */}
                  {job.url && (
                    <motion.button
                      onClick={() => window.open(job.url, '_blank')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ExternalLink className="w-5 h-5" />
                      View original
                    </motion.button>
                  )}
                </div>

                {/* Additional info */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
                  <p className="text-sm text-blue-800">
                    Tailor your application to highlight relevant experience mentioned in the job description.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export { JobDetailsModal };
