import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { manejadorErrores } from './middlewares.js'
import { apiLimiter } from './rateLimiters.js'

// Construye la aplicación Express con sus middlewares, rutas y manejo de errores.
// No arranca el servidor (eso lo hace main.js).
export function crearApp({ router, corsOrigin }) {
  const app = express()
  app.set('trust proxy', 1)
  app.disable('x-powered-by')             // no revelar que es Express

  // Cabeceras de seguridad: anti-sniffing, anti-clickjacking, HSTS, etc.
  app.use(helmet())

  // CORS: en producción define CORS_ORIGIN (lista separada por comas).
  // Sin él, se acepta cualquier origen (cómodo en desarrollo local).
  app.use(cors({ origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true }))

  // Límite del cuerpo JSON: frena payloads gigantes enviados a mano.
  app.use(express.json({ limit: '256kb' }))

  // Red de seguridad general contra abuso/scraping desde cualquier cliente.
  app.use(apiLimiter)

  // Las rutas se montan en la raíz y también bajo /api. Así el frontend puede
  // apuntar a VITE_API_URL=https://api.midominio.com  (rutas en la raíz) o a
  // VITE_API_URL=https://midominio.com/api  (mismo dominio, backend tras /api).
  app.use(router)
  app.use('/api', router)
  app.use(manejadorErrores)

  return app
}
