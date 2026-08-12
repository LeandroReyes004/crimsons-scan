'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Play, BookOpen } from 'lucide-react';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  tipo: string;
  cover_r2_key: string | null; 
  ultimo_capitulo_id: string | null; 
  ultimo_capitulo?: number | string | null;
}

export default function FavoritosPage() {
  const [library, setLibrary] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`)
      .then(r => r.json())
      .then(d => {
        // Usando datos 100% reales de la BD, sin simulaciones.
        // Como no hay usuarios logueados, mostramos los mangas reales directamente.
        setLibrary(d.mangas || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  return (
    <div className="min-h-screen w-full bg-[#050505] overflow-hidden pb-24">
      
      {/* Cabecera Principal */}
      <div className="relative w-full pt-16 pb-8 px-4 md:px-8 bg-black border-b border-white/5">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-rose-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-[1600px] mx-auto w-full flex flex-col gap-4">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg flex items-center gap-4">
              <Heart className="text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" size={40} fill="currentColor" />
              Tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Biblioteca</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm md:text-base">Tus mangas favoritos listos para leer con datos reales.</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-10">
        {loading ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
             <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                <Heart size={20} className="text-rose-500 animate-pulse" fill="currentColor" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Cargando biblioteca...</h2>
          </div>
        ) : library.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[300px] text-gray-500 bg-white/5 rounded-3xl border border-white/5">
            <Heart size={48} className="mb-4 opacity-50" />
            <p className="text-xl font-bold text-gray-300">No hay mangas aquí</p>
            <p className="text-sm mt-1">Explora el catálogo y añade tus favoritos a la biblioteca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
            {library.map(manga => {
              const coverUrl = manga.cover_r2_key ? `${API_URL}/api/cover/${manga.id}` : '/portada.jpg';
              // Usamos el id del último capítulo real, o vamos al manga directamente si no hay caps
              const linkUrl = manga.ultimo_capitulo_id 
                ? `/manga/reader/${manga.slug ?? manga.id}/chapter/${manga.ultimo_capitulo_id}` 
                : `/manga/reader/${manga.slug ?? manga.id}`;
              
              return (
                <Link 
                  key={manga.id}
                  href={linkUrl}
                  className="group relative flex flex-col w-full aspect-[2/3] rounded-2xl overflow-hidden bg-black border border-white/5 hover:border-rose-500/50 hover:shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                >
                  {/* Imagen de Fondo */}
                  <div className="absolute inset-0 z-0">
                    <div 
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${coverUrl}')` }}
                    />
                  </div>
                  
                  {/* Etiqueta de Tipo Real */}
                  <div className="absolute top-2 left-2 z-30 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-md">
                    {manga.tipo}
                  </div>

                  {/* Gradiente Oscuro Base */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                  {/* Overlay Oscuro para Hover (para el botón Play) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 z-20 flex flex-col items-center justify-center">
                    {/* Botón Central de Leer */}
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-2 transform scale-50 group-hover:scale-100 transition-all duration-500 delay-75">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.8)] border border-rose-400">
                        <Play size={24} fill="currentColor" className="text-white ml-1" />
                      </div>
                    </div>
                    <span className="text-white font-black text-sm uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150 drop-shadow-md">
                      Leer
                    </span>
                  </div>
                  
                  {/* Información Inferior (Título y Capítulo Real) */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pt-10 flex flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                      {manga.titulo}
                    </h3>
                    {manga.ultimo_capitulo && (
                      <span className="text-rose-400 text-xs font-bold mt-1.5 group-hover:-translate-y-1 transition-transform duration-300">
                        Último: Cap. {manga.ultimo_capitulo}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
