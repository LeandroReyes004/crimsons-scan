import datetime

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\bitacora.md', 'a', encoding='utf-8') as f:
    f.write("\n\n### 2026-07-18 - Correcciones en Mobile, Caché de API y DB\n")
    f.write("- **Mobile (Ghosting)**: Se corrigió un error visual en React Native (Android) donde el texto de la lista de Capítulos se superponía al hacer scroll. Se añadió `backgroundColor: '#0a0a0c'` al estilo `chapterRow` en `mobile/app/manga/[id].tsx` para forzar el repintado (hardware acceleration).\n")
    f.write("- **Firma de Contrato DB**: Se actualizó manualmente en la base de datos D1 de producción el estado del contrato del scan 'The grimorio de la witch' (`contrato_firmado = 1`, `contrato_version = 1`, con datos de representante) mediante una query SQL directa.\n")
    f.write("- **Caché (Worker)**: Se añadió `Cache-Control: no-cache, no-store, must-revalidate` a la respuesta JSON global en el handler `fetch` de `worker/src/index.js` para evitar que el navegador guarde en caché respuestas críticas como la de `/api/auth/me`.\n")
