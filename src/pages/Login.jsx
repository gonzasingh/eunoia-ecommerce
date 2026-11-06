import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MESSAGES = {
  'auth/invalid-credential': 'El mail o la contraseña no son correctos.',
  'auth/wrong-password': 'El mail o la contraseña no son correctos.',
  'auth/user-not-found': 'El mail o la contraseña no son correctos.',
  'auth/invalid-email': 'El mail no es válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet.',
};

export default function Login() {
  const { user, isAdmin, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/socios" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(MESSAGES[err.code] || 'No se pudo ingresar. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="crm">
      <h1>Ingresar</h1>
      <p className="mu">Acceso solo para socios.</p>
      {user ? (
        <>
          <p className="er">Tu cuenta ({user.email}) no tiene acceso de socio.</p>
          <div><button className="b o" onClick={logout}>Salir</button></div>
        </>
      ) : (
        <form className="in" style={{ flexDirection: 'column', alignItems: 'stretch', maxWidth: 340 }} onSubmit={submit}>
          <input type="email" required placeholder="Mail" aria-label="Mail" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="er" role="alert">{error}</p>}
          <button className="b" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
      )}
    </div>
  );
}
