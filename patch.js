const fs = require('fs');
let code = fs.readFileSync('worker/src/index.js', 'utf8');

// 1. buildDiscordBody
code = code.replace(
/function buildDiscordBody\(template, vars\) {[\s\S]*?return JSON\.stringify\(\{[\s\S]*?embeds: \[\{[\s\S]*?\}\][\s\S]*?\}\);\s*\}/,
`function buildDiscordBody(template, vars) {
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
}`
);

// 2. Telegram SendMessage -> SendPhoto (first instance)
code = code.replace(
`const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`;
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
                });`,
`const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendPhoto\`;
                const coverUrl = \`\${env.FRONTEND_URL}/api/cover/\${manga_id}\`;
                const secretLink = \`\${env.FRONTEND_URL}/leer/\${secret_token}\`;
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
                }).catch(e => console.error('Telegram Error', e));`
);

// 3. Discord first instance
code = code.replace(
`body: buildDiscordBody(scanData?.discord_template, {
                  manga: scanData?.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: mangaUrl,
                }),`,
`body: buildDiscordBody(scanData?.discord_template, {
                  manga: scanData?.manga_titulo || '',
                  capitulo: numero,
                  titulo: titulo || '',
                  url: mangaUrl,
                  cover_url: \`\${env.FRONTEND_URL}/api/cover/\${manga_id}\`
                }),`
);

// 4. Telegram SendMessage -> SendPhoto (second instance)
code = code.replace(
`const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`;
                  const coverUrl = \`\${env.FRONTEND_URL}/api/cover/\${capForWh.manga_id}\`;
                  const capSecret = await env.DB.prepare('SELECT secret_token FROM capitulos WHERE id = ?').bind(publishCap[1]).first();
                  const secretLink = \`\${env.FRONTEND_URL}/leer/\${capSecret?.secret_token}\`;
                  const caption = \`📖 *\${capForWh.manga_titulo}*\\n\\nNuevo Capítulo \${capForWh.numero}\${capForWh.titulo ? \` - \${capForWh.titulo}\` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](\${secretLink})\`;
                  
                  await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: scanData.telegram_chat_id,
                      text: caption,
                      
                      parse_mode: 'Markdown'
                    })
                  }).catch(e => console.error('Telegram Error', e));`,
`const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendPhoto\`;
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
                  }).catch(e => console.error('Telegram Error', e));`
);

// 5. Discord second instance
code = code.replace(
`body: buildDiscordBody(discordTemplate, {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: mangaUrl,
                }),`,
`body: buildDiscordBody(discordTemplate, {
                  manga: capForWh.manga_titulo,
                  capitulo: capForWh.numero,
                  titulo: capForWh.titulo || '',
                  url: mangaUrl,
                  cover_url: \`\${env.FRONTEND_URL}/api/cover/\${capForWh.manga_id}\`
                }),`
);

// 6. Discord cron job instance
code = code.replace(
`body: buildDiscordBody(scanData?.discord_template, {
              manga: cap.manga_titulo,
              capitulo: cap.numero,
              titulo: cap.titulo || '',
              url: mangaUrl,
            }),`,
`body: buildDiscordBody(scanData?.discord_template, {
              manga: cap.manga_titulo,
              capitulo: cap.numero,
              titulo: cap.titulo || '',
              url: mangaUrl,
              cover_url: \`\${env.FRONTEND_URL}/api/cover/\${cap.manga_id}\`
            }),`
);

fs.writeFileSync('worker/src/index.js', code);
console.log('Patched worker/src/index.js');
