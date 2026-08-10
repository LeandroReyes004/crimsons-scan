import re

with open('frontend/src/app/uploader/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix 1: POST /api/chapters body
old_1 = """            body: JSON.stringify({ manga_id: selectedManga.id, numero: num, titulo: capTitulo || null, fecha_publicacion: fechaPub || null, notify_discord: notifyDiscord }),"""
new_1 = """            body: JSON.stringify({ manga_id: selectedManga.id, numero: num, titulo: capTitulo || null, fecha_publicacion: fechaPub ? new Date(fechaPub).toISOString() : null, notify_discord: notifyDiscord }),"""
code = code.replace(old_1, new_1)

# Fix 2: openEdit
old_2 = """    const openEdit = async (cap: Capitulo) => {
      setEditingCap(cap);
      setEditNumero(String(cap.numero));
      setEditTitulo(cap.titulo || '');
      setEditFecha((cap as any).fecha_publicacion ? new Date((cap as any).fecha_publicacion).toISOString().slice(0, 16) : '');"""

new_2 = """    const openEdit = async (cap: Capitulo) => {
      setEditingCap(cap);
      setEditNumero(String(cap.numero));
      setEditTitulo(cap.titulo || '');
      let editLocal = '';
      if ((cap as any).fecha_publicacion) {
        const d = new Date((cap as any).fecha_publicacion);
        editLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      setEditFecha(editLocal);"""
code = code.replace(old_2, new_2)

# Fix 3: PUT /api/chapters/:id body
old_3 = """          body: JSON.stringify({
            numero: parseFloat(editNumero),
            titulo: editTitulo || null,
            fecha_publicacion: editFecha || null
          }),"""

new_3 = """          body: JSON.stringify({
            numero: parseFloat(editNumero),
            titulo: editTitulo || null,
            fecha_publicacion: editFecha ? new Date(editFecha).toISOString() : null
          }),"""
code = code.replace(old_3, new_3)

with open('frontend/src/app/uploader/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Uploader timezone fixed!")
