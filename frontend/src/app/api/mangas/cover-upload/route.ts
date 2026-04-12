import { NextRequest, NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2';
import { supabase } from '@/lib/supabase';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
  try {
    // Autenticación básica
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Acceso denegado o sesión inválida' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('cover') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ninguna imagen.' }, { status: 400 });
    }

    // Configurando el objeto R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split('.').pop() || 'jpg';
    
    // Al no tener mangaId en este paso (la obra no está creada), se guarda en covers con uuid
    const objectKey = `covers/${crypto.randomUUID()}.${extension}`;
    const bucketName = process.env.R2_BUCKET_NAME || 'crimsons-scan';
    const publicR2Domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-midominio.r2.dev';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);
    const publicUrl = `${publicR2Domain}/${objectKey}`;

    return NextResponse.json({ coverUrl: publicUrl });

  } catch (err: any) {
    console.error('Error al subir portada:', err);
    return NextResponse.json({ error: 'Error interno en el servidor', details: err?.message }, { status: 500 });
  }
}
