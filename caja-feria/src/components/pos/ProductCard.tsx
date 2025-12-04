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
    <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-soft/60 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xl shadow-card">
          {product.emoji}
        </div>
        <div>
          <div className="text-sm font-medium">{product.name}</div>
          <div className="text-xs text-textSoft">${product.price.toLocaleString('es-CL')}</div>
        </div>
      </div>
      <button
        onClick={() => onAdd(product)}
        className="h-9 rounded-lg bg-text text-white text-sm hover:opacity-90 transition"
      >
        Agregar
      </button>
    </div>
  );
};

export type { Product };
export default ProductCard;
