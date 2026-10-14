// Componentes de interfaz reutilizables y sin estado.
import { ICONOS } from '../../domain/constants.js'

export const Ico = ({ k }) => (
  <span className="ico"><svg viewBox="0 0 24 24"><path d={ICONOS[k]} /></svg></span>
)

export const Tile = ({ k, t, s, onClick }) => (
  <button className="tile" onClick={onClick}>
    <Ico k={k} /><span className="tt"><b>{t}</b><small>{s}</small></span><span className="chev">›</span>
  </button>
)

export const Volver = ({ onClick }) => (
  <button className="full" onClick={onClick}>Volver al panel</button>
)

// Barra superior con título, estado de conexión y botón de salida.
export const Top = ({ t, online, pendientes, onSalir }) => (
  <div className="top"><h1>{t}</h1>
    <span className="acts">
      <span className="pill"><i className={'dot ' + (online ? '' : 'off')} />
        {online ? 'En línea' : 'Sin internet'}{pendientes ? ` · ${pendientes} pendientes` : ''}</span>
      <button className="pill" onClick={onSalir}>Salir</button>
    </span>
  </div>
)
