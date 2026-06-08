// ============================================================
//  Crimson Scan — Cloudflare Worker
//  DB: D1  |  Storage: R2  |  Imágenes: HMAC stateless (sin KV)
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Fingerprint',
};

// ── Respuestas rápidas ─────────────────────────────────────
const json  = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

const err   = (msg, status = 400) => json({ error: msg }, status);

// ── JWT (Web Crypto nativo — sin dependencias) ─────────────
async function signJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días
  }));
  const data = `${header}.${body}`;
  const key  = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    const data = `${header}.${body}`;
    const key  = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
    const valid    = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── HMAC para URLs firmadas de imágenes (stateless, cero KV) ──
// Firma: HMAC-SHA256 sobre "chapterId:pageOrder:expires"
// TTL por defecto: 6 horas. Sin estado, sin escrituras a KV.
async function signImageToken(chapterId, pageOrder, expires, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const msg = new TextEncoder().encode(`${chapterId}:${pageOrder}:${expires}`);
  const buf = await crypto.subtle.sign('HMAC', key, msg);
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifyImageToken(chapterId, pageOrder, ts, sig, secret) {
  if (!ts || !sig || !secret) return false;
  if (parseInt(ts) < Math.floor(Date.now() / 1000)) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    const msg = new TextEncoder().encode(`${chapterId}:${pageOrder}:${ts}`);
    return await crypto.subtle.verify('HMAC', key, sigBytes, msg);
  } catch {
    return false;
  }
}

// ── Hashing de contraseñas (PBKDF2 nativo) ────────────────
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const toHex = arr => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  if (!stored.includes(':')) return password === stored; // contraseñas viejas plain text
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const newHash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return newHash === hashHex;
}

