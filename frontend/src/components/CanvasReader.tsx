'use client';

import { useEffect, useRef } from 'react';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl, scrambleMap, userId }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadedRef.current === imageUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    loadedRef.current = imageUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;

      // Dibujar imagen completa sin seams — la protección es el token, no el scramble visual
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Marca de agua invisible — dinámica por usuario
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.fillStyle   = '#ffffff';
      ctx.font        = '14px monospace';
      for (let y = 80; y < canvas.height; y += 200) {
        for (let x = 40; x < canvas.width; x += 300) {
          ctx.fillText(`Crimson Scan · ${userId}`, x, y);
        }
      }
      ctx.restore();

      // Bloquear context menu del canvas
      canvas.addEventListener('contextmenu', e => e.preventDefault(), { passive: false });
    };
  }, [imageUrl, scrambleMap, userId]);

  return (
    <div
      className="relative w-full flex justify-center"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="max-w-full shadow-xl border border-gray-800"
        style={{
          userSelect:         'none',
          WebkitUserSelect:   'none',
          pointerEvents:      'none',   // bloquea drag, copy, devtools pick
          touchAction:        'pan-y',
        }}
        draggable={false}
      />
      {/* Overlay para capturar long-press en móvil sin exponer el canvas */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      />
    </div>
  );
};

export default CanvasPageRenderer;
