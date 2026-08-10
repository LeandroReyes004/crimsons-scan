with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\worker\src\index.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_upload = """            // -- Notificación Telegram --
            try {
              const scanData = await env.DB.prepare(
                `SELECT m.titulo as manga_titulo, m.cover_r2_key, s.telegram_chat_id, s.telegram_template 
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();
              if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${manga_id}`;
                const secretLink = `${env.FRONTEND_URL}/leer/${secret_token}`;
                const caption = buildTelegramCaption(scanData.telegram_template, {
                  manga: scanData.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: secretLink
                });
                
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
            } catch (e) {
              console.error('Error Telegram:', e);
            }
            // -- Notificación Discord --
            try {
              const scanData = await env.DB.prepare(
                `SELECT s.webhook_discord, s.discord_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();
              const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
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
              });
            } catch {}"""

new_upload = """            try {
              const scanData = await env.DB.prepare(
                `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id, s.telegram_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();
              
              const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${manga_id}`;
              const secretLink = `${env.FRONTEND_URL}/leer/${secret_token}`;
              
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
              }
            } catch (e) {
              console.error('Error notificaciones:', e);
            }"""

old_cron = """              let webhookUrl = env.DISCORD_WEBHOOK_URL;
              let discordTemplate = null;
              try {
                const scanData = await env.DB.prepare(
                  `SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id
                   FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
                ).bind(capForWh.manga_id).first();
                
                if (scanData?.webhook_discord) {
                  webhookUrl = scanData.webhook_discord;
                  discordTemplate = scanData.discord_template;
                } else if (admin.scan_id) {
                  const adminScanData = await env.DB.prepare(
                    `SELECT webhook_discord, discord_template FROM scans WHERE id = ?`
                  ).bind(admin.scan_id).first();
                  if (adminScanData?.webhook_discord) {
                    webhookUrl = adminScanData.webhook_discord;
                    discordTemplate = adminScanData.discord_template;
                  }
                }

                // --- Telegram en Publish ---
                if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                  const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                  const coverUrl = `https://crimson-api.leandro-reyes1025.workers.dev/api/cover/${capForWh.manga_id}`;
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = `${env.FRONTEND_URL}/leer/${capSecret?.secret_token}`;
                  const caption = buildTelegramCaption(scanData.telegram_template, {
                    manga: capForWh.manga_titulo,
                    capitulo: capForWh.numero,
                    titulo: capForWh.titulo || '',
                    url: secretLink
                  });
                  
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
                // -----------------------------
              } catch {}

              if (!webhookUrl) return;
              
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

new_cron = """              try {
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
              } catch (e) {
                console.error('Error notificaciones cron:', e);
              }"""

content = content.replace(old_upload, new_upload)
content = content.replace(old_cron, new_cron)

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\worker\src\index.js', 'w', encoding='utf-8') as f:
    f.write(content)
