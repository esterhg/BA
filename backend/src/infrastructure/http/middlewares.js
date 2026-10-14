import { DomainError } from '../../domain/shared/errors.js'

// Envuelve un handler async para enviar errores al middleware de errores.
export const h = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// Autenticación por JWT. Inyecta el verificador de token.
export const crearAuth = (tokenService) => (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  try { req.user = tokenService.verificar(token); next() }
  catch { res.status(401).json({ mensaje: 'Sesión no válida' }) }
}

// Restringe a administradores.
export const soloAdmin = (req, res, next) =>
  req.user?.rol === 'administrador' ? next() : res.status(403).json({ mensaje: 'Solo para administradores' })

// Traduce DomainError (negocio) a códigos HTTP. Único punto que conoce ambos.
const CODIGO_HTTP = {
  INVALIDO: 400,
  NO_ENCONTRADO: 404,
  DUPLICADO: 409,
  NO_AUTORIZADO: 401,
  PROHIBIDO: 403,
}

export const manejadorErrores = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    return res.status(CODIGO_HTTP[err.codigo] || 400).json({ mensaje: err.message })
  }
  console.error(err)
  res.status(500).json({ mensaje: 'Error del servidor' })
}
