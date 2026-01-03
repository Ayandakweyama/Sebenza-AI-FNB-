'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  FileText, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Upload,
  X,
  Plus,
  Sparkles,
  Copy,
  RefreshCw,
  User,
  Briefcase,
  GraduationCap,
  Award
} from 'lucide-react';
import { parseCV, extractSkillsFromCV } from '@/lib/cvParser';
import { useProfileStrength } from '@/hooks/useProfileStrength';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileFormData } from '@/app/profile/personal/profile.schema';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface JobData {
  title: string;
  company: string;
  description: string;
  location?: string;
  type?: string;
  salary?: string;
}

// Enhanced profile interface that integrates with the main profile system
interface EnhancedUserProfile {
  // Basic info from main profile
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  
  // Experience and education
  workExperience: Array<{
    company: string;
    position: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
  }>;
  
  // Skills
  technicalSkills: Array<{
    name: string;
    level: string;
  }>;
  softSkills: string[];
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  
  // Career preferences
  jobTitle: string;
  industries: string[];
  jobTypes: string[];
  remotePreference: string;
  careerGoals: string;
  salaryExpectation?: number;
  
  // CV preferences
  template: string;
  colorScheme: string;
  fontFamily: string;
}

// Legacy interface for backward compatibility
interface UserProfile {
  skills: string[];
  experience: string;
  level: string;
  preferences: string;
}

interface ApplicationPackage {
  tailoredCV: string;
  coverLetter: string;
  applicationAnswers: Record<string, string>;
  skillGapNotes: string[];
  marketInsights: {
    salaryRange: string;
    demandLevel: string;
    keySkills: string[];
  };
}

interface CVParseResult {
  skills: string[];
  experience: string;
  level: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select level' },
  { value: 'Entry Level', label: 'Entry Level (0-2 years)' },
  { value: 'Mid Level', label: 'Mid Level (2-5 years)' },
  { value: 'Senior Level', label: 'Senior Level (5-10 years)' },
  { value: 'Lead/Principal', label: 'Lead/Principal (10+ years)' }
] as const;

// ============================================================================
// Utility Functions
// ============================================================================

const determineExperienceLevel = (experience: any[]): string => {
  const totalYears = experience.reduce((acc, exp) => {
    const yearMatch = exp.duration?.match(/(\d+)\s*years?/i);
    return acc + (yearMatch ? parseInt(yearMatch[1]) : 0);
  }, 0);

  if (totalYears >= 10) return 'Lead/Principal';
  if (totalYears >= 5) return 'Senior Level';
  if (totalYears >= 2) return 'Mid Level';
  return 'Entry Level';
};

const formatExperience = (experience: any[]): string => {
  return experience.map(exp => {
    const parts = [];
    if (exp.position) parts.push(exp.position);
    if (exp.company) parts.push(`at ${exp.company}`);
    if (exp.duration) parts.push(`(${exp.duration})`);
    
    let result = parts.join(' ');
    if (exp.description) result += `\n\n${exp.description}`;
    
    return result;
  }).join('\n\n');
};

const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a PDF, DOC, DOCX, or TXT file'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }

  return { valid: true };
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.readAsText(file);
  });
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

interface SkillBadgeProps {
  skill: string;
  onRemove: (skill: string) => void;
  className?: string;
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, onRemove, className }) => (
  <Badge
    variant="secondary"
    className={`cursor-pointer hover:bg-slate-700 transition-colors ${className || ''}`}
    onClick={() => onRemove(skill)}
  >
    {skill}
    <X className="w-3 h-3 ml-1" />
  </Badge>
);

interface SkillInputProps {
  onAdd: (skill: string) => void;
  existingSkills: string[];
}

const SkillInput: React.FC<SkillInputProps> = ({ onAdd, existingSkills }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      
      if (trimmed && !existingSkills.includes(trimmed)) {
        onAdd(trimmed);
        setInputValue('');
        toast.success(`Added skill: ${trimmed}`);
      } else if (existingSkills.includes(trimmed)) {
        toast.error('Skill already exists');
      }
    }
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a skill and press Enter"
        aria-label="Add new skill"
      />
      <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
};

