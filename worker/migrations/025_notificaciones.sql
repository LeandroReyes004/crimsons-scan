CREATE TABLE IF NOT EXISTS notificaciones (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  manga_id TEXT,
  mensaje TEXT NOT NULL,
  url TEXT,
  leido INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id);
