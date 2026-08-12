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
  { divider: true, key: 'div-1' },
  { name: 'Tendencias', href: '/tendencias', icon: Flame, badge: 'Próximamente', disabled: true },
  { name: 'Novedades', href: '/novedades', icon: Sparkles, badge: 'Próximamente', disabled: true },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
  { name: 'Ranking', href: '/ranking', icon: Trophy },
  { name: 'Géneros', href: '/generos', icon: LayoutList },
  { divider: true, key: 'div-2' },
  { name: 'Favoritos', href: '/favoritos', icon: Heart, badge: 'Próximamente', disabled: true },
  { name: 'Historial', href: '/historial', icon: Clock, badge: 'Próximamente', disabled: true },
  { name: 'Lectura', href: '/lectura', icon: BookOpen, badge: 'Nuevo' },
  { divider: true, key: 'div-3' },
  { name: 'Comunidad', href: '/comunidad', icon: Users, badge: 'Próximamente', disabled: true },
  { name: 'Donaciones', href: '/donaciones', icon: Coffee, badge: 'Próximamente', disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 flex flex-col z-50 shadow-2xl">
      {/* Logo Area */}
      <div className="p-6 shrink-0 bg-transparent border-b border-gray-200 dark:border-white/5 mb-2 flex items-center justify-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(225,29,72,0.4)] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-rose-600 dark:text-rose-500 font-black text-xl tracking-tighter uppercase leading-none drop-shadow-md">Crimson Scan</span>
            <span className="text-gray-500 dark:text-gray-400 text-[9px] uppercase font-bold tracking-[0.2em] mt-0.5">Tu mundo, tus historias.</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto min-h-0 px-3 pb-8 flex flex-col gap-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {MENU_ITEMS.map((item, index) => {
          if (item.divider) {
            return <div key={item.key || `div-${index}`} className="h-px bg-gray-200 dark:bg-white/5 my-3 mx-2" />;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon!;

          if (item.disabled) {
            return (
              <div 
                key={item.name} 
                className="group flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl transition-all duration-300 cursor-not-allowed"
              >
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5">
                  <Icon size={16} className="text-gray-400 dark:text-gray-600" />
                </div>
                <span className="text-sm font-semibold text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-500 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link 
              key={item.name} 
              href={item.href!}
              className={`group flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl transition-all duration-300 relative ${
                isActive 
                  ? 'bg-rose-50 dark:bg-gradient-to-r dark:from-rose-500/10 dark:to-transparent' 
                  : 'hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-500 rounded-r-full shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
              )}
              
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/10 group-hover:text-gray-900 dark:group-hover:text-white border border-transparent dark:border-white/5'
              }`}>
                <Icon size={16} className={isActive ? 'drop-shadow-md' : ''} />
              </div>

              <span className={`text-sm font-semibold transition-colors duration-300 ${
                isActive ? 'text-rose-600 dark:text-white drop-shadow-md' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
              }`}>
                {item.name}
              </span>
              
              {item.badge && (
                <span className={`ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap shadow-sm transition-all duration-300 ${
                  item.badge.toLowerCase() === 'nuevo' 
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)] border border-rose-500/50' 
                    : 'bg-rose-600 dark:bg-rose-500 text-white'
                }`}>
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