interface CVUploadProps {
  isUploading: boolean;
  cvFile: File | null;
  cvParsed: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

const CVUpload: React.FC<CVUploadProps> = ({ 
  isUploading, 
  cvFile, 
  cvParsed, 
  onUpload,
  onReset 
}) => (
  <div>
    <label className="block text-sm font-medium mb-2">
      Upload Current CV
      <span className="text-slate-400 ml-2 text-xs">(Optional - helps improve accuracy)</span>
    </label>
    <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 sm:p-6 hover:border-slate-500 transition-colors">
      <input
        type="file"
        accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(',')}
        onChange={onUpload}
        disabled={isUploading}
        className="hidden"
        id="cv-upload"
        aria-label="Upload CV file"
      />
      <label
        htmlFor="cv-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <span className="text-sm text-slate-400 text-center">Parsing CV...</span>
            <Progress value={66} className="w-full mt-2" />
          </>
        ) : cvFile ? (
          <>
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-sm text-slate-300 text-center break-all px-2">{cvFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onReset();
              }}
              className="mt-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Upload Different File
            </Button>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-400 text-center">
              Click to upload CV (PDF, DOC, DOCX, TXT)
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Max size: 5MB
            </span>
          </>
        )}
      </label>
    </div>
    {cvParsed && (
      <Alert className="mt-3 bg-green-950/30 border-green-900">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <AlertDescription className="text-green-300">
          CV parsed successfully! Skills and experience have been extracted.
        </AlertDescription>
      </Alert>
    )}
  </div>
);

