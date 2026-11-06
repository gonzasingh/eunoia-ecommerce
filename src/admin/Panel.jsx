import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from './useAdminData';
import { Tag } from './ui';
import Ventas from './Ventas';
import Stock from './Stock';
import Caja from './Caja';

const TABS = [['ventas', 'Ventas'], ['stock', 'Stock'], ['caja', 'Caja']];

export default function Panel() {
  const { user, logout } = useAuth();
  const data = useAdminData();
  const [tab, setTab] = useState('ventas');

  return (
    <div id="crm">
      <div className="lg2">
        {['az', 'v', 'pa', 'd'].map((c) => (
          <Tag key={c} c={c} />
        ))}
      </div>
      <div className="tabs">
        <Link className="b o" to="/">Tienda</Link>
        {TABS.map(([k, label]) => (
          <button key={k} className={`b${tab === k ? '' : ' o'}`} onClick={() => setTab(k)}>{label}</button>
        ))}
        <button className="b o" style={{ marginLeft: 'auto' }} onClick={logout}>Salir ({user.email})</button>
      </div>

      {data.error && (
        <p className="er" role="alert">
          {data.error.code === 'permission-denied'
            ? 'Firestore no te dejó leer los datos del panel. Revisá que los UID de Kiara y Matías estén en firestore.rules y que las reglas estén publicadas.'
            : 'No se pudieron cargar los datos del panel. Recargá la página.'}
        </p>
      )}
      {data.loading && !data.error && <p className="mu">Cargando datos…</p>}

      {tab === 'ventas' && <Ventas orders={data.orders} products={data.products} />}
      {tab === 'stock' && <Stock products={data.products} lots={data.lots} />}
      {tab === 'caja' && <Caja orders={data.orders} movements={data.movements} cash={data.cash} />}
    </div>
  );
}
