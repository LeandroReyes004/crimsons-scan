// test_image_preview.js
const url = process.argv[2] || 'https://tu-sitio-web-de-manga.com'; // Cambia esto por tu URL o pásala por consola

async function testImagePreview() {
  console.log(`Probando la URL: ${url}`);
  try {
    // Usamos fetch nativo (disponible en Node.js 18+)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al acceder a la página: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();

    // Buscamos la etiqueta og:image (Open Graph, usada por Discord, Facebook, WhatsApp, etc.)
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) || 
                         html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    
    // Buscamos la etiqueta twitter:image (Usada por Twitter y algunos otros bots)
    const twitterImageMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i) || 
                              html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);

    const imageUrl = (ogImageMatch && ogImageMatch[1]) || (twitterImageMatch && twitterImageMatch[1]);

    if (imageUrl) {
      console.log('\n✅ ¡Imagen encontrada con éxito!');
      console.log('URL de la imagen principal para la vista previa:', imageUrl);
    } else {
      console.log('\n❌ No se encontró ninguna etiqueta de imagen (og:image o twitter:image) en la página.');
      console.log('Asegúrate de que tu sitio tenga las etiquetas meta correspondientes (Open Graph) en el <head> para que salga la imagen al compartir enlaces.');
    }

  } catch (error) {
    console.error('\nError durante la prueba:', error.message);
  }
}

testImagePreview();
