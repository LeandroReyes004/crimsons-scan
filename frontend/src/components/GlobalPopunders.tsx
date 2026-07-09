'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

const EXCLUDED = ['/admin', '/uploader', '/manga/reader'];

export default function GlobalPopunders() { return null;
  const pathname = usePathname();
  const isExcluded = EXCLUDED.some(p => pathname?.startsWith(p));
  
  if (isExcluded) return null;

  return (
    <>
      {/* Adsterra Global Popunder Script */}
      <Script
        id="adsterra-popunder"
        src="https://pl29641064.effectivecpmnetwork.com/22/96/aa/2296aae2f6e7d670692ad60295e285d2.js"
        strategy="afterInteractive"
      />
    </>
  );
}
