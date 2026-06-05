-- Migración 003: Agregar 'admin_scan' al CHECK constraint de usuarios.rol
-- SQLite no permite ALTER TABLE para modificar constraints, hay que recrear la tabla

PRAGMA foreign_keys = OFF;

CREATE TABLE usuarios_new (
  id              TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  rol             TEXT NOT NULL DEFAULT 'lector'
                  CHECK (rol IN ('lector', 'uploader', 'admin', 'admin_scan')),
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

DROP TABLE usuarios;
ALTER TABLE usuarios_new RENAME TO usuarios;

PRAGMA foreign_keys = ON;
