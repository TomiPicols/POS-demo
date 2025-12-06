type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    key: 'overview',
    label: 'Inicio',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.6">
        <path d="M4 12 11 5l3 3 6-6" />
        <path d="M4 12v7h16v-9l-6 6-3-3z" />
      </svg>
    ),
  },
  {
    key: 'sales',
    label: 'Ventas',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.6">
        <path d="M4 7h16l-2 10H6z" />
        <path d="M9 11h6" />
        <circle cx="9" cy="18" r="1.1" />
        <circle cx="15" cy="18" r="1.1" />
      </svg>
    ),
  },
  {
    key: 'closing',
    label: 'Cierre',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.6">
        <rect x="5" y="9" width="14" height="10" rx="2" />
        <path d="M9 9V7a3 3 0 0 1 6 0v2" />
        <path d="M12 13v3" />
      </svg>
    ),
  },
  {
    key: 'pending',
    label: 'Pendientes',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.6">
        <path d="M5 12h14" />
        <path d="M12 5v14" />
        <circle cx="12" cy="12" r="9" />
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
    <nav className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-3xl bg-white/90 backdrop-blur-xl text-text shadow-card rounded-xl px-3 py-2 flex justify-between items-center border border-borderSoft">
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate?.(item.key)}
            className={`flex flex-col items-center gap-1 flex-1 text-[11px] transition ${
              isActive ? 'text-accent font-semibold' : 'text-textSoft hover:text-text'
            }`}
            aria-pressed={isActive}
          >
            <div className="relative flex flex-col items-center gap-1">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-accent/12 border border-accent/50 shadow-soft' : 'bg-panelAlt border border-borderSoft'
                }`}
              >
                {item.icon}
              </span>
              <span className="tracking-wide leading-tight">{item.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-accent" />}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
