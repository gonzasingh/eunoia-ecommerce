import { useEffect, useState } from 'react';
import { CATEGORIES } from '../utils/constants';
import { deleteProduct, removePhoto, replacePhoto, updateProduct } from '../services/products';
import { photoOf } from '../utils/image';
import { Opts, useAction } from './ui';

// Ventana para editar la publicación: datos, foto (reemplazar o quitar) y eliminar.
export default function ProductEditor({ product, lots, onClose }) {
  const { busy, err, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  const [f, setF] = useState({
    name: product.name,
    description: product.description || '',
    category: CATEGORIES[product.category] ? product.category : 'otros',
    lot: product.lot,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const hasPhoto = Boolean(product.thumb || product.image);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save(e) {
    e.preventDefault();
    const ok = await run(() =>
      updateProduct(
        product.id,
        {
          name: f.name.trim() || product.name,
          description: f.description.trim(),
          category: f.category,
          lot: f.lot,
          price: Number(f.price),
          stock: Math.max(0, Math.floor(Number(f.stock) || 0)),
        },
        f.cost
      )
    );
    if (ok) onClose();
  }

  return (
    <>
      <div className="md" onClick={onClose} />
      <div className="mb" role="dialog" aria-modal="true" aria-label="Editar publicación">
        <div className="in" style={{ justifyContent: 'space-between' }}>
          <h2>Editar publicación</h2>
          <button className="b o" onClick={onClose}>Cerrar</button>
        </div>

        <div className="in" style={{ alignItems: 'flex-start' }}>
          <img src={photoOf(product)} alt="" style={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 12 }} />
          <div className="in" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <label className="fl">
              {hasPhoto ? 'Reemplazar foto' : 'Subir foto'}
              <input
                type="file"
                accept="image/*"
                aria-label="Foto del producto"
                disabled={busy}
                onChange={(e) => e.target.files[0] && run(() => replacePhoto(product.id, e.target.files[0]))}
              />
            </label>
            {hasPhoto && (
              <button className="b o" disabled={busy} onClick={() => run(() => removePhoto(product.id))}>Quitar foto</button>
            )}
          </div>
        </div>

        <form onSubmit={save}>
          <div className="eg">
            <label>Nombre<input required value={f.name} onChange={set('name')} /></label>
            <label>Descripción<input value={f.description} onChange={set('description')} /></label>
            <label>Categoría<select value={f.category} onChange={set('category')}><Opts o={CATEGORIES} /></select></label>
            <label>
              Lote
              <select value={f.lot} onChange={set('lot')}>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
            <label>Precio de venta<input type="number" min="1" required value={f.price} onChange={set('price')} /></label>
            <label>Costo<input type="number" min="0" required value={f.cost} onChange={set('cost')} /></label>
            <label>Cantidad en stock<input type="number" min="0" required value={f.stock} onChange={set('stock')} /></label>
          </div>
          <p style={{ marginTop: 8 }}><button className="b" disabled={busy}>Guardar cambios</button></p>
        </form>

        <div>
          <button
            className="b o"
            style={{ borderColor: 'var(--d)', color: 'var(--d)' }}
            disabled={busy}
            onClick={() => (confirm ? run(() => deleteProduct(product.id)).then((ok) => ok && onClose()) : setConfirm(true))}
          >
            {confirm ? 'Sí, eliminar definitivamente' : 'Eliminar publicación'}
          </button>
          {confirm && <p className="er">Se borra de la tienda y del stock. No se puede deshacer.</p>}
        </div>
        {err && <p className="er" role="alert">{err}</p>}
      </div>
    </>
  );
}
