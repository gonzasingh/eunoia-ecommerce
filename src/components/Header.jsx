import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../utils/constants';

export default function Header() {
  const { count } = useCart();
  const loc = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [bump, setBump] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  const inCategory = loc.pathname.startsWith('/category/');
  const active = inCategory ? loc.pathname.split('/')[2] : loc.pathname === '/' ? '' : null;

  const onSearch = (e) => {
    const v = e.target.value;
    const pathname = inCategory ? loc.pathname : '/';
    navigate({ pathname, search: v ? `?q=${encodeURIComponent(v)}` : '' }, { replace: pathname === loc.pathname });
  };

  const chips = [['', 'Todo'], ...Object.entries(CATEGORIES).filter(([k]) => k !== 'otros')];

  return (
    <header>
      <div className="hd">
        <Link className="logo" to="/" aria-label="eunoia 925, ir al inicio">
          <img src="/img/logo-wordmark.png" alt="eunoia 925" />
        </Link>
        <input
          className="srch"
          type="search"
          placeholder="Buscar anillos, aros, collares…"
          aria-label="Buscar productos"
          value={params.get('q') || ''}
          onChange={onSearch}
        />
        <Link className="sl" to="/socios">Socios</Link>
        <Link className={`cartb${bump ? ' bump' : ''}`} to="/cart" aria-label="Ver carrito">
          Mi carrito <b>{count}</b>
        </Link>
      </div>
      <nav className="chips" aria-label="Categorías">
        {chips.map(([k, label]) => (
          <button
            key={k || 'todo'}
            className="chip"
            aria-pressed={active === k}
            onClick={() => navigate(k ? `/category/${k}` : '/')}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
