import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CARD_FACTOR } from '../utils/constants';
import { money } from '../utils/format';
import { photoOf } from '../utils/image';

export default function ProductCard({ p }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const buy = () => {
    if (add(p, 1).ok) {
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1600);
    }
  };

  return (
    <article className="card">
      <Link to={`/item/${p.id}`}>
        <img src={photoOf(p)} alt={p.name} loading="lazy" />
      </Link>
      <div className="cb">
        <h3><Link to={`/item/${p.id}`}>{p.name}</Link></h3>
        <p>{p.description}</p>
        <div className="pr">{money(p.price)}</div>
        <small className="mute">{money(p.price * CARD_FACTOR)} con tarjeta</small>
        {p.stock === 1 && <small className="last">Última unidad</small>}
        <div className="acts">
          <button className={`btn add${done ? ' ok' : ''}`} onClick={buy}>{done ? '✓ Agregado' : 'Comprar'}</button>
          <Link className="btn o" to={`/item/${p.id}`}>Ver</Link>
        </div>
      </div>
    </article>
  );
}
