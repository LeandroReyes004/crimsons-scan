'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const EXCLUDED = ['/admin', '/uploader', '/manga/reader'];

export default function GlobalPopunders() {
  const pathname = usePathname();
  const isExcluded = EXCLUDED.some(p => pathname?.startsWith(p));
  
  const wasExcluded = useRef(isExcluded);

  useEffect(() => {
    // Si cruzamos la frontera entre una página sin anuncios (lector) y una con anuncios (home) o viceversa:
    // Forzamos una única recarga para limpiar o reactivar los listeners globales de los popunders en el navegador.
    // ESTO EVITA que se recargue la página entre capítulos (SPA rápido) pero mantiene el lector 100% limpio.
    if (wasExcluded.current !== isExcluded) {
      window.location.reload();
    }
    wasExcluded.current = isExcluded;
  }, [isExcluded]);

  if (isExcluded) return null;

  return (
    <>
      {/* Adsterra Global Popunder Script */}
      <Script
        id="adsterra-popunder"
        src="https://pl29641064.effectivecpmnetwork.com/22/96/aa/2296aae2f6e7d670692ad60295e285d2.js"
        strategy="afterInteractive"
      />

      {/* Monetag Global Popunder Script (Usando formato exacto para pasar la verificación del bot) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(s){s.dataset.zone='11184403',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`
        }}
      />
    </>
  );
}
