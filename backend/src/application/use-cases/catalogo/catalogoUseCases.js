import { normalizarModelo } from '../../../domain/entities/modelo.js'

// Casos de uso del catálogo: ubicaciones y modelos.
export function crearCatalogoUseCases({ catalogoRepo }) {
  return {
    listarUbicaciones: () => catalogoRepo.listarUbicaciones(),

    listarModelos: () => catalogoRepo.listarModelos(),

    crearModelo: async (datos) => {
      const limpio = normalizarModelo(datos)   // valida; lanza DomainError si falla
      return catalogoRepo.crearModelo(limpio)
    },

    editarModelo: async (id, datos) => {
      const limpio = normalizarModelo(datos)
      return catalogoRepo.editarModelo(id, limpio)  // repo lanza NO_ENCONTRADO si no existe
    },
  }
}
