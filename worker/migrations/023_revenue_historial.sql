CREATE TABLE IF NOT EXISTS revenue_historial (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL,
    manga_id TEXT NOT NULL,
    mes TEXT NOT NULL,
    views_mes INTEGER NOT NULL DEFAULT 0,
    fecha_registro TEXT NOT NULL,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    FOREIGN KEY(manga_id) REFERENCES mangas(id) ON DELETE CASCADE
);
