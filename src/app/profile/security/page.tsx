import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security & Privacy - Sebenza AI',
  description: 'Manage your account security and privacy settings.'
};

export default function SecurityPrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
          Security & Privacy
        </h1>
        <p className="text-slate-400">
          Manage your account security and privacy settings
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Change Password */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Password</h2>
              <p className="text-slate-400 text-sm">Last changed 3 months ago</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              Change Password
            </button>
          </div>
          
          {/* Change Password Form (initially hidden) */}
          <div className="mt-6 pt-6 border-t border-slate-800 hidden">
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                    placeholder="Enter new password"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Two-Factor Authentication */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Two-Factor Authentication</h2>
              <p className="text-slate-400 text-sm">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              Enable 2FA
            </button>
          </div>
          
          {/* 2FA Setup (initially hidden) */}
          <div className="mt-6 pt-6 border-t border-slate-800 hidden">
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-block p-4 bg-white/10 rounded-lg mb-4">
                  {/* QR Code Placeholder */}
                  <div className="w-48 h-48 bg-slate-700/50 flex items-center justify-center text-slate-500">
                    QR Code
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-slate-300 mb-1">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Verify and Activate
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Sessions */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Active Sessions</h2>
          
          <div className="space-y-4">
            {/* Current Session */}
            <div className="p-4 bg-slate-800/30 rounded-lg border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-white">Windows 11 • Chrome</h3>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                      Current Session
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">Johannesburg, South Africa</p>
                  <p className="text-xs text-slate-500 mt-1">Last active: Just now</p>
                </div>
                <button className="text-slate-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Other Sessions */}
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white">iPhone 14 • Safari</h3>
                  <p className="text-sm text-slate-400 mt-1">Cape Town, South Africa</p>
                  <p className="text-xs text-slate-500 mt-1">Last active: 2 hours ago</p>
                </div>
                <button className="text-red-400 hover:text-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white">MacBook Pro • Firefox</h3>
                  <p className="text-sm text-slate-400 mt-1">Durban, South Africa</p>
                  <p className="text-xs text-slate-500 mt-1">Last active: 1 day ago</p>
                </div>
                <button className="text-red-400 hover:text-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <button className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center">
            View all active sessions
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Privacy Settings */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Privacy Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">Profile Visibility</h3>
                <p className="text-sm text-slate-400">Make your profile visible to recruiters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <h3 className="font-medium text-white">Email Visibility</h3>
                <p className="text-sm text-slate-400">Show your email on your public profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div>
                <h3 className="font-medium text-white">Data Sharing</h3>
                <p className="text-sm text-slate-400">Allow us to use your data to improve our services</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <h3 className="font-medium text-white mb-3">Download Your Data</h3>
              <p className="text-sm text-slate-400 mb-4">Request a copy of all your personal data stored on our platform.</p>
              <button className="px-4 py-2 text-sm border border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors">
                Request Data Export
              </button>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <h3 className="font-medium text-white mb-3">Delete Account</h3>
              <p className="text-sm text-slate-400 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button className="px-4 py-2 text-sm bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-white rounded-lg transition-colors">
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
