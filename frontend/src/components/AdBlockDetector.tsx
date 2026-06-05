'use client';

import { useEffect, useState } from 'react';

// Clases que todos los bloqueadores (incluido Brave) ocultan via CSS
const BAIT_CLASSES = 'adsbox ad-banner pub_300x250 pub_300x250m text-ad textAd text_ad text_ads ad-unit';

function detectViaCSSBait(): Promise<boolean> {
  return new Promise(resolve => {
    const bait = document.createElement('div');
    bait.className = BAIT_CLASSES;
    bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(bait);
    // Dar tiempo al bloqueador para aplicar sus reglas CSS
    setTimeout(() => {
      const blocked =
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.offsetWidth  === 0 ||
        getComputedStyle(bait).display === 'none' ||
        getComputedStyle(bait).visibility === 'hidden';
      bait.remove();
      resolve(blocked);
    }, 150);
  });
}

function detectViaScript(): Promise<boolean> {
  return new Promise(resolve => {
    // Si el script ya fue cargado y canRunAds está seteado, confiar en eso
    if ((window as any).canRunAds === true) { resolve(false); return; }

    const script = document.createElement('script');
    script.src = `/ads.js?t=${Date.now()}`;
    script.onload = () => resolve(!(window as any).canRunAds);
    script.onerror = () => resolve(true);
    document.head.appendChild(script);
  });
}

export default function AdBlockDetector() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Ambos métodos deben coincidir para evitar falsos positivos
    Promise.all([detectViaCSSBait(), detectViaScript()]).then(([cssBait, scriptBait]) => {
      if (cssBait || scriptBait) setBlocked(true);
    });
  }, []);

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-8 flex flex-col items-center gap-5 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-2">Bloqueador de anuncios detectado</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Crimson's Scan es gratuito gracias a los anuncios. Por favor, desactivá tu bloqueador
            para este sitio y recargá la página.
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 text-left w-full text-sm text-gray-300 space-y-1">
          <p className="font-semibold text-white mb-2">Cómo desactivarlo:</p>
          <p>1. Hacé click en el ícono del bloqueador en tu barra de herramientas</p>
          <p>2. Seleccioná <span className="text-white font-medium">"Desactivar en este sitio"</span></p>
          <p>3. Recargá la página</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition"
        >
          Ya lo desactivé — Recargar
        </button>
      </div>
    </div>
  );
}
