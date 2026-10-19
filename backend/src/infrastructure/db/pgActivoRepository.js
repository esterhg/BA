import { ActivoRepository } from '../../domain/repositories/contracts.js'
import { Errores } from '../../domain/shared/errors.js'
import { escaparLike } from '../../domain/shared/validators.js'

// Traduce el choque de índice único a un mensaje de qué campo está duplicado.
const mensajeUnico = (e) =>
  e.constraint === 'activos_codigo_uq' ? 'Ya existe un activo con ese código.' :
  e.constraint === 'activos_serie_uq' ? 'Ya existe un activo con esa serie.' :
  e.constraint === 'activos_epc_uq' ? 'Ese EPC ya está vinculado a otro activo.' : null

// Convierte errores de PostgreSQL (23505/23503) en DomainError con mensaje claro.
function traducirError(e) {
  const dup = e.code === '23505' && mensajeUnico(e)
  if (dup) return Errores.duplicado(dup)
  if (e.code === '23503') return Errores.invalido('El modelo o el nivel no existe.')
  return e
}

const LIM = 30

export class PgActivoRepository extends ActivoRepository {
  constructor(pool) { super(); this.pool = pool }

  // filtros: { q, cursor, edificioId, nivelId, serie, esAdmin }
  async listar({ q = '', cursor = null, edificioId = null, nivelId = null, serie = '', esAdmin = false }) {
    const { rows } = await this.pool.query(
      `SELECT a.seq, a.id, a.codigo, a.serie, a.modelo_id, a.nivel_id,
              m.nombre AS modelo, e.nombre AS edificio, n.nombre AS nivel,
              u.nombre AS usuario, a.creado_en AS fecha
         FROM activos a
         JOIN modelos m ON m.id = a.modelo_id
         JOIN niveles n ON n.id = a.nivel_id JOIN edificios e ON e.id = n.edificio_id
         JOIN usuarios u ON u.id = a.usuario_id
        WHERE ($1::text = '' OR a.codigo ILIKE $2 OR a.serie ILIKE $2 OR m.nombre ILIKE $2 OR e.nombre ILIKE $2 OR n.nombre ILIKE $2)
          AND ($3::bigint IS NULL OR a.seq < $3::bigint)
          AND ($4::int IS NULL OR e.id = $4::int)
          AND ($5::text = '' OR a.serie ILIKE $6)
          AND ($7::int IS NULL OR a.nivel_id = $7::int)
        ORDER BY a.seq DESC LIMIT ${LIM + 1}`,
      [q, `%${escaparLike(q)}%`, cursor, edificioId, serie, `${escaparLike(serie)}%`, nivelId])
    const page = rows.slice(0, LIM)
    const next = rows.length > LIM ? String(page[page.length - 1].seq) : null
    const items = page.map(({ seq, usuario, fecha, ...a }) => (esAdmin ? { ...a, usuario, fecha } : a))
    return { items, next }
  }

  async obtenerCrudo(id) {
    const { rows: [a] } = await this.pool.query(
      'SELECT id, codigo, serie, epc, modelo_id, nivel_id FROM activos WHERE id = $1', [id])
    return a || null
  }

  async obtenerCompleto(id) {
    const { rows: [a] } = await this.pool.query(
      `SELECT a.id, a.codigo, a.serie, a.epc, a.modelo_id, a.nivel_id,
              m.nombre AS modelo, e.nombre AS edificio, n.nombre AS nivel,
              u.nombre AS usuario, a.creado_en AS fecha
         FROM activos a
         JOIN modelos m ON m.id = a.modelo_id
         JOIN niveles n ON n.id = a.nivel_id JOIN edificios e ON e.id = n.edificio_id
         JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.id = $1`, [id])
    return a
  }

  async crear({ codigo, serie, modelo_id, nivel_id }, usuarioId) {
    try {
      const { rows: [nuevo] } = await this.pool.query(
        `INSERT INTO activos (id, codigo, serie, modelo_id, nivel_id, usuario_id, capturado_en)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now()) RETURNING id`,
        [codigo, serie, modelo_id, nivel_id, usuarioId])
      return this.obtenerCompleto(nuevo.id)
    } catch (e) { throw traducirError(e) }
  }

  async editar(id, { codigo, serie, modelo_id, nivel_id }) {
    try {
      const { rowCount } = await this.pool.query(
        'UPDATE activos SET codigo = $1, serie = $2, modelo_id = $3, nivel_id = $4 WHERE id = $5',
        [codigo, serie, modelo_id, nivel_id, id])
      if (!rowCount) return null
      return this.obtenerCompleto(id)
    } catch (e) { throw traducirError(e) }
  }

  async eliminar(id) {
    const { rowCount } = await this.pool.query('DELETE FROM activos WHERE id = $1', [id])
    return rowCount > 0
  }

