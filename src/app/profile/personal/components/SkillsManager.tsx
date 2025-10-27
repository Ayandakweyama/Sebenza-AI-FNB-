'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  X, 
  Edit2, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Globe,
  Code,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Skill {
  id?: string;
  name: string;
  category: 'technical' | 'soft' | 'language';
  proficiency: string;
  level: number;
  isEditing?: boolean;
  isNew?: boolean;
}

interface SkillsManagerProps {
  category: 'technical' | 'soft' | 'language';
  title: string;
  icon?: React.ReactNode;
  proficiencyOptions?: { value: string; label: string }[];
}

export function SkillsManager({ 
  category, 
  title, 
  icon,
  proficiencyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ]
}: SkillsManagerProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch existing skills
  useEffect(() => {
    fetchSkills();
  }, [category]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/skills?category=${category}`);
      if (response.ok) {
        const data = await response.json();
        setSkills(data.map((skill: any) => ({
          ...skill,
          isEditing: false,
          isNew: false
        })));
      } else {
        toast.error('Failed to load skills');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Error loading skills');
    } finally {
      setLoading(false);
    }
  };

  const addNewSkill = () => {
    const newSkill: Skill = {
      name: '',
      category,
      proficiency: category === 'language' ? 'conversational' : 'intermediate',
      level: 2,
      isEditing: true,
      isNew: true
    };
    setSkills([...skills, newSkill]);
  };

  const saveSkill = async (index: number) => {
    const skill = skills[index];
    
    if (!skill.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    setSaving(skill.id || 'new');
    
    try {
      if (skill.isNew) {
        // Create new skill
        const response = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: skill.name,
            category: skill.category,
            proficiency: skill.proficiency,
            level: skill.level
          })
        });

        if (response.ok) {
          const newSkill = await response.json();
          const updatedSkills = [...skills];
          updatedSkills[index] = {
            ...newSkill,
            isEditing: false,
            isNew: false
          };
          setSkills(updatedSkills);
          toast.success(`${title} added successfully`);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to create skill');
        }
      } else if (skill.id) {
        // Update existing skill
        const response = await fetch(`/api/skills/${skill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: skill.name,
            proficiency: skill.proficiency,
            level: skill.level
          })
        });

        if (response.ok) {
          const updatedSkill = await response.json();
          const updatedSkills = [...skills];
          updatedSkills[index] = {
            ...updatedSkill,
            isEditing: false,
            isNew: false
          };
          setSkills(updatedSkills);
          toast.success(`${title} updated successfully`);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to update skill');
        }
      }
    } catch (error: any) {
      console.error('Error saving skill:', error);
      const errorMessage = error.message || `Failed to save ${title.toLowerCase()}`;
      toast.error(errorMessage);
    } finally {
      setSaving(null);
    }
  };

  const deleteSkill = async (index: number) => {
    const skill = skills[index];
    
    if (skill.isNew) {
      // Just remove from local state if it's new
      setSkills(skills.filter((_, i) => i !== index));
      return;
    }

    if (!skill.id) return;

    setDeleting(skill.id);
    
    try {
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSkills(skills.filter((_, i) => i !== index));
        toast.success(`${title} deleted successfully`);
      } else {
        throw new Error('Failed to delete skill');
      }
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error(`Failed to delete ${title.toLowerCase()}`);
    } finally {
      setDeleting(null);
    }
  };

  const toggleEdit = (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index].isEditing = !updatedSkills[index].isEditing;
    setSkills(updatedSkills);
  };

  const updateSkillField = (index: number, field: keyof Skill, value: any) => {
    const updatedSkills = [...skills];
    (updatedSkills[index] as any)[field] = value;
    
    // Update level based on proficiency for consistency
    if (field === 'proficiency') {
      updatedSkills[index].level = 
        value === 'beginner' ? 1 :
        value === 'intermediate' ? 2 :
        value === 'advanced' ? 3 : 4;
    }
    
    setSkills(updatedSkills);
  };

  const cancelEdit = (index: number) => {
    const skill = skills[index];
    if (skill.isNew) {
      setSkills(skills.filter((_, i) => i !== index));
    } else {
      toggleEdit(index);
      // Refresh to reset changes
      fetchSkills();
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    if (category === 'technical') return <Code className="h-5 w-5" />;
    if (category === 'soft') return <Users className="h-5 w-5" />;
    if (category === 'language') return <Globe className="h-5 w-5" />;
    return null;
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'expert':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'advanced':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'beginner':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Loading {title.toLowerCase()}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-sm text-slate-400">({skills.length})</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addNewSkill}
          className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {title.split(' ')[0]}
        </Button>
      </div>

      <div className="space-y-3">
        {skills.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <AlertCircle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400">No {title.toLowerCase()} added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNewSkill}
              className="mt-3 text-blue-400 border-blue-500/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first {title.split(' ')[0].toLowerCase()}
            </Button>
          </div>
        ) : (
          skills.map((skill, index) => (
            <div
              key={skill.id || `new-${index}`}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 transition-all hover:border-slate-600/50"
            >
              {skill.isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-400">Name</Label>
                      <Input
                        value={skill.name}
                        onChange={(e) => updateSkillField(index, 'name', e.target.value)}
                        placeholder={`Enter ${title.split(' ')[0].toLowerCase()} name`}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Proficiency</Label>
                      <select
                        value={skill.proficiency}
                        onChange={(e) => updateSkillField(index, 'proficiency', e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                      >
                        {proficiencyOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelEdit(index)}
                      disabled={saving === (skill.id || 'new')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => saveSkill(index)}
                      disabled={saving === (skill.id || 'new')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saving === (skill.id || 'new') ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-white">{skill.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs border ${getProficiencyColor(skill.proficiency)}`}>
                        {proficiencyOptions.find(o => o.value === skill.proficiency)?.label || skill.proficiency}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleEdit(index)}
                      className="text-slate-400 hover:text-blue-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSkill(index)}
                      disabled={deleting === skill.id}
                      className="text-slate-400 hover:text-red-400"
                    >
                      {deleting === skill.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
