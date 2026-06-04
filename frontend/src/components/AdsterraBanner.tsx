'use client';

import { useEffect, useRef, useState } from 'react';

const SCRIPT_SRC  = 'https://pl29641065.effectivecpmnetwork.com/0fa6716a3cd45287055565fcd3a06d52/invoke.js';
const CONTAINER_ID = 'container-0fa6716a3cd45287055565fcd3a06d52';

/**
 * Adsterra Native Banner
 *
 * - 'use client' evita SSR y elimina cualquier riesgo de Hydration Mismatch.
 * - `mounted` state asegura que el <div> del contenedor solo existe en el cliente.
 * - `injectedRef` impide la doble inyección del script en React Strict Mode
 *   (que ejecuta los efectos dos veces en desarrollo).
 * - La búsqueda con querySelector evita duplicados durante Client-Side Routing
 *   (cuando el componente se desmonta y remonta al navegar entre páginas).
 * - `min-h-[120px]` reserva espacio antes de que cargue el anuncio (CLS fix).
 */
export default function AdsterraBanner() {
  const [mounted, setMounted] = useState(false);
  // Persiste entre los ciclos de mount/unmount del Strict Mode
  const injectedRef = useRef(false);

  // Paso 1: marcar que estamos en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Paso 2: inyectar el script solo cuando el div contenedor ya existe en el DOM
  useEffect(() => {
    if (!mounted) return;

    // Guard 1: Strict Mode — evita segunda ejecución dentro del mismo ciclo
    if (injectedRef.current) return;

    // Guard 2: CSR routing — el script ya fue inyectado en una visita anterior
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      injectedRef.current = true;
      return;
    }

    injectedRef.current = true;

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    // Inyectar antes del </body> para no bloquear el render
    document.body.appendChild(script);

    // No eliminamos el script al desmontar: el DOM del ad ya fue modificado
    // por la red y removerlo causaría errores en el iframe generado.
  }, [mounted]);

  // Mientras estamos en SSR / pre-hidratación no renderizamos nada
  if (!mounted) return null;

  return (
    <div className="flex justify-center items-center overflow-hidden w-full min-h-[120px]">
      <div id={CONTAINER_ID} className="w-full" />
    </div>
  );
}
