// Adaptador HTTP para autenticación. Traduce req/res <-> caso de uso.
export function crearAuthController({ login }) {
  return {
    login: async (req, res) => {
      const resultado = await login(req.body || {})
      res.json(resultado)
    },
  }
}
