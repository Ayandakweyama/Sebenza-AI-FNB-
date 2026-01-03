# Profile Data Usage Guide

This guide explains how to use user profile data throughout the Sebenza AI FNB application.

## Overview

The profile data system consists of:
1. **ProfileContext** - Central state management for profile data
2. **ProfileDataService** - Service for data persistence and synchronization
3. **useUserProfile** hook - Easy access to profile data with convenience methods
4. **useProfile** hook - Direct access to profile context with update methods

## Quick Start

### 1. Import the hook

```typescript
import { useUserProfile } from '@/hooks/useUserProfile';
// OR
import { useProfile } from '@/contexts/ProfileContext';
```

### 2. Use in your component

```typescript
function MyComponent() {
  const userProfile = useUserProfile();
  
  return (
    <div>
      <h1>Welcome, {userProfile.fullName}!</h1>
      <p>Your job title: {userProfile.jobTitle}</p>
      <p>Your skills: {userProfile.allSkills.join(', ')}</p>
    </div>
  );
}
```

## Available Data

### Basic Information
- `fullName` - User's full name (firstName + lastName)
- `initials` - User's initials for avatars
- `email` - Primary email address
- `phone` - Phone number
- `location` - User's location
- `bio` - User's bio/description

### Career Information
- `jobTitle` - Current or desired job title
- `targetIndustries` - Array of target industries
- `jobTypes` - Array of preferred job types
- `salaryExpectation` - Salary expectation (number)
- `remotePreference` - Remote work preference
- `experienceLevel` - Calculated experience level

### Skills
- `technicalSkills` - Array of technical skills with levels
- `softSkills` - Array of soft skills
- `languages` - Array of languages with proficiency
- `allSkills` - Combined array of all skills for display

### Education & Experience
- `education` - Array of education entries
- `workExperience` - Array of work experience entries
- `latestEducation` - Most recent education entry
- `latestWorkExperience` - Most recent work experience

### CV Preferences
- `cvStyle` - CV style preferences (template, color, font, etc.)

### Profile Status
- `completionPercentage` - Profile completion percentage (0-100)
- `isProfileComplete` - Boolean indicating if profile is 80%+ complete
- `hasBasicInfo`, `hasEducation`, `hasWorkExperience`, `hasSkills`, `hasGoals` - Section completion status

## Usage Examples

### 1. Display User Greeting

```typescript
function Header() {
  const { fullName, initials, email } = useUserProfile();
  
  return (
    <header>
      <div className="user-avatar">{initials}</div>
      <div className="user-info">
        <h2>{fullName || 'Welcome!'}</h2>
        <p className="email">{email}</p>
      </div>
    </header>
  );
}
```

### 2. Job Search with Profile Preferences

```typescript
function JobSearch() {
  const { 
    jobTitle, 
    targetIndustries, 
    jobTypes, 
    remotePreference,
    salaryExpectation 
  } = useUserProfile();
  
  const searchJobs = () => {
    const filters = {
      keywords: jobTitle,
      industries: targetIndustries,
      types: jobTypes,
      remote: remotePreference === 'Remote',
      salary: salaryExpectation
    };
    
    // Use filters for job search API
    fetchJobs(filters);
  };
  
  return (
    <div>
      <button onClick={searchJobs}>
        Search Jobs Based on Your Profile
      </button>
    </div>
  );
}
```

### 3. Skills Display

```typescript
function SkillsSection() {
  const { technicalSkills, softSkills, languages } = useUserProfile();
  
  return (
    <div>
      <h3>Technical Skills</h3>
      {technicalSkills.map(skill => (
        <Badge key={skill.name}>
          {skill.name} ({skill.level})
        </Badge>
      ))}
      
      <h3>Soft Skills</h3>
      {softSkills.map(skill => (
        <Badge key={skill} variant="secondary">
          {skill}
        </Badge>
      ))}
      
      <h3>Languages</h3>
      {languages.map(lang => (
        <Badge key={lang.name} variant="outline">
          {lang.name} ({lang.proficiency})
        </Badge>
      ))}
    </div>
  );
}
```

### 4. Profile Completion Indicator

```typescript
function ProfileProgress() {
  const { completionPercentage, isProfileComplete } = useUserProfile();
  
  return (
    <div>
      <h3>Profile Completion</h3>
      <Progress value={completionPercentage} />
      <p>{completionPercentage}% Complete</p>
      {isProfileComplete ? (
        <p className="text-green-600">Your profile is ready!</p>
      ) : (
        <p className="text-orange-600">Complete your profile for better results</p>
      )}
    </div>
  );
}
```

