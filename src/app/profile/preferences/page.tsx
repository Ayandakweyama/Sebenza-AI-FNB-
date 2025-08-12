import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Preferences - Sebenza AI',
  description: 'Set your job search preferences and career goals.'
};

export default function JobPreferencesPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          Job Preferences
        </h1>
        <p className="text-slate-400">
          Customize your job search criteria and career goals
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Job Type Preferences */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Job Type Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Employment Type
              </label>
              <div className="space-y-3">
                {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500"
                      defaultChecked={['Full-time', 'Contract'].includes(type)}
                    />
                    <span className="ml-3 text-slate-300">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Work Arrangement
              </label>
              <div className="space-y-3">
                {['On-site', 'Remote', 'Hybrid', 'Flexible'].map((arrangement) => (
                  <label key={arrangement} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500"
                      defaultChecked={['Remote', 'Hybrid'].includes(arrangement)}
                    />
                    <span className="ml-3 text-slate-300">{arrangement}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Salary Expectations */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Salary Expectations</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="salaryRange" className="block text-sm font-medium text-slate-300 mb-4">
                Expected Salary Range (per annum)
              </label>
              <div className="px-2">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                    style={{ width: '70%' }}
                  ></div>
                </div>
                <div className="flex justify-between mt-3 text-sm text-slate-400">
                  <span>R300,000</span>
                  <span>R1,500,000+</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="minSalary" className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum Salary (R)
                </label>
                <input
                  type="number"
                  id="minSalary"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                  placeholder="e.g. 500000"
                  defaultValue="500000"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                >
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Preferences */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Location Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="preferredLocation" className="block text-sm font-medium text-slate-300 mb-2">
                Preferred Location
              </label>
              <input
                type="text"
                id="preferredLocation"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                placeholder="e.g. Johannesburg, South Africa"
                defaultValue="Johannesburg, South Africa"
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to search for remote jobs worldwide
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Willing to Relocate?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocate"
                    className="h-4 w-4 border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500"
                    defaultChecked
                  />
                  <span className="ml-2 text-slate-300">Yes, anywhere</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocate"
                    className="h-4 w-4 border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="ml-2 text-slate-300">Within country</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="relocate"
                    className="h-4 w-4 border-slate-600 bg-slate-700 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="ml-2 text-slate-300">No</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Skills and Industries */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-white">Skills & Industries</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-slate-300 mb-2">
                Key Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'].map((skill) => (
                  <span key={skill} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-500/10 text-pink-300">
                    {skill}
                    <button type="button" className="ml-1.5 text-pink-400 hover:text-white">
                      <span className="sr-only">Remove {skill}</span>
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  id="skills"
                  className="flex-1 min-w-0 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-l-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                  placeholder="Add a skill..."
                />
                <button
                  type="button"
                  className="px-4 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-r-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="industries" className="block text-sm font-medium text-slate-300 mb-2">
                Preferred Industries
              </label>
              <select
                id="industries"
                multiple
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                defaultValue={['Technology', 'Finance']}
              >
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Hold Ctrl/Cmd to select multiple options
              </p>
            </div>
          </div>
        </div>
        
        {/* Save Preferences */}
        <div className="flex justify-end pt-2">
          <div className="flex space-x-4">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
