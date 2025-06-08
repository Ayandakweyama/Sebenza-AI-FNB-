import React from 'react';
import Link from 'next/link';

const CTASection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to transform your job search?</h2>
        <p className="text-xl text-gray-300 mb-8">Join thousands of job seekers who have already found success with Sebenza AI.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/signup" 
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-8 py-3 rounded-full font-semibold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105"
          >
            Get Started Free
          </Link>
          <Link 
            href="/features" 
            className="border border-yellow-400 text-yellow-400 px-8 py-3 rounded-full font-semibold hover:bg-yellow-400/10 transition-all duration-300"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
