type OrderItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  quantity: number;
};

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'pending';

type OrderPanelProps = {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderLabel?: string;
  paymentMethod: PaymentMethod;
  saving?: boolean;
  error?: string | null;
  onPaymentChange: (method: PaymentMethod) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onConfirm: () => void | Promise<boolean>;
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pending: 'Pendiente',
};

const OrderPanel = ({
  items,
  subtotal,
  tax,
  total,
  orderLabel = 'Pedido en curso',
  paymentMethod,
  saving = false,
  error = null,
  onPaymentChange,
  onUpdateQuantity,
  onConfirm,
}: OrderPanelProps) => {
  const confirmLabel =
    saving ? 'Guardando...' : paymentMethod === 'pending' ? 'Guardar pendiente' : 'Confirmar pedido';

  return (
    <aside className="bg-card text-text rounded-2xl p-5 border border-borderSoft shadow-soft h-fit space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-sidebarMuted">Pedido actual</div>
          <div className="text-xl font-semibold">{orderLabel}</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/8 border border-borderSoft/70 flex items-center justify-center text-base">
          {'\u{1F9FE}'}
        </div>
      </div>

      <div className="space-y-3 max-h-72 overflow-auto pr-1">
        {items.length === 0 && (
          <div className="text-xs text-sidebarMuted">Agrega productos al pedido.</div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-borderSoft bg-panelAlt flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-panel border border-borderSoft/70 flex items-center justify-center text-lg shadow-soft">
                {item.emoji}
              </div>
              <div>
                <div className="text-sm font-semibold leading-snug">{item.name}</div>
                <div className="text-xs font-semibold text-accent">
                  ${item.price.toLocaleString('es-CL')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="w-8 h-8 rounded-full border border-borderSoft flex items-center justify-center text-xs hover:border-accent/60"
              >
                -
              </button>
              <span className="text-sm font-medium min-w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="w-8 h-8 rounded-full border border-borderSoft flex items-center justify-center text-xs hover:border-accent/60"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-sidebarMuted">Pago</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => {
            const active = paymentMethod === method;
            return (
              <button
                key={method}
                onClick={() => onPaymentChange(method)}
                className={`h-10 rounded-lg border text-sm transition ${
                  active
                    ? 'bg-accent text-panel font-semibold border-transparent shadow-soft'
                    : 'bg-panel border-borderSoft text-sidebarMuted hover:border-accent/40'
                }`}
                aria-pressed={active}
              >
                {paymentLabels[method]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-textSoft">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString('es-CL')}</span>
        </div>
        {!!tax && (
          <div className="flex justify-between text-textSoft">
            <span>Impuesto</span>
            <span>${tax.toLocaleString('es-CL')}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>${total.toLocaleString('es-CL')}</span>
        </div>
      </div>

      {error && (
        <div className="text-xs text-accent bg-accent/10 border border-accent/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={!items.length || saving}
        className="w-full h-11 rounded-xl bg-accent text-panel text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-soft hover:shadow-card transition focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        {confirmLabel}
      </button>
    </aside>
  );
};

export type { OrderItem, PaymentMethod };
export default OrderPanel;
