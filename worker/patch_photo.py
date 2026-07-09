import re

backend_path = r"c:\Users\leandro.reyes\Music\crimsons-scan\worker\src\index.js"
with open(backend_path, 'r', encoding='utf-8') as f:
    backend_content = f.read()

# Replace sendPhoto with sendMessage in POST /api/chapters
old_post_telegram = """                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  const coverUrl = `${env.FRONTEND_URL}/api/cover/${manga_id}`;
                  const secretLink = `${env.FRONTEND_URL}/leer/${secret_token}`;
                  const caption = `📖 *${scanData.manga_titulo}*\\n\\nNuevo Capítulo ${numero}${titulo ? ` - ${titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;
                  
                  await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: scanData.telegram_chat_id,
                      photo: coverUrl,
                      caption: caption,
                      parse_mode: 'Markdown'
                    })
                  });"""

new_post_telegram = """                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
                  const secretLink = `${env.FRONTEND_URL}/leer/${secret_token}`;
                  const text = `📖 *${scanData.manga_titulo}*\\n\\nNuevo Capítulo ${numero}${titulo ? ` - ${titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;
                  
                  await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: scanData.telegram_chat_id,
                      text: text,
                      parse_mode: 'Markdown'
                    })
                  });"""

backend_content = backend_content.replace(old_post_telegram, new_post_telegram)

# Replace sendPhoto with sendMessage in PUT /api/chapters/:id/publish
old_publish_telegram = """                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  const coverUrl = `${env.FRONTEND_URL}/api/cover/${capForWh.manga_id}`;
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
                  }).catch(e => console.error('Telegram Error', e));"""

new_publish_telegram = """                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = `${env.FRONTEND_URL}/leer/${capSecret?.secret_token}`;
                  const text = `📖 *${capForWh.manga_titulo}*\\n\\nNuevo Capítulo ${capForWh.numero}${capForWh.titulo ? ` - ${capForWh.titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;
                  
                  await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: scanData.telegram_chat_id,
                      text: text,
                      parse_mode: 'Markdown'
                    })
                  }).catch(e => console.error('Telegram Error', e));"""

backend_content = backend_content.replace(old_publish_telegram, new_publish_telegram)

with open(backend_path, 'w', encoding='utf-8') as f:
    f.write(backend_content)
    print("Patched sendPhoto to sendMessage")
