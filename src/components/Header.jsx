import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../utils/constants';

const NAV_CATEGORIES = Object.entries(CATEGORIES).filter(([k]) => k !== 'otros');

const linkClass = ({ isActive }) => (isActive ? 'navbar__enlace navbar__enlace--activo' : 'navbar__enlace');

export default function Header() {
  const { count } = useCart();
  const loc = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [bump, setBump] = useState(false);
  // En pantallas chicas las categorías y el buscador viven en un menú desplegable (hamburguesa).
  const [menuOpen, setMenuOpen] = useState(false);
  // true cuando la barra quedó pegada arriba: pasa de transparente a "vidrio" flotante.
  const [stuck, setStuck] = useState(false);
  const first = useRef(true);
  const headerRef = useRef(null);
  const toggleRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  // Cualquier cambio de ruta (también el botón "atrás") cierra el menú.
  useEffect(() => {
    setMenuOpen(false);
  }, [loc.pathname]);

  // La barra de anuncio scrollea con la página: el vidrio aparece recién cuando la píldora llega al tope.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const onScroll = () => {
      const top = parseFloat(getComputedStyle(el).top) || 0;
      setStuck(el.getBoundingClientRect().top <= top + 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Con el menú abierto: Escape o un toque fuera de la barra lo cierran.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (e) => {
      if (!e.target.closest('.navbar')) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  const inCategory = loc.pathname.startsWith('/category/');

  const onSearch = (e) => {
    const v = e.target.value;
    const pathname = inCategory ? loc.pathname : '/';
    navigate({ pathname, search: v ? `?q=${encodeURIComponent(v)}` : '' }, { replace: pathname === loc.pathname });
  };

  // Al confirmar la búsqueda en el celular se cierra el menú para dejar ver los resultados.
  const onSearchKey = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      closeMenu();
    }
  };

  const barClass = ['navbar', stuck || menuOpen ? 'navbar--vidrio' : '', menuOpen ? 'navbar--menu' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <header ref={headerRef} className={barClass}>
      <div className="navbar__contenido">
        <Link className="navbar__marca" to="/" aria-label="eunoia 925, ir al inicio" onClick={closeMenu}>
          <img className="navbar__logo" src="/img/logo-wordmark.png" alt="eunoia 925" />
        </Link>

        <div id="menu-categorias" className={menuOpen ? 'navbar__menu navbar__menu--abierto' : 'navbar__menu'}>
          <nav aria-label="Categorías">
            <ul className="navbar__lista">
              {/* "Todo" solo aparece en el menú del celular: en escritorio el logo lleva al inicio */}
              <li className="navbar__item-inicio">
                <NavLink className={linkClass} to="/" end onClick={closeMenu}>
                  Todo
                </NavLink>
              </li>
              {NAV_CATEGORIES.map(([k, label]) => (
                <li key={k}>
                  <NavLink className={linkClass} to={`/category/${k}`} onClick={closeMenu}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <label className="navbar__buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Buscar joyas…"
              aria-label="Buscar productos"
              value={params.get('q') || ''}
              onChange={onSearch}
              onKeyDown={onSearchKey}
            />
          </label>
        </div>

        <Link className="navbar__boton" to="/socios" aria-label="Socios" title="Socios">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </Link>

        <Link
          className={`navbar__boton${bump ? ' bump' : ''}`}
          to="/cart"
          aria-label={`Ver carrito: ${count} ${count === 1 ? 'unidad' : 'unidades'}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H6" />
          </svg>
          {/* Con el carrito vacío no se muestra el número */}
          {count > 0 && <span className="navbar__contador">{count}</span>}
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className="navbar__hamburguesa"
          aria-expanded={menuOpen}
          aria-controls="menu-categorias"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="navbar__barras" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
