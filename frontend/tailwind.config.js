/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // StadiumPass Brand Colors
        'sp-navy':    '#0f172a',   // Deep Navy Background
        'sp-dark':    '#1e293b',   // Card Background
        'sp-darker':  '#0a0f1e',   // Deeper Background
        'sp-surface': '#1a2540',   // Surface Layer
        'sp-border':  '#2d3f5c',   // Border Color
        'sp-green':   '#22c55e',   // Cricket Green (Primary)
        'sp-green-light': '#4ade80',
        'sp-green-dark':  '#16a34a',
        'sp-gold':    '#eab308',   // Stadium Gold (Accent)
        'sp-gold-light':  '#facc15',
        'sp-gold-dark':   '#ca8a04',
        'sp-blue':    '#3b82f6',   // Selected Seat
        'sp-red':     '#ef4444',   // Booked Seat
        'sp-text':    '#e2e8f0',   // Primary Text
        'sp-muted':   '#94a3b8',   // Muted Text
        'sp-glass':   'rgba(30,41,59,0.7)',
      },
      fontFamily: {
        'display': ['"Rajdhani"', 'sans-serif'],
        'body':    ['"DM Sans"', 'sans-serif'],
        'mono':    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'stadium-gradient': 'linear-gradient(135deg, #0f172a 0%, #0a1628 50%, #0d1f3c 100%)',
        'card-gradient':    'linear-gradient(145deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
        'green-gradient':   'linear-gradient(135deg, #22c55e, #16a34a)',
        'gold-gradient':    'linear-gradient(135deg, #eab308, #ca8a04)',
        'hero-gradient':    'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,1) 100%)',
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-green': '0 0 20px rgba(34,197,94,0.3), 0 0 40px rgba(34,197,94,0.1)',
        'glow-gold':  '0 0 20px rgba(234,179,8,0.3), 0 0 40px rgba(234,179,8,0.1)',
        'card':       '0 4px 24px rgba(0,0,0,0.5)',
        'ticket':     '0 20px 60px rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '16px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'shimmer':    'shimmer 2s infinite linear',
        'ticker':     'ticker 30s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'slide-up':   'slideUp 0.5s ease-out',
        'fade-in':    'fadeIn 0.4s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(34,197,94,0.2)' },
          to:   { boxShadow: '0 0 30px rgba(34,197,94,0.6)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
