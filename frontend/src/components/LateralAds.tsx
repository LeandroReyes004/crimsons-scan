'use client';

import AdsterraSkyscraper from './AdsterraSkyscraper';

/**
 * Anuncios laterales fijos (skyscraper 160×300).
 * Solo visibles en pantallas ≥ 1600px donde hay espacio real
 * fuera del área de contenido centrado (max-w-7xl = 1280px).
 * En pantallas más angostas se ocultan automáticamente.
 */
export default function LateralAds() {
  return (
    <>
      {/* Lateral izquierdo */}
      <div
        className="hidden 2xl:flex fixed top-1/2 -translate-y-1/2 z-30 pointer-events-auto"
        style={{ left: 'calc(50% - 680px)' }}
      >
        <AdsterraSkyscraper />
      </div>

      {/* Lateral derecho */}
      <div
        className="hidden 2xl:flex fixed top-1/2 -translate-y-1/2 z-30 pointer-events-auto"
        style={{ right: 'calc(50% - 680px)' }}
      >
        <AdsterraSkyscraper />
      </div>
    </>
  );
}
