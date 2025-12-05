import { useEffect, useMemo, useState } from 'react';
import MobileNav from '../components/pos/MobileNav';
import OrderPanel, { type OrderItem, type PaymentMethod } from '../components/pos/OrderPanel';
import ProductCard, { type Product } from '../components/pos/ProductCard';
import Sidebar from '../components/pos/Sidebar';
import { supabase } from '../lib/supabaseClient';

const products: Product[] = [
  { id: '1', name: 'Luces LED blancas 10 m', price: 8990, emoji: '\u{1F4A1}', category: 'Luces' },
  { id: '2', name: 'Guirnalda navidena verde', price: 6990, emoji: '\u{1F33F}', category: 'Decoracion' },
  { id: '3', name: 'Esferas doradas x6', price: 4990, emoji: '\u{1F7E1}', category: 'Esferas' },
  { id: '4', name: 'Luces cascada 3 m', price: 12990, emoji: '\u2728', category: 'Luces' },
  { id: '5', name: 'Esferas plateadas x6', price: 4990, emoji: '\u26AA', category: 'Esferas' },
  { id: '6', name: 'Guirnalda con luces', price: 14990, emoji: '\u{1F380}', category: 'Decoracion' },
  { id: '7', name: 'Luces multicolor 5 m', price: 7490, emoji: '\u{1F308}', category: 'Luces' },
  { id: '8', name: 'Estrella para arbol', price: 9990, emoji: '\u2B50', category: 'Decoracion' },
  { id: '9', name: 'Cojin renos', price: 7990, emoji: '\u{1F98C}', category: 'Textiles' },
  { id: '10', name: 'Vela canela', price: 5990, emoji: '\u{1F56F}', category: 'Aromas' },
  { id: '11', name: 'Muneco de nieve', price: 8990, emoji: '\u26C4', category: 'Figuras' },
  { id: '12', name: 'Set calcetines 4u', price: 6990, emoji: '\u{1F9E6}', category: 'Textiles' },
];

const categories = ['Todo', 'Luces', 'Decoracion', 'Esferas', 'Textiles', 'Figuras', 'Aromas'] as const;

type SaleRow = {
  id: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
};

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value);

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
};

