import { CHECKOUT_METHODS, DELIVERY } from './constants';
import { money } from './format';

export const REQUIRED = {
  nm: 'nombre y apellido',
  cp: 'código postal',
  pv: 'provincia',
  lo: 'localidad',
  di: 'dirección',
  pm: 'método de pago',
};

const CP_RE = /^[A-Za-z]?\d{4}([A-Za-z]{3})?$/;

// Devuelve las claves de los campos que faltan o son inválidos.
export function missingFields(form) {
  return Object.keys(REQUIRED).filter((k) => {
    const v = (form[k] || '').trim();
    if (!v) return true;
    if (k === 'cp') return !CP_RE.test(v);
    if (k === 'di') return v.length < 5;
    if (k === 'nm') return v.length < 2;
    return false;
  });
}

export function newOrderNumber() {
  return 'W' + Date.now().toString(36).toUpperCase().slice(-5);
}

// Mensaje automático que se envía por WhatsApp a eunoia.
export function buildMessage({ number, lines, form, subtotalShown, shipping, total }) {
  const items = lines.map((l) => `• ${l.qty} x ${l.name} — ${money(l.price * l.qty)}`).join('\n');
  return [
    `Hola eunoia! Quiero finalizar mi compra (pedido #${number}):`,
    items,
    '',
    `Subtotal: ${money(subtotalShown)}`,
    `Medio de pago: ${CHECKOUT_METHODS[form.pm]}`,
    `Envío a domicilio (Andreani): ${money(shipping)}`,
    `Total: ${money(total)}`,
    '',
    'Datos de envío:',
    `Nombre: ${form.nm.trim()}`,
    `Dirección: ${form.di.trim()}, ${form.lo.trim()}, ${form.pv}`,
    `Código postal: ${form.cp.trim().toUpperCase()}`,
    `Entrega estimada: ${DELIVERY}`,
  ].join('\n');
}
