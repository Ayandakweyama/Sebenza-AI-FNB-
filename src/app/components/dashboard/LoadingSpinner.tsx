import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'minimal' | 'energetic';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Loading',
  fullScreen = true,
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: { outer: 'w-12 h-12', middle: 'w-10 h-10', inner: 'w-3 h-3', glow: 'w-24 h-24' },
    md: { outer: 'w-16 h-16', middle: 'w-14 h-14', inner: 'w-4 h-4', glow: 'w-32 h-32' },
    lg: { outer: 'w-24 h-24', middle: 'w-20 h-20', inner: 'w-6 h-6', glow: 'w-48 h-48' },
  };

  const currentSize = sizeClasses[size];

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-slate-900'
    : 'flex items-center justify-center p-8';

  const variants = {
    default: {
      outerRing: 'border-slate-700/50 border-t-pink-500',
      middleRing: 'border-slate-700/30 border-b-purple-500',
      innerDot: 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-pink-500/50',
      glow: 'from-pink-500 to-purple-600',
    },
    minimal: {
      outerRing: 'border-slate-700/30 border-t-slate-400',
      middleRing: 'border-slate-700/20 border-b-slate-500',
      innerDot: 'bg-slate-400 shadow-slate-400/30',
      glow: 'from-slate-400 to-slate-500',
    },
    energetic: {
      outerRing: 'border-slate-700/50 border-t-cyan-400',
      middleRing: 'border-slate-700/30 border-b-fuchsia-500',
      innerDot: 'bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 shadow-cyan-400/50',
      glow: 'from-cyan-400 via-purple-500 to-fuchsia-600',
    },
  };

  const currentVariant = variants[variant];

  return (
    <div className={containerClasses} role="status" aria-live="polite" aria-label={message}>
      <div className="relative flex flex-col items-center gap-4">
        {/* Main spinner container */}
        <div className="relative">
          {/* Outer ring - smooth rotation */}
          <div
            className={`${currentSize.outer} rounded-full border-4 ${currentVariant.outerRing} animate-spin transition-all`}
            style={{ animationDuration: '1.2s' }}
          ></div>

          {/* Middle ring - reverse rotation with easing */}
          <div
            className={`absolute inset-1 ${currentSize.middle} rounded-full border-4 ${currentVariant.middleRing} animate-spin`}
            style={{
              animationDirection: 'reverse',
              animationDuration: '1.8s',
              animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
            }}
          ></div>

          {/* Inner pulsing dot with scale animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`${currentSize.inner} ${currentVariant.innerDot} rounded-full animate-pulse shadow-lg`}
              style={{ animationDuration: '1.5s' }}
            ></div>
          </div>

          {/* Orbiting particles (energetic variant only) */}
          {variant === 'energetic' && (
            <>
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: '2s' }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full blur-[1px]"></div>
              </div>
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-fuchsia-400 rounded-full blur-[1px]"></div>
              </div>
            </>
          )}
        </div>

        {/* Loading text with animated dots */}
        {message && (
          <div className="relative overflow-hidden">
            <span className="text-sm font-medium text-slate-400 tracking-wider">
              {message}
            </span>
            <span className="inline-flex ml-1" aria-hidden="true">
              <span
                className="animate-bounce text-pink-400"
                style={{ animationDelay: '0ms', animationDuration: '1s' }}
              >
                .
              </span>
              <span
                className="animate-bounce text-pink-400"
                style={{ animationDelay: '200ms', animationDuration: '1s' }}
              >
                .
              </span>
              <span
                className="animate-bounce text-pink-400"
                style={{ animationDelay: '400ms', animationDuration: '1s' }}
              >
                .
              </span>
            </span>
          </div>
        )}

        {/* Enhanced glow effect */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-20 pointer-events-none">
          <div
            className={`${currentSize.glow} bg-gradient-to-r ${currentVariant.glow} rounded-full animate-pulse mx-auto`}
            style={{ animationDuration: '2s' }}
          ></div>
        </div>

        {/* Ripple effect background */}
        {variant === 'energetic' && (
          <div className="absolute inset-0 -z-20 pointer-events-none">
            <div className="absolute inset-0 animate-ping opacity-10">
              <div className="w-full h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Accessibility - screen reader only text */}
      <span className="sr-only">{message}, please wait...</span>
    </div>
  );
};