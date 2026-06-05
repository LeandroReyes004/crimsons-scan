'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SCRIPT_BASE  = 'https://pl29641065.effectivecpmnetwork.com/0fa6716a3cd45287055565fcd3a06d52/invoke.js';
const CONTAINER_ID = 'container-0fa6716a3cd45287055565fcd3a06d52';

export default function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef    = useRef<HTMLScriptElement | null>(null);
  const pathname     = usePathname();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = () => {
      scriptRef.current?.remove();
      scriptRef.current = null;
      container.innerHTML = '';
    };

    cleanup();

    const script = document.createElement('script');
    script.src    = `${SCRIPT_BASE}?t=${Date.now()}`;
    script.async  = true;
    script.setAttribute('data-cfasync', 'false');
    scriptRef.current = script;
    // Script must be injected after the container div exists in the DOM
    container.insertAdjacentElement('afterend', script);

    return cleanup;
  }, [pathname]);

  return (
    <div className="w-full min-h-[120px] flex justify-center items-center overflow-hidden">
      <div ref={containerRef} id={CONTAINER_ID} className="w-full" />
    </div>
  );
}
