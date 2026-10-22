import { ConflictoRepository } from '../../domain/repositories/contracts.js'

const LIM = 40

// Lista los conflictos de sincronización (tabla conflictos_sync). El registro en
// conflicto se guarda como jsonb; de ahí se extraen modelo_id/nivel_id/etc. y se
// unen con los catálogos para devolver nombres legibles.
export class PgConflictoRepository extends ConflictoRepository {
  constructor(pool) { super(); this.pool = pool }

  // filtros: { cursor, modeloId, nivelId, fechaDesde, fechaHasta }
  // fechaDesde/fechaHasta: 'YYYY-MM-DD' (inclusivas), aplicadas sobre creado_en.
  async listar({ cursor = null, modeloId = null, nivelId = null, fechaDesde = null, fechaHasta = null }) {
    const { rows } = await this.pool.query(
      `SELECT c.id,
              c.creado_en AS fecha,
              (c.registro->>'codigo')      AS codigo,
              (c.registro->>'serie')       AS serie,
              (c.registro->>'modelo_id')::int AS modelo_id,
              (c.registro->>'nivel_id')::int  AS nivel_id,
              (c.registro->>'capturado_en')   AS capturado_en,
              m.nombre AS modelo,
              n.nombre AS nivel,
              e.nombre AS edificio,
              u.nombre AS usuario,
              c.registro AS registro
         FROM conflictos_sync c
         LEFT JOIN modelos m  ON m.id = (c.registro->>'modelo_id')::int
         LEFT JOIN niveles n  ON n.id = (c.registro->>'nivel_id')::int
         LEFT JOIN edificios e ON e.id = n.edificio_id
         LEFT JOIN usuarios u ON u.id = c.usuario_id
        WHERE ($1::int IS NULL OR c.id < $1::int)
          AND ($2::int IS NULL OR (c.registro->>'modelo_id')::int = $2::int)
          AND ($3::int IS NULL OR (c.registro->>'nivel_id')::int = $3::int)
          AND ($4::date IS NULL OR c.creado_en >= $4::date)
          AND ($5::date IS NULL OR c.creado_en < ($5::date + INTERVAL '1 day'))
        ORDER BY c.id DESC LIMIT ${LIM + 1}`,
      [cursor, modeloId, nivelId, fechaDesde, fechaHasta])
    const page = rows.slice(0, LIM)
    const next = rows.length > LIM ? String(page[page.length - 1].id) : null
    return { items: page, next }
  }
}
