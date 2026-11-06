import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, PAY_METHODS } from '../utils/constants';
import { money0, weekRange } from '../utils/format';
import { addLot, deleteLot, renameLot } from '../services/admin';
import { adjustStock, createProduct, saveCost } from '../services/products';
import { createManualSale } from '../services/orders';
import { Opts, Tag, useAction } from './ui';
import ProductEditor from './ProductEditor';

const stop = (e) => e.stopPropagation();

function LotsCard({ products, lots }) {
  const { busy, err, run } = useAction();
  const [name, setName] = useState('');
  return (
    <div className="c">
      <h2>Lotes</h2>
      <p className="mu">Cada joya pertenece a un lote. Podés cambiarle el nombre o crear uno nuevo. Un lote solo se puede eliminar si no tiene joyas.</p>
      {lots.map((l) => {
        const n = products.filter((p) => p.lot === l.id).length;
        return (
          <div className="in" style={{ marginTop: 8 }} key={l.id}>
            <input
              key={l.name}
              defaultValue={l.name}
              aria-label="Nombre del lote"
              style={{ flex: 1, minWidth: 200 }}
              onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== l.name && run(() => renameLot(l.id, e.target.value))}
            />
            <span className="mu">{n} {n === 1 ? 'joya' : 'joyas'}</span>
            <button className="b o" disabled={busy || n > 0 || lots.length < 2} title={n ? 'Para eliminarlo tiene que estar vacío' : undefined} onClick={() => run(() => deleteLot(l.id))}>
              Eliminar
            </button>
          </div>
        );
      })}
      <form
        className="in"
        style={{ marginTop: 12 }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (name.trim() && (await run(() => addLot(name)))) setName('');
        }}
      >
        <input required placeholder="Nombre del nuevo lote" aria-label="Nombre del nuevo lote" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="b" disabled={busy}>Agregar lote</button>
      </form>
      {err && <p className="er" role="alert">{err}</p>}
    </div>
  );
}

function ExternalSale({ products }) {
  const { user } = useAuth();
  const { busy, err, run } = useAction();
  const [f, setF] = useState({ id: '', q: '1', c: '', m: 'efectivo', a: '' });
  const [ok, setOk] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const available = products.filter((p) => p.stock > 0);

  async function submit(e) {
    e.preventDefault();
    const product = products.find((p) => p.id === f.id);
    const qty = Math.max(1, Math.floor(Number(f.q) || 1));
    if (!product) return;
    const total = product.price * qty;
    const paid = f.a === '' ? total : Math.min(Number(f.a), total);
    setOk('');
    if (await run(() => createManualSale({ customer: f.c.trim(), product, qty, method: f.m, paid, by: user.email }))) {
      setOk(`Venta registrada: ${qty}× ${product.name}.`);
      setF({ id: '', q: '1', c: '', m: 'efectivo', a: '' });
    }
  }

  return (
    <div className="c">
      <h2>Venta fuera de la web</h2>
      <p className="mu">Descuenta el stock online y queda registrada en Ventas.</p>
      <form className="in" onSubmit={submit}>
        <select required aria-label="Joya vendida" value={f.id} onChange={set('id')}>
          <option value="">Joya vendida…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>
          ))}
        </select>
        <input type="number" min="1" required aria-label="Cantidad" style={{ width: 80 }} value={f.q} onChange={set('q')} />
        <input placeholder="Cliente" aria-label="Cliente" value={f.c} onChange={set('c')} />
        <select aria-label="Medio de pago" value={f.m} onChange={set('m')}>
          <Opts o={PAY_METHODS} />
        </select>
        <input type="number" min="0" placeholder="Pagó (vacío = todo)" aria-label="Monto pagado" value={f.a} onChange={set('a')} />
        <button className="b" disabled={busy}>Registrar venta</button>
      </form>
      {ok && <p className="mu">{ok}</p>}
      {err && <p className="er" role="alert">{err}</p>}
    </div>
  );
}

function AddProduct({ lots }) {
  const { busy, err, run } = useAction();
  const [key, setKey] = useState(0); // cambia para limpiar el formulario (incluida la foto)

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await run(() =>
      createProduct({
        name: fd.get('name'),
        price: fd.get('price'),
        cost: fd.get('cost'),
        stock: fd.get('stock'),
        category: fd.get('category'),
        lot: fd.get('lot'),
        photoFile: fd.get('photo'),
      })
    );
    if (ok) setKey((k) => k + 1);
  }

  return (
    <div className="c">
      <h2>Agregar al stock</h2>
      <form className="in" key={key} onSubmit={submit}>
        <input name="name" required placeholder="Joya" aria-label="Joya" />
        <input name="price" type="number" min="1" required placeholder="Precio venta" aria-label="Precio de venta" />
        <input name="cost" type="number" min="0" required placeholder="Costo" aria-label="Costo" />
        <input name="stock" type="number" min="0" required placeholder="Cantidad" aria-label="Cantidad" />
        <select name="category" aria-label="Categoría"><Opts o={CATEGORIES} /></select>
        <select name="lot" aria-label="Lote">
          {lots.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <label className="fl">Foto <input name="photo" type="file" accept="image/*" aria-label="Foto del producto" /></label>
        <button className="b" disabled={busy}>{busy ? 'Guardando…' : 'Agregar'}</button>
      </form>
      {err && <p className="er" role="alert">{err}</p>}
    </div>
  );
}

