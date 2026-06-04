'use client';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl }: Props) => {
  return (
    <div
      className="relative w-full flex justify-center"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <img
        src={imageUrl}
        alt=""
        className="max-w-full shadow-xl border border-gray-800 block"
        style={{
          userSelect:       'none',
          WebkitUserSelect: 'none',
          pointerEvents:    'none',
          touchAction:      'pan-y',
          draggable:        false,
        } as React.CSSProperties}
        draggable={false}
      />
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
