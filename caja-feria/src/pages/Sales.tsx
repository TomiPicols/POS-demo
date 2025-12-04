import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Product = {
  id: number;
  name: string;
  default_price: number;
};

type SaleItemDraft = {
  product: Product;
  quantity: number;
  unit_price: number;
};

type SaleRow = {
  id: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
};

type PaymentMethod = 'cash' | 'transfer' | 'other';

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value);

const chipOptions = ['All', 'Soups', 'Salads', 'Pasta', 'Bakery'] as const;

const Sales = () => {
  const [category, setCategory] = useState<(typeof chipOptions)[number]>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItemDraft[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesToday, setSalesToday] = useState<SaleRow[]>([]);

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.unit_price * it.quantity, 0),
    [items],
  );

  useEffect(() => {
    loadProducts();
    loadSalesToday();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('products')
        .select('id, name, default_price')
        .eq('is_active', true)
        .order('id');
      if (queryError) throw queryError;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message ?? 'Error cargando productos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSalesToday = async () => {
    setLoadingSales(true);
    setError(null);
    try {
      const { from, to } = todayRange();
      const { data, error: queryError } = await supabase
        .from('sales')
        .select('id, created_at, total_amount, payment_method, notes')
        .gte('created_at', from)
        .lt('created_at', to)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setSalesToday(data || []);
    } catch (err: any) {
      setError(err.message ?? 'Error cargando ventas');
    } finally {
      setLoadingSales(false);
    }
  };

  const addProduct = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.product.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p,
        );
      }
      return [
        ...prev,
        { product, quantity: 1, unit_price: Math.max(product.default_price, 0) },
      ];
    });
  };

  const changeQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.product.id === id
            ? { ...p, quantity: Math.max(1, p.quantity + delta) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  };

  const clearForm = () => {
    setItems([]);
    setPaymentMethod('cash');
    setNotes('');
  };

  const saveSale = async () => {
    if (!items.length || total <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          payment_method: paymentMethod,
          total_amount: total,
          notes: notes || null,
        })
        .select('id')
        .single();

      if (saleError || !sale) throw saleError;

      const saleItemsPayload = items.map((it) => ({
        sale_id: sale.id,
        product_id: it.product.id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.unit_price * it.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsPayload);

      if (itemsError) throw itemsError;

      await loadSalesToday();
      clearForm();
    } catch (err: any) {
      setError(err.message ?? 'No se pudo guardar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-textSoft">Ventas</p>
        <h1 className="text-2xl font-semibold mt-1">Registrar venta</h1>
      </header>

      <div className="bg-card border border-borderSoft rounded-xl px-4 py-3 shadow-card flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">Categorías</div>
          <div className="flex flex-wrap gap-2">
            {chipOptions.map((chip) => {
              const active = category === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setCategory(chip)}
                  className={`h-9 px-3 rounded-full text-sm border transition shadow-pill ${
                    active
                      ? 'bg-text text-white border-text shadow-soft'
                      : 'bg-muted text-text border-borderSoft hover:border-accent'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
        <button className="text-xs text-textSoft hover:text-text">Ver todo</button>
      </div>

      {error && (
        <div className="bg-card border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-card">
          <div className="text-xs text-textSoft">Sales Today</div>
          <div className="text-2xl font-semibold mt-1">
            ${formatCLP(salesToday.reduce((acc, s) => acc + s.total_amount, 0))}
          </div>
          <div className="text-xs text-textSoft mt-1">
            {loadingSales ? 'Cargando...' : `${salesToday.length} ventas`}
          </div>
        </div>
      </div>

      <div className="bg-card border border-borderSoft rounded-xl p-6 flex flex-col lg:flex-row gap-6 shadow-card">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Productos</div>
            {loadingProducts && (
              <div className="text-xs text-textSoft">Cargando...</div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="bg-muted border border-borderSoft rounded-lg px-3 py-2 text-left hover:border-accent transition shadow-soft/70"
              >
                <div className="text-sm">{p.name}</div>
                <div className="text-xs text-textSoft mt-1">
                  ${formatCLP(p.default_price)}
                </div>
              </button>
            ))}
            {!products.length && !loadingProducts && (
              <div className="col-span-full text-xs text-textSoft">
                No hay productos activos.
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-4">
          <div className="text-sm font-medium">Venta actual</div>

          <div className="bg-panel rounded-lg p-3 max-h-64 overflow-auto space-y-2 border border-panelBorder text-white shadow-card">
            {items.length === 0 && (
              <div className="text-xs text-sidebarMuted">Agrega productos para comenzar.</div>
            )}
            {items.map((it) => (
              <div
                key={it.product.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div>{it.product.name}</div>
                  <div className="text-xs text-sidebarMuted">
                    ${formatCLP(it.unit_price)} c/u
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeQuantity(it.product.id, -1)}
                    className="w-7 h-7 rounded-full border border-borderSoft flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span>{it.quantity}</span>
                  <button
                    onClick={() => changeQuantity(it.product.id, 1)}
                    className="w-7 h-7 rounded-full border border-borderSoft flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-textSoft">Método de pago</div>
            <div className="flex gap-2">
              {(['cash', 'transfer', 'other'] as const).map((m) => {
                const isActive = paymentMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition ${
                      isActive
                        ? 'bg-accent text-white border-accent shadow-soft'
                        : 'bg-panelAlt border-panelBorder text-sidebarMuted hover:border-accent'
                    }`}
                    aria-pressed={isActive}
                  >
                    {m === 'cash' ? 'Cash' : m === 'transfer' ? 'Transfer' : 'Other'}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            placeholder="Notas (opcional)"
            className="w-full text-sm rounded-lg border border-panelBorder bg-panelAlt text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-between text-white">
            <div className="text-lg font-semibold">Total: ${formatCLP(total)}</div>
            <button
              disabled={saving || total === 0}
              onClick={saveSale}
              className="h-10 px-4 rounded-lg bg-accent text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed shadow-soft"
            >
              {saving ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-medium">Ventas recientes (hoy)</div>
            <div className="text-xs text-textSoft">
              {loadingSales ? 'Cargando...' : `${salesToday.length} registro(s)`}
            </div>
          </div>
          <button
            onClick={loadSalesToday}
            className="text-xs text-textSoft hover:text-text"
          >
            Refrescar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-textSoft">
                <th className="py-2 pr-4">Hora</th>
                <th className="py-2 pr-4">Monto</th>
                <th className="py-2 pr-4">Método</th>
                <th className="py-2 pr-4">Notas</th>
              </tr>
            </thead>
            <tbody>
              {salesToday.map((s) => (
                <tr key={s.id} className="border-t border-borderSoft/60">
                  <td className="py-2 pr-4">
                    {new Date(s.created_at).toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 pr-4">${formatCLP(s.total_amount)}</td>
                  <td className="py-2 pr-4">{s.payment_method}</td>
                  <td className="py-2 pr-4">{s.notes || '-'}</td>
                </tr>
              ))}
              {!salesToday.length && !loadingSales && (
                <tr>
                  <td className="py-4 text-xs text-textSoft" colSpan={4}>
                    Aún no hay ventas hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
