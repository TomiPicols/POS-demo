import type { ReactNode } from 'react';

type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    key: 'overview',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none" strokeWidth="1.8">
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M7 11v7h4v-4h2v4h4v-7" />
      </svg>
    ),
  },
  {
    key: 'sales',
    label: 'Ventas',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none" strokeWidth="1.8">
        <path d="M5 5h2l1.5 10h9l1-6h-11" />
        <circle cx="9" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
      </svg>
    ),
  },
  {
    key: 'closing',
    label: 'Cierre',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none" strokeWidth="1.8">
        <rect x="6" y="9" width="12" height="10" rx="2" />
        <path d="M9 9V7a3 3 0 0 1 6 0v2" />
        <path d="M12 13v3" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Ajustes',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12.9c0-.3.2-.6.4-.8l.9-.7-1.1-1.9-.9.4a1 1 0 0 1-1.1-.2l-.2-.2a1 1 0 0 1-.3-1.1l.3-.9-2-.8-.6.7a1 1 0 0 1-1 .3h-.4a1 1 0 0 1-.9-.6l-.3-.7-2 .8.3.9a1 1 0 0 1-.3 1.1l-.2.2a1 1 0 0 1-1.1.2l-.9-.4-1 1.9.9.7c.2.2.4.5.4.8v.3c0 .3-.2.6-.4.8l-.9.7 1.1 1.9.9-.4a1 1 0 0 1 1.1.2l.2.2c.3.3.4.7.3 1.1l-.3.9 2 .8.6-.7a1 1 0 0 1 .9-.3h.4a1 1 0 0 1 .9.6l.3.7 2-.8-.3-.9a1 1 0 0 1 .3-1.1l.2-.2a1 1 0 0 1 1.1-.2l.9.4 1-1.9-.9-.7a1 1 0 0 1-.4-.8z" />
      </svg>
    ),
  },
  {
    key: 'ai',
    label: 'IA',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" stroke="currentColor" fill="none" strokeWidth="1.8">
        <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.8 6.8 5.4 5.4M18.6 18.6l-1.4-1.4M17.2 6.8l1.4-1.4M6.8 17.2l-1.4 1.4" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

type MobileNavProps = {
  active: string;
  onNavigate?: (key: string) => void;
};

const MobileNav = ({ active, onNavigate }: MobileNavProps) => {
  return (
    <nav className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-3xl bg-white/85 backdrop-blur-xl text-text shadow-card rounded-2xl px-4 py-3 flex justify-between items-center border border-borderSoft">
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate?.(item.key)}
            className={`flex flex-col items-center gap-1 text-xs transition ${
              isActive ? 'text-accent font-semibold' : 'text-textSoft hover:text-text'
            }`}
            aria-pressed={isActive}
          >
            <div className="relative flex flex-col items-center gap-1">
              <span
                className={`text-lg leading-none w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-accent/15 border border-accent/50 shadow-soft' : 'bg-panelAlt border border-borderSoft'
                }`}
              >
                {item.icon}
              </span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
            </div>
            <span className="tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
