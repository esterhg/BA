// Adaptador HTTP para la gestión de usuarios (solo administradores).
export function crearUsuarioController(uc) {
  return {
    listar: async (_req, res) => res.json(await uc.listar()),

    crear: async (req, res) => {
      const usuario = await uc.crear(req.body || {})
      res.status(201).json({ usuario })
    },
  }
}
