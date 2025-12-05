/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f6f7f4',
        card: '#ffffff',
        text: '#1f2623',
        textSoft: '#66716c',
        accent: '#2f7a61',
        highlight: '#c94b40',
        borderSoft: '#e2e6df',
        muted: '#eef1eb',
        sidebar: '#fbfcfb',
        sidebarText: '#1f2623',
        sidebarMuted: '#7a847f',
        panel: '#ffffff',
        panelAlt: '#f3f6f2',
        panelBorder: '#e0e5dd',
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
