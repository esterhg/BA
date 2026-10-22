import { useEffect, useState } from 'react'
import { api } from '../../infrastructure/api/client.js'

// Conflictos de sincronización (solo administradores).
// Filtros: modelo, nivel (dependiente del edificio elegido) y rango de fechas.
export function Conflictos({ cat }) {
  const [modeloId, setModeloId] = useState('')
  const [edificioId, setEdificioId] = useState('')
  const [nivelId, setNivelId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [load, setLoad] = useState(false)
  const [err, setErr] = useState('')

  const modelos = cat?.modelos || []
  const ubicaciones = cat?.ubicaciones || []
  const niveles = ubicaciones.find((e) => String(e.id) === edificioId)?.niveles || []

  const cargar = async (reset) => {
    setLoad(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (modeloId) params.set('modelo_id', modeloId)
      if (nivelId) params.set('nivel_id', nivelId)
      if (desde) params.set('fecha_desde', desde)
      if (hasta) params.set('fecha_hasta', hasta)
      if (!reset && next) params.set('cursor', next)
      const r = await api(`/admin/conflictos?${params.toString()}`)
      setItems((p) => (reset ? r.items : [...p, ...r.items])); setNext(r.next)
    } catch (x) {
      setErr(x.status === 403 ? 'No tienes permiso para ver esto.' : 'No se pudo cargar. Requiere conexión.')
    } finally { setLoad(false) }
  }

  // Recarga al cambiar cualquier filtro.
  useEffect(() => { cargar(true) }, [modeloId, nivelId, desde, hasta])

  const limpiar = () => { setModeloId(''); setEdificioId(''); setNivelId(''); setDesde(''); setHasta('') }

  return (
    <div className="card">
      <label style={{ marginTop: 0 }}>Modelo</label>
      <select value={modeloId} onChange={(e) => setModeloId(e.target.value)}>
        <option value="">Todos los modelos</option>
        {modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </select>

      <label>Edificio</label>
      <select value={edificioId} onChange={(e) => { setEdificioId(e.target.value); setNivelId('') }}>
        <option value="">Todos los edificios</option>
        {ubicaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>

      <label>Nivel</label>
      <select value={nivelId} onChange={(e) => setNivelId(e.target.value)} disabled={!edificioId}>
        <option value="">{edificioId ? 'Todos los niveles' : 'Elige un edificio primero'}</option>
        {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
      </select>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label>Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <button className="full" onClick={limpiar}>Limpiar filtros</button>

      {err && <div className="msg wa">{err}</div>}

      <h2 style={{ marginTop: 16 }}>Conflictos ({items.length}{next ? '+' : ''})</h2>
      {items.map((c) => (
        <div className="it" key={c.id}>
          <div>
            <b>{c.codigo || '(sin código)'}</b>
            <div className="mu sm">Serie: {c.serie || '—'} · {c.modelo || 'Modelo ?'}</div>
            <div className="mu sm">
              {c.edificio ? `${c.edificio} · Nivel ${c.nivel}` : 'Ubicación ?'} · {new Date(c.fecha).toLocaleString('es')}
            </div>
            {c.usuario && <div className="mu sm">Enviado por: {c.usuario}</div>}
          </div>
          <span className="bd er">Conflicto</span>
        </div>
      ))}
      {!items.length && !load && <p className="mu sm">No hay conflictos con estos filtros.</p>}
      {next && <button className="full" disabled={load} onClick={() => cargar(false)}>{load ? 'Cargando...' : 'Cargar más'}</button>}
    </div>
  )
}
