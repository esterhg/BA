import { UsuarioRepository } from '../../domain/repositories/contracts.js'

export class PgUsuarioRepository extends UsuarioRepository {
  constructor(pool) { super(); this.pool = pool }

  async buscarActivoPorUsername(username) {
    const { rows: [u] } = await this.pool.query(
      'SELECT * FROM usuarios WHERE lower(username)=lower($1) AND activo', [username])
    return u || null
  }

  async listarActivos() {
    const { rows } = await this.pool.query(
      'SELECT id, nombre, rol FROM usuarios WHERE activo ORDER BY nombre')
    return rows
  }

  async existeUsername(username) {
    const { rows } = await this.pool.query(
      'SELECT 1 FROM usuarios WHERE lower(username) = lower($1) LIMIT 1', [username])
    return rows.length > 0
  }

  // Crea un usuario con el hash ya calculado. Devuelve datos públicos (sin hash).
  async crear({ username, nombre, passwordHash, rol }) {
    const { rows: [u] } = await this.pool.query(
      `INSERT INTO usuarios (username, nombre, password_hash, rol)
       VALUES ($1,$2,$3,$4) RETURNING id, username, nombre, rol, activo`,
      [username, nombre, passwordHash, rol])
    return u
  }
}
