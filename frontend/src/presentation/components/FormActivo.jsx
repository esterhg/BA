import { useState } from 'react'
import { api } from '../../infrastructure/api/client.js'
import { EscanerCodigo } from './EscanerCodigo.jsx'

// Formulario de crear/editar un activo directamente contra el servidor.
export function FormActivo({ cat, inicial, onCancel, onSaved }) {
  const esNuevo = !inicial.id
  const [codigo, setCodigo] = useState(inicial.codigo || '')
  const [serie, setSerie] = useState(inicial.serie || '')
  const [escaneando, setEscaneando] = useState(false)
  const [modeloId, setModeloId] = useState(inicial.modelo_id ?? '')
  // Deducir el edificio del nivel inicial para precargar el selector.
  const edInicial = cat.ubicaciones.find((e) => e.niveles.some((n) => n.id === inicial.nivel_id))
  const [edId, setEdId] = useState(edInicial?.id ?? cat.ubicaciones[0]?.id ?? '')
  const [nivelId, setNivelId] = useState(inicial.nivel_id ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const ed = cat.ubicaciones.find((e) => String(e.id) === String(edId))
  const niveles = ed?.niveles ?? []

  async function guardar() {
    setErr('')
    if (!codigo.trim() || !serie.trim()) return setErr('Escribe el código y la serie.')
    if (!modeloId) return setErr('Selecciona un modelo.')
    if (!nivelId) return setErr('Selecciona un edificio y nivel.')
    setBusy(true)
    const cuerpo = { codigo: codigo.trim(), serie: serie.trim(), modelo_id: Number(modeloId), nivel_id: Number(nivelId) }
    try {
      const r = esNuevo
        ? await api('/activos', cuerpo)
        : await api(`/activos/${inicial.id}`, cuerpo, 'PATCH')
      onSaved(r.activo, esNuevo)
    } catch (x) { setErr(x.mensaje || 'No se pudo guardar.') } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h2>{esNuevo ? 'Nuevo activo' : 'Editar activo'}</h2>
      <label>Código</label>
      <div className="row-scan">
        <input value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus />
        <button type="button" className="btn-scan" onClick={() => setEscaneando(true)}>📷 Escanear</button>
      </div>
      <label>Serie</label>
      <input value={serie} onChange={(e) => setSerie(e.target.value)} />
      <label>Modelo</label>
      <select value={modeloId} onChange={(e) => setModeloId(e.target.value)}>
        <option value="">Selecciona un modelo</option>
        {cat.modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}{m.tipo ? ` (${m.tipo})` : ''}</option>)}
      </select>
      <label>Edificio</label>
      <select value={edId} onChange={(e) => { setEdId(e.target.value); setNivelId('') }}>
        {cat.ubicaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
      <label>Nivel</label>
      <select value={nivelId} onChange={(e) => setNivelId(e.target.value)}>
        <option value="">Selecciona un nivel</option>
        {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
      </select>
      <button className="p full" disabled={busy} onClick={guardar}>{busy ? 'Guardando...' : (esNuevo ? 'Crear activo' : 'Guardar cambios')}</button>
      {err && <div className="msg er">{err}</div>}
      <button className="full" onClick={onCancel}>Cancelar</button>

      {escaneando && <EscanerCodigo
        onDetectado={(texto) => { setCodigo(texto); setEscaneando(false) }}
        onCerrar={() => setEscaneando(false)} />}
    </div>
  )
}
