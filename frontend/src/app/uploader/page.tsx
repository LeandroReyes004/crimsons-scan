'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, BookOpen, ChevronLeft, LogOut, Plus, Check, X, Loader2,
  AlertCircle, ImageIcon, Clock, CheckCircle, XCircle, Trash2, ArrowUp, ArrowDown,
} from 'lucide-react';
import { getUser, authHeaders, logout } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga { id: string; titulo: string; tipo: string; estado: string; }
interface Capitulo { id: string; numero: number; titulo: string; estado: string; notas_admin: string | null; fecha_subida: string; num_paginas?: number; }
interface PageFile { file: File; preview: string; order: number; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string; }

export default function UploaderPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setMounted(true);
    if (!u || (u.rol !== 'uploader' && u.rol !== 'admin')) router.push('/');
  }, [router]);

  const [mangas, setMangas]         = useState<Manga[]>([]);
  const [selectedManga, setSelected] = useState<Manga | null>(null);
  const [capitulos, setCapitulos]   = useState<Capitulo[]>([]);
  const [view, setView]             = useState<'mangas' | 'chapters' | 'upload'>('mangas');

  // Estado subida
  const [capNumero, setCapNumero]   = useState('');
  const [capTitulo, setCapTitulo]   = useState('');
  const [pages, setPages]           = useState<PageFile[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [capId, setCapId]           = useState<string | null>(null);
  const [done, setDone]             = useState(false);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Cargar mangas
  useEffect(() => {
    fetch(`${API}/api/mangas`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []));
  }, []);

  // Cargar capítulos del manga seleccionado
  const loadChapters = useCallback(async (manga: Manga) => {
    setSelected(manga);
    const res = await fetch(`${API}/api/admin/mangas/${manga.id}/chapters`, { headers: authHeaders() });
    const d   = await res.json();
    setCapitulos(d.capitulos || []);
    setView('chapters');
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPages: PageFile[] = Array.from(files).map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      order:   pages.length + i + 1,
      status:  'pending',
    }));
    setPages(prev => [...prev, ...newPages]);
  };

  const moveUp   = (i: number) => { if (i === 0) return; const a = [...pages]; [a[i-1], a[i]] = [a[i], a[i-1]]; setPages(a.map((p,j) => ({ ...p, order: j+1 }))); };
  const moveDown = (i: number) => { if (i === pages.length-1) return; const a = [...pages]; [a[i], a[i+1]] = [a[i+1], a[i]]; setPages(a.map((p,j) => ({ ...p, order: j+1 }))); };
  const removePage = (i: number) => setPages(prev => prev.filter((_,j) => j !== i).map((p,j) => ({ ...p, order: j+1 })));

  const handleUpload = async () => {
    if (!capNumero || pages.length === 0 || !selectedManga) return;
    setUploading(true);
    setDone(false);

    try {
      // 1. Crear capítulo
      let currentCapId = capId;
      if (!currentCapId) {
        const res = await fetch(`${API}/api/chapters`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ manga_id: selectedManga.id, numero: parseFloat(capNumero), titulo: capTitulo || null }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        currentCapId = d.capituloId;
        setCapId(currentCapId);
      }

      // 2. Subir página por página (en secuencia para mostrar progreso)
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.status === 'done') continue;

        setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'uploading' } : p));

        const fd = new FormData();
        fd.append('capitulo_id', currentCapId!);
        fd.append('numero', String(page.order));
        fd.append('image', page.file);

        try {
          const res = await fetch(`${API}/api/upload/page`, { method: 'POST', headers: authHeaders(), body: fd });
          const d   = await res.json();
          if (!res.ok) throw new Error(d.error);
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'done' } : p));
        } catch (e: any) {
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'error', error: e.message } : p));
        }
      }

      setDone(true);
      loadChapters(selectedManga);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setPages([]); setCapNumero(''); setCapTitulo(''); setCapId(null); setDone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!mounted || !user) return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0d0d10] border-b border-gray-200 dark:border-white/5 h-14 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {view !== 'mangas' && (
            <button onClick={() => { setView(view === 'upload' ? 'chapters' : 'mangas'); resetUpload(); }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
              <ChevronLeft size={18}/>
            </button>
          )}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-xs">CS</div>
          <div>
            <p className="font-bold text-sm dark:text-white leading-tight">
              {view === 'mangas' ? 'Mis Proyectos' : view === 'chapters' ? selectedManga?.titulo : 'Subir Capítulo'}
            </p>
            <p className="text-[10px] text-gray-400">Uploader · {user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.rol === 'admin' && (
            <Link href="/admin" className="text-xs text-gray-500 hover:text-rose-500 transition flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
              Panel Admin
            </Link>
          )}
          <button onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
            <LogOut size={14}/> Salir
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Vista: Lista de mangas ────────────────── */}
        {view === 'mangas' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold dark:text-white mb-2">Mis Proyectos</h2>
            <p className="text-gray-500 text-sm mb-6">Seleccioná una obra para gestionar sus capítulos.</p>

            {mangas.length === 0 ? (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
                <BookOpen size={40} className="mb-3 opacity-30"/>
                <p className="font-medium">No hay mangas disponibles</p>
                <p className="text-sm">El admin debe crear las obras primero</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mangas.map(m => (
                  <button key={m.id} onClick={() => loadChapters(m)}
                    className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5 flex items-center justify-between hover:border-rose-300 dark:hover:border-rose-500/30 hover:shadow-md transition-all text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center text-rose-500">
                        <BookOpen size={20}/>
                      </div>
                      <div>
                        <p className="font-bold dark:text-white group-hover:text-rose-500 transition">{m.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.tipo}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      m.estado === 'en_curso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                    }`}>{m.estado}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Vista: Lista de capítulos ─────────────── */}
        {view === 'chapters' && selectedManga && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold dark:text-white">{selectedManga.titulo}</h2>
                <p className="text-gray-500 text-sm">{capitulos.length} capítulos</p>
              </div>
              <button onClick={() => { resetUpload(); setView('upload'); }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-rose-600/20">
                <Plus size={16}/> Nuevo Capítulo
              </button>
            </div>

            {capitulos.length === 0 ? (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
                <Upload size={40} className="mb-3 opacity-30"/>
                <p className="font-medium">Sin capítulos aún</p>
                <p className="text-sm">Hacé click en "Nuevo Capítulo" para empezar</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {capitulos.map((cap, i) => (
                  <div key={cap.id} className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                    <div className={`p-2 rounded-xl ${
                      cap.estado === 'publicado' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                      cap.estado === 'rechazado' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                      'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                    }`}>
                      {cap.estado === 'publicado' ? <CheckCircle size={16}/> : cap.estado === 'rechazado' ? <XCircle size={16}/> : <Clock size={16}/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm dark:text-white">
                        Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(cap.fecha_subida).toLocaleDateString('es')} · {cap.num_paginas ?? 0} páginas</p>
                      {cap.estado === 'rechazado' && cap.notas_admin && (
                        <div className="flex items-start gap-1.5 mt-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs px-2.5 py-1.5 rounded-lg">
                          <AlertCircle size={11} className="mt-0.5 shrink-0"/> {cap.notas_admin}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cap.estado === 'publicado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      cap.estado === 'rechazado' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>{cap.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Vista: Subir capítulo ─────────────────── */}
        {view === 'upload' && selectedManga && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold dark:text-white mb-1">Nuevo Capítulo</h2>
            <p className="text-gray-500 text-sm mb-6">{selectedManga.titulo}</p>

            {done ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-8 flex flex-col items-center gap-4">
                <CheckCircle size={48} className="text-emerald-500"/>
                <div className="text-center">
                  <p className="font-bold text-lg dark:text-white">¡Capítulo enviado a revisión!</p>
                  <p className="text-sm text-gray-500 mt-1">El admin lo revisará y publicará pronto.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetUpload}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition">
                    <Plus size={16}/> Subir otro capítulo
                  </button>
                  <button onClick={() => setView('chapters')}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                    Ver capítulos
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Info del capítulo */}
                <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
                  <h3 className="font-bold dark:text-white mb-4 text-sm uppercase tracking-wide text-gray-500">Información del Capítulo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500">Número *</label>
                      <input type="number" step="0.1" value={capNumero} onChange={e => setCapNumero(e.target.value)} placeholder="Ej: 1 o 1.5"
                        className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500">Título (opcional)</label>
                      <input type="text" value={capTitulo} onChange={e => setCapTitulo(e.target.value)} placeholder="Ej: El despertar"
                        className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
                    </div>
                  </div>
                </div>

                {/* Zona drag & drop */}
                <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
                  <h3 className="font-bold dark:text-white mb-4 text-sm uppercase tracking-wide text-gray-500">Páginas ({pages.length})</h3>

                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-rose-400 dark:hover:border-rose-500/50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                      <ImageIcon size={22}/>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm dark:text-white">Arrastrá las imágenes aquí</p>
                      <p className="text-xs text-gray-400 mt-1">o hacé click para seleccionar · JPG, PNG, WebP</p>
                    </div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)}/>
                  </div>

                  {/* Preview de páginas */}
                  {pages.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {pages.map((page, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">
                          <img src={page.preview} alt="" className="w-8 h-10 object-cover rounded-lg shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold dark:text-white truncate">{String(page.order).padStart(3,'0')} — {page.file.name}</p>
                            <p className="text-[10px] text-gray-400">{(page.file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {page.status === 'uploading' && <Loader2 size={14} className="animate-spin text-blue-500"/>}
                            {page.status === 'done'      && <Check size={14} className="text-emerald-500"/>}
                            {page.status === 'error'     && <span title={page.error}><X size={14} className="text-red-500"/></span>}
                            {page.status === 'pending'   && <>
                              <button onClick={() => moveUp(i)} className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white transition"><ArrowUp size={12}/></button>
                              <button onClick={() => moveDown(i)} className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white transition"><ArrowDown size={12}/></button>
                              <button onClick={() => removePage(i)} className="p-1 rounded text-gray-400 hover:text-red-500 transition"><Trash2 size={12}/></button>
                            </>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progreso general */}
                {uploading && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin text-blue-500 shrink-0"/>
                    <div className="flex-1">
                      <p className="text-sm font-semibold dark:text-white">Subiendo páginas...</p>
                      <div className="mt-2 bg-blue-100 dark:bg-blue-500/20 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(pages.filter(p => p.status === 'done').length / pages.length) * 100}%` }}/>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{pages.filter(p => p.status === 'done').length} / {pages.length} páginas</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading || !capNumero || pages.length === 0}
                  className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                  {uploading ? <><Loader2 size={20} className="animate-spin"/> Subiendo...</> : <><Upload size={20}/> Enviar a Revisión</>}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
