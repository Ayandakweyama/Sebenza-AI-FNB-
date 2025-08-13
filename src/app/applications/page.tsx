export default function ApplicationsDisabledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 max-w-md w-full">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-2">Temporarily Unavailable</h1>
        <p className="text-slate-400 mb-6">This feature is currently being updated to serve you better.</p>
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <code className="text-sm text-slate-300">{"{"}</code>
          <code className="text-sm text-red-400">"error"</code>
          <code className="text-sm text-slate-300">: </code>
          <code className="text-sm text-amber-300">"This feature is temporarily disabled for deployment"</code>
          <code className="text-sm text-slate-300">{"}"}</code>
        </div>
        <div className="mt-8">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
