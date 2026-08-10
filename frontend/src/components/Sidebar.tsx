'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Compass, Flame, Sparkles, Calendar, Trophy, 
  LayoutList, Heart, Clock, BookOpen, Users, Coffee
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Explorar', href: '/catalogo', icon: Compass },
  { name: 'Tendencias', href: '/tendencias', icon: Flame },
  { name: 'Novedades', href: '/novedades', icon: Sparkles },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
  { name: 'Ranking', href: '/ranking', icon: Trophy },
  { name: 'Géneros', href: '/generos', icon: LayoutList },
  { name: 'Favoritos', href: '/favoritos', icon: Heart },
  { name: 'Historial', href: '/historial', icon: Clock },
  { name: 'Lectura', href: '/lectura', icon: BookOpen, badge: 'Nuevo' },
  { name: 'Comunidad', href: '/comunidad', icon: Users },
  { name: 'Donaciones', href: '/donaciones', icon: Coffee },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-[#0a0a0c] border-r border-white/5 flex flex-col z-50 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
      {/* Logo Area */}
      <div className="p-6 sticky top-0 bg-[#0a0a0c] z-10 border-b border-white/5 mb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <div className="flex flex-col">
            <span className="text-rose-500 font-black text-lg tracking-tight uppercase leading-none">Crimson Scan</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Tu mundo, tus historias.</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-8 flex flex-col gap-1.5">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-rose-500/20 to-transparent text-rose-500 font-bold' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-rose-500' : 'text-gray-500'} />
              <span className="text-sm">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
