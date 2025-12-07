import { useEffect, useMemo, useState } from 'react';
import MobileNav from '../components/pos/MobileNav';
import OrderPanel, { type OrderItem, type PaymentMethod } from '../components/pos/OrderPanel';
import ProductCard, { type Product } from '../components/pos/ProductCard';
import Sidebar from '../components/pos/Sidebar';
import { supabase } from '../lib/supabaseClient';

type SaleRow = {
  id: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
};

type DraftOrder = {
  id: string;
  label: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
};

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value);

const paymentMethods = ['cash', 'card', 'transfer', 'pending'] as const;

const paymentMethodDisplay: Record<PaymentMethod | 'other', string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pending: 'Pendiente',
  other: 'Otro',
};

const getPaymentLabel = (method: string) => {
  const key = paymentMethods.includes(method as PaymentMethod) ? (method as PaymentMethod) : 'other';
  return paymentMethodDisplay[key] ?? method;
};

const categoryEmoji = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('cascad')) return '\u2728';
  if (cat.includes('led')) return '\u{1F4A1}';
  if (cat.includes('solar')) return '\u{1F31E}';
  if (cat.includes('cena')) return '\u2B50';
  if (cat.includes('mang')) return '\u{1F9F2}';
  if (cat.includes('otro')) return '\u{1F381}';
  return '\u{1F384}';
};

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
};

const navTitles: Record<string, string> = {
  overview: 'Inicio',
  sales: 'Ventas',
  closing: 'Cierre',
  pending: 'Pendientes',
  settings: 'Ajustes',
  ai: 'IA',
};

type OverviewDateFilter = 'today' | 'yesterday' | 'last7' | 'all';
type OverviewMethodFilter = PaymentMethod | 'all' | 'pending';

