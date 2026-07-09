'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, Send, ShieldAlert } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface CapInfo {
  id: string; numero: number; titulo: string | null; manga_id: string; manga_tipo?: string;
  prev_chapter_id: string | null; next_chapter_id: string | null;
}

export default function ChapterLockedPage() {
  const { id: mangaId, chapterId } = useParams() as { id: string; chapterId: string };
  const [capInfo, setCapInfo] = useState<CapInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    // Fetch basic info just to show the title and number, we don't need the pages
    fetch(`${API}/api/chapters/${chapterId}/pages`)
      .then(r => r.json())
      .then(d => {
        if (d.capitulo) setCapInfo(d.capitulo);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chapterId]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href={`/manga/reader/${mangaId}`}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
          <ChevronLeft size={18}/> <span>Volver a la obra</span>
        </Link>
      </div>

      <div className="z-10 w-full max-w-md bg-white/[0.02] border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="w-20 h-20 bg-gradient-to-tr from-rose-600 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-rose-600/20">
          <Lock className="text-white w-10 h-10" />
        </div>

        <h1 className="text-2xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Capítulo Protegido
        </h1>
        
        {loading ? (
          <div className="h-6 w-32 bg-white/10 animate-pulse rounded-lg mb-4" />
        ) : (
          <p className="text-rose-400 font-semibold mb-6">
            Capítulo {capInfo?.numero} {capInfo?.titulo ? `- ${capInfo.titulo}` : ''}
          </p>
        )}

        <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-2xl mb-8 flex items-start gap-3 text-left">
          <ShieldAlert className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-200/80 leading-relaxed">
            Para evitar reclamos de DMCA y robo de bots, este capítulo <strong>solo está disponible a través de nuestro canal de Telegram</strong>.
          </p>
        </div>

        <a 
          href="https://t.me/Crimson_scan1" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#2AABEE]/25 mb-4"
        >
          <Send size={20} />
          <span>Abrir Telegram</span>
        </a>

        <p className="text-xs text-gray-500">
          El bot publica un link privado ("Fortificado") cada vez que sale un capítulo. Solo dale click allí para leerlo.
        </p>

      </div>
    </div>
  );
}
