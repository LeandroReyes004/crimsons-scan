// frontend/src/components/GlobalAds.tsx
import Script from 'next/script';

export default function GlobalAds() {
  return (
    <>
      {/* 1. ADSTERRA: Social Bar */}
      <Script
        id="adsterra-social-bar"
        src="https://pl30978413.profitableratecpmnetwork.com/84/43/5f/84435fac1f5c75b21e8c12f8160d979a.js"
        strategy="afterInteractive"
      />

      {/* 2. MONETAG: Vignette Banner 
          Nota: En Next.js, los scripts inyectados de Monetag se traducen 
          pasando el data-zone directamente al componente Script. 
      */}
      <Script
        id="monetag-vignette"
        src="https://n6wxm.com/vignette.min.js"
        data-zone="11634536"
        strategy="afterInteractive"
      />
    </>
  );
}
