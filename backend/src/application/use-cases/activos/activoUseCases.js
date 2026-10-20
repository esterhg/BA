import { normalizarActivo, normalizarActivoConEpc, normalizarEpc, validarRegistroSync } from '../../../domain/entities/activo.js'
import { Errores } from '../../../domain/shared/errors.js'

// Casos de uso de activos: listar, CRUD y sincronización por lotes.
// La bitácora de movimientos se registra tras cada operación de escritura.
export function crearActivoUseCases({ activoRepo, movimientoRepo }) {
  return {
    listar: (filtros) => activoRepo.listar(filtros),

    // Obtiene un activo por su ID (UUID), con datos legibles. Lanza
    // NO_ENCONTRADO si no existe. Lo usa la app RFID para consultar un activo.
    obtener: async (id) => {
      const activo = await activoRepo.obtenerCompleto(id)
      if (!activo) throw Errores.noEncontrado('El activo no existe.')
      return activo
    },

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

    // --- EPC / RFID ------------------------------------------------------
    // Crea un activo y le vincula su EPC en un solo paso (app RFID).
    crearConEpc: async (datos, usuario) => {
      const limpio = normalizarActivoConEpc(datos)
      const creado = await activoRepo.crearConEpc(limpio, usuario.id)
      await movimientoRepo.registrar({
        activo_id: creado.id, accion: 'crear', codigo: limpio.codigo,
        despues: limpio, usuario_id: usuario.id,
      })
      return creado
    },

    // Busca el activo dueño de un EPC. Lo usa la app RFID al escanear.
    buscarPorEpc: async (epcCrudo) => {
      const epc = normalizarEpc(epcCrudo)
      const activo = await activoRepo.buscarPorEpc(epc)
      if (!activo) throw Errores.noEncontrado('Ningún activo tiene ese EPC.')
      return activo
    },

    // Vincula (o reasigna) un EPC a un activo. Registra el cambio en la bitácora
    // como una edición (el CHECK de movimientos solo admite crear/editar/eliminar).
    vincularEpc: async (id, epcCrudo, usuario) => {
      const epc = normalizarEpc(epcCrudo)
      const antes = await activoRepo.obtenerCrudo(id)
      if (!antes) throw Errores.noEncontrado('El activo ya no existe.')
      const actualizado = await activoRepo.vincularEpc(id, epc)
      if (!actualizado) throw Errores.noEncontrado('El activo ya no existe.')
      await movimientoRepo.registrar({
        activo_id: id, accion: 'editar', codigo: antes.codigo,
        antes: { ...antes, epc: antes.epc ?? null }, despues: { ...antes, epc },
        usuario_id: usuario.id,
      })
      return actualizado
    },

    // Quita el EPC de un activo.
    desvincularEpc: async (id, usuario) => {
      const antes = await activoRepo.obtenerCrudo(id)
      if (!antes) throw Errores.noEncontrado('El activo ya no existe.')
      const actualizado = await activoRepo.desvincularEpc(id)
      if (!actualizado) throw Errores.noEncontrado('El activo ya no existe.')
      await movimientoRepo.registrar({
        activo_id: id, accion: 'editar', codigo: antes.codigo,
        antes: { ...antes, epc: antes.epc ?? null }, despues: { ...antes, epc: null },
        usuario_id: usuario.id,
      })
      return actualizado
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
