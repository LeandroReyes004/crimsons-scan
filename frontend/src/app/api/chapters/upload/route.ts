import { NextRequest, NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de Autenticación (Miembros del Equipo)
    // El token JWT debe viajar en el header de autorización
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Acceso denegado o sesión inválida' }, { status: 401 });
    }

    // 2. Extracción del FormData
    const formData = await req.formData();
    const mangaId = formData.get('manga_id') as string;
    const chapterNumber = formData.get('chapter_number') as string;
    const files = formData.getAll('images') as File[];

    if (!mangaId || !chapterNumber || !files || files.length === 0) {
      return NextResponse.json({ error: 'Faltan datos requeridos (manga_id, chapter_number, images)' }, { status: 400 });
    }

    // 3. Crear el Capítulo en Supabase
    const { data: chapterData, error: chapterError } = await supabaseAdmin
      .from('chapters')
      .insert({
        manga_id: parseInt(mangaId),
        chapter_number: parseInt(chapterNumber),
        created_by: user.id
      })
      .select('id')
      .single();

    if (chapterError || !chapterData) {
      return NextResponse.json({ error: 'Error al crear capítulo', details: chapterError }, { status: 500 });
    }

    const chapterId = chapterData.id;
    const bucketName = process.env.R2_BUCKET_NAME || 'crimsons-scan';
    const publicR2Domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-midominio.r2.dev';

    // 4. Subir Archivos a R2 y Registrar Páginas
    const pageRecords = [];

    // Iterar para procesar cada página
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split('.').pop() || 'jpg';
      const objectKey = `manga/${mangaId}/ch-${chapterNumber}/${i + 1}-${crypto.randomUUID()}.${extension}`;

      // Subir a R2
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
      });

      await r2Client.send(command);

      // URL Pública (Se asume que el bucket Cloudflare R2 está configurado para acceso público)
      const publicUrl = `${publicR2Domain}/${objectKey}`;

      // Agregar a la cola de inserción
      pageRecords.push({
        chapter_id: chapterId,
        page_number: i + 1,
        image_url: publicUrl
      });
    }

    // Inserción en batch de todas las urls en la tabla pages
    const { error: pageError } = await supabaseAdmin
      .from('pages')
      .insert(pageRecords);

    if (pageError) {
      return NextResponse.json({ error: 'Error al registrar URLs de páginas', details: pageError }, { status: 500 });
    }

    return NextResponse.json({ message: 'Capítulo subido exitosamente', chapterId });

  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: 'Error interno en el servidor', details: err?.message }, { status: 500 });
  }
}
