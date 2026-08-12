'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Calendar as CalendarIcon, Heart, Filter } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  estado: string; 
  views_total: number; 
  cover_r2_key: string | null; 
  ultimo_capitulo: number | null; 
  ultimo_capitulo_id: string | null; 
}

const TABS = ['HOY', 'MAÑANA', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO', 'SUSCRIPCIONES'];

export default function CalendarioPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [activeTab, setActiveTab] = useState('HOY');
  const [loading, setLoading] = useState(true);
  const { favorites, isFav } = useFavorites();

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`)
      .then(r => r.json())
      .then(d => {
        setMangas(d.mangas || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Lógica para distribuir mangas en los días simulando un calendario real
  const getMangasForTab = () => {
    if (activeTab === 'SUSCRIPCIONES') {
      return mangas.filter(m => isFav(m.id));
    }
    
    // Distribución por día (Simulada usando el ID para mantener consistencia)
    const dayIndex = TABS.indexOf(activeTab);
    return mangas.filter(m => {
      // Usar los números del ID para asignar un día, o usar charCode
      let sum = 0;
      for (let i = 0; i < m.id.length; i++) sum += m.id.charCodeAt(i);
      return (sum % 6) === dayIndex; // 6 días (0 a 5) excluyendo SUSCRIPCIONES
    });
  };

  const filteredMangas = getMangasForTab();
  
  // Fondo dinámico (Toma la portada del primer manga visible, o portada por defecto)
  const bgImage = filteredMangas.length > 0 && filteredMangas[0].cover_r2_key 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/cover/${filteredMangas[0].id}`
    : '/portada.jpg';

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden pb-20">
      
      {/* Fondo Inmersivo a Gran Escala */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-110 transition-all duration-1000"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
        {/* Capas de oscurecimiento y desenfoque para no distraer */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-[#0a0a0c]/80 to-[#050505] z-10" />
      </div>

      <div className="relative z-20 max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-12 flex flex-col gap-8">
        
        {/* Cabecera */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
              <CalendarIcon size={28} className="text-rose-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                Calendario de <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Estrenos</span>
              </h1>
              <p className="text-gray-400 font-medium text-sm md:text-base mt-1">Descubre los capítulos que salen esta semana.</p>
            </div>
          </div>
        </header>

        {/* Filtros Contextuales (Tabs) */}
        <div className="flex items-center overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            const isSub = tab === 'SUSCRIPCIONES';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? isSub 
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400/30'
                      : 'bg-white text-black shadow-lg shadow-white/10'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {isSub && <Heart size={14} className={isActive ? 'text-white' : 'text-rose-500'} fill={isActive ? 'currentColor' : 'none'} />}
                {tab}
              </button>
            );
          })}
        </div>

        {/* Cuadrícula Masiva de Tarjetas */}
        {loading ? (
          <div className="w-full flex items-center justify-center min-h-[400px]">
             <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
          </div>
        ) : filteredMangas.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[400px] bg-white/5 rounded-3xl border border-white/5">
            <Filter size={48} className="text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-300">No hay estrenos para este filtro</h3>
            <p className="text-gray-500 mt-2">Vuelve pronto o revisa otro día.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredMangas.map(m => {
              const coverUrl = m.cover_r2_key ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'}/api/cover/${m.id}` : '/portada.jpg';
              const fav = isFav(m.id);
              
              return (
                <Link 
                  key={m.id}
                  href={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : `/manga/reader/${m.slug ?? m.id}`}
                  className="group relative w-full aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl hover:shadow-[0_15px_40px_rgba(225,29,72,0.3)] hover:-translate-y-2 transition-all duration-500 flex flex-col justify-end"
                >
                  {/* Portada */}
                  <div className="absolute inset-0 z-0">
                    <div 
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url('${coverUrl}')` }}
                    />
                  </div>
                  
                  {/* Gradiente Inferior para texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90" />
                  
                  {/* Insignia Personalizada: De tus Seguidos */}
                  {fav && (
                    <div className="absolute top-3 left-3 z-30 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-[0_0_10px_rgba(225,29,72,0.5)] flex items-center gap-1 backdrop-blur-md">
                      <Sparkles size={10} fill="currentColor" /> DE TUS SEGUIDOS
                    </div>
                  )}

                  {/* Contenido (Título, Capítulo, Botón) */}
                  <div className="relative z-20 p-4 flex flex-col gap-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-black text-lg leading-tight line-clamp-2 drop-shadow-md group-hover:text-rose-400 transition-colors">
                      {m.titulo}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      {m.ultimo_capitulo != null ? (
                        <span className="bg-white/10 backdrop-blur-md border border-white/20 text-gray-200 text-xs font-bold px-2 py-1 rounded-lg">
                          Cap. {m.ultimo_capitulo}
                        </span>
                      ) : (
                        <span className="bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-lg">
                          PROXIMAMENTE
                        </span>
                      )}
                    </div>
                    
                    {/* Botón Ver Ahora (Visible en Hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
                      <div className="w-full bg-white text-black flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold shadow-lg">
                        <Play size={14} fill="currentColor" /> Ver ahora
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
