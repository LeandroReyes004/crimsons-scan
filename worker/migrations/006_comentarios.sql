CREATE TABLE IF NOT EXISTS comentarios (
  id          TEXT PRIMARY KEY,
  manga_id    TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  usuario_id  TEXT NOT NULL,
  username    TEXT NOT NULL,
  contenido   TEXT NOT NULL,
  fecha       TEXT DEFAULT (datetime('now')),
  es_visible  INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_comentarios_manga ON comentarios(manga_id, es_visible);
