ALTER TABLE scans ADD COLUMN contrato_firmado INTEGER DEFAULT 0;
ALTER TABLE scans ADD COLUMN contrato_version INTEGER DEFAULT 0;
ALTER TABLE scans ADD COLUMN representante_nombre TEXT;
ALTER TABLE scans ADD COLUMN representante_discord TEXT;
ALTER TABLE scans ADD COLUMN binance_pay_id TEXT;
ALTER TABLE scans ADD COLUMN fecha_firma TEXT;