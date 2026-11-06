import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useProducts } from './ProductsContext';
import { photoOf } from '../utils/image';
import { money } from '../utils/format';

const KEY = 'eunoia-cart';
const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => x && x.id && x.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { byId } = useProducts();
  const [items, setItems] = useState(load);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* sin almacenamiento: el carrito queda en memoria */
    }
  }, [items]);

  // El aviso "¡Agregado al carrito!" se cierra solo.
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  // Carrito con los datos actuales del catálogo (precio y stock reales).
  const lines = useMemo(
    () =>
      items
        .map((it) => {
          const p = byId[it.id];
          if (!p || !(p.stock > 0)) return null;
          return { id: p.id, name: p.name, price: p.price, image: photoOf(p), stock: p.stock, qty: Math.min(it.qty, p.stock) };
        })
        .filter(Boolean),
    [items, byId]
  );
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const add = useCallback(
    (p, qty = 1) => {
      const have = (items.find((i) => i.id === p.id) || { qty: 0 }).qty;
      if (have + qty > p.stock) {
        setNotice({
          ok: false,
          title: 'No hay más unidades',
          name: p.name,
          detail: `Quedan ${p.stock} disponibles y ya las tenés en el carrito.`,
          image: photoOf(p),
        });
        return { ok: false };
      }
      setItems((cur) =>
        cur.some((i) => i.id === p.id)
          ? cur.map((i) => (i.id === p.id ? { ...i, qty: i.qty + qty } : i))
          : [...cur, { id: p.id, qty }]
      );
      const n = count + qty;
      setNotice({
        ok: true,
        title: '¡Agregado al carrito!',
        name: p.name,
        detail: `Total (${n} ${n === 1 ? 'producto' : 'productos'}): ${money(subtotal + p.price * qty)}`,
        image: photoOf(p),
      });
      return { ok: true };
    },
    [items, count, subtotal]
  );

  const setQty = useCallback(
    (id, qty) => {
      const p = byId[id];
      const q = Math.max(1, Math.min(qty, p ? p.stock : qty));
      setItems((cur) => cur.map((i) => (i.id === id ? { ...i, qty: q } : i)));
    },
    [byId]
  );
  const remove = useCallback((id) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const dismiss = useCallback(() => setNotice(null), []);

  const value = { lines, count, subtotal, add, setQty, remove, clear, notice, dismiss };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