const FestivePOS = () => {
  const [activeNav, setActiveNav] = useState('sales');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Todo');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [showOrderMobile, setShowOrderMobile] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [overviewSales, setOverviewSales] = useState<SaleRow[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [closingSales, setClosingSales] = useState<SaleRow[]>([]);
  const [loadingClosing, setLoadingClosing] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [cashCounted, setCashCounted] = useState('');

  const filteredProducts = useMemo(() => {
    const byCategory =
      selectedCategory === 'Todo'
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const q = productQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((p) => p.name.toLowerCase().includes(q));
  }, [selectedCategory, productQuery]);

  const addProduct = (product: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.price, emoji: product.emoji, quantity: 1 },
      ];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = useMemo(
    () => orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [orderItems],
  );
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const confirmOrder = () => {
    if (!orderItems.length) return;
    setOrderItems([]);
  };

  useEffect(() => {
    if (activeNav !== 'overview') return;
    loadOverviewSales();
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== 'closing') return;
    loadClosingSales();
  }, [activeNav]);

  const loadOverviewSales = async () => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, created_at, total_amount, payment_method, notes')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOverviewSales(data || []);
    } catch (err: any) {
      setOverviewError(err.message ?? 'No se pudieron cargar las ventas.');
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadClosingSales = async () => {
    setLoadingClosing(true);
    setClosingError(null);
    try {
      const { from, to } = todayRange();
      const { data, error } = await supabase
        .from('sales')
        .select('id, created_at, total_amount, payment_method, notes')
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClosingSales(data || []);
    } catch (err: any) {
      setClosingError(err.message ?? 'No se pudieron cargar las ventas de hoy.');
    } finally {
      setLoadingClosing(false);
    }
  };

  const totalSalesAmount = useMemo(
    () => overviewSales.reduce((acc, s) => acc + s.total_amount, 0),
    [overviewSales],
  );

  const closingTotals = useMemo(() => {
    return closingSales.reduce(
      (acc, sale) => {
        if (acc[sale.payment_method] !== undefined) acc[sale.payment_method] += sale.total_amount;
        return acc;
      },
      { cash: 0, card: 0, transfer: 0, other: 0 } as Record<string, number>,
    );
  }, [closingSales]);

  const closingTotal = useMemo(
    () => closingSales.reduce((acc, sale) => acc + sale.total_amount, 0),
    [closingSales],
  );

  const cashCountedNumber = Number.parseInt(cashCounted || '0', 10) || 0;
  const cashExpected = closingTotals.cash || 0;
  const cashDiff = cashCountedNumber - cashExpected;

  const salesContent = (
    <div className="space-y-8">
      <div className="bg-card border border-borderSoft rounded-2xl px-5 py-4 shadow-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-3 rounded-full text-sm border transition shadow-pill ${
                  active
                    ? 'bg-accent/80 text-panel font-semibold border-transparent shadow-soft'
                    : 'bg-panelAlt text-textSoft border-borderSoft hover:text-text hover:border-accent/30'
                }`}
                aria-pressed={active}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="w-full md:w-80">
          <input
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Buscar producto rapido..."
            className="w-full h-10 rounded-lg border border-borderSoft bg-panelAlt px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/35 placeholder:text-textSoft shadow-soft"
          />
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="bg-panel border border-borderSoft rounded-2xl p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Productos</div>
            <div className="text-xs text-textSoft">
              {filteredProducts.length} articulo{filteredProducts.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addProduct} />
            ))}
            {!filteredProducts.length && (
              <div className="text-sm text-textSoft">Sin productos en esta categoria.</div>
            )}
          </div>
        </div>

        <div className="hidden xl:block">
          <OrderPanel
            items={orderItems}
            subtotal={subtotal}
            tax={tax}
            total={total}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            onUpdateQuantity={updateQuantity}
            onConfirm={confirmOrder}
          />
        </div>
      </div>
    </div>
  );

  const overviewContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Ventas totales</div>
          <div className="text-2xl font-bold">{overviewSales.length}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Ingresos</div>
          <div className="text-2xl font-bold">${formatCLP(totalSalesAmount)}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Ticket prom.</div>
          <div className="text-2xl font-bold">
            {overviewSales.length ? `$${formatCLP(Math.round(totalSalesAmount / overviewSales.length))}` : '-'}
          </div>
        </div>
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Metodos</div>
          <div className="text-lg font-semibold text-textSoft">Tarjeta · Efectivo · Transfer</div>
        </div>
      </div>

      <div className="bg-panel border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Todas las ventas</div>
            <div className="text-xs text-textSoft">
              {loadingOverview ? 'Cargando...' : `${overviewSales.length} registro(s)`}
            </div>
          </div>
          <button
            onClick={loadOverviewSales}
            className="h-9 px-3 rounded-full border border-borderSoft text-sm text-text hover:border-accent/40 transition"
          >
            Refrescar
          </button>
        </div>
        {overviewError && <div className="text-sm text-accent">{overviewError}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-textSoft">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Metodo</th>
                <th className="py-2 pr-4">Notas</th>
              </tr>
            </thead>
            <tbody>
              {overviewSales.map((s) => (
                <tr key={s.id} className="border-t border-borderSoft/70">
                  <td className="py-2 pr-4">
                    {new Date(s.created_at).toLocaleString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 pr-4 font-semibold">${formatCLP(s.total_amount)}</td>
                  <td className="py-2 pr-4 uppercase text-xs">{s.payment_method}</td>
                  <td className="py-2 pr-4 text-textSoft">{s.notes || '—'}</td>
                </tr>
              ))}
              {!overviewSales.length && !loadingOverview && (
                <tr>
                  <td className="py-4 text-xs text-textSoft" colSpan={4}>
                    Aun no hay ventas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const closingContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Ventas hoy</div>
          <div className="text-2xl font-bold">{closingSales.length}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Total del dia</div>
          <div className="text-2xl font-bold">${formatCLP(closingTotal)}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Efectivo</div>
          <div className="text-xl font-semibold">${formatCLP(closingTotals.cash || 0)}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-soft space-y-1">
          <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Ticket prom.</div>
          <div className="text-xl font-semibold">
            {closingSales.length ? `$${formatCLP(Math.round(closingTotal / closingSales.length))}` : '-'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="bg-panel border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Ventas del dia</div>
              <div className="text-xs text-textSoft">
                {loadingClosing ? 'Cargando...' : `${closingSales.length} registro(s)`}
              </div>
            </div>
            <button
              onClick={loadClosingSales}
              className="h-9 px-3 rounded-full border border-borderSoft text-sm text-text hover:border-accent/40 transition"
            >
              Refrescar
            </button>
          </div>
          {closingError && <div className="text-sm text-accent">{closingError}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-textSoft">
                  <th className="py-2 pr-4">Hora</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">Metodo</th>
                  <th className="py-2 pr-4">Notas</th>
                </tr>
              </thead>
              <tbody>
                {closingSales.map((s) => (
                  <tr key={s.id} className="border-t border-borderSoft/70">
                    <td className="py-2 pr-4">
                      {new Date(s.created_at).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 pr-4 font-semibold">${formatCLP(s.total_amount)}</td>
                    <td className="py-2 pr-4 uppercase text-xs">{s.payment_method}</td>
                    <td className="py-2 pr-4 text-textSoft">{s.notes || '—'}</td>
                  </tr>
                ))}
                {!closingSales.length && !loadingClosing && (
                  <tr>
                    <td className="py-4 text-xs text-textSoft" colSpan={4}>
                      Aun no hay ventas hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
          <div className="text-lg font-semibold">Cierre de caja</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-textSoft">
              <span>Efectivo esperado</span>
              <span>${formatCLP(cashExpected)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-textSoft text-sm" htmlFor="cashCounted">
                Efectivo contado
              </label>
              <input
                id="cashCounted"
                type="number"
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value)}
                className="h-10 w-40 rounded-lg border border-borderSoft bg-panelAlt px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-textSoft"
                placeholder="$0"
              />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Diferencia</span>
              <span className={cashDiff === 0 ? 'text-text' : cashDiff > 0 ? 'text-green-700' : 'text-accent'}>
                ${formatCLP(cashDiff)}
              </span>
            </div>
          </div>
          <button
            className="w-full h-11 rounded-xl bg-accent text-panel text-sm font-semibold shadow-soft hover:shadow-card transition"
            onClick={() => setCashCounted('')}
          >
            Guardar cierre (local)
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text flex">
      <Sidebar
        active={activeNav}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onNavigate={setActiveNav}
      />

      <div className="flex-1 min-h-screen pb-24 md:pb-10">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {activeNav === 'overview' && overviewContent}
          {activeNav === 'sales' && salesContent}
          {activeNav === 'closing' && closingContent}
          {activeNav !== 'overview' && activeNav !== 'sales' && activeNav !== 'closing' && (
            <div className="bg-panel border border-borderSoft rounded-2xl p-6 shadow-soft">
              <div className="text-lg font-semibold mb-2">Proximamente</div>
              <p className="text-textSoft text-sm">Esta seccion aun esta en construccion.</p>
            </div>
          )}
        </div>
      </div>

      {activeNav === 'sales' && (
        <>
          <div className="xl:hidden fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg z-40">
            <div className="bg-panel border border-panelBorder text-text shadow-card rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-sidebarMuted">Pedido en curso</div>
                <div className="text-base font-semibold">${total.toLocaleString('es-CL')}</div>
              </div>
              <button
                onClick={() => setShowOrderMobile(true)}
                className="h-10 px-4 rounded-lg bg-accent text-panel text-sm font-semibold border border-accent/70 shadow-soft hover:shadow-card transition"
              >
                Ver pedido
              </button>
            </div>
          </div>

          {showOrderMobile && (
            <div className="xl:hidden fixed inset-0 bg-black/45 z-50 flex items-end backdrop-blur-md">
              <div className="w-full bg-panel text-text rounded-t-2xl p-4 border-t border-panelBorder shadow-card max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-sidebarMuted">Pedido actual</div>
                    <div className="text-lg font-semibold">Mesa 5</div>
                  </div>
                  <button
                    onClick={() => setShowOrderMobile(false)}
                    className="text-sidebarMuted text-lg px-2"
                  >
                    ×
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[50vh] pr-1">
                  <OrderPanel
                    items={orderItems}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    paymentMethod={paymentMethod}
                    onPaymentChange={setPaymentMethod}
                    onUpdateQuantity={updateQuantity}
                    onConfirm={() => {
                      confirmOrder();
                      setShowOrderMobile(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <MobileNav active={activeNav} onNavigate={setActiveNav} />
    </div>
  );
};

export default FestivePOS;
