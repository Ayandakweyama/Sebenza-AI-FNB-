'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  User, 
  Settings, 
  Target, 
  FileText, 
  CreditCard, 
  Shield, 
  Edit3, 
  BarChart3, 
  Rocket,
  Save,
  Loader2
} from 'lucide-react';

interface ProfileSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export default function ProfileSettings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    }
  };

  const sections: ProfileSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'View and manage your profile information',
      icon: <User className="h-5 w-5" />,
      component: <ProfileSection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your notification preferences and account settings',
      icon: <Settings className="h-5 w-5" />,
      component: <AccountSettingsSection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'job-preferences',
      title: 'Job Preferences',
      description: 'Set your job search criteria and career goals',
      icon: <Target className="h-5 w-5" />,
      component: <JobPreferencesSection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'documents',
      title: 'Resume & Documents',
      description: 'Upload and manage your resumes and cover letters',
      icon: <FileText className="h-5 w-5" />,
      component: <DocumentsSection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'subscription',
      title: 'Subscription & Billing',
      description: 'Manage your subscription plan and payment methods',
      icon: <CreditCard className="h-5 w-5" />,
      component: <SubscriptionSection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage your account security and privacy settings',
      icon: <Shield className="h-5 w-5" />,
      component: <SecuritySection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'skills',
      title: 'Skills Assessment',
      description: 'Evaluate and showcase your professional skills',
      icon: <BarChart3 className="h-5 w-5" />,
      component: <SkillsSection userData={userData} onUpdate={fetchUserData} />
    },
    {
      id: 'career',
      title: 'Career Journey',
      description: 'Track and plan your professional growth and achievements',
      icon: <Rocket className="h-5 w-5" />,
      component: <CareerJourneySection userData={userData} onUpdate={fetchUserData} />
    }
  ];

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {currentSection?.title}
                </h1>
                <p className="text-slate-400">
                  {currentSection?.description}
                </p>
              </div>
              
              <div className="mt-6">
                {currentSection?.component}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Section Component
function ProfileSection({ userData, onUpdate }: { userData: any; onUpdate: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    title: '',
    company: '',
    linkedinUrl: '',
    githubUrl: '',
    websiteUrl: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData?.profile) {
      setFormData({
        firstName: userData.profile.firstName || '',
        lastName: userData.profile.lastName || '',
        email: userData.email || '',
        phone: userData.profile.phone || '',
        location: userData.profile.location || '',
        bio: userData.profile.bio || '',
        title: userData.profile.title || '',
        company: userData.profile.company || '',
        linkedinUrl: userData.profile.linkedinUrl || '',
        githubUrl: userData.profile.githubUrl || '',
        websiteUrl: userData.profile.websiteUrl || ''
      });
    }
  }, [userData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: formData })
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        onUpdate();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Social Links</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            GitHub URL
          </label>
          <input
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// Account Settings Section
function AccountSettingsSection({ userData, onUpdate }: { userData: any; onUpdate: () => void }) {
  const [settings, setSettings] = useState({
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
    dateFormat: 'MM/DD/YYYY'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData?.accountSettings) {
      setSettings(userData.accountSettings);
    }
  }, [userData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/account-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings updated successfully');
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get instant updates on your device' },
            { key: 'jobAlerts', label: 'Job Alerts', desc: 'Notifications for new job matches' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Summary of your job search activity' },
            { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional content and newsletters' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Privacy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="connections">Connections Only</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Show Email</p>
                <p className="text-sm text-slate-400">Display email on public profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showEmail}
                  onChange={(e) => setSettings({ ...settings, showEmail: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Show Phone</p>
                <p className="text-sm text-slate-400">Display phone on public profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPhone}
                  onChange={(e) => setSettings({ ...settings, showPhone: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

// Job Preferences Section
function JobPreferencesSection({ userData, onUpdate }: { userData: any; onUpdate: () => void }) {
  const [preferences, setPreferences] = useState({
    desiredRoles: [] as string[],
    industries: [] as string[],
    locations: [] as string[],
    remoteWork: false,
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: 'USD',
    careerLevel: '',
    jobType: [] as string[],
    companySize: [] as string[]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userData?.jobPreferences) {
      setPreferences({
        ...userData.jobPreferences,
        desiredRoles: userData.jobPreferences.desiredRoles || [],
        industries: userData.jobPreferences.industries || [],
        locations: userData.jobPreferences.locations || [],
        jobType: userData.jobPreferences.jobType || [],
        companySize: userData.jobPreferences.companySize || []
      });
    }
  }, [userData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/job-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Job preferences updated');
        onUpdate();
      }
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Desired Job Roles
        </label>
        <input
          type="text"
          placeholder="e.g., Software Engineer, Data Analyst (comma separated)"
          value={preferences.desiredRoles.join(', ')}
          onChange={(e) => setPreferences({ 
            ...preferences, 
            desiredRoles: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
          })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Preferred Industries
        </label>
        <input
          type="text"
          placeholder="e.g., Technology, Finance, Healthcare (comma separated)"
          value={preferences.industries.join(', ')}
          onChange={(e) => setPreferences({ 
            ...preferences, 
            industries: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
          })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Preferred Locations
        </label>
        <input
          type="text"
          placeholder="e.g., Cape Town, Johannesburg, Remote (comma separated)"
          value={preferences.locations.join(', ')}
          onChange={(e) => setPreferences({ 
            ...preferences, 
            locations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
          })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="remote"
          checked={preferences.remoteWork}
          onChange={(e) => setPreferences({ ...preferences, remoteWork: e.target.checked })}
          className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded"
        />
        <label htmlFor="remote" className="text-white">
          Open to remote work
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Salary Range ({preferences.salaryCurrency})
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Minimum"
            value={preferences.salaryMin || ''}
            onChange={(e) => setPreferences({ ...preferences, salaryMin: parseInt(e.target.value) || 0 })}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
          <input
            type="number"
            placeholder="Maximum"
            value={preferences.salaryMax || ''}
            onChange={(e) => setPreferences({ ...preferences, salaryMax: parseInt(e.target.value) || 0 })}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Career Level
        </label>
        <select
          value={preferences.careerLevel}
          onChange={(e) => setPreferences({ ...preferences, careerLevel: e.target.value })}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
        >
          <option value="">Select level</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="executive">Executive</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}

// Placeholder components for other sections
function DocumentsSection({ userData, onUpdate }: any) {
  return <div className="text-slate-400">Documents management coming soon...</div>;
}

function SubscriptionSection({ userData, onUpdate }: any) {
  return <div className="text-slate-400">Subscription management coming soon...</div>;
}

function SecuritySection({ userData, onUpdate }: any) {
  return <div className="text-slate-400">Security settings coming soon...</div>;
}

function SkillsSection({ userData, onUpdate }: any) {
  return <div className="text-slate-400">Skills assessment coming soon...</div>;
}

function CareerJourneySection({ userData, onUpdate }: any) {
  return <div className="text-slate-400">Career journey tracking coming soon...</div>;
}
