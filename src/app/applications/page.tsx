'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  X,
  Plus,
  Sparkles,
  Copy,
  RefreshCw,
  User,
  Award,
  ChevronLeft,
  BarChart3,
  Lightbulb,
  ClipboardList,
  Wand2,
} from 'lucide-react';
import { parseCV, extractSkillsFromCV } from '@/lib/cvParser';
import { useProfileStrength } from '@/hooks/useProfileStrength';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { extractTextFromFile } from '@/lib/fileTextExtractor';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface JobData {
  title: string;
  company: string;
  description: string;
  location?: string;
  type?: string;
  salary?: string;
}

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

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
} as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select level' },
  { value: 'Entry Level', label: 'Entry Level (0–2 years)' },
  { value: 'Mid Level', label: 'Mid Level (2–5 years)' },
  { value: 'Senior Level', label: 'Senior Level (5–10 years)' },
  { value: 'Lead/Principal', label: 'Lead / Principal (10+ years)' },
] as const;

const GENERATION_STEPS = [
  'Analysing job requirements…',
  'Matching your profile…',
  'Tailoring your CV…',
  'Drafting cover letter…',
  'Compiling market insights…',
  'Finalising package…',
];

// ============================================================================
// Utility helpers
// ============================================================================

const determineExperienceLevel = (experience: any[]): string => {
  const totalYears = experience.reduce((acc, exp) => {
    const match = exp.duration?.match(/(\d+)\s*years?/i);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);
  if (totalYears >= 10) return 'Lead/Principal';
  if (totalYears >= 5) return 'Senior Level';
  if (totalYears >= 2) return 'Mid Level';
  return 'Entry Level';
};

const formatExperience = (experience: any[]): string =>
  experience
    .map((exp) => {
      const parts: string[] = [];
      if (exp.position) parts.push(exp.position);
      if (exp.company) parts.push(`at ${exp.company}`);
      if (exp.duration) parts.push(`(${exp.duration})`);
      return [parts.join(' '), exp.description].filter(Boolean).join('\n\n');
    })
    .join('\n\n');

const validateFile = (file: File): { valid: boolean; error?: string } => {
  const allowedExts = Object.values(ACCEPTED_FILE_TYPES).flat() as string[];
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type) && !allowedExts.includes(ext)) {
    return { valid: false, error: 'Please upload a PDF, DOC, DOCX, or TXT file.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5 MB.' };
  }
  return { valid: true };
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// Animation variants
// ============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

// ============================================================================
// Sub-components
// ============================================================================

/** Character count with colour feedback */
const CharCount = ({ value, max }: { value: number; max?: number }) => (
  <span
    className={cn(
      'text-xs tabular-nums',
      max && value > max * 0.9 ? 'text-amber-400' : 'text-slate-500',
    )}
  >
    {value.toLocaleString()} {max ? `/ ${max.toLocaleString()}` : 'chars'}
  </span>
);

/** Skill pill with remove action */
const SkillBadge = ({
  skill,
  onRemove,
}: {
  skill: string;
  onRemove: (s: string) => void;
}) => (
  <motion.div layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
    <Badge
      variant="secondary"
      className="cursor-pointer select-none gap-1 pr-1.5 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
      onClick={() => onRemove(skill)}
    >
      {skill}
      <X className="w-2.5 h-2.5 opacity-60" />
    </Badge>
  </motion.div>
);

/** Inline skill entry field */
const SkillInput = ({
  onAdd,
  existingSkills,
}: {
  onAdd: (s: string) => void;
  existingSkills: string[];
}) => {
  const [value, setValue] = useState('');

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (existingSkills.includes(trimmed)) {
      toast.error('Skill already added');
      return;
    }
    onAdd(trimmed);
    setValue('');
  };

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
        placeholder="Type a skill and press Enter…"
        className="flex-1 text-sm"
        aria-label="Add skill"
      />
      <Button size="sm" variant="outline" onClick={commit} className="px-3 shrink-0">
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};

