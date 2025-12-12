import { useEffect, useMemo, useState } from 'react';
import MobileNav from '../components/pos/MobileNav';
import OrderPanel, { type OrderItem, type PaymentMethod } from '../components/pos/OrderPanel';
import ProductCard, { type Product } from '../components/pos/ProductCard';
import Sidebar from '../components/pos/Sidebar';
import { supabase } from '../lib/supabaseClient';
import SelectField from '../components/SelectField';

type SaleRow = {
  id: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
  paid_at?: string | null;
  paid_by?: string | null;
  paid_method?: string | null;
};

type DraftOrder = {
  id: string;
  label: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
};

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value);

const paymentMethods = ['cash', 'transfer', 'pending'] as const;

const paymentMethodDisplay: Record<PaymentMethod | 'other', string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  pending: 'Pendiente',
  other: 'Otro',
};

const getPaymentLabel = (method: string) => {
  const key = paymentMethods.includes(method as PaymentMethod) ? (method as PaymentMethod) : 'other';
  return paymentMethodDisplay[key] ?? method;
};

type OfflineOrder = {
  id: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
};

const OFFLINE_QUEUE_KEY = 'pos_offline_queue';

const loadOfflineQueue = (): OfflineOrder[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineOrder[]) : [];
  } catch {
    return [];
  }
};

const persistOfflineQueue = (queue: OfflineOrder[]) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('No se pudo guardar la cola offline', err);
  }
};

