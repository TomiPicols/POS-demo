type OrderItem = {
  id: string;
  name: string;
  emoji: string;
  price: number;
  quantity: number;
};

type PaymentMethod = 'cash' | 'card' | 'transfer';

type OrderPanelProps = {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  onPaymentChange: (method: PaymentMethod) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onConfirm: () => void;
};

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transfer',
};

const OrderPanel = ({
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  onPaymentChange,
  onUpdateQuantity,
  onConfirm,
}: OrderPanelProps) => {
  return (
    <aside className="bg-panel text-white rounded-2xl p-4 border border-panelBorder shadow-card h-fit space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-sidebarMuted">Pedido actual</div>
          <div className="text-lg font-semibold">Mesa 5</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-panelAlt flex items-center justify-center text-sidebarMuted border border-panelBorder">
          🔔
        </div>
      </div>

      <div className="space-y-3 max-h-72 overflow-auto pr-1">
        {items.length === 0 && (
          <div className="text-xs text-sidebarMuted">Agrega productos navideños al pedido.</div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-panelBorder bg-panelAlt p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-panel border border-panelBorder flex items-center justify-center text-lg">
                {item.emoji}
              </div>
              <div>
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="text-xs text-sidebarMuted">
                  ${item.price.toLocaleString('es-CL')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="w-7 h-7 rounded-full border border-panelBorder flex items-center justify-center text-xs"
              >
                –
              </button>
              <span className="text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="w-7 h-7 rounded-full border border-panelBorder flex items-center justify-center text-xs"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-sidebarMuted">Método de pago</div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => {
            const active = paymentMethod === method;
            return (
              <button
                key={method}
                onClick={() => onPaymentChange(method)}
                className={`h-9 rounded-lg border text-sm transition ${
                  active
                    ? 'bg-white text-panel font-semibold'
                    : 'bg-panelAlt border-panelBorder text-sidebarMuted hover:border-accent'
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
        <div className="flex justify-between text-sidebarMuted">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between text-sidebarMuted">
          <span>Impuesto</span>
          <span>${tax.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>${total.toLocaleString('es-CL')}</span>
        </div>
      </div>

      <button
        onClick={onConfirm}
        disabled={!items.length}
        className="w-full h-11 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-soft"
      >
        Confirmar pedido
      </button>
    </aside>
  );
};

export type { OrderItem, PaymentMethod };
export default OrderPanel;
