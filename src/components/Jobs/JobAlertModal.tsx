'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Search, MapPin, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlert?: (alertData: {
    name: string;
    keywords: string;
    location: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
  }) => Promise<void>;
  onUpdateAlert?: (alertId: string, alertData: {
    name: string;
    keywords: string;
    location: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
  }) => Promise<void>;
  editAlert?: {
    id: string;
    name: string;
    keywords: string;
    location: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
  } | null;
}

export default function JobAlertModal({ isOpen, onClose, onCreateAlert, onUpdateAlert, editAlert }: JobAlertModalProps) {
  const isEditMode = !!editAlert;
  
  const [formData, setFormData] = useState({
    name: editAlert?.name || '',
    keywords: editAlert?.keywords || '',
    location: editAlert?.location || '',
    frequency: editAlert?.frequency || 'weekly' as 'daily' | 'weekly' | 'monthly',
    isActive: editAlert?.isActive !== undefined ? editAlert.isActive : true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Alert name is required';
    }
    if (!formData.keywords.trim()) {
      newErrors.keywords = 'Keywords are required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editAlert && onUpdateAlert) {
        await onUpdateAlert(editAlert.id, formData);
      } else if (onCreateAlert) {
        await onCreateAlert(formData);
      }
      // Reset form
      setFormData({
        name: '',
        keywords: '',
        location: '',
        frequency: 'weekly',
        isActive: true
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} alert:`, error);
      setErrors({ submit: `Failed to ${isEditMode ? 'update' : 'create'} alert. Please try again.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">{isEditMode ? 'Edit Job Alert' : 'Create Job Alert'}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-purple-100 text-sm">
                {isEditMode ? 'Update your job alert preferences' : 'Get notified when new jobs match your criteria'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Alert Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Alert Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Frontend Developer Jobs"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Keywords *
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  placeholder="e.g., react, typescript, frontend"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Separate multiple keywords with commas
                </p>
                {errors.keywords && (
                  <p className="mt-1 text-sm text-red-400">{errors.keywords}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Cape Town, Remote"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-white">
                    Active Alert
                  </label>
                  <p className="text-xs text-slate-400">
                    Start receiving notifications immediately
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('isActive', !formData.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    formData.isActive ? 'bg-purple-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {isEditMode ? 'Update Alert' : 'Create Alert'}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
