const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const multer = require('multer');

// Configuración de Multer para aceptar los capítulos subidos por el Admin
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // En un sistema real buscaríamos/crearíamos la carpeta del capítulo
    const fs = require('fs');
    if (!fs.existsSync('mangas')) fs.mkdirSync('mangas');
    cb(null, 'mangas/')
  },
  filename: function (req, file, cb) {
    // Si la foto se llama "pagina_01.jpg", tratamos de conservar el nombre o hashearlo
    cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());

// Simulamos a Redis con un Map en memoria (Para el Rate Limiting y Tokenización)
const tokenStore = new Map();

/**
 * 1. Simulación de lectura del Manga proporcionado por el usuario
 */
const fs = require('fs');
const path = require('path');

function getMangaPages() {
  const mangasDir = path.join(__dirname, 'mangas');
  if (!fs.existsSync(mangasDir)) return [];
  
  const files = fs.readdirSync(mangasDir).filter(f => f.match(/\.(webp|jpg|jpeg|png)$/i));
  // Ordenar alfabéticamente para que las páginas salgan en orden
  files.sort();

  return files.map((file, index) => ({
    id: index + 1,
    path: path.join('mangas', file),
    // Usamos el mapa [0,1,2,3,4,5,6,7,8] que es el orden NORMAL.
    // Como las imágenes que el usuario subirá NO están "scrambled" (mezcladas) desde el servidor,
    // el canvas simplemente las dibujará en el orden correcto. En producción real, la imagen se corta y este array se aleatoriza.
    scramble_map: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    order_index: index
  }));
}

/**
 * Código Clave 2: Endpoint para Generador de URL Segura y Datos del Capítulo
 */
app.get('/api/chapters/:chapterId', (req, res) => {
  const pages = getMangaPages();

  if (pages.length === 0) return res.status(404).json({ error: 'No se encontraron imágenes. Pon tu manga en backend/mangas/' });

  // Obtenemos IP (en Express detrás de proxies, usar req.ip o req.headers['x-forwarded-for'])
  const userIp = req.ip || req.connection.remoteAddress;

  const responsePages = pages.map(page => {
    // Generar un token único y seguro (SHA-256)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Guardar en nuestro almacén temporal (simulando Redis)
    // El token expira en 5 minutos
    tokenStore.set(token, {
      path: page.path,
      ip: userIp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutos
    });

    return {
      id: page.id,
      image_url: `http://localhost:3001/api/reader/page/${token}`, // URL de acceso único
      scramble_map: page.scramble_map // Frontend necesita esto para armar el puzzle
    };
  });

  res.json({ pages: responsePages });
});

/**
 * Código Clave 2: Endpoint del Servidor de Imágenes Seguras
 */
app.get('/api/reader/page/:token', (req, res) => {
  const token = req.params.token;
  const tokenData = tokenStore.get(token);

  // 1. Validar Token Existente y Expiración
  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(403).json({ error: 'Enlace expirado, inválido o ya utilizado.' });
  }

  // 2. Strict Check (IP Mismatch)
  const userIp = req.ip || req.connection.remoteAddress;
  if (userIp !== tokenData.ip && userIp !== '::1') { // Exception for localhost IPv6 '::1'
    return res.status(403).json({ error: 'Conflicto de dirección lógica (IP Mismatch).' });
  }

  // 3. Quemar (Invalidar) el token inmediatamente (ONE-TIME USE)
  tokenStore.delete(token);

  // 4. Agregar cabeceras restrictivas para caché
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Content-Type': 'image/webp', // Siempre ofuscamos con el MIME real
  });

  // 5. Devolver la imagen Scrambled
  // En un entorno real usamos `res.sendFile(storage_path)`. Para esta prueba enviaremos algo representativo.
  const path = require('path');
  res.sendFile(path.join(__dirname, tokenData.path));
});

/**
 * Endpoint Definitivo: Motor de Subida con Scrambling y Alertas a Discord
 */
app.post('/api/admin/upload-chapter', upload.array('images', 50), async (req, res) => {
  const { mangaName, chapterNum, webhookUrl } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron imágenes.' });
  }

  // >>> Lógica de particionado y ofuscación (Backend) <<<
  // Aquí es donde un conversor como Sharp leería file.path, la cortaría físicamente en 9 piezas,
  // la desordenaría, y crearía la nueva imagen .webp junto con el `shuffledMap` que la arme en el canvas.
  const gridSize = 9; // 3x3 normal
  const normalMap = Array.from({length: gridSize}, (_, i) => i);
  // Barajar aleatoriamente usando algoritmo Fisher-Yates
  const shuffledMap = [...normalMap];
  for (let i = shuffledMap.length - 1; i > 0; i--) {
     const j = Math.floor(Math.random() * (i + 1));
     [shuffledMap[i], shuffledMap[j]] = [shuffledMap[j], shuffledMap[i]];
  }

  // Simulando que guardamos la BD el estado "revuelto"
  console.log(`[Ofuscador] Procesadas ${files.length} imágenes. Mapa de desencriptación generado: ${shuffledMap}`);

  // >>> Notificación de Webhook a Discord <<<
  if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    try {
      const payload = {
        content: `🚨 ¡NUEVO CAPÍTULO PUBLICADO! 🚨\n\n**Olla familia Crimson's Scan**, ya está disponible el capítulo protegido anticopia de nuestra serie estrella.\n\n📚 **Obra:** ${mangaName}\n📖 **Capítulo:** ${chapterNum}\n\n👉 ¡Corre a leerlo en nuestra web exclusiva!`,
        embeds: [{
          title: `${mangaName} - Capítulo ${chapterNum}`,
          description: "Haz click aquí para entrar al Lector Público.",
          color: 14950464, // Color Crimson Hex #E41D40
          url: "http://localhost:3000/manga/reader/1",
          footer: { text: "Crimson's Scan Bot - Alertas Automáticas" }
        }]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log("[Discord] Notificación Webhook disparada con éxito.");
    } catch (e) {
      console.error("[Discord] Fallo al enviar Webhook:", e.message);
    }
  }

  res.json({
    success: true,
    message: "Imágenes procesadas y subidas correctamente. Alerta webhook enviada en segundo plano.",
    pages_processed: files.length,
    scramble_key: shuffledMap // Solo para debug.
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Crimson Scan Secure Backend simulado corriendo en puerto ${PORT}`);
});
