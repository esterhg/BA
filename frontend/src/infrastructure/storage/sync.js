// Catálogos con caché y sincronización de la cola offline con el servidor.
import { api } from '../api/client.js'
import { dbPut, dbGet, dbAll } from './db.js'

// Carga catálogos del servidor; si falla, usa la última caché local.
export async function cargarCatalogos() {
  try {
    const [modelos, ubicaciones] = await Promise.all([api('/modelos'), api('/ubicaciones')])
    await dbPut('cache', modelos, 'modelos'); await dbPut('cache', ubicaciones, 'ubicaciones')
    return { modelos, ubicaciones }
  } catch {
    return { modelos: (await dbGet('cache', 'modelos')) || [], ubicaciones: (await dbGet('cache', 'ubicaciones')) || [] }
  }
}

// Sube la cola pendiente al servidor en lotes de 50 y actualiza su estado local.
let syncing = false
export async function sincronizar() {
  if (syncing) return { ok: 0, conflictos: 0 }
  syncing = true
  try {
    const pendientes = (await dbAll('cola')).filter((r) => r.estado === 'pendiente')
    let ok = 0, conflictos = 0
    for (let i = 0; i < pendientes.length; i += 50) {
      const lote = pendientes.slice(i, i + 50)
      const { resultados } = await api('/activos/sync', {
        registros: lote.map(({ estado, detalle, modelo_nombre, ...r }) => r),
      })
      for (const x of resultados) {
        const r = lote.find((l) => l.id === x.id)
        if (!r) continue
        if (x.estado === 'ok') { r.estado = 'sincronizado'; ok++ }
        else { r.estado = 'conflicto'; r.detalle = x; conflictos++ }
        await dbPut('cola', r)
      }
    }
    return { ok, conflictos }
  } finally { syncing = false }
}
