import { useState } from 'react';

export const LB = { az: 'Disponible', v: 'Vendido', pa: 'Venta parcial', d: 'En deuda', ago: 'Agotado' };

export const Tag = ({ c, children }) => (
  <span className="tag"><i className={`dot ${c}`} /> {children || LB[c]}</span>
);

// <option> a partir de un objeto { valor: etiqueta }.
export const Opts = ({ o, blank }) => (
  <>
    {blank !== undefined && <option value="">{blank}</option>}
    {Object.entries(o).map(([k, v]) => (
      <option key={k} value={k}>{v}</option>
    ))}
  </>
);

// Ejecuta una acción async mostrando el error si falla.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function run(fn) {
    setBusy(true);
    setErr('');
    try {
      await fn();
      return true;
    } catch (e) {
      setErr(e.code === 'permission-denied' ? 'Firestore no te dio permiso. Revisá firestore.rules.' : e.message || 'No se pudo completar la acción.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, err, run };
}
