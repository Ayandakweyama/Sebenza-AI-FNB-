'use client';

import React from 'react';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';
import HeroSection from '../components/about/HeroSection';
import FeaturesSection from '../components/about/FeaturesSection';
import TeamSection from '../components/about/TeamSection';
import CTASection from '../components/about/CTASection';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TeamSection />
      <CTASection />
      <Footer />
    </div>
  );
}
