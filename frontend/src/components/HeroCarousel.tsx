'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Play, Sparkles } from 'lucide-react';

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
      <section className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 shadow-2xl flex flex-col md:flex-row min-h-[450px]">
        <div className="w-full h-full flex items-center justify-center min-h-[450px] animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
        </div>
      </section>
    );
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  return (
    <section className="relative w-full rounded-3xl overflow-hidden bg-white dark:bg-[#0a0a0c] shadow-[0_20px_50px_rgba(225,29,72,0.1)] min-h-[450px] md:min-h-[550px] lg:min-h-[600px] border border-gray-200 dark:border-rose-900/20 group">
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
            {/* Full Image Background with Crimson-tinted Gradients */}
            <div className="absolute inset-0 z-0 bg-white dark:bg-[#0f0407]">
              <div 
                className="w-full h-full bg-cover bg-top md:bg-center opacity-80 dark:opacity-100 mix-blend-multiply dark:mix-blend-normal"
                style={{ backgroundImage: `url('${coverUrl}')` }}
              />
              {/* Left to right gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 dark:from-[#0f0407] dark:via-[#0f0407]/80 md:via-transparent to-transparent z-10" />
              {/* Bottom to top gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 dark:from-[#0f0407] dark:via-[#0f0407]/40 to-transparent z-10" />
            </div>
            
            <div className="relative z-20 p-6 md:p-12 lg:p-16 w-full md:w-3/4 lg:w-2/3 flex flex-col justify-end md:justify-center pb-16 md:pb-12 h-full">
              
              {/* Top Badge */}
              <div className={`flex flex-wrap items-center gap-2 md:gap-4 mb-4 md:mb-6 transition-all duration-700 delay-300 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <span className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded shadow-[0_0_15px_rgba(225,29,72,0.4)] flex items-center gap-1">
                  <Sparkles size={12} fill="currentColor" /> ESTRENO
                </span>
                {item.ultimo_capitulo_id && (
                  <span className="text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider drop-shadow-md border-l border-gray-400 dark:border-white/20 pl-3">
                    Nuevo Capítulo
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className={`font-black text-3xl md:text-5xl lg:text-6xl text-gray-900 dark:text-white leading-tight mb-4 tracking-tight transition-all duration-700 delay-200 line-clamp-2 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {item.titulo}
              </h2>

              {/* Genres Row */}
              {tags.length > 0 && (
                <div className={`flex flex-wrap items-center gap-2 mb-4 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-300 transition-all duration-700 delay-300 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  {tags.map((tag, i) => (
                    <span key={tag} className="flex items-center">
                      <span className="hover:text-rose-500 transition-colors cursor-pointer">{tag}</span>
                      {i < tags.length - 1 && <span className="mx-2 text-rose-500 font-black">•</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className={`text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-8 max-w-2xl line-clamp-3 md:line-clamp-4 transition-all duration-700 delay-400 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {stripHtml(item.descripcion || '') || 'El proyecto más esperado ya está aquí. ¡Acompáñanos en esta increíble historia llena de emociones!'}
              </p>
              
              {/* Buttons */}
              <div className={`flex flex-wrap items-center gap-3 md:gap-4 transition-all duration-700 delay-700 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <Link href={item.ultimo_capitulo_id ? `/manga/reader/${item.slug ?? item.id}/chapter/${item.ultimo_capitulo_id}` : `/manga/reader/${item.slug ?? item.id}`} className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-8 md:px-10 py-4 rounded-2xl font-black text-sm md:text-base shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden w-full sm:w-auto">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <Play size={18} fill="currentColor" className="relative z-10" /> 
                  <span className="relative z-10">Leer ahora</span>
                </Link>
                <Link href={`/manga/reader/${item.slug ?? item.id}`} className="group flex items-center justify-center gap-2 bg-gray-100/80 hover:bg-gray-200/80 dark:bg-black/40 dark:hover:bg-black/60 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 px-8 md:px-10 py-4 rounded-2xl font-bold text-sm md:text-base backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto">
                  <Info size={18} /> Ver detalles
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Crimson style Carousel Indicators */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-6 right-6 md:right-8 flex justify-end gap-2 z-20">
          {carouselItems.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex ? 'w-8 bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)]' : 'w-2 bg-gray-300 dark:bg-white/20 hover:bg-gray-400 dark:hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
