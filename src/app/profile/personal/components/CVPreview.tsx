'use client';

import React, { useState, useRef } from 'react';
import { CVTemplate } from './CVTemplate';
import { ProfileFormData } from '../profile.schema';
import { exportToWord, ExportOptions } from '../utils/cvExport';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface CVPreviewProps {
  data: Partial<ProfileFormData>;
  template: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive';
  colorScheme: string;
  fontFamily: string;
  showPhoto: boolean;
  customSections?: string[];
  className?: string;
  showExportButtons?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export function CVPreview({
  data,
  template,
  colorScheme,
  fontFamily,
  showPhoto,
  customSections = [],
  className = '',
  showExportButtons = true,
  isFullScreen = false,
  onToggleFullScreen
}: CVPreviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | null>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const cvElementId = 'cv-preview-element';

  const getExportOptions = (filename: string, format: 'docx') => {
    return {
      filename: `${filename}.${format}`,
      format,
      template,
      colorScheme,
      fontFamily,
      showPhoto
    };
  };

  const handleExport = async (format: 'docx') => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      const filename = `${data.firstName || 'CV'}_${data.lastName || 'Resume'}_${Date.now()}`;
      const exportOptions = getExportOptions(filename, format);

      await exportToWord(data, exportOptions);
      toast.success('CV exported as Word document successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CV as Word document. Please try again.');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const getPreviewData = () => {
    return {
      firstName: data.firstName || 'First Name',
      lastName: data.lastName || 'Last Name',
      email: data.email || 'your.email@example.com',
      phone: data.phone || '+1 (555) 123-4567',
      location: data.location || 'Your Location',
      bio: data.bio || 'Professional summary will appear here. Add your bio in the personal information step to see it reflected in real-time.',
      jobTitle: data.jobTitle || 'Professional Title',
      education: data.education && data.education.length > 0 ? data.education.map(edu => ({
        institution: edu.institution || 'Your Institution',
        degree: edu.degree || 'Your Degree',
        fieldOfStudy: edu.fieldOfStudy || 'Field of Study',
        startDate: edu.startDate || new Date('2020-09-01'),
        endDate: edu.endDate,
        current: edu.current || false
      })) : [{
        institution: 'Your Institution',
        degree: 'Your Degree',
        fieldOfStudy: 'Field of Study',
        startDate: new Date('2020-09-01'),
        endDate: new Date('2024-05-01'),
        current: false
      }],
      workExperience: data.workExperience && data.workExperience.length > 0 ? data.workExperience.map(exp => ({
        company: exp.company || 'Your Company',
        position: exp.position || 'Your Position',
        startDate: exp.startDate || new Date('2022-01-01'),
        endDate: exp.endDate,
        current: exp.current || false,
        description: exp.description || 'Job description will appear here. Add your work experience details to see them reflected in real-time.',
        achievements: exp.achievements && exp.achievements.length > 0 ? exp.achievements : ['Achievement 1', 'Achievement 2']
      })) : [{
        company: 'Your Company',
        position: 'Your Position',
        startDate: new Date('2022-01-01'),
        current: true,
        description: 'Job description will appear here. Add your work experience details to see them reflected in real-time.',
        achievements: ['Achievement 1', 'Achievement 2']
      }],
      technicalSkills: data.technicalSkills && data.technicalSkills.length > 0 ? data.technicalSkills.map(skill => ({
        name: skill.name || 'Skill Name',
        level: skill.level || 'Intermediate' as const
      })) : [
        { name: 'Add Technical Skills', level: 'Intermediate' as const }
      ],
      softSkills: data.softSkills && data.softSkills.length > 0 ? data.softSkills : ['Add Soft Skills'],
      languages: data.languages || [],
      template,
      colorScheme,
      fontFamily: fontFamily as 'Arial' | 'Helvetica' | 'Times New Roman' | 'Calibri' | 'Georgia',
      showPhoto
    };
  };

  return (
    <div className={`cv-preview-container ${className}`}>
      {/* Export Controls */}
      {showExportButtons && (
        <div className="no-print export-buttons cv-preview-controls flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Export:</span>
            <Button
              onClick={() => handleExport('docx')}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              {isExporting && exportFormat === 'docx' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Export as Word
            </Button>
          </div>
          
          {onToggleFullScreen && (
            <Button
              onClick={onToggleFullScreen}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              {isFullScreen ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Exit Full Screen
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Full Screen Preview
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* CV Preview */}
      <div className={`cv-preview-wrapper ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-900 p-8 overflow-auto' : 'border border-slate-700 rounded-lg overflow-hidden bg-slate-900 p-4'}`}>
        <div 
          ref={cvRef}
          id={cvElementId}
          className={`bg-white rounded shadow-sm overflow-hidden transition-all duration-300 ${
            isFullScreen ? 'max-w-4xl mx-auto' : 'max-h-96 overflow-y-auto'
          }`}
          style={{
            minHeight: isFullScreen ? 'auto' : '400px',
            transform: isFullScreen ? 'scale(1)' : 'scale(0.8)',
            transformOrigin: 'top center'
          }}
        >
          <CVTemplate
            data={getPreviewData()}
            template={template}
            colorScheme={colorScheme}
            fontFamily={fontFamily}
            showPhoto={showPhoto}
            customSections={customSections}
          />
        </div>
        
        {/* Real-time Update Indicator */}
        <div className="no-print mt-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Preview - Updates in Real Time
          </span>
        </div>
      </div>

      {/* Loading Overlay */}
      {isExporting && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300">
              Exporting CV as {exportFormat?.toUpperCase()}...
            </p>
            <p className="text-sm text-slate-400 mt-2">
              This may take a few moments
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CVPreview;
