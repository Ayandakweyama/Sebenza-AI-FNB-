import React from 'react';
import { Rocket, Lightbulb, Shield, Globe } from 'lucide-react';

const features = [
  {
    icon: <Rocket className="w-8 h-8 text-pink-500" />,
    title: 'Our Mission',
    description: 'To revolutionize job searching by providing intelligent tools that help job seekers stand out in a competitive market.'
  },
  {
    icon: <Lightbulb className="w-8 h-8 text-pink-500" />,
    title: 'Our Vision',
    description: 'To become the go-to platform for job seekers worldwide, leveraging AI to create personalized career opportunities.'
  },
  {
    icon: <Shield className="w-8 h-8 text-pink-500" />,
    title: 'Our Values',
    description: 'Innovation, integrity, and user-centric design guide everything we do at Sebenza AI.'
  },
  {
    icon: <Globe className="w-8 h-8 text-pink-500" />,
    title: 'Global Reach',
    description: 'Serving job seekers and employers across multiple industries and countries.'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-pink-500/30 transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center bg-slate-700/50 rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
