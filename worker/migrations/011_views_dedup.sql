CREATE TABLE IF NOT EXISTS views_dedup (
    capitulo_id TEXT,
    viewer_key TEXT,
    fecha TEXT,
    PRIMARY KEY (capitulo_id, viewer_key, fecha)
);

CREATE TABLE IF NOT EXISTS manga_views_dedup (
    manga_id TEXT,
    viewer_key TEXT,
    fecha TEXT,
    PRIMARY KEY (manga_id, viewer_key, fecha)
);
