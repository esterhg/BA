import { Errores } from '../shared/errors.js'
import { LIMITES } from '../shared/validators.js'

// Reglas de negocio del modelo de catálogo.

// Valida y normaliza los datos de un modelo. Devuelve { nombre, tipo, imagen_url }
// con tipo/imagen en null si vienen vacíos, o lanza DomainError.
export function normalizarModelo(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw Errores.invalido('Datos vacíos.')
  if (typeof b.nombre !== 'string') throw Errores.invalido('El nombre debe ser texto.')
  const nombre = b.nombre.trim()
  if (!nombre) throw Errores.invalido('El nombre es obligatorio.')
  if (nombre.length > LIMITES.nombreModelo) throw Errores.invalido(`El nombre supera ${LIMITES.nombreModelo} caracteres.`)

  // tipo e imagen son opcionales; si vienen, deben ser texto y respetar el máximo.
  if (b.tipo != null && typeof b.tipo !== 'string') throw Errores.invalido('El tipo debe ser texto.')
  if (b.imagen_url != null && typeof b.imagen_url !== 'string') throw Errores.invalido('La imagen debe ser texto.')
  const tipo = (b.tipo ?? '').trim()
  const imagen = (b.imagen_url ?? '').trim()
  if (tipo.length > LIMITES.tipoModelo) throw Errores.invalido(`El tipo supera ${LIMITES.tipoModelo} caracteres.`)
  if (imagen.length > LIMITES.imagenUrl) throw Errores.invalido('La URL de la imagen es demasiado larga.')
  if (imagen && !/^https?:\/\//i.test(imagen))
    throw Errores.invalido('La imagen debe ser una URL que empiece con http:// o https://')

  return { nombre, tipo: tipo || null, imagen_url: imagen || null }
}
