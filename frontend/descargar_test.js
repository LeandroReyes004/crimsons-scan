const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function descargarCapitulo() {
    // 1. Iniciar el navegador (pon 'headless: false' para ver cómo el bot abre la ventana)
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 2. Ir a la página (PON LA URL REAL AQUÍ ADENTRO)
    const url = 'https://catharsisworld.dig-it.info/serie/el-protagonista-masculino-esta-obsesionado-con-la-propuesta/capitulo-51/#goog_rewarded';
    console.log(`Navegando a ${url}...`);

    // networkidle2 espera a que la página deje de cargar recursos pesados
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Crear carpeta para guardar las capturas
    const dir = './capitulo_descargado';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    // 3. Buscar todos los contenedores de las páginas (los divs con clase 'page-break')
    const chapterDivs = await page.$$('.page-break');
    console.log(`¡Se encontraron ${chapterDivs.length} páginas para descargar!`);

    // 4. Tomar captura de pantalla de CADA contenedor armado
    for (let i = 0; i < chapterDivs.length; i++) {
        const divElement = chapterDivs[i];

        // Obtener el ID para nombrar el archivo (ej: chapter-img-1)
        const id = await page.evaluate(el => el.id, divElement) || `pagina_${i + 1}`;
        const filePath = path.join(dir, `${id}.png`);

        console.log(`Guardando ${filePath}...`);

        // ¡ESTA ES LA CLAVE! 
        // Puppeteer toma una captura solo de ese elemento HTML (el contenedor del rompecabezas ya armado)
        await divElement.screenshot({ path: filePath });
    }

    console.log('¡Descarga finalizada!');
    await browser.close();
}

descargarCapitulo();
