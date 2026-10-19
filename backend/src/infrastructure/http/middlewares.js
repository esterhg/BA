import { timingSafeEqual } from 'node:crypto'
import { DomainError } from '../../domain/shared/errors.js'

// Envuelve un handler async para enviar errores al middleware de errores.
export const h = (fn) => (req, res, next) => fn(req, res, next).catch(next)

// Compara dos cadenas en tiempo constante (evita timing attacks sobre la clave).
const igualesSeguro = (a, b) => {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b))
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

// Autenticación por API Key para la app RFID (cabecera x-api-key).
// Fail-closed: si no hay clave configurada en el servidor, rechaza todo.
export const crearApiKey = (claveEsperada, rfidUsuarioId = null) => (req, res, next) => {
  if (!claveEsperada) return res.status(503).json({ mensaje: 'Endpoint RFID no configurado' })
  const recibida = req.headers['x-api-key'] || ''
  if (recibida && igualesSeguro(recibida, claveEsperada)) {
    // La app RFID no es un usuario humano: se le atribuye el usuario de sistema
    // "rfid-system". Así la bitácora tiene autor y los activos que cree cumplen
    // la restricción NOT NULL de activos.usuario_id.
    req.user = { id: rfidUsuarioId, rol: 'rfid', nombre: 'App RFID' }
    return next()
  }
  res.status(401).json({ mensaje: 'API key no válida' })
}

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
