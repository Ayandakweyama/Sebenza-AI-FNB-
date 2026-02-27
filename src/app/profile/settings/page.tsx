'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';

interface AccountSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
}

const defaultSettings: AccountSettings = {
  emailNotifications: true,
  pushNotifications: true,
  jobAlerts: true,
  weeklyReports: true,
  marketingEmails: false,
  profileVisibility: 'private',
  showEmail: false,
  showPhone: false,
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
};

export default function AccountSettingsPage() {
  const [settings, setSettings] = useState<AccountSettings>(defaultSettings);
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
          setSettings({ ...defaultSettings, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof AccountSettings) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field: keyof AccountSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings.');
      }
    } catch {
      setMessage('Error saving settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
    </label>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12 max-w-4xl">
        <DashboardNavigation
          title="Account Settings"
          description="Manage your account preferences and notification settings"
        />

        <div className="space-y-8">
          {/* Notification Preferences */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Notification Preferences</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Email Notifications</h3>
                  <p className="text-sm text-slate-400">Receive important updates via email</p>
                </div>
                <Toggle checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <h3 className="font-medium text-white">Push Notifications</h3>
                  <p className="text-sm text-slate-400">Get instant updates on your device</p>
                </div>
                <Toggle checked={settings.pushNotifications} onChange={() => handleToggle('pushNotifications')} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <h3 className="font-medium text-white">Job Alerts</h3>
                  <p className="text-sm text-slate-400">Receive notifications for new job matches</p>
                </div>
                <Toggle checked={settings.jobAlerts} onChange={() => handleToggle('jobAlerts')} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <h3 className="font-medium text-white">Weekly Reports</h3>
                  <p className="text-sm text-slate-400">Receive a weekly summary of your activity</p>
                </div>
                <Toggle checked={settings.weeklyReports} onChange={() => handleToggle('weeklyReports')} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <h3 className="font-medium text-white">Marketing Emails</h3>
                  <p className="text-sm text-slate-400">Receive tips, product updates, and promotions</p>
                </div>
                <Toggle checked={settings.marketingEmails} onChange={() => handleToggle('marketingEmails')} />
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Display Preferences</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-slate-300 mb-2">
                  Language
                </label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="en">English</option>
                  <option value="af">Afrikaans</option>
                  <option value="zu">Zulu</option>
                  <option value="xh">Xhosa</option>
                </select>
              </div>

              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-slate-300 mb-2">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
