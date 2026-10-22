import { esEnteroPositivo, esFechaIso } from '../../../domain/shared/validators.js'

// Caso de uso: listar conflictos de sincronización con filtros opcionales.
// Normaliza y valida los filtros; ignora los que vengan mal formados en vez de
// fallar, para que la lista sea tolerante a querys parciales.
export function crearConflictoUseCases({ conflictoRepo }) {
  return {
    listar: (filtrosCrudos = {}) => {
      const f = filtrosCrudos
      const filtros = {
        cursor: esEnteroPositivo(f.cursor) ? Number(f.cursor) : null,
        modeloId: esEnteroPositivo(f.modelo_id) ? Number(f.modelo_id) : null,
        nivelId: esEnteroPositivo(f.nivel_id) ? Number(f.nivel_id) : null,
        fechaDesde: esFechaIso(f.fecha_desde) ? f.fecha_desde : null,
        fechaHasta: esFechaIso(f.fecha_hasta) ? f.fecha_hasta : null,
      }
      return conflictoRepo.listar(filtros)
    },
  }
}
