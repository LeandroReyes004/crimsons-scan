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

  const activeItem = carouselItems[currentIndex];
  if (!activeItem) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
  const coverUrl = activeItem.cover_r2_key ? `${API_URL}/api/cover/${activeItem.id}` : '/portada.jpg';

  return (
    <section className="relative w-full rounded-3xl overflow-hidden bg-[#111114] border border-white/5 shadow-2xl flex flex-col md:flex-row min-h-[350px] transition-all duration-500">
      {/* Image Background for Mobile / Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 md:opacity-20 blur-xl transition-all duration-700">
        <img key={coverUrl} src={coverUrl} alt="" className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out]" />
      </div>
      
      <div className="relative z-10 p-8 md:p-10 flex-1 flex flex-col justify-center">
        <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)] w-max mb-4">
          NUEVO
        </span>
        <h2 key={activeItem.titulo} className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight drop-shadow-md animate-[slideUp_0.5s_ease-out]">
          {activeItem.titulo}
        </h2>
        <p key={activeItem.descripcion} className="text-gray-300 text-sm md:text-base max-w-lg mb-8 line-clamp-3 leading-relaxed animate-[slideUp_0.6s_ease-out]">
          {activeItem.descripcion || 'El proyecto más esperado ya está aquí. ¡Acompáñanos en esta increíble historia llena de emociones!'}
        </p>
        
        <Link 
          key={activeItem.id}
          href={activeItem.ultimo_capitulo_id ? `/manga/reader/${activeItem.slug ?? activeItem.id}/chapter/${activeItem.ultimo_capitulo_id}` : `/manga/reader/${activeItem.slug ?? activeItem.id}`} 
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_10px_25px_rgba(225,29,72,0.4)] transition-all active:scale-95 w-max animate-[slideUp_0.7s_ease-out]"
        >
          LEE AHORA <ArrowRight size={18}/>
        </Link>
      </div>
      
      {/* Image on Right for Desktop */}
      <div className="hidden md:block relative z-10 w-1/3 shrink-0 transition-all duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-[#111114] to-transparent z-10" />
        <img key={`desktop-${coverUrl}`} src={coverUrl} alt={activeItem.titulo} className="w-full h-full object-cover object-center animate-[fadeIn_0.5s_ease-out]" />
      </div>

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
