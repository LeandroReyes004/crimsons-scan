'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Play } from 'lucide-react';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  descripcion?: string | null;
  generos?: string;
  fecha_actualizacion: string;
  cover_r2_key: string | null;
  ultimo_capitulo_id: string | null;
}

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
};

export default function HeroCarousel({ mangas }: { mangas: Manga[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Take top 5 newest mangas
  const carouselItems = [...mangas]
    .sort((a, b) => new Date(b.fecha_actualizacion || 0).getTime() - new Date(a.fecha_actualizacion || 0).getTime())
    .slice(0, 5);

  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  if (mangas.length === 0) {
    return (
      <section className="relative w-full rounded-2xl overflow-hidden bg-[#111114] border border-white/5 shadow-2xl flex flex-col md:flex-row min-h-[450px]">
        <div className="w-full h-full flex items-center justify-center min-h-[450px] animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
        </div>
      </section>
    );
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  return (
    <section className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a0c] shadow-2xl min-h-[450px] md:min-h-[550px] lg:min-h-[600px] border border-white/5 group">
      {carouselItems.map((item, idx) => {
        const coverUrl = item.cover_r2_key ? `${API_URL}/api/cover/${item.id}` : '/portada.jpg';
        const isActive = idx === currentIndex;
        
        let tags: string[] = [];
        try {
          if (item.generos) {
            tags = JSON.parse(item.generos).slice(0, 4);
          }
        } catch (e) {}
        
        return (
          <div 
            key={item.id} 
            className={`absolute inset-0 flex transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Full Image Background with Netflix-style Gradients */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0c]">
              <div 
                className="w-full h-full bg-cover bg-top md:bg-center"
                style={{ backgroundImage: `url('${coverUrl}')` }}
              />
              {/* Left to right gradient (Darker for better text readability) */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 md:via-transparent to-transparent z-10" />
              {/* Bottom to top gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent z-10" />
            </div>
            
            <div className="relative z-20 p-6 md:p-12 lg:p-16 w-full md:w-3/4 lg:w-2/3 flex flex-col justify-end md:justify-center pb-16 md:pb-12 h-full">
              
              {/* Top Badge */}
              <div className={`flex items-center gap-2 mb-4 transition-all duration-700 delay-100 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <span className="bg-[#e50914] text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-lg">
                  EXCLUSIVO
                </span>
                {item.ultimo_capitulo_id && (
                  <span className="text-gray-300 text-xs font-bold uppercase tracking-wider drop-shadow-md">
                    Nuevo Capítulo
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className={`font-black text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-4 tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] transition-all duration-700 delay-200 line-clamp-2 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {item.titulo}
              </h2>

              {/* Genres Row */}
              {tags.length > 0 && (
                <div className={`flex flex-wrap items-center gap-2 mb-4 text-xs md:text-sm font-semibold text-gray-300 drop-shadow-md transition-all duration-700 delay-300 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  {tags.map((tag, i) => (
                    <span key={tag} className="flex items-center">
                      <span className="hover:text-white transition-colors">{tag}</span>
                      {i < tags.length - 1 && <span className="mx-2 text-gray-500 font-black">•</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className={`text-gray-200 text-sm md:text-lg max-w-2xl mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed transition-all duration-700 delay-500 drop-shadow-lg ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {stripHtml(item.descripcion || '') || 'El proyecto más esperado ya está aquí. ¡Acompáñanos en esta increíble historia llena de emociones!'}
              </p>
              
              {/* Buttons (Netflix style: Play and More Info) */}
              <div className={`flex items-center gap-3 md:gap-4 transition-all duration-700 delay-700 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <Link 
                  href={item.ultimo_capitulo_id ? `/manga/reader/${item.slug ?? item.id}/chapter/${item.ultimo_capitulo_id}` : `/manga/reader/${item.slug ?? item.id}`} 
                  className="flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 text-sm md:text-base font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-md transition-all active:scale-95 shadow-xl"
                >
                  <Play size={18} fill="currentColor" /> Leer ahora
                </Link>
                <Link 
                  href={`/manga/reader/${item.slug ?? item.id}`} 
                  className="flex items-center justify-center gap-2 bg-gray-500/40 hover:bg-gray-500/60 text-white text-sm md:text-base font-bold py-2.5 md:py-3 px-6 md:px-8 rounded-md transition-all active:scale-95 backdrop-blur-md shadow-xl"
                >
                  <Info size={18} /> Ver detalles
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Netflix style Carousel Indicators */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-6 right-6 md:right-8 flex justify-end gap-1.5 z-20">
          {carouselItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 transition-all duration-500 ${
                idx === currentIndex ? 'bg-white w-6 md:w-8' : 'bg-white/40 w-2 md:w-3 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
