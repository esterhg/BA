import { useState } from 'react'
import { api, session } from '../../infrastructure/api/client.js'
import { Ico, CampoPassword } from '../components/ui.jsx'

export function Login({ onLogin }) {
  const [f, setF] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try { const { token, user } = await api('/auth/login', f); session.set(token, user); onLogin(user) }
    catch (x) { setErr(x.status === 401 ? 'Usuario o contraseña incorrectos.' : 'No se pudo conectar con el servidor.') }
    finally { setBusy(false) }
  }

  return (
    <div className="w">
      <div className="brand"><Ico k="inv" /><h1>Control de activos</h1><p className="mu sm">Inventario por edificio y nivel</p></div>
      <form className="card" onSubmit={submit}>
        <h2>Iniciar sesión</h2>
        <label>Usuario</label><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoComplete="username" />
        <label>Contraseña</label><CampoPassword value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
        <button className="p full" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
        {err && <div className="msg er">{err}</div>}
      </form>
    </div>
  )
}
