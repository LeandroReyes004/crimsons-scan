'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://www.highperformanceformat.com/8ee74c0f889796bc175bf62ab6c3728a/invoke.js';
const AD_KEY     = '8ee74c0f889796bc175bf62ab6c3728a';

export default function AdsterraSkyscraper({ side }: { side: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Solo en pantallas anchas donde hay espacio real
    if (window.innerWidth < 1536) return;
    if (!ref.current) return;
    if (ref.current.querySelector('script')) return;

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
    ref.current.appendChild(script);
  }, []);

  const pos = side === 'left'
    ? { left: 'calc(50% - 720px)' }
    : { right: 'calc(50% - 720px)' };

  return (
    <div
      ref={ref}
      className="fixed top-1/2 -translate-y-1/2 z-30 overflow-hidden"
      style={{ ...pos, width: 160, minHeight: 300 }}
    />
  );
}
