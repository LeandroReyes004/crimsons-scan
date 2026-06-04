'use client';

import { useState } from 'react';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl }: Props) => {
  const [nativeWidth, setNativeWidth] = useState<number | null>(null);

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
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto block"
          onLoad={e => setNativeWidth(e.currentTarget.naturalWidth)}
          style={{
            userSelect:       'none',
            WebkitUserSelect: 'none',
            pointerEvents:    'none',
            touchAction:      'pan-y',
            imageRendering:   'auto',
          } as React.CSSProperties}
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
