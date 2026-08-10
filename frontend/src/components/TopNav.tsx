'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, Moon, Sun, UserCircle, Settings, LogOut, Menu } from 'lucide-react';
import { getUser, logout } from '@/lib/auth';
import { useTheme } from 'next-themes';

export default function TopNav() {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
    <header className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-10 flex items-center justify-between">
      {/* Mobile Menu Toggle (Placeholder for future mobile sidebar toggle) */}
      <div className="md:hidden flex items-center mr-4">
        <button className="text-white">
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
            className="w-full bg-[#111114] border border-white/5 text-white text-sm rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 sm:gap-6 ml-4">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(o => !o)} className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center shrink-0 border border-white/10">
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/avatar/${user.id}`} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }}/>
                <span className="absolute text-[10px] font-black text-white">{(user.display_name || user.username).charAt(0).toUpperCase()}</span>
              </div>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-48 bg-[#151518] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-sm font-bold text-white truncate">{user.display_name || user.username}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.rol}</p>
                </div>
                <Link href="/perfil" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">
                  <UserCircle size={16} className="text-gray-400"/> Mi Perfil
                </Link>
                {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') && (
                  <Link href="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">
                    <Settings size={16} className="text-gray-400"/> Panel Admin
                  </Link>
                )}
                <div className="h-px bg-white/5 mx-4 my-2"/>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10 transition">
                  <LogOut size={16}/> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="hidden sm:flex items-center justify-center border border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white text-sm font-bold px-6 py-2 rounded-full transition-all">
            Iniciar sesión
          </Link>
        )}

        <div className="flex items-center gap-3 border-l border-white/10 pl-4 sm:pl-6">
          <button className="text-gray-400 hover:text-white transition-colors relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0a0a0c]"></span>
          </button>
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
