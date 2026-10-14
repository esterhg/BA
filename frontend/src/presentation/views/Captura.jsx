import { useMemo, useRef, useState } from 'react'
import { api } from '../../infrastructure/api/client.js'
import { dbPut, dbDelete } from '../../infrastructure/storage/db.js'
import { norm, mensajeDuplicado } from '../../domain/format.js'
import { ESTADO } from '../../domain/constants.js'

// Captura de activos de una sesión, con CRUD sobre la cola offline.
export function Captura({ ses, cat, cola, refresh, doSync, onEnd }) {
  const [f, setF] = useState({ codigo: '', serie: '', modelo: null, q: '' })
  const [msg, setMsg] = useState(null)
  const [editId, setEditId] = useState(null)     // id del registro en edición (null = creando)
  const [sel, setSel] = useState(null)           // id del registro expandido en la lista
  const [borrando, setBorrando] = useState(null) // id en confirmación de borrado
  const codigoRef = useRef()
  const sug = useMemo(() => {
    const q = norm(f.q)
    return f.modelo || !q ? [] : cat.modelos.filter((m) => norm(m.nombre).includes(q)).slice(0, 6)
  }, [f.q, f.modelo, cat.modelos])
  const mias = cola.filter((r) => r.sesion_id === ses.id)
  const pendientes = cola.filter((r) => r.estado === 'pendiente').length

  const limpiarForm = () => { setF({ codigo: '', serie: '', modelo: null, q: '' }); setEditId(null) }

  async function guardar() {
    const codigo = f.codigo.trim(), serie = f.serie.trim()
    if (!codigo || !serie) return setMsg(['wa', 'Escribe el código y la serie.'])
    if (!f.modelo) return setMsg(['wa', 'Selecciona un modelo del catálogo.'])
    // Al editar, ignorar el propio registro en la comprobación de duplicado local.
    const local = cola.find((r) => r.id !== editId && r.estado !== 'conflicto' && (norm(r.codigo) === norm(codigo) || norm(r.serie) === norm(serie)))
    if (local) return setMsg(['er', 'Ese código o serie ya está registrado en este dispositivo.'])

    if (editId) return editarGuardar(codigo, serie)          // flujo de edición

    const reg = { id: crypto.randomUUID(), codigo, serie, modelo_id: f.modelo.id, modelo_nombre: f.modelo.nombre,
      nivel_id: ses.nivel_id, sesion_id: ses.id, capturado_en: new Date().toISOString(), estado: 'pendiente' }
    let texto = 'Guardado en el dispositivo. Se validará al sincronizar.'
    if (navigator.onLine) {                                   // validación inmediata en el servidor
      try {
        const { estado, modelo_nombre, detalle, ...envio } = reg
        const { resultados: [x] } = await api('/activos/sync', { registros: [envio], inmediato: true })
        if (x.estado !== 'ok') return setMsg(['er', x.estado === 'invalido' ? '⚠ ' + mensajeDuplicado(x) : '⚠ Activo duplicado, no se guardó. ' + mensajeDuplicado(x)])
        reg.estado = 'sincronizado'; texto = '✓ Activo registrado.'
      } catch { /* sin conexión real: queda en cola */ }
    }
    await dbPut('cola', reg); await refresh()
    setF({ ...f, codigo: '', serie: '' }); setMsg([reg.estado === 'sincronizado' ? 'ok' : 'wa', texto])
    codigoRef.current?.focus()
  }

  // Guarda los cambios de un registro existente de la cola.
  async function editarGuardar(codigo, serie) {
    const prev = cola.find((r) => r.id === editId)
    if (!prev) { limpiarForm(); return }
    const reg = { ...prev, codigo, serie, modelo_id: f.modelo.id, modelo_nombre: f.modelo.nombre }

    if (prev.estado === 'sincronizado') {
      // Ya está en el servidor: hay que actualizarlo allí. Requiere conexión.
      if (!navigator.onLine) return setMsg(['er', 'Este activo ya está sincronizado; para editarlo necesitas conexión.'])
      try {
        await api(`/activos/${prev.id}`, { codigo, serie, modelo_id: f.modelo.id, nivel_id: prev.nivel_id }, 'PATCH')
      } catch (x) { return setMsg(['er', x.mensaje || 'No se pudo actualizar en el servidor.']) }
    }
    await dbPut('cola', reg); await refresh()
    limpiarForm(); setSel(null); setMsg(['ok', '✓ Activo actualizado.'])
  }

  function editarReg(r) {
    const modelo = cat.modelos.find((m) => m.id === r.modelo_id) || { id: r.modelo_id, nombre: r.modelo_nombre }
    setEditId(r.id); setSel(null); setBorrando(null)
    setF({ codigo: r.codigo, serie: r.serie, modelo, q: '' })
    setMsg(['wa', 'Editando un activo. Cambia los datos y guarda.'])
    codigoRef.current?.focus()
  }

  async function eliminarReg(r) {
    if (r.estado === 'sincronizado') {
      // Está en el servidor: eliminarlo allí también. Requiere conexión.
      if (!navigator.onLine) { setBorrando(null); return setMsg(['er', 'Este activo ya está sincronizado; para eliminarlo necesitas conexión.']) }
      try { await api(`/activos/${r.id}`, undefined, 'DELETE') }
      catch (x) { setBorrando(null); return setMsg(['er', x.mensaje || 'No se pudo eliminar del servidor.']) }
    }
    await dbDelete('cola', r.id); await refresh()
    setBorrando(null); setSel(null)
    if (editId === r.id) limpiarForm()
    setMsg(['ok', '✓ Activo eliminado.'])
  }

  const enter = (fn) => (e) => { if (e.key === 'Enter') { e.preventDefault(); fn() } }

  return <>
    <div className="ses"><div><small>Edificio</small><b>{ses.edificio}</b></div><div><small>Nivel</small><b>{ses.nivel}</b></div></div>
    <div className="card" style={{ marginTop: 14 }}>
      <label style={{ marginTop: 0 }}>Código</label>
      <input ref={codigoRef} autoFocus value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} onKeyDown={enter(() => document.getElementById('mod').focus())} />
      <label>Modelo (buscar y seleccionar)</label>
      {f.modelo
        ? <div className="chip"><b>{f.modelo.nombre}</b><button onClick={() => setF({ ...f, modelo: null, q: '' })}>Cambiar</button></div>
        : <input id="mod" value={f.q} autoComplete="off" placeholder="latitude, cisco, hp..." onChange={(e) => setF({ ...f, q: e.target.value })} />}
      {sug.length > 0 && <div className="sug">{sug.map((m) => (
        <div key={m.id} onClick={() => { setF({ ...f, modelo: m, q: '' }); setTimeout(() => document.getElementById('ser')?.focus()) }}>
          <span className="th">{m.imagen_url ? <img src={m.imagen_url} alt="" /> : m.tipo?.[0]}</span>{m.nombre}
        </div>))}</div>}
      <label>Serie</label>
      <input id="ser" value={f.serie} onChange={(e) => setF({ ...f, serie: e.target.value })} onKeyDown={enter(guardar)} />
      <button className="p full" onClick={guardar}>{editId ? 'Guardar cambios' : 'Guardar y pasar al siguiente'}</button>
      {editId && <button className="full" onClick={() => { limpiarForm(); setMsg(null) }}>Cancelar edición</button>}
      {msg && <div className={'msg ' + msg[0]}>{msg[1]}</div>}
    </div>
    <div className="card">
      <div className="top nb"><h2>Esta sesión ({mias.length})</h2><button className="pill" onClick={async () => { const r = await doSync(); if (r) setMsg([r.conflictos ? 'wa' : 'ok', `${r.ok} sincronizados, ${r.conflictos} en conflicto.`]) }}>Sincronizar ({pendientes})</button></div>
      {mias.map((r) => {
        const abierto = sel === r.id
        return (
          <div className={'it' + (abierto ? ' sel' : '')} key={r.id} onClick={() => { setBorrando(null); setSel(abierto ? null : r.id) }} style={{ cursor: 'pointer' }}>
            <div><b>{r.codigo}</b> · {r.serie}<div className="mu sm">{r.modelo_nombre}</div>
              {r.estado === 'conflicto' && <div className="sm err">{mensajeDuplicado(r.detalle)}</div>}
              {abierto && (borrando === r.id
                ? <div className="sm err" style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>¿Eliminar este activo?
                    <button className="pill" style={{ marginLeft: 8 }} onClick={() => eliminarReg(r)}>Sí, eliminar</button>
                    <button className="pill" style={{ marginLeft: 6 }} onClick={() => setBorrando(null)}>Cancelar</button></div>
                : <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button className="pill" onClick={() => editarReg(r)}>Editar</button>
                    <button className="pill" style={{ marginLeft: 6 }} onClick={() => setBorrando(r.id)}>Eliminar</button></div>)}
            </div>
            <span className={'bd ' + ESTADO[r.estado][0]}>{ESTADO[r.estado][1]}</span>
          </div>)
      })}
      {!mias.length && <p className="mu sm">Aún no hay registros.</p>}
      <button className="full" onClick={onEnd}>Cerrar sesión de inventario</button>
    </div>
  </>
}
