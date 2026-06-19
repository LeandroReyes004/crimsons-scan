'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layers, AlignJustify, BookOpen } from 'lucide-react';
import CanvasPageRenderer from '@/components/CanvasReader';
import ReaderControls from '@/components/ReaderControls';
import AdPopUnder from '@/components/AdPopUnder';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface PageData { id: number; numero: number; image_url: string; scramble_map: number[]; }
interface CapInfo {
  id: string; numero: number; titulo: string | null; manga_id: string;
  es_adulto: boolean;
  prev_chapter_id: string | null; next_chapter_id: string | null;
}

export default function ChapterReaderPage() {
  const { id: mangaId, chapterId } = useParams() as { id: string; chapterId: string };

  const [pages, setPages]             = useState<PageData[]>([]);
  const [capInfo, setCapInfo]         = useState<CapInfo | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState<'webtoon' | 'paged'>('webtoon');
  const [currentPage, setCurrentPage] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('crimson_reader_mode');
    if (saved === 'webtoon' || saved === 'paged') setReadingMode(saved);
    const savedPage = localStorage.getItem(`crimson_page_${chapterId}`);
    if (savedPage) setCurrentPage(parseInt(savedPage) || 0);
  }, [chapterId]);



  // Guardar último capítulo leído por manga
  useEffect(() => {
    if (mangaId && chapterId) {
      localStorage.setItem(`crimson_last_${mangaId}`, chapterId);
    }
  }, [mangaId, chapterId]);

  // Registrar vista — anti-farming doble capa:
  //   Cliente: localStorage bloquea llamadas repetidas dentro de las 24h
  //   Servidor: fingerprint UUID impide el mismo browser aunque borre la key
  useEffect(() => {
    if (!chapterId) return;

    // Generar o reutilizar el fingerprint único del browser (persiste en localStorage)
    let fp = localStorage.getItem('crimson_fp');
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem('crimson_fp', fp);
    }

    // Dedup por capítulo — 1 vista por capítulo por 24h por browser (el servidor maneja el dedup a nivel de manga)
    const viewedKey = `crimson_chapter_view_${chapterId}`;
    const lastView  = parseInt(localStorage.getItem(viewedKey) || '0', 10);
    const now       = Date.now();
    if (now - lastView < 86400_000) return;

    localStorage.setItem(viewedKey, String(now));

    fetch(`${API}/api/chapters/${chapterId}/view`, {
      method:  'POST',
      headers: { 'X-Fingerprint': fp },
    }).catch(() => {
      // Si falla la red, revertir para que se intente de nuevo en la próxima sesión
      localStorage.removeItem(viewedKey);
    });
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Si scrolleamos hacia abajo más de 50px ocultamos los navs
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavVisible(false);
      } 
      // Si scrolleamos hacia arriba los mostramos
      else if (currentScrollY < lastScrollY) {
        setIsNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const visiblePages = useMemo(() => {
    if (readingMode === 'webtoon') return pages;
    return pages.length > 0 ? [pages[currentPage]] : [];
  }, [pages, readingMode, currentPage]);

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans pb-32 select-none">

      {/* Header */}
      <header className={`fixed top-0 inset-x-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-3 sm:px-6 flex items-center justify-between gap-2 transition-all duration-300 ${!isNavVisible ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'}`}>
        <div className="flex items-center gap-1">
          <Link href={`/manga/reader/${mangaId}`}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition text-sm font-medium min-h-[44px] min-w-[44px] justify-center sm:justify-start sm:min-w-0 sm:px-2">
            <ChevronLeft size={18}/> <span className="hidden sm:inline">Volver</span>
          </Link>
          {/* Prev chapter */}
          {capInfo?.prev_chapter_id && (
            <Link href={`/manga/reader/${mangaId}/chapter/${capInfo.prev_chapter_id}`}
              title="Capítulo anterior"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
              <ChevronLeft size={16}/>
            </Link>
          )}
          {/* Next chapter */}
          {capInfo?.next_chapter_id && (
            <Link href={`/manga/reader/${mangaId}/chapter/${capInfo.next_chapter_id}`}
              title="Capítulo siguiente"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition">
              <ChevronRight size={16}/>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {capInfo && (
            <span className="hidden sm:inline text-sm font-semibold text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 truncate max-w-[180px]">
              Cap. {capInfo.numero}{capInfo.titulo ? ` — ${capInfo.titulo}` : ''}
            </span>
          )}
          <a href="https://discord.gg/E4DwZNMYDq" target="_blank" rel="noopener noreferrer"
            title="Únete a nuestro Discord"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-[#5865F2] hover:bg-[#5865F2]/10 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
          </a>
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

      <main className={`flex flex-col items-center pt-14 ${readingMode === 'webtoon' ? 'w-full max-w-[900px] mx-auto' : 'max-w-4xl mx-auto px-2'}`}>

        {loading && (
          <div className="flex flex-col items-center gap-4 mt-24">
            <div className="w-10 h-10 rounded-full border-4 border-t-rose-500 border-rose-900/30 animate-spin"/>
            <p className="text-gray-500 text-sm tracking-wider">Cargando páginas...</p>
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

        {/* Zonas click para paginado */}
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
          <div className="w-full mt-16 py-12 border-t border-white/5 flex flex-col items-center gap-5 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-white/20"/>
              <p className="text-gray-400 font-medium text-sm">Fin del capítulo {capInfo?.numero}</p>
              <div className="w-8 h-px bg-white/20"/>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {capInfo?.prev_chapter_id && (
                <Link href={`/manga/reader/${mangaId}/chapter/${capInfo.prev_chapter_id}`}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-3 rounded-xl transition border border-white/10 text-sm active:scale-95">
                  <ChevronLeft size={16}/> Cap. anterior
                </Link>
              )}
              {capInfo?.next_chapter_id ? (
                <Link href={`/manga/reader/${mangaId}/chapter/${capInfo.next_chapter_id}`}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-rose-600/20 text-sm active:scale-95">
                  Cap. siguiente <ChevronRight size={16}/>
                </Link>
              ) : (
                <Link href={`/manga/reader/${mangaId}`}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-rose-600/20 text-sm active:scale-95">
                  <BookOpen size={16}/> Ver todos los capítulos
                </Link>
              )}
            </div>
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
          visible={isNavVisible}
        />
      )}

      {capInfo?.es_adulto && <AdPopUnder />}
    </div>
  );
}
