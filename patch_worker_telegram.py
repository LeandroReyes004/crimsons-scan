import re

with open('worker/src/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add buildTelegramCaption
if 'function buildTelegramCaption' not in code:
    code = code.replace(
        "function buildDiscordBody(template, vars) {",
        """const DEFAULT_TELEGRAM_TEMPLATE = `📖 *{{manga}}*\\n\\nNuevo Capítulo {{capitulo}}{{titulo}} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí]({{url}})`;
function buildTelegramCaption(template, vars) {
  return (template || DEFAULT_TELEGRAM_TEMPLATE)
    .replace(/\\{\\{manga\\}\\}/g, vars.manga)
    .replace(/\\{\\{capitulo\\}\\}/g, vars.capitulo)
    .replace(/\\{\\{titulo\\}\\}/g, vars.titulo ? ` — ${vars.titulo}` : '')
    .replace(/\\{\\{url\\}\\}/g, vars.url);
}

function buildDiscordBody(template, vars) {"""
    )

# 2. Update webhook endpoint
old_webhook = """const { webhook_discord, discord_template, telegram_chat_id } = await request.json();
          await env.DB.prepare('UPDATE scans SET webhook_discord = ?, discord_template = ?, telegram_chat_id = ? WHERE id = ?')
            .bind(webhook_discord || null, discord_template || null, telegram_chat_id || null, editWebhook[1]).run();"""
new_webhook = """const { webhook_discord, discord_template, telegram_chat_id, telegram_template } = await request.json();
          await env.DB.prepare('UPDATE scans SET webhook_discord = ?, discord_template = ?, telegram_chat_id = ?, telegram_template = ? WHERE id = ?')
            .bind(webhook_discord || null, discord_template || null, telegram_chat_id || null, telegram_template || null, editWebhook[1]).run();"""
code = code.replace(old_webhook, new_webhook)

# 3. Update POST /api/chapters query and caption
old_q1 = """              const scanData = await env.DB.prepare(
                `SELECT m.titulo as manga_titulo, m.cover_r2_key, s.telegram_chat_id 
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();"""
new_q1 = """              const scanData = await env.DB.prepare(
                `SELECT m.titulo as manga_titulo, m.cover_r2_key, s.telegram_chat_id, s.telegram_template 
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();"""
code = code.replace(old_q1, new_q1)

old_cap1 = """const caption = `📖 *${scanData.manga_titulo}*\\n\\nNuevo Capítulo ${numero}${titulo ? ` - ${titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;"""
new_cap1 = """const caption = buildTelegramCaption(scanData.telegram_template, {
                  manga: scanData.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: secretLink
                });"""
code = code.replace(old_cap1, new_cap1)


# 4. Update PUT /api/chapters/:id/publish query and caption
# In this function, it doesn't query the scan explicitly for telegram_template initially?
# Wait, it does query scanData for webhook_discord... let's see:
old_q2 = """const scanData = await env.DB.prepare(
                  `SELECT webhook_discord, discord_template, telegram_chat_id FROM scans WHERE id = ?`
                ).bind(capForWh.scan_id).first();"""
new_q2 = """const scanData = await env.DB.prepare(
                  `SELECT webhook_discord, discord_template, telegram_chat_id, telegram_template FROM scans WHERE id = ?`
                ).bind(capForWh.scan_id).first();"""
code = code.replace(old_q2, new_q2)

old_cap2 = """const caption = `📖 *${capForWh.manga_titulo}*\\n\\nNuevo Capítulo ${capForWh.numero}${capForWh.titulo ? ` - ${capForWh.titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;"""
new_cap2 = """const caption = buildTelegramCaption(scanData.telegram_template, {
                    manga: capForWh.manga_titulo,
                    capitulo: capForWh.numero,
                    titulo: capForWh.titulo || '',
                    url: secretLink
                  });"""
code = code.replace(old_cap2, new_cap2)


# 5. Update Cron Job query and caption
old_q3 = """const scanData = await env.DB.prepare(
            `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
          ).bind(cap.manga_id).first();"""
new_q3 = """const scanData = await env.DB.prepare(
            `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id, s.telegram_template FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
          ).bind(cap.manga_id).first();"""
code = code.replace(old_q3, new_q3)

old_cap3 = """const caption = `📖 *${cap.manga_titulo}*\\n\\nNuevo Capítulo ${cap.numero}${cap.titulo ? ` - ${cap.titulo}` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](${secretLink})`;"""
new_cap3 = """const caption = buildTelegramCaption(scanData.telegram_template, {
              manga: cap.manga_titulo,
              capitulo: cap.numero,
              titulo: cap.titulo || '',
              url: secretLink
            });"""
code = code.replace(old_cap3, new_cap3)


with open('worker/src/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Worker patched for Telegram Template!")
