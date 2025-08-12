import { Button } from '@/components/ui/button';
import { Bookmark, Clock, MapPin, Briefcase, DollarSign, ExternalLink } from 'lucide-react';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  skills?: string[];
  match?: number;
  isSaved?: boolean;
}

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string) => void;
  onView?: (jobId: string) => void;
  variant?: 'default' | 'saved' | 'application' | 'alert';
}

export function JobCard({ job, onSave, onView, variant = 'default' }: JobCardProps) {
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave(job.id);
  };

  const handleView = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onView) onView(job.id);
  };

  return (
    <div className="group bg-slate-800/50 hover:bg-slate-800/70 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-200 cursor-pointer">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">{job.title}</h3>
          <p className="text-purple-200">{job.company} • {job.location}</p>
          
          {job.match && (
            <div className="mt-2 flex items-center">
              <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                <div 
                  className="bg-yellow-400 h-1.5 rounded-full" 
                  style={{ width: `${job.match}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-yellow-400">{job.match}% match</span>
            </div>
          )}
        </div>
        <button 
          onClick={handleSave}
          className={`p-2 rounded-lg ${job.isSaved ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
          aria-label={job.isSaved ? 'Unsave job' : 'Save job'}
        >
          <Bookmark className={`h-5 w-5 ${job.isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center text-slate-300">
          <Briefcase className="h-4 w-4 mr-2 text-purple-400" />
          <span>{job.type}</span>
        </div>
        <div className="flex items-center text-slate-300">
          <DollarSign className="h-4 w-4 mr-2 text-green-400" />
          <span>{job.salary}</span>
        </div>
        <div className="flex items-center text-slate-300">
          <Clock className="h-4 w-4 mr-2 text-blue-400" />
          <span>Posted {job.posted}</span>
        </div>
      </div>

      <p className="mt-4 text-slate-300 line-clamp-2">{job.description}</p>

      {job.skills && job.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center text-xs text-slate-400">
          <span>Posted {job.posted}</span>
          {variant === 'saved' && (
            <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
              Saved
            </span>
          )}
          {variant === 'application' && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
              Applied
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:text-purple-400 transition-colors"
          onClick={handleView}
        >
          View Details
          <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>
    </div>
  );
}
