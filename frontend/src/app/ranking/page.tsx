'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, TrendingDown, Play, Flame } from 'lucide-react';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  generos?: string;
  views_total: number; 
  cover_r2_key: string | null; 
  ultimo_capitulo_id: string | null; 
}

const FILTERS = ['Tendencia de hoy', 'Top Semanal', 'Top Mensual', 'Histórico'];

export default function RankingPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [activeFilter, setActiveFilter] = useState('Histórico');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`)
      .then(r => r.json())
      .then(d => {
        // Ordenar por vistas totales de mayor a menor para el ranking
        const sorted = (d.mangas || []).sort((a: Manga, b: Manga) => (b.views_total || 0) - (a.views_total || 0));
        setMangas(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Simulación de cambios según filtro para dar dinamismo a la demo
  const getRankedMangas = () => {
    if (activeFilter === 'Histórico') return mangas;
    // Mezcla determinista ligera basada en la longitud del filtro para simular cambios
    return [...mangas].sort((a, b) => {
      const vA = a.views_total + (a.id.charCodeAt(0) * activeFilter.length * 100);
      const vB = b.views_total + (b.id.charCodeAt(0) * activeFilter.length * 100);
      return vB - vA;
    });
  };

  const rankedMangas = getRankedMangas();
  const top3 = rankedMangas.slice(0, 3);
  const rest = rankedMangas.slice(3, 50); // Mostrar hasta el top 50

  // Generador de tendencias simuladas (▲ o ▼)
  const getTrend = (id: string, index: number) => {
    const hash = id.charCodeAt(id.length - 1) + index;
    if (hash % 3 === 0) return { type: 'down', val: Math.floor(hash % 4) + 1 };
    if (hash % 2 === 0) return { type: 'up', val: Math.floor(hash % 5) + 1 };
    return { type: 'same', val: 0 };
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  // Componente de Tarjeta de Podio
  const PodiumCard = ({ manga, rank }: { manga: Manga, rank: number }) => {
    const coverUrl = manga.cover_r2_key ? `${API_URL}/api/cover/${manga.id}` : '/portada.jpg';
    
    // Configuración según el puesto
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;
    
    const colors = isGold 
      ? { badge: 'from-yellow-400 to-amber-600', shadow: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]', border: 'border-yellow-500/50', size: 'h-80 md:h-96 scale-100 z-30' }
      : isSilver
      ? { badge: 'from-gray-300 to-gray-500', shadow: 'shadow-[0_0_20px_rgba(156,163,175,0.3)]', border: 'border-gray-400/50', size: 'h-64 md:h-72 scale-95 opacity-90 hover:opacity-100 z-20 mt-8 md:mt-12' }
      : { badge: 'from-amber-700 to-amber-900', shadow: 'shadow-[0_0_20px_rgba(180,83,9,0.3)]', border: 'border-amber-700/50', size: 'h-56 md:h-64 scale-90 opacity-80 hover:opacity-100 z-10 mt-12 md:mt-20' };

    return (
      <Link 
        href={manga.ultimo_capitulo_id ? `/manga/reader/${manga.slug ?? manga.id}/chapter/${manga.ultimo_capitulo_id}` : `/manga/reader/${manga.slug ?? manga.id}`}
        className={`relative w-full max-w-[280px] rounded-2xl overflow-hidden transition-all duration-500 group flex flex-col justify-end bg-black ${colors.size} ${colors.shadow} border ${colors.border}`}
      >
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${coverUrl}')` }} />
        </div>
        
        {/* Número Gigante Difuminado detrás */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none">
          <span className={`text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-b ${colors.badge} mix-blend-overlay`}>
            {rank}
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/60 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90" />
        
        <div className="relative z-20 p-4 flex flex-col items-center text-center gap-1">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.badge} text-white font-black text-xl flex items-center justify-center mb-2 shadow-lg border border-white/20`}>
            {rank}
          </div>
          <h3 className="text-white font-black text-lg leading-tight line-clamp-2 drop-shadow-md">{manga.titulo}</h3>
          <div className="flex items-center gap-1 text-rose-400 font-bold text-sm bg-black/40 px-3 py-1 rounded-full border border-rose-500/20 backdrop-blur-md">
            <Flame size={14} fill="currentColor" />
            {(manga.views_total || 0).toLocaleString()}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-hidden pb-20">
      
      {/* Fondo del Podio */}
      <div className="absolute top-0 left-0 right-0 h-[600px] z-0 pointer-events-none overflow-hidden">
        {top3[0] && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-110 blur-2xl"
            style={{ backgroundImage: `url('${top3[0].cover_r2_key ? `${API_URL}/api/cover/${top3[0].id}` : '/portada.jpg'}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#0a0a0c]/80 to-[#050505] z-10" />
      </div>

      <div className="relative z-20 max-w-[1200px] mx-auto w-full px-4 md:px-8 pt-12 flex flex-col gap-10">
        
        {/* Cabecera */}
        <header className="flex flex-col items-center text-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg flex items-center gap-4">
              <Trophy className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" size={48} />
              El <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Podio</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm md:text-lg">Las obras más leídas y aclamadas por la comunidad.</p>
          </div>

          {/* Filtros Contextuales (Píldoras) */}
          <div className="flex flex-wrap justify-center gap-2">
            {FILTERS.map(f => {
              const isActive = activeFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </header>

        {loading ? (
          <div className="w-full flex items-center justify-center min-h-[400px]">
             <div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* El Podio Visual (Top 3) */}
            <div className="flex flex-row items-end justify-center gap-2 md:gap-6 lg:gap-10 pb-10 border-b border-white/5">
              {top3[1] && <div className="flex-1 flex justify-end"><PodiumCard manga={top3[1]} rank={2} /></div>}
              {top3[0] && <div className="flex-none"><PodiumCard manga={top3[0]} rank={1} /></div>}
              {top3[2] && <div className="flex-1 flex justify-start"><PodiumCard manga={top3[2]} rank={3} /></div>}
            </div>

            {/* Lista Dinámica (Puestos 4+) */}
            <div className="flex flex-col gap-3">
              {rest.map((manga, idx) => {
                const realRank = idx + 4;
                const trend = getTrend(manga.id, realRank);
                const coverUrl = manga.cover_r2_key ? `${API_URL}/api/cover/${manga.id}` : '/portada.jpg';
                
                let tags: string[] = [];
                try {
                  if (manga.generos) tags = JSON.parse(manga.generos).slice(0, 3);
                } catch (e) {}

                return (
                  <Link 
                    key={manga.id}
                    href={manga.ultimo_capitulo_id ? `/manga/reader/${manga.slug ?? manga.id}/chapter/${manga.ultimo_capitulo_id}` : `/manga/reader/${manga.slug ?? manga.id}`}
                    className="group relative flex items-center gap-4 p-3 pr-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300"
                  >
                    {/* Número y Tendencia */}
                    <div className="flex flex-col items-center justify-center w-12 md:w-16 shrink-0">
                      <span className="text-2xl md:text-3xl font-black text-gray-500 group-hover:text-white transition-colors">
                        {realRank}
                      </span>
                      {trend.type === 'up' && <span className="flex items-center text-[10px] font-bold text-emerald-500"><TrendingUp size={12} className="mr-0.5" />{trend.val}</span>}
                      {trend.type === 'down' && <span className="flex items-center text-[10px] font-bold text-rose-500"><TrendingDown size={12} className="mr-0.5" />{trend.val}</span>}
                      {trend.type === 'same' && <span className="flex items-center text-[10px] font-bold text-gray-600">-</span>}
                    </div>

                    {/* Portada Miniatura */}
                    <div className="w-16 h-20 md:w-20 md:h-14 rounded-lg overflow-hidden shrink-0 shadow-md relative">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${coverUrl}')` }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h3 className="text-white font-bold text-sm md:text-base truncate group-hover:text-rose-400 transition-colors">
                        {manga.titulo}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-rose-500 text-xs font-bold flex items-center">
                          <Flame size={12} className="mr-1" /> {(manga.views_total || 0).toLocaleString()}
                        </span>
                        {tags.map(tag => (
                          <span key={tag} className="hidden md:inline-block text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CTA Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0 absolute right-4 md:static">
                      <div className="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-full md:rounded-xl font-bold shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2">
                        <Play size={16} fill="currentColor" />
                        <span className="hidden md:inline text-sm">Empezar a leer</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