  // --- EPC / RFID --------------------------------------------------------
  // Crea un activo con su EPC en una sola operación (flujo app RFID).
  async crearConEpc({ codigo, serie, modelo_id, nivel_id, epc }, usuarioId) {
    try {
      const { rows: [nuevo] } = await this.pool.query(
        `INSERT INTO activos (id, codigo, serie, epc, modelo_id, nivel_id, usuario_id, capturado_en)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, now()) RETURNING id`,
        [codigo, serie, epc, modelo_id, nivel_id, usuarioId])
      return this.obtenerCompleto(nuevo.id)
    } catch (e) { throw traducirError(e) }
  }

  // Devuelve el activo (con datos legibles) al que pertenece un EPC, o null.
  // Lo usa la app RFID al escanear una etiqueta.
  async buscarPorEpc(epc) {
    const { rows: [a] } = await this.pool.query(
      `SELECT a.id, a.codigo, a.serie, a.epc, a.modelo_id, a.nivel_id,
              m.nombre AS modelo, e.nombre AS edificio, n.nombre AS nivel,
              u.nombre AS usuario, a.creado_en AS fecha
         FROM activos a
         JOIN modelos m ON m.id = a.modelo_id
         JOIN niveles n ON n.id = a.nivel_id JOIN edificios e ON e.id = n.edificio_id
         JOIN usuarios u ON u.id = a.usuario_id
        WHERE a.epc = $1`, [epc])
    return a || null
  }

  // Vincula (o reasigna) el EPC a un activo. El índice único parcial garantiza
  // que un EPC no quede en dos activos a la vez. Devuelve el activo o null si no existe.
  async vincularEpc(id, epc) {
    try {
      const { rowCount } = await this.pool.query(
        'UPDATE activos SET epc = $1 WHERE id = $2', [epc, id])
      if (!rowCount) return null
      return this.obtenerCompleto(id)
    } catch (e) { throw traducirError(e) }
  }

  // Quita el EPC de un activo (lo deja en NULL). Devuelve el activo o null si no existe.
  async desvincularEpc(id) {
    const { rowCount } = await this.pool.query(
      'UPDATE activos SET epc = NULL WHERE id = $1', [id])
    if (!rowCount) return null
    return this.obtenerCompleto(id)
  }

  // Procesa un registro de la cola offline. Devuelve el resultado por registro
  // ({ id, estado, ... }). Mantiene la semántica original de conflictos.
  async sincronizarRegistro(r, usuarioId, inmediato) {
    const codigo = String(r.codigo).trim(), serie = String(r.serie).trim()
    try {
      // La sesión se crea en el servidor si no existe.
      await this.pool.query(
        'INSERT INTO sesiones (id, nivel_id, usuario_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [r.sesion_id, r.nivel_id, usuarioId])

      // El índice único decide quién gana si dos personas registran lo mismo a la vez.
      const ins = await this.pool.query(
        `INSERT INTO activos (id, codigo, serie, modelo_id, nivel_id, sesion_id, usuario_id, capturado_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [r.id, codigo, serie, r.modelo_id, r.nivel_id, r.sesion_id, usuarioId, r.capturado_en])
      if (ins.rowCount === 1) return { id: r.id, estado: 'ok' }

      // No se insertó: ¿reintento del mismo registro o duplicado real?
      const { rows: [ex] } = await this.pool.query(
        `SELECT a.id, a.codigo, e.nombre AS edificio, n.nombre AS nivel, u.nombre AS usuario, a.creado_en AS fecha
           FROM activos a
           JOIN niveles n ON n.id = a.nivel_id JOIN edificios e ON e.id = n.edificio_id
           JOIN usuarios u ON u.id = a.usuario_id
          WHERE a.id = $1 OR lower(a.codigo) = lower($2) OR lower(a.serie) = lower($3)
          ORDER BY (a.id = $1) DESC LIMIT 1`,
        [r.id, codigo, serie])
      if (!ex) throw new Error('Conflicto no resuelto')
      if (ex.id === r.id) return { id: r.id, estado: 'ok' }

      if (!inmediato) await this.pool.query('INSERT INTO conflictos_sync (registro, usuario_id) VALUES ($1,$2)', [r, usuarioId])
      const campo = ex.codigo.toLowerCase() === codigo.toLowerCase() ? 'código' : 'serie'
      return { id: r.id, estado: 'duplicado', campo, existente: { edificio: ex.edificio, nivel: ex.nivel, usuario: ex.usuario, fecha: ex.fecha } }
    } catch (e) {
      // Solo los datos rotos (FK) se marcan como inválidos; otros errores se propagan.
      if (e.code !== '23503') throw e
      return { id: r.id, estado: 'invalido', mensaje: 'El modelo o el nivel ya no existe en el servidor.' }
    }
  }
}
