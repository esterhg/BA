// Utilidades puras de formato y texto, sin React ni acceso a red.

// Normaliza texto para búsquedas: minúsculas y sin acentos.
export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
