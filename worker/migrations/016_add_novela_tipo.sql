-- Migración 016: Agregar 'novela' al CHECK constraint de mangas.tipo
PRAGMA foreign_keys = OFF;

CREATE TABLE mangas_new (
  id                   TEXT PRIMARY KEY,
  titulo               TEXT NOT NULL,
  titulo_alt           TEXT,
  descripcion          TEXT,
  generos              TEXT DEFAULT '[]',
  tipo                 TEXT NOT NULL DEFAULT 'manga'
                       CHECK (tipo IN ('manga', 'manhwa', 'manhua', 'novela')),
  estado               TEXT NOT NULL DEFAULT 'en_curso'
                       CHECK (estado IN ('en_curso', 'completado', 'pausado')),
  cover_r2_key         TEXT,
  uploader_id          TEXT,
  views_total          INTEGER DEFAULT 0,
  fecha_creacion       TEXT DEFAULT (datetime('now')),
  fecha_actualizacion  TEXT DEFAULT (datetime('now')),
  scan_id              TEXT,
  es_adulto            INTEGER NOT NULL DEFAULT 0,
  views_mes            INTEGER DEFAULT 0,
  slug                 TEXT,
  joint_scan_id        TEXT,
  joint_status         TEXT DEFAULT 'pendiente'
);

INSERT INTO mangas_new SELECT * FROM mangas;

DROP TABLE mangas;
ALTER TABLE mangas_new RENAME TO mangas;

PRAGMA foreign_keys = ON;
