'use client';
import Link from 'next/link';
import { Star, Clock } from 'lucide-react';

interface MangaCardProps {
  id: string;
  title: string;
  imageUrl: string;
  chapter: string;
  tags: string[];
  isHot?: boolean;
}

export default function MangaCard({ id, title, imageUrl, chapter, tags, isHot }: MangaCardProps) {
  return (
    <Link href={`/manga/reader/${id}`} className="group relative block w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(225,29,72,0.4)]">
      
      {/* Etiqueta Hot / Nuevo */}
      {isHot && (
        <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-rose-600 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
          <Star size={12} fill="currentColor" /> HOT
        </div>
      )}

      {/* Imagen de Portada con Gradiente */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Overlay degrado para legibilidad del texto abajo */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/20 to-transparent"></div>
      </div>

      {/* Información del Manga */}
      <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col gap-2">
        <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-rose-400 transition-colors drop-shadow-md">
          {title}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-rose-400 drop-shadow-md">Cap. {chapter}</span>
          <div className="flex items-center gap-1 text-xs text-gray-200 drop-shadow-md">
            <Clock size={12} /> Hace 2h
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-1">
          {tags.map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-wider bg-black/40 text-gray-100 px-2 py-1 rounded-md backdrop-blur-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
