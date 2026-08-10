const fs = require('fs');
let code = fs.readFileSync('worker/src/index.js', 'utf8');

const target = `      const toPublish = await env.DB.prepare(
        \`SELECT c.id, c.numero, c.titulo, c.manga_id, m.titulo as manga_titulo
         FROM capitulos c JOIN mangas m ON c.manga_id = m.id
         WHERE c.estado = 'programado' AND datetime(c.fecha_publicacion) <= datetime('now')\`
      ).all();

      if (toPublish.length === 0) return;

      await env.DB.prepare(
        \`UPDATE capitulos SET estado = 'publicado'
         WHERE estado = 'programado' AND datetime(fecha_publicacion) <= datetime('now')\`
      ).run();

      for (const cap of toPublish) {
        try {
          const scanData = await env.DB.prepare(
            \`SELECT s.webhook_discord, s.discord_template FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?\`
          ).bind(cap.manga_id).first();
          const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
          if (!webhookUrl) continue;
          const mangaUrl = \`\${env.FRONTEND_URL}/manga/reader/\${cap.manga_id}\`;
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: buildDiscordBody(scanData?.discord_template, {
              manga: cap.manga_titulo,
              capitulo: cap.numero,
              titulo: cap.titulo || '',
              url: mangaUrl,
            }),
          });
        } catch {}
      }`;

const replacement = `      const toPublish = await env.DB.prepare(
        \`SELECT c.id, c.numero, c.titulo, c.secret_token, c.manga_id, m.titulo as manga_titulo
         FROM capitulos c JOIN mangas m ON c.manga_id = m.id
         WHERE c.estado = 'programado' AND datetime(c.fecha_publicacion) <= datetime('now')\`
      ).all();

      if (toPublish.length === 0) return;

      await env.DB.prepare(
        \`UPDATE capitulos SET estado = 'publicado'
         WHERE estado = 'programado' AND datetime(fecha_publicacion) <= datetime('now')\`
      ).run();

      for (const cap of toPublish) {
        try {
          const scanData = await env.DB.prepare(
            \`SELECT s.webhook_discord, s.discord_template, s.telegram_chat_id FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?\`
          ).bind(cap.manga_id).first();
          
          const secretLink = \`\${env.FRONTEND_URL}/leer/\${cap.secret_token}\`;
          const coverUrl = \`https://api.scancrimson.com/api/cover/\${cap.manga_id}\`;
          
          if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
            const telegramUrl = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendPhoto\`;
            const caption = \`📖 *\${cap.manga_titulo}*\\n\\nNuevo Capítulo \${cap.numero}\${cap.titulo ? \` - \${cap.titulo}\` : ''} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí](\${secretLink})\`;
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

          const webhookUrl = scanData?.webhook_discord || env.DISCORD_WEBHOOK_URL;
          if (webhookUrl) {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: buildDiscordBody(scanData?.discord_template, {
                manga: cap.manga_titulo,
                capitulo: cap.numero,
                titulo: cap.titulo || '',
                url: secretLink,
                cover_url: coverUrl
              }),
            });
          }
        } catch {}
      }`;

if (code.includes(target.trim().split('\\n')[0])) {
    code = code.replace(target, replacement);
    fs.writeFileSync('worker/src/index.js', code);
    console.log('Fixed cron job successfully.');
} else {
    console.log('Target not found. Doing fallback replacement.');
    // Try without formatting issues
    code = code.replace(/const toPublish \= await env\.DB\.prepare\([\s\S]+?\}\} catch \{\}\n      \}/, replacement);
    fs.writeFileSync('worker/src/index.js', code);
    console.log('Done with regex fallback.');
}
