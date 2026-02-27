import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Your Profile - Sebenza AI',
  description: 'Manage your profile, applications, and career journey.'
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-8">
            <a 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-5 w-5 mr-2" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent text-center">
              Your Profile
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2">
            Manage your personal information and career journey.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          
          {/* Profile Card */}
          <Link 
            href="/profile/personal"
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">👤</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-blue-200 transition-colors">
              Personal Profile
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              View and manage your profile information.
            </p>
          </Link>
          
          {/* Account Settings Card */}
          <Link 
            href="/profile/settings" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">⚙️</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-purple-200 transition-colors">
              Account Settings
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Manage your notification preferences and account settings.
            </p>
          </Link>
          
          {/* Resume & Documents Card */}
          <Link 
            href="/profile/resume" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">📄</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-emerald-200 transition-colors">
              Resume & Documents
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Upload and manage your resumes and cover letters.
            </p>
          </Link>
          
          {/* Subscription & Billing Card */}
          <Link 
            href="/profile/subscription" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-amber-500/60 hover:shadow-xl hover:shadow-amber-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-amber-500 group-hover:to-amber-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">💳</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-amber-200 transition-colors">
              Subscription & Billing
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Manage your subscription plan and payment methods.
            </p>
          </Link>
          
          {/* Security & Privacy Card */}
          <Link 
            href="/profile/security" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-red-500/60 hover:shadow-xl hover:shadow-red-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-red-500 group-hover:to-red-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">🔒</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-red-200 transition-colors">
              Security & Privacy
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Manage your account security and privacy settings.
            </p>
          </Link>
          
          {/* Edit Profile Card */}
          <Link 
            href="/profile/edit" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-indigo-500 group-hover:to-indigo-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">✏️</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-indigo-200 transition-colors">
              Edit Profile
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Update your personal information and preferences.
            </p>
          </Link>
          
          {/* Skills Assessment Card */}
          <Link 
            href="/profile/assessment" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-cyan-500 group-hover:to-cyan-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">📊</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-cyan-200 transition-colors">
              Skills Assessment
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Evaluate and showcase your professional skills.
            </p>
          </Link>
          
          {/* Career Journey Card */}
          <Link 
            href="/profile/career" 
            className="group block p-4 sm:p-6 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out transform hover:scale-105 bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-500/20 backdrop-blur-sm h-full min-h-[160px] sm:min-h-[180px]"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-violet-500 group-hover:to-violet-600 transition-all duration-300">
              <span className="text-lg sm:text-2xl">🚀</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 text-white group-hover:text-violet-200 transition-colors">
              Career Journey
            </h2>
            <p className="text-sm sm:text-base text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
              Track and plan your professional growth and achievements.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}