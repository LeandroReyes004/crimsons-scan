'use client';

import { usePathname } from 'next/navigation';

import Script from 'next/script';

const EXCLUDED = ['/admin', '/admin-dev', '/uploader', '/login', '/register'];

export default function GlobalAdScript() {
  const pathname = usePathname();

  if (EXCLUDED.some(p => pathname?.startsWith(p))) {
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
