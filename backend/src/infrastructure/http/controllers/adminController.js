import { esEnteroPositivo, esFechaIso } from '../../../domain/shared/validators.js'

export function crearAdminController(uc) {
  return {
    resumen: async (req, res) => {
      const filtros = {
        desde: esFechaIso(req.query.desde) ? req.query.desde : null,
        hasta: esFechaIso(req.query.hasta) ? req.query.hasta : null,
        edificioId: esEnteroPositivo(req.query.edificio_id) ? Number(req.query.edificio_id) : null,
        usuarioId: esEnteroPositivo(req.query.usuario_id) ? Number(req.query.usuario_id) : null,
      }
      res.json(await uc.resumen(filtros))
    },

    listarUsuarios: async (_req, res) => res.json(await uc.listarUsuarios()),

    listarMovimientos: async (req, res) => {
      const filtros = {
        cursor: esEnteroPositivo(req.query.cursor) ? Number(req.query.cursor) : null,
        accion: ['crear', 'editar', 'eliminar'].includes(req.query.accion) ? req.query.accion : null,
      }
      res.json(await uc.listarMovimientos(filtros))
    },
  }
}
