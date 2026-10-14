import jwt from 'jsonwebtoken'
import { TokenService } from '../../domain/services/contracts.js'

// Implementación de TokenService con jsonwebtoken.
export class JwtTokenService extends TokenService {
  constructor(secret) { super(); this.secret = secret }
  firmar(payload) { return jwt.sign(payload, this.secret, { expiresIn: '12h' }) }
  verificar(token) { return jwt.verify(token, this.secret) }
}
