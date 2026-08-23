'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Settings, Calendar, Trophy, Menu, X, Heart, LogIn, LogOut, User, TrendingUp, Clock, Sword, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import HeroCarousel from '@/components/HeroCarousel';
import { getUser, login, logout, refreshUser, checkVersion } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';

interface Manga { id: string; slug?: string | null; titulo: string; generos: string; estado: string; tipo: string; views_total: number; cover_r2_key: string | null; fecha_actualizacion: string; ultimo_capitulo: number | null; ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null; scan_id?: string | null; }

function MangaRow({ title, icon, mangas, buildCard, viewAllHref }: {
  title: string; icon: React.ReactNode; mangas: Manga[];
  buildCard: (m: Manga, i: number) => React.ReactNode; viewAllHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });
  if (mangas.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <span className="text-xs text-gray-400 font-medium">{mangas.length} proyectos</span>
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link href={viewAllHref} className="text-xs font-bold text-rose-500 hover:text-rose-400 transition flex items-center gap-1">
              Ver todo <ArrowRight size={12}/>
            </Link>
          )}
          <button onClick={() => scroll(-1)} className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-rose-500/20 text-gray-500 dark:text-gray-300 hover:text-rose-500 transition">
            <ChevronLeft size={14}/>
          </button>
          <button onClick={() => scroll(1)} className="p-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-rose-500/20 text-gray-500 dark:text-gray-300 hover:text-rose-500 transition">
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        {mangas.map((m, i) => (
          <div key={m.id} className="w-[160px] md:w-[180px] shrink-0 snap-start">
            {buildCard(m, i)}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [user, setUser]         = useState<ReturnType<typeof getUser>>(null);
  const [mangas, setMangas]     = useState<Manga[]>([]);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loginOpen, setLoginOpen]   = useState(false);
  const [loginUser, setLoginUser]   = useState('');
  const [loginPass, setLoginPass]   = useState('');
  const [loginErr, setLoginErr]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const { favorites, toggle, isFav } = useFavorites();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(''); setLoginLoading(true);
    try {
      const u = await login(loginUser, loginPass);
      setUser(u);
      setLoginOpen(false);
      setLoginUser(''); setLoginPass('');
    } catch (err: any) {
      setLoginErr(err.message || 'Error al iniciar sesión');
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => { logout(); setUser(null); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    checkVersion();
    setUser(getUser());
    refreshUser().then(u => { if (u) setUser(u); });
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`, { next: { revalidate: 60 } })
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []))
      .catch(() => {});
  }, []);

  const favMangas  = mangas.filter(m => favorites.includes(m.id));
  const featured   = mangas.length > 0
    ? [...mangas].sort((a, b) => new Date(b.fecha_actualizacion || 0).getTime() - new Date(a.fecha_actualizacion || 0).getTime())[0]
    : null;
  const masLeidos  = useMemo(() => [...mangas].sort((a, b) => b.views_total - a.views_total).slice(0, 20), [mangas]);
  const recientes  = useMemo(() => [...mangas].slice(0, 20), [mangas]);
  const delScan    = useMemo(() => mangas.filter(m => m.scan_id === 'scan-001'), [mangas]);
  const API_URL   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  const featuredCover = featured?.cover_r2_key ? `${API_URL}/api/cover/${featured.id}` : null;

  const buildCard = (m: Manga, i: number) => {
    let tags: string[] = [];
    try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    return (
      <MangaCard
        key={m.id}
        id={m.id}
        slug={m.slug}
        title={m.titulo}
        imageUrl={m.cover_r2_key ? `${API}/api/cover/${m.id}` : '/portada.jpg'}
        chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
        chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : null}
        updatedAt={m.ultimo_cap_fecha}
        tags={tags}
        status={m.estado}
        isHot={m.views_total > 1000}
        isFav={isFav(m.id)}
        onToggleFav={toggle}
      />
    );
  };

  return (
    <div className="pb-20 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Main Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-12">
          
          {/* HERO BANNER CAROUSEL */}
          <HeroCarousel mangas={mangas} />

          {/* CONTINUAR LEYENDO (Favoritos o Más Leídos) */}
          <MangaRow
            title="CONTINUAR LEYENDO"
            icon={null}
            mangas={favMangas.length > 0 ? favMangas : masLeidos.slice(0, 5)}
            buildCard={buildCard}
            viewAllHref="/catalogo"
          />

          {/* RECIÉN ACTUALIZADOS */}
          <MangaRow
            title="RECIÉN ACTUALIZADOS"
            icon={null}
            mangas={recientes}
            buildCard={buildCard}
            viewAllHref="/catalogo"
          />
        </main>

        {/* RIGHT COLUMN: Sidebar (Top 5 & Calendar) */}
        <aside className="w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col gap-6">
          
          {/* TOP 5 SEMANAL */}
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black flex items-center gap-2 text-white mb-6 tracking-widest uppercase">
              <Flame className="text-orange-500" size={16} fill="currentColor"/> TOP 5 SEMANAL
            </h3>
            
            <div className="flex flex-col gap-4">
              {masLeidos.slice(0, 5).map((m, idx) => (
                <Link key={m.id} href={`/manga/reader/${m.slug ?? m.id}`} className="flex items-center gap-4 group">
                  <span className={`text-xl font-black w-4 text-center ${idx === 0 ? 'text-rose-500' : idx === 1 ? 'text-orange-400' : idx === 2 ? 'text-amber-400' : 'text-gray-600'}`}>
                    {idx + 1}
                  </span>
                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-md">
                    <img src={m.cover_r2_key ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/cover/${m.id}` : '/portada.jpg'} alt={m.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">{m.titulo}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Sparkles size={10} className="text-yellow-500" fill="currentColor"/>
                      <span className="text-[10px] text-gray-400 font-semibold">{m.views_total >= 1000 ? (m.views_total/1000).toFixed(1) + 'K' : m.views_total}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {masLeidos.length === 0 && <p className="text-sm text-gray-500 italic">No hay datos suficientes.</p>}
            </div>
          </div>

          {/* CALENDARIO */}
          <div className="bg-[#111114] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black flex items-center gap-2 text-white mb-6 tracking-widest uppercase">
              <Calendar className="text-sky-400" size={16} fill="currentColor"/> CALENDARIO
            </h3>
            
            <div className="flex flex-col gap-3">
              {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day, idx) => {
                const m = recientes[idx % (recientes.length || 1)];
                if (!m) return null;
                return (
                  <div key={day} className="flex items-center gap-4 text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
                    <span className={`font-black w-8 text-center ${idx === 0 ? 'text-rose-500' : 'text-gray-500'}`}>{day}</span>
                    <span className="text-gray-300 font-medium truncate flex-1 group-hover:text-white transition-colors">{m.titulo}</span>
                    {m.ultimo_capitulo != null && (
                      <span className="text-gray-500 text-xs font-semibold whitespace-nowrap">Cap. {m.ultimo_capitulo}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </aside>
      </div>
      {/* Modal login */}
      {loginOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
          <div className="bg-[#111114] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <h2 className="text-lg font-extrabold text-white mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mb-5">Ingresá con tu cuenta de Crimson Scan</p>
            {loginErr && (
              <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/10 text-red-400">{loginErr}</div>
            )}
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                value={loginUser} onChange={e => setLoginUser(e.target.value)} required
                placeholder="Usuario" autoComplete="username"
                className="bg-black/30 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white focus:border-rose-500 outline-none transition"
              />
              <input
                type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required
                placeholder="Contraseña" autoComplete="current-password"
                className="bg-black/30 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white focus:border-rose-500 outline-none transition"
              />
              <div className="flex gap-2 mt-1">
                <button type="submit" disabled={loginLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setLoginOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-white/5 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>  );
}
