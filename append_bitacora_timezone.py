import datetime

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\bitacora.md', 'a', encoding='utf-8') as f:
    f.write("\n\n### 2026-07-18 - Corrección de Bug de Timezones (Fechas de Publicación)\n")
    f.write("- **Frontend**: Se corrigió el renderizado de fechas en `MangaCard.tsx` y en el lector (`manga/reader/[id]/page.tsx`). Antes, al usar `new Date().toLocaleDateString()` el navegador convertía automáticamente la fecha UTC a la zona horaria local del lector, causando que en otros países se viera el capítulo publicado un día antes o después. Se estandarizó para que la fecha (que se guarda en UTC) se formatee forzosamente usando `{ timeZone: 'UTC' }`. De esta manera, si un admin programa un capítulo para el 20 de Julio, *todos los usuarios del mundo* verán '20 Jul' independientemente de su país.\n")
