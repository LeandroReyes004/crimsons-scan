'use client';

import { useEffect, useRef, useState } from 'react';

const SCRIPT_SRC = 'https://www.highperformanceformat.com/8ee74c0f889796bc175bf62ab6c3728a/invoke.js';
const AD_KEY     = '8ee74c0f889796bc175bf62ab6c3728a';

/**
 * Adsterra Skyscraper 160×300
 *
 * Este formato necesita que `window.atOptions` esté definido ANTES
 * de que se ejecute el script externo, por eso se asigna de forma
 * síncrona justo antes de appendear el <script>.
 */
export default function AdsterraSkyscraper() {
  const [mounted, setMounted] = useState(false);
  const injectedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (injectedRef.current) return;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      injectedRef.current = true;
      return;
    }

    injectedRef.current = true;

    // Definir atOptions ANTES del script (requerimiento de la red)
    (window as any).atOptions = {
      key:    AD_KEY,
      format: 'iframe',
      height: 300,
      width:  160,
      params: {},
    };

    const script = document.createElement('script');
    script.src   = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, [mounted]);

  if (!mounted) return null;

  return (
    // Reserva exactamente 160×300 para evitar CLS
    <div className="flex justify-center items-center overflow-hidden"
         style={{ width: 160, minHeight: 300 }}>
      {/* El script inyecta el iframe directamente en el body,
          no en un contenedor específico */}
    </div>
  );
}
