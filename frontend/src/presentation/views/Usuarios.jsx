import { useEffect, useState } from 'react'
import { api, session } from '../../infrastructure/api/client.js'

// Gestión de usuarios (solo administradores): listar, crear, editar,
// restablecer contraseña y desactivar.
//
// Nota de seguridad: la contraseña NO se puede ver. El sistema solo guarda un
// hash irreversible (bcrypt), así que ni el administrador puede recuperarla.
// En su lugar, el admin puede asignar una contraseña nueva ("restablecer").
export function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [err, setErr] = useState('')
  const [modo, setModo] = useState(null)   // null | 'nuevo' | {tipo:'editar'|'password', usuario}
  const [msg, setMsg] = useState(null)

  const yoId = session.user?.id

  const cargar = () =>
    api('/admin/usuarios').then(setUsuarios).catch((x) =>
      setErr(x.status === 403 ? 'No tienes permiso para ver esto.' : 'No se pudo cargar. Requiere conexión.'))

  useEffect(() => { cargar() }, [])

  const volver = (mensaje) => { setModo(null); if (mensaje) setMsg(mensaje); cargar() }

  if (modo === 'nuevo') return <FormUsuario
    onCancel={() => setModo(null)}
    onSaved={(u) => volver(['ok', `✓ Usuario "${u.nombre}" creado.`])} />

  if (modo?.tipo === 'editar') return <FormEditar
    usuario={modo.usuario}
    onCancel={() => setModo(null)}
    onSaved={(u) => volver(['ok', `✓ Usuario "${u.nombre}" actualizado.`])} />

  if (modo?.tipo === 'password') return <FormPassword
    usuario={modo.usuario}
    onCancel={() => setModo(null)}
    onSaved={(u) => volver(['ok', `✓ Contraseña de "${u.nombre}" restablecida.`])} />

  async function desactivar(u) {
    if (!confirm(`¿Desactivar al usuario "${u.nombre}"? No podrá iniciar sesión.`)) return
    try { await api(`/admin/usuarios/${u.id}`, undefined, 'DELETE'); volver(['ok', `✓ Usuario "${u.nombre}" desactivado.`]) }
    catch (x) { setMsg(['er', x.mensaje || 'No se pudo desactivar.']) }
  }

  return (
    <div className="card">
      <button className="p full" style={{ marginTop: 0, marginBottom: 14 }} onClick={() => { setMsg(null); setModo('nuevo') }}>+ Nuevo usuario</button>
      {msg && <div className={'msg ' + msg[0]}>{msg[1]}</div>}
      {err && <div className="msg wa">{err}</div>}
      <h2>Usuarios ({usuarios.length})</h2>
      {usuarios.map((u) => (
        <div className="it" key={u.id} style={!u.activo ? { opacity: 0.55 } : undefined}>
          <div>
            <b>{u.nombre}</b>
            <div className="mu sm">{u.username} · {u.rol}{!u.activo ? ' · inactivo' : ''}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <button className="sm" onClick={() => { setMsg(null); setModo({ tipo: 'editar', usuario: u }) }}>Editar</button>
              <button className="sm" onClick={() => { setMsg(null); setModo({ tipo: 'password', usuario: u }) }}>Restablecer contraseña</button>
              {u.activo && u.id !== yoId && <button className="sm wa" onClick={() => desactivar(u)}>Desactivar</button>}
            </div>
          </div>
          <span className={'bd ' + (u.rol === 'administrador' ? 'wa' : 'ok')}>{u.rol === 'administrador' ? 'Admin' : 'Operador'}</span>
        </div>))}
      {!usuarios.length && <p className="mu sm">No hay usuarios.</p>}
    </div>
  )
}

