require('dotenv').config();
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

// Validar credenciales
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
  console.error('❌ Faltan credenciales en el archivo .env. Por favor configurá R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET_NAME.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const LOCAL_DIR = path.join(__dirname, 'data', 'r2');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function backupR2() {
  console.log(`📥 Iniciando BACKUP desde el bucket '${BUCKET}' hacia '${LOCAL_DIR}'...`);
  await ensureDir(LOCAL_DIR);

  let isTruncated = true;
  let continuationToken = undefined;
  let downloadedCount = 0;
  let skippedCount = 0;

  while (isTruncated) {
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(cmd);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('El bucket está vacío.');
      break;
    }

    for (const item of response.Contents) {
      if (item.Key.endsWith('/')) continue;
      const localFilePath = path.join(LOCAL_DIR, item.Key);
      
      // Si el archivo ya existe y el tamaño coincide (o si prefieres comprobar fecha), lo omitimos
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath);
        if (stats.size === item.Size) {
          skippedCount++;
          continue;
        }
      }

      await ensureDir(path.dirname(localFilePath));
      
      console.log(`⬇️  Descargando: ${item.Key} (${(item.Size / 1024).toFixed(2)} KB)`);
      try {
        const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: item.Key });
        const { Body } = await s3.send(getCmd);
        await pipeline(Body, fs.createWriteStream(localFilePath));
        downloadedCount++;
      } catch (err) {
        console.error(`❌ Error al descargar ${item.Key}:`, err.message);
      }
    }

    isTruncated = response.IsTruncated;
    continuationToken = response.NextContinuationToken;
  }

  console.log('\n✅ BACKUP COMPLETADO.');
  console.log(`Archivos descargados: ${downloadedCount}`);
  console.log(`Archivos omitidos (ya existían): ${skippedCount}`);
}

async function getLocalFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getLocalFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function restoreR2() {
  console.log(`📤 Iniciando RESTAURACIÓN desde '${LOCAL_DIR}' hacia el bucket '${BUCKET}'...`);
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error('❌ No se encontró la carpeta local de backup. Asegurate de hacer backup primero.');
    return;
  }

  const allFiles = await getLocalFiles(LOCAL_DIR);
  let uploadedCount = 0;

  for (const filePath of allFiles) {
    const key = path.relative(LOCAL_DIR, filePath).replace(/\\/g, '/'); // Convertir barras para R2
    
    // Podríamos listar antes para ver si existen y omitir, pero para mantenerlo simple subiremos todo.
    // Opcional: Se puede agregar validación similar al backup para saltar archivos existentes.
    console.log(`⬆️  Subiendo: ${key}`);
    try {
      const fileStream = fs.createReadStream(filePath);
      const putCmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileStream,
      });
      await s3.send(putCmd);
      uploadedCount++;
    } catch (err) {
      console.error(`❌ Error al subir ${key}:`, err.message);
    }
  }

  console.log('\n✅ RESTAURACIÓN COMPLETADA.');
  console.log(`Archivos subidos: ${uploadedCount}`);
}

const mode = process.argv[2];
if (mode === 'backup') {
  backupR2().catch(console.error);
} else if (mode === 'restore') {
  restoreR2().catch(console.error);
} else {
  console.log('Uso: node r2-sync.js [backup|restore]');
}
