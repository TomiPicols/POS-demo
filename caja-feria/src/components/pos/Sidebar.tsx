type NavItem = {
  key: string;
  label: string;
  emoji: string;
};

const navItems: NavItem[] = [
  { key: 'overview', label: 'Overview', emoji: '\u{1F4CA}' },
  { key: 'sales', label: 'Ventas', emoji: '\u{1F9FE}' },
  { key: 'settings', label: 'Ajustes', emoji: '\u2699' },
  { key: 'closing', label: 'Cierre', emoji: '\u23F1' },
  { key: 'ai', label: 'IA', emoji: '\u2728' },
];

type SidebarProps = {
  active: string;
  onNavigate?: (key: string) => void;
};

const Sidebar = ({ active, onNavigate }: SidebarProps) => {
  return (
    <aside className="hidden xl:flex w-60 bg-white/5 backdrop-blur-xl text-sidebarText flex-col shadow-card border border-white/10">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="text-xs uppercase tracking-[0.22em] text-sidebarMuted">Punto de venta</div>
        <div className="text-lg font-semibold tracking-tight">Colección navideña</div>
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
                  ? 'bg-white/10 text-white border-white/20 shadow-soft ring-1 ring-accent/30'
                  : 'text-sidebarMuted hover:text-white hover:bg-white/5 border-transparent'
              }`}
              aria-pressed={isActive}
            >
              <span className="text-base">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-5 border-t border-white/10 text-xs text-sidebarMuted">
        <div className="font-semibold text-sidebarText">Soporte</div>
        <p className="mt-1">Ayuda - Legal - Contacto</p>
      </div>
    </aside>
  );
};

export default Sidebar;
