import { Router } from 'express'
import { h } from '../middlewares.js'
import { loginLimiter, escrituraLimiter } from '../rateLimiters.js'

// Ensambla todas las rutas. Recibe los controladores y los middlewares ya creados.
export function crearRutas({ controllers, auth, soloAdmin, apiKey, pool }) {
  const router = Router()
  const { authC, catalogoC, activoC, adminC, usuarioC, conflictoC } = controllers

  // Salud
  router.get('/health', h(async (_req, res) => { await pool.query('SELECT 1'); res.json({ ok: true }) }))

  // Autenticación (con límite estricto contra fuerza bruta)
  router.post('/auth/login', loginLimiter, h(authC.login))

  // Catálogos
  router.get('/ubicaciones', auth, h(catalogoC.listarUbicaciones))
  router.get('/modelos', auth, h(catalogoC.listarModelos))
  router.post('/modelos', auth, soloAdmin, escrituraLimiter, h(catalogoC.crearModelo))
  router.patch('/modelos/:id', auth, soloAdmin, escrituraLimiter, h(catalogoC.editarModelo))

  // Activos
  router.get('/activos', auth, h(activoC.listar))
  router.post('/activos', auth, escrituraLimiter, h(activoC.crear))
  router.patch('/activos/:id', auth, escrituraLimiter, h(activoC.editar))
  router.delete('/activos/:id', auth, escrituraLimiter, h(activoC.eliminar))
  router.post('/activos/sync', auth, escrituraLimiter, h(activoC.sincronizar))

  // EPC / RFID — autenticación por API Key (cabecera x-api-key), para la app RFID.
  // Rutas aisladas: no afectan al CRUD existente protegido por JWT.
  router.get('/activos/epc', apiKey, h(activoC.listarConApiKey))          // listar (debe ir ANTES de /epc/:epc)
  router.get('/activos/id/:id', apiKey, h(activoC.obtenerConApiKey))      // obtener un activo por ID (UUID)
  router.post('/activos/sin-epc', apiKey, escrituraLimiter, h(activoC.crearSinEpc))  // crear sin EPC
  // Catálogos para la app RFID (API Key). Separados de los /ubicaciones y /modelos por JWT.
  router.get('/catalogo/ubicaciones', apiKey, h(catalogoC.listarUbicacionesApiKey))  // edificios + niveles anidados
  router.get('/catalogo/modelos', apiKey, h(catalogoC.listarModelosApiKey))          // modelos
  router.get('/conflictos', apiKey, h(conflictoC.listar))  // conflictos de sync (filtros: modelo_id, nivel_id, fecha_desde, fecha_hasta, cursor)
  router.post('/activos/epc', apiKey, escrituraLimiter, h(activoC.crearConEpc))
  router.get('/activos/epc/:epc', apiKey, h(activoC.buscarPorEpc))
  router.patch('/activos/:id/epc', apiKey, escrituraLimiter, h(activoC.vincularEpc))
  router.delete('/activos/:id/epc', apiKey, escrituraLimiter, h(activoC.desvincularEpc))

  // Administración — CRUD de usuarios (solo administradores)
  router.get('/admin/usuarios', auth, soloAdmin, h(usuarioC.listar))
  router.post('/admin/usuarios', auth, soloAdmin, escrituraLimiter, h(usuarioC.crear))
  router.get('/admin/usuarios/:id', auth, soloAdmin, h(usuarioC.obtener))
  router.patch('/admin/usuarios/:id', auth, soloAdmin, escrituraLimiter, h(usuarioC.editar))
  router.patch('/admin/usuarios/:id/password', auth, soloAdmin, escrituraLimiter, h(usuarioC.resetPassword))
  router.delete('/admin/usuarios/:id', auth, soloAdmin, escrituraLimiter, h(usuarioC.eliminar))
  router.get('/admin/resumen', auth, soloAdmin, h(adminC.resumen))
  router.get('/movimientos', auth, soloAdmin, h(adminC.listarMovimientos))
  router.get('/admin/conflictos', auth, soloAdmin, h(conflictoC.listar))  // conflictos de sync (web, JWT)

  return router
}
