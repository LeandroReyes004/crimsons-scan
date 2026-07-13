# BitÃ¡cora de Cambios (Scan Crimson)

## [13/07/2026] - Mejoras en Panel Uploader y Agenda
**QuÃ© se hizo:**
1. Ocultar el Footer global (`TÃ©rminos & PolÃ­ticas`) en las rutas `/admin` y `/uploader` utilizando `usePathname` en `Footer.tsx`.
2. Convertir el listado de capÃ­tulos programados en la secciÃ³n **Agenda de Publicaciones** (`admin/page.tsx`) a una vista de cuadrÃ­cula (Grid) responsiva.
3. Convertir el listado de **Mis Proyectos** en el Panel Uploader (`uploader/page.tsx`) a una vista de cuadrÃ­cula responsiva estilo tarjeta.

**Archivos modificados:**
- `frontend/src/components/Footer.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/uploader/page.tsx`

**DÃ³nde nos quedamos:**
- Todas las vistas mencionadas fueron convertidas a cuadriculas ("en cuadro"). Listos para la siguiente tarea de la sesiÃ³n o validaciÃ³n en navegador.

## [13/07/2026] - Fix: Modal de Contrato bloqueando Uploaders
**Qué se hizo:**
1. Se corrigió la condición 
eedsContract en dmin/page.tsx que forzaba el modal de contrato de alianza.
2. Ahora solo los usuarios con el rol dmin_scan (líderes del scan) serán bloqueados por este modal; los uploaders ya no verán el modal que no pueden firmar.

**Archivos modificados:**
- rontend/src/app/admin/page.tsx`n


## [13/07/2026] - Fix: Modal de Contrato para Administradores que ya firmaron
**Qué se hizo:**
1. Se detectó que, al usar el botón "Ver Contrato de Alianza", el modal seguía mostrando el formulario de firma con el botón "Firmar y Continuar", lo cual era confuso para los administradores que ya lo habían firmado.
2. Se añadió la propiedad `alreadySigned` a `<ContractModal>`. Si el contrato ya está firmado, el formulario y checkbox se ocultan y en su lugar se muestra un banner verde informando "El contrato ya ha sido firmado por el representante de tu scan", junto con un botón para "Cerrar Contrato".

**Archivos modificados:**
- `frontend/src/app/admin/components/ContractModal.tsx`
- `frontend/src/app/admin/page.tsx`

## [13/07/2026] - Fix: Caché y Estado Inicial de Contratos (Admin)
**Qué se hizo:**
1. Se encontró un caso borde donde, justo después de iniciar sesión o de firmar el contrato, Next.js guardaba en caché el estado de `scan_contrato_firmado: 0`, haciendo que el modal volviera a saltar a los admins incluso si ya lo habían firmado correctamente en la base de datos.
2. Se corrigió el backend (`worker/src/index.js`) para que devuelva el estado del contrato inmediatamente durante el `login`.
3. Se añadió política `no-store` en `refreshUser` (`lib/auth.ts`) para obligar al navegador a siempre verificar si hay nuevas firmas en la API sin depender de cachés antiguos.

**Archivos modificados:**
- `worker/src/index.js`
- `frontend/src/lib/auth.ts`

## [13/07/2026] - Mejora: Notificaciones y plantillas para Discord y Telegram
**Qué se hizo:**
1. Se refactorizó la función `buildDiscordBody` en el backend para que el webhook de Discord se envíe como un *Embed* enriquecido y así pueda incluir la imagen de portada (`cover_url`) del manga.
2. Se corrigió el código de notificación de Telegram (`/api/chapters`). Ahora utiliza `sendPhoto`, permitiendo adjuntar la portada como imagen principal y enviar el texto del anuncio como pie de foto (`caption`).
3. Se añadió un panel de configuración visual en `/admin` que permite a los líderes de scan personalizar su propio mensaje (plantilla) para Telegram de la misma forma que Discord, usando variables como `{{manga}}` o `{{capitulo}}`.
4. Se corrigió un error en el worker que causaba que el texto de la plantilla de Telegram (`telegram_template`) no se guardara correctamente en la base de datos (D1).
5. Se corrigieron pequeños bugs visuales en el panel Uploader donde el mensaje "Configuración guardada exitosamente" aparecía en secciones equivocadas.

**Archivos modificados:**
- `worker/src/index.js`
- `frontend/src/app/admin/page.tsx`
## [13/07/2026] - Fix: Zona Horaria al programar capítulos
**Qué se hizo:**
1. Se identificó que al programar un capítulo desde el panel Uploader, la hora local elegida por los usuarios se enviaba tal cual al servidor, causando que el worker (que opera en UTC) publicara horas antes o después de lo esperado.
2. Se corrigió el componente `uploader/page.tsx` para que convierta estrictamente la hora local elegida por el uploader al formato ISO estándar UTC (`.toISOString()`) antes de enviarlo al backend, unificando la zona horaria en toda la plataforma.
3. Al editar un capítulo programado, el sistema ahora convierte automáticamente la hora UTC de la base de datos de regreso a la zona horaria local del dispositivo para que el usuario siempre vea la hora correcta en su pantalla.

**Archivos modificados:**
- `frontend/src/app/uploader/page.tsx`
