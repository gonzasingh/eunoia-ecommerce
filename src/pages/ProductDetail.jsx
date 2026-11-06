import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { CARD_FACTOR, CATEGORIES } from '../utils/constants';
import { money } from '../utils/format';
import { photoOf } from '../utils/image';

// Foto grande: si se subió desde el panel, se trae de productImages; si no, la foto estática.
function useBigPhoto(p) {
  const [full, setFull] = useState(null);
  const id = p && p.id;
  const hasFull = p && p.photoFull;
  useEffect(() => {
    setFull(null);
    if (!id || !hasFull || !db) return undefined;
    let off = false;
    getDoc(doc(db, 'productImages', id))
      .then((s) => {
        if (!off && s.exists()) setFull(s.data().data);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [id, hasFull]);
  return full || photoOf(p);
}

export default function ProductDetail() {
  const { id } = useParams();
  const { byId, loading } = useProducts();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const p = byId[id];
  const photo = useBigPhoto(p);

  if (!p && loading) return <p className="empty">Cargando…</p>;
  if (!p || !(p.stock > 0)) {
    return (
      <div className="empty">
        <h2>Esta joya no está disponible</h2>
        <p>Puede que se haya agotado. <Link to="/">Volver a la tienda</Link></p>
      </div>
    );
  }

  const cat = CATEGORIES[p.category] ? p.category : 'otros';

  return (
    <>
      <p className="bc">
        <Link to="/">Inicio</Link> › <Link to={`/category/${cat}`}>{CATEGORIES[cat]}</Link> › {p.name}
      </p>
      <div className="pd">
        <img src={photo} alt={p.name} />
        <div>
          <h1>{p.name}</h1>
          <p className="mute">{p.description}</p>
          <div className="pr">{money(p.price)}</div>
          <small className="mute">{money(p.price * CARD_FACTOR)} con tarjeta</small>
          {p.stock === 1 && <p className="last">Última unidad disponible</p>}
          <div className="qrow">
            <div className="qty">
              <button aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button aria-label="Más" onClick={() => setQty((q) => Math.min(p.stock, q + 1))}>+</button>
            </div>
            <button className="btn add" onClick={() => add(p, qty)}>Agregar al carrito</button>
          </div>
          <p className="mute sm">Precio por transferencia. Envíos a domicilio por Andreani a todo el país.</p>
          <p><Link to="/">← Seguir comprando</Link></p>
        </div>
      </div>
    </>
  );
}
