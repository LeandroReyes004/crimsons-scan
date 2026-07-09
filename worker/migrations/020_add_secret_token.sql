ALTER TABLE capitulos ADD COLUMN secret_token TEXT;

-- Generar un token aleatorio de 8 caracteres (4 bytes en hex) para los capítulos existentes
UPDATE capitulos SET secret_token = lower(hex(randomblob(4))) WHERE secret_token IS NULL;

-- Crear un índice único para que la búsqueda por token sea muy rápida
CREATE UNIQUE INDEX IF NOT EXISTS idx_capitulos_secret_token ON capitulos(secret_token);
