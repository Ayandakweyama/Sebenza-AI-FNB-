'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

interface PrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
}

const defaultPrivacy: PrivacySettings = {
  profileVisibility: 'private',
  showEmail: false,
  showPhone: false,
};

export default function SecurityPrivacyPage() {
  const [privacy, setPrivacy] = useState<PrivacySettings>(defaultPrivacy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/profile/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setPrivacy({
            profileVisibility: data.settings.profileVisibility || 'private',
            showEmail: data.settings.showEmail || false,
            showPhone: data.settings.showPhone || false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof PrivacySettings) => {
    setPrivacy((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacy),
      });
      if (res.ok) {
        setMessage('Privacy settings saved successfully!');
      } else {
        setMessage('Failed to save privacy settings.');
      }
    } catch {
      setMessage('Error saving privacy settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const Toggle = ({ checked, onChange, color = 'red' }: { checked: boolean; onChange: () => void; color?: string }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className={`w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${color}-500`}></div>
    </label>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12 max-w-4xl">
        <DashboardNavigation
          title="Security & Privacy"
          description="Manage your account security and privacy settings"
        />

        <div className="space-y-6">
          {/* Password — handled by Clerk */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Password</h2>
                  <p className="text-slate-400 text-sm">
                    Your password is managed by Clerk authentication. Use the user menu in the top-right corner to change your password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold text-white">Privacy Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Eye className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-white">Profile Visibility</h3>
                    <p className="text-sm text-slate-400">Make your profile visible to recruiters</p>
                  </div>
                </div>
                <Toggle
                  checked={privacy.profileVisibility === 'public'}
                  onChange={() =>
                    setPrivacy((prev) => ({
                      ...prev,
                      profileVisibility: prev.profileVisibility === 'public' ? 'private' : 'public',
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-start gap-3">
                  <EyeOff className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-white">Show Email</h3>
                    <p className="text-sm text-slate-400">Display your email on your public profile</p>
                  </div>
                </div>
                <Toggle checked={privacy.showEmail} onChange={() => handleToggle('showEmail')} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-start gap-3">
                  <EyeOff className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-white">Show Phone</h3>
                    <p className="text-sm text-slate-400">Display your phone number on your public profile</p>
                  </div>
                </div>
                <Toggle checked={privacy.showPhone} onChange={() => handleToggle('showPhone')} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            {message && (
              <span className={`text-sm font-medium ${message.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : 'Save Privacy Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
