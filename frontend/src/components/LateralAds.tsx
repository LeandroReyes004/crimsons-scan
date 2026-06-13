'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import AdsterraSkyscraper from './AdsterraSkyscraper';

// Páginas donde no mostramos la barra de anuncios
const EXCLUDED = ['/admin', '/uploader', '/manga/reader'];

export default function LateralAds() {
  const [closed, setClosed]   = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    const show = () => {
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 3000);
    };

    window.addEventListener('scroll', show, { passive: true });
    window.addEventListener('touchstart', show, { passive: true });

    // Ocultar inicial después de 4s
    timerRef.current = setTimeout(() => setVisible(false), 4000);

    return () => {
      window.removeEventListener('scroll', show);
      window.removeEventListener('touchstart', show);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (closed) return null;
  if (EXCLUDED.some(p => pathname?.startsWith(p))) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 h-[100px] overflow-hidden bg-[#0a0a0c]/95 backdrop-blur-md border-t border-white/10 flex justify-center items-start transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <button
        onClick={() => setClosed(true)}
        aria-label="Cerrar anuncio"
        className="absolute top-1.5 right-2 text-gray-500 hover:text-white transition-colors z-10"
      >
        <X size={12} />
      </button>
      <AdsterraSkyscraper />
    </div>
  );
}
