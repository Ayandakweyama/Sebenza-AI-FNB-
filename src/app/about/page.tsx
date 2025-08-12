'use client';

import React from 'react';
import HeroSection from '../components/about/HeroSection';
import FeaturesSection from '../components/about/FeaturesSection';
import TeamSection from '../components/about/TeamSection';
import CTASection from '../components/about/CTASection';

export default function AboutPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TeamSection />
      <CTASection />
    </>
  );
}
