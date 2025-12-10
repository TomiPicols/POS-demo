import type { ReactNode } from 'react';

type PageKey = 'dashboard' | 'sales';

type NavItem = {
  key: PageKey;
  label: string;
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Overview' },
  { key: 'sales', label: 'Ventas' },
];

type LayoutProps = {
  active: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
};

const Layout = ({ active, onNavigate, children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex bg-bg text-text">
      <aside className="w-64 bg-sidebar text-sidebarText flex flex-col shadow-card">
        <div className="px-6 py-5 border-b border-panelBorder/60">
          <span className="font-semibold tracking-tight text-lg">Caja</span>
          <p className="text-xs text-sidebarMuted mt-1">Punto de venta</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition border border-transparent ${
                  isActive
                    ? 'bg-white/10 text-white font-medium border-white/10 shadow-soft'
                    : 'text-sidebarMuted hover:bg-white/5 hover:border-white/10'
                }`}
                aria-pressed={isActive}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
};

export type { PageKey };
export default Layout;
