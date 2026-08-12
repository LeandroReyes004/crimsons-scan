'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Play, Clock, LogIn } from 'lucide-react';

interface MangaReal { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  tipo: string;
  cover_r2_key: string | null; 
  ultimo_capitulo_id: string | null; 
  es_adulto?: number | boolean;
  // Opcionales del historial
  capitulo_numero?: number;
  leido_en?: string;
  // Opcionales de marcadores
  guardado_el?: string;
}

interface FavoritosClientProps {
  isAdult: boolean;
}

export default function FavoritosClient({ isAdult }: FavoritosClientProps) {
  const [activeTab, setActiveTab] = useState<'marcadores' | 'historial'>('marcadores');
  const [data, setData] = useState<MangaReal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  useEffect(() => {
    // Comprobar autenticación
    const token = typeof window !== 'undefined' ? localStorage.getItem('crimson_token') : null;
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    
    setIsAuthenticated(true);
    setLoading(true);

    const endpoint = activeTab === 'marcadores' ? '/api/marcadores' : '/api/historial';

    fetch(`${API}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(r => {
        if (!r.ok) {
          if (r.status === 401) {
            localStorage.removeItem('crimson_token');
            setIsAuthenticated(false);
          }
          throw new Error('No autorizado');
        }
        return r.json();
      })
      .then(d => {
        const rawData: MangaReal[] = activeTab === 'marcadores' ? (d.marcadores || []) : (d.historial || []);
        
        // Filtro estricto de mundos
        const filtered = rawData.filter(m => {
          const isMangaAdult = m.es_adulto === 1 || m.es_adulto === true;
          return isAdult ? isMangaAdult : !isMangaAdult;
        });

        setData(filtered);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [activeTab, API, isAdult]);

  return (
    <div className={`min-h-screen w-full overflow-hidden pb-24 ${isAdult ? 'bg-[#0f0505]' : 'bg-[#050505]'}`}>
      
      {/* Cabecera Principal */}
      <div className={`relative w-full pt-16 pb-8 px-4 md:px-8 border-b ${isAdult ? 'bg-black/90 border-rose-900/30' : 'bg-black border-white/5'}`}>
        <div className={`absolute inset-0 z-0 bg-gradient-to-b ${isAdult ? 'from-rose-900/20' : 'from-rose-900/10'} to-transparent pointer-events-none`} />
        <div className="relative z-10 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg flex items-center gap-4">
              <Heart className="text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" size={40} fill="currentColor" />
              Tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Biblioteca {isAdult && '+18'}</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm md:text-base">
              {isAdult 
                ? 'Tu colección privada de obras para adultos. Solo para tus ojos.'
                : 'Tu colección personal. Solo lo que lees y te gusta.'}
            </p>
          </div>

          {/* Pestañas Reales */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('marcadores')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shrink-0 border ${
                activeTab === 'marcadores'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.2)]'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Heart size={18} className={activeTab === 'marcadores' ? "text-rose-500" : "text-gray-500"} />
              Me Gustan
              {activeTab === 'marcadores' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-rose-500 rounded-t-full shadow-[0_0_10px_rgba(225,29,72,1)]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shrink-0 border ${
                activeTab === 'historial'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.2)]'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Clock size={18} className={activeTab === 'historial' ? "text-rose-500" : "text-gray-500"} />
              Historial de Lectura
              {activeTab === 'historial' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-rose-500 rounded-t-full shadow-[0_0_10px_rgba(225,29,72,1)]" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-10">
        {!isAuthenticated ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[400px] text-gray-500 bg-white/5 rounded-3xl border border-white/5 p-8 text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
              <Heart size={40} className="text-rose-500 opacity-80" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Conecta tu cuenta</h2>
            <p className="text-gray-400 max-w-md mb-8">
              Para guardar tus mangas favoritos y tener un historial de por qué capítulo vas, necesitas iniciar sesión.
            </p>
            <Link 
              href="/login" 
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full font-bold transition-colors"
            >
              <LogIn size={20} />
              Iniciar Sesión o Registrarse
            </Link>
          </div>
        ) : loading ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
             <div className="relative w-16 h-16 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                <Heart size={20} className="text-rose-500 animate-pulse" fill="currentColor" />
             </div>
             <h2 className="text-xl font-bold text-white mb-2">Sincronizando con tu cuenta...</h2>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[300px] text-gray-500 bg-white/5 rounded-3xl border border-white/5">
            {activeTab === 'marcadores' ? <Heart size={48} className="mb-4 opacity-50" /> : <Clock size={48} className="mb-4 opacity-50" />}
            <p className="text-xl font-bold text-gray-300">
              {activeTab === 'marcadores' ? 'Aún no tienes obras aquí' : 'Aún no has leído nada en esta sección'}
            </p>
            <p className="text-sm mt-1">
              {isAdult ? 'Explora el catálogo +18 para añadir historias a tu biblioteca privada.' : 'Explora el catálogo normal para añadir historias a tu biblioteca.'}
            </p>
            <Link href={isAdult ? "/adulto" : "/catalogo"} className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-semibold transition-colors">
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 md:gap-6">
            {data.map(manga => {
              const coverUrl = manga.cover_r2_key ? `${API}/api/cover/${manga.id}` : '/portada.jpg';
              
              // Si estamos en historial, el link va directo al capítulo que leyó
              const linkUrl = (activeTab === 'historial' && manga.ultimo_capitulo_id)
                ? `/manga/reader/${manga.slug ?? manga.id}/chapter/${manga.ultimo_capitulo_id}` 
                : `/manga/reader/${manga.slug ?? manga.id}`;
              
              return (
                <Link 
                  key={manga.id + (manga.capitulo_numero || '')}
                  href={linkUrl}
                  className="group relative flex flex-col w-full aspect-[2/3] rounded-2xl overflow-hidden bg-black border border-white/5 hover:border-rose-500/50 hover:shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                >
                  {/* Imagen de Fondo */}
                  <div className="absolute inset-0 z-0">
                    <div 
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${coverUrl}')` }}
                    />
                  </div>
                  
                  {/* Etiqueta de Tipo Real */}
                  <div className="absolute top-2 left-2 z-30 flex gap-1">
                    <span className="bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-md">
                      {manga.tipo}
                    </span>
                    {isAdult && (
                      <span className="bg-rose-600/80 backdrop-blur-sm border border-rose-400/30 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-md">
                        +18
                      </span>
                    )}
                  </div>

                  {/* Gradiente Oscuro Base */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                  {/* Overlay Oscuro para Hover (para el botón Play) */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 z-20 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-2 transform scale-50 group-hover:scale-100 transition-all duration-500 delay-75">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.8)] border border-rose-400">
                        <Play size={24} fill="currentColor" className="text-white ml-1" />
                      </div>
                    </div>
                    <span className="text-white font-black text-sm uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-150 drop-shadow-md">
                      {activeTab === 'historial' ? 'Continuar' : 'Leer'}
                    </span>
                  </div>
                  
                  {/* Información Inferior (Título y Capítulo Real) */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pt-10 flex flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md group-hover:-translate-y-1 transition-transform duration-300">
                      {manga.titulo}
                    </h3>
                    {activeTab === 'historial' && manga.capitulo_numero ? (
                      <span className="text-rose-400 text-xs font-bold mt-1.5 group-hover:-translate-y-1 transition-transform duration-300">
                        Visto: Cap. {manga.capitulo_numero}
                      </span>
                    ) : null}
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
