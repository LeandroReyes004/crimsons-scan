const fs = require('fs');
let code = fs.readFileSync('worker/src/index.js', 'utf8');

const target1 = `        // Notificar Discord y Telegram si se pidió y el capítulo quedó publicado
        if (notify_discord && estado === 'publicado') {
          ctx.waitUntil((async () => {
            const apiDomain = new URL(request.url).origin;
            const secretLink = \`\${env.FRONTEND_URL}/leer/\${secret_token}\`;

            // -- Notificación Telegram --
            try {
              const scanData = await env.DB.prepare(
                \`SELECT m.titulo as manga_titulo, m.cover_r2_key, s.telegram_chat_id 
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?\`
              ).bind(manga_id).first();
              if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                const coverUrl = \`\${env.FRONTEND_URL}/api/cover/\${manga_id}\`;
                const secretLink = \`\${env.FRONTEND_URL}/leer/\${secret_token}\`;
                const caption = \`📖 *\${scanData.manga_titulo}*\\n\\nNuevo Capítulo \${numero}\${titulo ? \` - \${titulo}\` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](\${secretLink})\`;
                
                await fetch(telegramUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: scanData.telegram_chat_id,
                    text: caption,
                    
                    parse_mode: 'Markdown'
                  })
                });
              }
            } catch (e) {
              console.error('Error Telegram:', e);
            }
            // -- Notificación Discord --
            try {
              const scanData = await env.DB.prepare(
                \`SELECT s.webhook_discord, s.discord_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?\`
              ).bind(manga_id).first();
              const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
              if (!webhookUrl) return;
              const mangaUrl = \`\${env.FRONTEND_URL}/manga/reader/\${manga_id}\`;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(scanData?.discord_template, {
                  manga: scanData?.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: mangaUrl,
                  cover_url: \`\${env.FRONTEND_URL}/api/cover/\${manga_id}\`
                }),
              });
            } catch {}
          })());`;

const replace1 = `        // Notificar Discord y Telegram si se pidió y el capítulo quedó publicado
        if (notify_discord && estado === 'publicado') {
          ctx.waitUntil((async () => {
            const apiDomain = new URL(request.url).origin;
            const secretLink = \`\${env.FRONTEND_URL}/leer/\${secret_token}\`;

            // -- Notificación Telegram --
            try {
              const scanData = await env.DB.prepare(
                \`SELECT m.titulo as manga_titulo, m.cover_r2_key, s.telegram_chat_id 
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?\`
              ).bind(manga_id).first();
              if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendPhoto\`;
                const coverUrl = \`\${apiDomain}/api/cover/\${manga_id}\`;
                const caption = \`📖 *\${scanData.manga_titulo}*\\n\\nNuevo Capítulo \${numero}\${titulo ? \` - \${titulo}\` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](\${secretLink})\`;
                
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
                \`SELECT s.webhook_discord, s.discord_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?\`
              ).bind(manga_id).first();
              const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
              if (!webhookUrl) return;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(scanData?.discord_template, {
                  manga: scanData?.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: secretLink,
                  cover_url: \`\${apiDomain}/api/cover/\${manga_id}\`
                }),
              });
            } catch {}
          })());`;

code = code.replace(target1, replace1);

const target2 = `                // --- Telegram en Publish ---
                if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                  const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendPhoto\`;
                  const coverUrl = \`\${env.FRONTEND_URL}/api/cover/\${capForWh.manga_id}\`;
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = \`\${env.FRONTEND_URL}/leer/\${capSecret?.secret_token}\`;
                  const caption = \`📖 *\${capForWh.manga_titulo}*\\n\\nNuevo Capítulo \${capForWh.numero}\${capForWh.titulo ? \` - \${capForWh.titulo}\` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](\${secretLink})\`;
                  
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

              const mangaUrl = \`\${env.FRONTEND_URL}/manga/reader/\${capForWh.manga_id}\`;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(discordTemplate, {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: mangaUrl,
                  cover_url: \`\${env.FRONTEND_URL}/api/cover/\${capForWh.manga_id}\`
                }),
              });`;

const replace2 = `                // --- Telegram en Publish ---
                if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                  const apiDomain = new URL(request.url).origin;
                  const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendPhoto\`;
                  const coverUrl = \`\${apiDomain}/api/cover/\${capForWh.manga_id}\`;
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = \`\${env.FRONTEND_URL}/leer/\${capSecret?.secret_token}\`;
                  const caption = \`📖 *\${capForWh.manga_titulo}*\\n\\nNuevo Capítulo \${capForWh.numero}\${capForWh.titulo ? \` - \${capForWh.titulo}\` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](\${secretLink})\`;
                  
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
              
              const apiDomain = new URL(request.url).origin;
              const capSecretForDiscord = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
              const secretLink = \`\${env.FRONTEND_URL}/leer/\${capSecretForDiscord?.secret_token}\`;

              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: buildDiscordBody(discordTemplate, {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: secretLink,
                  cover_url: \`\${apiDomain}/api/cover/\${capForWh.manga_id}\`
                }),
              });`;

code = code.replace(target2, replace2);

const target3 = `            body: buildDiscordBody(scanData?.discord_template, {
              manga: cap.manga_titulo,
              capitulo: cap.numero,
              titulo: cap.titulo || '',
              url: mangaUrl,
              cover_url: \`\${env.FRONTEND_URL}/api/cover/\${cap.manga_id}\`
            }),`;

const replace3 = `            body: buildDiscordBody(scanData?.discord_template, {
              manga: cap.manga_titulo,
              capitulo: cap.numero,
              titulo: cap.titulo || '',
              url: \`\${env.FRONTEND_URL}/leer/\${cap.secret_token}\`,
              cover_url: \`https://api.scancrimson.com/api/cover/\${cap.manga_id}\`
            }),`;

code = code.replace(target3, replace3);

fs.writeFileSync('worker/src/index.js', code);
console.log('Fixed file');
