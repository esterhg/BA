import { esUuid, esEnteroPositivo } from '../../../domain/shared/validators.js'
import { Errores } from '../../../domain/shared/errors.js'

export function crearActivoController(uc) {
  return {
    listar: async (req, res) => {
      const filtros = {
        q: String(req.query.q || '').trim(),
        cursor: esEnteroPositivo(req.query.cursor) ? req.query.cursor : null,
        edificioId: esEnteroPositivo(req.query.edificio_id) ? Number(req.query.edificio_id) : null,
        nivelId: esEnteroPositivo(req.query.nivel_id) ? Number(req.query.nivel_id) : null,
        serie: String(req.query.serie || '').trim(),
        esAdmin: req.user.rol === 'administrador',
      }
      res.json(await uc.listar(filtros))
    },

    crear: async (req, res) => {
      const activo = await uc.crear(req.body || {}, req.user)
      res.status(201).json({ activo })
    },

    editar: async (req, res) => {
      if (!esUuid(req.params.id)) throw Errores.invalido('Identificador no válido.')
      const activo = await uc.editar(req.params.id, req.body || {}, req.user)
      res.json({ activo })
    },

    eliminar: async (req, res) => {
      if (!esUuid(req.params.id)) throw Errores.invalido('Identificador no válido.')
      await uc.eliminar(req.params.id, req.user)
      res.json({ ok: true })
    },

    sincronizar: async (req, res) => {
      const resultados = await uc.sincronizar(req.body || {}, req.user)
      res.json({ resultados })
    },
  }
}
