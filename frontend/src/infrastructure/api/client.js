// Cliente HTTP y manejo de sesión. Única puerta hacia el backend.
const BASE = import.meta.env.VITE_API_URL || '/api'

export const session = {
  get token() { return localStorage.getItem('token') },
  get user() { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } },
  set(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)) },
  clear() { localStorage.removeItem('token'); localStorage.removeItem('user') },
}

export async function api(path, body, method) {
  const res = await fetch(BASE + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(session.token && { Authorization: 'Bearer ' + session.token }) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && path !== '/auth/login') { session.clear(); location.reload() }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.mensaje || 'Error del servidor'), { status: res.status })
  return data
}
