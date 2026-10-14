import { useEffect, useState } from 'react'
import { api } from '../../infrastructure/api/client.js'

// Gestión de usuarios (solo administradores): listar y crear.
export function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [err, setErr] = useState('')
  const [form, setForm] = useState(false)  // true = mostrando formulario de nuevo usuario
  const [msg, setMsg] = useState(null)

  const cargar = () =>
    api('/admin/usuarios').then(setUsuarios).catch((x) =>
      setErr(x.status === 403 ? 'No tienes permiso para ver esto.' : 'No se pudo cargar. Requiere conexión.'))

  useEffect(() => { cargar() }, [])

  if (form) return <FormUsuario
    onCancel={() => setForm(false)}
    onSaved={(u) => { setForm(false); setMsg(['ok', `✓ Usuario "${u.nombre}" creado.`]); cargar() }} />

  return (
    <div className="card">
      <button className="p full" style={{ marginTop: 0, marginBottom: 14 }} onClick={() => { setMsg(null); setForm(true) }}>+ Nuevo usuario</button>
      {msg && <div className={'msg ' + msg[0]}>{msg[1]}</div>}
      {err && <div className="msg wa">{err}</div>}
      <h2>Usuarios ({usuarios.length})</h2>
      {usuarios.map((u) => (
        <div className="it" key={u.id}>
          <div><b>{u.nombre}</b><div className="mu sm">{u.rol}</div></div>
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
