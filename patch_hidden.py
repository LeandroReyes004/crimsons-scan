import sys

file_path = 'worker/src/index.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update GET /api/mangas
# We need to find the SQL query: SELECT * FROM mangas ORDER BY fecha_actualizacion DESC
content = content.replace(
    "SELECT * FROM mangas ORDER BY fecha_actualizacion DESC",
    "SELECT * FROM mangas WHERE oculto = 0 OR oculto IS NULL ORDER BY fecha_actualizacion DESC"
)

# 2. Update GET /api/mangas/adulto
content = content.replace(
    "SELECT * FROM mangas WHERE es_adulto = 1 ORDER BY fecha_actualizacion DESC",
    "SELECT * FROM mangas WHERE es_adulto = 1 AND (oculto = 0 OR oculto IS NULL) ORDER BY fecha_actualizacion DESC"
)

# 3. Add toggle_hidden endpoint
new_endpoint = """
    // --- TOGGLE HIDDEN MANGA ---
    if (pathname.match(/^\/api\/admin\/mangas\/[a-zA-Z0-9-]+\/toggle_hidden$/) && method === 'POST') {
      const u = await auth(req, env);
      if (!u || (u.rol !== 'admin' && u.rol !== 'superadmin')) return err('No autorizado', 403);
      const id = pathname.split('/')[4];
      try {
        const manga = await env.DB.prepare('SELECT oculto FROM mangas WHERE id = ?').bind(id).first();
        if (!manga) return err('Manga no encontrado', 404);
        const new_oculto = manga.oculto === 1 ? 0 : 1;
        await env.DB.prepare('UPDATE mangas SET oculto = ? WHERE id = ?').bind(new_oculto, id).run();
        return json({ success: true, oculto: new_oculto });
      } catch (e) {
        return err(e.message, 500);
      }
    }
"""

if "toggle_hidden" not in content:
    # Insert right before /api/mangas (POST)
    anchor = "if (pathname === '/api/mangas' && method === 'POST') {"
    if anchor in content:
        content = content.replace(anchor, new_endpoint + "\n    " + anchor)
    else:
        print("Could not find anchor for toggle_hidden!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("index.js patched successfully.")
