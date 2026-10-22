import { useCallback, useEffect, useState } from 'react'
import { session } from './infrastructure/api/client.js'
import { dbAll } from './infrastructure/storage/db.js'
import { cargarCatalogos, sincronizar } from './infrastructure/storage/sync.js'
import { Tile, Volver, Top } from './presentation/components/ui.jsx'
import { Login } from './presentation/views/Login.jsx'
import { Sesion } from './presentation/views/Sesion.jsx'
import { Captura } from './presentation/views/Captura.jsx'
import { Activos } from './presentation/views/Activos.jsx'
import { Catalogo } from './presentation/views/Catalogo.jsx'
import { Admin } from './presentation/views/Admin.jsx'
import { Historial } from './presentation/views/Historial.jsx'
import { Exportar } from './presentation/views/Exportar.jsx'
import { Usuarios } from './presentation/views/Usuarios.jsx'
import { Conflictos } from './presentation/views/Conflictos.jsx'

// Orquestador: mantiene el estado global (usuario, catálogos, cola) y enruta las vistas.
export default function App() {
  const [user, setUser] = useState(session.user)
  const [view, setView] = useState('panel')
  const [online, setOnline] = useState(navigator.onLine)
  const [cat, setCat] = useState({ modelos: [], ubicaciones: [] })
  const [ses, setSes] = useState(() => JSON.parse(localStorage.getItem('ses') || 'null'))
  const [cola, setCola] = useState([])

  const refresh = useCallback(async () => {
    setCola((await dbAll('cola')).sort((a, b) => b.capturado_en.localeCompare(a.capturado_en)))
  }, [])
  const doSync = useCallback(async () => {
    if (!navigator.onLine) return null
    try { const r = await sincronizar(); await refresh(); return r } catch { return null }
  }, [refresh])

  useEffect(() => {
    const on = () => { setOnline(true); doSync() }, off = () => setOnline(false)
    addEventListener('online', on); addEventListener('offline', off)
    const t = setInterval(doSync, 30000)
    return () => { removeEventListener('online', on); removeEventListener('offline', off); clearInterval(t) }
  }, [doSync])

  useEffect(() => { if (user) { cargarCatalogos().then(setCat); refresh(); doSync() } }, [user])

  const salir = () => { session.clear(); localStorage.removeItem('ses'); setSes(null); setUser(null); setView('panel') }
  if (!user) return <Login onLogin={setUser} />

  const pendientes = cola.filter((r) => r.estado === 'pendiente').length
  const esAdmin = user.rol === 'administrador'
  // Barra superior con los datos globales de conexión/sesión ya resueltos.
  const BarraTop = ({ t }) => <Top t={t} online={online} pendientes={pendientes} onSalir={salir} />

  return (
    <div className="w">
      {view === 'panel' && <>
        <BarraTop t="Panel principal" />
        <p className="mu sm">Hola, {user.nombre} · {esAdmin ? 'Administrador' : 'Operador'}</p>
        <Tile k="inv" t="Inventario" s="Iniciar sesión de captura por edificio y nivel" onClick={() => setView(ses ? 'captura' : 'sesion')} />
        <Tile k="act" t="Ver activos" s="Consultar los activos cargados" onClick={() => setView('activos')} />
        <Tile k="cat" t="Catálogo de modelos" s="Consulta cada modelo con su imagen" onClick={() => setView('catalogo')} />
        {esAdmin && <>
          <p className="mu sm" style={{ marginTop: 18 }}>Administración</p>
          <Tile k="adm" t="Resumen y administración" s="Totales, activos por edificio y por usuario" onClick={() => setView('admin')} />
          <Tile k="his" t="Historial de movimientos" s="Quién creó, editó o eliminó cada activo" onClick={() => setView('historial')} />
          <Tile k="adm" t="Conflictos de sincronización" s="Registros duplicados al sincronizar, con filtros" onClick={() => setView('conflictos')} />
          <Tile k="usr" t="Usuarios" s="Crear y consultar usuarios del sistema" onClick={() => setView('usuarios')} />
          <Tile k="exp" t="Exportar activos (CSV)" s="Descarga todos los activos en un archivo" onClick={() => setView('exportar')} />
        </>}
      </>}

      {view === 'sesion' && <><BarraTop t="Nueva sesión" />
        <Sesion cat={cat} onBack={() => setView('panel')} onStart={(s) => { localStorage.setItem('ses', JSON.stringify(s)); setSes(s); setView('captura') }} /></>}

      {view === 'captura' && ses && <><BarraTop t="Registrar activo" />
        <Captura ses={ses} cat={cat} cola={cola} refresh={refresh} doSync={doSync}
          onEnd={() => { localStorage.removeItem('ses'); setSes(null); setView('panel') }} /></>}

      {view === 'activos' && <><BarraTop t="Activos cargados" />
        <Activos esAdmin={esAdmin} cat={cat} doSync={doSync} pendientes={pendientes} /><Volver onClick={() => setView('panel')} /></>}

      {view === 'catalogo' && <><BarraTop t="Catálogo de modelos" />
        <Catalogo modelos={cat.modelos} esAdmin={esAdmin}
          onCambio={(modelo, esNuevo) => setCat((c) => ({ ...c, modelos: (esNuevo ? [...c.modelos, modelo] : c.modelos.map((m) => m.id === modelo.id ? modelo : m)).sort((a, b) => a.nombre.localeCompare(b.nombre)) }))} />
        <Volver onClick={() => setView('panel')} /></>}

      {view === 'admin' && esAdmin && <><BarraTop t="Resumen y administración" /><Admin cat={cat} /><Volver onClick={() => setView('panel')} /></>}
      {view === 'historial' && esAdmin && <><BarraTop t="Historial de movimientos" /><Historial /><Volver onClick={() => setView('panel')} /></>}
      {view === 'conflictos' && esAdmin && <><BarraTop t="Conflictos de sincronización" /><Conflictos cat={cat} /><Volver onClick={() => setView('panel')} /></>}
      {view === 'usuarios' && esAdmin && <><BarraTop t="Usuarios" /><Usuarios /><Volver onClick={() => setView('panel')} /></>}
      {view === 'exportar' && esAdmin && <><BarraTop t="Exportar activos" /><Exportar cat={cat} /><Volver onClick={() => setView('panel')} /></>}
    </div>
  )
}
