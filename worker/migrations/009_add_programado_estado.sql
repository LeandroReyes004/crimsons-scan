-- Agrega 'programado' al CHECK de estado en capitulos
PRAGMA foreign_keys=OFF;

CREATE TABLE capitulos_new (
  id               TEXT PRIMARY KEY,
  manga_id         TEXT NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
  numero           REAL NOT NULL,
  titulo           TEXT,
  uploader_id      TEXT,
  estado           TEXT NOT NULL DEFAULT 'borrador'
                   CHECK (estado IN ('borrador', 'publicado', 'rechazado', 'programado')),
  notas_admin      TEXT,
  views            INTEGER DEFAULT 0,
  fecha_subida     TEXT DEFAULT (datetime('now')),
  fecha_publicacion TEXT,
  UNIQUE (manga_id, numero)
);

INSERT INTO capitulos_new SELECT * FROM capitulos;

DROP TABLE capitulos;
ALTER TABLE capitulos_new RENAME TO capitulos;

PRAGMA foreign_keys=ON;
