import { useMemo, useState } from 'react';
import MobileNav from '../components/pos/MobileNav';
import OrderPanel, { type OrderItem, type PaymentMethod } from '../components/pos/OrderPanel';
import ProductCard, { type Product } from '../components/pos/ProductCard';
import RecentSalesTable, { type Sale } from '../components/pos/RecentSalesTable';
import Sidebar from '../components/pos/Sidebar';

const products: Product[] = [
  { id: '1', name: 'Luces LED Blancas 10m', price: 8990, emoji: '💡', category: 'Luces' },
  { id: '2', name: 'Guirnalda Navideña Verde', price: 6990, emoji: '🌿', category: 'Decoración' },
  { id: '3', name: 'Esferas Doradas x6', price: 4990, emoji: '🟤', category: 'Esferas' },
  { id: '4', name: 'Luces Cascada 3m', price: 12990, emoji: '✨', category: 'Luces' },
  { id: '5', name: 'Esferas Plateadas x6', price: 4990, emoji: '⚪', category: 'Esferas' },
  { id: '6', name: 'Guirnalda con Luces', price: 14990, emoji: '🌟', category: 'Decoración' },
  { id: '7', name: 'Luces Multicolor 5m', price: 7490, emoji: '🌈', category: 'Luces' },
  { id: '8', name: 'Estrella Punta Árbol', price: 9990, emoji: '⭐', category: 'Decoración' },
  { id: '9', name: 'Cojín Renos', price: 7990, emoji: '🦌', category: 'Textiles' },
  { id: '10', name: 'Vela Canela', price: 5990, emoji: '🕯️', category: 'Aromas' },
  { id: '11', name: 'Muñeco Nieve', price: 8990, emoji: '⛄', category: 'Figuras' },
  { id: '12', name: 'Set Calcetines 4u', price: 6990, emoji: '🧦', category: 'Textiles' },
];

const initialSales: Sale[] = [
  { id: 's1', time: '14:32', items: 3, total: 24970, method: 'tarjeta' },
  { id: 's2', time: '13:15', items: 1, total: 8990, method: 'efectivo' },
  { id: 's3', time: '12:48', items: 2, total: 11980, method: 'transferencia' },
  { id: 's4', time: '11:20', items: 4, total: 32960, method: 'tarjeta' },
];

const categories = ['Todo', 'Luces', 'Decoración', 'Esferas', 'Textiles', 'Figuras', 'Aromas'] as const;

const FestivePOS = () => {
  const [activeNav, setActiveNav] = useState('sales');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Todo');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [showOrderMobile, setShowOrderMobile] = useState(false);
  const [productQuery, setProductQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const byCategory =
      selectedCategory === 'Todo'
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const q = productQuery.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter((p) => p.name.toLowerCase().includes(q));
  }, [selectedCategory, productQuery]);


  const groupedProducts = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return grouped;
  }, [filteredProducts]);

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
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      items: orderItems.reduce((acc, item) => acc + item.quantity, 0),
      total,
      method:
        paymentMethod === 'cash'
          ? 'efectivo'
          : paymentMethod === 'card'
            ? 'tarjeta'
            : 'transferencia',
    };
    setSales((prev) => [sale, ...prev].slice(0, 8));
    setOrderItems([]);
  };

  return (
    <div className="min-h-screen bg-bg text-text flex">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex-1 min-h-screen pb-24 md:pb-10">
        <div className="xl:hidden bg-panel text-white px-6 py-3 shadow-soft border-b border-panelBorder flex items-center justify-center">
          <span className="text-sm font-semibold">TomiPicols - POS</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-card border border-borderSoft rounded-2xl px-4 py-3 shadow-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = cat === selectedCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-9 px-3 rounded-full text-sm border transition shadow-pill ${
                      active
                        ? 'bg-text text-white border-text shadow-soft'
                        : 'bg-muted text-text border-borderSoft hover:border-accent'
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
                placeholder="Buscar producto rápido..."
                className="w-full h-10 rounded-lg border border-borderSoft bg-muted px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          </div>

          <div className="grid xl:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-4">
              {Object.entries(groupedProducts).map(([cat, list]) => {
                const open = openCategories[cat] ?? true;
                return (
                  <div key={cat} className="bg-card border border-borderSoft rounded-2xl shadow-soft/80">
                    <button
                      onClick={() =>
                        setOpenCategories((prev) => ({ ...prev, [cat]: !open }))
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="text-sm font-semibold">{cat}</div>
                      <span className="text-textSoft text-lg">{open ? '–' : '+'}</span>
                    </button>
                    {open && (
                      <div className="border-t border-borderSoft px-2 py-3 overflow-x-auto">
                        <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(220px,1fr)] gap-3 snap-x">
                          {list.map((product) => (
                            <div key={product.id} className="snap-start">
                              <ProductCard product={product} onAdd={addProduct} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!Object.keys(groupedProducts).length && (
                <div className="text-sm text-textSoft">Sin productos en esta categoría.</div>
              )}
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

          <RecentSalesTable sales={sales} />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg">
        <div className="bg-panel text-white border border-panelBorder shadow-card rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-sidebarMuted">Pedido en curso</div>
            <div className="text-base font-semibold">${total.toLocaleString('es-CL')}</div>
          </div>
          <button
            onClick={() => setShowOrderMobile(true)}
            className="h-10 px-4 rounded-lg bg-white text-panel text-sm font-semibold"
          >
            Ver pedido
          </button>
        </div>
      </div>

      {showOrderMobile && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-panel text-white rounded-t-2xl p-4 border-t border-panelBorder shadow-card max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-sidebarMuted">Pedido actual</div>
                <div className="text-lg font-semibold">Mesa 5</div>
              </div>
              <button
                onClick={() => setShowOrderMobile(false)}
                className="text-sidebarMuted text-lg px-2"
              >
                ✕
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

      <MobileNav active={activeNav} onNavigate={setActiveNav} />
    </div>
  );
};

export default FestivePOS;