### 5. CV Generation with Profile Data

```typescript
function CVGenerator() {
  const { 
    fullName, 
    email, 
    phone, 
    location, 
    workExperience, 
    education, 
    technicalSkills,
    cvStyle 
  } = useUserProfile();
  
  const generateCV = () => {
    const cvData = {
      personalInfo: { fullName, email, phone, location },
      experience: workExperience,
      education,
      skills: technicalSkills,
      style: cvStyle
    };
    
    // Generate CV with profile data
    generateDocument(cvData);
  };
  
  return <button onClick={generateCV}>Generate CV</button>;
}
```

### 6. Updating Profile Data

```typescript
function ProfileEditor() {
  const profile = useProfile();
  
  const handleUpdate = async (data) => {
    const success = await profile.updateProfile(data);
    if (success) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error('Failed to update profile');
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleUpdate(Object.fromEntries(formData));
    }}>
      <input name="firstName" defaultValue={profile.profile?.firstName} />
      <input name="lastName" defaultValue={profile.profile?.lastName} />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

### 7. Conditional Rendering Based on Profile

```typescript
function PersonalizedContent() {
  const { hasBasicInfo, hasWorkExperience, jobTitle, experienceLevel } = useUserProfile();
  
  if (!hasBasicInfo) {
    return <CompleteProfilePrompt />;
  }
  
  if (!hasWorkExperience) {
    return <AddExperiencePrompt />;
  }
  
  return (
    <div>
      <h2>Recommended Jobs for {jobTitle}</h2>
      <JobList level={experienceLevel} />
    </div>
  );
}
```

### 8. Export Profile Data

```typescript
function ProfileExport() {
  const { formatForAPI } = useUserProfile();
  
  const exportProfile = () => {
    const profileData = formatForAPI();
    console.log('Profile data for API:', profileData);
    
    // Send to API
    fetch('/api/some-endpoint', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  };
  
  return <button onClick={exportProfile}>Export Profile</button>;
}
```

## Best Practices

### 1. Use the appropriate hook
- Use `useUserProfile` for displaying data and convenience methods
- Use `useProfile` when you need to update profile data

### 2. Handle loading states
```typescript
function UserProfile() {
  const { fullName, isLoading, error } = useUserProfile();
  
  if (isLoading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Welcome, {fullName}!</div>;
}
```

### 3. Check for data existence
```typescript
function UserHeader() {
  const { fullName, initials } = useUserProfile();
  
  return (
    <div>
      <div className="avatar">
        {initials || '?'}
      </div>
      <h1>{fullName || 'Guest User'}</h1>
    </div>
  );
}
```

### 4. Use computed properties
The hook provides computed properties like `experienceLevel`, `allSkills`, and section completion status. Use these instead of calculating them yourself.

### 5. Profile data persistence
Profile data is automatically synchronized with:
- Local storage for immediate access
- Database via API calls
- Global state via context

## Data Flow

1. **User fills profile form** → Data saved to localStorage + API
2. **ProfileContext** listens for changes and updates state
3. **useUserProfile** hook provides latest data to components
4. **Components** use data for personalized experiences

## API Integration

The profile system integrates with:
- `/api/profile` - GET/PUT profile data
- `/api/auth/sync-user` - User synchronization
- Clerk authentication for user identification

## Troubleshooting

### Profile data not loading
1. Check if user is authenticated (`isLoaded && isSignedIn`)
2. Verify API endpoints are working
3. Check browser console for errors

### Data not updating
1. Ensure you're using the update methods from `useProfile`
2. Check for network errors in browser dev tools
3. Verify API responses

### Performance issues
1. Profile data is cached in localStorage
2. Only re-fetches when needed
3. Use computed properties instead of recalculating

## File Structure

```
src/
├── contexts/
│   └── ProfileContext.tsx          # Main context provider
├── hooks/
│   ├── useUserProfile.ts           # Convenience hook
│   └── useProfileStrength.ts       # Profile strength calculation
├── services/
│   └── profileDataService.ts       # Data persistence service
├── app/
│   ├── api/profile/route.ts        # Profile API endpoints
│   └── profile/personal/           # Profile forms and components
└── components/
    └── examples/
        └── ProfileDataExample.tsx   # Usage examples
```

This system ensures that user profile data is consistently available throughout the application, with automatic synchronization, caching, and easy access patterns.
