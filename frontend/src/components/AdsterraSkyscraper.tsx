'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SCRIPT_BASE = 'https://www.highperformanceformat.com/8ee74c0f889796bc175bf62ab6c3728a/invoke.js';
const AD_KEY      = '8ee74c0f889796bc175bf62ab6c3728a';

export default function AdsterraSkyscraper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef    = useRef<HTMLScriptElement | null>(null);
  const pathname     = usePathname();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup: remove previous script and injected iframe
    const cleanup = () => {
      scriptRef.current?.remove();
      scriptRef.current = null;
      container.innerHTML = '';
    };

    cleanup();

    // atOptions must be set synchronously before the script executes
    (window as any).atOptions = {
      key:    AD_KEY,
      format: 'iframe',
      height: 300,
      width:  160,
      params: {},
    };

    const script = document.createElement('script');
    // Cache-bust so the browser fetches fresh on every route change
    script.src   = `${SCRIPT_BASE}?t=${Date.now()}`;
    script.async = true;
    scriptRef.current = script;
    container.appendChild(script);

    return cleanup;
  }, [pathname]); // re-runs on every client-side navigation

  return (
    <div
      ref={containerRef}
      className="flex justify-center items-center overflow-hidden w-full min-h-[300px]"
    />
  );
}
