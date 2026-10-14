import pg from 'pg'
import { config } from '../config/env.js'

// Pool de conexiones a PostgreSQL. Detalle de infraestructura:
// los repositorios dependen de este pool, nunca el dominio.
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })
