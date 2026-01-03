/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Force hex colors instead of oklch - comprehensive override
        transparent: 'transparent',
        current: 'currentColor',
        black: '#000000',
        white: '#ffffff',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        yellow: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      animation: {
        'blob': 'blob 7s infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'spin-slower': 'spin-slower 12s linear infinite',
        'scan-line': 'scan-line 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'pulse-rotate': 'pulse-rotate 2s ease-in-out infinite',
        'float-up': 'float-up 2s ease-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
        'flip-3d': 'flip-3d 2s ease-in-out infinite',
        'scale-pulse': 'scale-pulse 2s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
        'tilt': 'tilt 3s ease-in-out infinite',
        'fade-in-scale': 'fade-in-scale 0.5s ease-out',
        'border-glow': 'border-glow 2s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
        },
        'spin-slow': {
          from: {
            transform: 'rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
          },
        },
        'spin-slower': {
          from: {
            transform: 'rotate(0deg)',
          },
          to: {
            transform: 'rotate(360deg)',
          },
        },
        'scan-line': {
          '0%': {
            top: '-2px',
            opacity: '0',
          },
          '50%': {
            opacity: '1',
          },
          '100%': {
            top: '100%',
            opacity: '0',
          },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%) translateY(-100%) rotate(30deg)',
          },
          '100%': {
            transform: 'translateX(100%) translateY(100%) rotate(30deg)',
          },
        },
        breathe: {
          '0%, 100%': {
            opacity: '0.4',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.05)',
          },
        },
        'pulse-rotate': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1) rotate(0deg)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.1) rotate(180deg)',
          },
        },
        'float-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '50%': {
            opacity: '1',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
        },
        'gradient-shift': {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
        'glow-pulse': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(236, 72, 153, 0.3)',
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(236, 72, 153, 0.6)',
          },
        },
        'bounce-subtle': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-4px)',
          },
        },
        'flip-3d': {
          '0%': {
            transform: 'perspective(400px) rotateY(0)',
          },
          '100%': {
            transform: 'perspective(400px) rotateY(360deg)',
          },
        },
        'scale-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.9',
          },
        },
        ripple: {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        tilt: {
          '0%, 100%': {
            transform: 'rotate(0deg)',
          },
          '25%': {
            transform: 'rotate(2deg)',
          },
          '75%': {
            transform: 'rotate(-2deg)',
          },
        },
        'fade-in-scale': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'border-glow': {
          '0%, 100%': {
            'border-color': 'rgba(236, 72, 153, 0.3)',
          },
          '50%': {
            'border-color': 'rgba(236, 72, 153, 0.8)',
          },
        },
      },
      perspective: {
        '1000': '1000px',
        '2000': '2000px',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  corePlugins: {
    // Disable modern color functions
    preflight: false,
  },
  plugins: [],
}
