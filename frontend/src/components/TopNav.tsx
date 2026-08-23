'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, Moon, Sun, UserCircle, Settings, LogOut, Menu, Flame } from 'lucide-react';
import { getUser, logout } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';

export default function TopNav({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Adult mode state with persistence
  const [isAdultMode, setIsAdultMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crimson_adult_mode') === 'true';
    if (pathname === '/adulto' && !saved) {
      setIsAdultMode(true);
      localStorage.setItem('crimson_adult_mode', 'true');
    } else if (pathname === '/' && saved) {
      // Si va al inicio explícitamente, quizás quiera apagarlo, pero si queremos persistencia total,
      // solo lo apagamos si hace toggle. Por ahora respetamos el localStorage a menos que fuerce la ruta.
      setIsAdultMode(saved);
    } else {
      setIsAdultMode(saved);
    }
  }, [pathname]);

  const toggleAdultMode = () => {
    const newState = !isAdultMode;
    setIsAdultMode(newState);
    localStorage.setItem('crimson_adult_mode', String(newState));
    if (newState) {
      router.push('/adulto');
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Notificaciones ──
  const fetchNotificaciones = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/notificaciones`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('crimson_token')}` }
      });
      const data = await res.json();
      if (data.notificaciones) setNotificaciones(data.notificaciones);
    } catch(e) {}
  };

  useEffect(() => {
    if (mounted && user) {
      fetchNotificaciones();
      const interval = setInterval(fetchNotificaciones, 3 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, mounted]);

  const handleMarcarLeidas = async () => {
    if (!user || notificaciones.length === 0) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/notificaciones/marcar-leidas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('crimson_token')}` }
      });
      setNotificaciones([]);
    } catch(e) {}
  };

  // Optimize search: fetch once per mode, filter locally
  const [allMangas, setAllMangas] = useState<any[]>([]);
  const [mangasFetched, setMangasFetched] = useState(false);

  // Reset catalog if adult mode changes
  useEffect(() => {
    setMangasFetched(false);
    setAllMangas([]);
  }, [isAdultMode]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const fetchMangas = async () => {
      if (!mangasFetched) {
        setIsSearching(true);
        try {
          const endpoint = isAdultMode ? '/api/mangas/adulto' : '/api/mangas';
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}${endpoint}`, {
            cache: 'no-store'
          });
          const data = await res.json();
          setAllMangas(data.mangas || []);
          setMangasFetched(true);
        } catch (err) {
          console.error("Error fetching catalog for search:", err);
        }
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchMangas();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAdultMode, mangasFetched]);

  // Local filtering
  useEffect(() => {
    if (mangasFetched && searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      const filtered = allMangas.filter((m: any) => 
        m.titulo.toLowerCase().includes(lower) || 
        (m.generos && m.generos.toLowerCase().includes(lower))
      ).slice(0, 5); // Limit to top 5 results
      setResults(filtered);
      setShowResults(true);
    }
  }, [searchQuery, allMangas, mangasFetched]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 py-4 px-6 md:px-10 flex items-center justify-between">
      {/* Menu Toggle */}
      <div className="flex items-center mr-4">
        <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">
          <Menu size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500 group-focus-within:text-rose-500 transition-colors" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowResults(true); }}
            placeholder="Buscar manhwa, autor o género..." 
            className="w-full bg-gray-100 dark:bg-[#111114] border border-transparent dark:border-white/5 text-gray-900 dark:text-white text-sm rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600"
          />

          {/* Search Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
              {isSearching ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">Buscando...</div>
              ) : results.length > 0 ? (
                results.map(m => (
                  <Link 
                    key={m.id} 
                    href={`/manga/reader/${m.slug ?? m.id}`}
                    onClick={() => { setShowResults(false); setSearchQuery(''); }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                  >
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-gray-200 dark:bg-white/10 shrink-0">
                      <img 
                        src={m.cover_r2_key ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/cover/${m.id}` : '/portada.jpg'} 
                        alt={m.titulo} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.titulo}</span>
                      <span className="text-xs text-gray-500 capitalize">{m.tipo}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron resultados.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 sm:gap-6 ml-4">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(o => !o)} className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10">
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/avatar/${user.id}`} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }}/>
                <span className="absolute text-[10px] font-black text-white">{(user.display_name || user.username).charAt(0).toUpperCase()}</span>
              </div>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-48 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.display_name || user.username}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.rol}</p>
                </div>
                <Link href="/perfil" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition">
                  <UserCircle size={16} className="text-gray-400"/> Mi Perfil
                </Link>
                {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') && (
                  <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <Settings size={16} className="text-gray-400"/> Panel Admin
                  </Link>
                )}
                <div className="h-px bg-gray-100 dark:bg-white/5 mx-4 my-2"/>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                  <LogOut size={16}/> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="flex items-center justify-center border border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white text-xs sm:text-sm font-bold px-4 py-1.5 sm:px-6 sm:py-2 rounded-full transition-all">
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
        )}

        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-white/10 pl-4 sm:pl-6">
          {/* Adult Toggle */}
          {mounted && (
            <button 
              onClick={toggleAdultMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                isAdultMode 
                  ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
                  : 'bg-transparent text-gray-500 border-gray-300 dark:border-white/10 hover:border-rose-500/50 hover:text-rose-500'
              }`}
            >
              <Flame size={14} className={isAdultMode ? 'text-white' : 'text-rose-500'} />
              <span>+18</span>
            </button>
          )}

          {user && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  if (!notifOpen) {
                    setNotifOpen(true);
                    handleMarcarLeidas();
                  } else {
                    setNotifOpen(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative"
              >
                <Bell size={20} />
                {notificaciones.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-[#0a0a0c] text-[9px] font-bold text-white flex items-center justify-center">
                    {notificaciones.length > 9 ? '9+' : notificaciones.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 max-h-96 overflow-y-auto bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1 flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</p>
                  </div>
                  {notificaciones.length > 0 ? (
                    notificaciones.map(n => (
                      <Link 
                        key={n.id} 
                        href={n.url}
                        onClick={() => setNotifOpen(false)}
                        className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition border-b border-gray-50 dark:border-white/5 last:border-0"
                      >
                        <p className="text-sm text-gray-900 dark:text-gray-200">{n.mensaje}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      No hay notificaciones nuevas
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
