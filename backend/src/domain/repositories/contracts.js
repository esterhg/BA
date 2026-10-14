// Contratos (puertos) de los repositorios. La capa de aplicación depende de
// estas firmas; la infraestructura (PostgreSQL) las implementa. Esto invierte la
// dependencia: el negocio no conoce la base de datos.
//
// En JS no hay interfaces nativas; estas clases documentan el contrato y, si se
// usan sin implementar, fallan explícitamente.
const noImpl = (nombre) => { throw new Error(`No implementado: ${nombre}`) }

export class UsuarioRepository {
  buscarActivoPorUsername(_username) { return noImpl('UsuarioRepository.buscarActivoPorUsername') }
  listarActivos() { return noImpl('UsuarioRepository.listarActivos') }
}

export class CatalogoRepository {
  listarUbicaciones() { return noImpl('CatalogoRepository.listarUbicaciones') }
  listarModelos() { return noImpl('CatalogoRepository.listarModelos') }
  crearModelo(_datos) { return noImpl('CatalogoRepository.crearModelo') }
  editarModelo(_id, _datos) { return noImpl('CatalogoRepository.editarModelo') }
}

export class ActivoRepository {
  listar(_filtros) { return noImpl('ActivoRepository.listar') }
  obtenerCrudo(_id) { return noImpl('ActivoRepository.obtenerCrudo') }
  obtenerCompleto(_id) { return noImpl('ActivoRepository.obtenerCompleto') }
  crear(_datos, _usuarioId) { return noImpl('ActivoRepository.crear') }
  editar(_id, _datos) { return noImpl('ActivoRepository.editar') }
  eliminar(_id) { return noImpl('ActivoRepository.eliminar') }
  sincronizarRegistro(_r, _usuarioId, _inmediato) { return noImpl('ActivoRepository.sincronizarRegistro') }
}

export class MovimientoRepository {
  registrar(_movimiento) { return noImpl('MovimientoRepository.registrar') }
  listar(_filtros) { return noImpl('MovimientoRepository.listar') }
}

export class AdminRepository {
  resumen(_filtros) { return noImpl('AdminRepository.resumen') }
}
