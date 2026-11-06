import { arrayUnion, collection, doc, runTransaction, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// Pedido web: lo crea el cliente al finalizar la compra (queda "pendiente", sin descontar stock).
export async function createWebOrder(order) {
  const ref = doc(collection(db, 'orders'));
  await setDoc(ref, { ...order, createdAt: Date.now() });
  return ref.id;
}

// El socio confirma el pedido web: descuenta el stock en una transacción.
export async function confirmOrder(orderId) {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error('El pedido no existe.');
    const order = orderSnap.data();
    if (order.status !== 'pendiente') throw new Error('Este pedido ya fue procesado.');
    const refs = order.items.map((i) => doc(db, 'products', i.productId));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    snaps.forEach((s, idx) => {
      const item = order.items[idx];
      if (!s.exists() || s.data().stock < item.qty) throw new Error(`Sin stock suficiente de ${item.name}.`);
    });
    snaps.forEach((s, idx) => tx.update(refs[idx], { stock: s.data().stock - order.items[idx].qty }));
    tx.update(orderRef, { status: 'confirmado', confirmedAt: Date.now() });
  });
}

export const cancelOrder = (orderId) => updateDoc(doc(db, 'orders', orderId), { status: 'cancelado', cancelledAt: Date.now() });

// Venta fuera de la web: descuenta stock y deja la venta registrada.
export async function createManualSale({ customer, product, qty, method, paid, by }) {
  const orderRef = doc(collection(db, 'orders'));
  await runTransaction(db, async (tx) => {
    const productRef = doc(db, 'products', product.id);
    const snap = await tx.get(productRef);
    if (!snap.exists() || snap.data().stock < qty) throw new Error(`Sin stock suficiente de ${product.name}.`);
    tx.update(productRef, { stock: snap.data().stock - qty });
    const total = product.price * qty;
    const amount = Math.min(paid, total);
    tx.set(orderRef, {
      number: 'M' + Date.now().toString(36).toUpperCase().slice(-5),
      source: 'manual',
      status: 'confirmado',
      customer: { name: customer || 'Venta externa' },
      items: [{ productId: product.id, name: product.name, qty, price: product.price }],
      paymentMethod: method,
      subtotal: total,
      shipping: 0,
      total,
      pays: amount > 0 ? [{ amount, method, by, at: Date.now() }] : [],
      createdAt: Date.now(),
    });
  });
}

// Registra un cobro (parcial o total). El monto va en valor de joya; la tarjeta suma 15% en la caja.
export const addPayment = (orderId, payment) =>
  updateDoc(doc(db, 'orders', orderId), { pays: arrayUnion({ ...payment, at: Date.now() }) });

// Asigna un medio de pago a los cobros "sin asignar" (de uno o de todos los pedidos).
export async function assignMethod(orders, method) {
  const batch = writeBatch(db);
  orders.forEach((o) => {
    if (!(o.pays || []).some((p) => p.method === 'sin_asignar')) return;
    const pays = o.pays.map((p) => (p.method === 'sin_asignar' ? { ...p, method } : p));
    batch.update(doc(db, 'orders', o.id), { pays });
  });
  await batch.commit();
}
