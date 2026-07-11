# Sistema de Backup de Crimson Scan
# Sistema de Backup de Crimson Scan

Este directorio contiene herramientas para respaldar (backup) y restaurar (restore) tu base de datos y tus archivos subidos.

## Requisitos previos
1. Renombra el archivo `.env.example` a `.env`.
2. Llena las variables dentro de `.env` con tus credenciales de la API de Cloudflare R2:
   - `R2_ACCOUNT_ID` (Lo sacás de tu panel de Cloudflare)
   - `R2_ACCESS_KEY_ID` (Creás un token en la sección R2)
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME` (Ej: `crimson-mangas`)

---

## 1. Copia de Seguridad de la Base de Datos (Cloudflare D1)

### Para Respaldar (Backup):
Ejecuta el archivo **`db-backup.bat`** (Doble clic).
Esto conectará con tu base de datos remota (`crimson-db`) y descargará un archivo `.sql` dentro de la carpeta `data/db/` con la fecha y hora.

### Para Restaurar (Restore):
Ejecuta el archivo **`db-restore.bat`**.
Te pedirá que arrastres el archivo `.sql` que deseas restaurar a la ventana y presiones Enter. **OJO: Esto sobreescribirá la base de datos en producción.**

---

## 2. Copia de Seguridad de las Imágenes (Cloudflare R2)

Para los archivos estáticos y las imágenes, usamos un script de Node.js que sincroniza tus archivos localmente. Asegurate de haber hecho `npm install` en esta carpeta `backup` primero.

### Para Respaldar (Backup):
Abre una terminal en esta carpeta y ejecuta:
```bash
npm run backup:r2
```
Esto descargará todos los archivos de tu bucket de R2 a la carpeta local `data/r2/`. Si ya tienes algunos descargados de un backup anterior, solo descargará los nuevos o los que faltan.

### Para Restaurar (Restore):
Si por alguna razón perdiste los archivos en el servidor de Cloudflare R2 y los tenés en tu computadora, ejecuta:
```bash
npm run restore:r2
```
Esto subirá de regreso todas las carpetas e imágenes desde `data/r2/` hacia tu bucket de Cloudflare.
