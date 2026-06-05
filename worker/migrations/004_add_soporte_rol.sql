-- Migración 004: Agregar 'soporte' al CHECK constraint de usuarios.rol
-- Estrategia: rename en lugar de DROP para evitar FK constraint issues en D1

CREATE TABLE usuarios_new (
  id              TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  rol             TEXT NOT NULL DEFAULT 'lector'
                  CHECK (rol IN ('lector', 'uploader', 'admin', 'admin_scan', 'soporte')),
  avatar_url      TEXT,
  activo          INTEGER DEFAULT 1,
  fecha_registro  TEXT DEFAULT (datetime('now')),
  ultimo_acceso   TEXT,
  is_superadmin   INTEGER DEFAULT 0,
  scan_id         TEXT
);

INSERT INTO usuarios_new SELECT
  id, username, email, password_hash, rol, avatar_url,
  activo, fecha_registro, ultimo_acceso, is_superadmin, scan_id
FROM usuarios;

ALTER TABLE usuarios RENAME TO usuarios_old;
ALTER TABLE usuarios_new RENAME TO usuarios;
