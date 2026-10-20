import { normalizarNuevoUsuario, normalizarEdicionUsuario, validarPassword } from '../../../domain/entities/usuario.js'
import { Errores } from '../../../domain/shared/errors.js'

// Casos de uso de gestión de usuarios (solo administradores).
// Nunca devuelven ni exponen el hash de la contraseña.
export function crearUsuarioUseCases({ usuarioRepo, hashService }) {
  // Normaliza un id de la ruta a entero válido.
  const parseId = (idRaw) => {
    const id = Number(idRaw)
    if (!Number.isInteger(id) || id <= 0) throw Errores.invalido('Identificador no válido.')
    return id
  }

  // Carga un usuario o lanza NO_ENCONTRADO.
  const obtenerOExplotar = async (id) => {
    const u = await usuarioRepo.obtener(id)
    if (!u) throw Errores.noEncontrado('Usuario no encontrado.')
    return u
  }

  return {
    listar: () => usuarioRepo.listarActivos(),

    obtener: (idRaw) => obtenerOExplotar(parseId(idRaw)),

    crear: async (datos) => {
      const limpio = normalizarNuevoUsuario(datos)   // valida; lanza DomainError si falla
      if (await usuarioRepo.existeUsername(limpio.username))
        throw Errores.duplicado('Ya existe un usuario con ese nombre de usuario.')
      const passwordHash = await hashService.hashear(limpio.password)
      return usuarioRepo.crear({
        username: limpio.username, nombre: limpio.nombre, passwordHash, rol: limpio.rol,
      })
    },

    // Edita nombre, rol y/o estado activo. `actorId` es el admin que ejecuta la
    // acción: no puede degradar su propio rol ni desactivarse a sí mismo, para
    // no dejar el sistema sin administrador por accidente.
    editar: async (idRaw, datos, actorId) => {
      const id = parseId(idRaw)
      const cambios = normalizarEdicionUsuario(datos)   // valida; lanza DomainError
      await obtenerOExplotar(id)
      if (id === actorId) {
        if (cambios.rol && cambios.rol !== 'administrador')
          throw Errores.prohibido('No puedes quitarte tu propio rol de administrador.')
        if (cambios.activo === false)
          throw Errores.prohibido('No puedes desactivar tu propia cuenta.')
      }
      return usuarioRepo.editar(id, cambios)
    },

    // Restablece la contraseña de un usuario (el admin asigna una nueva).
    // No se puede "ver" la contraseña anterior: solo reemplazarla.
    resetPassword: async (idRaw, password) => {
      const id = parseId(idRaw)
      validarPassword(password)   // valida longitud; lanza DomainError
      await obtenerOExplotar(id)
      const passwordHash = await hashService.hashear(password)
      return usuarioRepo.cambiarPassword(id, passwordHash)
    },

    // Baja lógica: desactiva el usuario. No puede desactivarse a sí mismo.
    eliminar: async (idRaw, actorId) => {
      const id = parseId(idRaw)
      await obtenerOExplotar(id)
      if (id === actorId) throw Errores.prohibido('No puedes eliminar tu propia cuenta.')
      return usuarioRepo.desactivar(id)
    },
  }
}
