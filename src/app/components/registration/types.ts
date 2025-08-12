export interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface FormFieldProps {
  id: string;
  name: keyof FormData;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon: React.ReactNode;
  label: string;
  required?: boolean;
}

export interface SocialAuthProps {
  callbackUrl?: string;
  onSocialLogin?: (provider: 'github' | 'google' | 'facebook') => void;
}

export interface TermsAndPrivacyProps {
  className?: string;
}
