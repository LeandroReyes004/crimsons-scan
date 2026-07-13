'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, BookOpen, ChevronLeft, LogOut, Plus, Check, X, Loader2,
  AlertCircle, ImageIcon, Clock, CheckCircle, XCircle, Trash2, ArrowUp, ArrowDown,
  Package, FileArchive, Edit3, FileText, Cloud
} from 'lucide-react';
import { getUser, authHeaders, logout } from '@/lib/auth';
import { toWebP } from '@/lib/webp';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga    { id: string; titulo: string; tipo: string; estado: string; }
interface Capitulo { id: string; numero: number; titulo: string; estado: string; notas_admin: string | null; fecha_subida: string; num_paginas?: number; }
interface PageFile { file: File; preview: string; order: number; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string; }

// Capítulo detectado del ZIP
interface BatchChapter {
  folderName: string;
  detectedNum: number;
  userNum: string;      // editable por el usuario
  files: File[];
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;     // 0-100
  errorMsg?: string;
  capId?: string;
}

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
  const [scansList, setScansList]    = useState<{id:string, nombre:string}[]>([]);
  const [view, setView]              = useState<'mangas' | 'chapters' | 'upload' | 'batch' | 'edit' | 'drive'>('mangas');

  // Edición de capítulo
  const [editingCap, setEditingCap]   = useState<Capitulo | null>(null);
  const [editNumero, setEditNumero]   = useState('');
  const [editTitulo, setEditTitulo]   = useState('');
  const [editFecha, setEditFecha]     = useState('');
  const [editSaving, setEditSaving]   = useState(false);
  const [editMsg, setEditMsg]         = useState<string | null>(null);

  // Páginas del capítulo en edición
  const [editPages, setEditPages]     = useState<{id:string; orden:number; filename:string; image_url:string}[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [deletingCapId, setDeletingCapId] = useState<string | null>(null);
  const [addingPages, setAddingPages] = useState(false);
  const [addProgress, setAddProgress] = useState(0);
  const editFileRef = useRef<HTMLInputElement>(null);

  // Upload individual
  const [capNumero, setCapNumero]   = useState('');
  const [capTitulo, setCapTitulo]   = useState('');
  const [fechaPub, setFechaPub]     = useState('');
  const [convertWebP, setConvertWebP] = useState(true);
  const [notifyDiscord, setNotifyDiscord] = useState(true);
  const [pages, setPages]           = useState<PageFile[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [capId, setCapId]           = useState<string | null>(null);
  const [capEstado, setCapEstado]   = useState<string | null>(null);
  const [done, setDone]             = useState(false);
  const [dupError, setDupError]     = useState('');
  const [createError, setCreateError] = useState('');
  const fileInputRef                = useRef<HTMLInputElement>(null);

  // Upload por lotes
  const [batchChapters, setBatchChapters] = useState<BatchChapter[]>([]);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchDone, setBatchDone]         = useState(false);
  const [batchError, setBatchError]       = useState('');
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Drive upload
  const [driveUrl, setDriveUrl] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [driveProgress, setDriveProgress] = useState<{current: number, total: number} | null>(null);

  const handleDriveImport = async () => {
    if (!driveUrl) return;
    setDriveLoading(true); setDriveError(''); setDriveProgress(null);
    try {
      const match = driveUrl.match(/(?:folders\/|file\/d\/|id=)([\w-]+)/);
      if (!match) throw new Error('URL de Google Drive inválida. Asegurate de que contenga el ID.');
      const driveId = match[1];
      const isFolder = driveUrl.includes('folders/');

      const res = await fetch(`${API}/api/drive/list?id=${driveId}&type=${isFolder ? 'folder' : 'file'}`, { headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error al listar archivos de Drive');
      if (!d.files || d.files.length === 0) throw new Error('No se encontraron archivos en este enlace.');

      if (!isFolder && (d.files[0].mimeType === 'application/zip' || d.files[0].mimeType === 'application/x-zip-compressed' || d.files[0].name.endsWith('.zip'))) {
        const fileRes = await fetch(`${API}/api/drive/download?id=${d.files[0].id}`, { headers: authHeaders() });
        if (!fileRes.ok) throw new Error('Error al descargar de Drive');
        const blob = await fileRes.blob();
        const file = new File([blob], d.files[0].name, { type: 'application/zip' });
        setView('batch');
        await handleZip(file);
      } else {
        const fetchedFiles: File[] = [];
        setDriveProgress({ current: 0, total: d.files.length });
        for (let i = 0; i < d.files.length; i++) {
          const fileMeta = d.files[i];
          const fileRes = await fetch(`${API}/api/drive/download?id=${fileMeta.id}`, { headers: authHeaders() });
          if (!fileRes.ok) throw new Error(`Error al descargar ${fileMeta.name}`);
          const blob = await fileRes.blob();
          fetchedFiles.push(new File([blob], fileMeta.name, { type: blob.type }));
          setDriveProgress({ current: i + 1, total: d.files.length });
        }
        setView('upload');
        await handleFiles(fetchedFiles as any);
      }
    } catch (e: any) {
      setDriveError(e.message);
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${API}/api/mangas?admin=1`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setMangas(d.mangas || []));
      
    fetch(`${API}/api/scans`)
      .then(r => r.json())
      .then(d => setScansList(d.scans || []));
  }, []);

  const loadChapters = useCallback(async (manga: Manga) => {
    setSelected(manga);
    const res = await fetch(`${API}/api/admin/mangas/${manga.id}/chapters`, { headers: authHeaders() });
    const d   = await res.json();
    setCapitulos(d.capitulos || []);
    setView('chapters');
  }, []);

  const ALLOWED_TYPES_IMG = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_TYPES_TXT = ['text/plain'];

  const handleFiles = async (files: FileList | null) => {
    if (!files || !selectedManga) return;
    const isNovela = selectedManga.tipo === 'novela';
    const valid: PageFile[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(files)) {
      if (!isNovela && !ALLOWED_TYPES_IMG.includes(file.type)) { rejected.push(file.name); continue; }
      if (isNovela && !file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') { rejected.push(file.name); continue; }
      if (file.size > 10 * 1024 * 1024) { rejected.push(`${file.name} (supera 10MB)`); continue; }
      
      const final = (!isNovela && convertWebP) ? await toWebP(file) : file;
      valid.push({ file: final, preview: isNovela ? '' : URL.createObjectURL(final as File), order: pages.length + valid.length + 1, status: 'pending' });
    }
    if (rejected.length > 0) alert(`Archivos rechazados:\n${rejected.join('\n')}`);
    setPages(prev => [...prev, ...valid.map((p, i) => ({ ...p, order: prev.length + i + 1 }))]);
  };

  const moveUp   = (i: number) => { if (i === 0) return; const a = [...pages]; [a[i-1], a[i]] = [a[i], a[i-1]]; setPages(a.map((p,j) => ({ ...p, order: j+1 }))); };
  const moveDown = (i: number) => { if (i === pages.length-1) return; const a = [...pages]; [a[i], a[i+1]] = [a[i+1], a[i]]; setPages(a.map((p,j) => ({ ...p, order: j+1 }))); };
  const removePage = (i: number) => setPages(prev => prev.filter((_,j) => j !== i).map((p,j) => ({ ...p, order: j+1 })));

  const handleUpload = async () => {
    if (!capNumero || pages.length === 0 || !selectedManga) return;
    setDupError(''); setCreateError('');
    const num = parseFloat(capNumero);
    if (capitulos.some(c => c.numero === num)) { setDupError(`Ya existe el capítulo ${num}.`); return; }
    setUploading(true); setDone(false);
    try {
      let currentCapId = capId;
      if (!currentCapId) {
        const res = await fetch(`${API}/api/chapters`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ manga_id: selectedManga.id, numero: num, titulo: capTitulo || null, fecha_publicacion: fechaPub ? new Date(fechaPub).toISOString() : null, notify_discord: notifyDiscord }),
        });
        const d = await res.json();
        if (!res.ok) { setCreateError(d.error || 'Error al crear'); setUploading(false); return; }
        currentCapId = d.capituloId;
        setCapId(currentCapId); setCapEstado(d.estado);
      }
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page.status === 'done') continue;
        setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'uploading' } : p));
        const isNovela = selectedManga.tipo === 'novela';
        const endpoint = isNovela ? '/api/upload/text' : '/api/upload/page';
        
        const fd = new FormData();
        fd.append('capitulo_id', currentCapId!);
        fd.append('numero', String(page.order));
        if (isNovela) fd.append('text', page.file);
        else fd.append('image', page.file);

        try {
          const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers: authHeaders(), body: fd });
          const d   = await res.json();
          if (!res.ok) throw new Error(d.error || 'Error');
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'done' } : p));
        } catch (e: any) {
          setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'error', error: e.message } : p));
        }
      }
      setDone(true);
      loadChapters(selectedManga);
    } finally { setUploading(false); }
  };

  const resetUpload = () => {
    setPages([]); setCapNumero(''); setCapTitulo(''); setFechaPub('');
    setCapId(null); setCapEstado(null); setDone(false); setDupError(''); setCreateError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Procesado del ZIP ──────────────────────────────────────
  const handleZip = async (file: File) => {
    setBatchError('');
    setBatchChapters([]);
    setBatchDone(false);
    try {
      const JSZip = (await import('jszip')).default;
      const zip   = await JSZip.loadAsync(file);
      const folderMap: Record<string, File[]> = {};

      const isNovela = selectedManga?.tipo === 'novela';
      const fileExts = isNovela ? /\.(txt)$/i : /\.(jpe?g|png|webp)$/i;

      // Detectar si el ZIP tiene una carpeta raíz común (ej: manga-name/cap-01/...)
      const allPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir);
      const allFolders = allPaths
        .filter(p => !p.startsWith('__MACOSX') && !p.split('/').pop()?.startsWith('.'))
        .map(p => p.split('/'));
      const rootOffset = allFolders.length > 0 && allFolders.every(p => p[0] === allFolders[0][0]) && allFolders[0].length > 2 ? 1 : 0;

      const promises = Object.entries(zip.files).map(async ([path, entry]) => {
        if (entry.dir || !fileExts.test(path)) return;
        const parts   = path.split('/');
        const fname   = parts[parts.length - 1];
        // Ignorar archivos ocultos (macOS __MACOSX, .DS_Store)
        if (parts.some(p => p.startsWith('__MACOSX')) || fname.startsWith('.')) return;

        let folder = parts.length > rootOffset + 1 ? parts[rootOffset] : '__root__';
        
        // Si es novela y el archivo está en la raíz, el nombre del archivo dicta el capítulo
        if (isNovela && folder === '__root__') {
            folder = fname.split('.')[0]; 
        }

        const blob = await entry.async('blob');
        const ext  = fname.split('.').pop()!.toLowerCase();
        const mime = isNovela ? 'text/plain' : (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
        const f    = new File([blob], fname, { type: mime });
        if (!folderMap[folder]) folderMap[folder] = [];
        folderMap[folder].push(f);
      });
      await Promise.all(promises);

      if (Object.keys(folderMap).length === 0) {
        setBatchError(isNovela
          ? 'No se encontraron archivos de texto (.txt). Verificá que el ZIP contenga los archivos.'
          : 'No se encontraron imágenes. Verificá que el ZIP tenga carpetas por capítulo (ej: cap-01/001.jpg, cap-02/001.jpg).');
        return;
      }

      // Ordenar imágenes dentro de cada carpeta por nombre
      Object.values(folderMap).forEach(files => files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));

      // Detectar número de capítulo desde el nombre de la carpeta
      const chapters: BatchChapter[] = Object.entries(folderMap)
        .map(([folder, files]) => {
          const match = folder.match(/(\d+(?:\.\d+)?)/);
          const num   = match ? parseFloat(match[1]) : 0;
          return { folderName: folder, detectedNum: num, userNum: String(num || ''), files, status: 'pending' as const, progress: 0 };
        })
        .sort((a, b) => a.detectedNum - b.detectedNum);

      setBatchChapters(chapters);
    } catch (e: any) {
      setBatchError(`Error al leer el ZIP: ${e.message}`);
    }
  };

  const uploadBatch = async () => {
    if (!selectedManga || batchChapters.length === 0) return;
    setBatchUploading(true);
    setBatchDone(false);

    const existingNums = new Set(capitulos.map(c => c.numero));

    for (let ci = 0; ci < batchChapters.length; ci++) {
      const cap = batchChapters[ci];
      const num = parseFloat(cap.userNum);
      if (!num || isNaN(num) || num <= 0) {
        setBatchChapters(prev => prev.map((c, i) => i === ci ? { ...c, status: 'error', errorMsg: `Número inválido "${cap.userNum}" — editalo manualmente antes de subir` } : c));
        continue;
      }
      if (existingNums.has(num)) {
        setBatchChapters(prev => prev.map((c, i) => i === ci ? { ...c, status: 'error', errorMsg: `Cap. ${num} ya existe` } : c));
        continue;
      }

      setBatchChapters(prev => prev.map((c, i) => i === ci ? { ...c, status: 'uploading', progress: 0 } : c));

      try {
        // Crear capítulo
        const res = await fetch(`${API}/api/chapters`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ manga_id: selectedManga.id, numero: num, titulo: null, fecha_publicacion: null, notify_discord: notifyDiscord }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al crear capítulo');
        const capId = d.capituloId;
        existingNums.add(num);

        // Subir páginas / texto
        const isNovela = selectedManga.tipo === 'novela';
        const endpoint = isNovela ? '/api/upload/text' : '/api/upload/page';

        for (let pi = 0; pi < cap.files.length; pi++) {
          const fileToUpload = (!isNovela && convertWebP) ? await toWebP(cap.files[pi]) : cap.files[pi];
          const fd = new FormData();
          fd.append('capitulo_id', capId);
          fd.append('numero', String(pi + 1));
          
          if (isNovela) fd.append('text', fileToUpload);
          else fd.append('image', fileToUpload);

          const pr = await fetch(`${API}${endpoint}`, { method: 'POST', headers: authHeaders(), body: fd });
          if (!pr.ok) {
            const pe = await pr.json();
            throw new Error(pe.error || `Error al subir ${isNovela ? 'texto' : 'página'}`);
          }
          const progress = Math.round(((pi + 1) / cap.files.length) * 100);
          setBatchChapters(prev => prev.map((c, i) => i === ci ? { ...c, progress } : c));
        }

        setBatchChapters(prev => prev.map((c, i) => i === ci ? { ...c, status: 'done', progress: 100, capId } : c));
      } catch (e: any) {
        setBatchChapters(prev => prev.map((c, i) => i === ci ? { ...c, status: 'error', errorMsg: e.message } : c));
      }
    }

    setBatchUploading(false);
    setBatchDone(true);
    loadChapters(selectedManga);
  };

  const deleteChapter = async (cap: Capitulo) => {
    if (!confirm(`¿Eliminar Cap. ${cap.numero}? Esta acción no se puede deshacer.`)) return;
    setDeletingCapId(cap.id);
    await fetch(`${API}/api/chapters/${cap.id}`, { method: 'DELETE', headers: authHeaders() });
    setCapitulos(prev => prev.filter(c => c.id !== cap.id));
    setDeletingCapId(null);
  };

  const openEdit = async (cap: Capitulo) => {
    setEditingCap(cap);
    setEditNumero(String(cap.numero));
      let editLocal = '';
      if ((cap as any).fecha_publicacion) {
        const d = new Date((cap as any).fecha_publicacion);
        editLocal = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      setEditFecha(editLocal);
    setEditMsg(null);
    setEditPages([]);
    setView('edit');
    // Cargar páginas existentes
    setLoadingPages(true);
    try {
      const res = await fetch(`${API}/api/admin/chapters/${cap.id}/pages/list`, { headers: authHeaders() });
      const d = await res.json();
      setEditPages(d.pages || []);
    } finally { setLoadingPages(false); }
  };

  const handleDeletePage = async (pageId: string) => {
    setDeletingId(pageId);
    try {
      const res = await fetch(`${API}/api/pages/${pageId}`, { method: 'DELETE', headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `Error ${res.status}`);
      // Recargar páginas
      if (editingCap) {
        const r = await fetch(`${API}/api/admin/chapters/${editingCap.id}/pages/list`, { headers: authHeaders() });
        const data = await r.json();
        setEditPages(data.pages || []);
      }
    } catch (e: any) {
      setEditMsg(`❌ No se pudo eliminar: ${e.message}`);
    }
    finally { setDeletingId(null); }
  };

  const handleAddPages = async (files: FileList | null) => {
    if (!files || !editingCap) return;
    setAddingPages(true);
    const allowed = selectedManga?.tipo === 'novela' ? ALLOWED_TYPES_TXT : ALLOWED_TYPES_IMG;
    const arr = Array.from(files).filter(f => allowed.includes(f.type));
    const startOrden = editPages.length + 1;
    for (let i = 0; i < arr.length; i++) {
      const file = convertWebP ? await toWebP(arr[i]) : arr[i];
      const fd = new FormData();
      fd.append('capitulo_id', editingCap.id);
      fd.append('numero', String(startOrden + i));
      fd.append('image', file);
      await fetch(`${API}/api/upload/page`, { method: 'POST', headers: authHeaders(), body: fd });
      setAddProgress(Math.round(((i + 1) / arr.length) * 100));
    }
    // Recargar
    const r = await fetch(`${API}/api/admin/chapters/${editingCap.id}/pages/list`, { headers: authHeaders() });
    const data = await r.json();
    setEditPages(data.pages || []);
    setAddingPages(false);
    setAddProgress(0);
    if (editFileRef.current) editFileRef.current.value = '';
  };

  const handleSaveEdit = async () => {
    if (!editingCap) return;
    setEditSaving(true); setEditMsg(null);
    try {
      const res = await fetch(`${API}/api/chapters/${editingCap.id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: parseFloat(editNumero),
          titulo: editTitulo || null,
          fecha_publicacion: editFecha ? new Date(editFecha).toISOString() : null
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setEditMsg('✅ Capítulo actualizado');
      if (selectedManga) loadChapters(selectedManga);
      setTimeout(() => setView('chapters'), 1200);
    } catch (e: any) { setEditMsg(`❌ ${e.message}`); }
    finally { setEditSaving(false); }
  };

  const donePages  = pages.filter(p => p.status === 'done').length;
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
            <button onClick={() => { setView(view === 'upload' || view === 'batch' || view === 'edit' || view === 'drive' ? 'chapters' : 'mangas'); resetUpload(); setBatchChapters([]); setBatchDone(false); setEditingCap(null); setDriveUrl(''); }}
              className="p-2 rounded-lg text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shrink-0">
              <ChevronLeft size={18}/>
            </button>
          )}
          <img src="/logo.png" alt="CrimsonScan" className="h-7 w-auto object-contain shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm dark:text-white leading-tight truncate">
              {view === 'mangas' ? 'Mis Proyectos' : view === 'chapters' ? selectedManga?.titulo : view === 'batch' ? 'Subir por lotes' : view === 'edit' ? `Editar Cap. ${editingCap?.numero}` : view === 'drive' ? 'Importar de Drive' : 'Subir Capítulo'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(user.is_superadmin || user.rol === 'admin' || user.rol === 'admin_scan') && (
            <Link href="/admin" className="text-xs text-gray-500 hover:text-rose-500 transition px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 hidden sm:flex items-center gap-1">Admin</Link>
          )}
          <button onClick={() => { logout(); router.push('/'); }}
            className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <LogOut size={16}/>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-6 sm:px-4 sm:py-8">

        {/* ── Mis Proyectos ── */}
        {view === 'mangas' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-extrabold dark:text-white mb-1">Mis Proyectos</h2>
            <p className="text-gray-500 text-sm mb-5">Tocá una obra para ver sus capítulos.</p>
            {mangas.length === 0 ? (
              <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400 px-4 text-center">
                <BookOpen size={40} className="mb-3 opacity-30"/>
                <p className="font-medium">No tenés obras asignadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mangas.map(m => (
                  <button key={m.id} onClick={() => loadChapters(m)}
                    className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex flex-col items-center gap-3 hover:border-rose-300 dark:hover:border-rose-500/30 active:scale-[0.98] transition-all text-center w-full shadow-sm hover:shadow-md h-full">
                    <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center text-rose-500 shrink-0 shadow-inner">
                      <BookOpen size={28}/>
                    </div>
                    <div className="flex-1 flex flex-col justify-between w-full">
                      <div className="mb-2">
                        <p className="font-extrabold text-sm dark:text-white line-clamp-2 leading-tight">{m.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-1 capitalize font-medium">{m.tipo}</p>
                      </div>
                      <div className="mt-auto">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.estado === 'en_curso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-white/5'}`}>{m.estado}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lista de capítulos ── */}
        {view === 'chapters' && selectedManga && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold dark:text-white truncate">{selectedManga.titulo}</h2>
                <p className="text-gray-500 text-sm">{capitulos.length} capítulos</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {user && (user.is_superadmin || user.scan_nombre?.toLowerCase().includes('crimson')) && (
                  <button onClick={() => { resetUpload(); setView('drive'); }}
                    className="flex items-center gap-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 text-gray-600 dark:text-gray-300 px-3 py-2.5 rounded-xl text-sm font-bold transition active:scale-95">
                    <Cloud size={15} className="text-blue-500" /> Drive
                  </button>
                )}
                <button onClick={() => { setBatchChapters([]); setBatchDone(false); setBatchError(''); setView('batch'); }}
                  className="flex items-center gap-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30 text-gray-600 dark:text-gray-300 px-3 py-2.5 rounded-xl text-sm font-bold transition active:scale-95">
                  <Package size={15}/> ZIP
                </button>
                <button onClick={() => { resetUpload(); setView('upload'); }}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-rose-600/20 active:scale-95">
                  <Plus size={16}/> Nuevo
                </button>
              </div>
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
                    <div className={`p-2 rounded-xl shrink-0 ${cap.estado === 'publicado' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : cap.estado === 'rechazado' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                      {cap.estado === 'publicado' ? <CheckCircle size={15}/> : cap.estado === 'rechazado' ? <XCircle size={15}/> : <Clock size={15}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm dark:text-white truncate">Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}</p>
                      <p className="text-xs text-gray-400">{cap.num_paginas ?? 0} pág · {new Date(cap.fecha_subida).toLocaleDateString('es')}</p>
                      {cap.estado === 'rechazado' && cap.notas_admin && (
                        <div className="flex items-start gap-1 mt-1 text-red-500 text-xs"><AlertCircle size={10} className="mt-0.5 shrink-0"/><span className="truncate">{cap.notas_admin}</span></div>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${cap.estado === 'publicado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : cap.estado === 'programado' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : cap.estado === 'rechazado' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>{cap.estado}</span>
                    <button onClick={() => openEdit(cap)}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition shrink-0 active:scale-90">
                      <Edit3 size={14}/>
                    </button>
                    {(user?.rol === 'admin' || user?.rol === 'admin_scan' || user?.is_superadmin) && (
                      <button onClick={() => deleteChapter(cap)} disabled={deletingCapId === cap.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition shrink-0 active:scale-90 disabled:opacity-50">
                        {deletingCapId === cap.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Importar desde Google Drive ── */}
        {view === 'drive' && selectedManga && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
              <h3 className="font-extrabold text-lg dark:text-white mb-2 flex items-center gap-2">
                <Cloud className="text-blue-500" /> Importar desde Google Drive
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">Pegá el enlace de una carpeta de Google Drive que contenga imágenes, o de un archivo .zip para procesarlo automáticamente y pasarlo al editor.</p>
              
              {driveError && (
                <div className="bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 font-medium flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0"/> {driveError}
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Enlace de Google Drive</label>
                <input type="url" value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." 
                  className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3.5 rounded-xl text-sm dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none w-full transition-all" />
              </div>

              <button onClick={handleDriveImport} disabled={!driveUrl || driveLoading}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 active:scale-[0.98]">
                {driveLoading ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
                {driveLoading ? (driveProgress ? `Descargando ${driveProgress.current} de ${driveProgress.total}...` : 'Conectando...') : 'Procesar enlace'}
              </button>

              {driveProgress && driveProgress.total > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                    <span>Descargando imágenes</span>
                    <span>{Math.round((driveProgress.current / driveProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                         style={{ width: `${(driveProgress.current / driveProgress.total) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Subir capítulo individual ── */}
        {view === 'upload' && selectedManga && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">
            {done && capId && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle size={40} className="text-emerald-500"/>
                <div>
                  <p className="font-extrabold text-lg dark:text-white">{capEstado === 'programado' ? '¡Capítulo programado!' : '¡Capítulo publicado!'}</p>
                  <p className="text-sm text-gray-500 mt-1">{capEstado === 'programado' ? `Se publicará el ${new Date(fechaPub).toLocaleString('es')}` : 'Ya visible para los lectores'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-1">
                  <Link href={`/manga/reader/${selectedManga.id}/chapter/${capId}`} target="_blank"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition active:scale-95">
                    👁 Ver capítulo
                  </Link>
                  <button onClick={resetUpload} className="text-sm font-bold text-gray-600 dark:text-gray-300 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-rose-300 transition active:scale-95">
                    + Subir otro
                  </button>
                </div>
              </div>
            )}

            {!done && (
              <>
                <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Capítulo de: <span className="text-rose-500">{selectedManga.titulo}</span></p>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500">Número *</label>
                        <input type="number" step="0.1" inputMode="decimal" value={capNumero} onChange={e => { setCapNumero(e.target.value); setDupError(''); }}
                          placeholder="1" className={`bg-gray-50 dark:bg-black/30 border px-3 py-3 rounded-xl text-base dark:text-white focus:border-rose-500 outline-none ${dupError ? 'border-red-400' : 'border-gray-200 dark:border-white/10'}`}/>
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
                      <input type="datetime-local" value={fechaPub} onChange={e => setFechaPub(e.target.value)} min={new Date().toISOString().slice(0,16)}
                        className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none"/>
                    </div>
                    {createError && <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-3 py-2 rounded-xl">{createError}</div>}
                  </div>
                </div>

                {/* Aviso conversión WebP (oculto si es novela) */}
                {selectedManga.tipo !== 'novela' && (
                  <div className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${convertWebP ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold mb-0.5 ${convertWebP ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}>
                        {convertWebP ? '🔄 Conversión a WebP activada' : '📁 Sin conversión'}
                      </p>
                      <p className={`text-xs leading-relaxed ${convertWebP ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400'}`}>
                        {convertWebP
                          ? 'Los JPG/PNG se convertirán a WebP antes de subirse. Pesan hasta un 50% menos sin perder calidad visible.'
                          : 'Las imágenes se subirán en su formato original sin modificar.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConvertWebP(v => !v)}
                      className={`shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative ${convertWebP ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${convertWebP ? 'translate-x-5' : 'translate-x-0'}`}/>
                    </button>
                  </div>
                )}

                <div className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${notifyDiscord ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold mb-0.5 ${notifyDiscord ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-500'}`}>
                      {notifyDiscord ? '🔔 Avisar en Discord' : '🔕 Sin aviso en Discord'}
                    </p>
                    <p className={`text-xs leading-relaxed ${notifyDiscord ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'}`}>
                      {notifyDiscord
                        ? 'Se enviará una notificación al canal de Discord del scan cuando se publique.'
                        : 'No se enviará ninguna notificación a Discord.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyDiscord(v => !v)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative ${notifyDiscord ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-white/20'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifyDiscord ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </button>
                </div>

                <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{selectedManga.tipo === 'novela' ? 'Archivo (.txt)' : 'Páginas'} ({pages.length})</p>
                    {pages.length > 0 && <button onClick={() => fileInputRef.current?.click()} className="text-xs text-rose-500 font-bold flex items-center gap-1"><Plus size={12}/> Agregar más</button>}
                  </div>
                  {pages.length === 0 && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl py-10 flex flex-col items-center gap-3 hover:border-rose-400 dark:hover:border-rose-500/50 active:scale-[0.98] transition-all">
                      <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500"><ImageIcon size={26}/></div>
                      <div className="text-center px-4">
                        <p className="font-bold text-sm dark:text-white">Tocá para seleccionar {selectedManga.tipo === 'novela' ? 'archivo .txt' : 'imágenes'}</p>
                        <p className="text-xs text-gray-400 mt-1">{selectedManga.tipo === 'novela' ? 'Solo formato .TXT' : 'JPG, PNG o WebP'} · máx. 10MB</p>
                      </div>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" multiple accept={selectedManga.tipo === 'novela' ? '.txt' : 'image/jpeg,image/png,image/webp'} className="hidden" onChange={e => handleFiles(e.target.files)}/>
                  {pages.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {pages.map((page, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-black/20 rounded-xl px-3 py-2">
                          {selectedManga.tipo === 'novela' ? (
                            <div className="w-9 h-12 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center shrink-0 text-gray-500 font-bold text-[10px]">TXT</div>
                          ) : (
                            <img src={page.preview} alt="" className="w-9 h-12 object-cover rounded-lg shrink-0"/>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold dark:text-white">Pág. {String(page.order).padStart(3,'0')}</p>
                            <p className="text-[10px] text-gray-400 truncate">{page.file.name}</p>
                            {page.status === 'error' && <p className="text-[10px] text-red-500 truncate">{page.error}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {page.status === 'uploading' && <Loader2 size={16} className="animate-spin text-blue-500"/>}
                            {page.status === 'done'      && <Check size={16} className="text-emerald-500"/>}
                            {page.status === 'error'     && <X size={16} className="text-red-500"/>}
                            {page.status === 'pending'   && (
                              <>
                                <button onClick={() => moveUp(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition active:scale-90"><ArrowUp size={14}/></button>
                                <button onClick={() => moveDown(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition active:scale-90"><ArrowDown size={14}/></button>
                                <button onClick={() => removePage(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition active:scale-90"><Trash2 size={14}/></button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold dark:text-white">Subiendo...</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-500/20 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}/>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">{donePages} de {pages.length} {selectedManga.tipo === 'novela' ? 'archivos' : 'páginas'}</p>
                  </div>
                )}

                <button onClick={handleUpload} disabled={uploading || !capNumero || pages.length === 0}
                  className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3 text-base active:scale-[0.98]">
                  {uploading ? <><Loader2 size={20} className="animate-spin"/> Subiendo {progress}%</> : fechaPub ? <><Clock size={20}/> Programar publicación</> : <><Upload size={20}/> Publicar ahora</>}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Subir por lotes (ZIP) ── */}
        {view === 'batch' && selectedManga && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">

            {batchDone ? (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
                <CheckCircle size={40} className="text-emerald-500"/>
                <div>
                  <p className="font-extrabold text-lg dark:text-white">¡Lote subido!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {batchChapters.filter(c => c.status === 'done').length} capítulos publicados
                    {batchChapters.filter(c => c.status === 'error').length > 0 && ` · ${batchChapters.filter(c => c.status === 'error').length} con errores`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setBatchChapters([]); setBatchDone(false); setBatchError(''); if (zipInputRef.current) zipInputRef.current.value = ''; }}
                    className="text-sm font-bold text-gray-600 dark:text-gray-300 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-rose-300 transition active:scale-95">
                    Subir otro ZIP
                  </button>
                  <button onClick={() => setView('chapters')}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition active:scale-95">
                    Ver capítulos
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Info formato */}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-2"><FileArchive size={16}/> Formato del ZIP</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {selectedManga.tipo === 'novela'
                      ? 'Para novelas, los archivos .txt pueden estar en la raíz. El número de capítulo se detecta del nombre (ej: 01.txt, 1.5.txt).'
                      : 'Cada carpeta dentro del ZIP = un capítulo. El número se detecta del nombre de la carpeta.'}
                  </p>
                  <div className="mt-2 text-xs text-blue-500 dark:text-blue-400 font-mono bg-blue-100 dark:bg-blue-500/10 rounded-lg px-3 py-2">
                    {selectedManga.tipo === 'novela' ? (
                      <>
                        archivo.zip/<br/>
                        &nbsp;&nbsp;cap-01.txt<br/>
                        &nbsp;&nbsp;cap-02.txt<br/>
                        &nbsp;&nbsp;cap-03.txt
                      </>
                    ) : (
                      <>
                        archivo.zip/<br/>
                        &nbsp;&nbsp;cap-01/ → 001.webp, 002.webp...<br/>
                        &nbsp;&nbsp;cap-02/ → 001.webp, 002.webp...<br/>
                        &nbsp;&nbsp;cap-03/ → 001.webp, 002.webp...
                      </>
                    )}
                  </div>
                </div>

                {/* Toggle WebP batch (oculto si es novela) */}
                {selectedManga.tipo !== 'novela' && (
                  <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${convertWebP ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                    <div>
                      <p className={`text-xs font-bold mb-0.5 ${convertWebP ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}>
                        {convertWebP ? '🔄 Convertir imágenes a WebP' : '📁 Sin conversión'}
                      </p>
                      <p className={`text-xs ${convertWebP ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400'}`}>
                        {convertWebP ? 'Cada imagen del ZIP se convierte antes de subirse.' : 'Se suben los archivos originales del ZIP.'}
                      </p>
                    </div>
                    <button type="button" onClick={() => setConvertWebP(v => !v)}
                      className={`shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative ${convertWebP ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${convertWebP ? 'translate-x-5' : 'translate-x-0'}`}/>
                    </button>
                  </div>
                )}

                {/* Toggle Discord batch */}
                <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${notifyDiscord ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                  <div>
                    <p className={`text-xs font-bold mb-0.5 ${notifyDiscord ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-500'}`}>
                      {notifyDiscord ? '🔔 Avisar en Discord' : '🔕 Sin aviso en Discord'}
                    </p>
                    <p className={`text-xs ${notifyDiscord ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400'}`}>
                      {notifyDiscord ? 'Se enviará una notificación por cada capítulo publicado.' : 'No se notificará a Discord.'}
                    </p>
                  </div>
                  <button type="button" onClick={() => setNotifyDiscord(v => !v)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative ${notifyDiscord ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifyDiscord ? 'translate-x-5' : 'translate-x-0'}`}/>
                  </button>
                </div>

                {/* Zona de carga del ZIP */}
                {batchChapters.length === 0 && (
                  <button onClick={() => zipInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl py-12 flex flex-col items-center gap-3 hover:border-rose-400 dark:hover:border-rose-500/50 active:scale-[0.98] transition-all">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                      <Package size={30}/>
                    </div>
                    <div className="text-center px-4">
                      <p className="font-bold text-base dark:text-white">Tocá para seleccionar el ZIP</p>
                      <p className="text-xs text-gray-400 mt-1">Archivo .zip con carpetas de capítulos</p>
                    </div>
                  </button>
                )}

                <input ref={zipInputRef} type="file" accept=".zip,application/zip" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleZip(f); }}/>

                {batchError && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-2xl">
                    {batchError}
                  </div>
                )}

                {/* Vista previa de capítulos detectados */}
                {batchChapters.length > 0 && (
                  <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {batchChapters.length} capítulos detectados
                      </p>
                      <button onClick={() => zipInputRef.current?.click()} className="text-xs text-rose-500 font-bold">
                        Cambiar ZIP
                      </button>
                    </div>

                    {batchChapters.map((cap, i) => (
                      <div key={i} className={`px-4 py-3 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          {/* Icono de estado */}
                          <div className={`p-2 rounded-xl shrink-0 ${
                            cap.status === 'done'      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                            cap.status === 'error'     ? 'bg-red-50 dark:bg-red-500/10 text-red-500' :
                            cap.status === 'uploading' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' :
                            'bg-gray-50 dark:bg-white/5 text-gray-400'
                          }`}>
                            {cap.status === 'done'      ? <Check size={15}/> :
                             cap.status === 'error'     ? <X size={15}/> :
                             cap.status === 'uploading' ? <Loader2 size={15} className="animate-spin"/> :
                             <FileArchive size={15}/>}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 truncate">{cap.folderName} · {cap.files.length} {selectedManga.tipo === 'novela' ? 'archivos' : 'imágenes'}</p>
                            {cap.status === 'uploading' && (
                              <div className="mt-1.5">
                                <div className="bg-gray-100 dark:bg-white/10 rounded-full h-1.5">
                                  <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${cap.progress}%` }}/>
                                </div>
                                <p className="text-[10px] text-blue-500 mt-0.5">{cap.progress}%</p>
                              </div>
                            )}
                            {cap.status === 'error' && <p className="text-[10px] text-red-500 mt-0.5">{cap.errorMsg}</p>}
                          </div>

                          {/* Número de capítulo editable */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-gray-400 font-medium">Cap.</span>
                            <input
                              type="number" step="0.1" value={cap.userNum}
                              onChange={e => setBatchChapters(prev => prev.map((c, j) => j === i ? { ...c, userNum: e.target.value } : c))}
                              disabled={cap.status !== 'pending'}
                              className="w-16 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-2 py-1.5 rounded-lg text-sm dark:text-white text-center focus:border-rose-500 outline-none disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {batchChapters.length > 0 && !batchUploading && !batchDone && (
                  <button onClick={uploadBatch}
                    className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-3 text-base active:scale-[0.98]">
                    <Package size={20}/> Subir {batchChapters.length} capítulos
                  </button>
                )}

                {batchUploading && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin text-blue-500 shrink-0"/>
                    <div>
                      <p className="text-sm font-bold dark:text-white">
                        Subiendo cap. {batchChapters.find(c => c.status === 'uploading')?.userNum || '...'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {batchChapters.filter(c => c.status === 'done').length} de {batchChapters.length} capítulos completados
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Editar capítulo ── */}
        {view === 'edit' && editingCap && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">

            {editMsg && (
              <div className={`p-4 rounded-2xl text-sm font-medium ${editMsg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                {editMsg}
              </div>
            )}

            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
                Editando capítulo de: <span className="text-rose-500">{selectedManga?.titulo}</span>
              </p>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Número *</label>
                    <input
                      type="number" step="0.1" inputMode="decimal"
                      value={editNumero} onChange={e => setEditNumero(e.target.value)}
                      className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-base dark:text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Título (opcional)</label>
                    <input
                      type="text" value={editTitulo} onChange={e => setEditTitulo(e.target.value)}
                      placeholder="Sin título"
                      className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-base dark:text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                {/* Reprogramar publicación (solo si no está publicado aún) */}
                {editingCap.estado !== 'publicado' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📅 Reprogramar publicación (opcional)</label>
                    <input
                      type="datetime-local" value={editFecha} onChange={e => setEditFecha(e.target.value)}
                      min={new Date().toISOString().slice(0,16)}
                      className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none"
                    />
                  </div>
                )}

                {/* Info actual */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Estado actual: <strong className="dark:text-white">{editingCap.estado}</strong></span>
                  <span>{selectedManga?.tipo === 'novela' ? 'Archivos:' : 'Páginas:'} <strong className="dark:text-white">{editingCap.num_paginas ?? 0}</strong></span>
                  <span>Subido: <strong className="dark:text-white">{new Date(editingCap.fecha_subida).toLocaleDateString('es')}</strong></span>
                </div>
              </div>
            </div>

            <button onClick={handleSaveEdit} disabled={editSaving || !editNumero}
              className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-rose-600/20 disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98]">
              {editSaving ? <><Loader2 size={18} className="animate-spin"/> Guardando...</> : <><Check size={18}/> Guardar cambios</>}
            </button>

            {/* Gestión de páginas */}
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {selectedManga?.tipo === 'novela' ? 'Archivos' : 'Páginas'} ({editPages.length})
                </p>
                <div className="flex items-center gap-3">
                  {selectedManga?.tipo !== 'novela' && (
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <button type="button" onClick={() => setConvertWebP(v => !v)}
                        className={`w-8 h-4 rounded-full transition-colors duration-200 relative shrink-0 ${convertWebP ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${convertWebP ? 'translate-x-4' : 'translate-x-0'}`}/>
                      </button>
                      <span className={`text-[10px] font-bold ${convertWebP ? 'text-blue-500' : 'text-gray-400'}`}>WebP</span>
                    </label>
                  )}
                  {addingPages && <span className="text-xs text-blue-500 font-medium">{addProgress}%</span>}
                  <button onClick={() => editFileRef.current?.click()} disabled={addingPages}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 disabled:opacity-50 transition">
                    {addingPages ? <Loader2 size={13} className="animate-spin"/> : <Plus size={13}/>}
                    {addingPages ? 'Subiendo...' : selectedManga?.tipo === 'novela' ? 'Agregar texto' : 'Agregar páginas'}
                  </button>
                </div>
              </div>
              <input ref={editFileRef} type="file" multiple accept={selectedManga?.tipo === 'novela' ? ".txt,text/plain" : "image/jpeg,image/png,image/webp"} className="hidden"
                onChange={e => handleAddPages(e.target.files)}/>

              {loadingPages ? (
                <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-rose-500"/></div>
              ) : editPages.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  {selectedManga?.tipo === 'novela' ? (
                    <FileText size={28} className="mb-2 opacity-30"/>
                  ) : (
                    <ImageIcon size={28} className="mb-2 opacity-30"/>
                  )}
                  <p className="text-sm">{selectedManga?.tipo === 'novela' ? 'Sin archivo' : 'Sin páginas'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {editPages.map(p => (
                    <div key={p.id} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                      {selectedManga?.tipo === 'novela' ? (
                        <div className="flex flex-col items-center justify-center text-gray-500 gap-2 p-4 text-center">
                          <FileText size={32} className="opacity-50"/>
                          <span className="text-[10px] truncate max-w-full">texto_{p.orden}.txt</span>
                        </div>
                      ) : (
                        <img
                          src={p.image_url}
                          alt={`Pág. ${p.orden}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Número siempre visible */}
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none">
                        {p.orden}
                      </div>
                      {/* Botón eliminar siempre visible (funciona en móvil) */}
                      <button
                        onClick={() => handleDeletePage(p.id)}
                        disabled={deletingId === p.id}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white p-1.5 rounded-lg shadow-lg transition active:scale-90 disabled:opacity-50">
                        {deletingId === p.id
                          ? <Loader2 size={13} className="animate-spin"/>
                          : <Trash2 size={13}/>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
