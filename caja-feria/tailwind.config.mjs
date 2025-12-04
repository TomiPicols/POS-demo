/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F5F7',
        card: '#FFFFFF',
        text: '#111827',
        textSoft: '#6B7280',
        accent: '#0F75F6',
        borderSoft: '#E5E7EB',
        muted: '#F0F1F5',
        sidebar: '#0B0B0B',
        sidebarText: '#E5E7EB',
        sidebarMuted: '#9CA3AF',
        panel: '#121212',
        panelAlt: '#1B1B1B',
        panelBorder: '#262626',
      },
      borderRadius: {
        xl: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 60px -35px rgba(0,0,0,0.35)',
        soft: '0 12px 32px -24px rgba(0,0,0,0.28)',
        pill: '0 8px 20px -12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
