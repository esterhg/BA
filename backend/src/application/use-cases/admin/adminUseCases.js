// Casos de uso de administración: resumen filtrable, usuarios y bitácora.
export function crearAdminUseCases({ adminRepo, usuarioRepo, movimientoRepo }) {
  return {
    resumen: (filtros) => adminRepo.resumen(filtros),
    listarUsuarios: () => usuarioRepo.listarActivos(),
    listarMovimientos: (filtros) => movimientoRepo.listar(filtros),
  }
}
