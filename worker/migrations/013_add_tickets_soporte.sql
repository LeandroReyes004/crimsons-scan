CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  usuario_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sugerencia', 'soporte', 'reporte')),
  mensaje TEXT NOT NULL,
  contacto TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto')),
  fecha_creacion TEXT DEFAULT (datetime('now'))
);
