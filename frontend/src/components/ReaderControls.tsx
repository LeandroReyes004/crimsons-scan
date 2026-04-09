'use client';

import { Settings, Maximize, MousePointer2, ChevronLeft, ChevronRight, LayoutTemplate, Layers } from 'lucide-react';

interface ReaderControlsProps {
  readingMode: 'webtoon' | 'paged';
  setReadingMode: (mode: 'webtoon' | 'paged') => void;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export default function ReaderControls({
  readingMode,
  setReadingMode,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
}: ReaderControlsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all hover:bg-black/70">
      
      {/* Mode Switcher */}
      <div className="flex bg-white/5 p-1 rounded-xl">
        <button
          onClick={() => setReadingMode('webtoon')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            readingMode === 'webtoon' 
              ? 'bg-rose-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Modo Cascada (Webtoon)"
        >
          <Layers size={18} />
          <span className="hidden sm:inline">Cascada</span>
        </button>
        <button
          onClick={() => setReadingMode('paged')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            readingMode === 'paged' 
              ? 'bg-rose-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
          title="Modo Página a Página"
        >
          <LayoutTemplate size={18} />
          <span className="hidden sm:inline">Paginado</span>
        </button>
      </div>

      <div className="w-px h-8 bg-white/10 mx-2"></div>

      {/* Pagination Controls (Only visible in 'paged' mode) */}
      <div className={`flex items-center gap-3 transition-opacity duration-300 ${readingMode === 'paged' ? 'opacity-100 flex' : 'opacity-50 pointer-events-none'}`}>
        <button 
          onClick={onPrevPage}
          disabled={currentPage <= 1 || readingMode !== 'paged'}
          className="p-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all disabled:opacity-30"
          title="Página anterior (Flecha Izquierda)"
        >
          <ChevronLeft size={24} />
        </button>
        
        <span className="text-sm font-semibold tracking-widest text-gray-200 min-w-[50px] text-center">
          {currentPage} <span className="text-gray-500">/</span> {totalPages || '?'}
        </span>

        <button 
          onClick={onNextPage}
          disabled={currentPage >= totalPages || readingMode !== 'paged'}
          className="p-2 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all disabled:opacity-30"
          title="Página siguiente (Flecha Derecha)"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="hidden md:block w-px h-8 bg-white/10 mx-2"></div>

      {/* Extra Utilities */}
      <div className="hidden md:flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
          <Settings size={20} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" onClick={() => {
          if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          }
        }}>
          <Maximize size={20} />
        </button>
      </div>
    </div>
  );
}
