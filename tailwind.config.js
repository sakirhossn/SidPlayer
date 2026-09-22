/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sid: {
          950: '#07080b',
          900: '#0c0e14',
          850: '#11141e',
          800: '#171b28',
          700: '#22283a',
          600: '#323b54',
          500: '#475569',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          accentGlow: 'rgba(59, 130, 246, 0.4)',
          amber: '#f59e0b',
          rose: '#f43f5e',
          emerald: '#10b981',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Cascadia Code', 'Fira Code', 'monospace']
      },
      backdropBlur: {
        xs: '2px',
        md: '8px',
        lg: '16px',
        xl: '24px'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shutter': 'shutterFlash 0.35s ease-out forwards',
        'ripple': 'rippleEffect 0.6s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shutterFlash: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '0' }
        },
        rippleEffect: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}
