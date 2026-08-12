'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Play, BookOpen, Clock, CheckCircle2, ChevronRight, BellDot } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  tipo: string;
  cover_r2_key: string | null; 
  ultimo_capitulo_id: string | null; 
}

// Interfaz extendida para simular el progreso del usuario
interface UserLibraryManga extends Manga {
  userStatus: 'leyendo' | 'completados' | 'para_leer';
  progressPercentage: number;
  hasNewChapters: boolean;
  lastReadChapterStr: string;
  lastReadChapterId: string;
}

const TABS = [
  { id: 'leyendo', label: 'Leyendo', icon: BookOpen },
  { id: 'completados', label: 'Completados', icon: CheckCircle2 },
  { id: 'para_leer', label: 'Para Leer', icon: Clock }
];

export default function FavoritosPage() {
  const [library, setLibrary] = useState<UserLibraryManga[]>([]);
  const [activeTab, setActiveTab] = useState('leyendo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`)
      .then(r => r.json())
      .then(d => {
        const allMangas: Manga[] = d.mangas || [];
        
        // SIMULACIÓN: Inyectamos datos de progreso falsos (Mock Data) para la demo UX
        const mockedLibrary: UserLibraryManga[] = allMangas.slice(0, 24).map((m, index) => {
          
          let status: 'leyendo' | 'completados' | 'para_leer' = 'leyendo';
          let progress = 0;
          let newChapters = false;
          let lastChapStr = 'Cap. 1';

          // Distribuir falsamente los estados según el índice
          if (index % 5 === 0) {
            status = 'completados';
            progress = 100;
          } else if (index % 4 === 0) {
            status = 'para_leer';
            progress = 0;
            newChapters = true;
          } else {
            status = 'leyendo';
            progress = Math.floor(Math.random() * 80) + 10; // 10% a 90%
            newChapters = index % 2 === 0; // Algunos tienen caps nuevos
            lastChapStr = `Cap. ${Math.floor(Math.random() * 50) + 5}`;
          }

          return {
            ...m,
            userStatus: status,
            progressPercentage: progress,
            hasNewChapters: newChapters,
            lastReadChapterStr: lastChapStr,
            lastReadChapterId: m.ultimo_capitulo_id || '1'
          };
        });

        setLibrary(mockedLibrary);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const filteredLibrary = useMemo(() => {
    return library.filter(m => m.userStatus === activeTab);
  }, [library, activeTab]);

  return (
    <div className="min-h-screen w-full bg-[#050505] overflow-hidden pb-24">
      
      {/* Cabecera Principal */}
      <div className="relative w-full pt-16 pb-8 px-4 md:px-8 bg-black border-b border-white/5">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-rose-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg flex items-center gap-4">
              <Heart className="text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" size={40} fill="currentColor" />
              Tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Biblioteca</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm md:text-base">Retoma tus lecturas exactamente donde las dejaste.</p>
          </div>

          {/* Pestañas de Estado (Filtros) */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto hide-scrollbar">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const count = library.filter(m => m.userStatus === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shrink-0 border ${
                    isActive
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-rose-500" : "text-gray-500"} />
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-rose-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                    {loading ? '-' : count}
                  </span>
                  
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-rose-500 rounded-t-full shadow-[0_0_10px_rgba(225,29,72,1)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-10">
        {loading ? (
          <div className="w-full flex items-center justify-center min-h-[400px]">
             <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
          </div>
        ) : filteredLibrary.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[300px] text-gray-500 bg-white/5 rounded-3xl border border-white/5">
            <Heart size={48} className="mb-4 opacity-50" />
            <p className="text-xl font-bold text-gray-300">No hay mangas aquí</p>
            <p className="text-sm mt-1">Explora el catálogo y añade tus favoritos a la biblioteca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
            {filteredLibrary.map(manga => {
              const coverUrl = manga.cover_r2_key ? `${API_URL}/api/cover/${manga.id}` : '/portada.jpg';
              
              return (
                <Link 
                  key={manga.id}
                  href={`/manga/reader/${manga.slug ?? manga.id}/chapter/${manga.lastReadChapterId}`}
                  className="group relative flex flex-col w-full aspect-[2/3] rounded-2xl overflow-hidden bg-black border border-white/5 hover:border-rose-500/50 hover:shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                >
                  {/* Imagen de Fondo */}
                  <div className="absolute inset-0 z-0">
                    <div 
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${coverUrl}')` }}
                    />
                  </div>
                  
                  {/* Alerta de Nuevos Capítulos */}
                  {manga.hasNewChapters && (
                    <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.8)] border border-rose-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      Nuevos Caps
                    </div>
                  )}

                  {/* Gradiente Oscuro Base (siempre visible para texto) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                  {/* Overlay Oscuro para Hover (para el botón Play) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 z-20 flex flex-col items-center justify-center">
                    {/* Botón Central Masivo de Continuar Leyendo */}
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-2 transform scale-50 group-hover:scale-100 transition-all duration-500 delay-75">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.8)] border border-rose-400">
                        <Play size={24} fill="currentColor" className="text-white ml-1" />
                      </div>
                    </div>
                    <span className="text-white font-black text-sm uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150 drop-shadow-md">
                      {manga.userStatus === 'completados' ? 'Releer' : 'Continuar'}
                    </span>
                    <span className="text-rose-300 font-bold text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                      {manga.userStatus === 'para_leer' ? 'Desde el inicio' : manga.lastReadChapterStr}
                    </span>
                  </div>
                  
                  {/* Información Inferior (Título y Progreso) */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pt-10 flex flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md group-hover:-translate-y-2 transition-transform duration-300">
                      {manga.titulo}
                    </h3>
                    
                    {/* Barra de Progreso */}
                    <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden group-hover:-translate-y-2 transition-transform duration-300">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          manga.progressPercentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_rgba(225,29,72,0.8)]'
                        }`}
                        style={{ width: `${manga.progressPercentage}%` }}
                      />
                    </div>
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
