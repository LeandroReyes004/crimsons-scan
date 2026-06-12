'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Settings, Menu, X, Heart, LogIn, LogOut, User, TrendingUp, Clock, ChevronLeft, ChevronRight, UserCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getUser, login, logout, refreshUser, checkVersion } from '@/lib/auth';
import { useFavorites } from '@/lib/favorites';
import AdPopUnder from '@/components/AdPopUnder';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const STORAGE_KEY = 'cs_age_confirmed';

interface Manga {
  id: string; slug?: string | null; titulo: string; generos: string; estado: string; tipo: string;
  views_total: number; cover_r2_key: string | null; fecha_actualizacion: string;
  ultimo_capitulo: number | null; ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null;
  descripcion?: string | null; scan_id?: string | null;
}

function MangaRow({ title, icon, mangas, buildCard }: {
  title: string; icon: React.ReactNode; mangas: Manga[];
  buildCard: (m: Manga, i: number) => React.ReactNode;
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
        {mangas.map((m, i) => (
          <div key={m.id} className="w-[160px] md:w-[180px] shrink-0 snap-start">
            {buildCard(m, i)}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdultoPage() {
  const [confirmed, setConfirmed]           = useState<boolean | null>(null);
  const [user, setUser]                     = useState<ReturnType<typeof getUser>>(null);
  const [mangas, setMangas]                 = useState<Manga[]>([]);
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const dropdownRef                         = useRef<HTMLDivElement>(null);
  const [loginOpen, setLoginOpen]           = useState(false);
  const [loginUser, setLoginUser]           = useState('');
  const [loginPass, setLoginPass]           = useState('');
  const [loginErr, setLoginErr]             = useState('');
  const [loginLoading, setLoginLoading]     = useState(false);
  const { favorites, toggle, isFav }        = useFavorites();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(''); setLoginLoading(true);
    try {
      const u = await login(loginUser, loginPass);
      setUser(u); setLoginOpen(false); setLoginUser(''); setLoginPass('');
    } catch (err: any) { setLoginErr(err.message || 'Error al iniciar sesión'); }
    finally { setLoginLoading(false); }
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
    setConfirmed(localStorage.getItem(STORAGE_KEY) === '1');
    checkVersion();
    setUser(getUser());
    refreshUser().then(u => { if (u) setUser(u); });
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    fetch(`${API_URL}/api/mangas/adulto`)
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []))
      .catch(() => {});
  }, [confirmed]);

  const favMangas  = mangas.filter(m => favorites.includes(m.id));
  const featured   = mangas.length > 0 ? [...mangas].sort((a, b) => b.views_total - a.views_total)[0] : null;
  const masLeidos  = useMemo(() => [...mangas].sort((a, b) => b.views_total - a.views_total).slice(0, 20), [mangas]);
  const recientes  = useMemo(() => [...mangas].slice(0, 20), [mangas]);
  const featuredCover = featured?.cover_r2_key ? `${API_URL}/api/cover/${featured.id}` : null;

  const buildCard = (m: Manga, i: number) => {
    let tags: string[] = [];
    try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
    return (
      <MangaCard
        key={m.id}
        id={m.id}
        slug={m.slug}
        title={m.titulo}
        imageUrl={m.cover_r2_key ? `${API_URL}/api/cover/${m.id}` : '/portada.jpg'}
        chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
        chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : null}
        updatedAt={m.ultimo_cap_fecha}
        tags={tags}
        isHot={m.views_total > 500}
        isFav={isFav(m.id)}
        onToggleFav={toggle}
      />
    );
  };

  if (confirmed === null) return null;

  return (
    <>
    {confirmed && <AdPopUnder />}
    <div className="min-h-screen pb-20 overflow-x-hidden">

      {/* Header — idéntico a home */}
      <header className="sticky top-0 z-50 relative bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 py-4 px-6 md:px-12 flex items-center justify-between shadow-sm dark:shadow-2xl transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CrimsonScan" className="h-10 w-auto object-contain" />
          </Link>
          <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">+18</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Inicio</Link>
          <Link href="/catalogo" className="hover:text-gray-900 dark:hover:text-white transition-colors">Catálogo</Link>
          <Link href="/comunidad" className="hover:text-gray-900 dark:hover:text-white transition-colors">Comunidad</Link>
          <Link href="/adulto" className="flex items-center gap-1 bg-rose-500/10 text-rose-500 font-semibold px-3 py-1 rounded-full text-xs border border-rose-500/20">+18</Link>
          <Link href="https://discord.gg/E4DwZNMYDq" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#5865F2] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Discord
          </Link>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-2"/>
          <ThemeToggle />
          {confirmed && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <ShieldCheck size={12}/> Verificado
            </span>
          )}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(o => !o)} className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-rose-600/60 to-orange-500/60 flex items-center justify-center shrink-0 relative">
                  <img src={`${API_URL}/api/avatar/${user.id}`} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }}/>
                  <span className="absolute text-[10px] font-black text-white">{(user.display_name || user.username).charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{user.display_name || user.username}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl py-1 z-50">
                  <Link href="/perfil" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <UserCircle size={15} className="text-gray-400"/> Mi Perfil
                  </Link>
                  {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') && (
                    <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                      <Settings size={15} className="text-gray-400"/> Admin
                    </Link>
                  )}
                  <div className="h-px bg-gray-100 dark:bg-white/5 mx-3 my-1"/>
                  <button onClick={() => { handleLogout(); setDropdownOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                    <LogOut size={15}/> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setLoginOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition px-3 py-1.5 rounded-full shadow-sm shadow-rose-600/30">
              <LogIn size={12}/> Iniciar sesión
            </button>
          )}
        </nav>
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white/97 dark:bg-[#0a0a0c]/97 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-6 py-2 flex flex-col md:hidden shadow-xl">
            <Link href="/" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition border-b border-gray-100 dark:border-white/5">Inicio</Link>
            <Link href="/catalogo" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition border-b border-gray-100 dark:border-white/5">Catálogo</Link>
            <Link href="/comunidad" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition border-b border-gray-100 dark:border-white/5">Comunidad</Link>
            <Link href="/adulto" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-rose-500 hover:text-rose-400 transition border-b border-gray-100 dark:border-white/5">+18</Link>
            {user ? (
              <>
                <div className="py-3 flex items-center gap-2 border-b border-gray-100 dark:border-white/5">
                  <User size={14} className="text-gray-400"/>
                  <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{user.username}</span>
                </div>
                {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="py-3 font-semibold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition flex items-center gap-1.5 border-b border-gray-100 dark:border-white/5">
                    <Settings size={14}/> Admin
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="py-3 font-semibold text-rose-500 hover:text-rose-400 transition flex items-center gap-1.5">
                  <LogOut size={14}/> Cerrar sesión
                </button>
              </>
            ) : (
              <button onClick={() => { setLoginOpen(true); setMobileOpen(false); }} className="py-3 font-bold text-rose-500 hover:text-rose-400 transition flex items-center gap-1.5">
                <LogIn size={14}/> Iniciar sesión
              </button>
            )}
          </div>
        )}
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
        <main className="flex flex-col gap-12">

          {/* HERO */}
          <section className="relative w-full min-h-[60vh] md:h-[60vh] md:min-h-[500px] flex items-center">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={featuredCover || '/portada.jpg'}
                alt=""
                fetchPriority="high"
                className="w-full h-full object-cover opacity-25 blur-sm scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0a0a0c] via-slate-50/50 dark:via-black/50 to-transparent"/>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-[#0a0a0c] via-slate-50/80 dark:via-[#0a0a0c]/80 to-transparent"/>
            </div>

            <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-8 py-10 md:py-0">
              {featured ? (
                <>
                  <div className="flex-1 flex flex-col gap-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={12}/> Más popular +18
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                        {featured.views_total.toLocaleString()} vistas
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter leading-[1.1] text-gray-900 dark:text-white">
                      {featured.titulo}
                    </h2>
                    {featured.descripcion ? (
                      <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed line-clamp-3">
                        {featured.descripcion}
                      </p>
                    ) : (
                      <p className="text-base text-gray-500 dark:text-gray-400 max-w-xl">
                        El proyecto +18 más leído del scan. ¡No te lo pierdas!
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                      {featured.ultimo_capitulo != null && (
                        <span className="bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-full font-semibold">Cap. {featured.ultimo_capitulo}</span>
                      )}
                      <span className="capitalize bg-gray-100 dark:bg-white/10 px-2.5 py-1 rounded-full font-semibold">{featured.tipo}</span>
                      <span className="bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-full font-semibold border border-rose-500/20">+18</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {featured.ultimo_capitulo_id ? (
                        <Link href={`/manga/reader/${featured.slug ?? featured.id}/chapter/${featured.ultimo_capitulo_id}`}
                          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-3 px-6 rounded-full shadow-[0_10px_25px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_30px_rgba(225,29,72,0.5)] transition-all hover:-translate-y-0.5 active:scale-95">
                          Leer ahora <ArrowRight size={18}/>
                        </Link>
                      ) : (
                        <Link href={`/manga/reader/${featured.slug ?? featured.id}`}
                          className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold py-3 px-6 rounded-full transition-all active:scale-95">
                          Ver obra <ArrowRight size={18}/>
                        </Link>
                      )}
                      <Link href={`/manga/reader/${featured.slug ?? featured.id}`}
                        className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors px-4 py-3">
                        Ver detalles
                      </Link>
                    </div>
                  </div>

                  <div className="hidden md:block w-64 shrink-0">
                    <Link href={`/manga/reader/${featured.slug ?? featured.id}`}
                      className="block rotate-y-[-8deg] rotate-x-[3deg] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-white/10 transition-all duration-500 hover:rotate-y-0 hover:rotate-x-0 hover:scale-105">
                      {featuredCover ? (
                        <img src={featuredCover} alt={featured.titulo} fetchPriority="high" className="w-full h-auto aspect-[3/4] object-cover"/>
                      ) : (
                        <div className="w-full aspect-[3/4] bg-gradient-to-br from-rose-900/40 to-gray-900 flex items-center justify-center">
                          <span className="text-4xl font-black text-white/20">{featured.titulo.charAt(0)}</span>
                        </div>
                      )}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col gap-5 animate-pulse">
                  <div className="w-32 h-6 bg-gray-200 dark:bg-white/10 rounded-full"/>
                  <div className="w-3/4 h-14 bg-gray-200 dark:bg-white/10 rounded-xl"/>
                  <div className="w-full h-4 bg-gray-200 dark:bg-white/10 rounded-lg"/>
                  <div className="w-36 h-12 bg-rose-200 dark:bg-rose-500/20 rounded-full mt-2"/>
                </div>
              )}
            </div>
          </section>

          {/* FAVORITOS */}
          {favMangas.length > 0 && (
            <section className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-white/5 pb-4">
                <Heart size={24} className="text-rose-500" fill="currentColor"/>
                <h3 className="text-2xl font-bold">Mis Favoritos +18</h3>
                <span className="text-sm text-gray-400 ml-auto">{favMangas.length} obras</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {favMangas.map((m, i) => buildCard(m, i))}
              </div>
            </section>
          )}

          {mangas.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Flame size={40} className="mb-3 opacity-20"/>
              <p className="font-medium">No hay contenido +18 publicado aún</p>
            </div>
          ) : (
            <>
              <MangaRow
                title="Más Leídos"
                icon={<TrendingUp size={20} className="text-rose-500"/>}
                mangas={masLeidos}
                buildCard={buildCard}
              />
              <MangaRow
                title="Recién Actualizados"
                icon={<Clock size={20} className="text-sky-400"/>}
                mangas={recientes}
                buildCard={buildCard}
              />
            </>
          )}

        </main>
      )}

      {/* Modal login */}
      {loginOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
          <div className="bg-white dark:bg-[#111114] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-white/10">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mb-5">Ingresá con tu cuenta de Crimson Scan</p>
            {loginErr && <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">{loginErr}</div>}
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input value={loginUser} onChange={e => setLoginUser(e.target.value)} required placeholder="Usuario" autoComplete="username"
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required placeholder="Contraseña" autoComplete="current-password"
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
              <div className="flex gap-2 mt-1">
                <button type="submit" disabled={loginLoading} className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setLoginOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
