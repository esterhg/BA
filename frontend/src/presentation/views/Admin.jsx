import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { api } from '../../infrastructure/api/client.js'
import { hoyISO, primerDiaMesISO } from '../../domain/format.js'

// Resumen de administración filtrable por periodo, edificio y usuario.
export function Admin({ cat }) {
  const [periodo, setPeriodo] = useState('todo')   // todo | dia | mes | rango
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [edId, setEdId] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [, setLoad] = useState(false)
  const [exp, setExp] = useState('listo')   // listo | cargando | ok | vacio | error
  const [expN, setExpN] = useState(0)

  // Cargar la lista de usuarios una vez para el filtro.
  useEffect(() => { api('/admin/usuarios').then(setUsuarios).catch(() => {}) }, [])

  // Traducir el periodo rápido a un rango de fechas concreto.
  const rango = () => {
    if (periodo === 'dia') return { d: hoyISO(), h: hoyISO() }
    if (periodo === 'mes') return { d: primerDiaMesISO(), h: hoyISO() }
    if (periodo === 'rango') return { d: desde || null, h: hasta || null }
    return { d: null, h: null }
  }

  // Parámetros de filtro comunes al resumen y a la exportación.
  const paramsFiltro = () => {
    const { d, h } = rango()
    const params = new URLSearchParams()
    if (d) params.set('desde', d)
    if (h) params.set('hasta', h)
    if (edId) params.set('edificio_id', edId)
    if (usuarioId) params.set('usuario_id', usuarioId)
    if (modeloId) params.set('modelo_id', modeloId)
    return params
  }

  useEffect(() => {
    setLoad(true); setErr('')
    api(`/admin/resumen?${paramsFiltro().toString()}`)
      .then((r) => { setData(r); setLoad(false) })
      .catch((x) => { setErr(x.status === 403 ? 'No tienes permiso para ver esto.' : 'No se pudo cargar el resumen. Requiere conexión.'); setLoad(false) })
  }, [periodo, desde, hasta, edId, usuarioId, modeloId])

  // Exporta el detalle de activos filtrados a Excel (.xlsx), respetando los filtros.
  async function exportarExcel() {
    setExp('cargando'); setExpN(0); setErr('')
    try {
      const filas = []
      let cursor = null
      do {
        const p = paramsFiltro()
        if (cursor) p.set('cursor', cursor)
        const r = await api(`/activos?${p.toString()}`)
        filas.push(...r.items); cursor = r.next
      } while (cursor)

      if (!filas.length) { setExp('vacio'); return }

      const datos = filas.map((a) => ({
        'Código': a.codigo, 'Serie': a.serie, 'Modelo': a.modelo,
        'Edificio': a.edificio, 'Nivel': a.nivel, 'Capturó': a.usuario || '',
        'Fecha': a.fecha ? new Date(a.fecha).toLocaleString('es') : '',
      }))
      const ws = XLSX.utils.json_to_sheet(datos)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Activos')
      XLSX.writeFile(wb, `activos-${new Date().toISOString().slice(0, 10)}.xlsx`)
      setExpN(filas.length); setExp('ok')
    } catch (x) {
      setExp(x.status === 403 ? 'error' : 'error')
    }
  }

  const limpiar = () => { setPeriodo('todo'); setDesde(''); setHasta(''); setEdId(''); setUsuarioId(''); setModeloId(''); setExp('listo') }
  const hayFiltros = periodo !== 'todo' || edId || usuarioId || modeloId
  const Metric = ({ n, t }) => <div className="mc" style={{ textAlign: 'center' }}><div className="mb"><b style={{ fontSize: 24 }}>{n}</b><small>{t}</small></div></div>

  return <>
    <div className="card">
      <h2>Filtros del informe</h2>
      <label style={{ marginTop: 0 }}>Periodo</label>
      <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
        <option value="todo">Todo el histórico</option>
        <option value="dia">Hoy</option>
        <option value="mes">Este mes</option>
        <option value="rango">Rango personalizado</option>
      </select>
      {periodo === 'rango' && <>
        <label>Desde</label>
        <input type="date" value={desde} max={hasta || hoyISO()} onChange={(e) => setDesde(e.target.value)} />
        <label>Hasta</label>
        <input type="date" value={hasta} min={desde || undefined} max={hoyISO()} onChange={(e) => setHasta(e.target.value)} />
      </>}
      <label>Edificio</label>
      <select value={edId} onChange={(e) => setEdId(e.target.value)}>
        <option value="">Todos los edificios</option>
        {cat.ubicaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
      <label>Usuario</label>
      <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
        <option value="">Todos los usuarios</option>
        {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
      </select>
      <label>Modelo</label>
      <select value={modeloId} onChange={(e) => setModeloId(e.target.value)}>
        <option value="">Todos los modelos</option>
        {cat.modelos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
      </select>
      {hayFiltros && <button className="full" onClick={limpiar}>Limpiar filtros</button>}
      <button className="p full" disabled={exp === 'cargando'} onClick={exportarExcel}>
        {exp === 'cargando' ? 'Preparando Excel...' : (hayFiltros ? 'Exportar a Excel (filtrado)' : 'Exportar a Excel (todos)')}
      </button>
      {exp === 'ok' && <div className="msg ok">✓ Se exportaron {expN} activos.</div>}
      {exp === 'vacio' && <div className="msg wa">No hay activos que cumplan esos filtros.</div>}
      {exp === 'error' && <div className="msg er">No se pudo exportar. Requiere conexión.</div>}
    </div>

    {err && <div className="card"><div className="msg wa">{err}</div></div>}
    {!data && !err && <div className="card"><p className="mu sm">Cargando resumen...</p></div>}

    {data && <>
      <div className="cg">
        <Metric n={data.activos} t="Activos (filtrados)" />
        <Metric n={data.usuarios} t="Usuarios activos" />
        <Metric n={data.modelos} t="Modelos" />
        <Metric n={data.conflictos} t="Conflictos" />
      </div>

      <div className="card">
        <h2>Activos por edificio</h2>
        {data.porEdificio.map((e) => (
          <div className="it" key={e.edificio}><div><b>{e.edificio}</b></div><span className="bd ok">{e.total}</span></div>))}
        {!data.porEdificio.length && <p className="mu sm">Sin edificios.</p>}
      </div>

      <div className="card">
        <h2>Activos por usuario</h2>
        {data.porUsuario.map((u) => (
          <div className="it" key={u.usuario}><div><b>{u.usuario}</b></div><span className="bd ok">{u.total}</span></div>))}
        {!data.porUsuario.length && <p className="mu sm">Nadie capturó activos con estos filtros.</p>}
      </div>

      <div className="card">
        <h2>Activos por día {data.porDia.length >= 31 ? '(últimos 31)' : ''}</h2>
        {data.porDia.map((d) => (
          <div className="it" key={d.dia}><div><b>{new Date(d.dia + 'T00:00').toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short' })}</b></div><span className="bd ok">{d.total}</span></div>))}
        {!data.porDia.length && <p className="mu sm">Sin capturas en el periodo seleccionado.</p>}
      </div>
    </>}
  </>
}
