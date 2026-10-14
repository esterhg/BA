import { normalizarNuevoUsuario } from '../../../domain/entities/usuario.js'
import { Errores } from '../../../domain/shared/errors.js'

// Casos de uso de gestión de usuarios (solo administradores).
export function crearUsuarioUseCases({ usuarioRepo, hashService }) {
  return {
    listar: () => usuarioRepo.listarActivos(),

    crear: async (datos) => {
      const limpio = normalizarNuevoUsuario(datos)   // valida; lanza DomainError si falla
      if (await usuarioRepo.existeUsername(limpio.username))
        throw Errores.duplicado('Ya existe un usuario con ese nombre de usuario.')
      const passwordHash = await hashService.hashear(limpio.password)
      return usuarioRepo.crear({
        username: limpio.username, nombre: limpio.nombre, passwordHash, rol: limpio.rol,
      })
    },
  }
}
