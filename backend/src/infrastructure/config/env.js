// Lectura y validación de la configuración del entorno.
// Único lugar donde se lee process.env; el resto del código recibe este objeto.
const {
  DATABASE_URL,
  JWT_SECRET,
  CORS_ORIGIN = '',
  PORT = 3000,
  ADMIN_USER = 'admin',
  ADMIN_PASSWORD,
  SEED_DEMO,
} = process.env

if (!DATABASE_URL || !JWT_SECRET) {
  console.error('Faltan DATABASE_URL o JWT_SECRET')
  process.exit(1)
}

// Un JWT_SECRET corto o por defecto permite falsificar tokens. Exigir uno robusto.
const SECRETS_INSEGUROS = ['cambia-esto', 'secret', 'changeme', 'jwt-secret', 'clave']
if (JWT_SECRET.length < 32 || SECRETS_INSEGUROS.includes(JWT_SECRET.toLowerCase())) {
  console.error('JWT_SECRET inseguro: usa una cadena aleatoria de al menos 32 caracteres (ej: openssl rand -hex 32).')
  process.exit(1)
}

// En producción, exigir un CORS_ORIGIN explícito en vez de aceptar cualquiera.
if (process.env.NODE_ENV === 'production' && !CORS_ORIGIN) {
  console.error('En producción debes definir CORS_ORIGIN (dominios del frontend separados por coma).')
  process.exit(1)
}

export const config = {
  databaseUrl: DATABASE_URL,
  jwtSecret: JWT_SECRET,
  corsOrigin: CORS_ORIGIN,
  port: PORT,
  adminUser: ADMIN_USER,
  adminPassword: ADMIN_PASSWORD,
  seedDemo: SEED_DEMO === 'true',
}
