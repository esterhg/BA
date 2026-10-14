import { useState } from 'react'
import { api } from '../../infrastructure/api/client.js'
import { csvEscape } from '../../domain/format.js'

// Exportación de activos a CSV con filtros por edificio, nivel y serie-prefijo.
export function Exportar({ cat }) {
  const [estado, setEstado] = useState('listo')  // listo | cargando | ok | error | vacio
  const [n, setN] = useState(0)
  const [edId, setEdId] = useState('')
  const [nivelId, setNivelId] = useState('')
  const [serie, setSerie] = useState('')

  const ed = cat.ubicaciones.find((e) => String(e.id) === String(edId))
  const niveles = ed?.niveles ?? []

  // Construye los parámetros de filtro comunes para la consulta.
  const paramsBase = () => {
    const p = new URLSearchParams()
    if (edId) p.set('edificio_id', edId)
    if (nivelId) p.set('nivel_id', nivelId)
    if (serie.trim()) p.set('serie', serie.trim())
    return p
  }

  const hayFiltros = edId || nivelId || serie.trim()
  const limpiar = () => { setEdId(''); setNivelId(''); setSerie(''); setEstado('listo') }

  async function exportar() {
    setEstado('cargando'); setN(0)
    try {
      const filas = []
      let cursor = null
      do {
        const p = paramsBase()
        if (cursor) p.set('cursor', cursor)
        const r = await api(`/activos?${p.toString()}`)
        filas.push(...r.items); cursor = r.next
      } while (cursor)

      if (!filas.length) { setEstado('vacio'); return }

      const cols = ['codigo', 'serie', 'modelo', 'edificio', 'nivel', 'usuario', 'fecha']
      const encabezado = ['Código', 'Serie', 'Modelo', 'Edificio', 'Nivel', 'Capturó', 'Fecha']
      const lineas = [encabezado.join(',')]
      for (const a of filas) {
        lineas.push(cols.map((c) => csvEscape(c === 'fecha' && a.fecha ? new Date(a.fecha).toLocaleString('es') : a[c])).join(','))
      }
      const blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `activos-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link); link.click(); link.remove()
      URL.revokeObjectURL(url)
      setN(filas.length); setEstado('ok')
    } catch { setEstado('error') }
  }

  return (
    <div className="card">
      <p className="mu sm">Descarga los activos en un archivo CSV, listo para abrir en Excel. Usa los filtros para exportar solo una parte.</p>

      <label>Edificio</label>
      <select value={edId} onChange={(e) => { setEdId(e.target.value); setNivelId(''); setEstado('listo') }}>
        <option value="">Todos los edificios</option>
        {cat.ubicaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>

      <label>Nivel</label>
      <select value={nivelId} onChange={(e) => { setNivelId(e.target.value); setEstado('listo') }} disabled={!edId}>
        <option value="">{edId ? 'Todos los niveles' : 'Elige un edificio primero'}</option>
        {niveles.map((nv) => <option key={nv.id} value={nv.id}>{nv.nombre}</option>)}
      </select>

      <label>Serie que empieza con</label>
      <input value={serie} onChange={(e) => { setSerie(e.target.value); setEstado('listo') }} placeholder="Ej.: SN-, ABC..." />

      {hayFiltros && <button className="full" onClick={limpiar}>Limpiar filtros</button>}

      <button className="p full" disabled={estado === 'cargando'} onClick={exportar}>
        {estado === 'cargando' ? 'Preparando archivo...' : (hayFiltros ? 'Descargar CSV (filtrado)' : 'Descargar CSV (todos)')}
      </button>
      {estado === 'ok' && <div className="msg ok">✓ Se exportaron {n} activos.</div>}
      {estado === 'vacio' && <div className="msg wa">No hay activos que cumplan esos filtros.</div>}
      {estado === 'error' && <div className="msg er">No se pudo exportar. Esta función requiere conexión.</div>}
    </div>
  )
}
