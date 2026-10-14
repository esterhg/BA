import bcrypt from 'bcryptjs'
import { HashService } from '../../domain/services/contracts.js'

// Implementación de HashService con bcryptjs.
export class BcryptHashService extends HashService {
  comparar(texto, hash) { return bcrypt.compare(texto, hash) }
  hashear(texto) { return bcrypt.hash(texto, 10) }
}
