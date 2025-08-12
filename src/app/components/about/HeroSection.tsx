import React from 'react';

const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
          About Sebenza AI
        </h1>
        <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
          Empowering job seekers with AI-powered tools to land their dream jobs faster and more effectively.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
