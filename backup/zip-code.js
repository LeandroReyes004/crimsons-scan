const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const outputDir = path.join(__dirname, 'data', 'zip');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
const outputPath = path.join(outputDir, `code-backup-${timestamp}.zip`);

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log('\n✅ BACKUP DE CÓDIGO COMPLETADO.');
  console.log(`Archivo generado en: ${outputPath}`);
  console.log(`Tamaño total: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function(err) {
  console.error('\n❌ ERROR AL COMPRIMIR:', err);
  throw err;
});

archive.on('progress', (progress) => {
  if (progress.entries.processed > 0 && progress.entries.processed % 500 === 0) {
    console.log(`Procesando... ${progress.entries.processed} archivos añadidos al zip.`);
  }
});

archive.pipe(output);

console.log('📦 Iniciando comprensión del código fuente (ignorando node_modules y .git)...');

const rootDirCrimsonScan = path.join(__dirname, '..');
const rootDirScanCrimson = path.join(__dirname, '..', '..', 'scancrimson');

function addDirectory(dir, archivePath) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Carpeta no encontrada: ${dir}`);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === '.vercel' || file === '.next' || file === 'data' || file.endsWith('.zip')) {
      continue;
    }
    const fullPath = path.join(dir, file);
    const archiveDest = path.join(archivePath, file).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirectory(fullPath, archiveDest);
    } else {
      archive.file(fullPath, { name: archiveDest });
    }
  }
}

console.log('➡️ Añadiendo crimsons-scan...');
addDirectory(rootDirCrimsonScan, 'crimsons-scan');

console.log('➡️ Añadiendo scancrimson...');
addDirectory(rootDirScanCrimson, 'scancrimson');

archive.finalize();
