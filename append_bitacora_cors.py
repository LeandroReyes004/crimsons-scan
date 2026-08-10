import datetime

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\bitacora.md', 'a', encoding='utf-8') as f:
    f.write("\n\n### 2026-07-18 - Corrección de CORS (Cache-Control)\n")
    f.write("- **Problema**: El navegador bloqueaba las peticiones de autenticación por un error de CORS porque la cabecera `cache-control` no estaba permitida en `Access-Control-Allow-Headers`.\n")
    f.write("- **Solución**: Se agregó `Cache-Control` a la lista de cabeceras permitidas en `worker/src/index.js` (bloque `BASE_CORS`).\n")
