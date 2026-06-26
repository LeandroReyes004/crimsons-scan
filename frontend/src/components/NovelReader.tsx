import { useState, useEffect } from 'react';

interface NovelReaderProps {
  text: string;
}

export default function NovelReader({ text }: NovelReaderProps) {
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<number>(18);

  useEffect(() => {
    const savedTheme = localStorage.getItem('crimson_novel_theme');
    const savedSize = localStorage.getItem('crimson_novel_fontsize');
    if (savedTheme) setTheme(savedTheme as any);
    if (savedSize) setFontSize(parseInt(savedSize, 10));
  }, []);

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

  const themeClasses = {
    dark: 'bg-[#111] text-gray-200',
    sepia: 'bg-[#f4ecd8] text-[#5b4636]',
    light: 'bg-white text-gray-900',
  };

  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
      {/* Barra flotante de opciones */}
      <div className="fixed bottom-[80px] right-4 z-50 flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-2xl">
        <div className="flex gap-2 justify-center border-b border-white/10 pb-2">
          <button onClick={() => changeTheme('dark')} className={`w-8 h-8 rounded-full bg-[#111] border-2 ${theme === 'dark' ? 'border-rose-500' : 'border-gray-600'}`} title="Oscuro"></button>
          <button onClick={() => changeTheme('sepia')} className={`w-8 h-8 rounded-full bg-[#f4ecd8] border-2 ${theme === 'sepia' ? 'border-rose-500' : 'border-gray-400'}`} title="Sepia"></button>
          <button onClick={() => changeTheme('light')} className={`w-8 h-8 rounded-full bg-white border-2 ${theme === 'light' ? 'border-rose-500' : 'border-gray-400'}`} title="Claro"></button>
        </div>
        <div className="flex gap-2 justify-between items-center pt-1 px-1">
          <button onClick={() => changeSize(-2)} className="text-white hover:text-rose-500 font-bold px-2 py-1 text-sm bg-white/5 rounded-lg">A-</button>
          <span className="text-white text-xs font-mono">{fontSize}px</span>
          <button onClick={() => changeSize(2)} className="text-white hover:text-rose-500 font-bold px-2 py-1 text-sm bg-white/5 rounded-lg">A+</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }} className="mb-6 font-serif">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
