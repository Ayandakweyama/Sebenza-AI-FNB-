import React from 'react';
import { Users } from 'lucide-react';

const team = [
  {
    name: 'Ayanda Kweyama',
    role: 'Founder',
    image: '/team/placeholder-1.jpg',
    bio: 'Passionate about using technology to solve real-world problems.'
  },
  {
    name: 'Calivin Lubambo',
    role: 'Lead Developer',
    image: '/team/placeholder-2.jpg',
    bio: 'Full-stack developer with expertise in AI and machine learning.'
  },
  {
    name: 'Lucky Mkhatshwa',
    role: 'UX Designer',
    image: '/team/placeholder-3.jpg',
    bio: 'Creating intuitive and beautiful user experiences.'
  },
  {
    name: 'Lungelo Mbuyane',
    role: 'Product Manager',
    image: '/team/placeholder-4.jpg',
    bio: 'Driving product strategy and ensuring exceptional user value.'
  }
];

const TeamSection = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Meet Our Team</h2>
          <p className="mt-4 text-xl text-gray-400">The passionate people behind Sebenza AI</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-pink-500/50 hover:-translate-y-3 hover:shadow-2xl hover:shadow-pink-500/25 transition-all duration-500 transform cursor-pointer group">
              <div className="p-8 text-center">
                {/* Circular Photo Container */}
                <div className="relative mx-auto mb-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 border-2 border-pink-500/30 flex items-center justify-center group-hover:border-pink-400/60 group-hover:shadow-lg group-hover:shadow-pink-500/30 transition-all duration-300">
                    <Users className="w-12 h-12 text-pink-400 group-hover:text-pink-300 transition-colors duration-300" />
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border border-pink-500/20 animate-pulse"></div>
                </div>
                
                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-100 transition-colors duration-300">{member.name}</h3>
                  <p className="text-pink-400 font-semibold text-sm uppercase tracking-wider group-hover:text-pink-300 transition-colors duration-300">{member.role}</p>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
