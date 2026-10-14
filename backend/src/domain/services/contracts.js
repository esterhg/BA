// Contratos de servicios de seguridad. La aplicación los usa sin saber que
// detrás están jsonwebtoken y bcryptjs (eso vive en infraestructura).
const noImpl = (nombre) => { throw new Error(`No implementado: ${nombre}`) }

export class TokenService {
  firmar(_payload) { return noImpl('TokenService.firmar') }
  verificar(_token) { return noImpl('TokenService.verificar') }
}

export class HashService {
  comparar(_texto, _hash) { return noImpl('HashService.comparar') }
  hashear(_texto) { return noImpl('HashService.hashear') }
}
