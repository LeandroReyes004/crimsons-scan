-- Migración para Historial de Lectura y Marcadores (Favoritos)

CREATE TABLE IF NOT EXISTS marcadores (
    usuario_id TEXT NOT NULL,
    manga_id TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, manga_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_lectura (
    usuario_id TEXT NOT NULL,
    manga_id TEXT NOT NULL,
    capitulo_id TEXT NOT NULL,
    leido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, manga_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
    FOREIGN KEY (capitulo_id) REFERENCES capitulos(id) ON DELETE CASCADE
);

-- Indices para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_marcadores_usuario ON marcadores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_lectura(usuario_id);
