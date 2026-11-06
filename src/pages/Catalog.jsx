import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { CATEGORIES } from '../utils/constants';

const TILES = [
  ['anillos', '/img/cat-06.jpg'],
  ['aros', '/img/cat-27.jpg'],
  ['collares', '/img/cat-33.jpg'],
];
const STEPS = [
  ['Elegí tus piezas', 'Mirá el catálogo completo'],
  ['Cargá tu envío', 'Código postal y dirección'],
  ['Sumá al carrito', 'Te avisamos al instante'],
  ['Cerrá por WhatsApp', 'Con tu pedido ya armado'],
];

export default function Catalog() {
  const { categoryId } = useParams();
  const [params] = useSearchParams();
  const { products, loading, error } = useProducts();
  const q = (params.get('q') || '').trim().toLowerCase();
  const unknown = categoryId && !CATEGORIES[categoryId];

  // Solo se muestran joyas con stock: lo vendido desaparece de la tienda.
  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          p.stock > 0 &&
          (!categoryId || p.category === categoryId) &&
          (!q || `${p.name} ${p.description || ''} ${CATEGORIES[p.category] || ''}`.toLowerCase().includes(q))
      ),
    [products, categoryId, q]
  );

  const home = !categoryId && !q;

  return (
    <>
      {home && (
        <>
          <section className="hero">
            <div>
              <h1>Joyas en plata que acompañan todos los días</h1>
              <p>
                Anillos, aros, collares, pulseras y charms. Elegí tus piezas, sumalas al carrito y cerrá tu pedido por
                WhatsApp con tus datos de envío.
              </p>
              <a className="btn" href="#productos">Ver productos</a>
            </div>
            <div className="tiles">
              {TILES.map(([id, img]) => (
                <Link key={id} to={`/category/${id}`} className="tile">
                  <img src={img} alt="" />
                  <span>{CATEGORIES[id]}</span>
                </Link>
              ))}
            </div>
          </section>
          <section className="how">
            {STEPS.map(([t, s], i) => (
              <div key={t}>
                <img src={`/img/paso-${i + 1}.jpg`} alt="" />
                <strong>{t}</strong>
                <br />
                <small>{s}</small>
              </div>
            ))}
          </section>
        </>
      )}

      <h2 id="productos">{categoryId && CATEGORIES[categoryId] ? CATEGORIES[categoryId] : q ? `Resultados para “${params.get('q')}”` : 'Nuestros productos'}</h2>

      {error && <p className="empty">No pudimos cargar los productos. Revisá la conexión y recargá la página.</p>}
      {loading && !error && <p className="empty">Cargando productos…</p>}
      {unknown && <p className="empty">Esa categoría no existe. <Link to="/">Ver todos los productos</Link></p>}
      {!loading && !error && !unknown && list.length === 0 && (
        <p className="empty">No encontramos productos. Probá con otra palabra o elegí una categoría.</p>
      )}
      <div className="grid">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </>
  );
}
