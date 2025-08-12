import React from 'react';
import { Users } from 'lucide-react';

const team = [
  {
    name: 'John Doe',
    role: 'CEO & Founder',
    image: '/team/placeholder-1.jpg',
    bio: 'Passionate about using technology to solve real-world problems.'
  },
  {
    name: 'Jane Smith',
    role: 'Lead Developer',
    image: '/team/placeholder-2.jpg',
    bio: 'Full-stack developer with expertise in AI and machine learning.'
  },
  {
    name: 'Alex Johnson',
    role: 'UX Designer',
    image: '/team/placeholder-3.jpg',
    bio: 'Creating intuitive and beautiful user experiences.'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div key={index} className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-pink-500/30 transition-all duration-300">
              <div className="h-48 bg-slate-700/50 flex items-center justify-center">
                <Users className="w-20 h-20 text-gray-500" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                <p className="text-pink-500 mb-3">{member.role}</p>
                <p className="text-gray-400">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
