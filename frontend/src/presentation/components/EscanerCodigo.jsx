import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

// Escáner de código de barras / QR usando la cámara del dispositivo.
// Llama onDetectado(texto) cuando lee un código, y onCerrar() al cancelar.
// Requiere HTTPS (o localhost): los navegadores bloquean la cámara en http.
export function EscanerCodigo({ onDetectado, onCerrar }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let activo = true

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, _error, controls) => {
      if (!activo) return
      if (controls && !controlsRef.current) controlsRef.current = controls
      if (result) {
        const texto = result.getText().trim()
        detener()
        onDetectado(texto)
      }
    }).catch((e) => {
      // Cámara no disponible, permiso denegado, o contexto no seguro (http).
      if (e?.name === 'NotAllowedError') setErr('Permiso de cámara denegado. Habilítalo o escribe el código a mano.')
      else if (e?.name === 'NotFoundError') setErr('No se encontró una cámara en este dispositivo.')
      else setErr('No se pudo abrir la cámara. Recuerda que requiere HTTPS. Puedes escribir el código a mano.')
    })

    function detener() {
      activo = false
      try { controlsRef.current?.stop() } catch { /* ignore */ }
    }
    // Limpieza al desmontar: apaga la cámara.
    return () => detener()
  }, [])

  const cerrar = () => {
    try { controlsRef.current?.stop() } catch { /* ignore */ }
    onCerrar()
  }

  return (
    <div className="scan-overlay" onClick={cerrar}>
      <div className="scan-box" onClick={(e) => e.stopPropagation()}>
        <h2>Escanear código</h2>
        {err
          ? <div className="msg wa">{err}</div>
          : <>
              <video ref={videoRef} className="scan-video" muted playsInline />
              <p className="mu sm">Apunta la cámara al código de barras.</p>
            </>}
        <button className="full" onClick={cerrar}>Cerrar</button>
      </div>
    </div>
  )
}
