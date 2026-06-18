CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    detalles TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN fecha_nacimiento TEXT;
