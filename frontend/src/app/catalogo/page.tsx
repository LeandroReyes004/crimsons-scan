'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen, FileText, Eye, Filter, X, ChevronLeft, ShieldAlert, Compass, ChevronDown, ListFilter, Menu, UserCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getUser } from '@/lib/auth';


const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga {
  id: string; titulo: string; tipo: string; estado: string;
  generos: string; views_total: number; cover_r2_key: string | null; fecha_actualizacion: string;
  sinopsis?: string; descripcion?: string;
}

interface GenreData {
  name: string;
  count: number;
  bgManga: Manga;
}

const ESTADO_LABEL: Record<string, string> = { en_curso: 'En curso', completado: 'Completado', pausado: 'Pausado' };
const ESTADO_COLOR: Record<string, string> = {
  en_curso:   'bg-blue-500/20 text-blue-400',
  completado: 'bg-emerald-500/20 text-emerald-400',
  pausado:    'bg-gray-500/20 text-gray-400',
};

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const isAdultMode = searchParams.get('adulto') === '1';
  const initialGenre = searchParams.get('genero') || '';

  const [mangas, setMangas]           = useState<Manga[]>([]);
  const [genres, setGenres]           = useState<GenreData[]>([]);
  const [loading, setLoading]         = useState(true);
  const [user, setUser]               = useState<any>(null);
  
  // Filtros
  const [search, setSearch]           = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenre ? [initialGenre] : []);
  const [selectedTipo, setTipo]       = useState('');
  const [selectedEstado, setEstado]   = useState('');
  const [sortBy, setSortBy]           = useState('popularidad'); // 'popularidad' o 'fecha'

  // Estados de los Dropdowns y Filtros Avanzados
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Estado Hover de Tarjetas (ahora guarda el objeto completo)
  const [hoveredManga, setHoveredManga] = useState<Manga | null>(null);

  useEffect(() => {
    setUser(getUser());
    setLoading(true);
    const endpoint = isAdultMode ? `${API}/api/mangas/adulto` : `${API}/api/mangas`;
    fetch(endpoint, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const allMangas: Manga[] = d.mangas || [];
        setMangas(allMangas);
        
        // Extraer géneros para el Carrusel Visual
        const genreMap = new Map<string, { count: number, bestManga: Manga }>();
        allMangas.forEach(manga => {
          if (manga.generos) {
            try {
              const tags: string[] = JSON.parse(manga.generos);
              tags.forEach(tag => {
                const cleanTag = tag.trim().toUpperCase();
                if (!cleanTag) return;
                if (!genreMap.has(cleanTag)) {
                  genreMap.set(cleanTag, { count: 1, bestManga: manga });
                } else {
                  const current = genreMap.get(cleanTag)!;
                  current.count += 1;
                  if ((manga.views_total || 0) > (current.bestManga.views_total || 0)) current.bestManga = manga;
                  genreMap.set(cleanTag, current);
                }
              });
            } catch (e) {}
          }
        });

        const parsedGenres: GenreData[] = Array.from(genreMap.entries())
          .map(([name, data]) => ({ name, count: data.count, bgManga: data.bestManga }))
          .sort((a, b) => b.count - a.count);

        setGenres(parsedGenres);
      })
      .finally(() => setLoading(false));
  }, [isAdultMode]);

  const filteredAndSorted = useMemo(() => {
    let result = mangas.filter(m => {
      const q = search.toLowerCase();
      if (q && !m.titulo.toLowerCase().includes(q)) return false;
      if (selectedTipo && m.tipo !== selectedTipo) return false;
      if (selectedEstado && m.estado !== selectedEstado) return false;
      if (selectedGenres.length > 0) {
        try {
          const g: string[] = JSON.parse(m.generos || '[]').map((x:string) => x.toUpperCase());
          if (!selectedGenres.every(sg => g.includes(sg.toUpperCase()))) return false;
        } catch { return false; }
      }
      return true;
    });

    // Ordenamiento
    result.sort((a, b) => {
      if (sortBy === 'popularidad') return (b.views_total || 0) - (a.views_total || 0);
      if (sortBy === 'fecha') return new Date(b.fecha_actualizacion || 0).getTime() - new Date(a.fecha_actualizacion || 0).getTime();
      return 0;
    });

    return result;
  }, [mangas, search, selectedGenres, selectedTipo, selectedEstado, sortBy]);

  const hasFilters = selectedGenres.length > 0 || selectedTipo || selectedEstado;
  const clearFilters = () => { setSelectedGenres([]); setTipo(''); setEstado(''); setSearch(''); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-sans overflow-x-hidden pb-24 transition-colors duration-300">

      <main className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8">
        
        {/* Contenedor del Botón de Filtros (Reubicado) */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex shrink-0 items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all border ${
              showAdvancedFilters || hasFilters
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            <ListFilter size={16} /> <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Panel Colapsable de Filtros Avanzados */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showAdvancedFilters ? 'max-h-[500px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
          <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl transition-colors duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              
              {/* Filtro: Ordenar por */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">Ordenar por</label>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-cyan-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="popularidad">Popularidad</option>
                  <option value="fecha">Actualización</option>
                </select>
              </div>

              {/* Filtro: Tipo */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">Tipo</label>
                <select 
                  value={selectedTipo} 
                  onChange={e => setTipo(e.target.value)}
                  className="bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-cyan-500 focus:outline-none transition-colors appearance-none cursor-pointer capitalize"
                >
                  <option value="">Todos los tipos</option>
                  <option value="manga">Manga</option>
                  <option value="manhwa">Manhwa</option>
                  <option value="manhua">Manhua</option>
                  <option value="novela">Novela</option>
                </select>
              </div>

              {/* Filtro: Estado */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">Estado</label>
                <select 
                  value={selectedEstado} 
                  onChange={e => setEstado(e.target.value)}
                  className="bg-gray-50 dark:bg-[#050505] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-cyan-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Cualquier estado</option>
                  <option value="en_curso">En curso</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>

              {/* Filtro: Género (Multiselección) */}
              <div className="flex flex-col gap-3 col-span-2 md:col-span-4 lg:col-span-5 border-t border-gray-200 dark:border-white/5 pt-4 mt-2">
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest">Géneros</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => {
                    const isSelected = selectedGenres.includes(g.name);
                    return (
                      <button
                        key={g.name}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(selectedGenres.filter(sg => sg !== g.name));
                          } else {
                            setSelectedGenres([...selectedGenres, g.name]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                          isSelected 
                            ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
            
            {/* Botón de Reset */}
            {hasFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/5 flex justify-end">
                <button 
                  onClick={clearFilters} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 font-bold text-sm rounded-xl transition-all"
                >
                  <X size={16}/> Restablecer filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Resultados */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 bg-gray-100 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5 transition-colors duration-300">
            <BookOpen size={64} className="mb-6 opacity-20"/>
            <p className="font-bold text-2xl text-gray-800 dark:text-gray-300">No se encontraron proyectos</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Intenta ajustar los filtros o cambiar el género.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold rounded-full hover:bg-cyan-500 hover:text-white transition-all">
                Limpiar todo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* 1. SECCIÓN IZQUIERDA: La grilla del catálogo */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                {filteredAndSorted.map(m => {
                  let tags: string[] = [];
                  try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
                  return (
                    <Link key={m.id} href={`/manga/reader/${m.id}`}
                      onMouseEnter={() => setHoveredManga(m)}
                      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#111111] transition-all duration-300 border-2 hover:-translate-y-2 ${
                        hoveredManga?.id === m.id ? 'border-cyan-500 shadow-[0_10px_30px_rgba(6,182,212,0.3)]' : 'border-gray-200 dark:border-white/5 hover:border-cyan-500/50 hover:shadow-lg'
                      }`}>

                      {/* OVERLAY PARA MÓVIL (Solo se ve en pantallas pequeñas, se oculta en PC con lg:hidden) */}
                      {hoveredManga?.id === m.id && (
                        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col justify-center items-center p-4 lg:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold text-center mb-2 line-clamp-2 leading-tight">{m.titulo}</span>
                          <span className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-xs font-black">
                            LEER
                          </span>
                        </div>
                      )}

                      {/* Portada */}
                      <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 relative">
                        {m.cover_r2_key ? (
                          <img 
                            src={`${API}/api/cover/${m.id}`} 
                            alt={m.titulo} 
                            loading="lazy" 
                            decoding="async" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => { e.currentTarget.src = '/portada.jpg'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900">
                            {m.tipo === 'novela' ? <FileText size={40}/> : <BookOpen size={40}/>}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90"/>
                        <span 
                          className={`absolute text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md z-20 shadow-md ${ESTADO_COLOR[m.estado] || ESTADO_COLOR.pausado}`}
                          style={{ top: '8px', right: '8px' }}
                        >
                          {ESTADO_LABEL[m.estado]}
                        </span>
                        <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-[10px] text-white font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                          <Eye size={12} className="text-rose-500" /> {m.views_total.toLocaleString()}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col gap-1.5 flex-1 relative z-20 bg-white dark:bg-[#111111]">
                        <p className="font-black text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors drop-shadow-sm dark:drop-shadow-md">
                          {m.titulo}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-auto pt-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {m.tipo}
                          </span>
                          {tags.map(t => (
                            <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/5">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 2. SECCIÓN DERECHA: Panel lateral fijo (Solo visible en PC) */}
            <div className="hidden lg:flex flex-col w-80 shrink-0 sticky top-24 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-3xl p-6 min-h-[400px] shadow-xl dark:shadow-2xl transition-colors duration-300">
              {hoveredManga ? (
                <div className="animate-in fade-in duration-300 flex flex-col h-full">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight border-b border-gray-200 dark:border-white/10 pb-3">
                    {hoveredManga.titulo}
                  </h2>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4 mt-3">
                    <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-black border border-cyan-500/20">
                      {hoveredManga.tipo}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-black border border-emerald-500/20">
                      {ESTADO_LABEL[hoveredManga.estado] || hoveredManga.estado}
                    </span>
                    <span className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] uppercase tracking-wider px-2 py-1 rounded font-black border border-gray-200 dark:border-white/10">
                      <Eye size={10} className="inline mr-1" />
                      {hoveredManga.views_total.toLocaleString()}
                    </span>
                  </div>

                  {/* Sinopsis */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed line-clamp-[8]">
                      {hoveredManga.sinopsis || hoveredManga.descripcion || (
                        'Explora este increíble proyecto y sumérgete en su historia llena de misterios, acción y drama. Acompaña a los protagonistas en esta aventura inigualable y descubre qué secretos esconde cada capítulo de esta obra maestra.'
                      )}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/10">
                    <Link 
                      href={`/manga/reader/${hoveredManga.id}`}
                      className="block w-full text-center bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      LEER AHORA
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full items-center justify-center text-center text-gray-600 gap-4 opacity-50">
                  <Compass size={48} className="text-gray-700" />
                  <p className="text-sm font-bold">Pasa el cursor sobre un proyecto para ver su descripción detallada aquí.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
