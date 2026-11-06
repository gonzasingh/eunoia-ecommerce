import { useMemo } from 'react';
import { useCollection, useDocument } from '../hooks/useCollection';
import { useProducts } from '../context/ProductsContext';

// Todo lo que necesita el panel, en tiempo real.
export function useAdminData() {
  const { products } = useProducts();
  const costs = useCollection('costs');
  const lots = useCollection('lots');
  const orders = useCollection('orders');
  const movements = useCollection('movements');
  const cash = useDocument('settings', 'cash');

  return useMemo(() => {
    const costOf = Object.fromEntries(costs.data.map((c) => [c.id, c.cost || 0]));
    return {
      products: products.map((p) => ({ ...p, cost: costOf[p.id] || 0 })),
      lots: [...lots.data].sort((a, b) => (a.order || 0) - (b.order || 0)),
      orders: [...orders.data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      movements: [...movements.data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      cash: {
        start: { cash: 0, bank: 0, ...(cash.data && cash.data.start) },
        real: { cash: 0, bank: 0, ...(cash.data && cash.data.real) },
      },
      loading: costs.loading || lots.loading || orders.loading || movements.loading || cash.loading,
      error: costs.error || lots.error || orders.error || movements.error || cash.error,
    };
  }, [products, costs, lots, orders, movements, cash]);
}
