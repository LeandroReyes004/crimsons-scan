'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutList, Search } from 'lucide-react';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  generos?: string;
  views_total: number; 
  cover_r2_key: string | null; 
}

interface GenreData {
  name: string;
  count: number;
  bgManga: Manga;
}

export default function GenerosPage() {
  const [genres, setGenres] = useState<GenreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
    fetch(`${API}/api/mangas`)
      .then(r => r.json())
      .then(d => {
        const allMangas: Manga[] = d.mangas || [];
        
        // Extraer géneros y mapear al mejor manga representativo
        const genreMap = new Map<string, { count: number, bestManga: Manga }>();
        
        allMangas.forEach(manga => {
          if (manga.generos) {
            try {
              const tags: string[] = JSON.parse(manga.generos);
              tags.forEach(tag => {
                const cleanTag = tag.trim().toUpperCase();
                if (!cleanTag) return;
                
                if (!genreMap.has(cleanTag)) {
                  genreMap.set(cleanTag, { count: 1, bestManga: manga });
                } else {
                  const current = genreMap.get(cleanTag)!;
                  current.count += 1;
                  // Si este manga tiene más vistas, lo usamos como portada del género
                  if ((manga.views_total || 0) > (current.bestManga.views_total || 0)) {
                    current.bestManga = manga;
                  }
                  genreMap.set(cleanTag, current);
                }
              });
            } catch (e) {}
          }
        });

        const parsedGenres: GenreData[] = Array.from(genreMap.entries())
          .map(([name, data]) => ({
            name,
            count: data.count,
            bgManga: data.bestManga
          }))
          // Ordenar alfabéticamente o por cantidad
          .sort((a, b) => b.count - a.count);

        setGenres(parsedGenres);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  const filteredGenres = genres.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen w-full bg-[#050505] overflow-hidden pb-24">
      
      {/* Cabecera Principal */}
      <div className="relative w-full pt-16 pb-12 px-4 md:px-8 bg-black border-b border-white/5">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-rose-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg flex items-center gap-4">
              <LayoutList className="text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" size={48} />
              Explorar <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">Géneros</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm md:text-lg">Descubre tu próxima obsesión entre nuestras categorías.</p>
          </div>

          {/* Buscador de Géneros */}
          <div className="relative w-full md:w-auto min-w-[280px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-gray-500" size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar género..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 text-white text-sm rounded-full focus:ring-2 focus:ring-rose-500 focus:border-transparent block pl-11 p-3.5 transition-all outline-none shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 pt-10">
        {loading ? (
          <div className="w-full flex items-center justify-center min-h-[400px]">
             <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[300px] text-gray-500">
            <Search size={48} className="mb-4 opacity-50" />
            <p className="text-xl font-bold">No se encontraron géneros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredGenres.map(genre => {
              const coverUrl = genre.bgManga.cover_r2_key ? `${API_URL}/api/cover/${genre.bgManga.id}` : '/portada.jpg';
              
              return (
                <Link 
                  key={genre.name}
                  href={`/catalogo?genero=${encodeURIComponent(genre.name)}`}
                  className="group relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/5 transition-all duration-500 hover:shadow-[0_0_40px_rgba(225,29,72,0.5)] hover:border-rose-500/80 cursor-pointer block"
                >
                  {/* Imagen de Fondo Espectacular */}
                  <div className="absolute inset-0 z-0">
                    <div 
                      className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110 ease-out"
                      style={{ backgroundImage: `url('${coverUrl}')` }}
                    />
                  </div>
                  
                  {/* Capas de Oscurecimiento (Dark Mode Theme) */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] group-hover:bg-black/40 group-hover:backdrop-blur-0 transition-all duration-500 z-10" />
                  
                  {/* Gradiente Radial para enfocar el centro */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black z-20 opacity-80" />
                  
                  {/* Contenido Central (Typography) */}
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-widest drop-shadow-[0_5px_15px_rgba(0,0,0,1)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-rose-200 transition-all duration-300 transform group-hover:scale-105">
                      {genre.name}
                    </h2>
                    
                    <span className="mt-3 bg-black/50 backdrop-blur-md text-rose-300 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      {genre.count} {genre.count === 1 ? 'Obra' : 'Obras'}
                    </span>
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
