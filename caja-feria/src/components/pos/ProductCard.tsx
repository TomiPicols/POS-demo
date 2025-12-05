type Product = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: string;
};

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  return (
    <div className="group relative overflow-hidden bg-card border border-borderSoft rounded-2xl p-5 shadow-soft flex flex-col gap-4 transition hover:-translate-y-1 hover:border-accent/30">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-panelAlt border border-borderSoft flex items-center justify-center text-xl shadow-soft transition group-hover:border-accent/40">
          {product.emoji}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold leading-snug">{product.name}</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-textSoft mt-1">
            {product.category}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-semibold text-text bg-white/6 px-2.5 py-1 rounded-full leading-none border border-borderSoft">
            ${product.price.toLocaleString('es-CL')}
          </div>
        </div>
      </div>
      <button
        onClick={() => onAdd(product)}
        className="h-10 rounded-xl bg-accent text-panel text-sm font-semibold shadow-soft hover:shadow-card transition focus:outline-none focus:ring-2 focus:ring-accent/25"
      >
        Agregar
      </button>
    </div>
  );
};

export type { Product };
export default ProductCard;
