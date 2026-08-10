## [13/07/2026] - Feature: Panel de Configuración de Plantillas para Telegram
**Qué se hizo:**
1. Se añadió la columna `telegram_template` en la tabla `scans` de D1 para permitir guardar el formato de notificación personalizado por grupo.
2. Se replicó la funcionalidad del Webhook de Discord hacia Telegram. Ahora, en el panel `/admin`, los líderes de scan tienen una caja de texto con botones dinámicos (`{{manga}}`, `{{capitulo}}`, etc.) para estructurar su plantilla con vista previa en Markdown.
3. Se actualizó el endpoint PUT `/api/admin/scans/:id/webhook` en el backend para admitir la modificación y guardado simultáneo de plantillas y URL de Discord, y del `telegram_chat_id` / `telegram_template`.
4. Se corrigió un error visual en el frontend, mostrando el mensaje de confirmación de "Configuración guardada exitosamente" tanto para Discord como para Telegram en el panel de UI.
5. Se reprogramó la lógica `buildTelegramCaption` en el worker para que en los Webhooks utilice la plantilla propia del scan (si está vacía, cae al texto base por defecto).

**Archivos modificados:**
- `frontend/src/app/admin/page.tsx`
- `worker/src/index.js`
