const env = import.meta.env;

// Categorías de la tienda (el id es el que se usa en la ruta /category/:categoryId).
export const CATEGORIES = {
  anillos: 'Anillos',
  aros: 'Aros y abridores',
  argollas: 'Argollas',
  collares: 'Collares y dijes',
  pulseras: 'Pulseras',
  charms: 'Línea Pandora',
  otros: 'Otros',
};
export const CATEGORY_ORDER = Object.keys(CATEGORIES);

export const CARD_FACTOR = 1.15; // recargo de tarjeta sobre el valor de las joyas
export const DELIVERY = '4 días hábiles';

export const WHATSAPP = env.VITE_WHATSAPP || '5493834906648';
export const INSTAGRAM = env.VITE_INSTAGRAM || 'eunoia__cta';
export const ADMIN_EMAILS = (env.VITE_ADMIN_EMAILS || 'kiara@eunoia.com,matias@eunoia.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Medios de pago que ve el cliente en el carrito.
export const CHECKOUT_METHODS = {
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta de crédito (+15%)',
};
// Medios que usan los socios al registrar cobros.
export const PAY_METHODS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta +15%',
};
export const MOVE_CATS = {
  reinversion: 'Reinversión',
  pareja: 'Gastos de pareja',
  retiro_kiara: 'Retiro Kiara',
  retiro_matias: 'Retiro Matías',
  otro: 'Otro ingreso',
};
