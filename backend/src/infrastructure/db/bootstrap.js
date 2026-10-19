import { readFileSync } from 'node:fs'

// Arranque de la base de datos: aplica el esquema, crea el administrador inicial
// y, si procede, carga datos demo. Es un detalle de infraestructura.
export async function inicializarBaseDeDatos({ pool, hashService, config }) {
  // schema.sql vive en la raíz de backend/ (dos niveles arriba de src/infrastructure/db).
  const schema = readFileSync(new URL('../../../schema.sql', import.meta.url), 'utf8')
  await pool.query(schema)

  const { rows: [{ n: usuarios }] } = await pool.query('SELECT count(*)::int AS n FROM usuarios')
  if (!usuarios && config.adminPassword) {
    await pool.query(
      'INSERT INTO usuarios (username, nombre, password_hash, rol) VALUES ($1,$2,$3,$4)',
      [config.adminUser, 'Administrador', await hashService.hashear(config.adminPassword), 'administrador'])
    console.log(`Administrador "${config.adminUser}" creado`)
  }

  // Usuario de sistema para la app RFID. Los activos creados vía API Key se le
  // atribuyen (activos.usuario_id es NOT NULL). Queda inactivo y con una clave
  // imposible de usar: no puede iniciar sesión, solo sirve de autor en la bitácora.
  const { rows: [rfid] } = await pool.query(
    `INSERT INTO usuarios (username, nombre, password_hash, rol, activo)
     VALUES ('rfid-system', 'App RFID', 'x', 'operador', false)
     ON CONFLICT (lower(username)) DO UPDATE SET username = EXCLUDED.username
     RETURNING id`)
  const rfidUsuarioId = rfid.id
  console.log(`Usuario de sistema RFID disponible (id ${rfidUsuarioId})`)

  if (config.seedDemo) {
    const { rows: [{ n }] } = await pool.query('SELECT count(*)::int AS n FROM edificios')
    if (!n) {
      const a = (await pool.query("INSERT INTO edificios (nombre) VALUES ('Torre A') RETURNING id")).rows[0].id
      const b = (await pool.query("INSERT INTO edificios (nombre) VALUES ('Torre B') RETURNING id")).rows[0].id
      for (const nv of ['1', '2', '3']) await pool.query('INSERT INTO niveles (edificio_id, nombre) VALUES ($1,$2)', [a, nv])
      for (const nv of ['1', '2']) await pool.query('INSERT INTO niveles (edificio_id, nombre) VALUES ($1,$2)', [b, nv])
      await pool.query(`INSERT INTO modelos (nombre, tipo) VALUES
        ('Dell Latitude 5420','Laptop'),('Cisco 2960','Switch'),('HP LaserJet M404','Impresora'),('Dell OptiPlex 7090','Escritorio')`)
      await pool.query(
        "INSERT INTO usuarios (username, nombre, password_hash) VALUES ('operador','Operador demo',$1) ON CONFLICT DO NOTHING",
        [await hashService.hashear('operador123')])
      console.log('Datos demo cargados (usuario operador / operador123)')
    }
  }

  // Se devuelve para que el composition root lo inyecte donde haga falta
  // (p. ej. el middleware de API Key, como autor de los activos creados por RFID).
  return { rfidUsuarioId }
}
