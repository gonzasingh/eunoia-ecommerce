import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PAY_METHODS } from '../utils/constants';
import { formatDate, money0, weekKey, weekRange } from '../utils/format';
import { addPayment, assignMethod, cancelOrder, confirmOrder } from '../services/orders';
import { orderStatus, paidAmount } from './money';
import { Opts, Tag, useAction } from './ui';

function OrderRow({ o }) {
  const { user } = useAuth();
  const { busy, err, run } = useAction();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('transferencia');

  const paid = paidAmount(o);
  const debt = o.total - paid;
  const pending = o.status === 'pendiente';
  const cancelled = o.status === 'cancelado';
  const unassigned = (o.pays || []).some((p) => p.method === 'sin_asignar');
  const c = o.customer || {};

  const pay = async (e) => {
    e.preventDefault();
    const a = Math.min(Number(amount), debt);
    if (!(a > 0)) return;
    if (await run(() => addPayment(o.id, { amount: a, method, by: user.email }))) setAmount('');
  };

  return (
    <div className="r">
      <div className="f">
        <b>{(o.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ')}</b>
        <br />
        <small className="mu">
          {c.name || 'Sin nombre'} · #{o.number || o.id} · {formatDate(o.createdAt)}
          {o.source === 'web' ? ' · pedido web' : o.source === 'manual' ? ' · fuera de la web' : ''}
        </small>
        {o.source === 'web' && c.address && (
          <>
            <br />
            <small className="mu">Envío: {c.address}, {c.city}, {c.province} (CP {c.cp}) · pago: {PAY_METHODS[o.paymentMethod] || o.paymentMethod}</small>
          </>
        )}
        {pending && (
          <>
            <br />
            <small className="er">Pedido web sin confirmar: el stock todavía no se descontó.</small>
          </>
        )}
        {err && <><br /><small className="er" role="alert">{err}</small></>}
      </div>
      <div className="bar"><i style={{ width: `${o.total ? Math.min(100, (paid * 100) / o.total) : 0}%` }} /></div>
      <div>
        {money0(paid)} / {money0(o.total)}
        <br />
        <small className="mu">{cancelled ? 'Cancelado' : debt > 0 ? `Debe ${money0(debt)}` : 'Pagado'}</small>
        {unassigned && (
          <>
            <br />
            <select aria-label="Asignar medio de pago" value="" disabled={busy} onChange={(e) => e.target.value && run(() => assignMethod([o], e.target.value))}>
              <Opts o={PAY_METHODS} blank="Medio sin asignar…" />
            </select>
          </>
        )}
      </div>
      {cancelled ? <Tag c="ago">Cancelado</Tag> : <Tag c={orderStatus(o)} />}
      {pending && (
        <div className="in">
          <button className="b" disabled={busy} onClick={() => run(() => confirmOrder(o.id))}>Confirmar y descontar stock</button>
          <button className="b o" disabled={busy} onClick={() => run(() => cancelOrder(o.id))}>Cancelar</button>
        </div>
      )}
      {!cancelled && debt > 0 && (
        <form className="in" onSubmit={pay}>
          <input type="number" min="1" max={debt} required placeholder="Monto" aria-label="Monto" style={{ width: 90 }} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select aria-label="Medio de pago" value={method} onChange={(e) => setMethod(e.target.value)}>
            <Opts o={PAY_METHODS} />
          </select>
          <button className="b o" disabled={busy}>Cobrar</button>
        </form>
      )}
    </div>
  );
}

export default function Ventas({ orders, products }) {
  const live = orders.filter((o) => o.status !== 'cancelado');
  const n = (k) => live.filter((o) => orderStatus(o) === k).length;
  const debt = live.reduce((s, o) => s + o.total - paidAmount(o), 0);
  const units = products.reduce((s, p) => s + (p.stock || 0), 0);
  const weeks = [...new Set(orders.map((o) => weekKey(new Date(o.createdAt))))].sort((a, b) => b - a);

  return (
    <>
      <h1>Ventas</h1>
      <div className="g">
        {[['az', 'Disponible', `${units} unid.`], ['v', 'Vendido', n('v')], ['pa', 'Venta parcial', n('pa')], ['d', 'En deuda', n('d')]].map(([c, t, x]) => (
          <div className="c" key={c}>
            <div className="mu"><i className={`dot ${c}`} /> {t}</div>
            <div className="n">{x}</div>
          </div>
        ))}
        <div className="c">
          <div className="mu">Pendiente de cobro</div>
          <div className="n">{money0(debt)}</div>
        </div>
      </div>
      {orders.length === 0 && <p className="mu">Todavía no hay ventas registradas.</p>}
      {weeks.map((w) => {
        const list = orders.filter((o) => weekKey(new Date(o.createdAt)) === w);
        return (
          <div className="c" key={w}>
            <h2>{weekRange(new Date(list[0].createdAt))}</h2>
            {list.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </div>
        );
      })}
    </>
  );
}
