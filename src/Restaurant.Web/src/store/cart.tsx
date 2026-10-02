import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../api/types';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  quantityOf: (productId: number) => number;
  add: (product: Product) => void;
  setQuantity: (productId: number, quantity: number) => void;
  /** Puts the product in the cart with exactly this quantity, adding the line if needed. */
  setOrAdd: (product: Product, quantity: number) => void;
  /**
   * Refreshes saved lines with the current menu: prices and photos update, and dishes that were
   * removed or put on the stop-list drop out, so an old cart can't fail at checkout.
   */
  syncWithMenu: (available: Product[]) => void;
  clear: () => void;
}

const CART_KEY = 'restaurant.cart';
const MAX_QUANTITY = 50;
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      // Storage unavailable: the cart still works for this visit.
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const setQuantity = (productId: number, quantity: number) =>
      setLines((current) =>
        quantity <= 0
          ? current.filter((l) => l.product.id !== productId)
          : current.map((l) =>
              l.product.id === productId ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) } : l,
            ),
      );

    return {
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      total: lines.reduce((sum, l) => sum + l.quantity * l.product.price, 0),
      quantityOf: (productId) => lines.find((l) => l.product.id === productId)?.quantity ?? 0,
      add: (product) =>
        setLines((current) =>
          current.some((l) => l.product.id === product.id)
            ? current.map((l) =>
                l.product.id === product.id ? { ...l, quantity: Math.min(l.quantity + 1, MAX_QUANTITY) } : l,
              )
            : [...current, { product, quantity: 1 }],
        ),
      setQuantity,
      setOrAdd: (product, quantity) =>
        setLines((current) => {
          const clamped = Math.min(Math.max(quantity, 0), MAX_QUANTITY);
          const rest = current.filter((l) => l.product.id !== product.id);
          if (clamped === 0) return rest;
          return current.some((l) => l.product.id === product.id)
            ? current.map((l) => (l.product.id === product.id ? { product, quantity: clamped } : l))
            : [...current, { product, quantity: clamped }];
        }),
      syncWithMenu: (available) =>
        setLines((current) => {
          const byId = new Map(available.map((p) => [p.id, p]));
          const next = current.filter((l) => byId.has(l.product.id)).map((l) => ({ ...l, product: byId.get(l.product.id)! }));
          const unchanged = next.length === current.length && next.every((l, i) => JSON.stringify(l.product) === JSON.stringify(current[i]!.product));
          return unchanged ? current : next;
        }),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

const ORDERS_KEY = 'restaurant.myOrders';

/** Orders placed from this browser, so the customer can reopen tracking without retyping the phone. */
export function rememberOrder(id: number, phone: string) {
  try {
    const list = recentOrders().filter((o) => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify([{ id, phone }, ...list].slice(0, 10)));
  } catch {
    // Ignore: tracking still works by entering the phone number.
  }
}

export function recentOrders(): { id: number; phone: string }[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]') as { id: number; phone: string }[];
  } catch {
    return [];
  }
}
