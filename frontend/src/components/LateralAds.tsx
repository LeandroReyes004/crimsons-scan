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
      {/* Un solo componente — el script inyecta el iframe globalmente */}
      <AdsterraSkyscraper />

      {/* Contenedores visuales (sin lógica de script) */}
      <div
        className="hidden 2xl:block fixed top-1/2 -translate-y-1/2 z-30"
        style={{ left: 'calc(50% - 680px)', width: 160, minHeight: 300 }}
      />
      <div
        className="hidden 2xl:block fixed top-1/2 -translate-y-1/2 z-30"
        style={{ right: 'calc(50% - 680px)', width: 160, minHeight: 300 }}
      />
    </>
  );
}
