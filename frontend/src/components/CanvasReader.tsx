'use client';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl }: Props) => {
  return (
    <div
      className="w-full"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <div className="relative w-full">
        <img
          src={imageUrl}
          alt=""
          className="w-full h-auto block"
          style={{
            userSelect:       'none',
            WebkitUserSelect: 'none',
            pointerEvents:    'none',
            touchAction:      'pan-y',
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
