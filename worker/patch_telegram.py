import re
import sys

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the INSERT INTO capitulos in POST /api/chapters
    old_insert = """const id = crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO capitulos (id, manga_id, numero, titulo, uploader_id, estado, fecha_publicacion) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, manga_id, numero, titulo || null, user.id, estado, fechaPub).run();"""

    new_insert = """const id = crypto.randomUUID();
        const secret_token = crypto.randomUUID().split('-')[0];
        await env.DB.prepare(
          'INSERT INTO capitulos (id, manga_id, numero, titulo, uploader_id, estado, fecha_publicacion, secret_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, manga_id, numero, titulo || null, user.id, estado, fechaPub, secret_token).run();"""

    content = content.replace(old_insert, new_insert)
    if new_insert not in content:
        print("Failed to replace INSERT INTO capitulos")

    # 2. Add Telegram notification inside POST /api/chapters
    old_notify = """// Notificar Discord si se pidió y el capítulo quedó publicado
        if (notify_discord && estado === 'publicado') {
          ctx.waitUntil((async () => {
            try {
              const scanData = await env.DB.prepare(
                `SELECT s.webhook_discord, s.discord_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();"""
              
    new_notify = """// Notificar Discord y Telegram si se pidió y el capítulo quedó publicado
        if (notify_discord && estado === 'publicado') {
          ctx.waitUntil((async () => {
            // -- Notificación Telegram --
            try {
              const scanData = await env.DB.prepare(
                `SELECT m.titulo as manga_titulo, m.cover_r2_key, s.telegram_chat_id 
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();
              if (scanData?.telegram_chat_id && env.TELEGRAM_BOT_TOKEN) {
                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
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
                });
              }
            } catch (e) {
              console.error('Error Telegram:', e);
            }
            // -- Notificación Discord --
            try {
              const scanData = await env.DB.prepare(
                `SELECT s.webhook_discord, s.discord_template, m.titulo as manga_titulo
                 FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ?`
              ).bind(manga_id).first();"""

    content = content.replace(old_notify, new_notify)
    if new_notify not in content:
        print("Failed to replace Discord/Telegram notification in POST /api/chapters")

    # 3. Add GET /api/chapters/secret/:token before GET /api/chapters/:id/pages
    old_pages_route = """// ── GET /api/chapters/:id/pages ──────────────────────
      // Genera un token de un solo uso por página (5 min TTL en KV)"""

    new_secret_route = """// ── GET /api/chapters/secret/:token ───────────────────
      const secretPages = pathname.match(/^\\/api\\/chapters\\/secret\\/([^/]+)$/);
      if (secretPages && method === 'GET') {
        const token = secretPages[1];
        const cap = await env.DB.prepare(
          "SELECT c.*, m.es_adulto, m.tipo as manga_tipo, m.es_novela FROM capitulos c JOIN mangas m ON m.id = c.manga_id WHERE c.secret_token = ? AND c.estado = 'publicado'"
        ).bind(token).first();
        if (!cap) return err('Capítulo privado no encontrado o no disponible', 404);

        if (cap.es_novela) cap.manga_tipo = 'novela';

        const { results: paginas } = await env.DB.prepare(
          'SELECT * FROM paginas WHERE capitulo_id = ? ORDER BY orden ASC'
        ).bind(cap.id).all();

        const origin  = new URL(request.url).origin;
        const expires = Math.floor(Date.now() / 1000) + 6 * 3600; 

        const isNovela = (cap.manga_tipo || '').toLowerCase() === 'novela';

        const pages = isNovela ? [] : await Promise.all(paginas.map(async pag => {
          const sig = await signImageToken(cap.id, String(pag.orden), expires, env.IMG_SECRET);
          return {
            id:           pag.id,
            numero:       pag.numero,
            scramble_map: JSON.parse(pag.scramble_map || '[]'),
            image_url:    `${origin}/api/reader/${cap.id}/${pag.orden}?ts=${expires}&sig=${sig}`,
          };
        }));

        const [prevCap, nextCap] = await Promise.all([
          env.DB.prepare(
            "SELECT secret_token FROM capitulos WHERE manga_id = ? AND estado = 'publicado' AND numero < ? ORDER BY numero DESC LIMIT 1"
          ).bind(cap.manga_id, cap.numero).first(),
          env.DB.prepare(
            "SELECT secret_token FROM capitulos WHERE manga_id = ? AND estado = 'publicado' AND numero > ? ORDER BY numero ASC LIMIT 1"
          ).bind(cap.manga_id, cap.numero).first(),
        ]);

        return json({
          pages,
          capitulo: {
            id: cap.id, 
            numero: cap.numero, 
            titulo: cap.titulo, 
            manga_id: cap.manga_id,
            manga_tipo: cap.manga_tipo ? cap.manga_tipo.toLowerCase() : 'manga',
            es_adulto: !!cap.es_adulto,
            secret_token: cap.secret_token,
            prev_token: prevCap?.secret_token || null,
            next_token: nextCap?.secret_token || null,
          },
        });
      }

      // ── GET /api/chapters/:id/pages ──────────────────────
      // Genera un token de un solo uso por página (5 min TTL en KV)"""

    content = content.replace(old_pages_route, new_secret_route)
    if new_secret_route not in content:
        print("Failed to insert GET /api/chapters/secret/:token")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print("Successfully patched index.js")

if __name__ == "__main__":
    patch_file(r"c:\Users\leandro.reyes\Music\crimsons-scan\worker\src\index.js")
