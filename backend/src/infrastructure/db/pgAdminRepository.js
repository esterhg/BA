import { AdminRepository } from '../../domain/repositories/contracts.js'

export class PgAdminRepository extends AdminRepository {
  constructor(pool) { super(); this.pool = pool }

  // filtros: { desde, hasta, edificioId, usuarioId }
  // El rango se aplica sobre a.creado_en; "hasta" es inclusivo (hasta el fin de ese día).
  async resumen({ desde = null, hasta = null, edificioId = null, usuarioId = null }) {
    const P = [desde, hasta, edificioId, usuarioId]
    const filtroActivos = `
        ($1::date IS NULL OR a.creado_en >= $1::date)
        AND ($2::date IS NULL OR a.creado_en < ($2::date + INTERVAL '1 day'))
        AND ($3::int IS NULL OR n.edificio_id = $3::int)
        AND ($4::int IS NULL OR a.usuario_id = $4::int)`

    const [tot, usuarios, modelos, conflictos, porEdificio, porUsuario, porDia] = await Promise.all([
      this.pool.query(`SELECT count(*)::int AS n FROM activos a JOIN niveles n ON n.id = a.nivel_id WHERE ${filtroActivos}`, P),
      this.pool.query('SELECT count(*)::int AS n FROM usuarios WHERE activo'),
      this.pool.query('SELECT count(*)::int AS n FROM modelos'),
      this.pool.query('SELECT count(*)::int AS n FROM conflictos_sync'),
      this.pool.query(`
        SELECT e.nombre AS edificio, count(a.id)::int AS total
          FROM edificios e
          LEFT JOIN niveles n ON n.edificio_id = e.id
          LEFT JOIN activos a ON a.nivel_id = n.id AND (${filtroActivos})
         GROUP BY e.id ORDER BY e.nombre`, P),
      this.pool.query(`
        SELECT u.nombre AS usuario, count(a.id)::int AS total
          FROM usuarios u
          LEFT JOIN activos a ON a.usuario_id = u.id
          LEFT JOIN niveles n ON n.id = a.nivel_id
         WHERE u.activo AND (a.id IS NULL OR (${filtroActivos}))
         GROUP BY u.id HAVING count(a.id) > 0 ORDER BY total DESC`, P),
      this.pool.query(`
        SELECT to_char(a.creado_en, 'YYYY-MM-DD') AS dia, count(*)::int AS total
          FROM activos a JOIN niveles n ON n.id = a.nivel_id
         WHERE ${filtroActivos}
         GROUP BY dia ORDER BY dia DESC LIMIT 31`, P),
    ])
    return {
      activos: tot.rows[0].n,
      usuarios: usuarios.rows[0].n,
      modelos: modelos.rows[0].n,
      conflictos: conflictos.rows[0].n,
      porEdificio: porEdificio.rows,
      porUsuario: porUsuario.rows,
      porDia: porDia.rows,
      filtros: { desde, hasta, edificio_id: edificioId, usuario_id: usuarioId },
    }
  }
}
