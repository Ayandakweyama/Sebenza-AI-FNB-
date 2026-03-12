import { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, Search, Rocket, Map, BarChart3, FileText, Video } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Afrigter - AI Career Mentor',
  description: 'Your AI-powered career mentor for resume tips, interview preparation, and career advice.'
};

export default function AfrigterPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-8">
            <a 
              href="/dashboard"
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-5 w-5 mr-2" aria-hidden="true">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              Back to Dashboard
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent text-center">
              Afrigter - Your AI Career Mentor
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base text-center px-2">
            Welcome to your personalized career guidance hub. Select an option to get started.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Interview Prep Card - Blue */}
          <a 
            href="/afrigter/interview-prep" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-blue-800/30 to-blue-900/50 border border-blue-700/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 h-full"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">Interview Prep</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Practice common interview questions and get AI-powered feedback.</p>
          </a>
          
          {/* Job Search Card - Green */}
          <a 
            href="/afrigter/job-search" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-emerald-800/30 to-emerald-900/50 border border-emerald-700/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 h-full"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">Job Search</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Develop an effective job search strategy tailored to your goals.</p>
          </a>
          
          {/* Career Advice Card - Pink */}
          <a 
            href="/afrigter/career-advice" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-pink-800/30 to-pink-900/50 border border-pink-700/30 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/20 h-full"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">Career Advice</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Get personalized career guidance and professional development tips.</p>
          </a>

          {/* Career Roadmap Card - Indigo */}
          <a 
            href="/afrigter/career-roadmap" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-indigo-800/30 to-indigo-900/50 border border-indigo-700/30 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 h-full"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <Map className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">Career Roadmap</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Generate a personalized learning and certification plan for your career goals.</p>
          </a>

          {/* Skill Gap Analysis Card - Amber */}
          <a 
            href="/afrigter/skill-gap" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-amber-800/30 to-amber-900/50 border border-amber-700/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20 h-full"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">Skill Gap Analysis</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Identify and bridge the skills needed for your target roles.</p>
          </a>

          {/* CV Regenerator Card - Cyan/Teal */}
          <a 
            href="/afrigter/cv-regenerator" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-cyan-800/30 to-teal-900/50 border border-cyan-700/30 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 h-full"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">CV Regenerator</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Upload your CV and a job post — AI enhances your CV for the role without fabricating credentials.</p>
          </a>

          {/* AI Video Interview Analysis Card - Purple */}
          <a 
            href="/afrigter/video-interview" 
            className="group block p-4 sm:p-5 md:p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-purple-800/30 to-violet-900/50 border border-purple-700/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 h-full col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
              <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold mb-1 sm:mb-2 text-white">AI Video Interview</h2>
            <p className="text-xs sm:text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2 sm:line-clamp-none">Record practice interviews on video and get AI-powered scores, feedback, and a recruiter-style report.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
