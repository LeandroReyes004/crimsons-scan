import re

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\worker\src\index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add API endpoints
api_code = """      // ⚙️ GET /api/admin/settings
      if (pathname === '/api/admin/settings' && method === 'GET') {
        const admin = await getSuperAdmin(request, env);
        if (!admin) return err('No autorizado', 403);
        const st = await env.DB.prepare('SELECT discord_webhook_url, telegram_chat_id FROM ajustes_globales WHERE id = 1').first();
        return json({
          discord_webhook_url: st?.discord_webhook_url || '',
          telegram_chat_id: st?.telegram_chat_id || ''
        });
      }

      // ⚙️ PUT /api/admin/settings
      if (pathname === '/api/admin/settings' && method === 'PUT') {
        const admin = await getSuperAdmin(request, env);
        if (!admin) return err('No autorizado', 403);
        const { discord_webhook_url, telegram_chat_id } = await request.json();
        await env.DB.prepare('UPDATE ajustes_globales SET discord_webhook_url = ?, telegram_chat_id = ? WHERE id = 1')
          .bind(discord_webhook_url || null, telegram_chat_id || null).run();
        return json({ message: 'Ajustes globales actualizados' });
      }

"""

content = content.replace("      // 📖 GET /api/drive/list", api_code + "      // 📖 GET /api/drive/list")


# 2. Refactor the notification blocks to read from settings

old_upload = """              const scanData = await env.DB.prepare(
                `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id, s.telegram_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();

              const vars = {
                manga: scanData?.manga_titulo || '',
                capitulo: numero,
                titulo: titulo || '',
                url: secretLink,
                cover_url: coverUrl
              };

              // -- Discord Global --
              if (env.DISCORD_WEBHOOK_URL) {
                await fetch(env.DISCORD_WEBHOOK_URL, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: buildDiscordBody(null, vars)
                }).catch(()=>{});
              }

              // -- Discord Scan --
              if (scanData?.webhook_discord && scanData.webhook_discord !== env.DISCORD_WEBHOOK_URL) {
                await fetch(scanData.webhook_discord, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: buildDiscordBody(scanData.discord_template, vars)
                }).catch(()=>{});
              }

              // -- Telegram --
              if (env.TELEGRAM_BOT_TOKEN) {
                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                
                // Global Telegram
                if (env.TELEGRAM_GLOBAL_CHAT_ID) {
                  await fetch(telegramUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: env.TELEGRAM_GLOBAL_CHAT_ID, photo: coverUrl, caption: buildTelegramCaption(null, vars), parse_mode: 'Markdown' })
                  }).catch(()=>{});
                }
                
                // Scan Telegram
                if (scanData?.telegram_chat_id && scanData.telegram_chat_id !== env.TELEGRAM_GLOBAL_CHAT_ID) {
                  await fetch(telegramUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: scanData.telegram_chat_id, photo: coverUrl, caption: buildTelegramCaption(scanData.telegram_template, vars), parse_mode: 'Markdown' })
                  }).catch(()=>{});
                }
              }"""


new_upload = """              const scanData = await env.DB.prepare(
                `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id, s.telegram_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();
              
              const globalSettings = await env.DB.prepare('SELECT discord_webhook_url, telegram_chat_id FROM ajustes_globales WHERE id = 1').first();
              const globalDiscord = globalSettings?.discord_webhook_url || env.DISCORD_WEBHOOK_URL;
              const globalTelegram = globalSettings?.telegram_chat_id || env.TELEGRAM_GLOBAL_CHAT_ID;

              const vars = {
                manga: scanData?.manga_titulo || '',
                capitulo: numero,
                titulo: titulo || '',
                url: secretLink,
                cover_url: coverUrl
              };

              // -- Discord Global --
              if (globalDiscord) {
                await fetch(globalDiscord, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: buildDiscordBody(null, vars)
                }).catch(()=>{});
              }

              // -- Discord Scan --
              if (scanData?.webhook_discord && scanData.webhook_discord !== globalDiscord) {
                await fetch(scanData.webhook_discord, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: buildDiscordBody(scanData.discord_template, vars)
                }).catch(()=>{});
              }

              // -- Telegram --
              if (env.TELEGRAM_BOT_TOKEN) {
                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                
                // Global Telegram
                if (globalTelegram) {
                  await fetch(telegramUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: globalTelegram, photo: coverUrl, caption: buildTelegramCaption(null, vars), parse_mode: 'Markdown' })
                  }).catch(()=>{});
                }
                
                // Scan Telegram
                if (scanData?.telegram_chat_id && scanData.telegram_chat_id !== globalTelegram) {
                  await fetch(telegramUrl, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: scanData.telegram_chat_id, photo: coverUrl, caption: buildTelegramCaption(scanData.telegram_template, vars), parse_mode: 'Markdown' })
                  }).catch(()=>{});
                }
              }"""


