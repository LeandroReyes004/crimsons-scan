import datetime

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\bitacora.md', 'a', encoding='utf-8') as f:
    f.write("\n\n### 2026-07-18 - Drag & Drop y Animación de Progreso en Uploader\n")
    f.write("- **Frontend**: Se instaló `@dnd-kit` para reemplazar el sistema estático de subir/bajar imágenes. Ahora el panel de uploader permite reordenar las imágenes libremente arrastrándolas (`SortablePageItem`).\n")
    f.write("- **Frontend (Animación)**: Se refactorizó la función `handleUpload` para utilizar `XMLHttpRequest` en lugar de `fetch`, lo que nos permite calcular el porcentaje exacto de subida. Este porcentaje alimenta una variable CSS `@property --p` que anima progresivamente un `clip-path`, revelando la imagen de escala de grises a color a medida que se transfiere el archivo.\n")
