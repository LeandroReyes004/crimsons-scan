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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAdultMode = pathname === '/adulto';
  
  const toggleAdultMode = () => {
    if (isAdultMode) {
      router.push('/');
    } else {
      router.push('/adulto');
    }
  };

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-500 group-focus-within:text-rose-500 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar manhwa, autor o género..." 
            className="w-full bg-gray-100 dark:bg-[#111114] border border-transparent dark:border-white/5 text-gray-900 dark:text-white text-sm rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-600"
          />
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

          <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0a0a0c]"></span>
          </button>
          
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
