// Composition root: ensambla las capas (inyección de dependencias) y arranca.
// Es el único archivo que conoce infraestructura, aplicación y HTTP a la vez.
import { config } from './infrastructure/config/env.js'
import { pool } from './infrastructure/db/pool.js'

// Servicios de seguridad (infraestructura)
import { JwtTokenService } from './infrastructure/security/jwtTokenService.js'
import { BcryptHashService } from './infrastructure/security/bcryptHashService.js'

// Repositorios (infraestructura)
import { PgUsuarioRepository } from './infrastructure/db/pgUsuarioRepository.js'
import { PgCatalogoRepository } from './infrastructure/db/pgCatalogoRepository.js'
import { PgActivoRepository } from './infrastructure/db/pgActivoRepository.js'
import { PgMovimientoRepository } from './infrastructure/db/pgMovimientoRepository.js'
import { PgAdminRepository } from './infrastructure/db/pgAdminRepository.js'
import { PgConflictoRepository } from './infrastructure/db/pgConflictoRepository.js'
import { inicializarBaseDeDatos } from './infrastructure/db/bootstrap.js'

// Casos de uso (aplicación)
import { crearLogin } from './application/use-cases/auth/login.js'
import { crearCatalogoUseCases } from './application/use-cases/catalogo/catalogoUseCases.js'
import { crearActivoUseCases } from './application/use-cases/activos/activoUseCases.js'
import { crearAdminUseCases } from './application/use-cases/admin/adminUseCases.js'
import { crearUsuarioUseCases } from './application/use-cases/admin/usuarioUseCases.js'
import { crearConflictoUseCases } from './application/use-cases/admin/conflictoUseCases.js'

// HTTP (infraestructura de entrada)
import { crearAuth, crearApiKey, soloAdmin } from './infrastructure/http/middlewares.js'
import { crearAuthController } from './infrastructure/http/controllers/authController.js'
import { crearCatalogoController } from './infrastructure/http/controllers/catalogoController.js'
import { crearActivoController } from './infrastructure/http/controllers/activoController.js'
import { crearAdminController } from './infrastructure/http/controllers/adminController.js'
import { crearUsuarioController } from './infrastructure/http/controllers/usuarioController.js'
import { crearConflictoController } from './infrastructure/http/controllers/conflictoController.js'
import { crearRutas } from './infrastructure/http/routes/index.js'
import { crearApp } from './infrastructure/http/app.js'

// --- Servicios ---
const tokenService = new JwtTokenService(config.jwtSecret)
const hashService = new BcryptHashService()

// --- Repositorios ---
const usuarioRepo = new PgUsuarioRepository(pool)
const catalogoRepo = new PgCatalogoRepository(pool)
const activoRepo = new PgActivoRepository(pool)
const movimientoRepo = new PgMovimientoRepository(pool)
const adminRepo = new PgAdminRepository(pool)
const conflictoRepo = new PgConflictoRepository(pool)

// --- Casos de uso ---
const login = crearLogin({ usuarioRepo, tokenService, hashService })
const catalogoUC = crearCatalogoUseCases({ catalogoRepo })
const activoUC = crearActivoUseCases({ activoRepo, movimientoRepo })
const adminUC = crearAdminUseCases({ adminRepo, usuarioRepo, movimientoRepo })
const usuarioUC = crearUsuarioUseCases({ usuarioRepo, hashService })
const conflictoUC = crearConflictoUseCases({ conflictoRepo })

// --- Controladores ---
const controllers = {
  authC: crearAuthController({ login }),
  catalogoC: crearCatalogoController(catalogoUC),
  activoC: crearActivoController(activoUC),
  adminC: crearAdminController(adminUC),
  usuarioC: crearUsuarioController(usuarioUC),
  conflictoC: crearConflictoController(conflictoUC),
}

// --- HTTP ---
const auth = crearAuth(tokenService)

// --- Arranque ---
// El bootstrap crea/asegura el usuario de sistema RFID y devuelve su id, que el
// middleware de API Key necesita para atribuir los activos creados por la app RFID.
inicializarBaseDeDatos({ pool, hashService, config })
  .then(({ rfidUsuarioId }) => {
    const apiKey = crearApiKey(config.rfidApiKey, rfidUsuarioId)
    const router = crearRutas({ controllers, auth, soloAdmin, apiKey, pool })
    const app = crearApp({ router, corsOrigin: config.corsOrigin })
    app.listen(config.port, () => console.log(`API lista en el puerto ${config.port}`))
  })
  .catch((e) => { console.error(e); process.exit(1) })