old_cron = """              try {
                const scanData = await env.DB.prepare(
                  `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id, s.telegram_template
                   FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
                ).bind(capForWh.manga_id).first();
                
                const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                const secretLink = `${env.FRONTEND_URL}/leer/${capSecret?.secret_token}`;
                const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${capForWh.manga_id}`;

                const vars = {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: secretLink,
                  cover_url: coverUrl
                };

                // -- Discord Global --
                if (env.DISCORD_WEBHOOK_URL) {
                  await fetch(env.DISCORD_WEBHOOK_URL, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: buildDiscordBody(null, vars)
                  }).catch(()=>{});
                }

                // -- Discord Scan --
                if (scanData?.webhook_discord && scanData.webhook_discord !== env.DISCORD_WEBHOOK_URL) {
                  await fetch(scanData.webhook_discord, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: buildDiscordBody(scanData.discord_template, vars)
                  }).catch(()=>{});
                }

                // -- Telegram --
                if (env.TELEGRAM_BOT_TOKEN) {
                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  
                  // Global Telegram
                  if (env.TELEGRAM_GLOBAL_CHAT_ID) {
                    await fetch(telegramUrl, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: env.TELEGRAM_GLOBAL_CHAT_ID, photo: coverUrl, caption: buildTelegramCaption(null, vars), parse_mode: 'Markdown' })
                    }).catch(()=>{});
                  }
                  
                  // Scan Telegram
                  if (scanData?.telegram_chat_id && scanData.telegram_chat_id !== env.TELEGRAM_GLOBAL_CHAT_ID) {
                    await fetch(telegramUrl, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: scanData.telegram_chat_id, photo: coverUrl, caption: buildTelegramCaption(scanData.telegram_template, vars), parse_mode: 'Markdown' })
                    }).catch(()=>{});
                  }
                }
              } catch (e) {"""

new_cron = """              try {
                const scanData = await env.DB.prepare(
                  `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id, s.telegram_template
                   FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
                ).bind(capForWh.manga_id).first();
                
                const globalSettings = await env.DB.prepare('SELECT discord_webhook_url, telegram_chat_id FROM ajustes_globales WHERE id = 1').first();
                const globalDiscord = globalSettings?.discord_webhook_url || env.DISCORD_WEBHOOK_URL;
                const globalTelegram = globalSettings?.telegram_chat_id || env.TELEGRAM_GLOBAL_CHAT_ID;
                
                const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                const secretLink = `${env.FRONTEND_URL}/leer/${capSecret?.secret_token}`;
                const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${capForWh.manga_id}`;

                const vars = {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: secretLink,
                  cover_url: coverUrl
                };

                // -- Discord Global --
                if (globalDiscord) {
                  await fetch(globalDiscord, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: buildDiscordBody(null, vars)
                  }).catch(()=>{});
                }

                // -- Discord Scan --
                if (scanData?.webhook_discord && scanData.webhook_discord !== globalDiscord) {
                  await fetch(scanData.webhook_discord, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: buildDiscordBody(scanData.discord_template, vars)
                  }).catch(()=>{});
                }

                // -- Telegram --
                if (env.TELEGRAM_BOT_TOKEN) {
                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  
                  // Global Telegram
                  if (globalTelegram) {
                    await fetch(telegramUrl, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: globalTelegram, photo: coverUrl, caption: buildTelegramCaption(null, vars), parse_mode: 'Markdown' })
                    }).catch(()=>{});
                  }
                  
                  // Scan Telegram
                  if (scanData?.telegram_chat_id && scanData.telegram_chat_id !== globalTelegram) {
                    await fetch(telegramUrl, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: scanData.telegram_chat_id, photo: coverUrl, caption: buildTelegramCaption(scanData.telegram_template, vars), parse_mode: 'Markdown' })
                    }).catch(()=>{});
                  }
                }
              } catch (e) {"""

content = content.replace(old_upload, new_upload)
content = content.replace(old_cron, new_cron)

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\worker\src\index.js', 'w', encoding='utf-8') as f:
    f.write(content)
