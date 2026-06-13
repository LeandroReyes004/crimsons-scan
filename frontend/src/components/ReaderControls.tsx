'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutTemplate, Layers } from 'lucide-react';

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
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const show = () => {
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 2500);
    };

    // En modo paginado siempre visible (el usuario necesita los botones)
    if (readingMode === 'paged') {
      setVisible(true);
      clearTimeout(timerRef.current);
      return;
    }

    // En webtoon: se oculta mientras scrollea, reaparece al parar
    window.addEventListener('scroll', show, { passive: true });
    window.addEventListener('touchstart', show, { passive: true });

    // Ocultar inicial tras 3s sin actividad
    timerRef.current = setTimeout(() => setVisible(false), 3000);

    return () => {
      window.removeEventListener('scroll', show);
      window.removeEventListener('touchstart', show);
      clearTimeout(timerRef.current);
    };
  }, [readingMode]);

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 bg-black/60 backdrop-blur-xl border border-white/10 px-3 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:bg-black/70 max-w-[calc(100vw-2rem)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
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

      <div className="hidden sm:block w-px h-8 bg-white/10 mx-1 sm:mx-2" />

      {/* Pagination Controls (Only visible in 'paged' mode) */}
      <div className={`items-center gap-3 ${readingMode === 'paged' ? 'flex' : 'hidden'}`}>
        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1}
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
    </div>
  );
}
