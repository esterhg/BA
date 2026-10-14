import { esEnteroPositivo } from '../../../domain/shared/validators.js'
import { Errores } from '../../../domain/shared/errors.js'

export function crearCatalogoController(uc) {
  return {
    listarUbicaciones: async (_req, res) => res.json(await uc.listarUbicaciones()),

    listarModelos: async (_req, res) => res.json(await uc.listarModelos()),

    crearModelo: async (req, res) => {
      const modelo = await uc.crearModelo(req.body)
      res.status(201).json({ modelo })
    },

    editarModelo: async (req, res) => {
      if (!esEnteroPositivo(req.params.id)) throw Errores.invalido('Identificador no válido.')
      const modelo = await uc.editarModelo(Number(req.params.id), req.body)
      res.json({ modelo })
    },
  }
}
