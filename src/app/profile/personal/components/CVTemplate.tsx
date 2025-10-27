'use client';

import React, { useEffect } from 'react';
import { ProfileFormData } from '../profile.schema';

interface CVTemplateProps {
  data: Partial<ProfileFormData>;
  template: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive';
  colorScheme: string;
  fontFamily: string;
  showPhoto: boolean;
  customSections?: string[];
}

export function CVTemplate({
  data,
  template,
  colorScheme,
  fontFamily,
  showPhoto,
  customSections = []
}: CVTemplateProps) {
  // Load print styles
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/print.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const baseStyles = {
    fontFamily,
    '--accent-color': colorScheme
  } as React.CSSProperties;

  // Use real data with fallbacks for empty fields
  const displayData = {
    firstName: data.firstName || 'First Name',
    lastName: data.lastName || 'Last Name',
    email: data.email || 'your.email@example.com',
    phone: data.phone || '+1 (555) 123-4567',
    location: data.location || 'Your Location',
    bio: data.bio || 'Professional summary will appear here. Add your bio in the personal information step.',
    education: data.education && data.education.length > 0 ? data.education : [
      {
        institution: 'Your Institution',
        degree: 'Your Degree',
        fieldOfStudy: 'Field of Study',
        startDate: new Date('2020-09-01'),
        endDate: new Date('2024-05-01'),
        current: false
      }
    ],
    workExperience: data.workExperience && data.workExperience.length > 0 ? data.workExperience : [
      {
        company: 'Your Company',
        position: 'Your Position',
        startDate: new Date('2022-01-01'),
        endDate: undefined,
        current: true,
        description: 'Job description will appear here. Add your work experience details.',
        achievements: ['Achievement 1', 'Achievement 2']
      }
    ],
    technicalSkills: data.technicalSkills && data.technicalSkills.length > 0 ? data.technicalSkills : [
      { name: 'Add Technical Skills', level: 'Intermediate' as const },
    ],
    softSkills: data.softSkills && data.softSkills.length > 0 ? data.softSkills : ['Add Soft Skills'],
    jobTitle: data.jobTitle || 'Professional Title',
    template: template,
    colorScheme: colorScheme,
    fontFamily: fontFamily,
    showPhoto: showPhoto
  };

  if (template === 'Professional') {
    return (
      <div style={baseStyles} className="cv-template max-w-4xl mx-auto bg-white text-gray-900 p-8 shadow-lg">
        {/* Header */}
        <header className="border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {displayData.firstName} {displayData.lastName}
              </h1>
              <p className="text-lg text-gray-600 mb-2">{displayData.jobTitle}</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{displayData.email} | {displayData.phone}</p>
                <p>{displayData.location}</p>
              </div>
            </div>
            {showPhoto && (
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs">Photo</span>
              </div>
            )}
          </div>
        </header>

        {/* Summary */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Professional Summary</h2>
          <p className="text-gray-700 leading-relaxed">{displayData.bio}</p>
        </section>

        {/* Experience */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Professional Experience</h2>
          {displayData.workExperience.map((exp, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                  <p className="text-gray-600 font-medium">{exp.company}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {exp.startDate.toLocaleDateString()} - {exp.current ? 'Present' : exp.endDate ? exp.endDate.toLocaleDateString() : 'Present'}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{exp.description}</p>
              {exp.achievements && (
                <ul className="list-disc list-inside text-gray-700 ml-4">
                  {exp.achievements.filter(a => a.trim()).map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        {/* Education */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Education</h2>
          {displayData.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.fieldOfStudy}</h3>
                  <p className="text-gray-600">{edu.institution}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {edu.startDate.getFullYear()} - {edu.current ? 'Present' : edu.endDate?.getFullYear()}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">Skills</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical Skills</h3>
              <div className="flex flex-wrap gap-2">
                {displayData.technicalSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {skill.name} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Soft Skills</h3>
              <div className="flex flex-wrap gap-2">
                {displayData.softSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (template === 'Modern') {
    return (
      <div style={baseStyles} className="cv-template max-w-4xl mx-auto bg-white text-gray-900 shadow-lg overflow-hidden">
        {/* Header with accent color */}
        <header style={{ background: 'linear-gradient(to right, #2563eb, #7c3aed)' }} className="text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-light mb-2">
                {displayData.firstName} {displayData.lastName}
              </h1>
              <div className="text-sm space-y-1 opacity-90">
                <p>{displayData.email} • {displayData.phone}</p>
                <p>{displayData.location}</p>
              </div>
            </div>
            {showPhoto && (
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                <span className="text-white text-sm">Photo</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed text-lg">{displayData.bio}</p>
          </section>

          <div className="grid grid-cols-3 gap-8">
            {/* Left Column - Experience & Education */}
            <div className="col-span-2 space-y-8">
              {/* Experience */}
              <section>
                <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Experience</h2>
                {displayData.workExperience.map((exp, index) => (
                  <div key={index} className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-medium text-gray-900">{exp.position}</h3>
                        <p className="text-blue-600 font-medium">{exp.company}</p>
                      </div>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {exp.startDate.toLocaleDateString()} - {exp.current ? 'Present' : exp.endDate?.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{exp.description}</p>
                    {exp.achievements && (
                      <ul className="space-y-1">
                        {exp.achievements.filter(a => a.trim()).map((achievement, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-600 mr-2 mt-1.5">•</span>
                            <span className="text-gray-700">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>

              {/* Education */}
              <section>
                <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Education</h2>
                {displayData.education.map((edu, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{edu.degree}</h3>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                      </div>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {edu.startDate.getFullYear()} - {edu.current ? 'Present' : edu.endDate?.getFullYear()}
                      </span>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            {/* Right Column - Skills */}
            <div>
              <section>
                <h2 className="text-2xl font-light text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Skills</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Technical</h3>
                    <div className="space-y-2">
                      {displayData.technicalSkills.map((skill, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-700">{skill.name}</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`w-2 h-2 rounded-full ${
                                  level <= (skill.level === 'Expert' ? 5 : skill.level === 'Advanced' ? 4 : skill.level === 'Intermediate' ? 3 : 2)
                                    ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Soft Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayData.softSkills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'Creative') {
    return (
      <div style={{ ...baseStyles, background: 'linear-gradient(to bottom right, #faf5ff, #fdf2f8)' }} className="max-w-4xl mx-auto text-gray-900 shadow-lg overflow-hidden">
        {/* Artistic Header */}
        <header style={{ background: 'linear-gradient(to right, #9333ea, #ec4899, #dc2626)' }} className="text-white p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-2 tracking-wider" style={{ fontFamily: 'Arial Black, sans-serif' }}>
                {displayData.firstName}
                <br />
                <span className="text-3xl font-light">{displayData.lastName}</span>
              </h1>
              <div className="text-sm space-y-1 opacity-90">
                <p>{displayData.email} • {displayData.phone}</p>
                <p>{displayData.location}</p>
              </div>
            </div>
            {showPhoto && (
              <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40 relative">
                <div className="absolute inset-2 border-2 border-white/60 rounded-full"></div>
                <span className="text-white text-sm relative z-10">Photo</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          {/* Creative Summary */}
          <section className="mb-8">
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)' }} className="rounded-lg p-6 shadow-lg">
              <h2 style={{ background: 'linear-gradient(to right, #9333ea, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} className="text-2xl font-bold mb-3">
                About Me
              </h2>
              <p className="text-gray-700 leading-relaxed italic text-lg border-l-4 border-purple-500 pl-4">
                "{displayData.bio}"
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Experience */}
            <section>
              <h2 style={{ background: 'linear-gradient(to right, #9333ea, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} className="text-3xl font-bold mb-6 flex items-center">
                <span className="mr-3">💼</span> Experience
              </h2>
              {displayData.workExperience.map((exp, index) => (
                <div key={index} style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)' }} className="mb-6 rounded-lg p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{exp.position}</h3>
                      <p className="text-purple-600 font-semibold text-lg">{exp.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600 bg-purple-100 px-3 py-1 rounded-full">
                        {exp.startDate.toLocaleDateString()} - {exp.current ? 'Present' : exp.endDate?.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{exp.description}</p>
                  {exp.achievements && (
                    <div className="space-y-2">
                      {exp.achievements.filter(a => a.trim()).map((achievement, i) => (
                        <div key={i} style={{ background: 'linear-gradient(to right, #faf5ff, #fdf2f8)' }} className="flex items-start p-3 rounded-lg">
                          <span className="text-purple-600 mr-3 mt-1">✨</span>
                          <span className="text-gray-700">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Skills & Education */}
            <div className="space-y-8">
              {/* Skills */}
              <section>
                <h2 style={{ background: 'linear-gradient(to right, #9333ea, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} className="text-3xl font-bold mb-6 flex items-center">
                  <span className="mr-3">🎨</span> Skills
                </h2>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)' }} className="rounded-lg p-6 shadow-lg">
                  <div className="grid grid-cols-1 gap-4">
                    {displayData.technicalSkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{skill.name}</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`w-3 h-3 rounded-full ${
                                level <= (skill.level === 'Expert' ? 5 : skill.level === 'Advanced' ? 4 : skill.level === 'Intermediate' ? 3 : 2)
                                  ? '' : 'bg-gray-300'
                              }`}
                              style={{
                                backgroundColor: level <= (skill.level === 'Expert' ? 5 : skill.level === 'Advanced' ? 4 : skill.level === 'Intermediate' ? 3 : 2)
                                  ? '#9333ea' : '#d1d5db'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Soft Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayData.softSkills.map((skill, index) => (
                        <span key={index} style={{ background: 'linear-gradient(to right, #faf5ff, #fdf2f8)' }} className="px-3 py-1 text-purple-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Education */}
              <section>
                <h2 style={{ background: 'linear-gradient(to right, #9333ea, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} className="text-3xl font-bold mb-6 flex items-center">
                  <span className="mr-3">🎓</span> Education
                </h2>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(8px)' }} className="rounded-lg p-6 shadow-lg">
                  {displayData.education.map((edu, index) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <h3 className="text-lg font-bold text-gray-900">{edu.degree}</h3>
                      <p className="text-purple-600 font-semibold">{edu.institution}</p>
                      <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                      <span className="text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded-full mt-1 inline-block">
                        {edu.startDate.getFullYear()} - {edu.current ? 'Present' : edu.endDate?.getFullYear()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'Minimalist') {
    return (
      <div style={baseStyles} className="cv-template max-w-4xl mx-auto bg-white text-gray-900 p-8">
        {/* Clean Header */}
        <header className="mb-12">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-6xl font-light text-gray-900 mb-2 tracking-widest">
                {displayData.firstName} {displayData.lastName}
              </h1>
            </div>
            {showPhoto && (
              <div className="w-32 h-32 bg-gray-100 rounded-sm flex items-center justify-center border border-gray-300">
                <span className="text-gray-600 text-xs">Photo</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-widest mb-1">Email</p>
              <p className="text-gray-900">{displayData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-widest mb-1">Phone</p>
              <p className="text-gray-900">{displayData.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-widest mb-1">Location</p>
              <p className="text-gray-900">{displayData.location}</p>
            </div>
          </div>
        </header>

        {/* Content in clean sections */}
        <div className="space-y-12">
          {/* Summary */}
          <section>
            <p className="text-gray-700 leading-relaxed text-lg max-w-3xl">{displayData.bio}</p>
          </section>

          {/* Experience */}
          <section>
            <h2 className="text-3xl font-light text-gray-900 mb-8 border-b border-gray-200 pb-4">Experience</h2>
            <div className="space-y-8">
              {displayData.workExperience.map((exp, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-1">
                    <p className="text-sm text-gray-600 uppercase tracking-widest">
                      {exp.startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - {exp.current ? 'Present' : exp.endDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="text-xl font-light text-gray-900 mb-1">{exp.position}</h3>
                    <p className="text-gray-600 mb-4">{exp.company}</p>
                    <p className="text-gray-700 mb-4">{exp.description}</p>
                    {exp.achievements && exp.achievements.filter(a => a.trim()).length > 0 && (
                      <div className="space-y-2">
                        {exp.achievements.filter(a => a.trim()).map((achievement, i) => (
                          <li key={i} className="text-gray-700 list-none pl-0">{achievement}</li>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Skills side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Education */}
            <section>
              <h2 className="text-3xl font-light text-gray-900 mb-8 border-b border-gray-200 pb-4">Education</h2>
              <div className="space-y-6">
                {displayData.education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-light text-gray-900 mb-1">{edu.degree}</h3>
                    <p className="text-gray-600 mb-1">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {edu.startDate.getFullYear()} - {edu.current ? 'Present' : edu.endDate?.getFullYear()}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-3xl font-light text-gray-900 mb-8 border-b border-gray-200 pb-4">Skills</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-light text-gray-900 mb-3">Technical Skills</h3>
                  <div className="flex flex-wrap gap-3">
                    {displayData.technicalSkills.map((skill, index) => (
                      <span key={index} className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-light">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-light text-gray-900 mb-3">Soft Skills</h3>
                  <div className="flex flex-wrap gap-3">
                    {displayData.softSkills.map((skill, index) => (
                      <span key={index} className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-light">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Default to Professional template
  return (
    <div style={baseStyles} className="cv-template max-w-4xl mx-auto bg-white text-gray-900 p-8 shadow-lg">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">CV Template Preview</h1>
        <p className="text-gray-600">Template: {template}</p>
        <p className="text-gray-600 mt-2">Preview not available for this template yet.</p>
      </div>
    </div>
  );
}
