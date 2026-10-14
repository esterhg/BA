import { MovimientoRepository } from '../../domain/repositories/contracts.js'

const LIM = 40

export class PgMovimientoRepository extends MovimientoRepository {
  constructor(pool) { super(); this.pool = pool }

  // Guarda una entrada en la bitácora. Nunca interrumpe la operación principal si falla.
  async registrar(m) {
    try {
      await this.pool.query(
        `INSERT INTO movimientos (activo_id, accion, codigo, antes, despues, usuario_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [m.activo_id, m.accion, m.codigo ?? null, m.antes ?? null, m.despues ?? null, m.usuario_id ?? null])
    } catch (e) { console.error('No se pudo registrar el movimiento:', e.message) }
  }

  // filtros: { cursor, accion }
  async listar({ cursor = null, accion = null }) {
    const { rows } = await this.pool.query(
      `SELECT mv.id, mv.activo_id, mv.accion, mv.codigo, mv.antes, mv.despues, mv.creado_en AS fecha,
              u.nombre AS usuario
         FROM movimientos mv
         LEFT JOIN usuarios u ON u.id = mv.usuario_id
        WHERE ($1::int IS NULL OR mv.id < $1::int)
          AND ($2::text IS NULL OR mv.accion = $2::text)
        ORDER BY mv.id DESC LIMIT ${LIM + 1}`,
      [cursor, accion])
    const page = rows.slice(0, LIM)
    const next = rows.length > LIM ? String(page[page.length - 1].id) : null
    return { items: page, next }
  }
}
