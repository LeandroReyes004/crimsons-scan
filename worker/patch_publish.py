import re

# 1. Update backend worker index.js to add Telegram support in PUT /api/chapters/:id/publish
backend_path = r"c:\Users\leandro.reyes\Music\crimsons-scan\worker\src\index.js"
with open(backend_path, 'r', encoding='utf-8') as f:
    backend_content = f.read()

old_publish_webhook = """                if (scanData?.webhook_discord) {
                  webhookUrl = scanData.webhook_discord;
                  discordTemplate = scanData.discord_template;
                }"""

new_publish_webhook = """                if (scanData?.webhook_discord) {
                  webhookUrl = scanData.webhook_discord;
                  discordTemplate = scanData.discord_template;
                }
                
                // --- Telegram en Publish ---
                if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  const coverUrl = `${env.FRONTEND_URL}/api/cover/${capForWh.manga_id}`;
                  // necesitamos el secret_token del capítulo publicado
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = `${env.FRONTEND_URL}/leer/${capSecret?.secret_token}`;
                  const caption = `📖 *${capForWh.manga_titulo}*\\n\\nNuevo Capítulo ${capForWh.numero}${capForWh.titulo ? ` - ${capForWh.titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;
                  
                  await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: scanData.telegram_chat_id,
                      photo: coverUrl,
                      caption: caption,
                      parse_mode: 'Markdown'
                    })
                  }).catch(e => console.error('Telegram Error', e));
                }
                // -----------------------------"""
                
# Wait, scanData query inside PUT /api/chapters/:id/publish only selects webhook_discord and discord_template right now!
old_query = """                const scanData = await env.DB.prepare(
                  `SELECT s.webhook_discord, s.discord_template
                   FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
                ).bind(capForWh.manga_id).first();"""

new_query = """                const scanData = await env.DB.prepare(
                  `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id
                   FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
                ).bind(capForWh.manga_id).first();"""

backend_content = backend_content.replace(old_query, new_query)
backend_content = backend_content.replace(old_publish_webhook, new_publish_webhook)

with open(backend_path, 'w', encoding='utf-8') as f:
    f.write(backend_content)
    print("Patched publish endpoint in index.js")
