-- Elimina el FK incorrecto a usuarios_old en mangas y capitulos
PRAGMA foreign_keys=OFF;

CREATE TABLE mangas_new (
  id                   TEXT PRIMARY KEY,
  titulo               TEXT NOT NULL,
  titulo_alt           TEXT,
  descripcion          TEXT,
  generos              TEXT DEFAULT '[]',
  tipo                 TEXT NOT NULL DEFAULT 'manga'
                       CHECK (tipo IN ('manga', 'manhwa', 'manhua')),
  estado               TEXT NOT NULL DEFAULT 'en_curso'
                       CHECK (estado IN ('en_curso', 'completado', 'pausado')),
  cover_r2_key         TEXT,
  uploader_id          TEXT,
  views_total          INTEGER DEFAULT 0,
  fecha_creacion       TEXT DEFAULT (datetime('now')),
  fecha_actualizacion  TEXT DEFAULT (datetime('now')),
  scan_id              TEXT,
  es_adulto            INTEGER NOT NULL DEFAULT 0
);

INSERT INTO mangas_new SELECT * FROM mangas;

CREATE TABLE capitulos_new (
  id               TEXT PRIMARY KEY,
  manga_id         TEXT NOT NULL REFERENCES mangas_new(id) ON DELETE CASCADE,
  numero           REAL NOT NULL,
  titulo           TEXT,
  uploader_id      TEXT,
  estado           TEXT NOT NULL DEFAULT 'borrador'
                   CHECK (estado IN ('borrador', 'publicado', 'rechazado')),
  notas_admin      TEXT,
  views            INTEGER DEFAULT 0,
  fecha_subida     TEXT DEFAULT (datetime('now')),
  fecha_publicacion TEXT,
  UNIQUE (manga_id, numero)
);

INSERT INTO capitulos_new SELECT * FROM capitulos;

DROP TABLE capitulos;
DROP TABLE mangas;

ALTER TABLE mangas_new RENAME TO mangas;
ALTER TABLE capitulos_new RENAME TO capitulos;

PRAGMA foreign_keys=ON;
