'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Script from 'next/script';

const EXCLUDED = ['/admin', '/admin-dev', '/uploader', '/login', '/register'];

export default function GlobalAdScript() {
  const pathname = usePathname();
  const [hideAds, setHideAds] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    import('@/lib/auth').then(({ getUser }) => {
      const u = getUser();
      if (u && (u.is_superadmin || ['admin', 'admin_scan', 'uploader', 'vip', 'donador'].includes(u.rol))) {
        setHideAds(true);
      }
      setMounted(true);
    });
  }, []);

  if (!mounted) return null;
  if (hideAds || EXCLUDED.some(p => pathname?.startsWith(p))) {
    return null;
  }

  return (
    <Script
      id="monetag-global"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(s){s.dataset.zone='11634536',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`,
      }}
    />
  );
}
