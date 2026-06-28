@echo off
echo ========================================================
echo RESPALDO DE BASE DE DATOS D1 (Cloudflare)
echo ========================================================

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

echo Creando carpeta si no existe...
if not exist "data\db" mkdir "data\db"

echo.
echo Exportando base de datos remota 'crimson-db'...
cd ..\worker
call npx wrangler d1 export crimson-db --remote --output="..\backup\data\db\db-backup-%TIMESTAMP%.sql"
cd ..\backup

echo.
echo Backup completado con exito. Archivo guardado en:
echo data\db\db-backup-%TIMESTAMP%.sql
echo.
pause
