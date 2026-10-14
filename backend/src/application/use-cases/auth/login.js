import { Errores } from '../../../domain/shared/errors.js'
import { LIMITES } from '../../../domain/shared/validators.js'

// Caso de uso: iniciar sesión. Recibe sus dependencias por inyección.
export function crearLogin({ usuarioRepo, tokenService, hashService }) {
  return async function login(body) {
    const b = body || {}
    const username = typeof b.username === 'string' ? b.username : ''
    const password = typeof b.password === 'string' ? b.password : ''
    // Rechazo temprano de entradas desproporcionadas (defensa frente a abuso).
    if (username.length > LIMITES.username || password.length > LIMITES.password)
      throw Errores.noAutorizado('Credenciales incorrectas')
    const u = await usuarioRepo.buscarActivoPorUsername(username)
    const ok = u && await hashService.comparar(password, u.password_hash)
    if (!ok) throw Errores.noAutorizado('Credenciales incorrectas')
    const user = { id: u.id, nombre: u.nombre, rol: u.rol }
    return { token: tokenService.firmar(user), user }
  }
}
