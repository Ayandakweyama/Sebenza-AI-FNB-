import React from 'react';
import Link from 'next/link';

const CTASection = () => {
  return (
    <section className="relative overflow-hidden bg-[#050615] py-20">
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.20),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(236,72,153,0.16),transparent_52%),radial-gradient(circle_at_55%_90%,rgba(59,130,246,0.12),transparent_60%)] [background-size:200%_200%] animate-gradient-shift" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_80px_rgba(168,85,247,0.12)] px-7 py-10 sm:px-10 sm:py-12 animate-float-slow">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />

          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                Ready to transform your job search?
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300/85 mb-8 max-w-3xl mx-auto">
              Join thousands of job seekers who have already found success with Sebenza AI.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                href="/features"
                className="border border-white/15 bg-white/[0.03] text-gray-200 px-8 py-3 rounded-full font-semibold hover:bg-white/[0.06] transition-all duration-300"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
