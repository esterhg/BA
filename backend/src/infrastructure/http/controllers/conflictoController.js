// Adaptador HTTP para listar conflictos de sincronización (API Key).
export function crearConflictoController(uc) {
  return {
    // GET /conflictos?modelo_id&nivel_id&fecha_desde&fecha_hasta&cursor
    listar: async (req, res) => res.json(await uc.listar(req.query || {})),
  }
}
