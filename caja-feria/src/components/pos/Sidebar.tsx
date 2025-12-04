type NavItem = {
  key: string;
  label: string;
  emoji: string;
};

const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', emoji: '⌁' },
  { key: 'sales', label: 'Ventas', emoji: '💳' },
  { key: 'settings', label: 'Ajustes', emoji: '⚙️' },
  { key: 'closing', label: 'Cierre', emoji: '🧾' },
  { key: 'ai', label: 'IA', emoji: '✨' },
];

type SidebarProps = {
  active: string;
  onNavigate?: (key: string) => void;
};

const Sidebar = ({ active, onNavigate }: SidebarProps) => {
  return (
    <aside className="hidden md:flex w-60 bg-sidebar text-sidebarText flex-col shadow-card">
      <div className="px-6 py-6 border-b border-panelBorder/80">
        <div className="text-lg font-semibold tracking-tight">TomiPicols - POS</div>
      </div>
      <nav className="flex-1 px-4 py-5 space-y-2">
        {navItems.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition ${
                isActive
                  ? 'bg-white/10 text-white border-white/10 shadow-soft'
                  : 'text-sidebarMuted hover:bg-white/5 hover:border-white/10 border-transparent'
              }`}
              aria-pressed={isActive}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-5 border-t border-panelBorder/80 text-xs text-sidebarMuted">
        <div className="font-semibold text-sidebarText">Soporte</div>
        <p className="mt-1">Ayuda · Legal · Contacto</p>
      </div>
    </aside>
  );
};

export default Sidebar;
