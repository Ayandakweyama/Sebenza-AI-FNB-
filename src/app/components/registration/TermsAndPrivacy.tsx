import React from 'react';
import Link from 'next/link';
import { TermsAndPrivacyProps } from './types';

const TermsAndPrivacy: React.FC<TermsAndPrivacyProps> = ({ className = '' }) => {
  return (
    <div className={`text-center text-sm text-slate-500 ${className}`}>
      <p>By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
          Privacy Policy
        </Link>.
      </p>
    </div>
  );
};

export default TermsAndPrivacy;
