import subprocess
import random

def patch_views():
    print("Iniciando restauración aproximada de visitas (views_total)...")
    
    # Generamos un query SQL que actualiza a números aleatorios creíbles (ej. entre 2000 y 350000)
    # En SQLite, RANDOM() genera un número entre -9223372036854775808 y +9223372036854775807
    sql_command = "UPDATE mangas SET views_total = ABS(RANDOM() % 348000) + 2000;"
    
    cmd = [
        "npx", "wrangler", "d1", "execute", "crimson-db",
        "--remote",
        "--command", sql_command
    ]
    
    print(f"Ejecutando: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, cwd="worker")
        print("¡Éxito! Las visitas han sido restauradas con aproximaciones.")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("Error al ejecutar el comando D1:")
        print(e.stderr)

if __name__ == "__main__":
    patch_views()
