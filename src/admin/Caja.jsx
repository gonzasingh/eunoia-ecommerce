import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MOVE_CATS, PAY_METHODS } from '../utils/constants';
import { formatDate, formatTime, money0, signed0 } from '../utils/format';
import { addMovement, saveCash } from '../services/admin';
import { assignMethod } from '../services/orders';
import { computeCash } from './money';
import { Opts, Tag, useAction } from './ui';

const ROWS = [['cash', 'Efectivo'], ['bank', 'Cuenta (transferencias y tarjeta)']];
const MOVE_METHODS = { efectivo: 'Efectivo', cuenta: 'Cuenta' };

export default function Caja({ orders, movements, cash }) {
  const { user } = useAuth();
  const { busy, err, run } = useAction();
  const { x, byCat, unassigned, debt } = computeCash({ orders, movements, start: cash.start });
  const [f, setF] = useState({ type: 'egreso', amount: '', method: 'efectivo', category: 'reinversion', note: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!(amount > 0)) return;
    const category = f.type === 'ingreso' ? 'otro' : f.category;
    if (await run(() => addMovement({ type: f.type, amount, method: f.method, category, note: f.note.trim(), by: user.email }))) {
      setF((s) => ({ ...s, amount: '', note: '' }));
    }
  }

  return (
    <>
      <h1>Caja</h1>
      <div className="c" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th /><th>Debería tener</th><th>Tiene (real)</th><th>Diferencia</th></tr>
          </thead>
          <tbody>
            {ROWS.map(([k, label]) => {
              const diff = Math.round((Number(cash.real[k]) - x[k]) * 100) / 100;
              return (
                <tr key={k}>
                  <td>{label}</td>
                  <td><span className="n">{signed0(x[k])}</span></td>
                  <td>
                    <input
                      key={cash.real[k]}
                      type="number"
                      defaultValue={cash.real[k]}
                      aria-label={`Saldo real de ${label}`}
                      onBlur={(e) => Number(e.target.value) !== Number(cash.real[k]) && run(() => saveCash({ real: { [k]: Number(e.target.value) || 0 } }))}
                    />
                  </td>
                  <td>
                    <Tag c={diff === 0 ? 'v' : 'd'}>{diff === 0 ? 'Cuadra' : diff < 0 ? 'Faltan' : 'Sobran'}</Tag>{' '}
                    <b>{money0(Math.abs(diff))}</b>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mu" style={{ marginTop: 10 }}>
          Incluye el saldo inicial (efectivo{' '}
          <input
            key={`s1${cash.start.cash}`}
            type="number"
            defaultValue={cash.start.cash}
            aria-label="Saldo inicial en efectivo"
            style={{ width: 110, minHeight: 32 }}
            onBlur={(e) => run(() => saveCash({ start: { cash: Number(e.target.value) || 0 } }))}
          />
          , cuenta{' '}
          <input
            key={`s2${cash.start.bank}`}
            type="number"
            defaultValue={cash.start.bank}
            aria-label="Saldo inicial en cuenta"
            style={{ width: 110, minHeight: 32 }}
            onBlur={(e) => run(() => saveCash({ start: { bank: Number(e.target.value) || 0 } }))}
          />
          ). Pendiente de cobro por ventas: {money0(debt)}.
        </p>
        {unassigned > 0 && (
          <p className="er" style={{ marginTop: 8 }}>
            Hay {money0(unassigned)} cobrados sin medio de pago asignado (efectivo o transferencia), por eso todavía no suman a la caja.
            Asignalos todos juntos:{' '}
            <select aria-label="Asignar medio a todos los cobros" value="" disabled={busy} onChange={(e) => e.target.value && run(() => assignMethod(orders, e.target.value))}>
              <Opts o={PAY_METHODS} blank="Asignar a todos…" />
            </select>{' '}
            o uno por uno en Ventas.
          </p>
        )}
      </div>

      <h2>Egresos por destino</h2>
      <div className="g">
        {Object.entries(MOVE_CATS).filter(([k]) => k !== 'otro').map(([k, label]) => (
          <div className="c" key={k}>
            <div className="mu">{label}</div>
            <div className="n">{money0(byCat[k] || 0)}</div>
          </div>
        ))}
      </div>

      <div className="c">
        <h2>Registrar movimiento</h2>
        <form className="in" onSubmit={submit}>
          <select aria-label="Tipo" value={f.type} onChange={set('type')}>
            <Opts o={{ egreso: 'Egreso', ingreso: 'Ingreso' }} />
          </select>
          <input type="number" min="1" required placeholder="Monto" aria-label="Monto" value={f.amount} onChange={set('amount')} />
          <select aria-label="Medio" value={f.method} onChange={set('method')}>
            <Opts o={MOVE_METHODS} />
          </select>
          {f.type === 'egreso' && (
            <select aria-label="Destino" value={f.category} onChange={set('category')}>
              <Opts o={Object.fromEntries(Object.entries(MOVE_CATS).filter(([k]) => k !== 'otro'))} />
            </select>
          )}
          <input placeholder="Detalle" aria-label="Detalle" value={f.note} onChange={set('note')} />
          <button className="b" disabled={busy}>Registrar</button>
        </form>
        {err && <p className="er" role="alert">{err}</p>}
      </div>

      <div className="c" style={{ overflowX: 'auto' }}>
        {movements.length === 0 ? (
          <p className="mu">Todavía no hay movimientos.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Fecha y hora</th><th>Destino</th><th>Detalle</th><th>Medio</th><th>Registró</th><th style={{ textAlign: 'right' }}>Monto</th></tr>
            </thead>
            <tbody>
              {movements.slice(0, 30).map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.createdAt)} · {formatTime(m.createdAt)} hs</td>
                  <td>{MOVE_CATS[m.category] || m.category}</td>
                  <td>{m.note}</td>
                  <td>{MOVE_METHODS[m.method] || m.method}</td>
                  <td><small className="mu">{m.by || '—'}</small></td>
                  <td style={{ textAlign: 'right' }}>{m.type === 'ingreso' ? '+' : '−'}{money0(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
