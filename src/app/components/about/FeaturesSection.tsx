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
    <section
      className="relative overflow-hidden bg-[#050615] py-20"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}
    >
      <div className="absolute inset-0 [background-image:radial-gradient(circle_at_15%_10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,0.14),transparent_55%)] [background-size:200%_200%] animate-gradient-shift" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:26px_26px] [background-position:0_0]" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px] [background-position:12px_18px]" />
      <div className="absolute inset-0">
        <div className="absolute -top-24 left-[-120px] w-[420px] h-[420px] bg-purple-500/25 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-[-80px] right-[-140px] w-[480px] h-[480px] bg-pink-500/20 rounded-full blur-3xl animate-blob [animation-delay:2s]" />
        <div className="absolute bottom-[-140px] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-500/15 rounded-full blur-3xl animate-blob [animation-delay:4s]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
              Built for momentum
            </span>
          </h2>
          <p className="mt-3 text-gray-300/85 text-lg">
            A platform designed to feel modern, fast, and focused on helping you stand out.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_70px_rgba(168,85,247,0.10)] px-6 py-8 sm:px-10">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-70 blur-xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.08)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/25"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 mb-4 shadow-[0_0_20px_rgba(236,72,153,0.08)]">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300/75 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
