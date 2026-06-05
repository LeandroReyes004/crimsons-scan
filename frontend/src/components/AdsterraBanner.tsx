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

    // Intercepta clicks del ad y los abre en pestaña nueva
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (link && link.href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }
    };
    container.addEventListener('click', handleClick);

    // MutationObserver: fuerza target="_blank" en cualquier <a> que inyecte el script
    const observer = new MutationObserver(() => {
      container.querySelectorAll('a').forEach(a => {
        a.target = '_blank';
        a.rel    = 'noopener noreferrer';
      });
    });
    observer.observe(container, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src    = `${SCRIPT_BASE}?t=${Date.now()}`;
    script.async  = true;
    script.setAttribute('data-cfasync', 'false');
    scriptRef.current = script;
    container.insertAdjacentElement('afterend', script);

    return () => {
      cleanup();
      container.removeEventListener('click', handleClick);
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <div className="w-full min-h-[120px] flex justify-center items-center overflow-hidden">
      <div ref={containerRef} id={CONTAINER_ID} className="w-full" />
    </div>
  );
}
