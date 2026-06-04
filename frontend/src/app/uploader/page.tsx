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

interface Manga    { id: string; titulo: string; tipo: string; estado: string; }
interface Capitulo { id: string; numero: number; titulo: string; estado: string; notas_admin: string | null; fecha_subida: string; num_paginas?: number; }
interface PageFile { file: File; preview: string; order: number; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string; }

export default function UploaderPage() {
  const router = useRouter();
  const [user, setUser]   = useState<ReturnType<typeof getUser>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setMounted(true);
    if (!u || (u.rol !== 'uploader' && u.rol !== 'admin' && u.rol !== 'admin_scan' && !u.is_superadmin)) router.push('/');
  }, [router]);

  const [mangas, setMangas]          = useState<Manga[]>([]);
  const [selectedManga, setSelected] = useState<Manga | null>(null);
  const [capitulos, setCapitulos]    = useState<Capitulo[]>([]);
  const [view, setView]              = useState<'mangas' | 'chapters' | 'upload'>('mangas');

  const [capNumero, setCapNumero]   = useState('');
  const [capTitulo, setCapTitulo]   = useState('');
  const [fechaPub, setFechaPub]     = useState('');
  const [pages, setPages]           = useState<PageFile[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [capId, setCapId]           = useState<string | null>(null);
  const [capEstado, setCapEstado]   = useState<string | null>(null);
  const [done, setDone]             = useState(false);
  const [dupError, setDupError]     = useState('');
  const [createError, setCreateError] = useState('');
  const fileInputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/mangas`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []));
  }, []);

  const loadChapters = useCallback(async (manga: Manga) => {
    setSelected(manga);
    const res = await fetch(`${API}/api/admin/mangas/${manga.id}/chapters`, { headers: authHeaders() });
    const d   = await res.json();
    setCapitulos(d.capitulos || []);
    setView('chapters');
  }, []);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: PageFile[] = [];
    const rejected: string[] = [];
    Array.from(files).forEach((file, i) => {
      if (!ALLOWED_TYPES.includes(file.type)) { rejected.push(file.name); return; }
      if (file.size > 10 * 1024 * 1024) { rejected.push(`${file.name} (supera 10MB)`); return; }
      valid.push({ file, preview: URL.createObjectURL(file), order: pages.length + i + 1, status: 'pending' });
    });
    if (rejected.length > 0) alert(`Archivos rechazados (solo JPG, PNG, WebP hasta 10MB):\n${rejected.join('\n')}`);
    setPages(prev => [...prev, ...valid]);
  };

  const moveUp   = (i: number) => { if (i === 0) return; const a = [...pages]; [a[i-1], a[i]] = [a[i], a[i-1]]; setPages(a.map((p,j) => ({ ...p, order: j+1 }))); };
  const moveDown = (i: number) => { if (i === pages.length-1) return; const a = [...pages]; [a[i], a[i+1]] = [a[i+1], a[i]]; setPages(a.map((p,j) => ({ ...p, order: j+1 }))); };
  const removePage = (i: number) => setPages(prev => prev.filter((_,j) => j !== i).map((p,j) => ({ ...p, order: j+1 })));

  const handleUpload = async () => {
    if (!capNumero || pages.length === 0 || !selectedManga) return;
    setDupError(''); setCreateError('');

    const num = parseFloat(capNumero);
    if (capitulos.some(c => c.numero === num)) {
      setDupError(`Ya existe el capítulo ${num}. Usá otro número.`);
      return;
    }

    setUploading(true);
    setDone(false);

    try {
      let currentCapId = capId;
      if (!currentCapId) {
        const res = await fetch(`${API}/api/chapters`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ manga_id: selectedManga.id, numero: num, titulo: capTitulo || null, fecha_publicacion: fechaPub || null }),
        });
        const d = await res.json();
        if (!res.ok) { setCreateError(d.error || 'Error al crear el capítulo'); setUploading(false); return; }
        currentCapId = d.capituloId;
        setCapId(currentCapId);
        setCapEstado(d.estado);
      }

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
          if (!res.ok) throw new Error(d.error || 'Error al subir');
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'done' } : p));
        } catch (e: any) {
          const msg = e.message?.includes('fetch') ? 'Sin conexión' : e.message;
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'error', error: msg } : p));
        }
      }
      setDone(true);
      loadChapters(selectedManga);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setPages([]); setCapNumero(''); setCapTitulo(''); setFechaPub('');
    setCapId(null); setCapEstado(null); setDone(false); setDupError(''); setCreateError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const donePages  = pages.filter(p => p.status === 'done').length;
  const errorPages = pages.filter(p => p.status === 'error').length;
  const progress   = pages.length > 0 ? Math.round((donePages / pages.length) * 100) : 0;

  if (!mounted || !user) return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0d0d10] border-b border-gray-200 dark:border-white/5 h-14 px-4 flex items-center justify-between shadow-sm gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {view !== 'mangas' && (
            <button onClick={() => { setView(view === 'upload' ? 'chapters' : 'mangas'); resetUpload(); }}
              className="p-2 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shrink-0">
              <ChevronLeft size={18}/>
            </button>
          )}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0">CS</div>
          <div className="min-w-0">
            <p className="font-bold text-sm dark:text-white leading-tight truncate">
              {view === 'mangas' ? 'Mis Proyectos' : view === 'chapters' ? selectedManga?.titulo : 'Subir Capítulo'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') && (
            <Link href="/admin" className="text-xs text-gray-500 hover:text-rose-500 transition px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 hidden sm:flex items-center gap-1">
              Admin
            </Link>
          )}
          <button onClick={() => { logout(); router.push('/'); }}
            className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <LogOut size={16}/>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-6 sm:px-4 sm:py-8">

        {/* ── Mis Proyectos ──────────────────────────────── */}
        {view === 'mangas' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold dark:text-white mb-1">Mis Proyectos</h2>
            <p className="text-gray-500 text-sm mb-5">Tocá una obra para ver sus capítulos.</p>

            {mangas.length === 0 ? (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400 px-4 text-center">
                <BookOpen size={40} className="mb-3 opacity-30"/>
                <p className="font-medium">No tenés obras asignadas</p>
                <p className="text-sm mt-1">El admin debe asignarte un scan con obras</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mangas.map(m => (
                  <button key={m.id} onClick={() => loadChapters(m)}
                    className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4 hover:border-rose-300 dark:hover:border-rose-500/30 active:scale-[0.98] transition-all text-left w-full">
                    <div className="w-10 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center text-rose-500 shrink-0">
                      <BookOpen size={18}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm dark:text-white truncate">{m.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{m.tipo}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      m.estado === 'en_curso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                    }`}>{m.estado}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lista de capítulos ──────────────────────────── */}
        {view === 'chapters' && selectedManga && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold dark:text-white truncate">{selectedManga.titulo}</h2>
                <p className="text-gray-500 text-sm">{capitulos.length} capítulos</p>
              </div>
              <button onClick={() => { resetUpload(); setView('upload'); }}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-rose-600/20 shrink-0 active:scale-95">
                <Plus size={16}/> Nuevo
              </button>
            </div>

            {capitulos.length === 0 ? (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-14 text-gray-400">
                <Upload size={36} className="mb-3 opacity-30"/>
                <p className="font-medium text-sm">Sin capítulos aún</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {capitulos.map((cap, i) => (
                  <div key={cap.id} className={`flex items-center gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                    <div className={`p-2 rounded-xl shrink-0 ${
                      cap.estado === 'publicado' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                      cap.estado === 'rechazado' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                      'bg-amber-50 dark:bg-amber-500/10 text-amber-500'
                    }`}>
                      {cap.estado === 'publicado' ? <CheckCircle size={15}/> : cap.estado === 'rechazado' ? <XCircle size={15}/> : <Clock size={15}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm dark:text-white truncate">
                        Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}
                      </p>
                      <p className="text-xs text-gray-400">{cap.num_paginas ?? 0} pág · {new Date(cap.fecha_subida).toLocaleDateString('es')}</p>
                      {cap.estado === 'rechazado' && cap.notas_admin && (
                        <div className="flex items-start gap-1 mt-1 text-red-500 text-xs">
                          <AlertCircle size={10} className="mt-0.5 shrink-0"/> <span className="truncate">{cap.notas_admin}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      cap.estado === 'publicado'  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      cap.estado === 'programado' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                      cap.estado === 'rechazado'  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>{cap.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Subir capítulo ──────────────────────────────── */}
        {view === 'upload' && selectedManga && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">

            {/* Éxito */}
            {done && capId && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle size={40} className="text-emerald-500"/>
                <div>
                  <p className="font-extrabold text-lg dark:text-white">
                    {capEstado === 'programado' ? '¡Capítulo programado!' : '¡Capítulo publicado!'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {capEstado === 'programado'
                      ? `Se publicará el ${new Date(fechaPub).toLocaleString('es')}`
                      : 'Ya visible para los lectores'}
                  </p>
                  {errorPages > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{errorPages} página(s) fallaron — podés reintentarlas</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-1">
                  <Link href={`/manga/reader/${selectedManga.id}/chapter/${capId}`} target="_blank"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition active:scale-95">
                    👁 Ver capítulo
                  </Link>
                  <button onClick={resetUpload}
                    className="text-sm font-bold text-gray-600 dark:text-gray-300 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-rose-300 transition active:scale-95">
                    + Subir otro
                  </button>
                </div>
              </div>
            )}

            {/* Formulario */}
            {!done && (
              <>
                {/* Info capítulo */}
                <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Capítulo de: <span className="text-rose-500">{selectedManga.titulo}</span></p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500">Número *</label>
                        <input type="number" step="0.1" inputMode="decimal" value={capNumero}
                          onChange={e => { setCapNumero(e.target.value); setDupError(''); }}
                          placeholder="1"
                          className={`bg-gray-50 dark:bg-black/30 border px-3 py-3 rounded-xl text-base dark:text-white focus:border-rose-500 outline-none ${dupError ? 'border-red-400' : 'border-gray-200 dark:border-white/10'}`}/>
                        {dupError && <p className="text-xs text-red-500">{dupError}</p>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500">Título (opcional)</label>
                        <input type="text" value={capTitulo} onChange={e => setCapTitulo(e.target.value)} placeholder="El despertar"
                          className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-base dark:text-white focus:border-rose-500 outline-none"/>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500">📅 Publicar en (vacío = ahora)</label>
                      <input type="datetime-local" value={fechaPub} onChange={e => setFechaPub(e.target.value)}
                        min={new Date().toISOString().slice(0,16)}
                        className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none"/>
                    </div>

                    {createError && (
                      <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-xl">
                        {createError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Páginas */}
                <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Páginas ({pages.length})</p>
                    {pages.length > 0 && (
                      <button onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-rose-500 font-bold flex items-center gap-1">
                        <Plus size={12}/> Agregar más
                      </button>
                    )}
                  </div>

                  {/* Zona seleccionar */}
                  {pages.length === 0 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl py-10 flex flex-col items-center gap-3 hover:border-rose-400 dark:hover:border-rose-500/50 active:scale-[0.98] transition-all"
                    >
                      <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                        <ImageIcon size={26}/>
                      </div>
                      <div className="text-center px-4">
                        <p className="font-bold text-sm dark:text-white">Tocá para seleccionar imágenes</p>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP · máx. 10MB por imagen</p>
                      </div>
                    </button>
                  )}

                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handleFiles(e.target.files)}/>

                  {/* Lista de páginas */}
                  {pages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {pages.map((page, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">
                          {/* Thumbnail */}
                          <img src={page.preview} alt="" className="w-9 h-12 object-cover rounded-lg shrink-0"/>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold dark:text-white">
                              Pág. {String(page.order).padStart(3,'0')}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{page.file.name}</p>
                            {page.status === 'error' && (
                              <p className="text-[10px] text-red-500 truncate">{page.error}</p>
                            )}
                          </div>

                          {/* Estado / Acciones */}
                          <div className="flex items-center gap-1 shrink-0">
                            {page.status === 'uploading' && <Loader2 size={16} className="animate-spin text-blue-500"/>}
                            {page.status === 'done'      && <Check size={16} className="text-emerald-500"/>}
                            {page.status === 'error'     && <X size={16} className="text-red-500"/>}
                            {page.status === 'pending'   && (
                              <>
                                <button onClick={() => moveUp(i)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition active:scale-90">
                                  <ArrowUp size={14}/>
                                </button>
                                <button onClick={() => moveDown(i)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition active:scale-90">
                                  <ArrowDown size={14}/>
                                </button>
                                <button onClick={() => removePage(i)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-90">
                                  <Trash2 size={14}/>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progreso */}
                {uploading && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold dark:text-white">Subiendo...</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-500/20 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}/>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">{donePages} de {pages.length} páginas</p>
                  </div>
                )}

                {/* Botón principal */}
                <button
                  onClick={handleUpload}
                  disabled={uploading || !capNumero || pages.length === 0}
                  className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3 text-base active:scale-[0.98]"
                >
                  {uploading
                    ? <><Loader2 size={20} className="animate-spin"/> Subiendo {progress}%</>
                    : fechaPub
                      ? <><Clock size={20}/> Programar publicación</>
                      : <><Upload size={20}/> Publicar ahora</>}
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
