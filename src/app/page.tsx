import React from 'react';

// Import components
import HeroSection from './components/home/HomeHero';
import FeaturesSection from './components/about/FeaturesSection';
import CTASection from './components/about/CTASection';
import Footer from './components/Footer';

const SebenzaLandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default SebenzaLandingPage;