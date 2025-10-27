'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const jobTypes = [
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'internship', label: 'Internship' },
  { id: 'remote', label: 'Remote' },
];

const experienceLevels = [
  { id: 'entry', label: 'Entry Level' },
  { id: 'mid', label: 'Mid Level' },
  { id: 'senior', label: 'Senior Level' },
  { id: 'lead', label: 'Lead' },
];

export function FilterPanel() {
  const [salaryRange, setSalaryRange] = useState([50, 200]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const toggleJobType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleExperienceLevel = (levelId: string) => {
    setSelectedLevels(prev =>
      prev.includes(levelId)
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Job Type</h3>
          <div className="space-y-2">
            {jobTypes.map(type => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => toggleJobType(type.id)}
                />
                <Label htmlFor={type.id} className="text-sm font-normal">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Experience Level</h3>
          <div className="space-y-2">
            {experienceLevels.map(level => (
              <div key={level.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`exp-${level.id}`}
                  checked={selectedLevels.includes(level.id)}
                  onCheckedChange={() => toggleExperienceLevel(level.id)}
                />
                <Label htmlFor={`exp-${level.id}`} className="text-sm font-normal">
                  {level.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Salary Range (K$)</h3>
          <div className="px-2">
            <Slider
              value={salaryRange}
              onValueChange={setSalaryRange}
              min={0}
              max={300}
              step={10}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>R{salaryRange[0]}K</span>
              <span>R{salaryRange[1]}+K</span>
            </div>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
