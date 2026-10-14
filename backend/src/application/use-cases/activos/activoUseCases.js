import { normalizarActivo, validarRegistroSync } from '../../../domain/entities/activo.js'
import { Errores } from '../../../domain/shared/errors.js'

// Casos de uso de activos: listar, CRUD y sincronización por lotes.
// La bitácora de movimientos se registra tras cada operación de escritura.
export function crearActivoUseCases({ activoRepo, movimientoRepo }) {
  return {
    listar: (filtros) => activoRepo.listar(filtros),

    crear: async (datos, usuario) => {
      const limpio = normalizarActivo(datos)
      const creado = await activoRepo.crear(limpio, usuario.id)
      await movimientoRepo.registrar({
        activo_id: creado.id, accion: 'crear', codigo: limpio.codigo,
        despues: limpio, usuario_id: usuario.id,
      })
      return creado
    },

    editar: async (id, datos, usuario) => {
      const limpio = normalizarActivo(datos)
      const antes = await activoRepo.obtenerCrudo(id)
      if (!antes) throw Errores.noEncontrado('El activo ya no existe.')
      const actualizado = await activoRepo.editar(id, limpio)
      if (!actualizado) throw Errores.noEncontrado('El activo ya no existe.')
      await movimientoRepo.registrar({
        activo_id: id, accion: 'editar', codigo: limpio.codigo,
        antes, despues: limpio, usuario_id: usuario.id,
      })
      return actualizado
    },

    eliminar: async (id, usuario) => {
      const antes = await activoRepo.obtenerCrudo(id)
      const borrado = await activoRepo.eliminar(id)
      if (!borrado) throw Errores.noEncontrado('El activo ya no existe.')
      await movimientoRepo.registrar({
        activo_id: id, accion: 'eliminar', codigo: antes?.codigo, antes, usuario_id: usuario.id,
      })
      return true
    },

    sincronizar: async ({ registros, inmediato }, usuario) => {
      if (!Array.isArray(registros) || !registros.length || registros.length > 200)
        throw Errores.invalido('Lote no válido')
      const resultados = []
      for (const r of registros) {
        const problema = validarRegistroSync(r)
        if (problema) { resultados.push({ id: r?.id, estado: 'invalido', mensaje: problema }); continue }
        resultados.push(await activoRepo.sincronizarRegistro(r, usuario.id, !!inmediato))
      }
      return resultados
    },
  }
}
