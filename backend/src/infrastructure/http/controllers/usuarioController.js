// Adaptador HTTP para la gestión de usuarios (solo administradores).
// Ningún endpoint devuelve el hash ni la contraseña: no es recuperable.
export function crearUsuarioController(uc) {
  return {
    listar: async (_req, res) => res.json(await uc.listar()),

    obtener: async (req, res) => res.json(await uc.obtener(req.params.id)),

    crear: async (req, res) => {
      const usuario = await uc.crear(req.body || {})
      res.status(201).json({ usuario })
    },

    editar: async (req, res) => {
      const usuario = await uc.editar(req.params.id, req.body || {}, req.user?.id)
      res.json({ usuario })
    },

    // Restablece la contraseña (el admin asigna una nueva).
    resetPassword: async (req, res) => {
      const usuario = await uc.resetPassword(req.params.id, (req.body || {}).password)
      res.json({ usuario })
    },

    // Baja lógica (desactivar).
    eliminar: async (req, res) => {
      const usuario = await uc.eliminar(req.params.id, req.user?.id)
      res.json({ usuario })
    },
  }
}
