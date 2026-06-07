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
        style={{ maxWidth: nativeWidth ? `${nativeWidth}px` : '100%', minHeight: loaded ? undefined : '60vh' }}
      >
        {!loaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse rounded-sm" />
        )}
        <img
          src={imageUrl}
          alt=""
          decoding="async"
          className="w-full h-auto block transition-opacity duration-300"
          style={{
            opacity:          loaded ? 1 : 0,
            userSelect:       'none',
            WebkitUserSelect: 'none',
            pointerEvents:    'none',
            touchAction:      'pan-y',
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
