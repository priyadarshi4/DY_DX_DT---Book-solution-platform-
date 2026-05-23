/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8ee',
          100: '#f9edce',
          200: '#f3d99b',
          300: '#ecc060',
          400: '#e4a830',
          500: '#c8a96e',
          600: '#b8923a',
          700: '#9a742e',
          800: '#7d5e28',
          900: '#654d22'
        },
        obsidian: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#c4c4c9',
          300: '#a0a0a9',
          400: '#6b6b78',
          500: '#3f3f47',
          600: '#2a2a30',
          700: '#1c1c22',
          800: '#141418',
          900: '#0a0a0e',
          950: '#050507'
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(200,169,110,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,169,110,0.04) 1px, transparent 1px)
        `,
        'gold-gradient': 'linear-gradient(135deg, #c8a96e 0%, #e4c78b 50%, #b8923a 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0e 0%, #141418 100%)'
      },
      backgroundSize: {
        'grid': '40px 40px'
      },
      animation: {
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out'
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(200,169,110,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(200,169,110,0.4)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      boxShadow: {
        'gold': '0 0 20px rgba(200,169,110,0.3)',
        'gold-lg': '0 0 40px rgba(200,169,110,0.4)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      }
    }
  },
  plugins: []
};
