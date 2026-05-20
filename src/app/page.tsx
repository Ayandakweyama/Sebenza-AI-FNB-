import React from 'react';

// Import components
import HeroSection from './components/home/HomeHero';
import FeaturesSection from './components/about/FeaturesSection';
import Footer from './components/Footer';

const SebenzaLandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050615]">
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default SebenzaLandingPage;
