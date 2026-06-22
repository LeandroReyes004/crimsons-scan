'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { getUser } from '@/lib/auth';

const EXCLUDED = ['/admin', '/uploader', '/manga/reader'];

export default function GlobalPopunders() {
  const pathname = usePathname();
  const isExcluded = EXCLUDED.some(p => pathname?.startsWith(p));
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wasExcluded = useRef(isExcluded);

  useEffect(() => {
    const u = getUser();
    if (u && (u.is_superadmin || ['admin', 'admin_scan', 'uploader'].includes(u.rol))) {
      setIsAdmin(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (wasExcluded.current !== isExcluded) {
      window.location.reload();
    }
    wasExcluded.current = isExcluded;
  }, [isExcluded]);

  if (!mounted) return null;
  if (isExcluded || isAdmin) return null;

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
