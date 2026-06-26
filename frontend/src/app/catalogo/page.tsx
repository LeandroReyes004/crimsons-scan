'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, BookOpen, Eye, Filter, X, ChevronLeft, ShieldAlert } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import AdPopUnder from '@/components/AdPopUnder';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const GENRES = ['Acción','Aventura','Comedia','Drama','Fantasía','Horror','Misterio','Psicológico','Romance','Ciencia Ficción','Sobrenatural','Thriller','Deportes','Histórico','Isekai','Mecha','Magia','Artes Marciales','Superpoderes','Reencarnación','Supervivencia','BL','Yuri'];
const ADULT_GENRES = ['Adulto','Maduro','Ecchi','Harem','Yaoi','Yuri','Acción','Aventura','Comedia','Drama','Fantasía','Horror','Misterio','Psicológico','Romance','Sobrenatural','Thriller','Tragedia'];

interface Manga {
  id: string; titulo: string; tipo: string; estado: string;
  generos: string; views_total: number; cover_r2_key: string | null; fecha_actualizacion: string;
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const isAdultMode = searchParams.get('adulto') === '1';

  const [mangas, setMangas]           = useState<Manga[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedGenre, setGenre]     = useState('');
  const [selectedTipo, setTipo]       = useState('');
  const [selectedEstado, setEstado]   = useState('');
  const [selectedEstado, setEstado]   = useState('');

  useEffect(() => {
    setLoading(true);
    const endpoint = isAdultMode ? `${API}/api/mangas/adulto` : `${API}/api/mangas`;
    fetch(endpoint)
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []))
      .finally(() => setLoading(false));
  }, [isAdultMode]);

  const genresList = isAdultMode ? ADULT_GENRES : GENRES;

  const filtered = useMemo(() => {
    return mangas.filter(m => {
      const q = search.toLowerCase();
      if (q && !m.titulo.toLowerCase().includes(q)) return false;
      if (selectedTipo && m.tipo !== selectedTipo) return false;
      if (selectedEstado && m.estado !== selectedEstado) return false;
      if (selectedGenre) {
        try {
          const g: string[] = JSON.parse(m.generos || '[]');
          if (!g.includes(selectedGenre)) return false;
        } catch { return false; }
      }
      return true;
    });
  }, [mangas, search, selectedGenre, selectedTipo, selectedEstado]);

  const hasFilters = selectedGenre || selectedTipo || selectedEstado;
  const clearFilters = () => { setGenre(''); setTipo(''); setEstado(''); };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-sans">
      {isAdultMode && <AdPopUnder />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={isAdultMode ? "/adulto" : "/"} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
            <ChevronLeft size={18}/>
          </Link>
          <Link href={isAdultMode ? "/adulto" : "/"} className="flex items-center gap-2">
            <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
            {isAdultMode && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">+18</span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Título y búsqueda */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold dark:text-white flex items-center gap-2">
              {isAdultMode ? (
                <>
                  <ShieldAlert className="text-rose-500" size={28}/> Catálogo +18
                </>
              ) : (
                "Catálogo"
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} obras disponibles</p>
          </div>

          <div className="flex items-center gap-3 w-full md:max-w-md">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-full text-sm dark:text-white focus:border-rose-500 outline-none transition shadow-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14}/>
                </button>
              )}
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:underline shrink-0">
                <X size={14}/> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filtros en formato Pill (scrolleables) */}
        <div className="flex flex-col gap-3 mb-8">
          {/* Tipo */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-2 shrink-0">Tipo</span>
            {['manga', 'manhwa', 'manhua', 'novela'].map(t => (
              <button key={t} onClick={() => setTipo(selectedTipo === t ? '' : t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border shrink-0 capitalize ${
                  selectedTipo === t
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white dark:bg-[#111114] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                }`}>{t}</button>
            ))}
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-2 shrink-0">Estado</span>
            {['en_curso', 'completado', 'pausado'].map(e => (
              <button key={e} onClick={() => setEstado(selectedEstado === e ? '' : e)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border shrink-0 ${
                  selectedEstado === e
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white dark:bg-[#111114] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                }`}>{ESTADO_LABEL[e]}</button>
            ))}
          </div>

          {/* Géneros */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-2 shrink-0">Género</span>
            {genresList.map(g => (
              <button key={g} onClick={() => setGenre(selectedGenre === g ? '' : g)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border shrink-0 ${
                  selectedGenre === g
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white dark:bg-[#111114] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                }`}>{g}</button>
            ))}
          </div>
        </div>



        {/* Grid de mangas */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <BookOpen size={48} className="mb-4 opacity-20"/>
            <p className="font-medium text-lg">No se encontraron obras</p>
            <p className="text-sm mt-1">Probá con otros filtros o términos de búsqueda</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-rose-500 hover:underline text-sm">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(m => {
              let tags: string[] = [];
              try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
              return (
                <Link key={m.id} href={`/manga/reader/${m.id}`}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 hover:border-rose-300 dark:hover:border-rose-500/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

                  {/* Portada */}
                  <div className="aspect-[3/4] overflow-hidden bg-gradient-to-br from-rose-900/20 to-gray-900 relative">
                    {m.cover_r2_key ? (
                      <img src={`${API}/api/cover/${m.id}`} alt={m.titulo} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <BookOpen size={32}/>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ESTADO_COLOR[m.estado] || ESTADO_COLOR.pausado}`}>
                      {ESTADO_LABEL[m.estado]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="font-bold text-sm dark:text-white line-clamp-2 leading-tight group-hover:text-rose-500 transition-colors">
                      {m.titulo}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.tipo}</p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map(t => (
                          <span key={t} className="text-[9px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-auto pt-1 text-[10px] text-gray-400">
                      <Eye size={10}/> {m.views_total.toLocaleString()}
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
