import rateLimit from 'express-rate-limit'

// Limitadores de tasa: frenan fuerza bruta y abuso de la API desde cualquier
// cliente (consola, curl, scripts). La ventana y el máximo son conservadores.

// Login: pocos intentos por ventana para dificultar adivinar contraseñas.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 minutos
  max: 10,                            // 10 intentos por IP en la ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' },
})

// Escritura (crear/editar/eliminar/sincronizar): evita spam masivo.
export const escrituraLimiter = rateLimit({
  windowMs: 60 * 1000,               // 1 minuto
  max: 120,                           // 120 escrituras por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiadas operaciones seguidas. Espera un momento.' },
})

// General para toda la API: red de seguridad amplia contra scraping/abuso.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,               // 1 minuto
  max: 600,                           // 600 peticiones por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiadas peticiones. Espera un momento.' },
})
