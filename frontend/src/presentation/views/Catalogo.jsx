import { useState } from 'react'
import { norm } from '../../domain/format.js'
import { FormModelo } from '../components/FormModelo.jsx'

// Catálogo de modelos: consulta para todos; crear/editar para administradores.
export function Catalogo({ modelos, esAdmin, onCambio }) {
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)   // null | {} (nuevo) | { ...modelo } (editar)
  const [msg, setMsg] = useState(null)
  const lista = modelos.filter((m) => norm(m.nombre + ' ' + (m.tipo || '')).includes(norm(q)))

  if (form) return <FormModelo inicial={form} onCancel={() => setForm(null)}
    onSaved={(modelo, esNuevo) => { onCambio(modelo, esNuevo); setForm(null); setMsg(['ok', esNuevo ? '✓ Modelo creado.' : '✓ Modelo actualizado.']) }} />

  return <>
    <div className="card">
      {esAdmin && <button className="p full" style={{ marginTop: 0, marginBottom: 14 }} onClick={() => { setMsg(null); setForm({}) }}>+ Nuevo modelo</button>}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar modelo o tipo" />
      {msg && <div className={'msg ' + msg[0]}>{msg[1]}</div>}
    </div>
    <div className="cg">{lista.map((m) => (
      <div className="mc" key={m.id}>
        <div className="mi">{m.imagen_url ? <img src={m.imagen_url} alt={m.nombre} loading="lazy" /> : <span>{m.tipo}</span>}</div>
        <div className="mb"><b>{m.nombre}</b><small>{m.tipo}</small>
          {esAdmin && <button className="pill" style={{ marginTop: 8 }} onClick={() => { setMsg(null); setForm(m) }}>Editar</button>}
        </div>
      </div>))}</div>
    {!lista.length && <p className="mu sm">Sin resultados.</p>}
  </>
}
