import { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Sparkles, Search, Upload, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Portal | Sebenza AI',
  description: 'Find and manage your job opportunities with Sebenza AI',
};

export default async function JobsPage() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">Find Your Next Opportunity</h2>
        <p className="mt-2 text-slate-300">
          Browse jobs manually or let our AI agent help you find the best matches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">Job Portal</div>
                <div className="text-sm text-slate-400">Browse and swipe</div>
              </div>
            </div>

            <p className="mt-4 text-slate-300">
              Search and discover jobs from Indeed, Pnet, Career24, LinkedIn and more. Swipe through listings or browse in list view.
            </p>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                Tinder-style swipe interface
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                List view with filters
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                Multiple job boards in one place
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/jobs/all"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-600 to-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:from-pink-500 hover:to-pink-600 transition-colors"
              >
                Browse Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/12 via-transparent to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">Job Matcher</div>
                <div className="text-sm text-slate-400">AI-powered matching</div>
              </div>
            </div>

            <p className="mt-4 text-slate-300">
              Upload your CV and let AI find jobs from multiple sources where you have the highest likelihood of hearing back.
            </p>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-400" />
                CV-based intelligent matching
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-400" />
                Feedback likelihood prediction
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-400" />
                Scrapes from Indeed and JobMail
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/jobs/matcher"
                className="inline-flex items-center justify-center rounded-lg bg-slate-800 border border-slate-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload and Match
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
