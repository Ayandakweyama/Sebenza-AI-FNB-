import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
 
export default async function Page() {
  // Check if user is already signed in
  const { userId } = await auth();
  
  if (userId) {
    // User is already signed in, redirect to dashboard
    redirect('/dashboard');
  }
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="Sebenza AI" 
              width={60} 
              height={60}
              className="rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to access your account</p>
        </div>
        
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none w-full p-6",
                headerTitle: "text-2xl font-bold text-white text-center mb-1",
                headerSubtitle: "text-gray-400 text-center mb-6",
                socialButtonsBlockButton: "border-gray-700 hover:bg-slate-800/50 transition-all duration-200",
                socialButtonsBlockButtonText: "text-gray-200 font-medium",
                dividerLine: "bg-gray-800",
                dividerText: "text-gray-500 text-sm font-medium my-4",
                formFieldLabel: "text-gray-300 text-sm font-medium mb-1.5",
                formFieldInput: "bg-slate-800/50 border border-slate-700 text-white rounded-lg h-11 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-gray-500",
                formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-300",
                footerActionText: "text-gray-400 text-sm text-center mt-6",
                footerActionLink: "text-blue-400 hover:text-blue-300 font-medium transition-colors",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/20",
                formHeaderTitle: "text-white text-2xl font-bold mb-1 text-center",
                formHeaderSubtitle: "text-gray-400 text-center mb-6",
                identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
              },
              variables: {
                colorPrimary: '#3b82f6',
                colorText: '#f8fafc',
                colorTextSecondary: '#94a3b8',
                colorBackground: '#0f172a',
                colorInputBackground: '#1e293b',
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Secured by <span className="text-blue-400">Clerk</span></p>
        </div>
      </div>
    </div>
  );
}
