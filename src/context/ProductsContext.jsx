import { createContext, useContext, useMemo } from 'react';
import { useCollection } from '../hooks/useCollection';
import { CATEGORY_ORDER } from '../utils/constants';

const Ctx = createContext({ products: [], byId: {}, loading: true, error: null });
export const useProducts = () => useContext(Ctx);

const rank = (c) => {
  const i = CATEGORY_ORDER.indexOf(c);
  return i < 0 ? CATEGORY_ORDER.length : i;
};

export function ProductsProvider({ children }) {
  const { data, loading, error } = useCollection('products');
  const value = useMemo(() => {
    const products = [...data].sort(
      (a, b) => rank(a.category) - rank(b.category) || (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(b.name)
    );
    return { products, byId: Object.fromEntries(products.map((p) => [p.id, p])), loading, error };
  }, [data, loading, error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
