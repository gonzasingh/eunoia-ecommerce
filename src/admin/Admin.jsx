import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Panel from './Panel';

// Puerta del panel: solo entran Kiara y Matías.
export default function Admin() {
  const { user, loading, isAdmin, logout } = useAuth();

  if (loading) return <div id="crm"><p className="mu">Cargando…</p></div>;

  if (!user) {
    return (
      <div id="crm">
        <h1>Zona de socios</h1>
        <p>Esta parte es solo para Kiara y Matías. <Link to="/ingresar">Ingresar</Link></p>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div id="crm">
        <h1>Zona de socios</h1>
        <p>Tu usuario ({user.email}) no tiene acceso de socio.</p>
        <div><button className="b o" onClick={logout}>Salir</button></div>
      </div>
    );
  }
  return <Panel />;
}