/** Animated generation progress overlay */
const GeneratingOverlay = ({ progress }: { progress: number }) => {
  const stepIndex = Math.min(
    Math.floor((progress / 100) * GENERATION_STEPS.length),
    GENERATION_STEPS.length - 1,
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-8 gap-6"
    >
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="4" />
          <motion.circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="url(#prog-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={175.9}
            strokeDashoffset={175.9 - (progress / 100) * 175.9}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <Wand2 className="absolute inset-0 m-auto w-6 h-6 text-pink-400" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-base font-medium text-white">
          Generating your package
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-slate-400"
          >
            {GENERATION_STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-xs space-y-1.5">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-slate-500 text-right tabular-nums">{Math.round(progress)}%</p>
      </div>
    </motion.div>
  );
};

/** Content card with copy capability */
const ContentDisplay = ({
  title,
  content,
  icon,
  onCopy,
}: {
  title: string;
  content: string;
  icon: React.ReactNode;
  onCopy?: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!onCopy) return;
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
            {icon}
            {title}
          </CardTitle>
          {onCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className={cn(
                'gap-1.5 text-xs shrink-0 transition-colors',
                copied ? 'text-green-400' : 'text-slate-400 hover:text-white',
              )}
            >
              {copied ? (
                <><CheckCircle className="w-3.5 h-3.5" /> Copied</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-slate-950/40 p-4 sm:p-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <MarkdownRenderer content={content} className="prose-sm" />
        </div>
      </CardContent>
    </Card>
  );
};

/** Profile strength panel */
const ProfileStrengthPanel = ({
  percentage,
  label,
  color,
  recommendations,
  isLoading,
  error,
}: {
  percentage: number;
  label: string;
  color: string;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
}) => {
  if (isLoading) {
    return (
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
          <span className="text-sm text-slate-400">Loading profile…</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 sm:mb-6 border-red-900/50">
        <CardContent className="p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">Unable to load profile data</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-slate-900 to-slate-900/80">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold text-white">Profile Strength</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent tabular-nums`}>
              {percentage}%
            </span>
            <Badge variant={percentage >= 70 ? 'default' : 'secondary'} className="text-xs">
              {label}
            </Badge>
          </div>
        </div>

        <Progress value={percentage} className="h-1.5 mb-3" />

        {recommendations.length > 0 && (
          <ul className="space-y-1 mb-3">
            {recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-8 border-slate-700 hover:border-slate-500"
          onClick={() => (window.location.href = '/profile/personal')}
        >
          <Award className="w-3.5 h-3.5 mr-1.5" />
          Complete Your Profile
        </Button>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function ApplicationsPage() {
  const { user } = useUser();

  const {
    percentage: profileStrength,
    label: strengthLabel,
    color: strengthColor,
    recommendations: strengthRecommendations,
    isLoading: isProfileLoading,
    error: profileError,
  } = useProfileStrength();

  // Hydration guard for Radix Tabs
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Core state
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [genProgress, setGenProgress] = useState(0);

  // CV state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvParsed, setCvParsed] = useState(false);
  const [cvText, setCvText] = useState('');

  // Form state
  const [jobData, setJobData] = useState<JobData>({
    title: '', company: '', description: '', location: '', type: '', salary: '',
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    skills: [], experience: '', level: '', preferences: '',
  });

  const [applicationPackage, setApplicationPackage] = useState<ApplicationPackage | null>(null);

  // Progress simulation ref
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ============================================================================
  // Derived
  // ============================================================================

  const isFormValid = useMemo(
    () => Boolean(jobData.title.trim() && jobData.company.trim() && jobData.description.trim()),
    [jobData.title, jobData.company, jobData.description],
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (user) loadUserProfile();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (progressRef.current) clearInterval(progressRef.current); }, []);

  // ============================================================================
  // Loaders
  // ============================================================================

  const loadUserProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) return;
      const data = await res.json();

      setUserProfile({
        skills: data.profile?.skills ?? [],
        experience: data.profile?.experience ?? '',
        level: data.profile?.level ?? '',
        preferences: data.profile?.preferences ?? '',
      });
    } catch {
      // Silent – user can fill manually
    }
  }, []);

  // ============================================================================
  // Generation
  // ============================================================================

  const startProgressSimulation = useCallback(() => {
    setGenProgress(0);
    progressRef.current = setInterval(() => {
      setGenProgress((prev) => {
        if (prev >= 90) {
          if (progressRef.current) clearInterval(progressRef.current);
          return prev;
        }
        return prev + Math.random() * 4;
      });
    }, 500);
  }, []);

  const stopProgressSimulation = useCallback((success: boolean) => {
    if (progressRef.current) clearInterval(progressRef.current);
    setGenProgress(success ? 100 : 0);
  }, []);

  const generateApplicationPackage = useCallback(async () => {
    if (!isFormValid) {
      toast.error('Please fill in Job Title, Company, and Job Description.');
      return;
    }

    setIsLoading(true);
    setActiveTab('results');
    startProgressSimulation();

    try {
      const res = await fetch('/api/applications/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobData, userProfile, cvText: cvText || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to generate application package');
      }

      const data = await res.json();
      stopProgressSimulation(true);
      setApplicationPackage(data);
      toast.success('Application package ready!');
    } catch (err) {
      stopProgressSimulation(false);
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setActiveTab('input');
    } finally {
      setIsLoading(false);
    }
  }, [jobData, userProfile, cvText, isFormValid, startProgressSimulation, stopProgressSimulation]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleJobChange = useCallback(
    (field: keyof JobData, value: string) => setJobData((p) => ({ ...p, [field]: value })),
    [],
  );

  const handleProfileChange = useCallback(
    (field: keyof UserProfile, value: string | string[]) =>
      setUserProfile((p) => ({ ...p, [field]: value })),
    [],
  );

  const handleSkillAdd = useCallback(
    (skill: string) => {
      const trimmed = skill.trim();
      if (!trimmed || userProfile.skills.includes(trimmed)) return;
      setUserProfile((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    },
    [userProfile.skills],
  );

  const handleSkillRemove = useCallback(
    (skill: string) =>
      setUserProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) })),
    [],
  );

  const handleCVUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const check = validateFile(file);
      if (!check.valid) { toast.error(check.error); return; }

      setIsUploading(true);
      setCvFile(file);

      try {
        const text = await extractTextFromFile(file);
        const parsed = parseCV(text);
        const skills = extractSkillsFromCV(text);

        setCvText(text);
        setUserProfile((prev) => ({
          ...prev,
          skills: [...new Set([...prev.skills, ...skills])],
          experience: prev.experience || formatExperience(parsed.experience),
          level: prev.level || determineExperienceLevel(parsed.experience),
        }));
        setCvParsed(true);
        toast.success(
          `CV parsed — ${skills.length} skills · ${parsed.experience.length} roles · ${parsed.education.length} education entries`,
        );
      } catch {
        toast.error('Failed to parse CV. Please paste text manually.');
        setCvFile(null);
      } finally {
        setIsUploading(false);
        // Reset input so the same file can be re-uploaded
        e.target.value = '';
      }
    },
    [],
  );

  const handleCopyContent = useCallback(async (content: string, label: string) => {
    const ok = await copyToClipboard(content);
    toast[ok ? 'success' : 'error'](ok ? `${label} copied!` : 'Copy failed');
  }, []);

  const downloadPackage = useCallback(() => {
    if (!applicationPackage) return;
    const payload = { jobData, userProfile, generatedAt: new Date().toISOString(), ...applicationPackage };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `application-${jobData.company.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Package downloaded!');
  }, [applicationPackage, jobData, userProfile]);

  const resetForNew = useCallback(() => {
    setApplicationPackage(null);
    setActiveTab('input');
    setGenProgress(0);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 10% 0%, rgba(236,72,153,.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(139,92,246,.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 container mx-auto pt-16 sm:pt-20 pb-10 px-4 max-w-6xl">

        {/* ── Header ── */}
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.div variants={fadeUp} className="mb-6">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:bg-slate-700/60 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Application Assistant
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Transform any job posting into a tailored CV, cover letter, and market intelligence — in seconds.
            </p>
          </motion.div>
        </motion.div>

        {/* ── Profile strength ── */}
        <ProfileStrengthPanel
          percentage={profileStrength}
          label={strengthLabel}
          color={strengthColor}
          recommendations={strengthRecommendations}
          isLoading={isProfileLoading}
          error={profileError}
        />

        {/* ── Tabs ── */}
        {mounted ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'input' | 'results')}
            className="space-y-5"
          >
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="input" className="text-xs sm:text-sm gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Job Details</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                disabled={!applicationPackage && !isLoading}
                className="text-xs sm:text-sm gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generated Package</span>
                {applicationPackage && !isLoading && (
                  <Badge variant="secondary" className="text-xs ml-1 h-4 px-1.5">Ready</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ================================================================ */}
            {/* INPUT TAB                                                        */}
            {/* ================================================================ */}
            <TabsContent value="input" className="space-y-5">
              <div className="grid lg:grid-cols-2 gap-5">

                {/* Job Information */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="h-full">
                    <CardHeader className="pb-3 border-b border-slate-800">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        Job Information
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Paste the job details you want to apply for
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label htmlFor="job-title" className="text-xs font-medium text-slate-300">
                            Job Title <span className="text-rose-400">*</span>
                          </label>
                          <Input
                            id="job-title"
                            value={jobData.title}
                            onChange={(e) => handleJobChange('title', e.target.value)}
                            placeholder="Senior Software Engineer"
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="company" className="text-xs font-medium text-slate-300">
                            Company <span className="text-rose-400">*</span>
                          </label>
                          <Input
                            id="company"
                            value={jobData.company}
                            onChange={(e) => handleJobChange('company', e.target.value)}
                            placeholder="Acme Corp"
                            className="text-sm h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label htmlFor="description" className="text-xs font-medium text-slate-300">
                            Job Description <span className="text-rose-400">*</span>
                          </label>
                          <CharCount value={jobData.description.length} />
                        </div>
                        <Textarea
                          id="description"
                          value={jobData.description}
                          onChange={(e) => handleJobChange('description', e.target.value)}
                          placeholder="Paste the full job description here…"
                          rows={9}
                          className="text-sm resize-y"
                        />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        {(
                          [
                            { id: 'location', label: 'Location', placeholder: 'Remote / Cape Town' },
                            { id: 'type', label: 'Job Type', placeholder: 'Full-time' },
                            { id: 'salary', label: 'Salary', placeholder: 'R800k–1.2M' },
                          ] as { id: keyof JobData; label: string; placeholder: string }[]
                        ).map(({ id, label, placeholder }) => (
                          <div key={id} className="space-y-1.5">
                            <label htmlFor={id} className="text-xs font-medium text-slate-400">
                              {label}
                            </label>
                            <Input
                              id={id}
                              value={jobData[id] ?? ''}
                              onChange={(e) => handleJobChange(id, e.target.value)}
                              placeholder={placeholder}
                              className="text-sm h-9"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Your Profile */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
                  <Card className="h-full">
                    <CardHeader className="pb-3 border-b border-slate-800">
                      <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        Your Profile
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Your background used for tailoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">

                      {/* CV text */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label htmlFor="cv-text" className="text-xs font-medium text-slate-300">
                            CV / Résumé Text
                          </label>
                          <CharCount value={cvText.length} />
                        </div>
                        <Textarea
                          id="cv-text"
                          value={cvText}
                          onChange={(e) => setCvText(e.target.value)}
                          placeholder="Paste your CV text here, or upload a file below…"
                          rows={6}
                          className="text-sm resize-y"
                        />
                      </div>

                      {/* File upload */}
                      <div>
                        <div className="border border-dashed border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
                          <input
                            type="file"
                            id="cv-upload"
                            accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(',')}
                            onChange={handleCVUpload}
                            disabled={isUploading}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-2">
                            {isUploading ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                <span className="text-xs text-slate-400">Parsing CV…</span>
                              </>
                            ) : cvFile && cvParsed ? (
                              <>
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <span className="text-xs text-slate-300 break-all text-center">{cvFile.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 text-slate-400 hover:text-white"
                                  onClick={() => { setCvFile(null); setCvParsed(false); setCvText(''); }}
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" /> Replace
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs text-slate-500">or upload PDF, DOC, DOCX, TXT (max 5 MB)</span>
                                <Button asChild variant="outline" size="sm" className="h-7 text-xs border-slate-700">
                                  <label htmlFor="cv-upload" className="cursor-pointer">Upload CV</label>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-300">Skills</label>
                        <SkillInput onAdd={handleSkillAdd} existingSkills={userProfile.skills} />
                        {userProfile.skills.length > 0 && (
                          <motion.div layout className="flex flex-wrap gap-1.5 pt-1">
                            {userProfile.skills.map((s) => (
                              <SkillBadge key={s} skill={s} onRemove={handleSkillRemove} />
                            ))}
                          </motion.div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Level */}
                        <div className="space-y-1.5">
                          <label htmlFor="level" className="text-xs font-medium text-slate-300">
                            Experience Level
                          </label>
                          <select
                            id="level"
                            value={userProfile.level}
                            onChange={(e) => handleProfileChange('level', e.target.value)}
                            className="w-full h-9 px-3 text-sm rounded-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {EXPERIENCE_LEVELS.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Preferences */}
                        <div className="space-y-1.5">
                          <label htmlFor="preferences" className="text-xs font-medium text-slate-300">
                            Preferences & Goals
                          </label>
                          <Textarea
                            id="preferences"
                            value={userProfile.preferences}
                            onChange={(e) => handleProfileChange('preferences', e.target.value)}
                            placeholder="Remote-first, growth-stage…"
                            rows={2}
                            className="text-sm resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Generate CTA */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="flex flex-col items-center gap-3 pt-2"
              >
                {!isFormValid && (
                  <Alert className="max-w-md">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Fill in Job Title, Company, and Job Description to continue.
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={generateApplicationPackage}
                  disabled={!isFormValid || isLoading}
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-56 h-11 text-sm bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 border-0 shadow-lg shadow-purple-900/30"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />Generate Application Package</>
                  )}
                </Button>
              </motion.div>
            </TabsContent>

            {/* ================================================================ */}
            {/* RESULTS TAB                                                      */}
            {/* ================================================================ */}
            <TabsContent value="results" className="space-y-5">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card>
                      <CardContent className="p-0">
                        <GeneratingOverlay progress={genProgress} />
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : applicationPackage ? (
                  <motion.div
                    key="results"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                    className="space-y-5"
                  >
                    {/* Market Intelligence */}
                    <motion.div variants={fadeUp}>
                      <Card>
                        <CardHeader className="pb-3 border-b border-slate-800">
                          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-green-400" />
                            Market Intelligence
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                              <p className="text-xs text-slate-500 mb-1">Salary Range</p>
                              <p className="text-lg font-bold text-green-400">
                                {applicationPackage.marketInsights.salaryRange}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                              <p className="text-xs text-slate-500 mb-2">Demand Level</p>
                              <Badge
                                variant={applicationPackage.marketInsights.demandLevel === 'High' ? 'default' : 'secondary'}
                                className="text-sm px-3 py-0.5"
                              >
                                {applicationPackage.marketInsights.demandLevel}
                              </Badge>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                              <p className="text-xs text-slate-500 mb-2">Key Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {applicationPackage.marketInsights.keySkills.map((s) => (
                                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Skill Gaps */}
                    {applicationPackage.skillGapNotes.length > 0 && (
                      <motion.div variants={fadeUp}>
                        <Card>
                          <CardHeader className="pb-3 border-b border-slate-800">
                            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                              Skill Gap Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-2">
                            {applicationPackage.skillGapNotes.map((note, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-200 text-xs"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                {note}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Tailored CV */}
                    <motion.div variants={fadeUp}>
                      <ContentDisplay
                        title="Tailored CV Recommendations"
                        icon={<FileText className="w-4 h-4 text-blue-400" />}
                        content={applicationPackage.tailoredCV}
                        onCopy={() => handleCopyContent(applicationPackage.tailoredCV, 'CV recommendations')}
                      />
                    </motion.div>

                    {/* Cover Letter */}
                    <motion.div variants={fadeUp}>
                      <ContentDisplay
                        title="Cover Letter"
                        icon={<FileText className="w-4 h-4 text-purple-400" />}
                        content={applicationPackage.coverLetter}
                        onCopy={() => handleCopyContent(applicationPackage.coverLetter, 'Cover letter')}
                      />
                    </motion.div>

                    {/* Application Answers */}
                    {Object.keys(applicationPackage.applicationAnswers).length > 0 && (
                      <motion.div variants={fadeUp}>
                        <Card>
                          <CardHeader className="pb-3 border-b border-slate-800">
                            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-teal-400" />
                              Pre-filled Application Answers
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-3">
                            {Object.entries(applicationPackage.applicationAnswers).map(([q, a]) => (
                              <div
                                key={q}
                                className="border-l-2 border-blue-500/50 pl-4 py-1.5"
                              >
                                <p className="text-xs font-semibold text-slate-300 mb-1">{q}</p>
                                <p className="text-xs text-slate-400 leading-relaxed">{a}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div
                      variants={fadeUp}
                      className="flex flex-col sm:flex-row justify-center gap-3 pt-2"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetForNew}
                        className="w-full sm:w-auto border-slate-700 text-sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        New Application
                      </Button>
                      <Button
                        size="sm"
                        onClick={downloadPackage}
                        className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 border-0 text-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Package
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card>
                      <CardContent className="flex flex-col items-center gap-4 py-16 px-8 text-center">
                        <FileText className="w-12 h-12 text-slate-700" />
                        <p className="text-sm text-slate-500">No package generated yet.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-sm"
                          onClick={() => setActiveTab('input')}
                        >
                          Go to Job Details
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
}