const FestivePOS = () => {
  const [activeNav, setActiveNav] = useState('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [drafts, setDrafts] = useState<DraftOrder[]>([
    { id: '1', label: 'Pedido 1', items: [], paymentMethod: 'card' },
  ]);
  const [activeDraftId, setActiveDraftId] = useState('1');
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [showOrderMobile, setShowOrderMobile] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [overviewSales, setOverviewSales] = useState<SaleRow[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [closingSales, setClosingSales] = useState<SaleRow[]>([]);
  const [loadingClosing, setLoadingClosing] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [savingClosing, setSavingClosing] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [cashCounted, setCashCounted] = useState('');
  const [pendingSales, setPendingSales] = useState<SaleRow[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [pendingFilter, setPendingFilter] = useState<PaymentMethod | 'all'>('all');
  const [pendingDateFilter, setPendingDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingInfo, setPendingInfo] = useState<string | null>(null);
  const [selectedPendingId, setSelectedPendingId] = useState<number | null>(null);
  const [pendingModalSale, setPendingModalSale] = useState<SaleRow | null>(null);
  const [pendingModalMethod, setPendingModalMethod] = useState<PaymentMethod>('cash');
  const [pendingModalNote, setPendingModalNote] = useState('');
  const [overviewDateFilter, setOverviewDateFilter] = useState<OverviewDateFilter>('all');
  const [overviewMethodFilter, setOverviewMethodFilter] = useState<OverviewMethodFilter>('all');

  const currentDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0];
  const orderItems = currentDraft?.items || [];
  const paymentMethod = currentDraft?.paymentMethod || 'card';

  const filteredProducts = useMemo(() => {
    const byCategory =
      selectedCategory === 'Todo'
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const q = productQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((p) => p.name.toLowerCase().includes(q));
  }, [selectedCategory, productQuery, products]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category || 'Otros'));
    return ['Todo', ...Array.from(set)];
  }, [products]);

  const updateDraft = (updater: (draft: DraftOrder) => DraftOrder) => {
    setDrafts((prev) => prev.map((d) => (d.id === activeDraftId ? updater(d) : d)));
  };

  const addProduct = (product: Product) => {
    if (!currentDraft) return;
    updateDraft((draft) => {
      const existing = draft.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          ...draft,
          items: draft.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        };
      }
      return {
        ...draft,
        items: [
          ...draft.items,
          { id: product.id, name: product.name, price: product.price, emoji: product.emoji, quantity: 1 },
        ],
      };
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (!currentDraft) return;
    updateDraft((draft) => ({
      ...draft,
      items: draft.items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    }));
  };

  const subtotal = useMemo(
    () => orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [orderItems],
  );
  const tax = 0;
  const total = subtotal;

  const changePaymentMethod = (method: PaymentMethod) => {
    if (!currentDraft) return;
    updateDraft((draft) => ({ ...draft, paymentMethod: method }));
  };

  const addDraft = () => {
    const nextNumber = drafts.length + 1;
    const newId = `${Date.now()}`;
    setDrafts((prev) => [...prev, { id: newId, label: `Pedido ${nextNumber}`, items: [], paymentMethod: 'card' }]);
    setActiveDraftId(newId);
  };

  const clearDraft = () => {
    if (!currentDraft) return;
    updateDraft((draft) => ({ ...draft, items: [] }));
  };

  const deleteDraft = () => {
    if (!currentDraft) return;
    setDrafts((prev) => {
      if (prev.length <= 1) {
        return prev.map((d) => (d.id === currentDraft.id ? { ...d, items: [] } : d));
      }
      const remaining = prev.filter((d) => d.id !== currentDraft.id);
      const nextId = remaining[0]?.id ?? prev[0].id;
      setActiveDraftId(nextId);
      return remaining;
    });
  };

              const confirmOrder = async (): Promise<boolean> => {
    if (!orderItems.length || savingOrder) return false;

    const invalidProduct = orderItems.some((item) => Number.isNaN(Number.parseInt(item.id, 10)));
    if (invalidProduct) {
      setOrderError('Productos inválidos en el pedido.');
      return false;
    }

    setSavingOrder(true);
    setOrderError(null);

    const summaryNote = orderItems.map((item) => `${item.quantity}x ${item.name}`).join(' · ');
    const notes =
      paymentMethod === 'pending'
        ? `PENDIENTE - ${summaryNote || 'Sin detalle'}`
        : summaryNote || null;

    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          payment_method: paymentMethod,
          total_amount: total,
          notes,
        })
        .select('id')
        .single();

      if (saleError || !sale) throw saleError;

      const saleItemsPayload = orderItems.map((item) => ({
        sale_id: sale.id,
        product_id: Number.parseInt(item.id, 10),
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsPayload);
      if (itemsError) {
        await supabase.from('sales').delete().eq('id', sale.id);
        throw itemsError;
      }

      updateDraft((draft) => ({ ...draft, items: [] }));
      if (activeNav === 'overview') loadOverviewSales();
      if (activeNav === 'closing') loadClosingSales();
      if (activeNav === 'pending') loadPendingSales();
      return true;
    } catch (err: any) {
      setOrderError(err.message ?? 'No se pudo confirmar la venta.');
      return false;
    } finally {
      setSavingOrder(false);
    }
  };
