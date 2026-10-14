import { useState } from 'react'
import { api } from '../../infrastructure/api/client.js'

// Formulario de crear/editar un modelo del catálogo (solo administradores).
export function FormModelo({ inicial, onCancel, onSaved }) {
  const esNuevo = !inicial.id
  const [nombre, setNombre] = useState(inicial.nombre || '')
  const [tipo, setTipo] = useState(inicial.tipo || '')
  const [imagenUrl, setImagenUrl] = useState(inicial.imagen_url || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function guardar() {
    setErr('')
    if (!nombre.trim()) return setErr('El nombre es obligatorio.')
    if (imagenUrl.trim() && !/^https?:\/\//i.test(imagenUrl.trim())) return setErr('La imagen debe ser una URL http:// o https://')
    setBusy(true)
    const cuerpo = { nombre: nombre.trim(), tipo: tipo.trim(), imagen_url: imagenUrl.trim() }
    try {
      const r = esNuevo
        ? await api('/modelos', cuerpo)
        : await api(`/modelos/${inicial.id}`, cuerpo, 'PATCH')
      onSaved(r.modelo, esNuevo)
    } catch (x) { setErr(x.mensaje || 'No se pudo guardar.') } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h2>{esNuevo ? 'Nuevo modelo' : 'Editar modelo'}</h2>
      <label>Nombre</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Ej.: Dell Latitude 5420" />
      <label>Tipo</label>
      <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ej.: Laptop, Switch, Impresora" />
      <label>Imagen (URL, opcional)</label>
      <input value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://..." />
      {imagenUrl.trim() && <div className="mi" style={{ marginTop: 10, borderRadius: 10, aspectRatio: '16/7' }}><img src={imagenUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>}
      <button className="p full" disabled={busy} onClick={guardar}>{busy ? 'Guardando...' : (esNuevo ? 'Crear modelo' : 'Guardar cambios')}</button>
      {err && <div className="msg er">{err}</div>}
      <button className="full" onClick={onCancel}>Cancelar</button>
    </div>
  )
}
