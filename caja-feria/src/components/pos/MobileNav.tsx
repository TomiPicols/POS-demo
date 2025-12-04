type NavItem = {
  key: string;
  label: string;
  emoji: string;
};

const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', emoji: '⌁' },
  { key: 'sales', label: 'Ventas', emoji: '💳' },
  { key: 'settings', label: 'Ajustes', emoji: '⚙️' },
  { key: 'ai', label: 'IA', emoji: '✨' },
];

type MobileNavProps = {
  active: string;
  onNavigate?: (key: string) => void;
};

const MobileNav = ({ active, onNavigate }: MobileNavProps) => {
  return (
    <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-3xl bg-panel text-white border border-panelBorder shadow-soft rounded-lg px-3 py-2 flex justify-between items-center">
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onNavigate?.(item.key)}
            className={`flex flex-col items-center gap-1 text-xs transition ${
              isActive ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
            }`}
            aria-pressed={isActive}
          >
            <span className="text-lg leading-none">{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
