'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface NovelReaderProps {
  text: string;
}

export default function NovelReader({ text }: NovelReaderProps) {
  const [theme, setTheme]         = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontSize, setFontSize]   = useState<number>(18);
  const [panelOpen, setPanelOpen] = useState(false);
  const [visible, setVisible]     = useState(true);

  // Dragging state
  const btnRef       = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);
  const dragOffset   = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const didDrag      = useRef(false);

  // Scroll hide logic
  const lastScrollY  = useRef(0);
  const scrollTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('crimson_novel_theme');
    const savedSize  = localStorage.getItem('crimson_novel_fontsize');
    if (savedTheme) setTheme(savedTheme as any);
    if (savedSize)  setFontSize(parseInt(savedSize, 10));
  }, []);

  // Initial position — bottom-right corner
  useEffect(() => {
    if (pos === null) {
      setPos({ x: window.innerWidth - 72, y: window.innerHeight - 140 });
    }
  }, [pos]);

  // Hide on scroll, show after stop
  useEffect(() => {
    const onScroll = () => {
      const cur = window.scrollY;
      if (Math.abs(cur - lastScrollY.current) > 5) {
        setVisible(false);
        setPanelOpen(false);
      }
      lastScrollY.current = cur;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setVisible(true), 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  // ── Drag logic (mouse + touch) ──────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!btnRef.current) return;
    dragging.current = true;
    didDrag.current  = false;
    const rect = btnRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    btnRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    didDrag.current = true;
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    const maxX = window.innerWidth  - 56;
    const maxY = window.innerHeight - 56;
    setPos({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
    // If the user just tapped (no drag), toggle panel
    if (!didDrag.current) setPanelOpen(p => !p);
  }, []);

  // ── Theme & size ────────────────────────────────────────────
  const changeTheme = (t: 'dark' | 'sepia' | 'light') => {
    setTheme(t);
    localStorage.setItem('crimson_novel_theme', t);
  };

  const changeSize = (diff: number) => {
    setFontSize(prev => {
      const nw = Math.max(12, Math.min(prev + diff, 36));
      localStorage.setItem('crimson_novel_fontsize', String(nw));
      return nw;
    });
  };

  const themeConfig = {
    dark:  { wrapper: 'bg-[#111]    text-gray-200',  circle: 'bg-[#1a1a1f] border-gray-700' },
    sepia: { wrapper: 'bg-[#f4ecd8] text-[#5b4636]', circle: 'bg-[#e8d8b8] border-[#c8a878]' },
    light: { wrapper: 'bg-white     text-gray-900',  circle: 'bg-gray-100   border-gray-300' },
  };
  const cfg = themeConfig[theme];

  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  // Panel position: try to keep inside viewport relative to btn
  const panelStyle = pos ? (() => {
    const btnRight = window.innerWidth - pos.x - 56;
    const above    = pos.y > 260;
    return {
      position: 'fixed' as const,
      right:    Math.max(8, btnRight - 8),
      ...(above
        ? { bottom: window.innerHeight - pos.y + 8 }
        : { top:    pos.y + 64 }),
      zIndex: 60,
    };
  })() : {};

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${cfg.wrapper}`}>

      {/* ── Floating settings button ── */}
      {pos !== null && (
        <div
          ref={btnRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'fixed',
            left: pos.x,
            top:  pos.y,
            zIndex: 55,
            touchAction: 'none',
            transition: dragging.current ? 'none' : 'opacity 0.3s, transform 0.3s',
            opacity:   visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.7)',
            pointerEvents: visible ? 'auto' : 'none',
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <div
            className={`w-14 h-14 rounded-full border-2 shadow-2xl flex items-center justify-center select-none
              ${cfg.circle} ${panelOpen ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-black/50' : ''}`}
          >
            {/* Book / settings icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={theme === 'sepia' ? '#5b4636' : theme === 'light' ? '#374151' : '#e5e7eb'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </div>
        </div>
      )}

      {/* ── Settings panel (popup) ── */}
      {panelOpen && pos !== null && (
        <div
          style={panelStyle}
          className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4 w-[200px] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Theme selector */}
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Tema</p>
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => changeTheme('dark')}
              className={`w-9 h-9 rounded-full bg-[#111] border-2 transition-all ${theme === 'dark' ? 'border-rose-500 scale-110' : 'border-gray-600'}`}
              title="Oscuro"
            />
            <button
              onClick={() => changeTheme('sepia')}
              className={`w-9 h-9 rounded-full bg-[#f4ecd8] border-2 transition-all ${theme === 'sepia' ? 'border-rose-500 scale-110' : 'border-gray-400'}`}
              title="Sepia"
            />
            <button
              onClick={() => changeTheme('light')}
              className={`w-9 h-9 rounded-full bg-white border-2 transition-all ${theme === 'light' ? 'border-rose-500 scale-110' : 'border-gray-300'}`}
              title="Claro"
            />
          </div>

          {/* Font size */}
          <div className="h-px bg-white/10 mb-3" />
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Tamaño</p>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => changeSize(-2)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold text-sm transition-colors flex items-center justify-center"
            >A-</button>
            <span className="text-white text-sm font-mono tabular-nums">{fontSize}px</span>
            <button
              onClick={() => changeSize(2)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold text-sm transition-colors flex items-center justify-center"
            >A+</button>
          </div>

          {/* Drag hint */}
          <p className="text-gray-600 text-[10px] text-center mt-4">Arrastrá el botón para moverlo</p>
        </div>
      )}

      {/* ── Novel text ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }} className="mb-6 font-serif">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
