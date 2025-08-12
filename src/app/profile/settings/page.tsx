import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings - Sebenza AI',
  description: 'Manage your account preferences and settings.'
};

export default function AccountSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-slate-400">
          Manage your account preferences and notification settings
        </p>
      </div>
      
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
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <h3 className="font-medium text-white">Push Notifications</h3>
                <p className="text-sm text-slate-400">Get instant updates on your device</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <h3 className="font-medium text-white">Job Alerts</h3>
                <p className="text-sm text-slate-400">Receive notifications for new job matches</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Display Preferences */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Display Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-slate-300 mb-2">
                Theme
              </label>
              <select
                id="theme"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                defaultValue="system"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System Default</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-300 mb-2">
                Language
              </label>
              <select
                id="language"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                defaultValue="en"
              >
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
                <option value="zu">Zulu</option>
                <option value="xh">Xhosa</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
