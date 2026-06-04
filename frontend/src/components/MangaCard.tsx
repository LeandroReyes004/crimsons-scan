'use client';
import Link from 'next/link';
import { Star, Clock, Heart } from 'lucide-react';

interface MangaCardProps {
  id: string;
  title: string;
  imageUrl: string;
  chapter: string | null;
  chapterUrl?: string | null;
  updatedAt?: string | null;
  tags: string[];
  isHot?: boolean;
  isFav?: boolean;
  onToggleFav?: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `Hace ${mins}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7)   return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

export default function MangaCard({ id, title, imageUrl, chapter, chapterUrl, updatedAt, tags, isHot, isFav, onToggleFav }: MangaCardProps) {
  return (
    <Link href={`/manga/reader/${id}`} className="group relative block w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(225,29,72,0.4)]">

      {isHot && (
        <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-rose-600 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
          <Star size={12} fill="currentColor" /> HOT
        </div>
      )}

      {/* Botón favorito */}
      {onToggleFav && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav(id); }}
          className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-all active:scale-90 ${
            isFav
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
              : 'bg-black/50 text-white/60 hover:text-rose-400 hover:bg-black/70'
          }`}
          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart size={14} fill={isFav ? 'currentColor' : 'none'}/>
        </button>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/20 to-transparent"/>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 flex flex-col gap-1 sm:gap-1.5">
        <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 group-hover:text-rose-400 transition-colors drop-shadow-md leading-tight">
          {title}
        </h3>

        {chapter != null ? (
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-xs sm:text-sm font-semibold text-rose-400 drop-shadow-md truncate"
              onClick={e => { if (chapterUrl) { e.preventDefault(); window.location.href = chapterUrl; } }}
            >
              Cap. {chapter}
            </span>
            {updatedAt && (
              <span className="text-[10px] sm:text-xs text-gray-300 flex items-center gap-0.5 drop-shadow-md shrink-0">
                <Clock size={10}/> {timeAgo(updatedAt)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin capítulos aún</span>
        )}

        {tags.length > 0 && (
          <div className="hidden sm:flex gap-1.5 mt-0.5 flex-wrap">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider bg-black/50 text-gray-200 px-2 py-0.5 rounded-md backdrop-blur-md">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
