// Errores de dominio: expresan QUÉ salió mal en términos de negocio,
// sin saber nada de HTTP. La capa HTTP los traduce a códigos de estado.
export class DomainError extends Error {
  constructor(mensaje, codigo = 'INVALIDO') {
    super(mensaje)
    this.name = 'DomainError'
    this.codigo = codigo // INVALIDO | NO_ENCONTRADO | DUPLICADO | NO_AUTORIZADO | PROHIBIDO
  }
}

export const Errores = {
  invalido: (m) => new DomainError(m, 'INVALIDO'),
  noEncontrado: (m) => new DomainError(m, 'NO_ENCONTRADO'),
  duplicado: (m) => new DomainError(m, 'DUPLICADO'),
  noAutorizado: (m) => new DomainError(m, 'NO_AUTORIZADO'),
  prohibido: (m) => new DomainError(m, 'PROHIBIDO'),
}
