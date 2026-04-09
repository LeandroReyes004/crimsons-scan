'use client';
import { useEffect, useRef } from 'react';

interface ScrambledPageProps {
  imageUrl: string; 
  scrambleMap: number[]; // Ej: [3, 1, 0, 5, 2, 4, 8, 7, 6] (las posiciones originales)
  userId: string; // Para inyectar la marca de agua dinámica
}

const CanvasPageRenderer = ({ imageUrl, scrambleMap, userId }: ScrambledPageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    // Bloqueamos el contexto de lectura para que no lo exporten fácilmente
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Configuramos el Canvas a tamaño original
      canvas.width = img.width;
      canvas.height = img.height;

      // Supongamos una cuadrícula de 3x3 por simplicidad
      const cols = 3;
      const rows = 3;
      const tileWidth = img.width / cols;
      const tileHeight = img.height / rows;

      // Dibujar rearmando la imagen según el scrambleMap
      for (let i = 0; i < scrambleMap.length; i++) {
        // Posición actual de la ficha en la imagen revuelta
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const currentX = Math.floor(col * tileWidth);
        const currentY = Math.floor(row * tileHeight);
        const nextX = Math.floor((col + 1) * tileWidth);
        const nextY = Math.floor((row + 1) * tileHeight);
        
        const strictTileW = nextX - currentX;
        const strictTileH = nextY - currentY;

        // Posición original de donde venía ("donde debe ir")
        const originalPos = scrambleMap[i];
        const origCol = originalPos % cols;
        const origRow = Math.floor(originalPos / cols);
        
        const destX = Math.floor(origCol * tileWidth);
        const destY = Math.floor(origRow * tileHeight);
        const destNextX = Math.floor((origCol + 1) * tileWidth);
        const destNextY = Math.floor((origRow + 1) * tileHeight);
        
        const strictDestW = destNextX - destX;
        const strictDestH = destNextY - destY;

        // Evitar el suavizado de bordes para que no se vea la rejilla
        ctx.imageSmoothingEnabled = false;

        // Sobredibujamos 1 pixel extra (0.5 o 1) si es necesario (overscan), pero con el floor/ceil usualmente basta
        // Le damos un pequeño "ajuste" sumándole 0.5 pixeles a la dimensión de dibujo para tapar microfisuras del anti-aliasing del navegador
        ctx.drawImage(img, currentX, currentY, strictTileW, strictTileH, destX, destY, strictDestW + 0.5, strictDestH + 0.5);
      }

      // 💧 Inyectar Marca de Agua Dinámica Invisible / Estilizada
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'; // Casi invisible
      // Agregarla en múltiples partes para evitar recortes simples
      ctx.fillText(`Crimson Scan - UID: ${userId} - IPs Tracked`, 50, 50);
      ctx.fillText(`Crimson Scan - UID: ${userId} - IPs Tracked`, canvas.width / 2, canvas.height - 50);

      // Bloquear click derecho en el canvas (Anti-guardado simple)
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [imageUrl, scrambleMap, userId]);

  return (
    <div className="relative w-full flex justify-center">
      {/* Disable pointer events at CSS level partially, but allow canvas actions if needed */}
      <canvas 
        ref={canvasRef} 
        className="max-w-full select-none shadow-xl border border-gray-800" 
        style={{ pointerEvents: 'auto' }} 
      />
      {/* Overlay transparente para bloquear interacción táctil prolongada de guardar */}
      <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()}></div>
    </div>
  );
};

export default CanvasPageRenderer;
