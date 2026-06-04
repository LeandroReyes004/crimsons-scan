'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Settings, Menu, X, Heart } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getUser } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';

interface Manga { id: string; titulo: string; generos: string; estado: string; tipo: string; views_total: number; cover_r2_key: string | null; fecha_actualizacion: string; ultimo_capitulo: number | null; ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null; }

export default function Home() {
  const [user, setUser]         = useState<ReturnType<typeof getUser>>(null);
  const [mangas, setMangas]     = useState<Manga[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { favorites, toggle, isFav } = useFavorites();

  useEffect(() => {
    setUser(getUser());
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`)
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []))
      .catch(() => {});
  }, []);

  const favMangas = mangas.filter(m => favorites.includes(m.id));

  const buildCard = (m: Manga, i: number) => {
    let tags: string[] = [];
    try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    return (
      <MangaCard
        key={m.id}
        id={m.id}
        title={m.titulo}
        imageUrl={m.cover_r2_key ? `${API}/api/cover/${m.id}` : `https://picsum.photos/400/600?random=${i}`}
        chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
        chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.id}/chapter/${m.ultimo_capitulo_id}` : null}
        updatedAt={m.ultimo_cap_fecha}
        tags={tags}
        isHot={m.views_total > 1000}
        isFav={isFav(m.id)}
        onToggleFav={toggle}
      />
    );
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">

      {/* Header */}
      <header className="sticky top-0 z-50 relative bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 py-4 px-6 md:px-12 flex items-center justify-between shadow-sm dark:shadow-2xl transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 shadow-[0_0_15px_rgba(225,29,72,0.5)] flex items-center justify-center font-bold text-white">CS</div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white/90">
            Crimson<span className="text-rose-500">Scan</span>
          </h1>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/" className="text-gray-900 dark:text-white hover:text-rose-500 dark:hover:text-rose-400 transition-colors">Inicio</Link>
          <Link href="/catalogo" className="hover:text-gray-900 dark:hover:text-white transition-colors">Catálogo</Link>
          <Link href="/discord" className="hover:text-[#5865F2] transition-colors">Discord</Link>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-2"/>
          <ThemeToggle />
          {user && (
            <Link
              href={(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') ? '/admin' : '/uploader'}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30"
            >
              <Settings size={12}/> {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') ? 'Admin' : 'Uploader'}
            </Link>
          )}
        </nav>
        {/* Mobile: theme + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white/97 dark:bg-[#0a0a0c]/97 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-6 py-2 flex flex-col md:hidden shadow-xl">
            <Link href="/" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-900 dark:text-white hover:text-rose-500 transition border-b border-gray-100 dark:border-white/5">Inicio</Link>
            <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition border-b border-gray-100 dark:border-white/5">Catálogo</Link>
            <Link href="/discord" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-[#5865F2] transition border-b border-gray-100 dark:border-white/5">Discord</Link>
            {user && (
              <Link href={(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') ? '/admin' : '/uploader'} onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition flex items-center gap-1.5">
                <Settings size={14}/> {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') ? 'Admin' : 'Uploader'}
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex flex-col gap-12">

        {/* HERO */}
        <section className="relative w-full min-h-[60vh] md:h-[60vh] md:min-h-[500px] flex items-center">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img src="/portada.jpg" alt="Hero Background" className="w-full h-full object-cover opacity-20 blur-sm scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0a0a0c] via-slate-50/50 dark:via-black/50 to-transparent"/>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-[#0a0a0c] via-slate-50/80 dark:via-[#0a0a0c]/80 to-transparent"/>
          </div>
          <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-8 py-10 md:py-0">
            <div className="flex-1 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest w-fit">
                <Sparkles size={14}/> Nueva Licencia
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-500">
                Solo Leveling: <br/> <span className="text-rose-500">Ragnarok</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                El legado continúa. Sung Suho debe despertar sus poderes dormidos para enfrentar a
                los Monstruos Exteriores y salvar nuestro mundo.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Link href="/manga/reader/1"
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-full shadow-[0_10px_25px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_30px_rgba(225,29,72,0.5)] transition-all hover:-translate-y-1">
                  Continuar Viñeta <ArrowRight size={20}/>
                </Link>
              </div>
            </div>
            <div className="hidden md:block w-72 shrink-0 perspective-1000">
              <div className="rotate-y-[-10deg] rotate-x-[5deg] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-2 border-white/10 group cursor-pointer transition-all duration-500 hover:rotate-y-0 hover:rotate-x-0 hover:scale-105">
                <img src="/portada.jpg" alt="Portada principal" className="w-full h-auto aspect-[3/4] object-cover"/>
              </div>
            </div>
          </div>
        </section>

        {/* FAVORITOS */}
        {favMangas.length > 0 && (
          <section className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/5 pb-4">
              <Heart size={24} className="text-rose-500" fill="currentColor"/>
              <h3 className="text-2xl font-bold">Mis Favoritos</h3>
              <span className="text-sm text-gray-400 ml-auto">{favMangas.length} obras</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {favMangas.map((m, i) => buildCard(m, i))}
            </div>
          </section>
        )}

        {/* ÚLTIMAS ACTUALIZACIONES */}
        <section className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/5 pb-4">
            <Flame size={28} className="text-orange-500"/>
            <h3 className="text-2xl font-bold">Últimas Actualizaciones</h3>
          </div>

          {mangas.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="font-medium">Próximamente — el catálogo se está armando</p>
              <p className="text-sm mt-1">Seguí nuestro Discord para las novedades</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {mangas.map((m, i) => buildCard(m, i))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
