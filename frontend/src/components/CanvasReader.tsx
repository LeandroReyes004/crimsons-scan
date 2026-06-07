'use client';

import { useState } from 'react';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl }: Props) => {
  const [nativeWidth, setNativeWidth] = useState<number | null>(null);
  const [loaded, setLoaded]           = useState(false);

  return (
    <div
      className="w-full flex justify-center"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <div
        className="relative w-full"
        style={{ maxWidth: nativeWidth ? `${nativeWidth}px` : '100%' }}
      >
        {/* Skeleton mientras carga */}
        {!loaded && (
          <div className="w-full bg-white/5 animate-pulse" style={{ minHeight: '60vh' }} />
        )}

        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-auto block"
          style={{
            display:          loaded ? 'block' : 'none',
            userSelect:       'none',
            WebkitUserSelect: 'none',
            pointerEvents:    'none',
            touchAction:      'pan-y',
            imageRendering:   'auto',
          } as React.CSSProperties}
          onLoad={e => { setNativeWidth(e.currentTarget.naturalWidth); setLoaded(true); }}
          draggable={false}
        />
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
