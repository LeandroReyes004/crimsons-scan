import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Acceso denegado o sesión inválida' }, { status: 401 });
    }

    const metadata = await req.json();
    const { title, description, type, demography, contentRating, genres, coverUrl } = metadata;

    if (!title) {
       return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 });
    }

    // Insertar en mangas
    const { data: mangaData, error: mangaError } = await supabaseAdmin
      .from('mangas')
      .insert({
        title,
        description,
        type,
        demography,
        content_rating: contentRating,
        cover_image: coverUrl,
        created_by: user.id
      })
      .select('id')
      .single();

    if (mangaError || !mangaData) {
      return NextResponse.json({ error: 'Error al registrar obra', details: mangaError }, { status: 500 });
    }

    const mangaId = mangaData.id;

    // Si existen géneros, los insertamos en manga_genres
    if (genres && genres.length > 0) {
      const genreRecords = genres.map((genre: string) => ({
        manga_id: mangaId,
        genre_name: genre
      }));

      const { error: genresError } = await supabaseAdmin
        .from('manga_genres')
        .insert(genreRecords);

      if (genresError) {
        console.error('Error insertando géneros:', genresError);
        // Aunque fallen los géneros, informamos éxito parcial (puedes ajustar esta lógica según rigor)
      }
    }

    return NextResponse.json({ message: 'Obra creada exitosamente', mangaId });

  } catch (err: any) {
    console.error('Error al guardar json del manga:', err);
    return NextResponse.json({ error: 'Error interno en el servidor', details: err?.message }, { status: 500 });
  }
}
