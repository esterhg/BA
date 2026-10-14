import { useEffect, useState } from 'react'
import { api } from '../../infrastructure/api/client.js'
import { FormActivo } from '../components/FormActivo.jsx'

// Lista de activos con filtros, CRUD y sincronización de la cola pendiente.
export function Activos({ esAdmin, cat, doSync, pendientes }) {
  const [q, setQ] = useState('')
  const [edId, setEdId] = useState('')           // filtro por edificio ('' = todos)
  const [serie, setSerie] = useState('')         // filtro "serie empieza con"
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [load, setLoad] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState(null)           // ['ok'|'er', texto]
  const [form, setForm] = useState(null)          // null | { ...activo } (edición) | {} (nuevo)
  const [sel, setSel] = useState(null)            // id del activo seleccionado (expandido)
  const [borrando, setBorrando] = useState(null)  // id en confirmación de borrado

  const cargar = async (reset) => {
    setLoad(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (edId) params.set('edificio_id', edId)
      if (serie) params.set('serie', serie)
      if (!reset && next) params.set('cursor', next)
      const r = await api(`/activos?${params.toString()}`)
      setItems((p) => (reset ? r.items : [...p, ...r.items])); setNext(r.next)
    } catch { setErr('No se pudo cargar. Esta lista requiere conexión.') } finally { setLoad(false) }
  }
  useEffect(() => { const t = setTimeout(() => cargar(true), 300); return () => clearTimeout(t) }, [q, edId, serie])

  const onGuardado = (activo, esNuevo) => {
    setItems((p) => esNuevo ? [activo, ...p] : p.map((a) => (a.id === activo.id ? { ...a, ...activo } : a)))
    setForm(null); setMsg(['ok', esNuevo ? '✓ Activo creado.' : '✓ Activo actualizado.'])
  }

  async function eliminar(id) {
    try {
      await api(`/activos/${id}`, undefined, 'DELETE')
      setItems((p) => p.filter((a) => a.id !== id))
      setBorrando(null); setSel(null); setMsg(['ok', '✓ Activo eliminado.'])
    } catch (x) { setBorrando(null); setMsg(['er', x.mensaje || 'No se pudo eliminar.']) }
  }

  const limpiarFiltros = () => { setQ(''); setEdId(''); setSerie('') }
  const hayFiltros = q || edId || serie

  async function sincronizar() {
    if (!navigator.onLine) return setMsg(['er', 'Sin conexión: no se puede sincronizar ahora.'])
    const r = await doSync?.()
    if (!r) return setMsg(['er', 'No se pudo sincronizar.'])
    await cargar(true)   // refrescar la lista para ver los activos recién subidos
    setMsg([r.conflictos ? 'wa' : 'ok', `${r.ok} sincronizados, ${r.conflictos} en conflicto.`])
  }

  if (form) return <FormActivo cat={cat} inicial={form} onCancel={() => setForm(null)} onSaved={onGuardado} />

  return (
    <div className="card">
      {pendientes > 0 && <button className="full" style={{ marginTop: 0, marginBottom: 10 }} onClick={sincronizar}>Sincronizar pendientes ({pendientes})</button>}
      <button className="p full" style={{ marginTop: 0, marginBottom: 18 }} onClick={() => { setMsg(null); setForm({}) }}>+ Nuevo activo</button>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código, serie, modelo o ubicación" />
      <label>Filtrar por edificio</label>
      <select value={edId} onChange={(e) => setEdId(e.target.value)}>
        <option value="">Todos los edificios</option>
        {cat.ubicaciones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
      </select>
      <label>Serie que empieza con</label>
      <input value={serie} onChange={(e) => setSerie(e.target.value)} placeholder="Ej.: SN-, ABC..." />
      {hayFiltros && <button className="full" onClick={limpiarFiltros}>Limpiar filtros</button>}
      {msg && <div className={'msg ' + msg[0]}>{msg[1]}</div>}
      {err && <div className="msg wa">{err}</div>}
      {items.map((a) => {
        const abierto = sel === a.id
        return (
          <div className={'it' + (abierto ? ' sel' : '')} key={a.id} onClick={() => { setBorrando(null); setSel(abierto ? null : a.id) }} style={{ cursor: 'pointer' }}>
            <div><b>{a.codigo}</b> · {a.serie}<div className="mu sm">{a.modelo}</div><div className="mu sm">{a.edificio} · Nivel {a.nivel}</div>
              {esAdmin && a.usuario && <div className="mu sm">Capturó: {a.usuario}{a.fecha ? ` · ${new Date(a.fecha).toLocaleString('es')}` : ''}</div>}
              {abierto && (borrando === a.id
                ? <div className="sm err" style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>¿Eliminar este activo?
                    <button className="pill" style={{ marginLeft: 8 }} onClick={() => eliminar(a.id)}>Sí, eliminar</button>
                    <button className="pill" style={{ marginLeft: 6 }} onClick={() => setBorrando(null)}>Cancelar</button></div>
                : <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button className="pill" onClick={() => { setMsg(null); setForm(a) }}>Editar</button>
                    <button className="pill" style={{ marginLeft: 6 }} onClick={() => setBorrando(a.id)}>Eliminar</button></div>)}
            </div>
            <span className="chev">{abierto ? '⌄' : '›'}</span>
          </div>)
      })}
      {!items.length && !load && <p className="mu sm">{hayFiltros ? 'No hay activos con esos filtros.' : 'No hay activos. Crea el primero con “Nuevo activo”.'}</p>}
      {next && <button className="full" disabled={load} onClick={() => cargar(false)}>{load ? 'Cargando...' : 'Cargar más'}</button>}
    </div>
  )
}
