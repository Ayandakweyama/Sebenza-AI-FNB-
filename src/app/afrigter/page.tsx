import { Metadata } from 'next';
import Link from 'next/link';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { FileText, MessageCircle, Search, Rocket, Map, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Afrigter - AI Career Mentor',
  description: 'Your AI-powered career mentor for resume tips, interview preparation, and career advice.'
};

export default function AfrigterPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 lg:pb-12">
        <DashboardNavigation 
          title="Afrigter - Your AI Career Mentor"
          description="Welcome to your personalized career guidance hub. Select an option to get started."
        />

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Resume Tips Card - Purple */}
          <a 
            href="/afrigter/resume-tips" 
            className="group block p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-purple-800/30 to-purple-900/50 border border-purple-700/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Resume Tips</h2>
            <p className="text-slate-300 group-hover:text-white transition-colors">Get personalized feedback and suggestions to improve your resume.</p>
          </a>
          
          {/* Interview Prep Card - Blue */}
          <a 
            href="/afrigter/interview-prep" 
            className="group block p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-blue-800/30 to-blue-900/50 border border-blue-700/30 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Interview Prep</h2>
            <p className="text-slate-300 group-hover:text-white transition-colors">Practice common interview questions and get AI-powered feedback.</p>
          </a>
          
          {/* Job Search Card - Green */}
          <a 
            href="/afrigter/job-search" 
            className="group block p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-emerald-800/30 to-emerald-900/50 border border-emerald-700/30 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Job Search</h2>
            <p className="text-slate-300 group-hover:text-white transition-colors">Develop an effective job search strategy tailored to your goals.</p>
          </a>
          
          {/* Career Advice Card - Pink */}
          <a 
            href="/afrigter/career-advice" 
            className="group block p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-pink-800/30 to-pink-900/50 border border-pink-700/30 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/20 h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Career Advice</h2>
            <p className="text-slate-300 group-hover:text-white transition-colors">Get personalized career guidance and professional development tips.</p>
          </a>

          {/* Career Roadmap Card - Indigo */}
          <a 
            href="/afrigter/career-roadmap" 
            className="group block p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-indigo-800/30 to-indigo-900/50 border border-indigo-700/30 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Career Roadmap</h2>
            <p className="text-slate-300 group-hover:text-white transition-colors">Generate a personalized learning and certification plan for your career goals.</p>
          </a>

          {/* Skill Gap Analysis Card - Amber */}
          <a 
            href="/afrigter/skill-gap" 
            className="group block p-6 rounded-xl transition-all duration-300 bg-gradient-to-br from-amber-800/30 to-amber-900/50 border border-amber-700/30 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20 h-full"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Skill Gap Analysis</h2>
            <p className="text-slate-300 group-hover:text-white transition-colors">Identify and bridge the skills needed for your target roles.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
