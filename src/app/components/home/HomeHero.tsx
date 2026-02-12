'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle } from 'lucide-react';

const RobotScene = dynamic(() => import('./RobotModel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
    </div>
  ),
});

const HeroSection = () => {
  return (
    <section className="min-h-screen md:min-h-screen pt-[60px] md:pt-[80px] lg:pt-[60px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-start md:items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 md:top-20 left-4 md:left-10 w-48 h-48 md:w-72 md:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-24 md:top-40 right-4 md:right-10 w-48 h-48 md:w-72 md:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 md:bottom-20 left-1/2 -translate-x-1/2 w-48 h-48 md:w-72 md:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 md:-mt-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left side — Text content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Heading */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-500 bg-clip-text text-transparent">
                AI-Powered Career
              </span>
              <br />
              <span className="text-pink-500">Acceleration</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 md:mb-10 max-w-2xl leading-relaxed">
              Transform your job search with intelligent resume analysis, personalized cover letters, 
              and strategic career guidance powered by advanced AI technology.
            </p>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-400">
              {["Free Trial", "No Credit Card", "Instant Setup"].map((text, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — 3D Robot */}
          <div className="flex-1 w-full h-[420px] sm:h-[450px] lg:h-[500px] relative">
            {/* Glow effect behind the robot */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
            <RobotScene />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;