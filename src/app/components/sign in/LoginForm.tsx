'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import FormField from '../registration/FormField';
import SocialAuth from '../registration/SocialAuth';
import TermsAndPrivacy from '../registration/TermsAndPrivacy';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginFormContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for error in URL (e.g., from auth failure redirect)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setError('An error occurred during sign in');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push(callbackUrl);
      }
    } catch (err: any) {
      console.error('Error signing in:', err);
      setError(err.errors?.[0]?.message || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (!isLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider.toLowerCase()}`,
        redirectUrl: callbackUrl,
        redirectUrlComplete: callbackUrl,
      });
    } catch (err: any) {
      console.error('Error with social login:', err);
      setError('Failed to sign in with social provider');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-white/80">Sign in to your Sebenza AI account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-md text-sm flex items-start">
            <div className="mr-2 mt-0.5 flex-shrink-0">
              <FiAlertCircle />
            </div>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <FormField
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            icon={<FiMail />}
            required
            autoComplete="email"
          />

          <FormField
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            icon={<FiLock />}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-600 rounded bg-slate-700"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-white/80">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-purple-400 hover:text-purple-300">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                Sign in
                <FiArrowRight className="ml-2" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <SocialAuth callbackUrl={callbackUrl} onSocialLogin={handleSocialLogin} />
        </div>
      </div>

      <div className="text-center text-sm text-white/80 mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-purple-400 hover:text-purple-300">
          Sign up
        </Link>
      </div>

      <TermsAndPrivacy className="mt-6" />
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/80">Sign in to your Sebenza AI account</p>
        </div>
        <div className="animate-pulse bg-slate-800 rounded-lg p-6">
          <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-10 bg-slate-700 rounded mb-4"></div>
          <div className="h-10 bg-slate-700 rounded mb-4"></div>
          <div className="h-10 bg-slate-700 rounded"></div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