export default function Stock({ products, lots }) {
  const { busy, err, run } = useAction();
  const [fl, setFl] = useState({ lot: '', cat: '', state: '', min: '', max: '' });
  const [editing, setEditing] = useState(null);
  const setF = (k) => (e) => setFl((s) => ({ ...s, [k]: e.target.value }));

  const lotName = (id) => (lots.find((l) => l.id === id) || { name: '—' }).name;
  const valueOf = (id) => products.filter((p) => p.lot === id).reduce((s, p) => s + p.cost * p.stock, 0);
  const list = products.filter(
    (p) =>
      (!fl.lot || p.lot === fl.lot) &&
      (!fl.cat || (CATEGORIES[p.category] ? p.category : 'otros') === fl.cat) &&
      (!fl.state || (fl.state === 'az') === p.stock > 0) &&
      (fl.min === '' || p.price >= Number(fl.min)) &&
      (fl.max === '' || p.price <= Number(fl.max))
  );
  const editingProduct = editing && products.find((p) => p.id === editing);

  return (
    <>
      <h1>Stock</h1>
      <div className="g">
        {lots.map((l) => (
          <div className="c" key={l.id}>
            <div className="mu">{l.name}, valor a costo</div>
            <div className="n">{money0(valueOf(l.id))}</div>
          </div>
        ))}
      </div>
      <LotsCard products={products} lots={lots} />
      <ExternalSale products={products} />
      <AddProduct lots={lots} />

      <div className="c in">
        <select aria-label="Filtrar por lote" value={fl.lot} onChange={setF('lot')}>
          <option value="">Todos los lotes</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select aria-label="Filtrar por categoría" value={fl.cat} onChange={setF('cat')}>
          <Opts o={CATEGORIES} blank="Todas las categorías" />
        </select>
        <select aria-label="Filtrar por estado" value={fl.state} onChange={setF('state')}>
          <Opts o={{ az: 'Disponible', ago: 'Agotado' }} blank="Todos los estados" />
        </select>
        <input type="number" min="0" placeholder="Precio mín." aria-label="Precio mínimo" style={{ width: 130 }} value={fl.min} onChange={setF('min')} />
        <input type="number" min="0" placeholder="Precio máx." aria-label="Precio máximo" style={{ width: 130 }} value={fl.max} onChange={setF('max')} />
        <span className="mu">{list.length} de {products.length} joyas</span>
      </div>

      <div className="c" style={{ overflowX: 'auto' }}>
        {err && <p className="er" role="alert">{err}</p>}
        <table>
          <thead>
            <tr><th>Joya</th><th>Categoría</th><th>Lote</th><th>Ingreso</th><th>Costo</th><th>Precio</th><th>Estado</th><th>Stock</th></tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} data-a="open" onClick={() => setEditing(p.id)}>
                <td><button className="lnk" onClick={(e) => { stop(e); setEditing(p.id); }}>{p.name}</button></td>
                <td>{CATEGORIES[p.category] || CATEGORIES.otros}</td>
                <td>{lotName(p.lot)}</td>
                <td>{weekRange(new Date(p.createdAt || Date.now()))}</td>
                <td onClick={stop}>
                  <input
                    key={p.cost}
                    type="number"
                    min="0"
                    defaultValue={p.cost}
                    aria-label={`Costo de ${p.name}`}
                    style={{ width: 100 }}
                    onBlur={(e) => Number(e.target.value) !== p.cost && run(() => saveCost(p.id, e.target.value))}
                  />
                </td>
                <td>{money0(p.price)}</td>
                <td><Tag c={p.stock > 0 ? 'az' : 'ago'}>{p.stock > 0 ? 'Disponible' : 'Agotado'}</Tag></td>
                <td onClick={stop}>
                  <div className="in">
                    <button className="b o" style={{ minHeight: 34, padding: '0 10px' }} aria-label="Restar uno" disabled={busy || p.stock < 1} onClick={() => run(() => adjustStock(p.id, -1))}>−</button>
                    <span>{p.stock}</span>
                    <button className="b o" style={{ minHeight: 34, padding: '0 10px' }} aria-label="Sumar uno" disabled={busy} onClick={() => run(() => adjustStock(p.id, 1))}>+</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && <ProductEditor product={editingProduct} lots={lots} onClose={() => setEditing(null)} />}
    </>
  );
}
