import { esUuid, esEnteroPositivo, esFechaIso } from '../../../domain/shared/validators.js'
import { Errores } from '../../../domain/shared/errors.js'

export function crearActivoController(uc) {
  return {
    listar: async (req, res) => {
      const filtros = {
        q: String(req.query.q || '').trim(),
        cursor: esEnteroPositivo(req.query.cursor) ? req.query.cursor : null,
        edificioId: esEnteroPositivo(req.query.edificio_id) ? Number(req.query.edificio_id) : null,
        nivelId: esEnteroPositivo(req.query.nivel_id) ? Number(req.query.nivel_id) : null,
        modeloId: esEnteroPositivo(req.query.modelo_id) ? Number(req.query.modelo_id) : null,
        usuarioId: esEnteroPositivo(req.query.usuario_id) ? Number(req.query.usuario_id) : null,
        desde: esFechaIso(req.query.desde) ? req.query.desde : null,
        hasta: esFechaIso(req.query.hasta) ? req.query.hasta : null,
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

    // --- EPC / RFID ------------------------------------------------------
    // GET /activos/epc  → lista activos (autenticación por API Key).
    // Mismos filtros que GET /activos. La app RFID no es admin, así que la
    // respuesta no incluye usuario/fecha (esAdmin = false).
    listarConApiKey: async (req, res) => {
      const filtros = {
        q: String(req.query.q || '').trim(),
        cursor: esEnteroPositivo(req.query.cursor) ? req.query.cursor : null,
        edificioId: esEnteroPositivo(req.query.edificio_id) ? Number(req.query.edificio_id) : null,
        nivelId: esEnteroPositivo(req.query.nivel_id) ? Number(req.query.nivel_id) : null,
        modeloId: esEnteroPositivo(req.query.modelo_id) ? Number(req.query.modelo_id) : null,
        serie: String(req.query.serie || '').trim(),
        esAdmin: false,
      }
      res.json(await uc.listar(filtros))
    },

    // POST /activos/epc  body: { codigo, serie, modelo_id, nivel_id, epc }
    // → crea el activo y le vincula el EPC en un solo paso.
    crearConEpc: async (req, res) => {
      const activo = await uc.crearConEpc(req.body || {}, req.user)
      res.status(201).json({ activo })
    },

    // POST /activos/sin-epc  body: { codigo, serie, modelo_id, nivel_id }
    // → crea un activo SIN EPC (autenticación por API Key). Reutiliza el mismo
    // caso de uso que el CRUD por JWT, así que queda en la bitácora de movimientos.
    crearSinEpc: async (req, res) => {
      const activo = await uc.crear(req.body || {}, req.user)
      res.status(201).json({ activo })
    },

    // GET /activos/id/:id  → obtiene UN activo por su ID (UUID) con API Key.
    obtenerConApiKey: async (req, res) => {
      if (!esUuid(req.params.id)) throw Errores.invalido('Identificador no válido.')
      const activo = await uc.obtener(req.params.id)
      res.json({ activo })
    },

    // GET /activos/epc/:epc  → la app RFID escanea y consulta a qué activo pertenece.
    buscarPorEpc: async (req, res) => {
      const activo = await uc.buscarPorEpc(req.params.epc)
      res.json({ activo })
    },

    // PATCH /activos/:id/epc  body: { epc }  → vincula/reasigna el EPC al activo.
    vincularEpc: async (req, res) => {
      if (!esUuid(req.params.id)) throw Errores.invalido('Identificador no válido.')
      const activo = await uc.vincularEpc(req.params.id, (req.body || {}).epc, req.user)
      res.json({ activo })
    },

    // DELETE /activos/:id/epc  → desvincula el EPC del activo.
    desvincularEpc: async (req, res) => {
      if (!esUuid(req.params.id)) throw Errores.invalido('Identificador no válido.')
      const activo = await uc.desvincularEpc(req.params.id, req.user)
      res.json({ activo })
    },
  }
}
