-- Añadir soporte de Joints a nivel de Manga
ALTER TABLE mangas ADD COLUMN joint_scan_id TEXT;
ALTER TABLE mangas ADD COLUMN joint_status TEXT DEFAULT 'pendiente';
