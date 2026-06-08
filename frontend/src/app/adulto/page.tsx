'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Eye, Filter, X, ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck, Flame, Clock, TrendingUp } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import MangaCard from '@/components/MangaCard';
import AdPopUnder from '@/components/AdPopUnder';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const STORAGE_KEY = 'cs_age_confirmed';

const GENRES = ['Acción','Aventura','Comedia','Drama','Fantasía','Horror','Misterio','Psicológico','Romance','Harem','Ecchi','Seinen','Josei','BL','Yuri'];

interface Manga {
  id: string; slug?: string | null; titulo: string; tipo: string; estado: string;
  generos: string; views_total: number; cover_r2_key: string | null;
  fecha_actualizacion: string; ultimo_capitulo: number | null;
  ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null;
}

const ESTADO_LABEL: Record<string, string> = { en_curso: 'En curso', completado: 'Completado', pausado: 'Pausado' };
const ESTADO_COLOR: Record<string, string> = {
  en_curso:   'bg-blue-500/20 text-blue-400',
  completado: 'bg-emerald-500/20 text-emerald-400',
  pausado:    'bg-gray-500/20 text-gray-400',
};

function MangaRow({ title, icon, mangas }: { title: string; icon: React.ReactNode; mangas: Manga[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });
  if (mangas.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <h3 className="text-xl font-bold dark:text-white">{title}</h3>
          <span className="text-xs text-gray-400 font-medium">{mangas.length} obras</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-rose-500/20 text-gray-500 dark:text-gray-300 hover:text-rose-500 transition">
            <ChevronLeft size={14}/>
          </button>
          <button onClick={() => scroll(1)} className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-rose-500/20 text-gray-500 dark:text-gray-300 hover:text-rose-500 transition">
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        {mangas.map((m, i) => {
          let tags: string[] = [];
          try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
          return (
            <div key={m.id} className="w-[160px] md:w-[180px] shrink-0 snap-start">
              <MangaCard
                id={m.id}
                slug={m.slug}
                title={m.titulo}
                imageUrl={m.cover_r2_key ? `${API}/api/cover/${m.slug ?? m.id}` : `https://picsum.photos/400/600?random=${i}`}
                chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
                chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : null}
                updatedAt={m.ultimo_cap_fecha}
                tags={tags}
                isHot={m.views_total > 500}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AdultoPage() {
  const [confirmed, setConfirmed]     = useState<boolean | null>(null);
  const [mangas, setMangas]           = useState<Manga[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedGenre, setGenre]     = useState('');
  const [selectedTipo, setTipo]       = useState('');
  const [selectedEstado, setEstado]   = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setConfirmed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    fetch(`${API}/api/mangas/adulto`)
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []))
      .finally(() => setLoading(false));
  }, [confirmed]);

  const masLeidos = useMemo(() => [...mangas].sort((a, b) => b.views_total - a.views_total).slice(0, 20), [mangas]);
  const recientes = useMemo(() => [...mangas].slice(0, 20), [mangas]);

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

  const hasFilters = !!(selectedGenre || selectedTipo || selectedEstado || search);
  const clearFilters = () => { setGenre(''); setTipo(''); setEstado(''); setSearch(''); };

  if (confirmed === null) return null;

  return (
    <>
    {confirmed && <AdPopUnder />}
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
            <ChevronLeft size={18}/>
          </Link>
          <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
          <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">+18</span>
        </div>
        <div className="flex items-center gap-2">
          {confirmed && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <ShieldCheck size={12}/> Verificado
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Gate de edad */}
      {!confirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
              <ShieldAlert size={32} className="text-rose-500"/>
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-white text-2xl font-bold mb-2">Contenido +18</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Esta sección contiene contenido para adultos. Al continuar confirmás que tenés 18 años o más.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setConfirmed(true); }}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition active:scale-95"
              >
                Tengo 18 años o más — Entrar
              </button>
              <Link href="/" className="w-full text-center text-gray-500 hover:text-gray-700 dark:hover:text-white text-sm py-2 transition">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      )}

      {confirmed && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <>
              {/* Secciones */}
              <MangaRow
                title="Más leídos"
                icon={<TrendingUp size={20} className="text-rose-500"/>}
                mangas={masLeidos}
              />
              <MangaRow
                title="Recientes"
                icon={<Clock size={20} className="text-orange-400"/>}
                mangas={recientes}
              />

              {/* Catálogo completo */}
              <section className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-rose-500"/>
                  <h3 className="text-xl font-bold dark:text-white">Catálogo completo</h3>
                  <span className="text-xs text-gray-400 font-medium">{mangas.length} obras</span>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="flex items-center gap-2 w-full max-w-lg">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar por título..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={14}/>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                      hasFilters
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-rose-400 hover:text-rose-500'
                    }`}
                  >
                    <Filter size={15}/> Filtros {hasFilters && `(${[selectedGenre, selectedTipo, selectedEstado, search].filter(Boolean).length})`}
                  </button>
                </div>

                {showFilters && (
                  <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold dark:text-white text-sm">Filtros</h3>
                      {hasFilters && (
                        <button onClick={clearFilters} className="text-xs text-rose-500 hover:underline flex items-center gap-1">
                          <X size={12}/> Limpiar
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tipo</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['manga', 'manhwa', 'manhua'].map(t => (
                            <button key={t} onClick={() => setTipo(selectedTipo === t ? '' : t)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition border capitalize ${
                                selectedTipo === t ? 'bg-rose-500 text-white border-rose-500' : 'text-gray-500 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                              }`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Estado</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['en_curso', 'completado', 'pausado'].map(e => (
                            <button key={e} onClick={() => setEstado(selectedEstado === e ? '' : e)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                                selectedEstado === e ? 'bg-rose-500 text-white border-rose-500' : 'text-gray-500 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                              }`}>{ESTADO_LABEL[e]}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Género</p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {GENRES.map(g => (
                            <button key={g} onClick={() => setGenre(selectedGenre === g ? '' : g)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                                selectedGenre === g ? 'bg-rose-500 text-white border-rose-500' : 'text-gray-500 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                              }`}>{g}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-gray-400">
                    <BookOpen size={48} className="mb-4 opacity-20"/>
                    <p className="font-medium text-lg">{mangas.length === 0 ? 'No hay contenido +18 publicado aún' : 'No se encontraron obras'}</p>
                    {hasFilters && (
                      <button onClick={clearFilters} className="mt-4 text-rose-500 hover:underline text-sm">Limpiar filtros</button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filtered.map((m, i) => {
                      let tags: string[] = [];
                      try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
                      return (
                        <MangaCard
                          key={m.id}
                          id={m.id}
                          slug={m.slug}
                          title={m.titulo}
                          imageUrl={m.cover_r2_key ? `${API}/api/cover/${m.slug ?? m.id}` : `https://picsum.photos/400/600?random=${i}`}
                          chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
                          chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : null}
                          updatedAt={m.ultimo_cap_fecha}
                          tags={tags}
                          isHot={m.views_total > 500}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      )}
    </div>
    </>
  );
}
