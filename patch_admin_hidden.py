import sys

file_path = 'frontend/src/app/admin/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert handleToggleHidden near handleDelete
toggle_hidden_func = """
  const handleToggleHidden = async (m: Manga) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/mangas/${m.id}/toggle_hidden`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        mutate();
      } else {
        const errorData = await res.json();
        alert('Error al ocultar manga: ' + (errorData.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error de red');
    }
  };
"""
content = content.replace("  const handleDelete = async", toggle_hidden_func + "\n  const handleDelete = async")

# 2. Insert EyeOff import if not present
if "EyeOff" not in content:
    content = content.replace("Eye,", "Eye, EyeOff,")
    content = content.replace("Eye }", "Eye, EyeOff }")

# 3. Add the toggle button in the manga row actions
button_jsx = """
                      {/* Ocultar/Mostrar Obra (solo admin/superadmin, no isReadOnly) */}
                      {!isReadOnly && isGlobalAdmin && (
                        <button onClick={() => handleToggleHidden(m)}
                          className={`p-1.5 rounded-lg transition ${m.oculto === 1 ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
                          title={m.oculto === 1 ? 'Mostrar Obra' : 'Ocultar Obra'}>
                          {m.oculto === 1 ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      )}
"""
content = content.replace(
    "{/* Deshabilitar obra — solo admin global o superadmin */}",
    button_jsx + "\n                      {/* Deshabilitar obra — solo admin global o superadmin */}"
)

# 4. Add a visual indicator in the title
content = content.replace(
    """<p className={`font-bold text-sm dark:text-white ${viewMode === 'list' ? 'truncate' : 'line-clamp-2'}`} title={m.titulo}>{m.titulo}</p>""",
    """<p className={`font-bold text-sm dark:text-white ${viewMode === 'list' ? 'truncate' : 'line-clamp-2'} flex items-center gap-1`} title={m.titulo}>{m.titulo} {m.oculto === 1 && <EyeOff size={12} className="text-indigo-500 shrink-0" title="Oculto" />}</p>"""
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("admin/page.tsx patched successfully.")
