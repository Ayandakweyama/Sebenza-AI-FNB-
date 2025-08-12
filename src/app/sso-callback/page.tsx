import { SignIn } from '@clerk/nextjs';
 
export default function SSOCallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <SignIn 
        path="/sso-callback" 
        routing="path" 
        signUpUrl="/sign-up"
        redirectUrl="/dashboard"
      />
    </div>
  );
}
