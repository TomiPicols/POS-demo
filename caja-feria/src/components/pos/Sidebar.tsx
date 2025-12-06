import type { ReactNode } from 'react';

type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
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
        <circle cx="9" cy="18" r="1.2" />
        <circle cx="15" cy="18" r="1.2" />
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

type SidebarProps = {
  active: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: (key: string) => void;
};

const Sidebar = ({ active, collapsed = false, onToggleCollapse, onNavigate }: SidebarProps) => {
  return (
    <aside
      className={`hidden xl:flex ${collapsed ? 'w-20' : 'w-64'} bg-white/85 backdrop-blur-xl text-sidebarText flex-col shadow-card border border-panelBorder/70 transition-all duration-200`}
    >
      <div className="px-4 py-4 border-b border-panelBorder/60 flex items-center justify-between">
        {!collapsed && <div className="text-[11px] uppercase tracking-[0.22em] text-sidebarMuted">Menú</div>}
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 rounded-full border border-panelBorder bg-white/80 text-sidebarText flex items-center justify-center hover:border-accent/50 transition shadow-soft"
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-2">
        {navItems.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              className={`w-full flex items-center ${collapsed ? 'justify-center gap-0' : 'gap-3'} px-3 py-2 rounded-xl text-sm border transition ${
                isActive
                  ? 'bg-accent text-panel font-semibold border-accent shadow-card'
                  : 'bg-white/60 text-sidebarMuted border-transparent hover:border-panelBorder hover:bg-white'
              }`}
              aria-pressed={isActive}
            >
              <span className="text-base">{item.icon}</span>
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="px-6 py-5 border-t border-panelBorder/60 text-xs text-sidebarMuted">
          <div className="font-semibold text-sidebarText">Soporte</div>
          <p className="mt-1">Ayuda · Legal · Contacto</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

