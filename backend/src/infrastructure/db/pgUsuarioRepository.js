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
}
