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
