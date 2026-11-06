import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty">
      <h2>No encontramos esa página</h2>
      <p><Link to="/">Volver a la tienda</Link></p>
    </div>
  );
}