useEffect(() => {
    if (activeNav !== 'overview') return;
    loadOverviewSales();
  }, [activeNav, overviewDateFilter, overviewMethodFilter]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (activeNav !== 'closing') return;
    loadClosingSales();
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== 'pending') return;
    loadPendingSales();
  }, [activeNav, pendingFilter, pendingDateFilter, pendingSearch]);

  const calcRange = (filter: OverviewDateFilter) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (filter === 'yesterday') {
      start.setDate(start.getDate() - 1);
    }
    if (filter === 'last7') {
      start.setDate(start.getDate() - 6);
    }
    const end = new Date(start);
    if (filter === 'today' || filter === 'yesterday') {
      end.setDate(start.getDate() + 1);
    } else {
      end.setHours(23, 59, 59, 999);
    }
    return { from: start.toISOString(), to: end.toISOString() };
  };

  const loadOverviewSales = async () => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const query = supabase
        .from('sales')
        .select('id, created_at, total_amount, payment_method, notes')
        .order('created_at', { ascending: false });

      if (overviewDateFilter !== 'all') {
        const { from, to } = calcRange(overviewDateFilter);
        query.gte('created_at', from).lte('created_at', to);
      }

      if (overviewMethodFilter !== 'all') {
        query.eq('payment_method', overviewMethodFilter === 'pending' ? 'pending' : overviewMethodFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOverviewSales(data || []);
    } catch (err: any) {
      setOverviewError(err.message ?? 'No se pudieron cargar las ventas.');
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadProducts = async () => {
    const mapProducts = (rows: any[] | null): Product[] =>
      rows?.map((p) => ({
        id: String(p.id),
        name: p.name ?? 'Producto',
        price: Number(p.default_price) || 0,
        category: p.category || 'Otros',
        emoji: categoryEmoji(p.category || ''),
        stock: typeof p.stock === 'number' ? p.stock : Number(p.stock || 0),
      })) || [];

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, default_price, category, is_active, stock')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setProducts(mapProducts(data));
    } catch (err: any) {
      const message = err?.message?.toLowerCase?.() || '';
      if (message.includes('stock') && message.includes('column')) {
        console.warn('La columna stock no existe en Supabase. Se usan valores 0 hasta que la crees.');
        try {
          const { data, error: fallbackError } = await supabase
            .from('products')
            .select('id, name, default_price, category, is_active')
            .eq('is_active', true)
            .order('name');
          if (fallbackError) throw fallbackError;
          setProducts(mapProducts(data));
        } catch (fallbackErr: any) {
          console.error('No se pudieron cargar los productos (respaldo sin stock).', fallbackErr);
        }
      } else {
        console.error('No se pudieron cargar los productos.', err);
      }
    }
  };

  const loadPendingSales = async () => {
    setLoadingPending(true);
    setPendingError(null);
    setPendingInfo(null);
    try {
      const query = supabase
        .from('sales')
        .select('id, created_at, total_amount, payment_method, notes')
        .order('created_at', { ascending: false });

      const now = new Date();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (pendingDateFilter === 'today') {
        query.gte('created_at', todayStart.toISOString()).lte('created_at', now.toISOString());
      } else if (pendingDateFilter === '7d') {
        const from = new Date();
        from.setDate(from.getDate() - 7);
        query.gte('created_at', from.toISOString()).lte('created_at', now.toISOString());
      } else if (pendingDateFilter === '30d') {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        query.gte('created_at', from.toISOString()).lte('created_at', now.toISOString());
      }

      if (pendingFilter !== 'all') {
        query.eq('payment_method', pendingFilter);
      } else {
        query.eq('payment_method', 'pending');
      }

      const search = pendingSearch.trim();
      if (search) {
        query.ilike('notes', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPendingSales(data || []);
    } catch (err: any) {
      setPendingError(err.message ?? 'No se pudieron cargar los pendientes.');
    } finally {
      setLoadingPending(false);
    }
  };

  const markPendingAsPaid = async (saleId: number, method: PaymentMethod, note?: string) => {
    setPendingError(null);
    setPendingInfo(null);
    const current = pendingSales.find((s) => s.id === saleId);
    const cleanedNotes =
      note?.trim() ||
      current?.notes?.replace(/^PENDIENTE\s*-\s*/i, '').trim() ||
      current?.notes?.trim() ||
      null;

    const { error } = await supabase
      .from('sales')
      .update({ payment_method: method, notes: cleanedNotes })
      .eq('id', saleId);
    if (error) {
      setPendingError(error.message ?? 'No se pudo actualizar el pedido.');
      return;
    }
    setPendingInfo('Pedido marcado como pagado.');
    await loadPendingSales();
    if (activeNav === 'overview') loadOverviewSales();
    if (activeNav === 'closing') loadClosingSales();
    if (selectedPendingId === saleId) setSelectedPendingId(null);
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
  const pendingTotal = useMemo(
    () =>
      overviewSales
        .filter((s) => s.payment_method === 'pending')
        .reduce((acc, s) => acc + s.total_amount, 0),
    [overviewSales],
  );

  const closingTotals = useMemo(() => {
    const initial = { cash: 0, card: 0, transfer: 0, pending: 0, other: 0 } as Record<
      PaymentMethod | 'other',
      number
    >;
    return closingSales.reduce((acc, sale) => {
      const method = paymentMethods.includes(sale.payment_method as PaymentMethod)
        ? (sale.payment_method as PaymentMethod)
        : 'other';
      acc[method] += sale.total_amount;
      return acc;
    }, initial);
  }, [closingSales]);

  const closingTotal = useMemo(
    () => closingSales.reduce((acc, sale) => acc + sale.total_amount, 0),
    [closingSales],
  );

  const closingPageSize = 5;
  const [closingPage, setClosingPage] = useState(1);
  const closingTotalPages = Math.max(1, Math.ceil(closingSales.length / closingPageSize));
  const closingPageItems = useMemo(() => {
    const start = (closingPage - 1) * closingPageSize;
    return closingSales.slice(start, start + closingPageSize);
  }, [closingSales, closingPage]);

  const openPendingModal = (sale: SaleRow) => {
    const cleaned = sale.notes?.replace(/^PENDIENTE\s*-\s*/i, '').trim() || sale.notes || '';
    setPendingModalSale(sale);
    setPendingModalMethod('cash');
    setPendingModalNote(cleaned);
  };

  const pendingContent = (
    <div className="space-y-5">
      <div className="bg-card border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-semibold">Pedidos pendientes</div>
            <div className="text-xs text-textSoft">
              {loadingPending ? 'Cargando...' : `${pendingSales.length} registro(s)`}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              value={pendingFilter}
              onChange={(e) => setPendingFilter(e.target.value as PaymentMethod | 'all')}
              className="h-10 rounded-lg border border-borderSoft bg-panel px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="all">Solo pendientes</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="pending">Pendiente</option>
            </select>
            <select
              value={pendingDateFilter}
              onChange={(e) => setPendingDateFilter(e.target.value as 'today' | '7d' | '30d' | 'all')}
              className="h-10 rounded-lg border border-borderSoft bg-panel px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="today">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="all">Todo</option>
            </select>
            <input
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              placeholder="Buscar en notas..."
              className="h-10 w-44 rounded-lg border border-borderSoft bg-panel px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button
              onClick={loadPendingSales}
              className="h-10 px-3 rounded-lg border border-borderSoft text-sm text-text hover:border-accent/40 transition"
            >
              Refrescar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="rounded-xl border border-borderSoft bg-panel px-4 py-3 shadow-soft space-y-1">
            <div className="text-[11px] uppercase tracking-[0.14em] text-textSoft">Pendientes</div>
            <div className="text-lg font-semibold">{pendingSales.length}</div>
          </div>
          <div className="rounded-xl border border-borderSoft bg-panel px-4 py-3 shadow-soft space-y-1">
            <div className="text-[11px] uppercase tracking-[0.14em] text-textSoft">Total pendiente</div>
            <div className="text-lg font-semibold text-highlight">
              $
              {formatCLP(pendingSales.reduce((acc, s) => acc + s.total_amount, 0))}
            </div>
          </div>
          <div className="rounded-xl border border-borderSoft bg-panel px-4 py-3 shadow-soft space-y-1">
            <div className="text-[11px] uppercase tracking-[0.14em] text-textSoft">Filtro</div>
            <div className="text-sm font-medium text-textSoft capitalize">
              {pendingDateFilter === 'today'
                ? 'Hoy'
                : pendingDateFilter === '7d'
                  ? 'Últimos 7 días'
                  : pendingDateFilter === '30d'
                    ? 'Últimos 30 días'
                    : 'Todo'}
            </div>
          </div>
        </div>

        {pendingInfo && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {pendingInfo}
          </div>
        )}
        {pendingError && <div className="text-sm text-accent">{pendingError}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-textSoft">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Método</th>
                <th className="py-2 pr-4">Notas</th>
                <th className="py-2 pr-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendingSales.map((s) => (
                <tr
                  key={s.id}
                  className={`border-t border-borderSoft/70 cursor-pointer transition ${
                    selectedPendingId === s.id ? 'bg-accent/10 border-accent/40' : ''
                  }`}
                  onClick={() => setSelectedPendingId((prev) => (prev === s.id ? null : s.id))}
                >
                  <td className="py-2 pr-4">
                    {new Date(s.created_at).toLocaleString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 pr-4 font-semibold">${formatCLP(s.total_amount)}</td>
                  <td className="py-2 pr-4 uppercase text-xs">{getPaymentLabel(s.payment_method)}</td>
                  <td className="py-2 pr-4 text-textSoft">{s.notes || '-'}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPendingModal(s)}
                        className="h-8 px-3 rounded-lg border border-borderSoft bg-panel hover:border-accent/40 text-xs font-semibold transition"
                      >
                        Cobrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pendingSales.length && !loadingPending && (
                <tr>
                  <td className="py-4 text-xs text-textSoft" colSpan={5}>
                    No hay pedidos pendientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedPendingId && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-panel border border-borderSoft px-4 py-3 shadow-soft">
            <div className="text-sm text-textSoft">Pedido seleccionado: #{selectedPendingId}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPendingId(null)}
                className="h-10 px-4 rounded-lg border border-borderSoft text-sm text-text hover:border-accent/40 transition"
              >
                Limpiar
              </button>
              <button
                onClick={() => {
                  const sale = pendingSales.find((s) => s.id === selectedPendingId);
                  if (!sale) return;
                  openPendingModal(sale);
                }}
                className="h-10 px-4 rounded-lg bg-accent text-panel text-sm font-semibold shadow-soft hover:shadow-card transition"
              >
                Cobrar seleccionado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const pendingModal = pendingModalSale && (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-card border border-borderSoft rounded-2xl shadow-card max-w-lg w-full p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-textSoft uppercase tracking-[0.16em]">Cobrar pedido</div>
            <div className="text-lg font-semibold">#{pendingModalSale.id}</div>
            <div className="text-sm text-textSoft mt-1">
              {new Date(pendingModalSale.created_at).toLocaleString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <button
            onClick={() => setPendingModalSale(null)}
            className="w-9 h-9 rounded-full border border-borderSoft text-textSoft hover:text-text"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Método de pago</div>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'card', 'transfer'] as const).map((method) => {
              const active = pendingModalMethod === method;
              return (
                <button
                  key={method}
                  onClick={() => setPendingModalMethod(method)}
                  className={`h-10 rounded-lg border text-sm transition ${
                    active
                      ? 'bg-accent text-panel font-semibold border-transparent shadow-soft'
                      : 'bg-panelAlt border-borderSoft text-textSoft hover:border-accent/40'
                  }`}
                  aria-pressed={active}
                >
                  {getPaymentLabel(method)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Nota</div>
          <textarea
            value={pendingModalNote}
            onChange={(e) => setPendingModalNote(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-borderSoft bg-panelAlt text-sm text-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            placeholder="Detalle opcional"
          />
        </div>

        {pendingError && <div className="text-sm text-accent">{pendingError}</div>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setPendingModalSale(null)}
            className="h-10 px-4 rounded-lg border border-borderSoft text-sm text-text hover:border-accent/40 transition"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (!pendingModalSale) return;
              await markPendingAsPaid(pendingModalSale.id, pendingModalMethod, pendingModalNote);
              setPendingModalSale(null);
            }}
            className="h-10 px-4 rounded-lg bg-accent text-panel text-sm font-semibold shadow-soft hover:shadow-card transition"
          >
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );

  const cashCountedNumber = Number.parseInt(cashCounted || '0', 10) || 0;
  const cashExpected = closingTotals.cash || 0;
  const cashDiff = cashCountedNumber - cashExpected;
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CL', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      }).format(new Date()),
    [],
  );

  const salesContent = (
    <div className="space-y-8">
      <div className="bg-card border border-borderSoft rounded-2xl px-5 py-4 shadow-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((cat) => {
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

      <div className="bg-card border border-borderSoft rounded-2xl px-5 py-4 shadow-card flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold mr-2">Pedidos en curso</div>
        {drafts.map((draft) => {
          const active = draft.id === activeDraftId;
          return (
            <button
              key={draft.id}
              onClick={() => setActiveDraftId(draft.id)}
              className={`h-9 px-3 rounded-full text-sm border transition ${
                active
                  ? 'bg-accent/80 text-panel font-semibold border-transparent shadow-soft'
                  : 'bg-panelAlt text-textSoft border-borderSoft hover:text-text hover:border-accent/30'
              }`}
            >
              {draft.label}
            </button>
          );
        })}
        <button
          onClick={addDraft}
          className="h-9 px-3 rounded-full text-sm border border-borderSoft text-text hover:border-accent/40 transition"
        >
          + Nuevo
        </button>
        <button
          onClick={clearDraft}
          className="h-9 px-3 rounded-full text-sm border border-borderSoft text-text hover:border-accent/40 transition"
        >
          Vaciar
        </button>
        <button
          onClick={deleteDraft}
          className="h-9 px-3 rounded-full text-sm border border-borderSoft text-text hover:border-accent/40 transition"
        >
          Eliminar
        </button>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="bg-panel border border-borderSoft rounded-2xl p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Productos</div>
            <div className="text-xs text-textSoft">
              {filteredProducts.length} articulo{filteredProducts.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addProduct} />
            ))}
            {!filteredProducts.length && (
              <div className="text-sm text-textSoft">Sin productos en esta categoria.</div>
            )}
          </div>
        </div>

        <div className="hidden xl:block sticky top-4">
          <OrderPanel
            items={orderItems}
            subtotal={subtotal}
            tax={tax}
            total={total}
            paymentMethod={paymentMethod}
            saving={savingOrder}
            error={orderError}
            orderLabel={currentDraft?.label}
            onPaymentChange={changePaymentMethod}
            onUpdateQuantity={updateQuantity}
            onConfirm={confirmOrder}
          />
        </div>

        <div className="h-[10px] sm:h-[10px] md:h-0 lg:h-[10px]" aria-hidden />
      </div>
    </div>
  );

  const overviewContent = (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-card border border-borderSoft rounded-xl p-3 shadow-soft space-y-1">
          <div className="text-[10px] text-textSoft uppercase tracking-[0.16em]">Ventas totales</div>
          <div className="text-xl font-bold">{overviewSales.length}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-xl p-3 shadow-soft space-y-1">
          <div className="text-[10px] text-textSoft uppercase tracking-[0.16em]">Ingresos</div>
          <div className="text-xl font-bold">${formatCLP(totalSalesAmount)}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-xl p-3 shadow-soft space-y-1">
          <div className="text-[10px] text-textSoft uppercase tracking-[0.16em]">Pendiente</div>
          <div className="text-xl font-bold text-highlight">${formatCLP(pendingTotal)}</div>
        </div>
      </div>

      <div className="bg-panel border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-lg font-semibold">Todas las ventas</div>
          </div>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <select
              value={overviewDateFilter}
              onChange={(e) => setOverviewDateFilter(e.target.value as OverviewDateFilter)}
              className="h-10 rounded-lg border border-borderSoft bg-panelAlt px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="last7">Últimos 7</option>
              <option value="all">Todas</option>
            </select>
            <select
              value={overviewMethodFilter}
              onChange={(e) => setOverviewMethodFilter(e.target.value as OverviewMethodFilter)}
              className="h-10 rounded-lg border border-borderSoft bg-panelAlt px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="all">Método: todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="pending">Pendiente</option>
            </select>
            <button
              onClick={loadOverviewSales}
              className="h-10 px-3 rounded-lg border border-borderSoft text-sm text-text hover:border-accent/40 transition"
            >
              Refrescar
            </button>
          </div>
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
                  <td className="py-2 pr-4 uppercase text-xs">{getPaymentLabel(s.payment_method)}</td>
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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-borderSoft rounded-xl p-3 shadow-soft space-y-1">
          <div className="text-[10px] text-textSoft uppercase tracking-[0.16em]">Ventas hoy</div>
          <div className="text-xl font-bold">{closingSales.length}</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-xl p-3 shadow-soft space-y-1">
          <div className="text-[10px] text-textSoft uppercase tracking-[0.16em]">Total del dia</div>
          <div className="text-xl font-bold">${formatCLP(closingTotal)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="bg-panel border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Ventas del dia</div>
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
                {closingPageItems.map((s) => (
                  <tr key={s.id} className="border-t border-borderSoft/70">
                    <td className="py-2 pr-4">
                      {new Date(s.created_at).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 pr-4 font-semibold">${formatCLP(s.total_amount)}</td>
                    <td className="py-2 pr-4 uppercase text-xs">{getPaymentLabel(s.payment_method)}</td>
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
          {closingSales.length > closingPageSize && (
            <div className="flex items-center justify-end gap-2 text-xs text-textSoft">
              <button
                onClick={() => setClosingPage((p) => Math.max(1, p - 1))}
                disabled={closingPage === 1}
                className="h-8 px-3 rounded-lg border border-borderSoft bg-panel hover:border-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <div className="text-sm font-medium">
                {closingPage} / {closingTotalPages}
              </div>
              <button
                onClick={() => setClosingPage((p) => Math.min(closingTotalPages, p + 1))}
                disabled={closingPage === closingTotalPages}
                className="h-8 px-3 rounded-lg border border-borderSoft bg-panel hover:border-accent/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        <div className="bg-card border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
          <div className="text-lg font-semibold">Cierre de caja</div>

          <div className="space-y-2 text-sm">
            <div className="text-xs text-textSoft uppercase tracking-[0.12em]">Desglose por método</div>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'transfer', 'pending'] as const).map((method) => (
                <div
                  key={method}
                  className="flex items-center justify-between rounded-lg bg-panelAlt border border-borderSoft px-3 py-2"
                >
                  <span className="text-textSoft">{getPaymentLabel(method)}</span>
                  <span className="font-semibold">${formatCLP(closingTotals[method])}</span>
                </div>
              ))}
            </div>
          </div>

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
          <textarea
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-borderSoft bg-panelAlt text-sm text-text px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            placeholder="Notas del cierre (opcional)"
          />
          <div className="flex gap-2">
            <button
              className="flex-1 h-11 rounded-xl border border-borderSoft text-sm font-semibold hover:border-accent/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => {
                setCashCounted('');
                setClosingNotes('');
              }}
              disabled={savingClosing}
            >
              Limpiar
            </button>
            <button
              className="flex-1 h-11 rounded-xl bg-accent text-panel text-sm font-semibold shadow-soft hover:shadow-card transition disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={saveClosing}
              disabled={savingClosing}
            >
              {savingClosing ? 'Guardando...' : 'Guardar cierre'}
            </button>
          </div>
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

      <div
        className={`flex-1 min-h-screen ${
          activeNav === 'sales'
            ? 'pb-[175px] sm:pb-[235px] md:pb-[265px] lg:pb-[150px]'
            : 'pb-24 md:pb-12 lg:pb-10'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 border border-borderSoft px-4 py-3 shadow-soft backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center text-accent text-lg shadow-soft">
                {'\u{1F384}'}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-textSoft">Caja navideña</p>
                <h1 className="text-xl font-bold leading-tight">{navTitles[activeNav] ?? 'Panel'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-xl bg-panel border border-borderSoft px-3 py-1.5 shadow-soft">
                <span className="text-xs text-textSoft">Hoy</span>
                <span className="font-semibold capitalize">{todayLabel}</span>
              </div>
              <div className="rounded-xl bg-panel border border-borderSoft px-3 py-1.5 shadow-soft">
                <span className="text-xs text-textSoft mr-1">Modo</span>
                <span className="font-semibold">Caja feria</span>
              </div>
            </div>
          </div>

          {activeNav === 'overview' && overviewContent}
          {activeNav === 'sales' && salesContent}
          {activeNav === 'closing' && closingContent}
          {activeNav === 'pending' && pendingContent}
        </div>
      </div>

      {activeNav === 'sales' && (
        <>
          <div className="xl:hidden fixed bottom-32 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg z-40">
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
                  <div className="text-left">
                    <div className="text-xs text-sidebarMuted">Pedido actual</div>
                    <div className="text-lg font-semibold">{currentDraft?.label}</div>
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
                    saving={savingOrder}
                    error={orderError}
                    onPaymentChange={changePaymentMethod}
                    onUpdateQuantity={updateQuantity}
                    onConfirm={async () => {
                      const success = await confirmOrder();
                      if (success) setShowOrderMobile(false);
                      return success;
                    }}
                    orderLabel={currentDraft?.label}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {pendingModal}

      <MobileNav active={activeNav} onNavigate={setActiveNav} />
    </div>
  );

  async function saveClosing() {
    if (savingClosing) return;
    setSavingClosing(true);
    setClosingError(null);
    try {
      const payload = {
        closed_at: new Date().toISOString(),
        total_sales: closingTotal,
        cash_expected: cashExpected,
        cash_counted: cashCountedNumber,
        cash_diff: cashDiff,
        card_total: closingTotals.card || 0,
        transfer_total: closingTotals.transfer || 0,
        pending_total: closingTotals.pending || 0,
        notes: closingNotes || null,
      };
      const { error } = await supabase.from('cash_closings').insert(payload);
      if (error) throw error;
      setCashCounted('');
      setClosingNotes('');
      await loadClosingSales();
      if (activeNav === 'overview') loadOverviewSales();
    } catch (err: any) {
      setClosingError(err.message ?? 'No se pudo guardar el cierre.');
    } finally {
      setSavingClosing(false);
    }
  }
};

export default FestivePOS;





