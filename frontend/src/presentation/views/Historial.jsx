import { useEffect, useState } from 'react'
import { api } from '../../infrastructure/api/client.js'

// Historial de movimientos (bitácora de auditoría) con filtro por acción.
export function Historial() {
  const [accion, setAccion] = useState('')      // '' | crear | editar | eliminar
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [load, setLoad] = useState(false)
  const [err, setErr] = useState('')

  const cargar = async (reset) => {
    setLoad(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (accion) params.set('accion', accion)
      if (!reset && next) params.set('cursor', next)
      const r = await api(`/movimientos?${params.toString()}`)
      setItems((p) => (reset ? r.items : [...p, ...r.items])); setNext(r.next)
    } catch (x) { setErr(x.status === 403 ? 'No tienes permiso para ver esto.' : 'No se pudo cargar. Requiere conexión.') }
    finally { setLoad(false) }
  }
  useEffect(() => { cargar(true) }, [accion])

  const ETIQ = { crear: ['ok', 'Creó'], editar: ['wa', 'Editó'], eliminar: ['er', 'Eliminó'] }
  const cambios = (m) => {
    if (m.accion !== 'editar' || !m.antes || !m.despues) return null
    const campos = { codigo: 'Código', serie: 'Serie', modelo_id: 'Modelo', nivel_id: 'Nivel' }
    const difs = Object.keys(campos).filter((k) => m.antes[k] !== m.despues[k])
      .map((k) => `${campos[k]}: ${m.antes[k]} → ${m.despues[k]}`)
    return difs.length ? difs.join(' · ') : 'Sin cambios de valor'
  }

  return (
    <div className="card">
      <label style={{ marginTop: 0 }}>Filtrar por acción</label>
      <select value={accion} onChange={(e) => setAccion(e.target.value)}>
        <option value="">Todas las acciones</option>
        <option value="crear">Creaciones</option>
        <option value="editar">Ediciones</option>
        <option value="eliminar">Eliminaciones</option>
      </select>
      {err && <div className="msg wa">{err}</div>}
      {items.map((m) => {
        const [cls, verbo] = ETIQ[m.accion] || ['', m.accion]
        return (
          <div className="it" key={m.id}>
            <div>
              <b>{m.codigo || '(sin código)'}</b>
              <div className="mu sm">{m.usuario || 'Usuario eliminado'} · {new Date(m.fecha).toLocaleString('es')}</div>
              {cambios(m) && <div className="mu sm">{cambios(m)}</div>}
            </div>
            <span className={'bd ' + cls}>{verbo}</span>
          </div>)
      })}
      {!items.length && !load && <p className="mu sm">No hay movimientos registrados.</p>}
      {next && <button className="full" disabled={load} onClick={() => cargar(false)}>{load ? 'Cargando...' : 'Cargar más'}</button>}
    </div>
  )
}
