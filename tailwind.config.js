/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        mono: ['Share Tech Mono', 'monospace'],
        script: ['Dancing Script', 'cursive'],
      },
      colors: {
        neon: {
          pink: '#ff2d78',
          purple: '#b44fff',
          magenta: '#ff00aa',
        },
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.2 },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 20px #ff2d78, 0 0 40px #ff2d78' },
          '50%': { textShadow: '0 0 40px #ff2d78, 0 0 80px #b44fff, 0 0 120px #ff2d78' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        twinkle: 'twinkle 2s ease-in-out infinite',
        heartbeat: 'heartbeat 1.5s ease-in-out infinite',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
