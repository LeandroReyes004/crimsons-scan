import sys

file_path = 'frontend/src/app/uploader/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. We need to add a "Copiar Link" button
copy_button = """
                  <Link href={`/manga/reader/${selectedManga.slug || selectedManga.id}/chapter/${capId}`} target="_blank"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition active:scale-95">
                    👁 Ver capítulo
                  </Link>
                  <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/manga/reader/${selectedManga.slug || selectedManga.id}/chapter/${capId}`);
                      alert('¡Enlace copiado al portapapeles!');
                    }}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition active:scale-95">
                    🔗 Compartir
                  </button>
"""

content = content.replace(
    """<Link href={`/manga/reader/${selectedManga.id}/chapter/${capId}`} target="_blank"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition active:scale-95">
                    👁 Ver capítulo
                  </Link>""",
    copy_button
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("uploader/page.tsx patched successfully.")
