'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Users, BookOpen, Globe } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Scan {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  miembros: number;
  total_mangas: number;
}

export default function ComunidadPage() {
  const [scans, setScans]     = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/scans`)
      .then(r => r.json())
      .then(d => setScans(d.scans || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
            <ChevronLeft size={18}/>
          </Link>
          <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
        </div>
        <ThemeToggle />
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Título */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Globe size={12}/> Comunidad
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Scans de la comunidad</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            Todos los grupos de traducción y scanlation que forman parte de CrimsonScan.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse h-64"/>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No hay scans registrados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans.map(scan => (
              <Link key={scan.id} href={`/scan/${scan.id}`}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#111115] border border-gray-200 dark:border-white/5 hover:border-rose-500/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">

                {/* Banner / imagen */}
                <div className="relative h-40 bg-gradient-to-br from-rose-900/30 to-[#111] overflow-hidden">
                  {scan.imagen_url ? (
                    <img
                      src={`${API}/api/scan-image/${scan.id}`}
                      alt={scan.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl font-black text-white/10 select-none group-hover:text-white/20 transition">
                        {scan.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                  <div className="absolute bottom-3 left-4">
                    <h2 className="text-white font-extrabold text-lg leading-tight drop-shadow">{scan.nombre}</h2>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  {scan.descripcion && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                      {scan.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-auto pt-2 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <BookOpen size={13} className="text-rose-400"/>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{scan.total_mangas}</span>
                      <span>obras</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users size={13} className="text-sky-400"/>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{scan.miembros}</span>
                      <span>miembros</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
