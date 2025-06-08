import React from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="min-h-screen pt-[100px] md:pt-[140px] lg:pt-[100px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
          <span className="bg-gradient-to-r from-white via-purple-200 to-yellow-400 bg-clip-text text-transparent">
            AI-Powered Career
          </span>
          <br />
          <span className="text-yellow-400">Acceleration</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
          Transform your job search with intelligent resume analysis, personalized cover letters, 
          and strategic career guidance powered by advanced AI technology.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-2">
            <span>Start Your Journey</span>
            <ChevronRight className="h-5 w-5" />
          </button>
          <button className="border-2 border-purple-400 text-purple-300 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-400 hover:text-white transition-all duration-300 transform hover:scale-105">
            Watch Demo
          </button>
        </div>

        {/* Highlights */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          {["Free Trial", "No Credit Card", "Instant Setup"].map((text, i) => (
            <div key={i} className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
