export const money = (n) =>
  '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money0 = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('es-AR');

export const signed0 = (n) => (n < 0 ? '−' : '') + money0(Math.abs(n));

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// Lunes de la semana de una fecha.
export function weekStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// "02/11/2026 a 08/11/2026"
export function weekRange(date = new Date()) {
  const a = weekStart(date);
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
  return `${fmt(a)} a ${fmt(b)}`;
}

// Número ordenable (aaaammdd del lunes) para agrupar y ordenar semanas.
export function weekKey(date = new Date()) {
  const a = weekStart(date);
  return a.getFullYear() * 10000 + (a.getMonth() + 1) * 100 + a.getDate();
}

export const formatDate = (ts) => new Date(ts).toLocaleDateString('es-AR');
export const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
