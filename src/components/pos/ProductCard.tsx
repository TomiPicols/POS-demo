type Product = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: string;
  stock?: number;
};

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const outOfStock = (product.stock ?? 0) <= 0;

  return (
    <div className="group relative h-full min-h-[150px] overflow-hidden bg-card border border-borderSoft rounded-2xl p-4 shadow-soft flex flex-col gap-2 transition hover:-translate-y-0.5 hover:border-accent/30 focus-within:border-accent/30">
      <div className="flex flex-col items-start gap-2 w-full transition duration-200 group-hover:blur-[1px] group-focus-within:blur-[1px] group-hover:opacity-65 group-focus-within:opacity-65">
        <div className="w-11 h-11 rounded-xl bg-panelAlt border border-borderSoft flex items-center justify-center text-lg shadow-soft transition group-hover:border-accent/40">
          {product.emoji}
        </div>
        <div className="flex flex-col gap-1 w-full">
          <div className="text-sm font-semibold leading-snug line-clamp-2">{product.name}</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-textSoft">{product.category}</div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200">
        <div className="bg-white/92 backdrop-blur-xl border border-borderSoft shadow-soft rounded-xl px-3 py-2 flex items-center gap-3 pointer-events-auto">
          <div className="text-[13px] font-semibold text-text">${product.price.toLocaleString('es-CL')}</div>
          <button
            onClick={() => !outOfStock && onAdd(product)}
            disabled={outOfStock}
            className={`h-8 px-3 rounded-lg text-panel text-xs font-semibold shadow-soft transition focus:outline-none focus:ring-2 focus:ring-accent/25 ${
              outOfStock ? 'bg-gray-300 cursor-not-allowed text-gray-600' : 'bg-accent hover:shadow-card'
            }`}
          >
            {outOfStock ? 'Sin stock' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-textSoft mt-auto">
        <span>Stock:</span>
        <span className={outOfStock ? 'text-red-600 font-semibold' : 'text-gray-700'}>
          {outOfStock ? 'Agotado' : product.stock ?? 0}
        </span>
      </div>
    </div>
  );
};

export type { Product };
export default ProductCard;
