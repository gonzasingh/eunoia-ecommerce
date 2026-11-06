import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Aviso "¡Agregado al carrito!" (o "No hay más unidades").
export default function Toast() {
  const { notice } = useCart();
  const last = useRef(null);
  if (notice) last.current = notice;
  const n = last.current;

  return (
    <div id="toast" className={`${notice ? 'on' : ''} ${n && !n.ok ? 'err' : ''}`} role="status" aria-live="polite">
      {n && (
        <>
          <img src={n.image} alt="" />
          <div>
            <strong>{n.title}</strong>
            <span>{n.name}</span>
            <small>{n.detail}</small>
            <Link className="btn" to="/cart">Ver carrito</Link>
          </div>
        </>
      )}
    </div>
  );
}