function FormUsuario({ onCancel, onSaved }) {
  const [username, setUsername] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('operador')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function guardar() {
    setErr('')
    if (!username.trim()) return setErr('El nombre de usuario es obligatorio.')
    if (!nombre.trim()) return setErr('El nombre es obligatorio.')
    if (password.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.')
    setBusy(true)
    try {
      const { usuario } = await api('/admin/usuarios', { username: username.trim(), nombre: nombre.trim(), password, rol })
      onSaved(usuario)
    } catch (x) { setErr(x.mensaje || 'No se pudo crear el usuario.') } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h2>Nuevo usuario</h2>
      <label>Nombre de usuario (para iniciar sesión)</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus placeholder="ej.: jperez" autoComplete="off" />
      <label>Nombre completo</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej.: Juan Pérez" />
      <label>Contraseña (mínimo 8 caracteres)</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      <label>Rol</label>
      <select value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="operador">Operador</option>
        <option value="administrador">Administrador</option>
      </select>
      <button className="p full" disabled={busy} onClick={guardar}>{busy ? 'Creando...' : 'Crear usuario'}</button>
      {err && <div className="msg er">{err}</div>}
      <button className="full" onClick={onCancel}>Cancelar</button>
    </div>
  )
}

// Edita nombre, rol y estado. El username no se edita (es la identidad de login).
function FormEditar({ usuario, onCancel, onSaved }) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [rol, setRol] = useState(usuario.rol)
  const [activo, setActivo] = useState(usuario.activo)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const esYo = usuario.id === session.user?.id

  async function guardar() {
    setErr('')
    if (!nombre.trim()) return setErr('El nombre es obligatorio.')
    setBusy(true)
    try {
      const { usuario: u } = await api(`/admin/usuarios/${usuario.id}`, { nombre: nombre.trim(), rol, activo }, 'PATCH')
      onSaved(u)
    } catch (x) { setErr(x.mensaje || 'No se pudo actualizar.') } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h2>Editar usuario</h2>
      <label>Nombre de usuario</label>
      <input value={usuario.username} disabled />
      <label>Nombre completo</label>
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
      <label>Rol</label>
      <select value={rol} onChange={(e) => setRol(e.target.value)} disabled={esYo}>
        <option value="operador">Operador</option>
        <option value="administrador">Administrador</option>
      </select>
      {esYo && <p className="mu sm">No puedes cambiar tu propio rol ni desactivar tu cuenta.</p>}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} disabled={esYo} style={{ width: 'auto' }} />
        Activo (puede iniciar sesión)
      </label>
      <button className="p full" disabled={busy} onClick={guardar}>{busy ? 'Guardando...' : 'Guardar cambios'}</button>
      {err && <div className="msg er">{err}</div>}
      <button className="full" onClick={onCancel}>Cancelar</button>
    </div>
  )
}

// Restablece la contraseña: el admin asigna una NUEVA clave. La anterior no se
// puede ver (hash irreversible); solo se reemplaza.
function FormPassword({ usuario, onCancel, onSaved }) {
  const [password, setPassword] = useState('')
  const [repetir, setRepetir] = useState('')
  const [ver, setVer] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function guardar() {
    setErr('')
    if (password.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.')
    if (password !== repetir) return setErr('Las contraseñas no coinciden.')
    setBusy(true)
    try {
      const { usuario: u } = await api(`/admin/usuarios/${usuario.id}/password`, { password }, 'PATCH')
      onSaved(u)
    } catch (x) { setErr(x.mensaje || 'No se pudo restablecer la contraseña.') } finally { setBusy(false) }
  }

  return (
    <div className="card">
      <h2>Restablecer contraseña</h2>
      <p className="mu sm">Usuario: <b>{usuario.nombre}</b> ({usuario.username})</p>
      <p className="mu sm">La contraseña actual no puede verse (se guarda cifrada). Aquí asignas una nueva.</p>
      <label>Nueva contraseña (mínimo 8 caracteres)</label>
      <input type={ver ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="new-password" />
      <label>Repetir nueva contraseña</label>
      <input type={ver ? 'text' : 'password'} value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} style={{ width: 'auto' }} />
        Mostrar lo que estoy escribiendo
      </label>
      <button className="p full" disabled={busy} onClick={guardar}>{busy ? 'Guardando...' : 'Restablecer contraseña'}</button>
      {err && <div className="msg er">{err}</div>}
      <button className="full" onClick={onCancel}>Cancelar</button>
    </div>
  )
}
