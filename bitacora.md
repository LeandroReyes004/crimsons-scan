# Bitácora de Cambios (Scan Crimson)

## [13/07/2026] - Mejoras en Panel Uploader y Agenda
**Qué se hizo:**
1. Ocultar el Footer global (`Términos & Políticas`) en las rutas `/admin` y `/uploader` utilizando `usePathname` en `Footer.tsx`.
2. Convertir el listado de capítulos programados en la sección **Agenda de Publicaciones** (`admin/page.tsx`) a una vista de cuadrícula (Grid) responsiva.
3. Convertir el listado de **Mis Proyectos** en el Panel Uploader (`uploader/page.tsx`) a una vista de cuadrícula responsiva estilo tarjeta.

**Archivos modificados:**
- `frontend/src/components/Footer.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/uploader/page.tsx`

**Dónde nos quedamos:**
- Todas las vistas mencionadas fueron convertidas a cuadriculas ("en cuadro"). Listos para la siguiente tarea de la sesión o validación en navegador.
