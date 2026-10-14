// Helpers de validación puros, sin dependencias de framework ni BD.
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const esUuid = (v) => UUID.test(String(v || ''))
export const esEnteroPositivo = (v) => /^\d+$/.test(String(v ?? ''))
export const esFechaIso = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))

// Escapa comodines de LIKE para que la entrada del usuario sea literal.
export const escaparLike = (s) => String(s ?? '').replace(/[%_\\]/g, '\\$&')

// Límites de longitud para campos de texto (defensa contra payloads inflados).
export const LIMITES = {
  codigo: 100,
  serie: 100,
  nombreModelo: 150,
  tipoModelo: 80,
  imagenUrl: 2048,
  username: 100,
  password: 200,
  nombreUsuario: 150,
  passwordMin: 8,
}

// Un texto es "limpio" si es string, no vacío tras recortar y dentro del máximo.
export const textoValido = (v, max) => {
  if (typeof v !== 'string') return false
  const t = v.trim()
  return t.length > 0 && t.length <= max
}

// Entero seguro dentro de un rango razonable para IDs (rechaza floats y basura).
export const esIdValido = (v) => Number.isInteger(v) && v > 0 && v <= 2147483647
