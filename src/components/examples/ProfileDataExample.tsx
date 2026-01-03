'use client';

import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProfile } from '@/contexts/ProfileContext';

/**
 * Example component demonstrating profile data usage throughout the app
 * This shows how any component can access user profile data
 */
export function ProfileDataExample() {
  const userProfile = useUserProfile();
  const profileContext = useProfile();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Profile Data Access Examples</h2>
      
      {/* Basic Profile Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Full Name:</p>
            <p className="font-medium">{userProfile.fullName || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email:</p>
            <p className="font-medium">{userProfile.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location:</p>
            <p className="font-medium">{userProfile.location || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone:</p>
            <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Career Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Career Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Job Title:</p>
            <p className="font-medium">{userProfile.jobTitle || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Experience Level:</p>
            <p className="font-medium">{userProfile.experienceLevel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Remote Preference:</p>
            <p className="font-medium">{userProfile.remotePreference}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Salary Expectation:</p>
            <p className="font-medium">
              {userProfile.salaryExpectation 
                ? `R${userProfile.salaryExpectation.toLocaleString()}` 
                : 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Skills</h3>
        <div className="space-y-2">
          {userProfile.technicalSkills.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Technical Skills:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {userProfile.technicalSkills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {skill.name} ({skill.level})
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {userProfile.softSkills.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Soft Skills:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {userProfile.softSkills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {userProfile.languages.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Languages:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {userProfile.languages.map((lang, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm"
                  >
                    {lang.name} ({lang.proficiency})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latest Education */}
      {userProfile.latestEducation && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Latest Education</h3>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="font-medium">{userProfile.latestEducation.degree}</p>
            <p className="text-sm text-gray-600">{userProfile.latestEducation.institution}</p>
            <p className="text-sm text-gray-500">
              {userProfile.latestEducation.fieldOfStudy}
            </p>
          </div>
        </div>
      )}

      {/* Latest Work Experience */}
      {userProfile.latestWorkExperience && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Latest Work Experience</h3>
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="font-medium">{userProfile.latestWorkExperience.position}</p>
            <p className="text-sm text-gray-600">{userProfile.latestWorkExperience.company}</p>
            {userProfile.latestWorkExperience.description && (
              <p className="text-sm text-gray-500 mt-1">
                {userProfile.latestWorkExperience.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Profile Completion */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Profile Completion</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${userProfile.completionPercentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {userProfile.completionPercentage}% Complete
          {userProfile.isProfileComplete && ' - Profile is ready!'}
        </p>
      </div>

      {/* Profile Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Profile Sections Status</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-2 rounded ${userProfile.hasBasicInfo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Basic Info: {userProfile.hasBasicInfo ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${userProfile.hasEducation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Education: {userProfile.hasEducation ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${userProfile.hasWorkExperience ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Work Experience: {userProfile.hasWorkExperience ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${userProfile.hasSkills ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Skills: {userProfile.hasSkills ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${userProfile.hasGoals ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Career Goals: {userProfile.hasGoals ? '✓' : '✗'}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {profileContext.isLoading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      )}

      {/* Error State */}
      {profileContext.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {profileContext.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => profileContext.loadProfile()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh Profile
        </button>
        <button
          onClick={() => console.log('Profile Data:', userProfile.formatForAPI())}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Log Profile Data
        </button>
      </div>
    </div>
  );
}

/**
 * Example usage in other components:
 * 
 * // 1. Import the hook
 * import { useUserProfile } from '@/hooks/useUserProfile';
 * 
 * // 2. Use in component
 * function MyComponent() {
 *   const userProfile = useUserProfile();
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {userProfile.fullName}!</h1>
 *       <p>Your job title: {userProfile.jobTitle}</p>
 *       <p>Your skills: {userProfile.allSkills.join(', ')}</p>
 *     </div>
 *   );
 * }
 * 
 * // 3. For direct profile context access
 * import { useProfile } from '@/contexts/ProfileContext';
 * 
 * function ProfileEditor() {
 *   const profile = useProfile();
 *   
 *   const handleUpdate = async (data) => {
 *     const success = await profile.updateProfile(data);
 *     if (success) {
 *       console.log('Profile updated!');
 *     }
 *   };
 *   
 *   return <form onSubmit={handleUpdate}>...</form>;
 * }
 */
