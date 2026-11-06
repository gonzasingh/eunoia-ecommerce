import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createWebOrder } from '../services/orders';
import { CARD_FACTOR, CHECKOUT_METHODS, DELIVERY, WHATSAPP } from '../utils/constants';
import { buildMessage, missingFields, newOrderNumber } from '../utils/checkout';
import { money } from '../utils/format';
import { PROVINCES, shippingCost } from '../utils/shipping';

const EMPTY = { nm: '', cp: '', pv: '', lo: '', di: '', pm: '' };

export default function Cart() {
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const has = lines.length > 0;
  const complete = has && missingFields(form).length === 0;
  const factor = form.pm === 'tarjeta' ? CARD_FACTOR : 1;
  const shipping = form.pv ? shippingCost(form.pv) : null;
  const subtotalShown = subtotal * factor;
  const total = subtotalShown + (shipping || 0);

  // Guarda el pedido en Firestore y abre WhatsApp con el mensaje armado.
  async function finalize() {
    if (!complete || busy) return;
    setBusy(true);
    setError('');
    const win = window.open('', '_blank'); // se abre ya, dentro del clic, para que no lo bloquee el navegador
    try {
      const number = newOrderNumber();
      await createWebOrder({
        number,
        source: 'web',
        status: 'pendiente',
        customer: {
          name: form.nm.trim(),
          cp: form.cp.trim().toUpperCase(),
          province: form.pv,
          city: form.lo.trim(),
          address: form.di.trim(),
        },
        items: lines.map((l) => ({ productId: l.id, name: l.name, qty: l.qty, price: l.price })),
        paymentMethod: form.pm,
        subtotal,
        shipping,
        total: subtotal + shipping,
        customerTotal: total,
        pays: [],
      });
      const text = buildMessage({ number, lines, form, subtotalShown, shipping, total });
      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
      if (win) win.location.href = url;
      else window.location.href = url;
      clear();
      setForm(EMPTY);
      setDone(number);
    } catch (e) {
      if (win) win.close();
      setError('No pudimos guardar tu pedido. Probá de nuevo en un momento.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="ct">Tu carrito</h1>
      <div className="cg">
        <div>
          {done && (
            <div className="done">
              <strong>¡Pedido enviado! #{done}</strong>
              <p className="sm">
                Se abrió WhatsApp con tu pedido y tus datos de envío. Ahí confirmamos el pago y el envío.{' '}
                <Link to="/">Seguir comprando</Link>
              </p>
            </div>
          )}
          {!has && !done && (
            <p className="empty">Tu carrito está vacío. <Link to="/">Seguir comprando</Link></p>
          )}
          {lines.map((l) => (
            <article className="ci" key={l.id}>
              <img src={l.image} alt={l.name} />
              <div className="cm">
                <strong>{l.name}</strong>
                <div className="qty">
                  <button aria-label="Quitar uno" onClick={() => setQty(l.id, l.qty - 1)} disabled={l.qty <= 1}>−</button>
                  <span>{l.qty}</span>
                  <button aria-label="Sumar uno" onClick={() => setQty(l.id, l.qty + 1)} disabled={l.qty >= l.stock}>+</button>
                  <small>× {money(l.price)}</small>
                </div>
              </div>
              <div className="cr">
                <strong>{money(l.price * l.qty)}</strong>
                <button className="lnk" onClick={() => remove(l.id)}>Eliminar</button>
              </div>
            </article>
          ))}
          {has && <button className="lnk" onClick={clear}>Vaciar carrito</button>}
        </div>

        {has && (
          <aside className="cs" aria-label="Resumen del pedido">
            <h2>Resumen</h2>
            <form id="ship" onSubmit={(e) => e.preventDefault()}>
              <h3>Datos de envío</h3>
              <input value={form.nm} onChange={set('nm')} placeholder="Nombre y apellido" aria-label="Nombre y apellido" autoComplete="name" />
              <div className="row2">
                <input value={form.cp} onChange={set('cp')} placeholder="Código postal" aria-label="Código postal" autoComplete="postal-code" />
                <select value={form.pv} onChange={set('pv')} aria-label="Provincia">
                  <option value="">Provincia</option>
                  {PROVINCES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <input value={form.lo} onChange={set('lo')} placeholder="Localidad" aria-label="Localidad" />
              <input value={form.di} onChange={set('di')} placeholder="Calle, número, piso o depto." aria-label="Dirección" autoComplete="street-address" />
              <h3>Método de pago</h3>
              <select value={form.pm} onChange={set('pm')} aria-label="Método de pago">
                <option value="">Seleccioná una opción</option>
                {Object.entries(CHECKOUT_METHODS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </form>
            <div className="ln"><span>Subtotal</span><span>{form.pm ? money(subtotalShown) : '–'}</span></div>
            <div className="ln"><span>Envío a domicilio (Andreani)*</span><span>{shipping != null ? money(shipping) : '–'}</span></div>
            {complete && (
              <div className="tot"><span>Total</span><span>{money(total)}</span></div>
            )}
            <p className="mute sm">* Entrega estimada: {DELIVERY}.</p>
            {!complete && (
              <p className="hint" role="status">Completá los datos de envío y seleccioná un método de pago para finalizar</p>
            )}
            {error && <p className="hint" role="alert" style={{ color: '#b4443f' }}>{error}</p>}
            <button className="btn wa" disabled={!complete || busy} onClick={finalize}>
              {busy ? 'Guardando pedido…' : 'Finalizar compra'}
            </button>
            <Link className="btn o wa" to="/">Seguir comprando</Link>
          </aside>
        )}
      </div>
    </>
  );
}
