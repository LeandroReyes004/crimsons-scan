// ============================================================
//  Crimson Scan — Secure Backend con Supabase Storage
// ============================================================
const express  = require('express');
const crypto   = require('crypto');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── Variables de entorno ────────────────────────────────────
const PORT         = process.env.PORT         || 3001;
const BASE_URL     = process.env.BASE_URL     || `http://localhost:${PORT}`;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[ERROR] Faltan SUPABASE_URL o SUPABASE_KEY en las variables de entorno.');
  process.exit(1);
}

// ── Cliente Supabase ────────────────────────────────────────
// Usamos la service-role key para tener permisos completos en Storage y DB.
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Multer: memoryStorage() — NO toca el disco ──────────────
// Los buffers de cada archivo quedan en RAM y los enviamos
// directamente a Supabase Storage sin escribir archivos temporales.
const upload = multer({ storage: multer.memoryStorage() });

// ── App Express ─────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── Token Store (simula Redis) ───────────────────────────────
// Map en memoria: token → { storagePath, ip, expiresAt }
const tokenStore = new Map();

// ── MIME types ───────────────────────────────────────────────
const MIME_TYPES = {
  '.webp': 'image/webp',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
};

// ============================================================
//  GET /api/chapters/:chapterId
//  Lee las páginas desde la tabla "pages" en Supabase,
//  genera un token de un solo uso por página y devuelve
//  la lista con image_url y scramble_map.
// ============================================================
app.get('/api/chapters/:chapterId', async (req, res) => {
  const { chapterId } = req.params;

  // 1. Consultar tabla "pages" filtrada por chapter_id,
  //    ordenada por page_number ascendente.
  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, page_number, storage_path, scramble_map')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('[Supabase DB] Error al leer páginas:', error.message);
    return res.status(500).json({ error: 'Error al leer páginas desde la base de datos.' });
  }

  if (!pages || pages.length === 0) {
    return res.status(404).json({ error: 'No se encontraron páginas para este capítulo.' });
  }

  // 2. Obtener IP del usuario para el token
  const userIp = req.ip || req.connection.remoteAddress;

  // 3. Generar un token de un solo uso por cada página
  const responsePages = pages.map(page => {
    const token = crypto.randomBytes(32).toString('hex');

    // Token válido por 5 minutos
    tokenStore.set(token, {
      storagePath: page.storage_path, // ruta dentro del bucket "manga-pages"
      ip: userIp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return {
      id: page.id,
      page_number: page.page_number,
      image_url: `${BASE_URL}/api/reader/page/${token}`,
      scramble_map: page.scramble_map,
    };
  });

  res.json({ pages: responsePages });
});

// ============================================================
//  GET /api/reader/page/:token
//  Valida el token, lo quema (ONE-TIME USE), descarga la imagen
//  desde Supabase Storage y la devuelve al cliente con
//  cabeceras de seguridad.
// ============================================================
app.get('/api/reader/page/:token', async (req, res) => {
  const { token } = req.params;
  const tokenData = tokenStore.get(token);

  // 1. Validar existencia y expiración
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(403).json({ error: 'Enlace expirado, inválido o ya utilizado.' });
  }

  // 2. Validar IP (anti-hotlinking básico)
  const userIp = req.ip || req.connection.remoteAddress;
  if (userIp !== tokenData.ip && userIp !== '::1') {
    return res.status(403).json({ error: 'IP Mismatch — acceso denegado.' });
  }

  // 3. Quemar el token ANTES de cualquier operación async
  //    para evitar race conditions de doble uso.
  tokenStore.delete(token);

  // 4. Descargar la imagen desde Supabase Storage
  const { data, error } = await supabase.storage
    .from('manga-pages')
    .download(tokenData.storagePath);

  if (error || !data) {
    console.error('[Supabase Storage] Error al descargar imagen:', error?.message);
    return res.status(500).json({ error: 'No se pudo obtener la imagen desde el almacenamiento.' });
  }

  // 5. Convertir el Blob de Supabase a Buffer para enviarlo con Express
  const buffer = Buffer.from(await data.arrayBuffer());

  // 6. Detectar Content-Type por la extensión real del archivo
  const ext = path.extname(tokenData.storagePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 7. Cabeceras de seguridad
  res.set({
    'Content-Type':              contentType,
    'Content-Disposition':       'inline',           // mostrar en browser, no descargar
    'X-Content-Type-Options':    'nosniff',           // evitar MIME sniffing
    'Cache-Control':             'no-store',          // nunca cachear tokens de un solo uso
    'Pragma':                    'no-cache',
  });

  res.send(buffer);
});

// ============================================================
//  POST /api/admin/upload-chapter
//  Recibe las imágenes via multipart/form-data, las sube a
//  Supabase Storage y registra cada página en la tabla "pages".
// ============================================================
app.post('/api/admin/upload-chapter', upload.array('images', 50), async (req, res) => {
  const { mangaId, mangaName, chapterId, chapterNum, webhookUrl } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron imágenes.' });
  }
  if (!mangaId || !chapterId || !chapterNum) {
    return res.status(400).json({ error: 'Faltan campos: mangaId, chapterId, chapterNum.' });
  }

  // ── Algoritmo Fisher-Yates para generar scramble_map ──────
  // En producción real, aquí usarías Sharp para cortar y
  // reordenar los tiles físicamente. Por ahora, el mapa
  // describe el orden que el Canvas usará para rearmar la imagen.
  function generateScrambleMap(size = 9) {
    const map = Array.from({ length: size }, (_, i) => i);
    for (let i = map.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [map[i], map[j]] = [map[j], map[i]];
    }
    return map;
  }

  const results   = [];
  const errors    = [];

  // Procesar cada imagen en paralelo con Promise.all
  await Promise.all(files.map(async (file, index) => {
    const storagePath = `mangas/${mangaId}/cap-${chapterNum}/${file.originalname}`;
    const scrambleMap = generateScrambleMap(9);

    // 1. Subir a Supabase Storage (bucket: "manga-pages")
    const { error: uploadError } = await supabase.storage
      .from('manga-pages')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,       // sobreescribir si existe (re-uploads)
      });

    if (uploadError) {
      console.error(`[Storage] Error al subir ${file.originalname}:`, uploadError.message);
      errors.push({ file: file.originalname, error: uploadError.message });
      return;
    }

    // 2. Guardar registro en la tabla "pages" de Supabase
    const { error: dbError } = await supabase
      .from('pages')
      .upsert({
        chapter_id:   chapterId,
        page_number:  index + 1,
        storage_path: storagePath,
        scramble_map: scrambleMap,
      }, {
        onConflict: 'chapter_id, page_number', // evitar duplicados
      });

    if (dbError) {
      console.error(`[DB] Error al guardar página ${index + 1}:`, dbError.message);
      errors.push({ file: file.originalname, error: dbError.message });
      return;
    }

    results.push({ file: file.originalname, page_number: index + 1, storagePath });
    console.log(`[Upload] ✔ ${file.originalname} → ${storagePath}`);
  }));

  // ── Notificación a Discord (opcional) ─────────────────────
  if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 ¡NUEVO CAPÍTULO PUBLICADO! 🚨\n\n📚 **Obra:** ${mangaName}\n📖 **Capítulo:** ${chapterNum}\n\n👉 ¡Corre a leerlo en nuestra web exclusiva!`,
          embeds: [{
            title:       `${mangaName} — Capítulo ${chapterNum}`,
            description: 'Haz click aquí para entrar al Lector Público.',
            color:       14950464, // Crimson #E41D40
            url:         process.env.FRONTEND_URL || `http://localhost:3000/manga/reader/${chapterId}`,
            footer:      { text: "Crimson's Scan Bot — Alertas Automáticas" },
          }],
        }),
      });
      console.log('[Discord] Webhook enviado con éxito.');
    } catch (e) {
      console.error('[Discord] Fallo al enviar Webhook:', e.message);
    }
  }

  // ── Respuesta final ────────────────────────────────────────
  if (errors.length > 0 && results.length === 0) {
    return res.status(500).json({ success: false, errors });
  }

  res.json({
    success:         true,
    message:         `${results.length} imágenes subidas a Supabase correctamente.`,
    pages_processed: results.length,
    pages_failed:    errors.length,
    errors:          errors.length > 0 ? errors : undefined,
    uploaded:        results,
  });
});

// ============================================================
//  Arranque del servidor
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ Crimson Scan Backend corriendo en ${BASE_URL}`);
});
