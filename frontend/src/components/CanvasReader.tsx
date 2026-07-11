'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl, scrambleMap, userId }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          // Ajustar resolución interna del canvas al tamaño real de la imagen
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Dibujar imagen original
          ctx.drawImage(img, 0, 0);

          // --- MARCA DE AGUA INVISIBLE (FORENSE) ---
          ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'; 
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Rotar el canvas para un patrón diagonal
          ctx.rotate(-Math.PI / 6); 
          
          // Dibujar repetidamente por toda la imagen
          const stepX = 400;
          const stepY = 300;
          for (let x = -img.width; x < img.width * 2; x += stepX) {
            for (let y = -img.height; y < img.height * 2; y += stepY) {
              ctx.fillText(`CrimsonScan | UID: ${userId}`, x, y);
            }
          }
          
          // Restaurar estado del canvas
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          
          URL.revokeObjectURL(url);
          setLoaded(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          setError(true);
          setLoaded(true);
        };
        img.src = url;
      })
      .catch(() => {
        setError(true);
        setLoaded(true);
      });
  }, [imageUrl, userId]);

  return (
    <div
      className="w-full flex justify-center"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <div className="relative w-full" style={{ minHeight: loaded ? undefined : '60vh' }}>
        {!loaded && !error && (
          <div className="absolute inset-0 bg-white/5 animate-pulse rounded-sm" />
        )}
        {error && (
          <div className="w-full h-64 flex items-center justify-center text-gray-500 bg-white/5 border border-red-900/30 rounded-lg">
            Error al cargar página protegida.
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="w-full h-auto block transition-opacity duration-300"
          style={{
            opacity:          loaded && !error ? 1 : 0,
            userSelect:       'none',
            WebkitUserSelect: 'none',
            pointerEvents:    'none', // El usuario interactúa con la capa invisible superior
            touchAction:      'pan-y',
          }}
        />

        {/* Capa transparente arriba para bloquear el guardado de imagen/canvas */}
        <div
          className="absolute inset-0 z-10 select-none"
          onContextMenu={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
        />
      </div>
    </div>
  );
};

export default CanvasPageRenderer;