interface ContentDisplayProps {
  content: string;
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  onCopy?: () => void;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ 
  content, 
  title, 
  icon, 
  iconColor,
  onCopy 
}) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          {icon}
          {title}
        </CardTitle>
        {onCopy && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="gap-2 w-full sm:w-auto"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 rounded-xl max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed space-y-4">
            {content.split('\n').map((line, index) => {
              let processedLine = line;
              
              // Handle ### headings first (convert to styled subsections)
              if (line.startsWith('###')) {
                processedLine = line.replace(/^###\s*/, '');
                return (
                  <div key={index} className="mt-6 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3 pb-2 border-b border-slate-700">
                      {processedLine}
                    </h3>
                  </div>
                );
              }
              
              // Handle # headings (main sections)
              if (line.startsWith('#') && !line.startsWith('###')) {
                return (
                  <div key={index} className="mt-8 mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4 pb-3 border-b border-blue-500/30">
                      {line.replace('#', '').trim()}
                    </h2>
                  </div>
                );
              }
              
              // Handle bullet points (including * characters at start of line)
              if (/^[\s]*[\*\-\•]\s/.test(line)) {
                return (
                  <div key={index} className="flex items-start gap-3 ml-4 mb-3 group">
                    <span className="text-blue-400 mt-1 text-sm font-bold group-hover:text-blue-300 transition-colors">•</span>
                    <span className="text-slate-200 flex-1 leading-relaxed">
                      {line.replace(/^[\s]*[\*\-\•]\s*/, '')}
                    </span>
                  </div>
                );
              }
              
              // Handle numbered lists
              if (/^\d+\./.test(line.trim())) {
                return (
                  <div key={index} className="flex items-start gap-3 ml-4 mb-3 group">
                    <span className="text-blue-400 font-bold text-sm group-hover:text-blue-300 transition-colors min-w-[20px]">
                      {line.match(/^\d+\./)?.[0]}
                    </span>
                    <span className="text-slate-200 flex-1 leading-relaxed">
                      {line.replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                );
              }
              
              // Handle bold text
              if (processedLine.includes('**')) {
                processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
              }
              
              // Handle empty lines
              if (processedLine.trim() === '') {
                return <div key={index} className="h-4" />;
              }
              
              // Regular text
              return (
                <p key={index} className="mb-3 text-slate-200 leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: processedLine }} />
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// Profile Strength Display Component
// ============================================================================

interface ProfileStrengthDisplayProps {
  percentage: number;
  label: string;
  color: string;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
}

const ProfileStrengthDisplay: React.FC<ProfileStrengthDisplayProps> = ({
  percentage,
  label,
  color,
  recommendations,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-slate-400">Loading profile data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 sm:mb-6 border-red-900">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>Unable to load profile data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 sm:mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-semibold text-white">Profile Strength</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
              {percentage}%
            </span>
            <Badge variant={percentage >= 70 ? 'default' : 'secondary'}>
              {label}
            </Badge>
          </div>
        </div>
        
        <Progress value={percentage} className="mb-4" />
        
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-400 mb-2">Recommendations:</h4>
            <div className="space-y-1">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/profile/personal'}
            className="w-full"
          >
            <Award className="w-4 h-4 mr-2" />
            Complete Your Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function ApplicationsPage() {
  const { user } = useUser();
  
  // Enhanced Profile Integration
  const { 
    percentage: profileStrength, 
    label: strengthLabel, 
    color: strengthColor, 
    recommendations: strengthRecommendations,
    isLoading: isProfileLoading,
    error: profileError 
  } = useProfileStrength();
  
  // Access to user profile data throughout the app
  const userProfileData = useUserProfile();
  
  // State Management
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvParsed, setCvParsed] = useState(false);
  const [cvText, setCvText] = useState<string>('');
  
  // Enhanced profile state
  const [enhancedProfile, setEnhancedProfile] = useState<EnhancedUserProfile | null>(null);
  
  const [jobData, setJobData] = useState<JobData>({
    title: '',
    company: '',
    description: '',
    location: '',
    type: '',
    salary: ''
  });
  
  // Legacy profile state for backward compatibility
  const [userProfile, setUserProfile] = useState<UserProfile>({
    skills: [],
    experience: '',
    level: '',
    preferences: ''
  });
  
  const [applicationPackage, setApplicationPackage] = useState<ApplicationPackage | null>(null);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const isFormValid = useMemo(() => 
    Boolean(jobData.title && jobData.company && jobData.description),
    [jobData.title, jobData.company, jobData.description]
  );

  const canGeneratePackage = useMemo(() => 
    isFormValid && !isLoading,
    [isFormValid, isLoading]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // ============================================================================
  // API Calls
  // ============================================================================

  const loadUserProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile({
          skills: data.profile?.skills || [],
          experience: data.profile?.experience || '',
          level: data.profile?.level || '',
          preferences: data.profile?.preferences || ''
        });
        
        // Set enhanced profile with full data
        setEnhancedProfile({
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          email: data.user?.email || '',
          phone: data.profile?.phone || '',
          location: data.profile?.location || '',
          bio: data.profile?.bio || '',
          
          workExperience: data.experience?.map((exp: any) => ({
            company: exp.company,
            position: exp.position,
            description: exp.description || '',
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            current: exp.current || false
          })) || [],
          
          education: data.education?.map((edu: any) => ({
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: new Date(edu.startDate),
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
            current: edu.current || false
          })) || [],
          
          technicalSkills: data.skills
            ?.filter((s: any) => s.category === 'technical')
            ?.map((s: any) => ({
              name: s.name,
              level: s.proficiency || 'Intermediate'
            })) || [],
          
          softSkills: data.skills
            ?.filter((s: any) => s.category === 'soft')
            ?.map((s: any) => s.name) || [],
            
          languages: data.skills
            ?.filter((s: any) => s.category === 'language')
            ?.map((s: any) => ({
              name: s.name,
              proficiency: s.proficiency || 'Conversational'
            })) || [],
          
          jobTitle: data.jobPreferences?.jobTitle || '',
          industries: data.jobPreferences?.industries || [],
          jobTypes: data.jobPreferences?.desiredRoles || [],
          remotePreference: data.jobPreferences?.remoteWork ? 'Remote' : 'Flexible',
          careerGoals: data.jobPreferences?.careerGoals || '',
          salaryExpectation: data.jobPreferences?.salaryExpectation,
          
          template: data.cvStyle?.template || 'Professional',
          colorScheme: data.cvStyle?.colorScheme || '#2563eb',
          fontFamily: data.cvStyle?.fontFamily || 'Arial'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Silent fail - use empty profile
    }
  }, []);

  const generateApplicationPackage = useCallback(async () => {
    if (!isFormValid) {
      toast.error('Please fill in all required job information');
      return;
    }

    setIsLoading(true);
    setActiveTab('results');

    try {
      const response = await fetch('/api/applications/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobData,
          userProfile,
          cvText: cvText || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate application package');
      }

      const data = await response.json();
      setApplicationPackage(data);
      toast.success('Application package generated successfully!');
    } catch (error) {
      console.error('Error generating package:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate application package. Please try again.'
      );
      setActiveTab('input');
    } finally {
      setIsLoading(false);
    }
  }, [jobData, userProfile, cvText, isFormValid]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleJobDataChange = useCallback((field: keyof JobData, value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleProfileChange = useCallback((field: keyof UserProfile, value: string | string[]) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSkillAdd = useCallback((skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !userProfile.skills.includes(trimmed)) {
      setUserProfile(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
      toast.success(`Added skill: ${trimmed}`);
    }
  }, [userProfile.skills]);

  const handleSkillRemove = useCallback((skillToRemove: string) => {
    setUserProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
    toast.info(`Removed skill: ${skillToRemove}`);
  }, []);

  const handleCVUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);
    setCvFile(file);

    try {
      const text = await readFileAsText(file);
      const parsedCV = parseCV(text);
      const extractedSkills = extractSkillsFromCV(text);

      setCvText(text);

      const experienceText = formatExperience(parsedCV.experience);

      setUserProfile(prev => ({
        ...prev,
        skills: [...new Set([...prev.skills, ...extractedSkills])],
        experience: prev.experience || experienceText,
        level: prev.level || determineExperienceLevel(parsedCV.experience)
      }));

      setCvParsed(true);
      
      const feedback = [
        `CV parsed successfully!`,
        `Found ${extractedSkills.length} skills`,
        parsedCV.experience.length > 0 
          ? `Extracted ${parsedCV.experience.length} work experiences` 
          : null,
        parsedCV.education.length > 0 
          ? `Found ${parsedCV.education.length} education entries` 
          : null
      ].filter(Boolean).join(' • ');
      
      toast.success(feedback);
    } catch (error) {
      console.error('Error parsing CV:', error);
      toast.error('Failed to parse CV. Please try again or enter data manually.');
      setCvFile(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleCVReset = useCallback(() => {
    setCvFile(null);
    setCvParsed(false);
    setCvText('');
  }, []);

  const handleCopyContent = useCallback(async (content: string, label: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success(`${label} copied to clipboard!`);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  const downloadPackage = useCallback(() => {
    if (!applicationPackage) return;

    const packageData = {
      jobData,
      userProfile,
      generatedAt: new Date().toISOString(),
      ...applicationPackage
    };

    const blob = new Blob([JSON.stringify(packageData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `application-${jobData.company.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Package downloaded successfully!');
  }, [applicationPackage, jobData, userProfile]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="container mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-8">
          <a 
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left h-5 w-5 mr-2" aria-hidden="true">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
            Back to Dashboard
          </a>
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent text-center">
            Application Assistant
          </h1>
        </div>
        <p className="text-slate-400 text-sm sm:text-base text-center px-2">
          Transform job postings into ready-to-submit application packages with AI-powered customization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input" className="flex items-center gap-2 text-xs sm:text-sm">
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Input Data</span>
            <span className="sm:hidden">Input</span>
          </TabsTrigger>
          <TabsTrigger 
            value="results" 
            className="flex items-center gap-2 text-xs sm:text-sm" 
            disabled={!applicationPackage}
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Generated Package</span>
            <span className="sm:hidden">Results</span>
            {applicationPackage && (
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                Ready
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ====================================================================== */}
        {/* Input Tab */}
        {/* ====================================================================== */}
        <TabsContent value="input" className="space-y-4 sm:space-y-6">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Job Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Job Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter the job details you want to apply for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="job-title" className="block text-xs sm:text-sm font-medium mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="job-title"
                    value={jobData.title}
                    onChange={(e) => handleJobDataChange('title', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    required
                    className="text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-xs sm:text-sm font-medium mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="company"
                    value={jobData.company}
                    onChange={(e) => handleJobDataChange('company', e.target.value)}
                    placeholder="e.g., Tech Corp"
                    required
                    className="text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs sm:text-sm font-medium mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="description"
                    value={jobData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleJobDataChange('description', e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={8}
                    required
                    className="text-sm resize-y"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {jobData.description.length} characters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="location" className="block text-xs sm:text-sm font-medium mb-2">
                      Location
                    </label>
                    <Input
                      id="location"
                      value={jobData.location}
                      onChange={(e) => handleJobDataChange('location', e.target.value)}
                      placeholder="e.g., Remote, Cape Town"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-xs sm:text-sm font-medium mb-2">
                      Job Type
                    </label>
                    <Input
                      id="type"
                      value={jobData.type}
                      onChange={(e) => handleJobDataChange('type', e.target.value)}
                      placeholder="e.g., Full-time"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="salary" className="block text-xs sm:text-sm font-medium mb-2">
                    Salary Range
                  </label>
                  <Input
                    id="salary"
                    value={jobData.salary}
                    onChange={(e) => handleJobDataChange('salary', e.target.value)}
                    placeholder="e.g., R800k - R1.2M"
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* User Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  Your Profile
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your skills and experience for customization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* CV Text Input */}
                <div>
                  <label htmlFor="cv-text" className="block text-xs sm:text-sm font-medium mb-2">
                    CV Text <span className="text-slate-400 text-xs">(Copy and paste your CV text here)</span>
                  </label>
                  <Textarea
                    id="cv-text"
                    value={cvText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCvText(e.target.value)}
                    placeholder="Paste your CV text here. Include your work experience, education, skills, and any other relevant information..."
                    rows={8}
                    className="text-sm resize-y"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {cvText.length} characters
                  </p>
                </div>

                {/* Experience Level */}
                <div>
                  <label htmlFor="level" className="block text-xs sm:text-sm font-medium mb-2">
                    Experience Level
                  </label>
                  <select
                    id="level"
                    value={userProfile.level}
                    onChange={(e) => handleProfileChange('level', e.target.value)}
                    className="w-full p-2 text-sm rounded-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EXPERIENCE_LEVELS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preferences */}
                <div>
                  <label htmlFor="preferences" className="block text-xs sm:text-sm font-medium mb-2">
                    Preferences & Goals <span className="text-slate-400 text-xs">(Optional)</span>
                  </label>
                  <Textarea
                    id="preferences"
                    value={userProfile.preferences}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleProfileChange('preferences', e.target.value)}
                    placeholder="Work preferences, career goals, etc."
                    rows={3}
                    className="text-sm resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-2 sm:pt-4">
            <Button
              onClick={generateApplicationPackage}
              disabled={!canGeneratePackage}
              size="lg"
              className="w-full sm:w-auto sm:min-w-[250px] h-11 sm:h-12 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Generating Package...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Generate Application Package
                </>
              )}
            </Button>
          </div>

          {!isFormValid && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Please fill in the required fields: Job Title, Company Name, and Job Description
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* ====================================================================== */}
        {/* Results Tab */}
        {/* ====================================================================== */}
        <TabsContent value="results" className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-blue-500 mb-4" />
                <p className="text-base sm:text-lg text-slate-300 mb-2 text-center">
                  Generating your personalized application package...
                </p>
                <p className="text-xs sm:text-sm text-slate-500 text-center">
                  This may take 30-60 seconds
                </p>
                <Progress value={45} className="w-48 sm:w-64 mt-4" />
              </CardContent>
            </Card>
          ) : applicationPackage ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Market Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    Market Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center p-3 sm:p-4 bg-slate-900 rounded-lg">
                      <h4 className="font-medium text-slate-400 mb-2 text-xs sm:text-sm">Salary Range</h4>
                      <p className="text-lg sm:text-2xl font-bold text-green-500">
                        {applicationPackage.marketInsights.salaryRange}
                      </p>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-slate-900 rounded-lg">
                      <h4 className="font-medium text-slate-400 mb-2 text-xs sm:text-sm">Demand Level</h4>
                      <Badge 
                        variant={
                          applicationPackage.marketInsights.demandLevel === 'High' 
                            ? 'default' 
                            : 'secondary'
                        }
                        className="text-base sm:text-lg px-3 sm:px-4 py-1"
                      >
                        {applicationPackage.marketInsights.demandLevel}
                      </Badge>
                    </div>
                    <div className="p-3 sm:p-4 bg-slate-900 rounded-lg sm:col-span-2 md:col-span-1">
                      <h4 className="font-medium text-slate-400 mb-2 text-xs sm:text-sm">Top Skills</h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {applicationPackage.marketInsights.keySkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skill Gap Analysis */}
              {applicationPackage.skillGapNotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                      Skill Gap Analysis
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Areas to emphasize or improve
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 sm:space-y-3">
                      {applicationPackage.skillGapNotes.map((note, index) => (
                        <Alert key={index} className="bg-amber-950/20 border-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <AlertDescription className="text-amber-200 text-xs sm:text-sm">
                            {note}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tailored CV */}
              <ContentDisplay
                title="Tailored CV Recommendations"
                icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
                iconColor="blue"
                content={applicationPackage.tailoredCV}
                onCopy={() => handleCopyContent(applicationPackage.tailoredCV, 'CV recommendations')}
              />

              {/* Cover Letter */}
              <ContentDisplay
                title="Custom Cover Letter"
                icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />}
                iconColor="purple"
                content={applicationPackage.coverLetter}
                onCopy={() => handleCopyContent(applicationPackage.coverLetter, 'Cover letter')}
              />

              {/* Application Answers */}
              {Object.keys(applicationPackage.applicationAnswers).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      Pre-filled Application Answers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {Object.entries(applicationPackage.applicationAnswers).map(([question, answer]) => (
                        <div 
                          key={question} 
                          className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2 bg-slate-900 rounded-r"
                        >
                          <h4 className="font-medium mb-2 text-slate-200 text-sm sm:text-base">{question}</h4>
                          <p className="text-slate-400 text-xs sm:text-sm">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Button 
                  onClick={() => window.location.href = '/dashboard'} 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={downloadPackage} 
                  size="lg" 
                  className="w-full sm:w-auto sm:min-w-[200px] text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Package
                </Button>
                <Button 
                  onClick={() => setActiveTab('input')} 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12 sm:py-16 px-4">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base mb-4">
                  No application package generated yet.
                </p>
                <Button
                  onClick={() => setActiveTab('input')}
                  variant="outline"
                  className="text-sm"
                >
                  Go to Input
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}