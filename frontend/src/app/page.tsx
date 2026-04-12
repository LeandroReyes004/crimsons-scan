'use client';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import AdminPanel from '@/components/AdminPanel';

export default function Home() {
  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Panel de Login/Admin para el Scan */}
      <AdminPanel />

      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 py-4 px-6 md:px-12 flex items-center justify-between shadow-sm dark:shadow-2xl transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 shadow-[0_0_15px_rgba(225,29,72,0.5)] flex items-center justify-center font-bold text-white">
            CS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white/90">
            Crimson<span className="text-rose-500">Scan</span>
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          <Link href="/" className="text-gray-900 dark:text-white hover:text-rose-500 dark:hover:text-rose-400 transition-colors">Inicio</Link>
          <Link href="/catalogo" className="hover:text-gray-900 dark:hover:text-white transition-colors">Catálogo</Link>
          <Link href="/discord" className="hover:text-[#5865F2] transition-colors">Discord</Link>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-2"></div>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex flex-col gap-12">
        {/* HERO BANNER SECTION */}
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center">
          {/* Fondo desenfocado del banner */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src="/portada.jpg" 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-20 blur-sm scale-105"
            />
            {/* Gradiente para fundir el hero con el fondo negro de la página */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0a0a0c] via-slate-50/50 dark:via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-[#0a0a0c] via-slate-50/80 dark:via-[#0a0a0c]/80 to-transparent"></div>
          </div>

          <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-10">
            {/* Info del Proyecto Destacado */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest w-fit">
                <Sparkles size={14} /> Nueva Licencia
              </div>
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-500">
                Solo Leveling: <br/> <span className="text-rose-500">Ragnarok</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                El legado continúa. Sung Suho debe despertar sus poderes dormidos para enfrentar a 
                los Monstruos Exteriores y salvar nuestro mundo. Acompaña al Crimson Scan en este gran estreno.
              </p>
              
              <div className="flex items-center gap-4 mt-2">
                <Link 
                  href="/manga/reader/1" 
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-4 px-8 rounded-full shadow-[0_10px_25px_rgba(225,29,72,0.3)] dark:shadow-[0_10px_25px_rgba(225,29,72,0.4)] hover:shadow-[0_15px_30px_rgba(225,29,72,0.5)] transition-all hover:-translate-y-1"
                >
                  Continuar Viñeta <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Main Cover Stand */}
            <div className="hidden md:block w-72 shrink-0 perspective-1000">
              <div className="rotate-y-[-10deg] rotate-x-[5deg] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-2 border-white/10 group cursor-pointer transition-all duration-500 hover:rotate-y-0 hover:rotate-x-0 hover:scale-105">
                <img 
                  src="/portada.jpg" 
                  alt="Portada principal" 
                  className="w-full h-auto aspect-[3/4] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* LATEST UPDATES SECTION */}
        <section className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Flame size={28} className="text-orange-500" />
            <h3 className="text-2xl font-bold">Últimas Actualizaciones</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <MangaCard 
              id="1"
              title="Tu Manga Subido" 
              imageUrl="/portada.jpg" 
              chapter="01" 
              tags={['Acción', 'Fantasía']} 
              isHot={true}
            />
            {/* Tarjetas Relleno Simuladas */}
            <MangaCard 
              id="2"
              title="Demon Lord Origin" 
              imageUrl="https://picsum.photos/400/600?random=1" 
              chapter="55" 
              tags={['Seinen', 'Magia']} 
            />
            <MangaCard 
              id="3"
              title="I Reincarnated as a Slime" 
              imageUrl="https://picsum.photos/400/600?random=2" 
              chapter="112" 
              tags={['Isekai']} 
            />
            <MangaCard 
              id="4"
              title="The Beginning After The End" 
              imageUrl="https://picsum.photos/400/600?random=3" 
              chapter="175" 
              tags={['Aventura', 'Webcomic']} 
            />
            <MangaCard 
              id="5"
              title="Omniscient Reader" 
              imageUrl="https://picsum.photos/400/600?random=4" 
              chapter="189" 
              tags={['Supervivencia']} 
              isHot={true}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
