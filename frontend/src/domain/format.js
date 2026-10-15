// Utilidades puras de formato y texto, sin React ni acceso a red.

// Normaliza texto para búsquedas: minúsculas y sin acentos.
export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Genera un UUID v4. Usa crypto.randomUUID si está disponible (HTTPS/localhost);
// si no (contexto HTTP), cae a crypto.getRandomValues, y como último recurso Math.random.
export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = crypto.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40           // versión 4
    b[8] = (b[8] & 0x3f) | 0x80           // variante
    const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`
  }
  // Último recurso (poco probable): basado en Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Fecha local en formato YYYY-MM-DD (para inputs date y filtros).
export const hoyISO = () => new Date().toLocaleDateString('en-CA')
export const primerDiaMesISO = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA')
}

// Escapa un valor para una celda CSV.
export const csvEscape = (v) => {
  const s = String(v ?? '')
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Mensaje legible para un conflicto/duplicado devuelto por el servidor.
export const mensajeDuplicado = (x) =>
  x.estado === 'invalido' ? `No se pudo guardar: ${x.mensaje}` :
  `El ${x.campo} ya fue registrado en ${x.existente.edificio} · Nivel ${x.existente.nivel}, por ${x.existente.usuario} el ${new Date(x.existente.fecha).toLocaleString('es')}.`