// ── v2.0 — Email de invitación via Resend API ─────────────
// Requiere secrets: RESEND_API_KEY, RESEND_FROM (wrangler secret put ...)
async function sendInviteEmail(to, username, setupUrl, apiKey, from) {
  if (!apiKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from || "Crimson's Scan <noreply@scancrimson.com>",
        to: [to],
        subject: "Configurá tu contraseña — Crimson's Scan",
        html: `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#f3f4f6;font-family:sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#0a0a0c;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#e11d48,#f97316);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Crimson's Scan</h1>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 8px;color:#fff;font-size:20px;">¡Hola, ${username}!</h2>
    <p style="color:#9ca3af;margin:0 0 24px;line-height:1.7;font-size:14px;">
      El admin te creó una cuenta en el equipo. Hacé clic en el botón de abajo para configurar tu contraseña y activar tu cuenta.<br><br>
      <strong style="color:#f9fafb;">El link expira en 48 horas.</strong>
    </p>
    <a href="${setupUrl}"
       style="display:inline-block;background:linear-gradient(135deg,#e11d48,#f97316);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">
      Configurar mi contraseña →
    </a>
    <p style="color:#6b7280;font-size:12px;margin:24px 0 0;line-height:1.6;">
      Si no esperabas este email, podés ignorarlo sin problema.<br>
      Link directo: <a href="${setupUrl}" style="color:#e11d48;">${setupUrl}</a>
    </p>
  </div>
</div>
</body></html>`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Middleware de auth ─────────────────────────────────────
async function getUser(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return await verifyJWT(auth.slice(7), env.JWT_SECRET);
}

async function requireAdmin(request, env) {
  const user = await getUser(request, env);
  return (user?.is_superadmin || user?.rol === 'admin' || user?.rol === 'admin_scan') ? user : null;
}

function isScanAdmin(user) {
  return user?.rol === 'admin_scan' && !user?.is_superadmin;
}

async function requireSuperAdmin(request, env) {
  const user = await getUser(request, env);
  return user?.is_superadmin ? user : null;
}

// Permite soporte + todos los niveles de admin
async function requireSupport(request, env) {
  const user = await getUser(request, env);
  return (user?.is_superadmin || user?.rol === 'admin' || user?.rol === 'admin_scan' || user?.rol === 'soporte') ? user : null;
}

function isSoporte(user) {
  return user?.rol === 'soporte' && !user?.is_superadmin;
}

// ── Slugs para URLs amigables ──────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // quitar tildes: á→a, ñ→n, etc.
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function uniqueSlug(base, table, env, excludeId = null) {
  let slug = slugify(base) || 'item';
  let candidate = slug;
  let n = 2;
  while (true) {
    const row = excludeId
      ? await env.DB.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).bind(candidate, excludeId).first()
      : await env.DB.prepare(`SELECT id FROM ${table} WHERE slug = ?`).bind(candidate).first();
    if (!row) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

// ── Scramble map para ofuscar páginas ─────────────────────
function generateScrambleMap(size = 9) {
  const map = Array.from({ length: size }, (_, i) => i);
  for (let i = map.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [map[i], map[j]] = [map[j], map[i]];
  }
  return map;
}

// ── CONTENT TYPE por extensión ─────────────────────────────
function contentType(key) {
  if (key.endsWith('.webp')) return 'image/webp';
  if (key.endsWith('.png'))  return 'image/png';
  if (key.endsWith('.gif'))  return 'image/gif';
  return 'image/jpeg';
}


// ============================================================
//  ROUTER PRINCIPAL
// ============================================================
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {

      // ── Reset mensual de vistas (1° de cada mes a medianoche ARG) ──
      if (event.cron === '0 3 1 * *') {
        await env.DB.prepare('UPDATE mangas SET views_mes = 0').run();
        return;
      }

      // ── Cada 5 min: publica capítulos programados ──────────────────
      const { results: toPublish } = await env.DB.prepare(
        `SELECT c.id, c.numero, c.titulo, c.manga_id, m.titulo as manga_titulo
         FROM capitulos c JOIN mangas m ON c.manga_id = m.id
         WHERE c.estado = 'programado' AND c.fecha_publicacion <= datetime('now')`
      ).all();

      if (toPublish.length === 0) return;

      await env.DB.prepare(
        `UPDATE capitulos SET estado = 'publicado'
         WHERE estado = 'programado' AND fecha_publicacion <= datetime('now')`
      ).run();

      if (env.DISCORD_WEBHOOK_URL) {
        for (const cap of toPublish) {
          const capTitle = cap.titulo ? ` — ${cap.titulo}` : '';
          const mangaUrl = `${env.FRONTEND_URL}/manga/reader/${cap.manga_id}`;
          await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: '📖 Nuevo capítulo publicado',
                description: `**${cap.manga_titulo}** — Capítulo ${cap.numero}${capTitle}\n\n[👁 Leer ahora](${mangaUrl})`,
                color: 0xe11d48,
                url: mangaUrl,
                footer: { text: "Crimson's Scan" },
                timestamp: new Date().toISOString(),
              }]
            })
          }).catch(() => {});
        }
      }
    })());
  },

  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    try {

      // ── POST /api/auth/login ─────────────────────────────
      if (pathname === '/api/auth/login' && method === 'POST') {
        const { username, password } = await request.json();
        if (!username || !password) return err('Ingresá tu usuario y contraseña');

        const user = await env.DB.prepare(
          `SELECT u.*, s.nombre as scan_nombre
           FROM usuarios u LEFT JOIN scans s ON u.scan_id = s.id
           WHERE u.username = ? AND u.activo = 1`
        ).bind(username).first();

        if (!user || !(await verifyPassword(password, user.password_hash))) {
          return err('Usuario o contraseña incorrectos', 401);
        }

        await env.DB.prepare("UPDATE usuarios SET ultimo_acceso = datetime('now') WHERE id = ?")
          .bind(user.id).run();

        const token = await signJWT(
          { id: user.id, username: user.username, rol: user.rol, is_superadmin: user.is_superadmin === 1, scan_id: user.scan_id || null },
          env.JWT_SECRET
        );

        return json({
          token,
          user: { id: user.id, username: user.username, display_name: user.display_name || null, rol: user.rol, avatar_url: user.avatar_url, is_superadmin: user.is_superadmin === 1, scan_id: user.scan_id || null, scan_nombre: user.scan_nombre || null }
        });
      }

      // ── POST /api/auth/register (solo admin puede crear usuarios) ──
      // v2.0 — password ahora es opcional; si se omite se envía email de invitación
      if (pathname === '/api/auth/register' && method === 'POST') {
        const admin = await requireSupport(request, env);
        if (!admin) return err('No tenés permisos para crear usuarios', 403);

        const { username, email, password, rol, scan_id } = await request.json();
        if (!username || !email) return err('Username y email son requeridos');

        // Soporte solo puede crear usuarios con roles no-admin
        if (isSoporte(admin) && rol && !['uploader', 'lector'].includes(rol)) {
          return err('No tenés permisos para asignar ese rol', 403);
        }

        const exists = await env.DB.prepare('SELECT id FROM usuarios WHERE username = ? OR email = ?')
          .bind(username, email).first();
        if (exists) return err('Ese usuario o email ya está registrado');

        const id = crypto.randomUUID();

        if (password) {
          // Modo clásico (backwards-compatible): admin asigna la contraseña directamente
          const hash = await hashPassword(password);
          await env.DB.prepare(
            'INSERT INTO usuarios (id, username, email, password_hash, rol, scan_id) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(id, username, email, hash, rol || 'uploader', scan_id || null).run();
          return json({ userId: id, message: 'Usuario creado', emailSent: false }, 201);
        }

        // Modo invitación: cuenta pendiente hasta que el usuario configure su contraseña
        await env.DB.prepare(
          'INSERT INTO usuarios (id, username, email, password_hash, rol, scan_id, activo) VALUES (?, ?, ?, ?, ?, ?, 0)'
        ).bind(id, username, email, '__pending__', rol || 'uploader', scan_id || null).run();

        const token    = crypto.randomUUID();
        const ttl      = 48 * 60 * 60; // 48 horas en segundos
        await env.KV.put(`setup:${token}`, JSON.stringify({ userId: id, username, email }), { expirationTtl: ttl });

        const setupUrl = `${env.FRONTEND_URL}/setup-password?token=${token}`;
        const emailSent = await sendInviteEmail(email, username, setupUrl, env.RESEND_API_KEY, env.RESEND_FROM);

        return json({
          userId: id,
          message: emailSent ? `Email de invitación enviado a ${email}` : 'Usuario creado — configurá RESEND_API_KEY para enviar el email',
          emailSent,
          setupUrl: emailSent ? undefined : setupUrl, // devuelve el link si no pudo enviar email
        }, 201);
      }

      // ── POST /api/auth/setup-password ─────────────────────
      // v2.0 — el usuario configura su contraseña desde el link del email
      if (pathname === '/api/auth/setup-password' && method === 'POST') {
        const { token, password } = await request.json();
        if (!token) return err('Token requerido');
        if (!password || password.length < 6) return err('La contraseña debe tener al menos 6 caracteres');

        const raw = await env.KV.get(`setup:${token}`);
        if (!raw) return err('El link expiró o ya fue usado. Pedile al admin que te reenvíe la invitación.', 410);

        const { userId, username } = JSON.parse(raw);

        const hash = await hashPassword(password);
        await env.DB.prepare('UPDATE usuarios SET password_hash = ?, activo = 1 WHERE id = ?')
          .bind(hash, userId).run();

        await env.KV.delete(`setup:${token}`);

        // Auto-login: leer rol y scan_id reales del DB para el JWT
        const dbUser = await env.DB.prepare('SELECT rol, is_superadmin, scan_id FROM usuarios WHERE id = ?').bind(userId).first();
        const jwtToken = await signJWT(
          { id: userId, username, rol: dbUser?.rol || 'uploader', is_superadmin: !!(dbUser?.is_superadmin), scan_id: dbUser?.scan_id || null },
          env.JWT_SECRET
        );

        return json({ message: 'Contraseña configurada. ¡Bienvenido!', token: jwtToken, username });
      }

      // ── GET /api/auth/me ─────────────────────────────────
      if (pathname === '/api/auth/me' && method === 'GET') {
        const user = await getUser(request, env);
        if (!user) return err('No autenticado', 401);
        const profile = await env.DB.prepare(
          `SELECT id, username, display_name, email, rol, avatar_url, color_acento, bio, fecha_registro, is_superadmin, scan_id,
            (SELECT COUNT(*) FROM comentarios WHERE usuario_id = u.id) as total_comentarios
           FROM usuarios u WHERE u.id = ?`
        ).bind(user.id).first();
        return json(profile);
      }

      // ── PUT /api/auth/me ──────────────────────────────────
      if (pathname === '/api/auth/me' && method === 'PUT') {
        const user = await getUser(request, env);
        if (!user) return err('No autenticado', 401);
        const body = await request.json();

        if ('display_name' in body) {
          const displayName = (body.display_name?.trim() || '').slice(0, 50) || null;
          await env.DB.prepare('UPDATE usuarios SET display_name = ? WHERE id = ?').bind(displayName, user.id).run();
          return json({ message: 'Nombre público actualizado', display_name: displayName });
        }

        if ('username' in body) {
          const newUsername = body.username?.trim();
          if (!newUsername || newUsername.length < 3) return err('El nombre debe tener al menos 3 caracteres', 400);
          if (newUsername.length > 30) return err('Máximo 30 caracteres', 400);
          if (!/^[a-zA-Z0-9_\-\.]+$/.test(newUsername)) return err('Solo letras, números, _, - y .', 400);
          const existing = await env.DB.prepare('SELECT id FROM usuarios WHERE username = ? AND id != ?').bind(newUsername, user.id).first();
          if (existing) return err('Ese nombre ya está en uso', 409);
          await env.DB.prepare('UPDATE usuarios SET username = ? WHERE id = ?').bind(newUsername, user.id).run();
          return json({ message: 'Nombre actualizado', username: newUsername });
        }

        if ('color_acento' in body) {
          await env.DB.prepare('UPDATE usuarios SET color_acento = ? WHERE id = ?')
            .bind(body.color_acento || null, user.id).run();
          return json({ message: 'Perfil actualizado' });
        }

        if ('bio' in body) {
          const bio = body.bio?.trim().slice(0, 200) || null;
          await env.DB.prepare('UPDATE usuarios SET bio = ? WHERE id = ?').bind(bio, user.id).run();
          return json({ message: 'Biografía actualizada' });
        }

        return json({ message: 'Sin cambios' });
      }

      // ── POST /api/upload/avatar ───────────────────────────
      if (pathname === '/api/upload/avatar' && method === 'POST') {
        const user = await getUser(request, env);
        if (!user) return err('No autenticado', 401);
        const fd   = await request.formData();
        const file = fd.get('avatar');
        if (!file) return err('Falta el archivo');
        const ext    = (file.name?.split('.').pop() || 'jpg').toLowerCase();
        const r2_key = `scancrimson.com/avatars/${user.id}.${ext}`;
        await env.R2.put(r2_key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'image/jpeg' } });
        await env.DB.prepare('UPDATE usuarios SET avatar_url = ? WHERE id = ?').bind(r2_key, user.id).run();
        return json({ avatar_url: r2_key });
      }

      // ── GET /api/avatar/:userId ───────────────────────────
      const avatarRoute = pathname.match(/^\/api\/avatar\/([^/]+)$/);
      if (avatarRoute && method === 'GET') {
        const u = await env.DB.prepare('SELECT avatar_url FROM usuarios WHERE id = ?').bind(avatarRoute[1]).first();
        if (!u?.avatar_url) return err('Avatar no encontrado', 404);
        const object = await env.R2.get(u.avatar_url);
        if (!object) return err('Imagen no encontrada', 404);
        return new Response(object.body, { headers: { 'Content-Type': contentType(u.avatar_url), 'Cache-Control': 'public, max-age=300', ...CORS } });
      }

      // ── GET /api/mangas ──────────────────────────────────
      if (pathname === '/api/mangas' && method === 'GET') {
        const caller    = await getUser(request, env);
        const isAdmin   = caller && (caller.is_superadmin || caller.rol === 'admin' || caller.rol === 'admin_scan' || caller.rol === 'soporte');
        const isScanMember = caller && !isAdmin && caller.scan_id;
        // Admin o uploader autenticado pasa ?admin=1 para ver todos los mangas incluyendo +18
        const canSeeAdult = caller && (isAdmin || caller.rol === 'uploader');
        const showAll   = canSeeAdult && new URL(request.url).searchParams.get('admin') === '1';

        const subqueries = `
            (SELECT numero FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_capitulo,
            (SELECT id     FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_capitulo_id,
            (SELECT fecha_publicacion FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_cap_fecha`;

        const adultFilter = showAll ? '' : 'AND (m.es_adulto = 0 OR m.es_adulto IS NULL)';

        const query_all = `
          SELECT m.*, s.nombre as scan_nombre, ${subqueries}
          FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id
          WHERE 1=1 ${adultFilter}
          ORDER BY ultimo_cap_fecha DESC NULLS LAST, m.fecha_actualizacion DESC`;
        const query_scan = `
          SELECT m.*, s.nombre as scan_nombre, ${subqueries}
          FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id
          WHERE m.scan_id = ? ${adultFilter}
          ORDER BY ultimo_cap_fecha DESC NULLS LAST, m.fecha_actualizacion DESC`;

        // admin_scan ve solo los mangas de su scan — leer scan_id de DB, no del JWT
        let callerScanId = caller?.scan_id;
        if (isScanAdmin(caller) && caller?.id) {
          const dbU = await env.DB.prepare('SELECT scan_id FROM usuarios WHERE id = ?').bind(caller.id).first();
          callerScanId = dbU?.scan_id || null;
        }
        const filterByScan = isScanMember || (isAdmin && isScanAdmin(caller) && callerScanId);
        const { results } = filterByScan
          ? await env.DB.prepare(query_scan).bind(callerScanId).all()
          : await env.DB.prepare(query_all).all();

        return json({ mangas: results });
      }

      // ── GET /api/mangas/adulto ────────────────────────────
      if (pathname === '/api/mangas/adulto' && method === 'GET') {
        const subqueries = `
            (SELECT numero FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_capitulo,
            (SELECT id     FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_capitulo_id,
            (SELECT fecha_publicacion FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_cap_fecha`;

        const { results } = await env.DB.prepare(`
          SELECT m.*, s.nombre as scan_nombre, ${subqueries}
          FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id
          WHERE m.es_adulto = 1
          ORDER BY ultimo_cap_fecha DESC NULLS LAST, m.fecha_actualizacion DESC
        `).all();

        return json({ mangas: results });
      }

      // ── POST /api/mangas ─────────────────────────────────
      if (pathname === '/api/mangas' && method === 'POST') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);

        const body = await request.json();
        const { titulo, titulo_alt, descripcion, generos, tipo, estado, scan_id, es_adulto } = body;
        if (!titulo) return err('El título es obligatorio');

        // admin_scan siempre crea bajo su propio scan — leer scan_id de DB, no del JWT
        let finalScanId;
        if (isScanAdmin(admin)) {
          const dbU = await env.DB.prepare('SELECT scan_id FROM usuarios WHERE id = ?').bind(admin.id).first();
          finalScanId = dbU?.scan_id || null;
          if (!finalScanId) return err('Tu cuenta no tiene un scan asignado. Contactá al superadmin.', 403);
        } else {
          finalScanId = scan_id || null;
        }

        const id   = crypto.randomUUID();
        const slug = await uniqueSlug(titulo, 'mangas', env);
        await env.DB.prepare(
          `INSERT INTO mangas (id, titulo, titulo_alt, descripcion, generos, tipo, estado, uploader_id, scan_id, es_adulto, slug)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, titulo, titulo_alt || null, descripcion || null,
          JSON.stringify(generos || []), tipo || 'manga',
          estado || 'en_curso', admin.id, finalScanId, es_adulto ? 1 : 0, slug
        ).run();

        return json({ mangaId: id, slug, message: 'Manga creado' }, 201);
      }

      // ── GET /api/mangas/:id ──────────────────────────────
      const mangaById = pathname.match(/^\/api\/mangas\/([^/]+)$/);
      if (mangaById && method === 'GET') {
        const manga = await env.DB.prepare(
          `SELECT m.*, s.nombre as scan_nombre, s.slug as scan_slug FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id WHERE m.id = ? OR m.slug = ?`
        ).bind(mangaById[1], mangaById[1]).first();
        if (!manga) return err('Manga no encontrado', 404);

        const url2 = new URL(request.url);
        const adminReq = url2.searchParams.get('admin') === '1';
        let capitulosQuery, capitulosResult;
        if (adminReq) {
          const adminUser = await requireAdmin(request, env);
          capitulosResult = await env.DB.prepare(
            `SELECT id, numero, titulo, views, fecha_subida, estado
             FROM capitulos WHERE manga_id = ?
             ORDER BY numero DESC`
          ).bind(mangaById[1]).all();
        } else {
          capitulosResult = await env.DB.prepare(
            `SELECT id, numero, titulo, views, fecha_subida
             FROM capitulos WHERE manga_id = ? AND estado = 'publicado'
             ORDER BY numero DESC`
          ).bind(mangaById[1]).all();
        }

        return json({ manga, capitulos: capitulosResult.results });
      }

      // ── GET /api/scan-image/:scanId ──────────────────────
      const scanImage = pathname.match(/^\/api\/scan-image\/([^/]+)$/);
      if (scanImage && method === 'GET') {
        const s = await env.DB.prepare('SELECT imagen_url FROM scans WHERE id = ? OR slug = ?').bind(scanImage[1], scanImage[1]).first();
        if (!s?.imagen_url) return err('Imagen no encontrada', 404);
        const object = await env.R2.get(s.imagen_url);
        if (!object) return err('Imagen no encontrada', 404);
        return new Response(object.body, { headers: { 'Content-Type': contentType(s.imagen_url), 'Cache-Control': 'public, max-age=300', ...CORS } });
      }

      // ── GET /api/scans/:id ────────────────────────────────
      const scanById = pathname.match(/^\/api\/scans\/([^/]+)$/);
      if (scanById && method === 'GET') {
        const scan = await env.DB.prepare('SELECT id, nombre, descripcion, imagen_url, slug FROM scans WHERE (id = ? OR slug = ?) AND activo = 1').bind(scanById[1], scanById[1]).first();
        if (!scan) return err('Scan no encontrado', 404);
        const { results: mangas } = await env.DB.prepare(
          `SELECT m.id, m.titulo, m.tipo, m.estado, m.cover_r2_key, m.views_total, m.generos, m.es_adulto,
            (SELECT numero FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_capitulo,
            (SELECT id FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_capitulo_id,
            (SELECT fecha_publicacion FROM capitulos WHERE manga_id = m.id AND estado = 'publicado' ORDER BY numero DESC LIMIT 1) as ultimo_cap_fecha
           FROM mangas m WHERE m.scan_id = ?
           ORDER BY m.fecha_actualizacion DESC`
        ).bind(scanById[1]).all();
        return json({ scan, mangas: mangas || [] });
      }

      // ── GET /api/chapters/:id/pages ──────────────────────
      // Genera un token de un solo uso por página (5 min TTL en KV)
      const chapterPages = pathname.match(/^\/api\/chapters\/([^/]+)\/pages$/);
      if (chapterPages && method === 'GET') {
        const cap = await env.DB.prepare(
          "SELECT c.*, m.es_adulto FROM capitulos c JOIN mangas m ON m.id = c.manga_id WHERE c.id = ? AND c.estado = 'publicado'"
        ).bind(chapterPages[1]).first();
        if (!cap) return err('Capítulo no encontrado o no publicado', 404);

        const { results: paginas } = await env.DB.prepare(
          'SELECT * FROM paginas WHERE capitulo_id = ? ORDER BY orden ASC'
        ).bind(chapterPages[1]).all();

        const origin  = new URL(request.url).origin;
        const expires = Math.floor(Date.now() / 1000) + 6 * 3600; // firma válida 6 horas

        const pages = await Promise.all(paginas.map(async pag => {
          const sig = await signImageToken(chapterPages[1], String(pag.orden), expires, env.IMG_SECRET);
          return {
            id:           pag.id,
            numero:       pag.numero,
            scramble_map: JSON.parse(pag.scramble_map || '[]'),
            image_url:    `${origin}/api/reader/${chapterPages[1]}/${pag.orden}?ts=${expires}&sig=${sig}`,
          };
        }));

        const [prevCap, nextCap] = await Promise.all([
          env.DB.prepare(
            "SELECT id FROM capitulos WHERE manga_id = ? AND estado = 'publicado' AND numero < ? ORDER BY numero DESC LIMIT 1"
          ).bind(cap.manga_id, cap.numero).first(),
          env.DB.prepare(
            "SELECT id FROM capitulos WHERE manga_id = ? AND estado = 'publicado' AND numero > ? ORDER BY numero ASC LIMIT 1"
          ).bind(cap.manga_id, cap.numero).first(),
        ]);

        return json({
          pages,
          capitulo: {
            id: cap.id, numero: cap.numero, titulo: cap.titulo, manga_id: cap.manga_id,
            es_adulto: !!cap.es_adulto,
            prev_chapter_id: prevCap?.id || null,
            next_chapter_id: nextCap?.id || null,
          },
        });
      }

      // ── POST /api/chapters/:id/view ──────────────────────
      // Registra una vista con deduplicación doble:
      //   1. Fingerprint del browser (localStorage UUID) — más preciso para usuarios reales
      //   2. IP del cliente (fallback para bots / clientes sin fingerprint)
      // Una vista por capa por capítulo cada 24h — anti-farming para Revenue Share
      const chapterView = pathname.match(/^\/api\/chapters\/([^/]+)\/view$/);
      if (chapterView && method === 'POST') {
        const capId      = chapterView[1];
        const clientIp   = request.headers.get('CF-Connecting-IP') || 'unknown';
        const fingerprint = request.headers.get('X-Fingerprint') || null;

        const cap = await env.DB.prepare(
          "SELECT id, manga_id FROM capitulos WHERE id = ? AND estado = 'publicado'"
        ).bind(capId).first();
        if (!cap) return json({ counted: false, reason: 'not_found' });

        const TTL = 86400; // 24 horas
        let counted = false;

        if (fingerprint) {
          const fpKey      = `view:fp:${capId}:${fingerprint}`;
          const mangaFpKey = `view:manga:fp:${cap.manga_id}:${fingerprint}`;
          const [vistoCap, vistoManga] = await Promise.all([
            env.KV.get(fpKey),
            env.KV.get(mangaFpKey),
          ]);
          const ops = [];
          if (!vistoCap) {
            ops.push(env.DB.prepare('UPDATE capitulos SET views = views + 1 WHERE id = ?').bind(capId).run());
            ops.push(env.KV.put(fpKey, '1', { expirationTtl: TTL }));
            counted = true;
          }
          if (!vistoManga) {
            ops.push(env.DB.prepare('UPDATE mangas SET views_total = views_total + 1, views_mes = views_mes + 1 WHERE id = ?').bind(cap.manga_id).run());
            ops.push(env.KV.put(mangaFpKey, '1', { expirationTtl: TTL }));
          }
          if (ops.length) await Promise.all(ops);
        } else {
          const ipKey      = `view:ip:${capId}:${clientIp}`;
          const mangaIpKey = `view:manga:ip:${cap.manga_id}:${clientIp}`;
          const [vistoCap, vistoManga] = await Promise.all([
            env.KV.get(ipKey),
            env.KV.get(mangaIpKey),
          ]);
          const ops = [];
          if (!vistoCap) {
            ops.push(env.DB.prepare('UPDATE capitulos SET views = views + 1 WHERE id = ?').bind(capId).run());
            ops.push(env.KV.put(ipKey, '1', { expirationTtl: TTL }));
            counted = true;
          }
          if (!vistoManga) {
            ops.push(env.DB.prepare('UPDATE mangas SET views_total = views_total + 1, views_mes = views_mes + 1 WHERE id = ?').bind(cap.manga_id).run());
            ops.push(env.KV.put(mangaIpKey, '1', { expirationTtl: TTL }));
          }
          if (ops.length) await Promise.all(ops);
        }

        return json({ counted });
      }

      // ── GET /api/admin/revenue ────────────────────────────
      // Resumen de vistas por scan para Revenue Share — solo superadmin
      if (pathname === '/api/admin/revenue' && method === 'GET') {
        const sa = await requireSuperAdmin(request, env);
        if (!sa) return err('Solo el superadmin puede consultar revenue', 403);

        const { results: scans } = await env.DB.prepare(
          `SELECT s.id, s.nombre,
                  COALESCE(SUM(m.views_total), 0) as total_views,
                  COALESCE(SUM(m.views_mes), 0)   as views_mes,
                  COUNT(DISTINCT m.id) as total_mangas,
                  COUNT(DISTINCT c.id) as total_capitulos
           FROM scans s
           LEFT JOIN mangas m ON m.scan_id = s.id
           LEFT JOIN capitulos c ON c.manga_id = m.id AND c.estado = 'publicado'
           GROUP BY s.id, s.nombre
           ORDER BY views_mes DESC`
        ).all();

        const grandTotal    = scans.reduce((sum, s) => sum + (s.total_views || 0), 0);
        const grandTotalMes = scans.reduce((sum, s) => sum + (s.views_mes || 0), 0);
        return json({ scans, grand_total: grandTotal, grand_total_mes: grandTotalMes });
      }

      // ── GET /api/admin/revenue/:scanId ───────────────────
      // Detalle por scan: mangas + capítulos con sus vistas
      // Accesible por superadmin (cualquier scan) y admin/admin_scan (solo su scan)
      const revenueScan = pathname.match(/^\/api\/admin\/revenue\/([^/]+)$/);
      if (revenueScan && method === 'GET') {
        const caller = await requireSupport(request, env); // admin, admin_scan, soporte
        if (!caller) return err('No autorizado', 401);
        // admin_scan solo puede ver su propio scan
        if (isScanAdmin(caller) && caller.scan_id !== revenueScan[1]) {
          return err('Solo podés consultar el revenue de tu scan', 403);
        }
        // soporte: no tiene acceso a revenue
        if (isSoporte(caller)) return err('No tenés permisos para ver revenue', 403);

        const { results: mangas } = await env.DB.prepare(
          `SELECT id, titulo, views_total, views_mes, tipo, estado
           FROM mangas WHERE scan_id = ? ORDER BY views_mes DESC`
        ).bind(revenueScan[1]).all();

        const mangasConCaps = await Promise.all(mangas.map(async (manga) => {
          const { results: caps } = await env.DB.prepare(
            `SELECT id, numero, titulo, views FROM capitulos
             WHERE manga_id = ? AND estado = 'publicado' ORDER BY numero ASC`
          ).bind(manga.id).all();
          return { ...manga, capitulos: caps };
        }));

        const scanTotal    = mangasConCaps.reduce((s, m) => s + (m.views_total || 0), 0);
        const scanTotalMes = mangasConCaps.reduce((s, m) => s + (m.views_mes || 0), 0);
        return json({ mangas: mangasConCaps, scan_total: scanTotal, scan_total_mes: scanTotalMes });
      }

      // ── GET /api/reader/:chapterId/:pageOrder ────────────
      // Verifica firma HMAC stateless → sirve imagen desde R2. Sin KV.
      const readerPage = pathname.match(/^\/api\/reader\/([^/]+)\/(\d+)$/);
      if (readerPage && method === 'GET') {
        const [, chapterId, pageOrder] = readerPage;
        const { searchParams } = new URL(request.url);
        const ts  = searchParams.get('ts');
        const sig = searchParams.get('sig');

        if (!await verifyImageToken(chapterId, pageOrder, ts, sig, env.IMG_SECRET)) {
          return err('Acceso denegado', 403);
        }

        // Buscar r2_key en D1
        const pag = await env.DB.prepare(
          `SELECT p.r2_key FROM paginas p WHERE p.capitulo_id = ? AND p.orden = ?`
        ).bind(chapterId, parseInt(pageOrder)).first();

        if (!pag) return err('Página no encontrada', 404);

        const object = await env.R2.get(pag.r2_key);
        if (!object) return err('Imagen no encontrada en storage', 404);

        return new Response(object.body, {
          headers: {
            'Content-Type':           contentType(pag.r2_key),
            'Content-Disposition':    'inline',
            'Cache-Control':          'public, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
            ...CORS,
          },
        });
      }

      // ── GET /api/admin/chapters/:id/pages/list ───────────
      // Lista de páginas de un capítulo para gestión (requiere auth)
      const pagesList = pathname.match(/^\/api\/admin\/chapters\/([^/]+)\/pages\/list$/);
      if (pagesList && method === 'GET') {
        const user = await getUser(request, env);
        if (!user) return err('No autorizado', 401);
        const { results } = await env.DB.prepare(
          'SELECT id, numero, orden, r2_key FROM paginas WHERE capitulo_id = ? ORDER BY orden ASC'
        ).bind(pagesList[1]).all();
        const origin  = new URL(request.url).origin;
        const expires = Math.floor(Date.now() / 1000) + 6 * 3600;
        return json({
          pages: await Promise.all(results.map(async p => {
            const sig = await signImageToken(pagesList[1], String(p.orden), expires, env.IMG_SECRET);
            return {
              id: p.id,
              orden: p.orden,
              numero: p.numero,
              filename: p.r2_key.split('/').pop(),
              image_url: `${origin}/api/reader/${pagesList[1]}/${p.orden}?ts=${expires}&sig=${sig}`,
            };
          }))
        });
      }

      // ── DELETE /api/pages/:id ─────────────────────────────
      // Elimina una página de D1 y R2, y reordena las restantes
      const deletePage = pathname.match(/^\/api\/pages\/([^/]+)$/);
      if (deletePage && method === 'DELETE') {
        const user = await getUser(request, env);
        if (!user) return err('No autorizado', 401);

        // Query simple sin JOIN para evitar problemas de columnas ambiguas
        const page = await env.DB.prepare(
          'SELECT id, capitulo_id, r2_key, orden FROM paginas WHERE id = ?'
        ).bind(deletePage[1]).first();
        if (!page) return err('Página no encontrada', 404);

        // Borrar de R2 (ignorar error si ya no existe)
        try { await env.R2.delete(page.r2_key); } catch {}

        // Borrar de D1
        await env.DB.prepare('DELETE FROM paginas WHERE id = ?').bind(deletePage[1]).run();

        // Reordenar restantes — secuencial para evitar conflictos en D1
        const { results: remaining } = await env.DB.prepare(
          'SELECT id FROM paginas WHERE capitulo_id = ? ORDER BY orden ASC'
        ).bind(page.capitulo_id).all();

        for (let i = 0; i < remaining.length; i++) {
          await env.DB.prepare('UPDATE paginas SET orden = ?, numero = ? WHERE id = ?')
            .bind(i + 1, i + 1, remaining[i].id).run();
        }

        return json({ message: 'Página eliminada', remaining: remaining.length });
      }

      // ── POST /api/chapters ───────────────────────────────
      if (pathname === '/api/chapters' && method === 'POST') {
        const user = await getUser(request, env);
        if (!user) return err('Necesitás iniciar sesión para continuar', 401);

        const { manga_id, numero, titulo, fecha_publicacion } = await request.json();
        if (!manga_id || numero === undefined) return err('Faltó indicar el manga y el número de capítulo');

        // Validar que el usuario pertenece al scan del manga
        if (!user.is_superadmin && user.rol !== 'admin') {
          const manga = await env.DB.prepare('SELECT scan_id FROM mangas WHERE id = ?').bind(manga_id).first();
          if (!manga) return err('La obra no fue encontrada', 404);
          if (manga.scan_id && manga.scan_id !== user.scan_id) {
            return err('No tenés permiso para subir a esta obra', 403);
          }
        }

        // Prevenir número de capítulo duplicado
        const dup = await env.DB.prepare(
          'SELECT id FROM capitulos WHERE manga_id = ? AND numero = ?'
        ).bind(manga_id, numero).first();
        if (dup) return err(`Ya existe el capítulo ${numero} para esta obra. Usá otro número.`, 409);

        // Determinar estado y fecha de publicación
        const ahora = new Date().toISOString();
        const esFuturo = fecha_publicacion && fecha_publicacion > ahora;
        const estado   = esFuturo ? 'programado' : 'publicado';
        const fechaPub = fecha_publicacion || ahora;

        const id = crypto.randomUUID();
        await env.DB.prepare(
          'INSERT INTO capitulos (id, manga_id, numero, titulo, uploader_id, estado, fecha_publicacion) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, manga_id, numero, titulo || null, user.id, estado, fechaPub).run();

        return json({ capituloId: id, estado, fecha_publicacion: fechaPub }, 201);
      }

      // ── PUT /api/chapters/:id/publish ────────────────────
      const publishCap = pathname.match(/^\/api\/chapters\/([^/]+)\/publish$/);
      if (publishCap && method === 'PUT') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('Solo admin puede publicar', 401);

        if (isScanAdmin(admin) && admin.scan_id) {
          const cap = await env.DB.prepare(
            `SELECT c.id FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.id = ? AND m.scan_id = ?`
          ).bind(publishCap[1], admin.scan_id).first();
          if (!cap) return err('No tenés permiso para publicar este capítulo', 403);
        }

        // Primero obtener info básica (sin webhook_discord, para no fallar si la columna no existe)
        const capForWh = await env.DB.prepare(
          `SELECT c.numero, c.titulo, c.manga_id, m.titulo as manga_titulo, m.scan_id
           FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.id = ?`
        ).bind(publishCap[1]).first();

        // Publicar siempre, independiente del webhook
        await env.DB.prepare("UPDATE capitulos SET estado = 'publicado' WHERE id = ?")
          .bind(publishCap[1]).run();

        // Enviar webhook de forma asíncrona y segura (nunca bloquea el publish)
        if (capForWh) {
          ctx.waitUntil((async () => {
            try {
              // 1. Buscar webhook del scan del manga
              // 2. Si no, buscar webhook del scan del admin que publica
              // 3. Fallback al global DISCORD_WEBHOOK_URL
              let webhookUrl = env.DISCORD_WEBHOOK_URL;
              try {
                const scanWh = await env.DB.prepare(
                  `SELECT s.webhook_discord
                   FROM mangas m LEFT JOIN scans s ON m.scan_id = s.id
                   WHERE m.id = ? AND s.webhook_discord IS NOT NULL`
                ).bind(capForWh.manga_id).first();
                if (scanWh?.webhook_discord) {
                  webhookUrl = scanWh.webhook_discord;
                } else if (admin.scan_id) {
                  // Fallback: webhook del scan del admin que pulsa Publicar
                  const adminScanWh = await env.DB.prepare(
                    `SELECT webhook_discord FROM scans WHERE id = ? AND webhook_discord IS NOT NULL`
                  ).bind(admin.scan_id).first();
                  if (adminScanWh?.webhook_discord) webhookUrl = adminScanWh.webhook_discord;
                }
              } catch {}

              if (!webhookUrl) return;

              const capTitle = capForWh.titulo ? ` — ${capForWh.titulo}` : '';
              const mangaUrl = `${env.FRONTEND_URL}/manga/reader/${capForWh.manga_id}`;
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  embeds: [{
                    title: '📖 Nuevo capítulo publicado',
                    description: `**${capForWh.manga_titulo}** — Capítulo ${capForWh.numero}${capTitle}\n\n[👁 Leer ahora](${mangaUrl})`,
                    color: 0xe11d48,
                    url: mangaUrl,
                    footer: { text: "Crimson's Scan" },
                    timestamp: new Date().toISOString(),
                  }]
                })
              });
            } catch {}
          })());
        }

        return json({ message: 'Capítulo publicado' });
      }

      // ── POST /api/upload/page ────────────────────────────
      // Recibe UNA imagen, la sube a R2, la registra en D1
      if (pathname === '/api/upload/page' && method === 'POST') {
        const user = await getUser(request, env);
        if (!user) return err('No autorizado', 401);

        const formData    = await request.formData();
        const capitulo_id = formData.get('capitulo_id');
        const numero      = parseInt(formData.get('numero'));
        const file        = formData.get('image');

        if (!capitulo_id || !numero || !file) return err('Faltan campos: capitulo_id, numero, image');

        const cap = await env.DB.prepare(
          'SELECT c.*, m.id as mid FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.id = ?'
        ).bind(capitulo_id).first();

        if (!cap) return err('El capítulo no existe o no tenés acceso', 404);
        const isAdminUser = user.rol === 'admin' || user.is_superadmin;
        if (cap.uploader_id !== user.id && !isAdminUser) {
          return err('No tenés permiso para subir páginas a este capítulo', 403);
        }

        // Validar tipo de archivo
        const allowed_exts = ['jpg', 'jpeg', 'png', 'webp'];
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!allowed_exts.includes(ext)) {
          return err('Solo se permiten imágenes JPG, PNG o WebP', 400);
        }

        const capNum = String(cap.numero).replace('.', '-').padStart(3, '0');
        const r2_key = `scancrimson.com/chapters/${cap.manga_id}/cap-${capNum}/${String(numero).padStart(3, '0')}.${ext}`;

        await env.R2.put(r2_key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type },
        });

        const scramble_map = generateScrambleMap(9);
        const id           = crypto.randomUUID();

        await env.DB.prepare(
          'INSERT OR REPLACE INTO paginas (id, capitulo_id, numero, r2_key, scramble_map, orden) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, capitulo_id, numero, r2_key, JSON.stringify(scramble_map), numero).run();

        return json({ pageId: id, r2_key }, 201);
      }

      // ── POST /api/upload/cover ───────────────────────────
      if (pathname === '/api/upload/cover' && method === 'POST') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);

        const formData = await request.formData();
        const manga_id = formData.get('manga_id');
        const file     = formData.get('cover');

        if (!manga_id || !file) return err('Faltan manga_id y cover');

        const ext    = file.name.split('.').pop().toLowerCase();
        const r2_key = `scancrimson.com/covers/${manga_id}.${ext}`;

        await env.R2.put(r2_key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type },
        });

        await env.DB.prepare('UPDATE mangas SET cover_r2_key = ? WHERE id = ?')
          .bind(r2_key, manga_id).run();

        return json({ cover_r2_key: r2_key });
      }

      // ── GET /api/cover/:mangaId ──────────────────────────
      // Sirve la portada desde R2 públicamente (las covers no necesitan token)
      const coverRoute = pathname.match(/^\/api\/cover\/([^/]+)$/);
      if (coverRoute && method === 'GET') {
        const manga = await env.DB.prepare('SELECT cover_r2_key FROM mangas WHERE id = ? OR slug = ?')
          .bind(coverRoute[1], coverRoute[1]).first();
        if (!manga?.cover_r2_key) return err('Portada no encontrada', 404);

        const object = await env.R2.get(manga.cover_r2_key);
        if (!object) return err('Imagen no encontrada en storage', 404);

        return new Response(object.body, {
          headers: {
            'Content-Type':   object.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control':  'public, max-age=86400',
            ...CORS,
          },
        });
      }

      // ── PUT /api/mangas/:id ──────────────────────────────
      const editManga = pathname.match(/^\/api\/mangas\/([^/]+)$/);
      if (editManga && method === 'PUT') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);

        // admin_scan solo puede editar mangas de su propio scan — usar DB, no JWT
        const current = await env.DB.prepare('SELECT scan_id FROM mangas WHERE id=?').bind(editManga[1]).first();
        if (!current) return err('Manga no encontrado', 404);
        if (isScanAdmin(admin)) {
          const dbU = await env.DB.prepare('SELECT scan_id FROM usuarios WHERE id=?').bind(admin.id).first();
          if (current.scan_id !== dbU?.scan_id) return err('No tenés permiso para editar este manga', 403);
        }

        const { titulo, titulo_alt, descripcion, generos, tipo, estado, es_adulto, scan_id } = await request.json();
        // Solo superadmin puede cambiar el scan_id
        const finalScanId = admin.is_superadmin ? (scan_id || null) : (current.scan_id ?? null);

        // Generar slug solo si todavía no tiene uno
        if (!current.slug) {
          const newSlug = await uniqueSlug(titulo, 'mangas', env, editManga[1]);
          await env.DB.prepare(
            `UPDATE mangas SET titulo=?, titulo_alt=?, descripcion=?, generos=?, tipo=?, estado=?, es_adulto=?, scan_id=?, slug=?, fecha_actualizacion=datetime('now') WHERE id=?`
          ).bind(titulo, titulo_alt||null, descripcion||null, JSON.stringify(generos||[]), tipo||'manga', estado||'en_curso', es_adulto ? 1 : 0, finalScanId, newSlug, editManga[1]).run();
        } else {
          await env.DB.prepare(
            `UPDATE mangas SET titulo=?, titulo_alt=?, descripcion=?, generos=?, tipo=?, estado=?, es_adulto=?, scan_id=?, fecha_actualizacion=datetime('now') WHERE id=?`
          ).bind(titulo, titulo_alt||null, descripcion||null, JSON.stringify(generos||[]), tipo||'manga', estado||'en_curso', es_adulto ? 1 : 0, finalScanId, editManga[1]).run();
        }
        return json({ message: 'Manga actualizado' });
      }

      // ── PUT /api/admin/users/:id/reset-password ──────────
      const resetPwd = pathname.match(/^\/api\/admin\/users\/([^/]+)\/reset-password$/);
      if (resetPwd && method === 'PUT') {
        const sa = await requireSuperAdmin(request, env);
        if (!sa) return err('Solo el superadmin puede resetear contraseñas', 403);

        const { newPassword } = await request.json();
        if (!newPassword || newPassword.length < 6) return err('Contraseña mínimo 6 caracteres');

        const hash = await hashPassword(newPassword);
        await env.DB.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?')
          .bind(hash, resetPwd[1]).run();

        return json({ message: 'Contraseña actualizada correctamente' });
      }

      // ── POST /api/admin/users/:id/send-reset-email ───────
      // v2.0 — envía email para que el usuario resetee su contraseña
      const sendResetEmail = pathname.match(/^\/api\/admin\/users\/([^/]+)\/send-reset-email$/);
      if (sendResetEmail && method === 'POST') {
        const admin = await requireSupport(request, env);
        if (!admin) return err('No autorizado', 401);

        const userId = sendResetEmail[1];
        const user = await env.DB.prepare('SELECT id, username, email FROM usuarios WHERE id = ?')
          .bind(userId).first();
        if (!user) return err('Usuario no encontrado', 404);

        const token = crypto.randomUUID();
        const ttl   = 48 * 60 * 60;
        await env.KV.put(`setup:${token}`, JSON.stringify({ userId: user.id, username: user.username, email: user.email }), { expirationTtl: ttl });

        const setupUrl  = `${env.FRONTEND_URL}/setup-password?token=${token}`;
        const emailSent = await sendInviteEmail(user.email, user.username, setupUrl, env.RESEND_API_KEY, env.RESEND_FROM);

        return json({
          message: emailSent ? `Email enviado a ${user.email}` : 'No se pudo enviar el email — verificá RESEND_API_KEY',
          emailSent,
          setupUrl: emailSent ? undefined : setupUrl,
        });
      }

      // ── GET /api/admin/stats ─────────────────────────────
      if (pathname === '/api/admin/stats' && method === 'GET') {
        const admin = await requireSupport(request, env);
        if (!admin) return err('No autorizado', 401);

        let mangas, capitulos, usuarios, pendientes;
        if (isScanAdmin(admin) && admin.scan_id) {
          [mangas, capitulos, usuarios, pendientes] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as total FROM mangas WHERE scan_id = ?').bind(admin.scan_id).first(),
            env.DB.prepare("SELECT COUNT(*) as total FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.estado = 'publicado' AND m.scan_id = ?").bind(admin.scan_id).first(),
            env.DB.prepare('SELECT COUNT(*) as total FROM usuarios WHERE scan_id = ?').bind(admin.scan_id).first(),
            env.DB.prepare("SELECT COUNT(*) as total FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.estado = 'borrador' AND m.scan_id = ?").bind(admin.scan_id).first(),
          ]);
        } else {
          [mangas, capitulos, usuarios, pendientes] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as total FROM mangas').first(),
            env.DB.prepare("SELECT COUNT(*) as total FROM capitulos WHERE estado = 'publicado'").first(),
            env.DB.prepare("SELECT COUNT(*) as total FROM usuarios WHERE rol != 'lector'").first(),
            env.DB.prepare("SELECT COUNT(*) as total FROM capitulos WHERE estado = 'borrador'").first(),
          ]);
        }

        return json({
          mangas:     mangas.total,
          capitulos:  capitulos.total,
          scanners:   usuarios.total,
          pendientes: pendientes.total,
        });
      }

      // ── GET /api/admin/scheduled ─────────────────────────
      // Lista capítulos programados o en borrador
      if (pathname === '/api/admin/scheduled' && method === 'GET') {
        const admin = await requireSupport(request, env);
        if (!admin) return err('Necesitás iniciar sesión para continuar', 401);

        const base = `SELECT c.id, c.numero, c.titulo, c.estado, c.fecha_publicacion, c.fecha_subida,
                m.titulo as manga_titulo, m.id as manga_id,
                u.username as uploader_username
         FROM capitulos c
         JOIN mangas m ON c.manga_id = m.id
         LEFT JOIN usuarios u ON c.uploader_id = u.id
         WHERE c.estado IN ('programado', 'borrador')`;

        const { results } = isScanAdmin(admin) && admin.scan_id
          ? await env.DB.prepare(`${base} AND m.scan_id = ? ORDER BY c.fecha_publicacion ASC`).bind(admin.scan_id).all()
          : await env.DB.prepare(`${base} ORDER BY c.fecha_publicacion ASC`).all();

        return json({ capitulos: results });
      }

      // ── PUT /api/chapters/:id/reschedule ─────────────────
      // Cambiar fecha de publicación o publicar ahora
      const reschedule = pathname.match(/^\/api\/chapters\/([^/]+)\/reschedule$/);
      if (reschedule && method === 'PUT') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('Sin permisos', 403);

        const { fecha_publicacion } = await request.json();
        const ahora = new Date().toISOString();
        const esFuturo = fecha_publicacion && fecha_publicacion > ahora;
        const estado = esFuturo ? 'programado' : 'publicado';
        const fechaPub = fecha_publicacion || ahora;

        await env.DB.prepare(
          'UPDATE capitulos SET estado = ?, fecha_publicacion = ? WHERE id = ?'
        ).bind(estado, fechaPub, reschedule[1]).run();

        return json({ estado, fecha_publicacion: fechaPub });
      }

      // ── PUT /api/chapters/:id ────────────────────────────
      // Editar número, título y fecha de publicación de un capítulo
      const editCap = pathname.match(/^\/api\/chapters\/([^/]+)$/);
      if (editCap && method === 'PUT') {
        const user = await getUser(request, env);
        if (!user) return err('No autorizado', 401);

        const cap = await env.DB.prepare(
          'SELECT c.*, m.scan_id FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.id = ?'
        ).bind(editCap[1]).first();
        if (!cap) return err('Capítulo no encontrado', 404);

        // Solo el uploader del cap, su admin_scan o superadmin pueden editar
        const isOwner    = cap.uploader_id === user.id;
        const isAdminOf  = user.is_superadmin || user.rol === 'admin' ||
                           (user.rol === 'admin_scan' && user.scan_id === cap.scan_id);
        if (!isOwner && !isAdminOf) return err('Sin permisos', 403);

        const { numero, titulo, fecha_publicacion } = await request.json();

        // Si cambia el número, verificar que no duplique
        if (numero !== undefined && numero !== cap.numero) {
          const dup = await env.DB.prepare(
            'SELECT id FROM capitulos WHERE manga_id = ? AND numero = ? AND id != ?'
          ).bind(cap.manga_id, numero, editCap[1]).first();
          if (dup) return err(`Ya existe el capítulo ${numero}`, 409);
        }

        await env.DB.prepare(
          `UPDATE capitulos SET numero = ?, titulo = ?, fecha_publicacion = ? WHERE id = ?`
        ).bind(
          numero ?? cap.numero,
          titulo !== undefined ? (titulo || null) : cap.titulo,
          fecha_publicacion !== undefined ? (fecha_publicacion || null) : cap.fecha_publicacion,
          editCap[1]
        ).run();

        return json({ message: 'Capítulo actualizado' });
      }

      // ── DELETE /api/mangas/:id ────────────────────────────
      const deleteManga = pathname.match(/^\/api\/mangas\/([^/]+)$/);
      if (deleteManga && method === 'DELETE') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('Sin permisos', 403);

        // admin_scan solo puede eliminar mangas de su propio scan
        if (isScanAdmin(admin)) {
          const manga = await env.DB.prepare('SELECT scan_id FROM mangas WHERE id=?').bind(deleteManga[1]).first();
          if (!manga) return err('Manga no encontrado', 404);
          if (manga.scan_id !== admin.scan_id) return err('No tenés permiso para eliminar este manga', 403);
        }

        await env.DB.prepare('DELETE FROM paginas WHERE capitulo_id IN (SELECT id FROM capitulos WHERE manga_id = ?)').bind(deleteManga[1]).run();
        await env.DB.prepare('DELETE FROM capitulos WHERE manga_id = ?').bind(deleteManga[1]).run();
        await env.DB.prepare('DELETE FROM mangas WHERE id = ?').bind(deleteManga[1]).run();
        return json({ message: 'Manga eliminado' });
      }

      // ── DELETE /api/chapters/:id ──────────────────────────
      const deleteCap = pathname.match(/^\/api\/chapters\/([^/]+)$/);
      if (deleteCap && method === 'DELETE') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('Sin permisos', 403);

        // admin_scan solo puede borrar caps de su propio scan
        if (isScanAdmin(admin) && admin.scan_id) {
          const cap = await env.DB.prepare(
            `SELECT c.id FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.id = ? AND m.scan_id = ?`
          ).bind(deleteCap[1], admin.scan_id).first();
          if (!cap) return err('No tenés permiso para eliminar este capítulo', 403);
        }

        // Borrar imágenes de R2
        const { results: paginas } = await env.DB.prepare(
          'SELECT r2_key FROM paginas WHERE capitulo_id = ?'
        ).bind(deleteCap[1]).all();
        await Promise.all(paginas.map(p => p.r2_key ? env.R2.delete(p.r2_key) : Promise.resolve()));

        await env.DB.prepare('DELETE FROM paginas WHERE capitulo_id = ?').bind(deleteCap[1]).run();
        await env.DB.prepare('DELETE FROM capitulos WHERE id = ?').bind(deleteCap[1]).run();
        return json({ message: 'Capítulo eliminado' });
      }

      // ── PUT /api/chapters/:id/reject ─────────────────────
      const rejectCap = pathname.match(/^\/api\/chapters\/([^/]+)\/reject$/);
      if (rejectCap && method === 'PUT') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('Solo admin puede rechazar', 401);

        if (isScanAdmin(admin) && admin.scan_id) {
          const cap = await env.DB.prepare(
            `SELECT c.id FROM capitulos c JOIN mangas m ON c.manga_id = m.id WHERE c.id = ? AND m.scan_id = ?`
          ).bind(rejectCap[1], admin.scan_id).first();
          if (!cap) return err('No tenés permiso para rechazar este capítulo', 403);
        }

        const { nota } = await request.json();
        await env.DB.prepare(
          "UPDATE capitulos SET estado = 'rechazado', notas_admin = ? WHERE id = ?"
        ).bind(nota || 'Sin nota', rejectCap[1]).run();

        return json({ message: 'Capítulo rechazado' });
      }

      // ── POST /api/upload/scan-image ──────────────────────
      if (pathname === '/api/upload/scan-image' && method === 'POST') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);
        let scanId;
        if (isScanAdmin(admin)) {
          const dbU = await env.DB.prepare('SELECT scan_id FROM usuarios WHERE id = ?').bind(admin.id).first();
          scanId = dbU?.scan_id;
          if (!scanId) return err('Tu cuenta no tiene un scan asignado', 403);
        } else if (admin.is_superadmin) {
          const url = new URL(request.url);
          scanId = url.searchParams.get('scan_id');
          if (!scanId) return err('Falta scan_id', 400);
        } else {
          return err('Sin permisos', 403);
        }
        const fd   = await request.formData();
        const file = fd.get('imagen');
        if (!file) return err('Falta el archivo');
        const ext    = (file.name?.split('.').pop() || 'jpg').toLowerCase();
        const r2_key = `scancrimson.com/scans/${scanId}.${ext}`;
        await env.R2.put(r2_key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'image/jpeg' } });
        await env.DB.prepare('UPDATE scans SET imagen_url = ? WHERE id = ?').bind(r2_key, scanId).run();
        return json({ imagen_url: r2_key });
      }

      // ── GET /api/scans ───────────────────────────────────
      if (pathname === '/api/scans' && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT s.id, s.nombre, s.descripcion, s.imagen_url, COUNT(u.id) as miembros,
            (SELECT COUNT(*) FROM mangas WHERE scan_id = s.id) as total_mangas
           FROM scans s LEFT JOIN usuarios u ON u.scan_id = s.id
           WHERE s.activo = 1
           GROUP BY s.id ORDER BY s.nombre`
        ).all();
        return json({ scans: results });
      }

      // ── POST /api/scans ──────────────────────────────────
      if (pathname === '/api/scans' && method === 'POST') {
        const sa = await requireSuperAdmin(request, env);
        if (!sa) return err('Solo el superadmin puede crear scans', 403);

        const { nombre, descripcion } = await request.json();
        if (!nombre) return err('El nombre es obligatorio');

        const id   = `scan-${crypto.randomUUID().slice(0, 8)}`;
        const slug = await uniqueSlug(nombre, 'scans', env);
        await env.DB.prepare(
          'INSERT INTO scans (id, nombre, descripcion, slug) VALUES (?, ?, ?, ?)'
        ).bind(id, nombre, descripcion || null, slug).run();

        return json({ scanId: id, slug, message: 'Scan creado' }, 201);
      }

      // ── PUT /api/scans/:id ───────────────────────────────
      const editScan = pathname.match(/^\/api\/scans\/([^/]+)$/);
      if (editScan && method === 'PUT') {
        const sa = await requireSuperAdmin(request, env);
        if (!sa) return err('Solo el superadmin puede editar scans', 403);

        const { nombre, descripcion, activo } = await request.json();
        await env.DB.prepare(
          'UPDATE scans SET nombre=?, descripcion=?, activo=? WHERE id=?'
        ).bind(nombre, descripcion || null, activo ? 1 : 0, editScan[1]).run();

        return json({ message: 'Scan actualizado' });
      }

      // ── PUT /api/admin/scans/:id/webhook ─────────────────
      const editWebhook = pathname.match(/^\/api\/admin\/scans\/([^/]+)\/webhook$/);
      if (editWebhook && method === 'PUT') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);
        // Admin de scan solo puede editar su propio scan
        if (isScanAdmin(admin) && admin.scan_id !== editWebhook[1]) {
          return err('Solo podés configurar tu propio scan', 403);
        }
        const { webhook_discord } = await request.json();
        await env.DB.prepare('UPDATE scans SET webhook_discord = ? WHERE id = ?')
          .bind(webhook_discord || null, editWebhook[1]).run();
        return json({ message: 'Webhook actualizado' });
      }

      // ── GET /api/admin/uploaders ─────────────────────────
      if (pathname === '/api/admin/uploaders' && method === 'GET') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);
        const { results } = await env.DB.prepare(
          "SELECT id, username, rol FROM usuarios WHERE rol IN ('uploader','admin') AND activo = 1 ORDER BY username"
        ).all();
        return json({ uploaders: results });
      }

      // ── GET /api/admin/users ─────────────────────────────
      if (pathname === '/api/admin/users' && method === 'GET') {
        const admin = await requireSupport(request, env);
        if (!admin) return err('No autorizado', 401);

        // Admin de scan: solo ve usuarios de su propio scan
        // v2.0 — incluye password_hash para detectar cuentas pendientes ('__pending__') en el frontend
        const base = `SELECT u.id, u.username, u.email, u.rol, u.activo, u.fecha_registro,
                             u.ultimo_acceso, u.scan_id, s.nombre as scan_nombre, u.password_hash
                      FROM usuarios u LEFT JOIN scans s ON u.scan_id = s.id`;

        const { results } = isScanAdmin(admin) && admin.scan_id
          ? await env.DB.prepare(`${base} WHERE u.scan_id = ? ORDER BY u.fecha_registro DESC`).bind(admin.scan_id).all()
          : await env.DB.prepare(`${base} ORDER BY u.fecha_registro DESC`).all();

        return json({ usuarios: results });
      }

      // ── PUT /api/admin/users/:id ─────────────────────────
      const editUser = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (editUser && method === 'PUT') {
        const admin = await requireSupport(request, env);
        if (!admin) return err('No autorizado', 401);

        const body = await request.json();
        const { rol, activo } = body;

        // Soporte solo puede cambiar activo, no el rol ni el scan
        if (isSoporte(admin)) {
          await env.DB.prepare('UPDATE usuarios SET activo = ? WHERE id = ?')
            .bind(activo ? 1 : 0, editUser[1]).run();
          return json({ message: 'Usuario actualizado' });
        }

        // Actualizar email — solo superadmin
        if ('email' in body) {
          if (!admin.is_superadmin) return err('Solo el superadmin puede cambiar el email', 403);
          const newEmail = body.email?.trim();
          if (!newEmail || !newEmail.includes('@')) return err('Email inválido', 400);
          await env.DB.prepare('UPDATE usuarios SET email = ? WHERE id = ?')
            .bind(newEmail, editUser[1]).run();
          return json({ message: 'Email actualizado' });
        }

        if ('scan_id' in body) {
          await env.DB.prepare('UPDATE usuarios SET rol = ?, activo = ?, scan_id = ? WHERE id = ?')
            .bind(rol, activo ? 1 : 0, body.scan_id || null, editUser[1]).run();
        } else {
          await env.DB.prepare('UPDATE usuarios SET rol = ?, activo = ? WHERE id = ?')
            .bind(rol, activo ? 1 : 0, editUser[1]).run();
        }
        return json({ message: 'Usuario actualizado' });
      }

      // ── GET /api/scans/:id/details ───────────────────────
      const scanDetails = pathname.match(/^\/api\/scans\/([^/]+)\/details$/);
      if (scanDetails && method === 'GET') {
        const admin = await requireAdmin(request, env);
        if (!admin) return err('No autorizado', 401);

        const scan = await env.DB.prepare('SELECT * FROM scans WHERE id = ?').bind(scanDetails[1]).first();
        if (!scan) return err('Scan no encontrado', 404);

        const [mangas, miembros] = await Promise.all([
          env.DB.prepare(
            `SELECT id, titulo, tipo, estado, views_total,
                    (SELECT COUNT(*) FROM capitulos c WHERE c.manga_id = mangas.id AND c.estado = 'publicado') as caps_publicados,
                    cover_r2_key
             FROM mangas WHERE scan_id = ? ORDER BY views_total DESC`
          ).bind(scanDetails[1]).all(),
          env.DB.prepare(
            'SELECT id, username, rol, activo FROM usuarios WHERE scan_id = ? ORDER BY username'
          ).bind(scanDetails[1]).all(),
        ]);

        const totalViews = mangas.results.reduce((s, m) => s + (m.views_total || 0), 0);
        return json({ scan, mangas: mangas.results, miembros: miembros.results, totalViews });
      }

      // ── GET /api/admin/mangas/:id/chapters ───────────────
      // Accesible por admin, admin_scan (de ese scan) y el uploader dueño
      const adminChaps = pathname.match(/^\/api\/admin\/mangas\/([^/]+)\/chapters$/);
      if (adminChaps && method === 'GET') {
        const user = await getUser(request, env);
        if (!user) return err('Necesitás iniciar sesión para continuar', 401);

        // Verificar que el usuario tiene acceso a este manga
        if (!user.is_superadmin && user.rol !== 'admin') {
          const manga = await env.DB.prepare('SELECT scan_id FROM mangas WHERE id = ?').bind(adminChaps[1]).first();
          if (manga?.scan_id && manga.scan_id !== user.scan_id) {
            return err('No tenés acceso a esta obra', 403);
          }
        }

        const { results } = await env.DB.prepare(
          `SELECT c.*, u.username as uploader_username,
                  (SELECT COUNT(*) FROM paginas p WHERE p.capitulo_id = c.id) as num_paginas
           FROM capitulos c
           LEFT JOIN usuarios u ON c.uploader_id = u.id
           WHERE c.manga_id = ?
           ORDER BY c.numero DESC`
        ).bind(adminChaps[1]).all();

        return json({ capitulos: results });
      }

      // ── GET /api/mangas/:id/comentarios ─────────────────
      const getComents = pathname.match(/^\/api\/mangas\/([^/]+)\/comentarios$/);
      if (getComents && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT id, usuario_id, username, contenido, fecha FROM comentarios
           WHERE manga_id = (SELECT id FROM mangas WHERE id = ? OR slug = ?) AND es_visible = 1
           ORDER BY fecha DESC LIMIT 100`
        ).bind(getComents[1], getComents[1]).all();
        return json({ comentarios: results || [] });
      }

      // ── POST /api/mangas/:id/comentarios ─────────────────
      const postComent = pathname.match(/^\/api\/mangas\/([^/]+)\/comentarios$/);
      if (postComent && method === 'POST') {
        const user = await getUser(request, env);
        if (!user) return err('Iniciá sesión para comentar', 401);
        const { contenido } = await request.json();
        if (!contenido?.trim()) return err('El comentario no puede estar vacío', 400);
        if (contenido.trim().length > 500) return err('Máximo 500 caracteres', 400);
        const mangaRow = await env.DB.prepare('SELECT id FROM mangas WHERE id = ? OR slug = ?')
          .bind(postComent[1], postComent[1]).first();
        if (!mangaRow) return err('Manga no encontrado', 404);
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO comentarios (id, manga_id, usuario_id, username, contenido) VALUES (?, ?, ?, ?, ?)`
        ).bind(id, mangaRow.id, user.id, user.username, contenido.trim()).run();
        return json({ id, username: user.username, contenido: contenido.trim(), fecha: new Date().toISOString() }, 201);
      }

      // ── POST /api/admin/migrate-slugs ────────────────────
      // Endpoint de uso único: genera slugs para registros sin slug
      if (pathname === '/api/admin/migrate-slugs' && method === 'POST') {
        const sa = await requireSuperAdmin(request, env);
        if (!sa) return err('Solo el superadmin puede ejecutar migraciones', 403);

        const { results: mangas } = await env.DB.prepare("SELECT id, titulo FROM mangas WHERE slug IS NULL OR slug = ''").all();
        const { results: scans }  = await env.DB.prepare("SELECT id, nombre FROM scans WHERE slug IS NULL OR slug = ''").all();

        let mangasOk = 0, scansOk = 0;
        for (const m of mangas) {
          const slug = await uniqueSlug(m.titulo, 'mangas', env, m.id);
          await env.DB.prepare('UPDATE mangas SET slug = ? WHERE id = ?').bind(slug, m.id).run();
          mangasOk++;
        }
        for (const s of scans) {
          const slug = await uniqueSlug(s.nombre, 'scans', env, s.id);
          await env.DB.prepare('UPDATE scans SET slug = ? WHERE id = ?').bind(slug, s.id).run();
          scansOk++;
        }

        return json({ message: 'Migración completada', mangas: mangasOk, scans: scansOk });
      }

      return err('Página no encontrada', 404);

    } catch (e) {
      console.error(e);
      return err('Ocurrió un error inesperado. Intentá de nuevo más tarde.', 500);
    }
  },
};
