import { useState } from 'react';
import type { Product } from '../../api/types';
import { money } from '../../lib/format';
import { useCart } from '../../store/cart';
import { DishBadge, DishImage, Modal, QuantityStepper } from '../../components/ui';

/** Large photo and details of a dish, with a quantity picker. */
export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const cart = useCart();
  const inCart = cart.quantityOf(product.id);
  const [quantity, setQuantity] = useState(Math.max(1, inCart));

  const save = () => {
    cart.setOrAdd(product, quantity);
    onClose();
  };

  return (
    <Modal title={product.name} onClose={onClose} bare wide>
      <div className="grid sm:grid-cols-2">
        <div className="relative">
          <DishImage name={product.name} category={product.categoryName} imageUrl={product.imageUrl} className="aspect-[4/3] w-full sm:h-full sm:aspect-auto" emojiClassName="text-8xl" />
          {product.badge && <DishBadge label={product.badge} className="absolute left-4 top-4" />}
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">{product.categoryName}</p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight">{product.name}</h2>
          {product.portion && <p className="mt-2 text-sm font-semibold text-stone-500">{product.portion}</p>}
          {product.description && <p className="mt-4 leading-relaxed text-stone-600">{product.description}</p>}
          <p className="mt-6 font-display text-3xl font-bold">{money(product.price)}</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
            <QuantityStepper size="lg" value={quantity} onChange={(q) => setQuantity(Math.min(50, Math.max(1, q)))} />
            <button onClick={save} className="btn-primary flex-1 rounded-full py-4 text-base">
              {inCart > 0 ? 'Yangilash' : "Savatga qo'shish"} · {money(product.price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
