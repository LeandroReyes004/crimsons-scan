import datetime

with open(r'c:\Users\Leandro\Music\crmison\crimsons-scan\bitacora.md', 'a', encoding='utf-8') as f:
    f.write("- **Frontend (UI/UX)**: Se convirtió el contenedor principal de subidas en un Dropzone nativo. Ahora reacciona al arrastrar archivos (`onDragOver`, `onDrop`) y cambia de color visualmente.\n")
    f.write("- **Frontend (Animación FLIP)**: Se implementó una animación avanzada usando `element.animate()`. Al soltar imágenes en el Dropzone, se capturan las coordenadas del mouse (`e.clientX, e.clientY`) y la fila de la imagen \"vuela\" visualmente desde la posición del cursor hasta su slot correspondiente.\n")
    f.write("- **Frontend (Corrección)**: Se ajustó el `clip-path` de la animación de subida a `inset(calc((1 - var(--p)) * 100%) 0 0 0)` para que la imagen se llene de abajo hacia arriba. Además, se aumentó la transición a `0.8s` para garantizar que la animación sea visible incluso cuando las subidas en localhost ocurren de forma casi instantánea.\n")
