import { Errores } from '../shared/errors.js'
import { esUuid, esIdValido, textoValido, esEpc, LIMITES } from '../shared/validators.js'

// Valida y normaliza un EPC de etiqueta RFID.
// Recorta espacios y lo pasa a MAYÚSCULAS para que la unicidad sea consistente.
// Devuelve el EPC normalizado o lanza DomainError.
export function normalizarEpc(valor) {
  if (typeof valor !== 'string') throw Errores.invalido('El EPC debe ser texto.')
  const epc = valor.trim().toUpperCase()
  if (!epc) throw Errores.invalido('Falta el EPC.')
  if (!esEpc(epc)) throw Errores.invalido('EPC no válido: debe ser hexadecimal, de longitud par, entre 16 y 32 caracteres.')
  return epc
}

// Reglas de negocio del activo. No sabe nada de Express ni de PostgreSQL.

// Valida y normaliza los datos para crear/editar un activo vía CRUD directo.
// Rechaza tipos equivocados, vacíos y textos demasiado largos.
// Devuelve { codigo, serie, modelo_id, nivel_id } o lanza DomainError.
export function normalizarActivo(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw Errores.invalido('Datos vacíos.')
  if (typeof b.codigo !== 'string' || typeof b.serie !== 'string')
    throw Errores.invalido('El código y la serie deben ser texto.')
  const codigo = b.codigo.trim(), serie = b.serie.trim()
  if (!codigo || !serie) throw Errores.invalido('Falta el código o la serie.')
  if (!textoValido(codigo, LIMITES.codigo)) throw Errores.invalido(`El código supera ${LIMITES.codigo} caracteres.`)
  if (!textoValido(serie, LIMITES.serie)) throw Errores.invalido(`La serie supera ${LIMITES.serie} caracteres.`)
  if (!esIdValido(b.modelo_id) || !esIdValido(b.nivel_id))
    throw Errores.invalido('Falta el modelo o el nivel, o no son válidos.')
  return { codigo, serie, modelo_id: b.modelo_id, nivel_id: b.nivel_id }
}

// Valida y normaliza los datos para crear un activo CON su EPC en un solo paso
// (flujo de la app RFID). Reutiliza las reglas de activo y de EPC.
// Devuelve { codigo, serie, modelo_id, nivel_id, epc } o lanza DomainError.
export function normalizarActivoConEpc(b) {
  const base = normalizarActivo(b)
  const epc = normalizarEpc(b?.epc)
  return { ...base, epc }
}

// Valida un registro proveniente de la cola offline (sincronización).
// Devuelve mensaje de error (string) o null si es válido — se usa por lote.
export function validarRegistroSync(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'Registro vacío.'
  if (!esUuid(r.id) || !esUuid(r.sesion_id)) return 'Identificador de registro o sesión no válido.'
  if (typeof r.codigo !== 'string' || typeof r.serie !== 'string') return 'El código y la serie deben ser texto.'
  if (!r.codigo.trim() || !r.serie.trim()) return 'Falta el código o la serie.'
  if (r.codigo.trim().length > LIMITES.codigo || r.serie.trim().length > LIMITES.serie) return 'Código o serie demasiado largos.'
  if (!esIdValido(r.modelo_id) || !esIdValido(r.nivel_id)) return 'Falta el modelo o el nivel, o no son válidos.'
  if (isNaN(Date.parse(r.capturado_en))) return 'Fecha de captura no válida.'
  return null
}
