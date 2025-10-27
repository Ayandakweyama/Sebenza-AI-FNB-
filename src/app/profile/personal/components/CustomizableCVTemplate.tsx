'use client';

import React from 'react';
import { ProfileFormData } from '../profile.schema';

export interface CVCustomizationOptions {
  // Layout Options
  layout: 'single-column' | 'two-column' | 'modern-sidebar';
  sidebarPosition?: 'left' | 'right';
  
  // Typography
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'compact' | 'normal' | 'relaxed';
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  
  // Sections
  sectionOrder: string[];
  visibleSections: {
    photo: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    languages: boolean;
    certifications: boolean;
    projects: boolean;
    references: boolean;
  };
  
  // Section Styles
  sectionStyle: {
    headerStyle: 'underline' | 'background' | 'border-left' | 'minimal';
    headerAlignment: 'left' | 'center' | 'right';
    headerCase: 'uppercase' | 'capitalize' | 'normal';
    spacing: 'compact' | 'normal' | 'spacious';
  };
  
  // Content Options
  dateFormat: 'MM/YYYY' | 'Month YYYY' | 'YYYY';
  bulletStyle: 'disc' | 'circle' | 'square' | 'dash' | 'arrow';
  skillDisplay: 'list' | 'tags' | 'bars' | 'grid';
  
  // Additional Styling
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  shadow: 'none' | 'small' | 'medium' | 'large';
  margins: 'narrow' | 'normal' | 'wide';
}

interface CustomizableCVTemplateProps {
  data: Partial<ProfileFormData>;
  customization: CVCustomizationOptions;
}

