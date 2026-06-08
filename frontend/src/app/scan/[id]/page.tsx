'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Layers, BookOpen, Eye } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { useFavorites } from '@/lib/favorites';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga {
  id: string; slug?: string | null; titulo: string; tipo: string; estado: string; cover_r2_key: string | null;
  views_total: number; generos: string; es_adulto: number;
  ultimo_capitulo: number | null; ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null;
}
interface Scan { id: string; nombre: string; descripcion: string | null; }

export default function ScanPage() {
  const { id } = useParams() as { id: string };
  const [scan, setScan]   = useState<Scan | null>(null);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFav, toggle } = useFavorites();

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/scans/${id}`)
      .then(r => r.json())
      .then(d => { setScan(d.scan); setMangas(d.mangas || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-4 sm:px-6 flex items-center gap-3">
        <Link href="/" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
          <ChevronLeft size={20}/>
        </Link>
        <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : !scan ? (
          <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
            <Layers size={40} className="opacity-30"/>
            <p>Scan no encontrado</p>
            <Link href="/" className="text-rose-500 hover:underline text-sm">Volver al inicio</Link>
          </div>
        ) : (
          <>
            {/* Info del scan */}
            <div className="mb-10 flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-rose-600/30 shrink-0">
                {scan.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-rose-400"/>
                  <span className="text-xs text-rose-400 font-semibold uppercase tracking-wide">Grupo de Scan</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">{scan.nombre}</h1>
                {scan.descripcion && <p className="text-gray-400 text-sm mt-2 max-w-xl">{scan.descripcion}</p>}
                <p className="text-gray-600 text-sm mt-2 flex items-center gap-1.5">
                  <BookOpen size={13}/> {mangas.length} {mangas.length === 1 ? 'obra' : 'obras'}
                </p>
              </div>
            </div>

            {/* Grid de mangas */}
            {mangas.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-16 flex flex-col items-center text-gray-500 border border-white/5">
                <BookOpen size={36} className="mb-3 opacity-30"/>
                <p className="font-medium">Este scan no tiene obras publicadas aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {mangas.map((m, i) => {
                  let tags: string[] = [];
                  try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
                  return (
                    <MangaCard
                      key={m.id}
                      id={m.id}
                      slug={m.slug}
                      title={m.titulo}
                      imageUrl={m.cover_r2_key ? `${API}/api/cover/${m.slug ?? m.id}` : '/portada.jpg'}
                      chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
                      chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : null}
                      updatedAt={m.ultimo_cap_fecha}
                      tags={tags}
                      isHot={m.views_total > 1000}
                      isFav={isFav(m.id)}
                      onToggleFav={toggle}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
