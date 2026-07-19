CREATE TABLE IF NOT EXISTS ajustes_globales (
  id INTEGER PRIMARY KEY DEFAULT 1,
  discord_webhook_url TEXT,
  telegram_chat_id TEXT
);

-- Insert the default row so we always have ID = 1 to update
INSERT OR IGNORE INTO ajustes_globales (id, discord_webhook_url, telegram_chat_id) VALUES (1, NULL, NULL);
