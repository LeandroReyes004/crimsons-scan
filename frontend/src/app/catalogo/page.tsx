'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen, FileText, Eye, Filter, X, ChevronLeft, ShieldAlert, Compass, ChevronDown, ListFilter } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';


const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga {
  id: string; titulo: string; tipo: string; estado: string;
  generos: string; views_total: number; cover_r2_key: string | null; fecha_actualizacion: string;
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
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
  
  // Filtros
  const [search, setSearch]           = useState('');
  const [selectedGenre, setGenre]     = useState(initialGenre);
  const [selectedTipo, setTipo]       = useState('');
  const [selectedEstado, setEstado]   = useState('');
  const [sortBy, setSortBy]           = useState('popularidad'); // 'popularidad' o 'fecha'

  // Estados de los Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
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
      if (selectedGenre) {
        try {
          const g: string[] = JSON.parse(m.generos || '[]').map((x:string) => x.toUpperCase());
          if (!g.includes(selectedGenre.toUpperCase())) return false;
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
  }, [mangas, search, selectedGenre, selectedTipo, selectedEstado, sortBy]);

  const hasFilters = selectedGenre || selectedTipo || selectedEstado;
  const clearFilters = () => { setGenre(''); setTipo(''); setEstado(''); setSearch(''); };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden pb-24">


      {/* Header Fijo */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 h-16 px-4 md:px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <Link href={isAdultMode ? "/adulto" : "/"} className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition">
            <ChevronLeft size={20}/>
          </Link>
          <div className="flex items-center gap-3">
            <Compass className="text-rose-500 drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" size={24} />
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              {isAdultMode ? 'Explorar +18' : 'Explorar'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full max-w-xs md:max-w-md ml-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar título..."
              className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white focus:border-rose-500 focus:bg-white/10 outline-none transition-all shadow-inner"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={14}/>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8">

        {/* Búsqueda Avanzada (Dropdowns Elegantes) */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mr-2">
            <ListFilter size={16} /> Filtros:
          </div>
          
          {/* Dropdown Tipo */}
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'tipo' ? null : 'tipo')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                selectedTipo ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Tipo: {selectedTipo ? <span className="capitalize text-white">{selectedTipo}</span> : 'Todos'} <ChevronDown size={14} className={openDropdown === 'tipo' ? 'rotate-180' : ''} />
            </button>
            {openDropdown === 'tipo' && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40">
                <button onClick={() => { setTipo(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-rose-500/20 hover:text-rose-400 font-bold">Todos</button>
                {['manga', 'manhwa', 'manhua', 'novela'].map(t => (
                  <button key={t} onClick={() => { setTipo(t); setOpenDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-rose-500/20 hover:text-rose-400 font-bold capitalize">{t}</button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Estado */}
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'estado' ? null : 'estado')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                selectedEstado ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              Estado: {selectedEstado ? <span className="text-white">{ESTADO_LABEL[selectedEstado]}</span> : 'Todos'} <ChevronDown size={14} className={openDropdown === 'estado' ? 'rotate-180' : ''} />
            </button>
            {openDropdown === 'estado' && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40">
                <button onClick={() => { setEstado(''); setOpenDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-rose-500/20 hover:text-rose-400 font-bold">Todos</button>
                {['en_curso', 'completado', 'pausado'].map(e => (
                  <button key={e} onClick={() => { setEstado(e); setOpenDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-rose-500/20 hover:text-rose-400 font-bold">{ESTADO_LABEL[e]}</button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Orden */}
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'orden' ? null : 'orden')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              Ordenar: <span className="text-white capitalize">{sortBy}</span> <ChevronDown size={14} className={openDropdown === 'orden' ? 'rotate-180' : ''} />
            </button>
            {openDropdown === 'orden' && (
              <div className="absolute top-full mt-2 left-0 w-48 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40">
                <button onClick={() => { setSortBy('popularidad'); setOpenDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-rose-500/20 hover:text-rose-400 font-bold">Popularidad</button>
                <button onClick={() => { setSortBy('fecha'); setOpenDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-rose-500/20 hover:text-rose-400 font-bold">Actualización</button>
              </div>
            )}
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="px-4 py-2 text-sm text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1 hover:underline ml-auto">
              <X size={16}/> Limpiar
            </button>
          )}
        </div>

        {/* Carrusel Visual de Géneros (Dribbble Style) */}
        {!loading && genres.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-wider mb-4">
              Filtrar por Género
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              <button
                onClick={() => setGenre('')}
                className={`relative shrink-0 w-32 h-20 rounded-2xl overflow-hidden border transition-all duration-300 snap-start flex items-center justify-center font-black uppercase tracking-widest ${
                  !selectedGenre ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'border-white/10 bg-white/5 text-gray-500 hover:text-white hover:border-white/20'
                }`}
              >
                Todos
              </button>
              {genres.map(g => {
                const coverUrl = g.bgManga.cover_r2_key ? `${API}/api/cover/${g.bgManga.id}` : '/portada.jpg';
                const isSelected = selectedGenre.toUpperCase() === g.name.toUpperCase();
                return (
                  <button
                    key={g.name}
                    onClick={() => setGenre(isSelected ? '' : g.name)}
                    className={`group relative shrink-0 w-48 h-20 md:w-56 md:h-24 rounded-2xl overflow-hidden border transition-all duration-500 snap-start ${
                      isSelected 
                        ? 'border-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.6)] scale-[1.02]' 
                        : 'border-white/10 hover:border-rose-400/50 hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                    }`}
                  >
                    <div className="absolute inset-0 z-0">
                      <div className={`w-full h-full bg-cover bg-center transition-transform duration-700 ease-out ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} style={{ backgroundImage: `url('${coverUrl}')` }} />
                    </div>
                    <div className={`absolute inset-0 transition-all duration-500 z-10 ${isSelected ? 'bg-black/40' : 'bg-black/70 backdrop-blur-[1px] group-hover:bg-black/50'}`} />
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-2">
                      <span className={`font-black uppercase tracking-widest text-center transition-all duration-300 ${isSelected ? 'text-white drop-shadow-[0_2px_10px_rgba(225,29,72,0.8)] text-lg md:text-xl' : 'text-gray-300 group-hover:text-white text-base md:text-lg drop-shadow-[0_2px_5px_rgba(0,0,0,1)]'}`}>
                        {g.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid de Resultados */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 bg-white/5 rounded-3xl border border-white/5">
            <BookOpen size={64} className="mb-6 opacity-20"/>
            <p className="font-bold text-2xl text-gray-300">No se encontraron proyectos</p>
            <p className="text-gray-500 mt-2">Intenta ajustar los filtros o cambiar el género.</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-6 px-6 py-2 bg-rose-500/20 text-rose-500 font-bold rounded-full hover:bg-rose-500 hover:text-white transition-all">
                Limpiar todo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
            {filteredAndSorted.map(m => {
              let tags: string[] = [];
              try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
              return (
                <Link key={m.id} href={`/manga/reader/${m.id}`}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#111111] border border-white/5 hover:border-rose-500/50 shadow-lg hover:shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all duration-300 hover:-translate-y-2">

                  {/* Portada */}
                  <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-rose-900/20 to-gray-900 relative">
                    {m.cover_r2_key ? (
                      <img src={`${API}/api/cover/${m.id}`} alt={m.titulo} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        {m.tipo === 'novela' ? <FileText size={40}/> : <BookOpen size={40}/>}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90"/>
                    <span className={`absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md z-20 shadow-md ${ESTADO_COLOR[m.estado] || ESTADO_COLOR.pausado}`}>
                      {ESTADO_LABEL[m.estado]}
                    </span>
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-[10px] text-white font-bold bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                      <Eye size={12} className="text-rose-500" /> {m.views_total.toLocaleString()}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1.5 flex-1 relative z-20">
                    <p className="font-black text-sm text-white line-clamp-2 leading-tight group-hover:text-rose-400 transition-colors drop-shadow-md">
                      {m.titulo}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-auto pt-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        {m.tipo}
                      </span>
                      {tags.map(t => (
                        <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