export function CustomizableCVTemplate({ data, customization }: CustomizableCVTemplateProps) {
  const {
    layout,
    sidebarPosition = 'left',
    fontFamily,
    fontSize,
    lineHeight,
    primaryColor,
    secondaryColor,
    textColor,
    backgroundColor,
    accentColor,
    sectionOrder,
    visibleSections,
    sectionStyle,
    dateFormat,
    bulletStyle,
    skillDisplay,
    borderRadius,
    shadow,
    margins
  } = customization;

  // Helper functions
  const formatDate = (date: Date | undefined, current: boolean = false): string => {
    if (current) return 'Present';
    if (!date) return '';
    
    const d = new Date(date);
    switch (dateFormat) {
      case 'MM/YYYY':
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      case 'Month YYYY':
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'YYYY':
        return d.getFullYear().toString();
      default:
        return d.toLocaleDateString();
    }
  };

  const getBulletChar = (): string => {
    switch (bulletStyle) {
      case 'disc': return '•';
      case 'circle': return '○';
      case 'square': return '▪';
      case 'dash': return '–';
      case 'arrow': return '→';
      default: return '•';
    }
  };

  const getFontSizeClass = (): string => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getLineHeightClass = (): string => {
    switch (lineHeight) {
      case 'compact': return 'leading-tight';
      case 'relaxed': return 'leading-relaxed';
      default: return 'leading-normal';
    }
  };

  const getBorderRadiusClass = (): string => {
    switch (borderRadius) {
      case 'none': return 'rounded-none';
      case 'small': return 'rounded';
      case 'large': return 'rounded-xl';
      default: return 'rounded-lg';
    }
  };

  const getShadowClass = (): string => {
    switch (shadow) {
      case 'none': return '';
      case 'small': return 'shadow-sm';
      case 'large': return 'shadow-xl';
      default: return 'shadow-lg';
    }
  };

  const getMarginsClass = (): string => {
    switch (margins) {
      case 'narrow': return 'p-4';
      case 'wide': return 'p-12';
      default: return 'p-8';
    }
  };

  const getSpacingClass = (): string => {
    switch (sectionStyle.spacing) {
      case 'compact': return 'space-y-3';
      case 'spacious': return 'space-y-8';
      default: return 'space-y-6';
    }
  };

  // Section Components
  const renderSectionHeader = (title: string) => {
    const alignClass = `text-${sectionStyle.headerAlignment}`;
    const caseClass = sectionStyle.headerCase === 'uppercase' ? 'uppercase' : 
                      sectionStyle.headerCase === 'capitalize' ? 'capitalize' : '';
    
    switch (sectionStyle.headerStyle) {
      case 'underline':
        return (
          <h2 className={`text-xl font-bold mb-4 pb-2 border-b-2 ${alignClass} ${caseClass}`}
              style={{ borderColor: primaryColor, color: primaryColor }}>
            {title}
          </h2>
        );
      case 'background':
        return (
          <h2 className={`text-xl font-bold mb-4 p-2 text-white ${alignClass} ${caseClass}`}
              style={{ backgroundColor: primaryColor }}>
            {title}
          </h2>
        );
      case 'border-left':
        return (
          <h2 className={`text-xl font-bold mb-4 pl-4 border-l-4 ${alignClass} ${caseClass}`}
              style={{ borderColor: primaryColor, color: primaryColor }}>
            {title}
          </h2>
        );
      default:
        return (
          <h2 className={`text-xl font-bold mb-4 ${alignClass} ${caseClass}`}
              style={{ color: primaryColor }}>
            {title}
          </h2>
        );
    }
  };

  const renderContactInfo = () => (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>
        {data.firstName || 'First Name'} {data.lastName || 'Last Name'}
      </h1>
      {data.jobTitle && (
        <p className="text-xl mb-3" style={{ color: secondaryColor }}>
          {data.jobTitle}
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-sm" style={{ color: textColor }}>
        {data.email && <span>📧 {data.email}</span>}
        {data.phone && <span>📱 {data.phone}</span>}
        {data.location && <span>📍 {data.location}</span>}
      </div>
    </div>
  );

  const renderSummary = () => {
    if (!visibleSections.summary || !data.bio) return null;
    return (
      <section className="mb-6">
        {renderSectionHeader('Professional Summary')}
        <p style={{ color: textColor }}>{data.bio}</p>
      </section>
    );
  };

  const renderExperience = () => {
    if (!visibleSections.experience || !data.workExperience?.length) return null;
    return (
      <section className="mb-6">
        {renderSectionHeader('Professional Experience')}
        <div className="space-y-4">
          {data.workExperience.map((exp, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold" style={{ color: textColor }}>
                    {exp.position || 'Position'}
                  </h3>
                  <p style={{ color: secondaryColor }}>{exp.company || 'Company'}</p>
                </div>
                <span className="text-sm" style={{ color: secondaryColor }}>
                  {formatDate(exp.startDate)} - {formatDate(exp.endDate, exp.current)}
                </span>
              </div>
              {exp.description && (
                <p className="mb-2" style={{ color: textColor }}>{exp.description}</p>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="space-y-1">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2" style={{ color: accentColor }}>{getBulletChar()}</span>
                      <span style={{ color: textColor }}>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEducation = () => {
    if (!visibleSections.education || !data.education?.length) return null;
    return (
      <section className="mb-6">
        {renderSectionHeader('Education')}
        <div className="space-y-3">
          {data.education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold" style={{ color: textColor }}>
                    {edu.degree || 'Degree'} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </h3>
                  <p style={{ color: secondaryColor }}>{edu.institution || 'Institution'}</p>
                </div>
                <span className="text-sm" style={{ color: secondaryColor }}>
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate, edu.current)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSkills = () => {
    if (!visibleSections.skills) return null;
    const hasTechnicalSkills = data.technicalSkills && data.technicalSkills.length > 0;
    const hasSoftSkills = data.softSkills && data.softSkills.length > 0;
    
    if (!hasTechnicalSkills && !hasSoftSkills) return null;

    return (
      <section className="mb-6">
        {renderSectionHeader('Skills')}
        
        {hasTechnicalSkills && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2" style={{ color: textColor }}>Technical Skills</h3>
            {skillDisplay === 'tags' ? (
              <div className="flex flex-wrap gap-2">
                {data.technicalSkills!.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    {skill.name} • {skill.level}
                  </span>
                ))}
              </div>
            ) : skillDisplay === 'bars' ? (
              <div className="space-y-2">
                {data.technicalSkills!.map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: textColor }}>{skill.name}</span>
                      <span className="text-sm" style={{ color: secondaryColor }}>{skill.level}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: primaryColor,
                          width: skill.level === 'Expert' ? '100%' :
                                 skill.level === 'Advanced' ? '75%' :
                                 skill.level === 'Intermediate' ? '50%' : '25%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : skillDisplay === 'grid' ? (
              <div className="grid grid-cols-2 gap-2">
                {data.technicalSkills!.map((skill, index) => (
                  <div key={index} className="flex items-center">
                    <span className="mr-2" style={{ color: accentColor }}>{getBulletChar()}</span>
                    <span style={{ color: textColor }}>{skill.name} ({skill.level})</span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {data.technicalSkills!.map((skill, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mr-2" style={{ color: accentColor }}>{getBulletChar()}</span>
                    <span style={{ color: textColor }}>{skill.name} - {skill.level}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {hasSoftSkills && (
          <div>
            <h3 className="font-semibold mb-2" style={{ color: textColor }}>Soft Skills</h3>
            {skillDisplay === 'tags' ? (
              <div className="flex flex-wrap gap-2">
                {data.softSkills!.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {data.softSkills!.map((skill, index) => (
                  <span key={index} className="flex items-center">
                    <span className="mr-2" style={{ color: accentColor }}>{getBulletChar()}</span>
                    <span style={{ color: textColor }}>{skill}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  // Render sections in custom order
  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case 'summary': return renderSummary();
      case 'experience': return renderExperience();
      case 'education': return renderEducation();
      case 'skills': return renderSkills();
      default: return null;
    }
  };

  // Main layout rendering
  const containerClasses = `${getFontSizeClass()} ${getLineHeightClass()} ${getBorderRadiusClass()} ${getShadowClass()} ${getMarginsClass()}`;
  
  const mainStyle = {
    fontFamily,
    backgroundColor,
    color: textColor,
    minHeight: '297mm',
    width: '210mm',
    maxWidth: '100%'
  };

  // Single Column Layout
  if (layout === 'single-column') {
    return (
      <div className={`cv-template ${containerClasses}`} style={mainStyle}>
        {renderContactInfo()}
        <div className={getSpacingClass()}>
          {sectionOrder.map((section, index) => (
            <React.Fragment key={`section-${section}-${index}`}>
              {renderSection(section)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Two Column Layout
  if (layout === 'two-column') {
    const leftSections = sectionOrder.filter((_, i) => i % 2 === 0);
    const rightSections = sectionOrder.filter((_, i) => i % 2 === 1);

    return (
      <div className={`cv-template ${containerClasses}`} style={mainStyle}>
        {renderContactInfo()}
        <div className="grid grid-cols-2 gap-8">
          <div className={getSpacingClass()}>
            {leftSections.map((section, index) => (
              <React.Fragment key={`left-${section}-${index}`}>
                {renderSection(section)}
              </React.Fragment>
            ))}
          </div>
          <div className={getSpacingClass()}>
            {rightSections.map((section, index) => (
              <React.Fragment key={`right-${section}-${index}`}>
                {renderSection(section)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Modern Sidebar Layout
  if (layout === 'modern-sidebar') {
    const sidebarSections = ['skills', 'education'];
    const mainSections = sectionOrder.filter(s => !sidebarSections.includes(s));
    
    const sidebarContent = (
      <div 
        className="p-6 h-full"
        style={{ backgroundColor: `${primaryColor}10` }}
      >
        {renderContactInfo()}
        <div className={getSpacingClass()}>
          {sidebarSections.map((section, index) => (
            <React.Fragment key={`sidebar-${section}-${index}`}>
              {renderSection(section)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );

    const mainContent = (
      <div className="p-6">
        <div className={getSpacingClass()}>
          {mainSections.map((section, index) => (
            <React.Fragment key={`main-${section}-${index}`}>
              {renderSection(section)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );

    return (
      <div className={`cv-template ${containerClasses} grid grid-cols-3`} style={mainStyle}>
        {sidebarPosition === 'left' ? (
          <>
            <div className="col-span-1">{sidebarContent}</div>
            <div className="col-span-2">{mainContent}</div>
          </>
        ) : (
          <>
            <div className="col-span-2">{mainContent}</div>
            <div className="col-span-1">{sidebarContent}</div>
          </>
        )}
      </div>
    );
  }

  return null;
}

export default CustomizableCVTemplate;
