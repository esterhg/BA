import { useState } from 'react'
import { Volver } from '../components/ui.jsx'
import { uuid } from '../../domain/format.js'

// Selección de edificio y nivel para iniciar una sesión de captura.
export function Sesion({ cat, onStart, onBack }) {
  const [edId, setEdId] = useState(cat.ubicaciones[0]?.id ?? '')
  const ed = cat.ubicaciones.find((e) => String(e.id) === String(edId))
  const [nvId, setNvId] = useState('')
  const nv = ed?.niveles.find((n) => String(n.id) === String(nvId || ed.niveles[0]?.id))

  if (!cat.ubicaciones.length)
    return <div className="card"><p className="mu">No hay ubicaciones cargadas. Conéctate a internet una vez para descargarlas.</p><Volver onClick={onBack} /></div>

  return (
    <div className="card">
      <h2>Seleccionar edificio y nivel</h2>
      <label>Edificio</label>
      <select value={edId} onChange={(e) => { setEdId(e.target.value); setNvId('') }}>{cat.ubicaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
      <label>Nivel</label>
      <select value={nv?.id ?? ''} onChange={(e) => setNvId(e.target.value)}>{ed?.niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}</select>
      <button className="p full" onClick={() => onStart({ id: uuid(), nivel_id: nv.id, edificio: ed.nombre, nivel: nv.nombre })}>Iniciar sesión de inventario</button>
      <Volver onClick={onBack} />
    </div>
  )
}
