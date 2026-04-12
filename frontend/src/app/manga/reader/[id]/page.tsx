'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import CanvasPageRenderer from '@/components/CanvasReader';
import ReaderControls from '@/components/ReaderControls';

import { useParams } from 'next/navigation';

interface PageData {
  id: number;
  image_url: string;
  scramble_map: number[];
}

export default function ReaderPage() {
  const params = useParams();
  const mangaId = params?.id || '1';

  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States del Lector
  const [readingMode, setReadingMode] = useState<'webtoon' | 'paged'>('webtoon');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Recuperar historial de memoria
  useEffect(() => {
    const savedMode = localStorage.getItem('crimson_manga_mode');
    const savedPage = localStorage.getItem(`crimson_manga_${mangaId}_page`);
    
    if (savedMode === 'webtoon' || savedMode === 'paged') {
      setReadingMode(savedMode);
    }
    if (savedPage && !isNaN(parseInt(savedPage))) {
      setCurrentPageIndex(parseInt(savedPage));
    }
  }, [mangaId]);

  // Guardar historial en tiempo real
  useEffect(() => {
    localStorage.setItem('crimson_manga_mode', readingMode);
    localStorage.setItem(`crimson_manga_${mangaId}_page`, currentPageIndex.toString());
  }, [readingMode, currentPageIndex, mangaId]);

  // Carga inicial
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        // ERROR 2 FIX: Usar variable de entorno NEXT_PUBLIC_API_URL en lugar de URL hardcodeada.
        // En .env.local define: NEXT_PUBLIC_API_URL=http://localhost:3001
        // En producción define: NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/chapters/chapter-1`);
        if (!res.ok) throw new Error('Error al conectar con el servidor.');
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        if (data.pages && data.pages.length === 0) throw new Error("No hay imágenes en el backend.");

        setPages(data.pages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, []);

  // Navegación Pagina a Pagina
  const goToNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPageIndex, pages.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPageIndex]);

  // Soporte para teclado intercativo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode !== 'paged') return;
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'ArrowLeft') goToPrevPage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, readingMode]);

  // Determinar qué páginas mostrar según el modo
  const visiblePages = useMemo(() => {
    if (readingMode === 'webtoon') return pages;
    if (pages.length > 0) return [pages[currentPageIndex]];
    return [];
  }, [pages, readingMode, currentPageIndex]);


  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-rose-600/30 font-sans pb-32">
      {/* Header Premium */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 py-4 px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-orange-500 shadow-[0_0_15px_rgba(225,29,72,0.5)] flex items-center justify-center font-bold">
            CS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white/90">
            Crimson<span className="text-rose-500">Scan</span>
          </h1>
        </div>
        <div className="text-sm font-medium text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
          Capítulo 1
        </div>
      </header>

      <main className="max-w-3xl mx-auto flex flex-col items-center mt-12 px-4 transition-all duration-500">
        
        {loading && (
          <div className="flex flex-col items-center gap-4 mt-24 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-t-rose-500 border-rose-900 animate-spin"></div>
            <p className="text-gray-400 font-medium tracking-widest text-sm uppercase">Cargando tokens seguros...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-950/40 text-red-400 p-6 rounded-2xl border border-red-900/50 flex flex-col items-center gap-2 mt-12 shadow-2xl">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium text-center">{error}</p>
          </div>
        )}

        <div className={`w-full flex flex-col items-center ${readingMode === 'webtoon' ? 'gap-0' : 'gap-4'}`}>
          {pages.map((page, index) => {
            // Evaluamos si debe estar visible
            const isVisible = readingMode === 'webtoon' || index === currentPageIndex;
            
            return (
              <div 
                key={page.id} 
                className={`relative w-full flex justify-center transition-all duration-500 ${!isVisible ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-4'}`}
              >
                <CanvasPageRenderer 
                  imageUrl={page.image_url} 
                  scrambleMap={page.scramble_map} 
                  userId="VIP_User_128A" 
                />
              </div>
            );
          })}
        </div>

        {/* Sección de Comentarios Integrada */}
        <div className="w-full mt-24 pt-12 border-t border-white/5 pb-20">
          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
            <span className="w-2 h-8 bg-rose-500 rounded-full"></span> Comentarios de la Comunidad (38)
          </h3>
          
          <div className="bg-black/20 p-6 rounded-2xl border border-white/5 mb-8">
            <textarea 
              className="w-full bg-black/40 text-gray-200 p-4 rounded-xl border border-white/10 focus:border-rose-500 focus:outline-none transition-colors"
              rows={3}
              placeholder="¿Qué te pareció este capítulo?"
            ></textarea>
            <div className="flex justify-end mt-4">
              <button className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Publicar
              </button>
            </div>
          </div>

          {/* Placeholder Comentario */}
          <div className="flex gap-4 p-6 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex-shrink-0 border-2 border-white/10"></div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-rose-400">CrimsonFan99</span>
                <span className="text-xs text-gray-500">Hace 2 horas</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                ¡Wow, la calidad del edit es increíble! Gracias por la rápida traducción muchachos. 
                De todo el canvas rendering y seguridad, ni una sola línea cortada o bleeding, se pasaron ❤️
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Solo se muestran los controles si ya se cargaron páginas */}
      {pages.length > 0 && (
        <ReaderControls 
          readingMode={readingMode}
          setReadingMode={setReadingMode}
          currentPage={currentPageIndex + 1}
          totalPages={pages.length}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
        />
      )}
    </div>
  );
}
