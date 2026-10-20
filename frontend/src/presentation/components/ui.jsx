// Componentes de interfaz reutilizables y sin estado.
import { ICONOS } from '../../domain/constants.js'

import { useState } from 'react'

export const Ico = ({ k }) => (
  <span className="ico"><svg viewBox="0 0 24 24"><path d={ICONOS[k]} /></svg></span>
)

// Campo de contraseña con botón de "ojito" para mostrar/ocultar lo que se
// escribe. Solo revela lo que el propio usuario está tecleando; no recupera
// contraseñas guardadas (eso es imposible: se guardan cifradas).
export const CampoPassword = (props) => {
  const [ver, setVer] = useState(false)
  return (
    <div className="pass-wrap">
      <input {...props} type={ver ? 'text' : 'password'} />
      <button
        type="button"
        className="pass-ojo"
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={ver}
        title={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={ver ? ICONOS.ojoOff : ICONOS.ojo} />
        </svg>
      </button>
    </div>
  )
}

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
