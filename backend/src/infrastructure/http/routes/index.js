import { Router } from 'express'
import { h } from '../middlewares.js'
import { loginLimiter, escrituraLimiter } from '../rateLimiters.js'

// Ensambla todas las rutas. Recibe los controladores y los middlewares ya creados.
export function crearRutas({ controllers, auth, soloAdmin, pool }) {
  const router = Router()
  const { authC, catalogoC, activoC, adminC } = controllers

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

  // Administración
  router.get('/admin/usuarios', auth, soloAdmin, h(adminC.listarUsuarios))
  router.get('/admin/resumen', auth, soloAdmin, h(adminC.resumen))
  router.get('/movimientos', auth, soloAdmin, h(adminC.listarMovimientos))

  return router
}
