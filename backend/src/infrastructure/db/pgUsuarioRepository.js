import { UsuarioRepository } from '../../domain/repositories/contracts.js'

export class PgUsuarioRepository extends UsuarioRepository {
  constructor(pool) { super(); this.pool = pool }

  async buscarActivoPorUsername(username) {
    const { rows: [u] } = await this.pool.query(
      'SELECT * FROM usuarios WHERE lower(username)=lower($1) AND activo', [username])
    return u || null
  }

  async listarActivos() {
    // Oculta el usuario de sistema RFID; solo usuarios humanos gestionables.
    const { rows } = await this.pool.query(
      `SELECT id, username, nombre, rol, activo FROM usuarios
       WHERE username <> 'rfid-system' ORDER BY activo DESC, nombre`)
    return rows
  }

  // Obtiene un usuario por id SIN exponer nunca el hash de la contraseña.
  async obtener(id) {
    const { rows: [u] } = await this.pool.query(
      'SELECT id, username, nombre, rol, activo FROM usuarios WHERE id = $1', [id])
    return u || null
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

  // Edita campos permitidos (nombre, rol, activo). Construye el SET de forma
  // dinámica solo con las claves presentes. Devuelve datos públicos (sin hash).
  async editar(id, cambios) {
    const columnas = { nombre: 'nombre', rol: 'rol', activo: 'activo' }
    const sets = []
    const valores = []
    for (const [clave, columna] of Object.entries(columnas)) {
      if (cambios[clave] !== undefined) { valores.push(cambios[clave]); sets.push(`${columna} = $${valores.length}`) }
    }
    if (!sets.length) return this.obtener(id)
    valores.push(id)
    const { rows: [u] } = await this.pool.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${valores.length}
       RETURNING id, username, nombre, rol, activo`, valores)
    return u || null
  }

  // Reemplaza el hash de la contraseña (reset por administrador).
  async cambiarPassword(id, passwordHash) {
    const { rows: [u] } = await this.pool.query(
      `UPDATE usuarios SET password_hash = $1 WHERE id = $2
       RETURNING id, username, nombre, rol, activo`, [passwordHash, id])
    return u || null
  }

  // Baja lógica: desactiva el usuario (se conserva para la bitácora).
  async desactivar(id) {
    const { rows: [u] } = await this.pool.query(
      `UPDATE usuarios SET activo = false WHERE id = $1
       RETURNING id, username, nombre, rol, activo`, [id])
    return u || null
  }
}
