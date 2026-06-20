'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Layers, BookOpen, Eye } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { useFavorites } from '@/lib/favorites';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga {
  id: string; slug?: string | null; titulo: string; tipo: string; estado: string; cover_r2_key: string | null;
  views_total: number; generos: string; es_adulto: number;
  ultimo_capitulo: number | null; ultimo_capitulo_id: string | null; ultimo_cap_fecha: string | null;
}
interface Scan { id: string; nombre: string; descripcion: string | null; redes?: string | null; }

export default function ScanPage() {
  const { id } = useParams() as { id: string };
  const [scan, setScan]   = useState<Scan | null>(null);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFav, toggle } = useFavorites();

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/scans/${id}`)
      .then(r => r.json())
      .then(d => { setScan(d.scan); setMangas(d.mangas || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-4 sm:px-6 flex items-center gap-3">
        <Link href="/" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
          <ChevronLeft size={20}/>
        </Link>
        <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : !scan ? (
          <div className="flex flex-col items-center py-20 text-gray-500 gap-3">
            <Layers size={40} className="opacity-30"/>
            <p>Scan no encontrado</p>
            <Link href="/" className="text-rose-500 hover:underline text-sm">Volver al inicio</Link>
          </div>
        ) : (
          <>
            {/* Info del scan */}
            <div className="mb-10 flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-rose-600/30 shrink-0">
                {scan.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-rose-400"/>
                  <span className="text-xs text-rose-400 font-semibold uppercase tracking-wide">Grupo de Scan</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">{scan.nombre}</h1>
                {scan.descripcion && <p className="text-gray-400 text-sm mt-2 max-w-xl">{scan.descripcion}</p>}
                
                {(() => {
                  let redesActivas: { name: string; label: string; url: string; icon: React.ReactNode; color: string; }[] = [];
                  if (scan.redes) {
                    try {
                      const parsed = JSON.parse(scan.redes);
                      const config = [
                        {
                          name: 'discord',
                          label: 'Discord',
                          color: 'hover:bg-[#5865F2]/20 hover:text-[#5865F2] hover:border-[#5865F2]/30',
                          icon: (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.873-.894a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.92 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.244.19.372.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.078.078 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.156-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.156-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.156 2.418z"/>
                            </svg>
                          )
                        },
                        {
                          name: 'facebook',
                          label: 'Facebook',
                          color: 'hover:bg-[#1877F2]/20 hover:text-[#1877F2] hover:border-[#1877F2]/30',
                          icon: (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          )
                        },
                        {
                          name: 'twitter',
                          label: 'Twitter / X',
                          color: 'hover:bg-white/10 hover:text-white hover:border-white/20',
                          icon: (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          )
                        },
                        {
                          name: 'instagram',
                          label: 'Instagram',
                          color: 'hover:bg-[#E1306C]/20 hover:text-[#E1306C] hover:border-[#E1306C]/30',
                          icon: (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919c.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                            </svg>
                          )
                        },
                        {
                          name: 'patreon',
                          label: 'Patreon',
                          color: 'hover:bg-[#FF424D]/20 hover:text-[#FF424D] hover:border-[#FF424D]/30',
                          icon: (
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                              <path d="M15.386 0c-4.758 0-8.614 3.856-8.614 8.614c0 4.758 3.856 8.614 8.614 8.614c4.758 0 8.614-3.856 8.614-8.614C24 3.856 20.144 0 15.386 0zM0 24h3.6V0H0v24z"/>
                            </svg>
                          )
                        },
                        {
                          name: 'donations',
                          label: 'Donaciones',
                          color: 'hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30',
                          icon: (
                            <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2a5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                            </svg>
                          )
                        }
                      ];
                      config.forEach(c => {
                        if (parsed[c.name]?.trim()) {
                          redesActivas.push({
                            ...c,
                            url: parsed[c.name].trim()
                          });
                        }
                      });
                    } catch {}
                  }

                  return (
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <p className="text-gray-400 text-xs flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl font-medium shrink-0">
                        <BookOpen size={12} className="text-rose-500"/> {mangas.length} {mangas.length === 1 ? 'obra' : 'obras'}
                      </p>
                      
                      {redesActivas.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {redesActivas.map(red => (
                            <a
                              key={red.name}
                              href={red.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={red.label}
                              className={`flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 hover:scale-105 duration-200 ${red.color}`}
                            >
                              {red.icon}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Grid de mangas */}
            {mangas.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-16 flex flex-col items-center text-gray-500 border border-white/5">
                <BookOpen size={36} className="mb-3 opacity-30"/>
                <p className="font-medium">Este scan no tiene obras publicadas aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {mangas.map((m, i) => {
                  let tags: string[] = [];
                  try { tags = JSON.parse(m.generos || '[]').slice(0, 2); } catch {}
                  return (
                    <MangaCard
                      key={m.id}
                      id={m.id}
                      slug={m.slug}
                      title={m.titulo}
                      imageUrl={m.cover_r2_key ? `${API}/api/cover/${m.id}` : '/portada.jpg'}
                      chapter={m.ultimo_capitulo != null ? String(m.ultimo_capitulo) : null}
                      chapterUrl={m.ultimo_capitulo_id ? `/manga/reader/${m.slug ?? m.id}/chapter/${m.ultimo_capitulo_id}` : null}
                      updatedAt={m.ultimo_cap_fecha}
                      tags={tags}
                      isHot={m.views_total > 1000}
                      isFav={isFav(m.id)}
                      onToggleFav={toggle}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
