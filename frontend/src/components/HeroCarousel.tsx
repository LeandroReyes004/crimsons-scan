'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Manga { 
  id: string; 
  slug?: string | null; 
  titulo: string; 
  descripcion?: string | null;
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
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  if (mangas.length === 0) {
    return (
      <section className="relative w-full rounded-3xl overflow-hidden bg-[#111114] border border-white/5 shadow-2xl flex flex-col md:flex-row min-h-[350px]">
        <div className="w-full h-full flex items-center justify-center min-h-[350px] animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
        </div>
      </section>
    );
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  return (
    <section className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a0c] border border-pink-900/30 shadow-2xl min-h-[380px] md:min-h-[420px]">
      {carouselItems.map((item, idx) => {
        const coverUrl = item.cover_r2_key ? `${API_URL}/api/cover/${item.id}` : '/portada.jpg';
        const isActive = idx === currentIndex;
        
        return (
          <div 
            key={item.id} 
            className={`absolute inset-0 flex transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Full Image Background with Gradient Mask */}
            <div className="absolute inset-0 z-0">
              <img src={coverUrl} alt="" className="w-full h-full object-cover object-top md:object-center" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/90 md:via-[#0a0a0c]/70 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent z-10" />
            </div>
            
            <div className="relative z-20 p-8 md:p-12 w-full md:w-2/3 flex flex-col justify-center">
              <span className={`bg-[#9d174d] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm w-max mb-5 transition-all duration-700 delay-100 ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                ESTRENO
              </span>
              <h2 className={`font-['Playfair_Display',_serif] text-4xl md:text-6xl text-white leading-tight mb-4 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transition-all duration-700 delay-200 line-clamp-2 italic ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {item.titulo}
              </h2>
              <p className={`text-gray-300/90 text-sm md:text-base max-w-lg mb-8 line-clamp-2 leading-relaxed transition-all duration-700 delay-300 drop-shadow-md ${
                isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {stripHtml(item.descripcion || '') || 'El proyecto más esperado ya está aquí. ¡Acompáñanos en esta increíble historia llena de emociones!'}
              </p>
              
              <Link 
                href={item.ultimo_capitulo_id ? `/manga/reader/${item.slug ?? item.id}/chapter/${item.ultimo_capitulo_id}` : `/manga/reader/${item.slug ?? item.id}`} 
                className={`flex items-center justify-center gap-2 bg-gradient-to-r from-[#9d174d] to-[#be185d] hover:from-[#be185d] hover:to-[#db2777] text-white text-sm font-bold py-3 px-8 rounded-md shadow-[0_4px_15px_rgba(157,23,77,0.5)] transition-all active:scale-95 w-max duration-700 delay-500 border border-white/10 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                Leer ahora <ArrowRight size={16} className="ml-1 opacity-80"/>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Carousel Indicators */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {carouselItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-rose-500 w-8' : 'bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