const logError = (context: string, error: any) => {
  console.error(`[${context}]`, error);
  try {
    const raw = localStorage.getItem('pos_error_logs');
    const parsed = raw ? (JSON.parse(raw) as any[]) : [];
    parsed.push({
      context,
      message: error?.message ?? String(error),
      time: new Date().toISOString(),
    });
    if (parsed.length > 50) parsed.shift();
    localStorage.setItem('pos_error_logs', JSON.stringify(parsed));
  } catch {
    // ignore if storage is not available
  }
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

const navTitles: Record<string, string> = {
  overview: 'Inicio',
  sales: 'Ventas',
  closing: 'Cierre',
  pending: 'Pendientes',
  products: 'Productos',
};

type OverviewDateFilter = 'today' | 'yesterday' | 'last7' | 'all';
type OverviewMethodFilter = PaymentMethod | 'all' | 'pending';

const FestivePOS = () => {
  const [activeNav, setActiveNav] = useState('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [drafts, setDrafts] = useState<DraftOrder[]>([
    { id: '1', label: 'Pedido 1', items: [], paymentMethod: 'cash' },
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineOrder[]>([]);
  const [productUpdateError, setProductUpdateError] = useState<string | null>(null);
  const [productUpdateInfo, setProductUpdateInfo] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Record<string, { name: string; price: number; stock: number; category: string }>>({});
  const [productSearch, setProductSearch] = useState('');
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [newProductModal, setNewProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0, category: 'Otros' });
  const [closingFrom, setClosingFrom] = useState<string | null>(null);
  const [closingTo, setClosingTo] = useState<string | null>(null);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const currentDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0];
  const orderItems = currentDraft?.items || [];
  const paymentMethod = currentDraft?.paymentMethod || 'cash';
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', price: 0, quantity: 1 });

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
    const stock = product.stock ?? Number.POSITIVE_INFINITY;
    updateDraft((draft) => {
      const existing = draft.items.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > stock) {
          setOrderError('Stock insuficiente para este producto.');
          return draft;
        }
        return {
          ...draft,
          items: draft.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          ),
        };
      }
      if (stock <= 0) {
        setOrderError('Producto sin stock.');
        return draft;
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

  const addManualItem = () => {
    if (!currentDraft) return;
    if (!manualForm.name.trim()) {
      setOrderError('Ingresa un nombre para la Venta rápida.');
      return;
    }
    if (manualForm.price <= 0 || manualForm.quantity <= 0) {
      setOrderError('Precio y cantidad deben ser mayores a 0.');
      return;
    }
    setOrderError(null);
    const newId = `manual-${Date.now()}`;
    updateDraft((draft) => ({
      ...draft,
      items: [
        ...draft.items,
        {
          id: newId,
          name: manualForm.name.trim(),
          price: manualForm.price,
          quantity: manualForm.quantity,
          emoji: '\u{1F4DD}',
          isManual: true,
        },
      ],
    }));
    setManualForm({ name: '', price: 0, quantity: 1 });
    setShowManualModal(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    if (!currentDraft) return;
    const product = products.find((p) => p.id === id);
    const stock = product?.stock ?? Number.POSITIVE_INFINITY;
    updateDraft((draft) => ({
      ...draft,
      items: draft.items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, Math.min(item.quantity + delta, stock)) } : item,
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const role = (data.user as any)?.app_metadata?.role ?? null;
      setUserRole(role);
    });
  }, []);

  const canEditProducts = userRole === 'admin';

  const addDraft = () => {
    const maxNumber = drafts.reduce((max, d) => {
      const match = d.label.match(/(\d+)/);
      const n = match ? Number.parseInt(match[1], 10) : 0;
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextNumber = maxNumber + 1;
    const newId = `${Date.now()}`;
    setDrafts((prev) => [...prev, { id: newId, label: `Pedido ${nextNumber}`, items: [], paymentMethod: 'cash' }]);
    setActiveDraftId(newId);
  };

  const handleUpdateProduct = async (id: string, price: number, stock: number): Promise<boolean> => {
    if (!canEditProducts) {
      setProductUpdateError('Solo admin puede editar productos.');
      return false;
    }
    setProductUpdateError(null);
    setProductUpdateInfo(null);
    try {
      const payload = {
        default_price: price,
        stock,
        name: productForm[id]?.name,
        category: productForm[id]?.category,
      };
      const { error } = await supabase.from('products').update(payload).eq('id', Number(id));
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, price, stock, name: payload.name || p.name, category: payload.category || p.category } : p)));
      setProductUpdateInfo('Producto actualizado.');
      return true;
    } catch (err: any) {
      setProductUpdateError(err?.message ?? 'No se pudo actualizar el producto.');
      return false;
    }
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

  const handleProductFieldChange = (id: string, field: 'name' | 'price' | 'stock' | 'category', value: string) => {
    setProductForm((prev) => {
      const current = prev[id] ?? { name: '', price: 0, stock: 0, category: '' };
      const next = { ...current };
      if (field === 'price' || field === 'stock') {
        (next as any)[field] = Number.isNaN(Number.parseInt(value, 10)) ? 0 : Number.parseInt(value, 10);
      } else {
        (next as any)[field] = value;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSaveProductRow = async (id: string) => {
    const data = productForm[id];
    if (!data) return;
    const price = Number.isNaN(Number(data.price)) ? 0 : data.price;
    const stock = Number.isNaN(Number(data.stock)) ? 0 : data.stock;
    const ok = await handleUpdateProduct(id, price, stock);
    if (ok) setEditProductId(null);
  };

  const handleCreateProduct = async () => {
    if (!canEditProducts) {
      setProductUpdateError('Solo admin puede crear productos.');
      return;
    }
    if (!newProduct.name.trim()) {
      setProductUpdateError('El nombre es obligatorio.');
      return;
    }
    setProductUpdateError(null);
    setProductUpdateInfo(null);
    try {
      const payload = {
        name: newProduct.name.trim(),
        default_price: Number.isNaN(Number(newProduct.price)) ? 0 : Number(newProduct.price),
        stock: Number.isNaN(Number(newProduct.stock)) ? 0 : Number(newProduct.stock),
        category: newProduct.category.trim() || 'Otros',
        is_active: true,
      };
      const { data, error } = await supabase.from('products').insert(payload).select('id').single();
      if (error) throw error;
      setNewProductModal(false);
      setNewProduct({ name: '', price: 0, stock: 0, category: 'Otros' });
      await loadProducts();
      if (data?.id) {
        setEditProductId(String(data.id));
        setProductUpdateInfo('Producto creado.');
      }
    } catch (err: any) {
      setProductUpdateError(err?.message ?? 'No se pudo crear el producto.');
    }
  };

  const saveOrderOnline = async (
    itemsToSave: OrderItem[],
    method: PaymentMethod,
    note: string | null,
    opts?: { silent?: boolean },
  ): Promise<boolean> => {
    const silent = opts?.silent ?? false;
    const regularItems = itemsToSave.filter((i) => !i.isManual && Number.isInteger(Number.parseInt(i.id, 10)));
    const manualItems = itemsToSave.filter((i) => i.isManual);
    const ids = regularItems.map((i) => Number.parseInt(i.id, 10));

    try {
      if (regularItems.length) {
        const { data: stockRows, error: stockError } = await supabase
          .from('products')
          .select('id, stock')
          .in('id', ids);
        if (stockError) throw stockError;
        const stockMap = new Map<number, number>();
        (stockRows || []).forEach((r: any) => stockMap.set(r.id, Number(r.stock ?? 0)));
        const lacking = regularItems.filter((item) => (stockMap.get(Number(item.id)) ?? 0) < item.quantity);
        if (lacking.length) {
          if (!silent) setOrderError(`Stock insuficiente para: ${lacking.map((i) => i.name).join(', ')}`);
          return false;
        }
      }
    } catch (err: any) {
      if (!silent) setOrderError(err?.message ?? 'No se pudo validar stock.');
      logError('Validacion stock fallo', err);
      return false;
    }

    try {
      const manualProductId =
        manualItems.length > 0
          ? products.find((p) => p.name.toLowerCase().includes('venta manual'))?.id ??
            products[0]?.id ??
            null
          : null;
      if (manualItems.length > 0 && !manualProductId) {
        setOrderError('Crea al menos un producto para registrar ventas rapidas.');
        return false;
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          payment_method: method,
          total_amount: itemsToSave.reduce((acc, i) => acc + i.price * i.quantity, 0),
          notes: note,
          paid_at: method === 'pending' ? null : new Date().toISOString(),
          paid_by: method === 'pending' ? null : (await supabase.auth.getUser()).data.user?.id ?? null,
          paid_method: method === 'pending' ? null : method,
        })
        .select('id')
        .single();

      if (saleError || !sale) throw saleError;

      const saleItemsPayload = [
        ...regularItems.map((item) => ({
          sale_id: sale.id,
          product_id: Number.parseInt(item.id, 10),
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        })),
        ...manualItems.map((item) => ({
          sale_id: sale.id,
          product_id: manualProductId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        })),
      ];

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsPayload);
      if (itemsError) {
        await supabase.from('sales').delete().eq('id', sale.id);
        throw itemsError;
      }

      const stockUpdates = regularItems.map(async (item) => {
        const productId = Number.parseInt(item.id, 10);
        const { data: current } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();
        const currentStock = Number(current?.stock ?? 0);
        const newStock = Math.max(0, currentStock - item.quantity);
        const { error: updError } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        if (updError) throw updError;
      });

      try {
        await Promise.all(stockUpdates);
      } catch (stockErr: any) {
        if (!silent) {
          setOrderError(
            `Venta guardada pero no se pudo ajustar stock (requiere rol con permiso): ${stockErr?.message ?? ''}`,
          );
        }
        logError('Fallo ajuste de stock', stockErr);
      }

      if (activeNav === 'overview') loadOverviewSales();
      if (activeNav === 'closing') loadClosingSales();
      if (activeNav === 'pending') loadPendingSales();
      return true;
    } catch (err: any) {
      if (!silent) setOrderError(err.message ?? 'No se pudo confirmar la venta.');
      logError('Error guardando venta', err);
      return false;
    }
  };

  const flushOfflineQueue = async () => {
    if (!offlineQueue.length || !navigator.onLine) return;
    const remaining: OfflineOrder[] = [];
    let sent = 0;
    for (const entry of offlineQueue) {
      const ok = await saveOrderOnline(entry.items, entry.paymentMethod, entry.notes, { silent: true });
      if (ok) {
        sent += 1;
      } else {
        remaining.push(entry);
      }
    }
    if (sent) {
      if (activeNav === 'overview') loadOverviewSales();
      if (activeNav === 'closing') loadClosingSales();
      if (activeNav === 'pending') loadPendingSales();
      setOrderError(`Se enviaron ${sent} pedido(s) pendientes al reconectar.`);
    }
    setOfflineQueue(remaining);
  };

  const confirmOrder = async (): Promise<boolean> => {
    if (!orderItems.length || savingOrder) return false;

    setSavingOrder(true);
    setOrderError(null);

    const summaryNote = orderItems.map((item) => `${item.quantity}x ${item.name}`).join(' - ');
    const notes =
      paymentMethod === 'pending'
        ? `PENDIENTE - ${summaryNote || 'Sin detalle'}`
        : summaryNote || null;

    try {
      const success = await saveOrderOnline(orderItems, paymentMethod, notes);
      if (success) {
        updateDraft((draft) => ({ ...draft, items: [] }));
        return true;
      }

      if (isOffline) {
        const queued: OfflineOrder = {
          id: `${Date.now()}`,
          items: orderItems,
          paymentMethod,
          notes,
          createdAt: new Date().toISOString(),
        };
        setOfflineQueue((prev) => [...prev, queued]);
        updateDraft((draft) => ({ ...draft, items: [] }));
        setOrderError('Sin conexion. Pedido guardado offline y se enviara al reconectar.');
        return true;
      }
      return false;
    } finally {
      setSavingOrder(false);
    }
  };

  useEffect(() => {
    setOfflineQueue(loadOfflineQueue());
  }, []);

  useEffect(() => {
    persistOfflineQueue(offlineQueue);
  }, [offlineQueue]);

  useEffect(() => {
    if (!isOffline) {
      flushOfflineQueue();
    }
  }, [isOffline, offlineQueue]);

  useEffect(() => {
    if (!canEditProducts && activeNav === 'products') {
      setActiveNav('sales');
    }
  }, [canEditProducts, activeNav]);

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

  // Suscripciones Realtime (sales) para refrescar overview/pending/closing
  useEffect(() => {
    const ch = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => {
          if (activeNav === 'overview') loadOverviewSales();
          if (activeNav === 'pending') loadPendingSales();
          if (activeNav === 'closing') loadClosingSales();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeNav, overviewDateFilter, overviewMethodFilter, pendingFilter, pendingDateFilter, pendingSearch]);

  useEffect(() => {
    const ch = supabase
      .channel('sale-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sale_items' },
        () => {
          if (activeNav === 'overview') loadOverviewSales();
          if (activeNav === 'pending') loadPendingSales();
          if (activeNav === 'closing') loadClosingSales();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeNav, overviewDateFilter, overviewMethodFilter, pendingFilter, pendingDateFilter, pendingSearch]);

  // Polling m�s corto (15s) como respaldo multi-puesto
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeNav === 'overview') loadOverviewSales();
      if (activeNav === 'closing') loadClosingSales();
      if (activeNav === 'pending') loadPendingSales();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeNav, overviewDateFilter, overviewMethodFilter, pendingFilter, pendingDateFilter, pendingSearch]);

  useEffect(() => {
    const ch = supabase
      .channel('sale-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sale_items' },
        () => {
          if (activeNav === 'overview') loadOverviewSales();
          if (activeNav === 'pending') loadPendingSales();
          if (activeNav === 'closing') loadClosingSales();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeNav, overviewDateFilter, overviewMethodFilter, pendingFilter, pendingDateFilter, pendingSearch]);

  // Estado offline/online
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        .select('id, created_at, total_amount, payment_method, notes, paid_at, paid_by, paid_method')
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
      const mapped = mapProducts(data);
      setProducts(mapped);
      const form: Record<string, { name: string; price: number; stock: number; category: string }> = {};
      mapped.forEach((p) => {
        form[p.id] = { name: p.name, price: p.price, stock: p.stock ?? 0, category: p.category };
      });
      setProductForm(form);
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

  const computeClosingWindow = async () => {
    try {
      const { data: last } = await supabase
        .from('cash_closures')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      let fromIso: string;
      if (last?.created_at) {
        fromIso = last.created_at;
      } else {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        fromIso = start.toISOString();
      }
      const toIso = new Date().toISOString();
      setClosingFrom(fromIso);
      setClosingTo(toIso);
      return { from: fromIso, to: toIso };
    } catch (err) {
      console.error('No se pudo calcular ventana de cierre, se usa hoy.', err);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const toIso = new Date().toISOString();
      setClosingFrom(start.toISOString());
      setClosingTo(toIso);
      return { from: start.toISOString(), to: toIso };
    }
  };

  const loadPendingSales = async () => {
    setLoadingPending(true);
    setPendingError(null);
    setPendingInfo(null);
    try {
      const query = supabase
        .from('sales')
        .select('id, created_at, total_amount, payment_method, notes, paid_at, paid_by, paid_method')
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
    const now = new Date().toISOString();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    const current = pendingSales.find((s) => s.id === saleId);
    const cleanedNotes =
      note?.trim() ||
      current?.notes?.replace(/^PENDIENTE\s*-\s*/i, '').trim() ||
      current?.notes?.trim() ||
      null;

    const { error } = await supabase
      .from('sales')
      .update({
        payment_method: method,
        notes: cleanedNotes,
        paid_at: now,
        paid_by: userId,
        paid_method: method,
      })
      .eq('id', saleId);
    if (error) {
      setPendingError(error.message ?? 'No se pudo actualizar el pedido.');
      return;
    }
    setPendingInfo(`Pedido marcado como pagado (${paymentMethodDisplay[method]})`);
    await loadPendingSales();
    if (activeNav === 'overview') loadOverviewSales();
    if (activeNav === 'closing') loadClosingSales();
    if (selectedPendingId === saleId) setSelectedPendingId(null);
  };

  const loadClosingSales = async () => {
    setLoadingClosing(true);
    setClosingError(null);
    try {
      const { from, to } = await computeClosingWindow();
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
    const initial = { cash: 0, transfer: 0, pending: 0, other: 0 } as Record<
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

  const exportClosingCSV = () => {
    const headers = ['Fecha', 'Monto', 'Metodo', 'Notas'];
    const rows = closingSales.map((s) => {
      const note = (s.notes || '').replace(/"/g, '""');
      const date = new Date(s.created_at).toLocaleString('es-CL');
      return `"${date}",${s.total_amount},"${getPaymentLabel(s.payment_method)}","${note}"`;
    });
    rows.push('');
    rows.push(`Efectivo,${closingTotals.cash}`);
    rows.push(`Transferencia,${closingTotals.transfer}`);
    rows.push(`Pendiente,${closingTotals.pending}`);
    rows.push(`Total,${closingTotal}`);
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cierre_caja.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportClosingPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = closingSales
      .map(
        (s) =>
          `<tr><td>${new Date(s.created_at).toLocaleString('es-CL')}</td><td>$${formatCLP(
            s.total_amount,
          )}</td><td>${getPaymentLabel(s.payment_method)}</td><td>${s.notes || '-'}</td></tr>`,
      )
      .join('');
    win.document.write(`
      <html>
        <head>
          <title>Cierre de caja</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #1b1b1b; }
            h2 { margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; }
            th, td { border: 1px solid #e4e4e4; padding: 8px; font-size: 12px; }
            th { background: #f6f6f6; text-align: left; }
            .totals { margin-top: 12px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h2>Cierre de caja</h2>
          <div class="totals">
            <div>Efectivo: $${formatCLP(closingTotals.cash)}</div>
            <div>
            <div>Transferencia: $${formatCLP(closingTotals.transfer)}</div>
            <div>Pendiente: $${formatCLP(closingTotals.pending)}</div>
            <div><strong>Total: $${formatCLP(closingTotal)}</strong></div>
          </div>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Monto</th><th>Metodo</th><th>Notas</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4">Sin ventas hoy</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

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
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <SelectField
              value={pendingFilter}
              onChange={(val) => setPendingFilter(val as PaymentMethod | 'all')}
              options={[
                { value: 'all', label: 'Solo pendientes' },
                { value: 'cash', label: 'Efectivo' },
                
                { value: 'transfer', label: 'Transferencia' },
                { value: 'pending', label: 'Pendiente' },
              ]}
            />
            <SelectField
              value={pendingDateFilter}
              onChange={(val) => setPendingDateFilter(val as 'today' | '7d' | '30d' | 'all')}
              options={[
                { value: 'today', label: 'Hoy' },
                { value: '7d', label: '�ltimos 7 d�as' },
                { value: '30d', label: '�ltimos 30 d�as' },
                { value: 'all', label: 'Todo' },
              ]}
            />
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
                  ? '�ltimos 7 d�as'
                  : pendingDateFilter === '30d'
                    ? '�ltimos 30 d�as'
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
            �
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">M�todo de pago</div>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'transfer'] as const).map((method) => {
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
          onClick={() => setShowManualModal(true)}
          className="h-9 px-3 rounded-full text-sm bg-[#c0392b] text-white font-semibold shadow-soft hover:shadow-card transition"
        >
          Venta rápida
        </button>
        <button
          onClick={deleteDraft}
          className="h-9 px-3 rounded-full text-sm border border-borderSoft text-text hover:border-accent/40 transition"
        >
          Eliminar
        </button>
      </div>

      {isOffline && (
        <div className="w-full bg-amber-100 border border-amber-300 text-amber-800 text-sm rounded-xl px-3 py-2 shadow-soft">
          Sin conexi�n: los cambios se intentar�n cuando vuelva la red.
        </div>
      )}

      <div className="grid xl:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="bg-panel border border-borderSoft rounded-2xl p-6 shadow-soft space-y-6 pb-8 md:pb-10">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Productos</div>
            <div className="text-xs text-textSoft">
              {filteredProducts.length} articulo{filteredProducts.length === 1 ? '' : 's'}
            </div>
          </div>
          {canEditProducts && productUpdateError && <div className="text-sm text-accent">{productUpdateError}</div>}
          {canEditProducts && productUpdateInfo && <div className="text-sm text-green-700">{productUpdateInfo}</div>}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
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
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <SelectField
              value={overviewDateFilter}
              onChange={(val) => setOverviewDateFilter(val as OverviewDateFilter)}
              options={[
                { value: 'today', label: 'Hoy' },
                { value: 'yesterday', label: 'Ayer' },
                { value: 'last7', label: '�ltimos 7' },
                { value: 'all', label: 'Todas' },
              ]}
            />
            <SelectField
              value={overviewMethodFilter}
              onChange={(val) => setOverviewMethodFilter(val as OverviewMethodFilter)}
              options={[
                { value: 'all', label: 'Método: todos' },
                { value: 'cash', label: 'Efectivo' },
                
                { value: 'transfer', label: 'Transferencia' },
                { value: 'pending', label: 'Pendiente' },
              ]}
            />
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
                  <td className="py-2 pr-4 text-textSoft">{s.notes || '�'}</td>
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-semibold">Ventas del dia</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportClosingCSV}
                className="h-9 px-3 rounded-full border border-borderSoft text-sm text-text hover:border-accent/40 transition"
              >
                CSV
              </button>
              <button
                onClick={exportClosingPDF}
                className="h-9 px-3 rounded-full border border-borderSoft text-sm text-text hover:border-accent/40 transition"
              >
                PDF
              </button>
              <button
                onClick={loadClosingSales}
                className="h-9 px-3 rounded-full border border-borderSoft text-sm text-text hover:border-accent/40 transition"
              >
                Refrescar
              </button>
            </div>
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
                    <td className="py-2 pr-4 text-textSoft">{s.notes || '�'}</td>
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
              {(['cash', 'transfer', 'pending'] as const).map((method) => (
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

  const productsContent = (
    <div className="space-y-5">
      {!canEditProducts && (
        <div className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-lg px-3 py-2">
          Solo admin puede editar productos.
        </div>
      )}

      {canEditProducts && (
        <div className="bg-panel border border-borderSoft rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold">Gestion de productos</div>
              <div className="text-xs text-textSoft">{products.length} articulo(s)</div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full md:w-56 h-9 rounded-lg border border-borderSoft bg-white px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 rounded-lg border border-borderSoft bg-white px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="Todo">Todas las categorias</option>
                {categoryOptions
                  .filter((c) => c !== 'Todo')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="pt-1">
            <button
              onClick={() => setNewProductModal(true)}
              className="w-full md:w-auto h-9 px-3 rounded-lg bg-[#c0392b] text-white text-sm font-semibold shadow-soft hover:shadow-card transition"
            >
              + Nuevo producto
            </button>
          </div>
          {productUpdateError && <div className="text-sm text-accent">{productUpdateError}</div>}
          {productUpdateInfo && <div className="text-sm text-green-700">{productUpdateInfo}</div>}

          {editProductId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-card border border-borderSoft shadow-card p-5 space-y-4">
                {(() => {
                  const form = productForm[editProductId];
                  if (!form) return <div className="text-sm text-textSoft">Producto no encontrado.</div>;
                  return (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">Editar producto</div>
                          <div className="text-xs text-textSoft">ID: {editProductId}</div>
                        </div>
                        <button
                          onClick={() => setEditProductId(null)}
                          className="h-8 px-3 rounded-md border border-borderSoft text-xs text-text hover:border-accent/40 transition"
                        >
                          Cerrar
                        </button>
                      </div>
                      <div className="space-y-3 text-sm">
                        <label className="flex flex-col gap-1">
                          <span className="text-textSoft">Nombre</span>
                          <input
                            value={form.name}
                            onChange={(e) => handleProductFieldChange(editProductId, 'name', e.target.value)}
                            className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-textSoft">Precio</span>
                          <input
                            value={form.price}
                            onChange={(e) => handleProductFieldChange(editProductId, 'price', e.target.value)}
                            className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                            inputMode="numeric"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-textSoft">Stock</span>
                          <input
                            value={form.stock}
                            onChange={(e) => handleProductFieldChange(editProductId, 'stock', e.target.value)}
                            className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                            inputMode="numeric"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-textSoft">Categoria</span>
                          <input
                            value={form.category}
                            onChange={(e) => handleProductFieldChange(editProductId, 'category', e.target.value)}
                            className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditProductId(null)}
                          className="h-9 px-3 rounded-md border border-borderSoft text-xs text-text hover:border-accent/40 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveProductRow(editProductId)}
                          className="h-9 px-3 rounded-md bg-accent text-panel text-xs font-semibold shadow-soft hover:shadow-card transition"
                        >
                          Guardar
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {newProductModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-card border border-borderSoft shadow-card p-5 space-y-4">
                <div className="flex items-start">
                  <div>
                    <div className="text-sm font-semibold">Nuevo producto</div>
                    <div className="text-xs text-textSoft">Completa los datos y guarda</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <label className="flex flex-col gap-1">
                    <span className="text-textSoft">Nombre</span>
                    <input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-textSoft">Precio</span>
                    <input
                      value={newProduct.price}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                      className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-textSoft">Stock</span>
                    <input
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: Number(e.target.value) || 0 }))}
                      className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-textSoft">Categoria</span>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      <option value="">Selecciona una categoria</option>
                      {categoryOptions
                        .filter((c) => c !== 'Todo')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setNewProductModal(false)}
                    className="h-9 px-3 rounded-md border border-borderSoft text-xs text-text hover:border-accent/40 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateProduct}
                    className="h-9 px-3 rounded-md bg-[#c0392b] text-white text-xs font-semibold shadow-soft hover:shadow-card transition"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const filtered = products
              .filter((p) => (selectedCategory === 'Todo' ? true : p.category === selectedCategory))
              .filter((p) => p.name.toLowerCase().includes(productSearch.trim().toLowerCase()));
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-textSoft border-b border-borderSoft/70">
                      <th className="py-2 pr-3">Nombre</th>
                      <th className="py-2 pr-3">Precio</th>
                      <th className="py-2 pr-3">Stock</th>
                      <th className="py-2 pr-3">Categoria</th>
                      <th className="py-2 pr-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const form = productForm[p.id] ?? { name: p.name, price: p.price, stock: p.stock ?? 0, category: p.category };
                      return (
                        <tr key={p.id} className="border-b border-borderSoft/50">
                          <td className="py-2 pr-3">{form.name}</td>
                          <td className="py-2 pr-3">${formatCLP(form.price)}</td>
                          <td className="py-2 pr-3">{form.stock}</td>
                          <td className="py-2 pr-3">{form.category}</td>
                          <td className="py-2 pr-3 text-right">
                            <button
                              onClick={() => setEditProductId(p.id)}
                              className="h-9 px-3 rounded-lg border border-borderSoft text-xs text-text hover:border-accent/40 transition"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!filtered.length && (
                  <div className="text-sm text-textSoft py-3">Sin resultados para esta busqueda.</div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
  return (
    <div className="min-h-screen bg-bg text-text flex">
      <Sidebar
        active={activeNav}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onNavigate={setActiveNav}
        onLogout={handleLogout}
        allowedKeys={canEditProducts ? ['overview', 'sales', 'closing', 'pending', 'products'] : ['overview', 'sales', 'closing', 'pending']}
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
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-full border border-borderSoft bg-panel text-textSoft hover:border-accent/50 hover:text-accent transition shadow-soft flex items-center justify-center"
                aria-label="Cerrar sesi�n"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="1.6">
                  <path d="M10 17l-5-5 5-5" />
                  <path d="M15 12H5" />
                  <path d="M19 5v14" />
                </svg>
              </button>
            </div>
          </div>

          {activeNav === 'overview' && overviewContent}
          {activeNav === 'sales' && salesContent}
          {activeNav === 'closing' && closingContent}
          {activeNav === 'pending' && pendingContent}
          {activeNav === 'products' && productsContent}
        </div>
      </div>

      {activeNav === 'sales' && (
        <>
          <div className="xl:hidden fixed bottom-[93px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg z-40">
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
                    �
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

      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-borderSoft shadow-card p-5 space-y-4">
            <div>
              <div className="text-sm font-semibold">Venta rápida</div>
              <div className="text-xs text-textSoft">Agrega un producto libre al pedido actual</div>
            </div>
            <div className="space-y-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-textSoft">Nombre</span>
                <input
                  value={manualForm.name}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-textSoft">Precio</span>
                <input
                  value={manualForm.price}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                  className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  inputMode="numeric"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-textSoft">Cantidad</span>
                <input
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                  className="w-full h-9 rounded-md border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  inputMode="numeric"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setManualForm({ name: '', price: 0, quantity: 1 });
                  setShowManualModal(false);
                }}
                className="h-9 px-3 rounded-md border border-borderSoft text-xs text-text hover:border-accent/40 transition"
              >
                Cancelar
              </button>
              <button
                onClick={addManualItem}
                className="h-9 px-3 rounded-md bg-[#c0392b] text-white text-xs font-semibold shadow-soft hover:shadow-card transition"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingModal}

      <MobileNav
        active={activeNav}
        onNavigate={setActiveNav}
        allowedKeys={canEditProducts ? ['overview', 'sales', 'closing', 'pending', 'products'] : ['overview', 'sales', 'closing', 'pending']}
      />
    </div>
  );

  async function saveClosing() {
    if (savingClosing) return;
    setSavingClosing(true);
    setClosingError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;

      // Ventana de cierre: desde �ltimo cierre hasta ahora
      const window = closingFrom && closingTo ? { from: closingFrom, to: closingTo } : await computeClosingWindow();
      const { from, to } = window;

      // Totales por metodo basados en sale_items dentro de la ventana
      const { data: itemRows, error: itemError } = await supabase
        .from('sale_items')
        .select('total_price, sales!inner(payment_method, created_at)')
        .gte('sales.created_at', from)
        .lt('sales.created_at', to);
      if (itemError) throw itemError;

      const totalsByMethod: Record<string, number> = { cash: 0, transfer: 0, pending: 0, other: 0 };
      (itemRows || []).forEach((row: any) => {
        const methodRaw = row.sales?.payment_method || 'other';
        const method = paymentMethods.includes(methodRaw as PaymentMethod) ? methodRaw : 'other';
        totalsByMethod[method] = (totalsByMethod[method] || 0) + Number(row.total_price || 0);
      });

      const payload = {
        date: new Date().toISOString().slice(0, 10),
        expected_cash: Math.round(totalsByMethod.cash || 0),
        real_cash: Math.round(cashCountedNumber),
        expected_transfers: Math.round((totalsByMethod.transfer || 0)),
        real_transfers: Math.round((totalsByMethod.transfer || 0)),
        comment: closingNotes || null,
        closed_by: userId,
      };
      const { error } = await supabase.from('cash_closures').insert(payload);
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
