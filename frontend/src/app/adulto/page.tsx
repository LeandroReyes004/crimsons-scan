'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import MangaCard from '@/components/MangaCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const STORAGE_KEY = 'cs_age_confirmed';

interface Manga {
  id: string; titulo: string; generos: string; estado: string; tipo: string;
  views_total: number; cover_r2_key: string | null; fecha_actualizacion: string;
  ultimo_capitulo: number | null; ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null;
}

export default function AdultoPage() {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [mangas, setMangas]       = useState<Manga[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setConfirmed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    fetch(`${API}/api/mangas/adulto`)
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []))
      .finally(() => setLoading(false));
  }, [confirmed]);

  if (confirmed === null) return null;

  if (!confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0c] p-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-8 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
            <ShieldAlert size={32} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold mb-2">Contenido +18</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Esta sección contiene contenido para adultos. Al continuar confirmás que tenés 18 años o más.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setConfirmed(true); }}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Tengo 18 años o más — Entrar
            </button>
            <Link href="/" className="w-full text-center text-gray-500 hover:text-white text-sm py-2 transition">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-10 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">+18</span>
            <h1 className="text-2xl font-bold text-white">Contenido Adulto</h1>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-white/10 rounded-xl mb-2" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : mangas.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <ShieldAlert size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No hay contenido +18 publicado aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mangas.map((m, i) => {
              const tags = m.generos ? (() => { try { return JSON.parse(m.generos); } catch { return []; } })() : [];
              return (
                <MangaCard
                  key={m.id}
                  id={m.id}
                  title={m.titulo}
                  imageUrl={m.cover_r2_key ? `https://scancrimson.com/r2/${m.cover_r2_key}` : ''}
                  chapter={m.ultimo_capitulo ? `Cap. ${m.ultimo_capitulo}` : null}
                  chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.id}/chapter/${m.ultimo_capitulo_id}` : null}
                  updatedAt={m.ultimo_cap_fecha || m.fecha_actualizacion}
                  tags={tags}
                  isHot={m.views_total > 1000}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
