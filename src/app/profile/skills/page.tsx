'use client';

import { useState } from 'react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { SkillsManager } from '../personal/components/SkillsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Users, Globe, Trophy, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SkillsManagementPage() {
  const [activeTab, setActiveTab] = useState('technical');

  const languageProficiencyOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'fluent', label: 'Fluent' },
    { value: 'native', label: 'Native' }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <DashboardNavigation 
          title="Skills & Languages Management"
          description="Manage your professional skills and language proficiencies"
        />

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Technical Skills</p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <Code className="h-8 w-8 text-blue-400" />
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              Most in-demand category
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Soft Skills</p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
            <div className="mt-4 flex items-center text-xs text-green-400">
              <Award className="h-3 w-3 mr-1" />
              Essential for leadership
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Languages</p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <Globe className="h-8 w-8 text-purple-400" />
            </div>
            <div className="mt-4 flex items-center text-xs text-purple-400">
              <Trophy className="h-3 w-3 mr-1" />
              Global opportunities
            </div>
          </div>
        </motion.div>

        {/* Skills Management Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
              <TabsTrigger 
                value="technical" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Code className="h-4 w-4 mr-2" />
                Technical
              </TabsTrigger>
              <TabsTrigger 
                value="soft"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Soft Skills
              </TabsTrigger>
              <TabsTrigger 
                value="languages"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Globe className="h-4 w-4 mr-2" />
                Languages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technical" className="mt-6">
              <SkillsManager
                category="technical"
                title="Technical Skills"
                icon={<Code className="h-5 w-5 text-blue-400" />}
              />
            </TabsContent>

            <TabsContent value="soft" className="mt-6">
              <SkillsManager
                category="soft"
                title="Soft Skills"
                icon={<Users className="h-5 w-5 text-green-400" />}
              />
            </TabsContent>

            <TabsContent value="languages" className="mt-6">
              <SkillsManager
                category="language"
                title="Languages"
                icon={<Globe className="h-5 w-5 text-purple-400" />}
                proficiencyOptions={languageProficiencyOptions}
              />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl p-6 border border-blue-500/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">💡 Pro Tips</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <p>Keep your skills updated to match current industry demands</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              <p>Highlight skills that are most relevant to your target roles</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">•</span>
              <p>Include proficiency levels to give recruiters a clear picture</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400">•</span>
              <p>Soft skills are as important as technical skills for most roles</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
