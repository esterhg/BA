import { Errores } from '../shared/errors.js'
import { LIMITES } from '../shared/validators.js'

// Roles permitidos en el sistema.
export const ROLES = ['operador', 'administrador']

// Valida y normaliza los datos para crear un usuario.
// Devuelve { username, nombre, password, rol } o lanza DomainError.
export function normalizarNuevoUsuario(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw Errores.invalido('Datos vacíos.')

  if (typeof b.username !== 'string' || typeof b.nombre !== 'string' || typeof b.password !== 'string')
    throw Errores.invalido('Usuario, nombre y contraseña deben ser texto.')

  const username = b.username.trim().toLowerCase()
  const nombre = b.nombre.trim()
  const password = b.password
  const rol = b.rol === 'administrador' ? 'administrador' : 'operador'  // por defecto operador

  if (!username) throw Errores.invalido('El nombre de usuario es obligatorio.')
  if (username.length > LIMITES.username) throw Errores.invalido('El nombre de usuario es demasiado largo.')
  if (!/^[a-z0-9._-]+$/.test(username))
    throw Errores.invalido('El usuario solo puede tener letras, números, punto, guion y guion bajo.')

  if (!nombre) throw Errores.invalido('El nombre es obligatorio.')
  if (nombre.length > LIMITES.nombreUsuario) throw Errores.invalido('El nombre es demasiado largo.')

  if (password.length < LIMITES.passwordMin)
    throw Errores.invalido(`La contraseña debe tener al menos ${LIMITES.passwordMin} caracteres.`)
  if (password.length > LIMITES.password) throw Errores.invalido('La contraseña es demasiado larga.')

  return { username, nombre, password, rol }
}
