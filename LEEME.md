# Inventario de activos

    inventario/
      backend/    API Node + Express + PostgreSQL (se despliega en Coolify con el Dockerfile)
      frontend/   React + Vite PWA (se despliega en Coolify como sitio estático)

## Probar en tu computadora
1. Necesitas Node 20+ y un PostgreSQL local.
2. Backend:
       cd backend
       npm install
       DATABASE_URL=postgres://usuario:clave@localhost:5432/inventario \
       JWT_SECRET=algo-largo ADMIN_PASSWORD=admin123 SEED_DEMO=true npm start
   Comprueba http://localhost:3000/health
3. Frontend (en otra terminal):
       cd frontend
       npm install
       npm run dev
   Abre http://localhost:5173 (el proxy envía /api a localhost:3000).
   Usuario demo: operador / operador123, o admin / admin123.

## Producción en Coolify
- Backend: recurso PostgreSQL + aplicación con Dockerfile (directorio base `backend`, puerto 3000).
  Variables: DATABASE_URL, JWT_SECRET, CORS_ORIGIN, ADMIN_USER, ADMIN_PASSWORD (ver backend/.env.example).
- Frontend: sitio estático (directorio base `frontend`, build `npm run build`, publicar `dist`, modo SPA).
  Define VITE_API_URL=https://tu-api.tudominio.com antes del build.
- Pon SEED_DEMO=false y borra el usuario "operador" cuando cargues datos reales.
- Activa los respaldos de PostgreSQL.
