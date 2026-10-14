// Acceso a IndexedDB: cola offline de capturas + caché de catálogos.
const open = () => new Promise((ok, fail) => {
  const r = indexedDB.open('inventario', 1)
  r.onupgradeneeded = () => { r.result.createObjectStore('cola', { keyPath: 'id' }); r.result.createObjectStore('cache') }
  r.onsuccess = () => ok(r.result)
  r.onerror = () => fail(r.error)
})

const tx = async (store, mode, fn) => {
  const db = await open()
  return new Promise((ok, fail) => {
    const t = db.transaction(store, mode), req = fn(t.objectStore(store))
    t.oncomplete = () => ok(req.result); t.onerror = () => fail(t.error)
  })
}

export const dbPut = (s, v, k) => tx(s, 'readwrite', (o) => o.put(v, k))
export const dbGet = (s, k) => tx(s, 'readonly', (o) => o.get(k))
export const dbAll = (s) => tx(s, 'readonly', (o) => o.getAll())
export const dbDelete = (s, k) => tx(s, 'readwrite', (o) => o.delete(k))
