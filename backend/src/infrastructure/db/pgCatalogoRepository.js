import { CatalogoRepository } from '../../domain/repositories/contracts.js'
import { Errores } from '../../domain/shared/errors.js'

export class PgCatalogoRepository extends CatalogoRepository {
  constructor(pool) { super(); this.pool = pool }

  async listarUbicaciones() {
    const { rows } = await this.pool.query(`
      SELECT e.id, e.nombre,
        COALESCE(json_agg(json_build_object('id', n.id, 'nombre', n.nombre) ORDER BY n.id) FILTER (WHERE n.id IS NOT NULL), '[]') AS niveles
      FROM edificios e LEFT JOIN niveles n ON n.edificio_id = e.id
      GROUP BY e.id ORDER BY e.nombre`)
    return rows
  }

  async listarModelos() {
    const { rows } = await this.pool.query(
      'SELECT id, nombre, tipo, imagen_url FROM modelos ORDER BY nombre')
    return rows
  }

  async crearModelo(m) {
    const { rows: [nuevo] } = await this.pool.query(
      'INSERT INTO modelos (nombre, tipo, imagen_url) VALUES ($1,$2,$3) RETURNING id, nombre, tipo, imagen_url',
      [m.nombre, m.tipo, m.imagen_url])
    return nuevo
  }

  async editarModelo(id, m) {
    const { rows: [actualizado] } = await this.pool.query(
      'UPDATE modelos SET nombre=$1, tipo=$2, imagen_url=$3 WHERE id=$4 RETURNING id, nombre, tipo, imagen_url',
      [m.nombre, m.tipo, m.imagen_url, id])
    if (!actualizado) throw Errores.noEncontrado('El modelo ya no existe.')
    return actualizado
  }
}
