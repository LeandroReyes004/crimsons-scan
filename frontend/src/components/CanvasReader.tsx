'use client';

interface Props {
  imageUrl:    string;
  scrambleMap: number[];
  userId:      string;
}

const CanvasPageRenderer = ({ imageUrl }: Props) => {
  return (
    <div
      className="w-full flex justify-center"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <div className="relative" style={{ maxWidth: '100%' }}>
        <img
          src={imageUrl}
          alt=""
          className="block"
          style={{
            maxWidth:         '100%',
            height:           'auto',
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
