# Inventario de activos - Frontend (React + Vite, PWA)

## Ejecutar
    npm install
    npm run dev        # http://localhost:5173  (proxy /api -> http://localhost:3000)
    npm run build      # genera dist/ con service worker (funciona sin internet)

## Qué incluye esta versión
- Login con JWT y roles (operador / administrador)
- Sesión de inventario (edificio y nivel) y captura rápida con Enter
- Buscador de modelos desde catálogo (con miniatura)
- Validación inmediata con internet; cola offline en IndexedDB y sincronización por lotes
- Conflictos de sincronización identificados con dónde y quién registró el original
- Ver activos (paginado, búsqueda en servidor) y catálogo con imágenes
- PWA instalable (agrega iconos 192 y 512 px en /public para instalarla)

## Pendiente (siguiente entrega)
Consultas/reportes, importar y exportar, administración (usuarios, modelos, conflictos), detalle y edición de activos.

## Contrato de API esperado (JSON, header Authorization: Bearer <token>)
| Método | Ruta | Cuerpo / respuesta |
|---|---|---|
| POST | /auth/login | {username,password} -> {token, user:{id,nombre,rol}} |
| GET | /ubicaciones | [{id,nombre,niveles:[{id,nombre}]}] |
| GET | /modelos | [{id,nombre,tipo,imagen_url}] |
| POST | /activos/sync | {registros:[{id,codigo,serie,modelo_id,nivel_id,sesion_id,capturado_en}], inmediato?} -> {resultados:[{id,estado:"ok"\|"duplicado",campo?,existente?:{edificio,nivel,usuario,fecha}}]} |
| GET | /activos?q=&cursor= | {items:[{id,codigo,serie,modelo,edificio,nivel}], next} |

Notas del servidor:
- `id` lo genera el dispositivo (UUID): reintentar un envío no duplica registros.
- La sesión (`sesion_id`) se crea en el servidor si no existe.
- Con `inmediato:true` un duplicado solo se responde; sin esa marca (sincronización offline) además se guarda en `conflictos_sync`.
- Al operador, GET /activos no debe devolver usuario ni fechas.
