import re

with open('worker/src/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix buildDiscordBody to support cover_url
if 'embed.image =' not in code:
    old_body = """function buildDiscordBody(template, vars) {
  const desc = (template || DEFAULT_DISCORD_TEMPLATE)
    .replace(/\\{\\{manga\\}\\}/g, vars.manga)
    .replace(/\\{\\{capitulo\\}\\}/g, vars.capitulo)
    .replace(/\\{\\{titulo\\}\\}/g, vars.titulo ? \` — \${vars.titulo}\` : '')
    .replace(/\\{\\{url\\}\\}/g, vars.url);
  return JSON.stringify({
    embeds: [{
      description: desc,
      color: 0xe11d48,
      url: vars.url,
      footer: { text: "Crimson's Scan" },
      timestamp: new Date().toISOString(),
    }]
  });
}"""
    new_body = """function buildDiscordBody(template, vars) {
  const desc = (template || DEFAULT_DISCORD_TEMPLATE)
    .replace(/\\{\\{manga\\}\\}/g, vars.manga)
    .replace(/\\{\\{capitulo\\}\\}/g, vars.capitulo)
    .replace(/\\{\\{titulo\\}\\}/g, vars.titulo ? \` — \${vars.titulo}\` : '')
    .replace(/\\{\\{url\\}\\}/g, vars.url);
  const embed = {
    description: desc,
    color: 0xe11d48,
    url: vars.url,
    footer: { text: "Crimson's Scan" },
    timestamp: new Date().toISOString(),
  };
  if (vars.cover_url) {
    embed.image = { url: vars.cover_url };
  }
  return JSON.stringify({ embeds: [embed] });
}"""
    code = code.replace(old_body, new_body)

# 2. Fix all instances of env.FRONTEND_URL/api/cover to use the workers dev URL
code = code.replace("${env.FRONTEND_URL}/api/cover/", "https://crimson-api.leandro-reyes1025.workers.dev/api/cover/")

# 3. Fix Discord url: mangaUrl -> url: secretLink where applicable.
# In POST /api/chapters:
old_discord_1 = """              const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
              if (!webhookUrl) return;
              const mangaUrl = `${env.FRONTEND_URL}/manga/reader/${manga_id}`;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(scanData?.discord_template, {
                  manga: scanData?.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: mangaUrl,
                }),
              });"""
new_discord_1 = """              const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
              if (!webhookUrl) return;
              const secretLink = `${env.FRONTEND_URL}/leer/${secret_token}`;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(scanData?.discord_template, {
                  manga: scanData?.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: secretLink,
                  cover_url: `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${manga_id}`
                }),
              });"""
code = code.replace(old_discord_1, new_discord_1)

# In PUT /api/chapters/:id/publish:
old_discord_2 = """              if (!webhookUrl) return;

              const mangaUrl = `${env.FRONTEND_URL}/manga/reader/${capForWh.manga_id}`;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(discordTemplate, {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: mangaUrl,
                }),
              });"""
new_discord_2 = """              if (!webhookUrl) return;
              
              const capSecretForDiscord = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
              const secretLink = `${env.FRONTEND_URL}/leer/${capSecretForDiscord?.secret_token}`;

              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(discordTemplate, {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: secretLink,
                  cover_url: `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${capForWh.manga_id}`
                }),
              });"""
code = code.replace(old_discord_2, new_discord_2)

# 4. Fix Telegram to sendPhoto
old_telegram_1 = """                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
                const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${manga_id}`;
                const secretLink = `${env.FRONTEND_URL}/leer/${secret_token}`;
                const caption = `📖 *${scanData.manga_titulo}*\\n\\nNuevo Capítulo ${numero}${titulo ? ` - ${titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;
                
                await fetch(telegramUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: scanData.telegram_chat_id,
                    text: caption,
                    
                    parse_mode: 'Markdown'
                  })
                });"""
new_telegram_1 = """                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${manga_id}`;
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
                }).catch(e => console.error('Telegram Error', e));"""
code = code.replace(old_telegram_1, new_telegram_1)

old_telegram_2 = """                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
                  const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${capForWh.manga_id}`;
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = `${env.FRONTEND_URL}/leer/${capSecret?.secret_token}`;
                  const caption = `📖 *${capForWh.manga_titulo}*\\n\\nNuevo Capítulo ${capForWh.numero}${capForWh.titulo ? ` - ${capForWh.titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;
                  
                  await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: scanData.telegram_chat_id,
                      text: caption,
                      
                      parse_mode: 'Markdown'
                    })
                  }).catch(e => console.error('Telegram Error', e));"""
new_telegram_2 = """                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${capForWh.manga_id}`;
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
code = code.replace(old_telegram_2, new_telegram_2)

with open('worker/src/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Patch applied.")
