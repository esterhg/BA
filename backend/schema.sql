CREATE TABLE IF NOT EXISTS usuarios (
  id serial PRIMARY KEY,
  username text NOT NULL,
  nombre text NOT NULL,
  password_hash text NOT NULL,
  rol text NOT NULL DEFAULT 'operador' CHECK (rol IN ('operador','administrador')),
  activo boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_username_uq ON usuarios (lower(username));

CREATE TABLE IF NOT EXISTS edificios (
  id serial PRIMARY KEY,
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS niveles (
  id serial PRIMARY KEY,
  edificio_id int NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS modelos (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  tipo text,
  imagen_url text
);

CREATE TABLE IF NOT EXISTS sesiones (
  id uuid PRIMARY KEY,
  nivel_id int NOT NULL REFERENCES niveles(id),
  usuario_id int NOT NULL REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activos (
  id uuid PRIMARY KEY,
  seq bigserial UNIQUE,
  codigo text NOT NULL,
  serie text NOT NULL,
  epc text,
  modelo_id int NOT NULL REFERENCES modelos(id),
  nivel_id int NOT NULL REFERENCES niveles(id),
  sesion_id uuid REFERENCES sesiones(id),
  usuario_id int NOT NULL REFERENCES usuarios(id),
  capturado_en timestamptz NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
-- Para bases ya creadas: agrega la columna EPC si aún no existe.
ALTER TABLE activos ADD COLUMN IF NOT EXISTS epc text;
CREATE UNIQUE INDEX IF NOT EXISTS activos_codigo_uq ON activos (lower(codigo));
CREATE UNIQUE INDEX IF NOT EXISTS activos_serie_uq ON activos (lower(serie));
-- EPC de etiqueta RFID: único por activo. El índice ignora NULL, así que varios
-- activos pueden quedar sin EPC sin chocar entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS activos_epc_uq ON activos (epc) WHERE epc IS NOT NULL;

CREATE TABLE IF NOT EXISTS conflictos_sync (
  id serial PRIMARY KEY,
  registro jsonb NOT NULL,
  usuario_id int REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Bitácora de movimientos sobre activos (auditoría de crear / editar / eliminar)
CREATE TABLE IF NOT EXISTS movimientos (
  id serial PRIMARY KEY,
  activo_id uuid NOT NULL,
  accion text NOT NULL CHECK (accion IN ('crear','editar','eliminar')),
  codigo text,
  antes jsonb,
  despues jsonb,
  usuario_id int REFERENCES usuarios(id),
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS movimientos_fecha_idx ON movimientos (creado_en DESC);
CREATE INDEX IF NOT EXISTS movimientos_activo_idx ON movimientos (activo_id);
