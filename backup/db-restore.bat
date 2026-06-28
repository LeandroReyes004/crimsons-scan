@echo off
echo ========================================================
echo RESTAURAR BASE DE DATOS D1 (Cloudflare)
echo ========================================================
echo.
echo ADVERTENCIA: Esta accion sobreescribira los datos actuales 
echo de tu base de datos remota con los del archivo de backup.
echo.
set /p backup_file="Arrastra aqui el archivo .sql de backup y presiona Enter: "

REM Remover comillas si existen
set backup_file=%backup_file:"=%

echo.
echo Ejecutando restauracion en 'crimson-db'...
cd ..\worker
call npx wrangler d1 execute crimson-db --remote --file="%backup_file%"
cd ..\backup

echo.
echo Restauracion finalizada!
pause
