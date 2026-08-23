'use client'; // Súper importante para que funcione el useEffect

import { useEffect, useRef } from 'react';

export default function NativeAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Revisamos que el contenedor exista y esté vacío para no duplicar el anuncio al recargar
    if (adRef.current && adRef.current.childNodes.length === 0) {
      const script = document.createElement('script');
      script.src = 'https://pl29641065.profitableratecpmnetwork.com/0fa6716a3cd45287055565fcd3a06d52/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      
      // Inyectamos el script DIRECTAMENTE dentro de nuestro div
      adRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="my-6 flex w-full min-h-[100px] justify-center items-center overflow-hidden">
      {/* El div original que pide Adsterra, vinculado a nuestra referencia de React */}
      <div id="container-0fa6716a3cd45287055565fcd3a06d52" ref={adRef}></div>
    </div>
  );
}
