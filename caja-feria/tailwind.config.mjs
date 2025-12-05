/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f8e6e1',
        card: '#ffffff',
        text: '#2c0f0f',
        textSoft: '#8f5b5b',
        accent: '#c7362f',
        borderSoft: '#e8c8c2',
        muted: '#f3d6cf',
        sidebar: '#fdf3f0',
        sidebarText: '#2c0f0f',
        sidebarMuted: '#9c6b6b',
        panel: '#fff7f4',
        panelAlt: '#fff0ec',
        panelBorder: '#e5c6c0',
      },
      borderRadius: {
        xl: '16px',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 70px -38px rgba(0,0,0,0.55)',
        soft: '0 16px 40px -32px rgba(0,0,0,0.45)',
        pill: '0 10px 26px -16px rgba(0,0,0,0.32)',
      },
    },
  },
  plugins: [],
};
