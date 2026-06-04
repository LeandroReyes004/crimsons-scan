'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layers, AlignJustify } from 'lucide-react';
import CanvasPageRenderer from '@/components/CanvasReader';
import ReaderControls from '@/components/ReaderControls';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface PageData { id: number; numero: number; image_url: string; scramble_map: number[]; }

export default function ChapterReaderPage() {
  const { id: mangaId, chapterId } = useParams() as { id: string; chapterId: string };

  const [pages, setPages]           = useState<PageData[]>([]);
  const [capInfo, setCapInfo]       = useState<{ numero: number; titulo: string | null } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState<'webtoon' | 'paged'>('webtoon');
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('crimson_reader_mode');
    if (saved === 'webtoon' || saved === 'paged') setReadingMode(saved);
    const savedPage = localStorage.getItem(`crimson_page_${chapterId}`);
    if (savedPage) setCurrentPage(parseInt(savedPage) || 0);
  }, [chapterId]);

  useEffect(() => {
    localStorage.setItem('crimson_reader_mode', readingMode);
  }, [readingMode]);

  useEffect(() => {
    localStorage.setItem(`crimson_page_${chapterId}`, String(currentPage));
  }, [currentPage, chapterId]);

  useEffect(() => {
    if (!chapterId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API}/api/chapters/${chapterId}/pages`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setPages(d.pages || []);
        if (d.capitulo) setCapInfo(d.capitulo);
      })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [chapterId]);

  const goNext = useCallback(() => {
    if (currentPage < pages.length - 1) { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [currentPage, pages.length]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }, [currentPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (readingMode !== 'paged') return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, readingMode]);

  const visiblePages = useMemo(() => {
    if (readingMode === 'webtoon') return pages;
    return pages.length > 0 ? [pages[currentPage]] : [];
  }, [pages, readingMode, currentPage]);

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans pb-32 select-none">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-3 sm:px-6 flex items-center justify-between">
        <Link href={`/manga/reader/${mangaId}`}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm font-medium min-h-[44px] min-w-[44px] sm:min-w-0 justify-center sm:justify-start">
          <ChevronLeft size={18}/> <span className="hidden sm:inline">Volver</span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {capInfo && (
            <span className="hidden sm:inline text-sm font-semibold text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 truncate max-w-[200px]">
              Cap. {capInfo.numero}{capInfo.titulo ? ` — ${capInfo.titulo}` : ''}
            </span>
          )}
          <button onClick={() => setReadingMode('webtoon')} title="Modo Webtoon"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition ${readingMode === 'webtoon' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <AlignJustify size={18}/>
          </button>
          <button onClick={() => setReadingMode('paged')} title="Modo Paginado"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition ${readingMode === 'paged' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <Layers size={18}/>
          </button>
          {readingMode === 'paged' && pages.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-400 bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 tabular-nums">
              {currentPage + 1} / {pages.length}
            </span>
          )}
        </div>
      </header>

      <main className={`flex flex-col items-center mt-0 ${readingMode === 'webtoon' ? 'w-full max-w-[900px] mx-auto' : 'max-w-4xl mx-auto px-2'}`}>

        {loading && (
          <div className="flex flex-col items-center gap-4 mt-24">
            <div className="w-10 h-10 rounded-full border-4 border-t-rose-500 border-rose-900/30 animate-spin"/>
            <p className="text-gray-500 text-sm tracking-wider">Cargando páginas seguras...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 text-red-400 p-6 rounded-2xl border border-red-900/30 flex flex-col items-center gap-2 mt-12">
            <span className="text-3xl">⚠️</span>
            <p className="font-bold text-center">No se pudo cargar el capítulo</p>
            <p className="text-sm text-center text-red-300/70">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-sm bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl transition">
              Reintentar
            </button>
            <Link href={`/manga/reader/${mangaId}`} className="text-sm text-gray-500 hover:text-gray-300 mt-1">
              Volver al manga
            </Link>
          </div>
        )}

        {/* Navegación paginado — click en zonas */}
        {readingMode === 'paged' && !loading && pages.length > 0 && (
          <div className="fixed inset-0 z-10 flex pointer-events-none" style={{ top: '56px', bottom: '80px' }}>
            <button onClick={goPrev} className="flex-1 pointer-events-auto opacity-0" aria-label="Página anterior"/>
            <button onClick={goNext} className="flex-1 pointer-events-auto opacity-0" aria-label="Página siguiente"/>
          </div>
        )}

        <div className={`w-full flex flex-col items-center ${readingMode === 'webtoon' ? 'gap-0' : 'gap-4'}`}>
          {visiblePages.map((page) => (
            <div key={page.id} className="relative w-full flex justify-center animate-in fade-in duration-300">
              <CanvasPageRenderer
                imageUrl={page.image_url}
                scrambleMap={page.scramble_map}
                userId="reader"
              />
            </div>
          ))}
        </div>

        {/* Final del capítulo */}
        {!loading && !error && pages.length > 0 && readingMode === 'webtoon' && (
          <div className="w-full mt-16 py-12 border-t border-white/5 flex flex-col items-center gap-5">
            <p className="text-gray-400 font-medium">— Fin del capítulo —</p>
            <Link href={`/manga/reader/${mangaId}`}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl transition">
              <ChevronLeft size={16}/> Ver todos los capítulos
            </Link>
          </div>
        )}
      </main>

      {pages.length > 0 && (
        <ReaderControls
          readingMode={readingMode}
          setReadingMode={setReadingMode}
          currentPage={currentPage + 1}
          totalPages={pages.length}
          onNextPage={goNext}
          onPrevPage={goPrev}
        />
      )}
    </div>
  );
}
