'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Play, Eye, Tag, Clock, Heart } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga {
  id: string; titulo: string; titulo_alt: string | null; descripcion: string | null;
  generos: string; tipo: string; estado: string; cover_r2_key: string | null; views_total: number;
}
interface Capitulo {
  id: string; numero: number; titulo: string | null; views: number; fecha_subida: string;
}

export default function MangaDetailPage() {
  const { id } = useParams() as { id: string };

  const [manga, setManga]         = useState<Manga | null>(null);
  const [caps, setCaps]           = useState<Capitulo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastChapterId, setLast]  = useState<string | null>(null);
  const { isFav, toggle }         = useFavorites();

  useEffect(() => {
    const saved = localStorage.getItem(`crimson_last_${id}`);
    if (saved) setLast(saved);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/mangas/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setManga(d.manga);
        setCaps(d.capitulos || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error || !manga) return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-gray-400">
      <BookOpen size={48} className="opacity-30"/>
      <p className="font-medium">{error || 'Manga no encontrado'}</p>
      <Link href="/" className="text-rose-500 hover:underline text-sm">Volver al inicio</Link>
    </div>
  );

  let generos: string[] = [];
  try { generos = JSON.parse(manga.generos || '[]'); } catch {}

  const estadoColor: Record<string, string> = {
    en_curso:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pausado:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const estadoLabel: Record<string, string> = { en_curso: 'En curso', completado: 'Completado', pausado: 'Pausado' };

  const coverUrl = manga.cover_r2_key
    ? `${API}/api/cover/${manga.id}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-6 flex items-center gap-3">
        <Link href="/" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
          <ChevronLeft size={20}/>
        </Link>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-xs">CS</div>
        <span className="font-bold text-white/90">Crimson<span className="text-rose-500">Scan</span></span>
      </header>

      {/* Fondo degradado superior */}
      <div className="h-36 sm:h-48 bg-gradient-to-b from-rose-900/25 via-rose-900/10 to-transparent pointer-events-none"/>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-28 sm:-mt-40 pb-20">

        {/* Info del manga */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">

          {/* Portada */}
          <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 aspect-[3/4] bg-gradient-to-br from-rose-900/40 to-gray-900 flex items-center justify-center">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={manga.titulo}
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <BookOpen size={40} className="text-gray-600"/>
              )}
            </div>
          </div>

          {/* Datos */}
          <div className="flex-1 flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${estadoColor[manga.estado] || estadoColor.pausado}`}>
                {estadoLabel[manga.estado] || manga.estado}
              </span>
              <span className="text-xs text-gray-500 capitalize">{manga.tipo}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{manga.titulo}</h1>
            {manga.titulo_alt && <p className="text-gray-400 text-sm">{manga.titulo_alt}</p>}

            {manga.descripcion && (
              <p className="text-gray-300 text-sm leading-relaxed">{manga.descripcion}</p>
            )}

            {generos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {generos.map(g => (
                  <span key={g} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                    <Tag size={9}/> {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Eye size={13}/> {manga.views_total.toLocaleString()} vistas</span>
              <span className="flex items-center gap-1.5"><BookOpen size={13}/> {caps.length} caps</span>
            </div>

            {caps.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-1">
                {/* Continuar leyendo */}
                {lastChapterId && caps.some(c => c.id === lastChapterId) ? (
                  <Link href={`/manga/reader/${id}/chapter/${lastChapterId}`}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/30 text-sm active:scale-95">
                    <Play size={14} fill="white"/> Continuar
                  </Link>
                ) : (
                  <Link href={`/manga/reader/${id}/chapter/${caps[caps.length - 1].id}`}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/30 text-sm active:scale-95">
                    <Play size={14} fill="white"/> Leer desde inicio
                  </Link>
                )}
                {caps.length > 1 && (
                  <Link href={`/manga/reader/${id}/chapter/${caps[0].id}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-2.5 rounded-xl transition border border-white/10 text-sm active:scale-95">
                    Último cap.
                  </Link>
                )}
                {/* Favorito */}
                <button
                  onClick={() => toggle(id)}
                  className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl transition border text-sm active:scale-95 ${
                    isFav(id)
                      ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-rose-500/40 hover:text-rose-400'
                  }`}
                >
                  <Heart size={14} fill={isFav(id) ? 'currentColor' : 'none'}/>
                  {isFav(id) ? 'En favoritos' : 'Favorito'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista capítulos */}
        <div>
          <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-5 bg-rose-500 rounded-full shrink-0"/>
            Capítulos
          </h2>

          {caps.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-10 flex flex-col items-center text-gray-500 border border-white/5">
              <Clock size={28} className="mb-3 opacity-40"/>
              <p className="font-medium text-sm">Aún no hay capítulos publicados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {caps.map(cap => (
                <Link key={cap.id} href={`/manga/reader/${id}/chapter/${cap.id}`}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-rose-500/30 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 transition group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-rose-500 group-hover:text-white transition">
                      {cap.numero}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-white/90 group-hover:text-white">
                        Capítulo {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(cap.fecha_subida).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 shrink-0">
                    <span className="text-xs flex items-center gap-1"><Eye size={11}/>{cap.views}</span>
                    <Play size={14} className="opacity-0 group-hover:opacity-100 text-rose-400 transition"/>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
