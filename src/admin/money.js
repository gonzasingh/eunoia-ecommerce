import { CARD_FACTOR } from '../utils/constants';

// Lógica de cobros y caja. Los montos de los cobros van en "valor de joya"; la tarjeta suma 15% al cobrar.
export const paidAmount = (o) => (o.pays || []).reduce((s, p) => s + (p.amount || 0), 0);

// v = vendido (pagado completo), pa = venta parcial, d = en deuda
export function orderStatus(o) {
  const p = paidAmount(o);
  return p >= o.total ? 'v' : p > 0 ? 'pa' : 'd';
}

export const cashIn = (p) => (p.method === 'tarjeta' ? p.amount * CARD_FACTOR : p.amount);

const bucket = (method) => (method === 'efectivo' ? 'cash' : 'bank');
const round2 = (n) => Math.round(n * 100) / 100;

// Cuánto debería haber en efectivo y en cuenta, según cobros y movimientos.
export function computeCash({ orders, movements, start }) {
  const x = { cash: Number(start.cash) || 0, bank: Number(start.bank) || 0 };
  const byCat = {};
  let unassigned = 0;
  const live = orders.filter((o) => o.status !== 'cancelado');
  live.forEach((o) =>
    (o.pays || []).forEach((p) => {
      if (p.method === 'sin_asignar') unassigned += p.amount;
      else x[bucket(p.method)] += cashIn(p);
    })
  );
  movements.forEach((m) => {
    x[bucket(m.method)] += m.type === 'ingreso' ? m.amount : -m.amount;
    if (m.type === 'egreso') byCat[m.category] = (byCat[m.category] || 0) + m.amount;
  });
  const debt = live.reduce((s, o) => s + o.total - paidAmount(o), 0);
  return { x: { cash: round2(x.cash), bank: round2(x.bank) }, byCat, unassigned, debt };
}
