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
  { name: 'Tendencias', href: '/tendencias', icon: Flame, badge: 'Próximamente', disabled: true },
  { name: 'Novedades', href: '/novedades', icon: Sparkles, badge: 'Próximamente', disabled: true },
  { name: 'Calendario', href: '/calendario', icon: Calendar, badge: 'Próximamente', disabled: true },
  { name: 'Ranking', href: '/ranking', icon: Trophy, badge: 'Próximamente', disabled: true },
  { name: 'Géneros', href: '/generos', icon: LayoutList },
  { name: 'Favoritos', href: '/favoritos', icon: Heart },
  { name: 'Historial', href: '/historial', icon: Clock },
  { name: 'Lectura', href: '/lectura', icon: BookOpen, badge: 'Nuevo' },
  { name: 'Comunidad', href: '/comunidad', icon: Users, badge: 'Próximamente', disabled: true },
  { name: 'Donaciones', href: '/donaciones', icon: Coffee, badge: 'Próximamente', disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#0a0a0c] border-r border-gray-200 dark:border-white/5 flex flex-col z-50">
      {/* Logo Area */}
      <div className="p-6 shrink-0 bg-white dark:bg-[#0a0a0c] border-b border-gray-200 dark:border-white/5 mb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <div className="flex flex-col">
            <span className="text-rose-600 dark:text-rose-500 font-black text-lg tracking-tight uppercase leading-none">Crimson Scan</span>
            <span className="text-gray-500 dark:text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Tu mundo, tus historias.</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto min-h-0 px-4 pb-8 flex flex-col gap-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          if ((item as any).disabled) {
            return (
              <div 
                key={item.name} 
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 opacity-60 cursor-not-allowed text-gray-400 dark:text-gray-500 font-medium"
              >
                <Icon size={18} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-rose-50 dark:bg-gradient-to-r dark:from-rose-500/20 dark:to-transparent text-rose-600 dark:text-rose-500 font-bold' 
                  : (item as any).isAdult
                    ? 'text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-white/5'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 font-medium'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-rose-600 dark:text-rose-500' : (item as any).isAdult ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'} />
              <span className="text-sm">{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-rose-600 dark:bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap">
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
