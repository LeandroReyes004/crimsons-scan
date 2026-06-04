'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, BookOpen, Clock, Users, LogOut, Plus, Check, X,
  ChevronRight, BookMarked, Eye, TrendingUp, RefreshCw, Loader2,
  AlertCircle, Edit3, UserPlus, ShieldCheck, Ban, Upload, Image as ImageIcon,
  Layers, Trash2, Menu, Settings,
} from 'lucide-react';
import { getUser, getToken, authHeaders, logout } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

type Section = 'dashboard' | 'mangas' | 'revision' | 'usuarios' | 'scans' | 'config';

// ── Tipos ──────────────────────────────────────────────────
interface Stats { mangas: number; capitulos: number; scanners: number; pendientes: number; }
interface Manga { id: string; titulo: string; tipo: string; estado: string; cover_r2_key: string | null; views_total: number; fecha_actualizacion: string; scan_nombre?: string; }
interface Capitulo { id: string; numero: number; titulo: string; estado: string; manga_titulo: string; manga_id: string; uploader_username: string; notas_admin: string | null; fecha_subida: string; num_paginas?: number; }
interface Usuario { id: string; username: string; email: string; rol: string; activo: number; fecha_registro: string; ultimo_acceso: string | null; scan_id?: string; scan_nombre?: string; }
interface Scan { id: string; nombre: string; descripcion: string | null; activo: number; miembros: number; }

// ── Hook: fetch con auth ───────────────────────────────────
function useAPI<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}${url}`, { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json()).error || 'Error');
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [url]);

  useEffect(() => { refetch(); }, [refetch, ...deps]);
  return { data, loading, error, refetch };
}

// ── Componentes pequeños ───────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string; }) {
  return (
    <div className="bg-white dark:bg-[#111114] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-extrabold dark:text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function Badge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    publicado:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    borrador:    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    rechazado:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    en_curso:    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    completado:  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    pausado:     'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
    admin:       'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    admin_scan:  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    uploader:    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    lector:      'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
    superadmin:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    programado:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  };
  const labels: Record<string, string> = {
    admin_scan: 'Admin Scan',
    superadmin: 'SuperAdmin',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[estado] || map.lector}`}>
      {labels[estado] || estado}
    </span>
  );
}

// ============================================================
export default function AdminPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('dashboard');
  const [user, setUser]           = useState<ReturnType<typeof getUser>>(null);
  const [mounted, setMounted]     = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');
    try {
      const { login } = await import('@/lib/auth');
      const u = await login(loginUser, loginPass);
      if (!u.is_superadmin && u.rol !== 'admin' && u.rol !== 'admin_scan') {
        logout(); setLoginErr('No tenés permisos de admin.'); return;
      }
      setUser(u);
    } catch (err: any) {
      setLoginErr(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => { logout(); setUser(null); };

  if (!mounted) return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  // ── Pantalla de login si no hay sesión ─────────────────
  if (!user) return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black shadow-lg shadow-rose-500/40">CS</div>
          <div>
            <p className="font-bold text-white leading-tight">CrimsonHQ</p>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">⚡ Acceso Restringido</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111114] border border-white/10 rounded-2xl p-7 flex flex-col gap-4 shadow-2xl">
          <h2 className="text-lg font-bold text-white text-center mb-1">Iniciar Sesión</h2>

          {loginErr && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-xl">
              {loginErr}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Usuario</label>
            <input
              value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
              placeholder="Kaiser"
              required
              className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contraseña</label>
            <input
              type="password"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
            />
          </div>

          <button type="submit" disabled={loginLoading}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1">
            {loginLoading ? <Loader2 size={18} className="animate-spin"/> : null}
            {loginLoading ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>

        <Link href="/" className="block text-center text-xs text-gray-600 hover:text-gray-400 transition mt-5">
          ← Volver al sitio
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">

      {/* ── Overlay mobile ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-[#0d0d10] border-r border-gray-200 dark:border-white/5 flex flex-col transform transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-gray-200 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-rose-500/30">CS</div>
          <div>
            <p className="font-bold text-sm dark:text-white leading-tight">
              {user.is_superadmin ? 'CrimsonHQ' : (user.scan_nombre || 'Admin Panel')}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{
              color: user.is_superadmin ? '#f59e0b' : user.rol === 'admin_scan' ? '#f97316' : '#f43f5e'
            }}>
              {user.is_superadmin ? '⚡ SuperAdmin' : user.rol === 'admin_scan' ? '🛡 Admin Scan' : 'Admin'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {([
            { id: 'dashboard', icon: <LayoutDashboard size={16}/>, label: 'Dashboard', show: true },
            { id: 'mangas',    icon: <BookOpen size={16}/>,        label: 'Mangas',    show: true },
            { id: 'revision',  icon: <Clock size={16}/>,           label: 'Agenda',    show: true },
            { id: 'scans',     icon: <Layers size={16}/>,          label: 'Scans',     show: !!user.is_superadmin },
            { id: 'usuarios',  icon: <Users size={16}/>,           label: 'Usuarios',  show: !!user.is_superadmin },
            { id: 'config',    icon: <Settings size={16}/>,        label: 'Mi Scan',   show: !user.is_superadmin && (user.rol === 'admin' || user.rol === 'admin_scan') && !!user.scan_id },
          ] as const).filter(item => item.show).map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                section === item.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-white/5 flex flex-col gap-1">
          <Link href="/uploader" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            <Upload size={16}/> Panel Uploader
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
            <ChevronRight size={16}/> Ver Sitio
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all w-full text-left">
            <LogOut size={16}/> Salir
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#0d0d10] border-b border-gray-200 dark:border-white/5 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition"
              aria-label="Abrir menú"
            >
              <Menu size={20}/>
            </button>
            <h1 className="font-bold text-lg dark:text-white capitalize">{section}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">Hola, <strong className="text-rose-500">{user.username}</strong></span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {section === 'dashboard' && <SectionDashboard />}
          {section === 'mangas'    && <SectionMangas />}
          {section === 'revision'  && <SectionRevision />}
          {section === 'scans'     && <SectionScans />}
          {section === 'usuarios'  && <SectionUsuarios />}
          {section === 'config'    && <SectionConfig scanId={user.scan_id!} />}
        </main>
      </div>
    </div>
  );
}

// ============================================================
//  SECCIÓN: DASHBOARD
// ============================================================
function SectionDashboard() {
  const { data, loading, refetch } = useAPI<Stats>('/api/admin/stats');
  const { data: manga_data } = useAPI<{ mangas: Manga[] }>('/api/mangas');

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Resumen General</h2>
          <p className="text-gray-500 text-sm mt-1">Estado actual de la plataforma</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors">
          <RefreshCw size={15}/> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<BookMarked size={20}/>}  label="Mangas"             value={data?.mangas ?? 0}     color="bg-blue-50 dark:bg-blue-500/10 text-blue-500"/>
          <StatCard icon={<BookOpen size={20}/>}    label="Caps Publicados"    value={data?.capitulos ?? 0}   color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"/>
          <StatCard icon={<Users size={20}/>}       label="Scanners"           value={data?.scanners ?? 0}    color="bg-purple-50 dark:bg-purple-500/10 text-purple-500"/>
          <StatCard icon={<Clock size={20}/>}       label="Pendientes"         value={data?.pendientes ?? 0}  color="bg-amber-50 dark:bg-amber-500/10 text-amber-500"/>
        </div>
      )}

      {/* Últimos mangas */}
      <div>
        <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-rose-500"/> Mangas Recientes
        </h3>
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          {manga_data?.mangas?.slice(0, 5).map((m, i) => (
            <div key={m.id} className={`flex items-center justify-between px-5 py-3.5 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center text-rose-500 font-bold text-sm">{i + 1}</div>
                <div>
                  <p className="font-semibold text-sm dark:text-white">{m.titulo}</p>
                  <p className="text-xs text-gray-400">{m.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12}/> {m.views_total}</span>
                <Badge estado={m.estado}/>
              </div>
            </div>
          )) ?? <p className="text-gray-400 text-sm p-5">No hay mangas aún.</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SECCIÓN: MANGAS
// ============================================================
const GENRES_LIST = ['Acción','Aventura','Comedia','Drama','Fantasía','Horror','Misterio','Psicológico','Romance','Ciencia Ficción','Sobrenatural','Thriller','Deportes','Histórico','Isekai','Mecha','Magia','Artes Marciales','Superpoderes','Reencarnación','Supervivencia'];

function MangaForm({ initial, onSave, onCancel, title }: {
  initial?: Partial<Manga>;
  onSave: (data: any, coverFile: File | null) => Promise<void>;
  onCancel: () => void;
  title: string;
}) {
  const [titulo, setTitulo]       = useState(initial?.titulo || '');
  const [tipo, setTipo]           = useState(initial?.tipo || 'manga');
  const [estado, setEstado]       = useState(initial?.estado || 'en_curso');
  const [descripcion, setDesc]    = useState('');
  const [scanId, setScanId]       = useState((initial as any)?.scan_id || '');
  const [scans, setScans]         = useState<{id:string; nombre:string}[]>([]);
  const [generos, setGeneros]     = useState<string[]>(() => {
    try { return initial ? JSON.parse((initial as any).generos || '[]') : []; } catch { return []; }
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving]       = useState(false);
  const [feedback, setFeedback]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/scans`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setScans(d.scans || []));
  }, []);

  const toggleGenre = (g: string) => setGeneros(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await onSave({ titulo, tipo, estado, descripcion, generos, scan_id: scanId || null }, coverFile);
      setFeedback('✅ Guardado');
      setTimeout(onCancel, 1200);
    } catch (err: any) {
      setFeedback(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
      <h3 className="font-bold dark:text-white mb-5 flex items-center gap-2"><Plus size={16} className="text-rose-500"/> {title}</h3>
      {feedback && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
          {feedback}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ej: Solo Leveling Ragnarok"
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Layers size={11}/> Scan Responsable</label>
            <select value={scanId} onChange={e => setScanId(e.target.value)}
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
              <option value="">— Sin asignar —</option>
              {scans.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)}
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sinopsis</label>
          <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Descripción de la obra..."
            className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none resize-none transition"/>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
            Géneros
            {generos.length > 0 && <span className="text-rose-500 normal-case text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-full">{generos.length} seleccionados</span>}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES_LIST.map(g => (
              <button key={g} type="button" onClick={() => toggleGenre(g)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                  generos.includes(g)
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-rose-400 hover:text-rose-500'
                }`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon size={12}/> Portada</label>
          <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 dark:file:bg-rose-500/10 dark:file:text-rose-400 cursor-pointer"/>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || !titulo}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
            {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionMangas() {
  const { data, loading, refetch } = useAPI<{ mangas: Manga[] }>('/api/mangas');
  const [showCreate, setShowCreate] = useState(false);
  const [editingManga, setEditing]  = useState<Manga | null>(null);

  const handleCreate = async (formData: any, coverFile: File | null) => {
    const res = await fetch(`${API}/api/mangas`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    if (coverFile) {
      const fd = new FormData();
      fd.append('manga_id', d.mangaId);
      fd.append('cover', coverFile);
      await fetch(`${API}/api/upload/cover`, { method: 'POST', headers: authHeaders(), body: fd });
    }
    refetch();
  };

  const handleEdit = async (formData: any, coverFile: File | null) => {
    if (!editingManga) return;
    const res = await fetch(`${API}/api/mangas/${editingManga.id}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Error al editar');
    if (coverFile) {
      const fd = new FormData();
      fd.append('manga_id', editingManga.id);
      fd.append('cover', coverFile);
      await fetch(`${API}/api/upload/cover`, { method: 'POST', headers: authHeaders(), body: fd });
    }
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Gestión de Mangas</h2>
          <p className="text-gray-500 text-sm mt-1">{data?.mangas?.length ?? 0} obras en total</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setEditing(null); }}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
          <Plus size={16}/> Nueva Obra
        </button>
      </div>

      {showCreate && !editingManga && (
        <MangaForm title="Crear Nueva Obra" onSave={handleCreate} onCancel={() => setShowCreate(false)} />
      )}

      {editingManga && (
        <MangaForm title={`Editar: ${editingManga.titulo}`} initial={editingManga} onSave={handleEdit} onCancel={() => setEditing(null)} />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          {data?.mangas?.length === 0 && (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <BookOpen size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No hay mangas creados aún</p>
              <p className="text-sm">Hacé click en "Nueva Obra" para empezar</p>
            </div>
          )}
          {data?.mangas?.map((m, i) => (
            <div key={m.id} className={`flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-white/2 transition ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
              <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 flex items-center justify-center text-gray-300">
                <BookOpen size={16}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm dark:text-white truncate">{m.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.tipo} · <span className="font-mono">{m.id.slice(0,8)}...</span></p>
                {(m as any).generos && JSON.parse((m as any).generos || '[]').length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {JSON.parse((m as any).generos).slice(0,3).map((g: string) => (
                      <span key={g} className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-full">{g}</span>
                    ))}
                    {JSON.parse((m as any).generos).length > 3 && (
                      <span className="text-[10px] text-gray-400">+{JSON.parse((m as any).generos).length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12}/>{m.views_total}</span>
                <Badge estado={m.estado}/>
                <button onClick={() => { setEditing(m); setShowCreate(false); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Editar">
                  <Edit3 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  SECCIÓN: AGENDA DE PUBLICACIONES
// ============================================================
interface CapAgenda { id: string; numero: number; titulo: string | null; estado: string; fecha_publicacion: string | null; fecha_subida: string; manga_titulo: string; manga_id: string; uploader_username: string; }

function SectionRevision() {
  const { data, loading, refetch } = useAPI<{ capitulos: CapAgenda[] }>('/api/admin/scheduled');
  const [processing, setProcessing] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [newFecha, setNewFecha]     = useState('');

  const publishNow = async (id: string) => {
    setProcessing(id);
    await fetch(`${API}/api/chapters/${id}/reschedule`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_publicacion: null }),
    });
    refetch();
    setProcessing(null);
  };

  const reschedule = async (id: string) => {
    setProcessing(id);
    await fetch(`${API}/api/chapters/${id}/reschedule`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_publicacion: newFecha || null }),
    });
    setEditingId(null);
    refetch();
    setProcessing(null);
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('¿Eliminar este capítulo? Esta acción no se puede deshacer.')) return;
    setProcessing(id);
    await fetch(`${API}/api/chapters/${id}`, { method: 'DELETE', headers: authHeaders() });
    refetch();
    setProcessing(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Agenda de Publicaciones</h2>
          <p className="text-gray-500 text-sm mt-1">{data?.capitulos?.length ?? 0} capítulos en espera</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition">
          <RefreshCw size={15}/> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : data?.capitulos?.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
          <Check size={40} className="mb-3 text-emerald-400"/>
          <p className="font-medium">No hay capítulos programados</p>
          <p className="text-sm mt-1">Los capítulos subidos aparecen aquí antes de publicarse</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data?.capitulos?.map(cap => {
            const esProgramado = cap.estado === 'programado' && cap.fecha_publicacion;
            const fechaLocal = cap.fecha_publicacion ? new Date(cap.fecha_publicacion) : null;
            const yaVencio = fechaLocal && fechaLocal < new Date();
            return (
              <div key={cap.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge estado={cap.estado}/>
                      {esProgramado && !yaVencio && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Clock size={10}/> {fechaLocal!.toLocaleString('es', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="font-bold dark:text-white">{cap.manga_titulo}</p>
                    <p className="text-sm text-gray-500">
                      Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''} · por <strong className="text-rose-400">{cap.uploader_username}</strong>
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {editingId === cap.id ? (
                      <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                        <input type="datetime-local" value={newFecha} onChange={e => setNewFecha(e.target.value)}
                          className="min-w-0 flex-1 sm:flex-none bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-2 py-1.5 rounded-lg text-xs dark:text-white focus:border-rose-500 outline-none"/>
                        <button onClick={() => reschedule(cap.id)} disabled={processing === cap.id}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                          {processing === cap.id ? <Loader2 size={12} className="animate-spin"/> : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"><X size={12}/></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => publishNow(cap.id)} disabled={processing === cap.id}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50">
                          {processing === cap.id ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Publicar ahora
                        </button>
                        <button onClick={() => { setEditingId(cap.id); setNewFecha(cap.fecha_publicacion?.slice(0,16) || ''); }}
                          className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition hover:bg-blue-200 dark:hover:bg-blue-500/20">
                          <Clock size={12}/> Reprogramar
                        </button>
                        <button onClick={() => deleteChapter(cap.id)} disabled={processing === cap.id}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
                          <Trash2 size={14}/>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  SECCIÓN: USUARIOS
// ============================================================
function SectionUsuarios() {
  const { data, loading, refetch } = useAPI<{ usuarios: Usuario[] }>('/api/admin/users');
  const currentUser = getUser();
  const isSuperAdmin = !!currentUser?.is_superadmin;

  // Crear usuario
  const [showForm, setShowForm]     = useState(false);
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rol, setRol]               = useState('uploader');
  const [userScanId, setUserScanId] = useState('');
  const [scansList, setScansList]   = useState<{id:string; nombre:string}[]>([]);
  const [saving, setSaving]         = useState(false);
  const [feedback, setFeedback]     = useState<string | null>(null);

  // Filtros
  const [searchQ, setSearchQ]       = useState('');
  const [scanFilter, setScanFilter] = useState('');
  const [rolFilter, setRolFilter]   = useState('');

  // Cambiar scan
  const [editScanId, setEditScanId]   = useState<string | null>(null);
  const [editScanVal, setEditScanVal] = useState('');

  // Cambiar rol
  const [editRolId, setEditRolId]     = useState<string | null>(null);
  const [editRolVal, setEditRolVal]   = useState('');
  const [editRolLoad, setEditRolLoad] = useState(false);
  const [editScanMsg, setEditScanMsg] = useState<string | null>(null);
  const [editScanLoad, setEditScanLoad] = useState(false);

  // Reset contraseña
  const [resetingId, setResetingId] = useState<string | null>(null);
  const [newPwd, setNewPwd]         = useState('');
  const [resetMsg, setResetMsg]     = useState<string | null>(null);
  const [resetLoading, setResetLoad] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/scans`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setScansList(d.scans || []));
  }, []);

  const filtered = (data?.usuarios ?? []).filter(u => {
    const q = searchQ.toLowerCase();
    const matchQ   = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchScan = !scanFilter || (scanFilter === '__none__' ? !u.scan_id : u.scan_id === scanFilter);
    const matchRol  = !rolFilter || u.rol === rolFilter;
    return matchQ && matchScan && matchRol;
  });

  const handleResetPassword = async (userId: string) => {
    if (!newPwd || newPwd.length < 6) { setResetMsg('❌ Mínimo 6 caracteres'); return; }
    setResetLoad(true); setResetMsg(null);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPwd }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setResetMsg('✅ Contraseña actualizada');
      setNewPwd('');
      setTimeout(() => { setResetingId(null); setResetMsg(null); }, 1500);
    } catch (e: any) { setResetMsg(`❌ ${e.message}`); }
    finally { setResetLoad(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, rol, scan_id: userScanId || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setFeedback(`✅ Usuario "${username}" creado`);
      setUsername(''); setEmail(''); setPassword(''); setUserScanId('');
      refetch();
      setTimeout(() => setShowForm(false), 1500);
    } catch (err: any) { setFeedback(`❌ ${err.message}`); }
    finally { setSaving(false); }
  };

  const toggleActivo = async (u: Usuario) => {
    await fetch(`${API}/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: u.rol, activo: !u.activo }),
    });
    refetch();
  };

  const handleChangeRol = async (userId: string) => {
    const u = data?.usuarios?.find(x => x.id === userId);
    if (!u) return;
    setEditRolLoad(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: editRolVal, activo: u.activo }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      refetch();
      setTimeout(() => setEditRolId(null), 800);
    } catch (e: any) { alert(`Error: ${e.message}`); }
    finally { setEditRolLoad(false); }
  };

  const handleChangeScan = async (userId: string) => {
    const u = data?.usuarios?.find(x => x.id === userId);
    if (!u) return;
    setEditScanLoad(true); setEditScanMsg(null);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: u.rol, activo: u.activo, scan_id: editScanVal || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setEditScanMsg('✅ Scan actualizado');
      refetch();
      setTimeout(() => { setEditScanId(null); setEditScanMsg(null); }, 1200);
    } catch (e: any) { setEditScanMsg(`❌ ${e.message}`); }
    finally { setEditScanLoad(false); }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Gestión de Usuarios</h2>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} de {data?.usuarios?.length ?? 0} miembros</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
          <UserPlus size={16}/> Nuevo Usuario
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Buscar por username o email..."
            className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 px-4 py-2.5 pl-9 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
          />
          <Eye size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        </div>
        <select value={scanFilter} onChange={e => setScanFilter(e.target.value)}
          className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
          <option value="">Todos los scans</option>
          <option value="__none__">Sin scan</option>
          {scansList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select value={rolFilter} onChange={e => setRolFilter(e.target.value)}
          className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
          <option value="">Todos los roles</option>
          <option value="admin_scan">Admin Scan</option>
          <option value="uploader">Uploader</option>
          <option value="lector">Lector</option>
        </select>
        {(searchQ || scanFilter || rolFilter) && (
          <button onClick={() => { setSearchQ(''); setScanFilter(''); setRolFilter(''); }}
            className="px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-rose-500 border border-gray-200 dark:border-white/10 hover:border-rose-300 transition flex items-center gap-1.5">
            <X size={13}/> Limpiar
          </button>
        )}
      </div>

      {/* Form crear usuario */}
      {showForm && (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold dark:text-white mb-5 flex items-center gap-2"><ShieldCheck size={16} className="text-rose-500"/> Crear Usuario del Staff</h3>
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
              {feedback}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Username', value: username, set: setUsername, type: 'text', ph: 'Ej: Alex_Clean' },
              { label: 'Email', value: email, set: setEmail, type: 'email', ph: 'correo@scan.com' },
              { label: 'Contraseña', value: password, set: setPassword, type: 'password', ph: '••••••••' },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{f.label} *</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} required placeholder={f.ph}
                  className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rol</label>
              <select value={rol} onChange={e => setRol(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="uploader">Uploader / Ayudante</option>
                <option value="admin_scan">Admin de Scan</option>
                {isSuperAdmin && <option value="admin">Admin</option>}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Layers size={11}/> Scan Asignado</label>
              <select value={userScanId} onChange={e => setUserScanId(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="">— Sin scan —</option>
                {scansList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>}
                {saving ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Users size={32} className="mb-2 opacity-30"/>
              <p className="text-sm font-medium">No hay usuarios que coincidan con el filtro</p>
            </div>
          )}
          {filtered.map((u, i) => (
            <div key={u.id} className={`${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
              {/* Fila principal: avatar + info + badges */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/2 transition">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {u.scan_nombre && (
                    <span className="hidden sm:flex text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 items-center gap-1">
                      <Layers size={10}/> {u.scan_nombre}
                    </span>
                  )}
                  <Badge estado={u.rol}/>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/5'}`}>
                    {u.activo ? 'Activo' : 'Bloqueado'}
                  </span>
                </div>
              </div>
              {/* Fila de acciones (solo superadmin) */}
              {u.rol !== 'superadmin' && isSuperAdmin && (
                <div className="flex items-center gap-1.5 px-4 sm:px-5 pb-2 flex-wrap">
                  {u.scan_nombre && (
                    <span className="sm:hidden text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 flex items-center gap-1">
                      <Layers size={10}/> {u.scan_nombre}
                    </span>
                  )}
                  {editRolId === u.id ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <select value={editRolVal} onChange={e => setEditRolVal(e.target.value)} autoFocus
                        className="bg-gray-50 dark:bg-black/40 border border-rose-300 dark:border-rose-500/40 px-2 py-1 rounded-lg text-xs dark:text-white outline-none">
                        <option value="uploader">Uploader</option>
                        <option value="admin_scan">Admin Scan</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => handleChangeRol(u.id)} disabled={editRolLoad}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition">
                        {editRolLoad ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>}
                      </button>
                      <button onClick={() => setEditRolId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                        <X size={12}/>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditRolId(u.id); setEditRolVal(u.rol); setEditScanId(null); setResetingId(null); }}
                      title="Cambiar rol" className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition">
                      <Edit3 size={14}/>
                    </button>
                  )}
                  <button onClick={() => { setEditScanId(editScanId === u.id ? null : u.id); setEditScanVal(u.scan_id || ''); setEditScanMsg(null); setEditRolId(null); }}
                    title="Cambiar scan" className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition">
                    <Layers size={14}/>
                  </button>
                  <button onClick={() => toggleActivo(u)} title={u.activo ? 'Bloquear' : 'Activar'}
                    className={`p-1.5 rounded-lg transition ${u.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                    {u.activo ? <Ban size={14}/> : <Check size={14}/>}
                  </button>
                  <button onClick={() => { setResetingId(resetingId === u.id ? null : u.id); setNewPwd(''); setResetMsg(null); setEditScanId(null); setEditRolId(null); }}
                    title="Resetear contraseña" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition">
                    <ShieldCheck size={14}/>
                  </button>
                </div>
              )}

              {/* Panel cambiar scan */}
              {isSuperAdmin && editScanId === u.id && (
                <div className="mx-5 mb-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-1.5">
                    <Layers size={13}/> Cambiar scan de <strong>{u.username}</strong>
                  </p>
                  {editScanMsg && (
                    <p className={`text-xs font-medium mb-2 ${editScanMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{editScanMsg}</p>
                  )}
                  <div className="flex gap-2">
                    <select value={editScanVal} onChange={e => setEditScanVal(e.target.value)}
                      className="flex-1 bg-white dark:bg-black/30 border border-violet-200 dark:border-white/10 px-3 py-2 rounded-lg text-sm dark:text-white focus:border-violet-400 outline-none">
                      <option value="">— Sin scan —</option>
                      {scansList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                    <button onClick={() => handleChangeScan(u.id)} disabled={editScanLoad}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
                      {editScanLoad ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Guardar
                    </button>
                    <button onClick={() => { setEditScanId(null); setEditScanMsg(null); }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition"><X size={14}/></button>
                  </div>
                </div>
              )}

              {/* Panel reset contraseña */}
              {isSuperAdmin && resetingId === u.id && (
                <div className="mx-5 mb-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={13}/> Nueva contraseña para <strong>{u.username}</strong>
                  </p>
                  {resetMsg && <p className={`text-xs font-medium mb-2 ${resetMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>{resetMsg}</p>}
                  <div className="flex gap-2">
                    <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword(u.id)}
                      className="flex-1 bg-white dark:bg-black/30 border border-amber-200 dark:border-white/10 px-3 py-2 rounded-lg text-sm dark:text-white focus:border-amber-400 outline-none transition"/>
                    <button onClick={() => handleResetPassword(u.id)} disabled={resetLoading}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
                      {resetLoading ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Guardar
                    </button>
                    <button onClick={() => { setResetingId(null); setNewPwd(''); setResetMsg(null); }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition"><X size={14}/></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  SECCIÓN: SCANS
// ============================================================
interface ScanDetail { scan: Scan; mangas: any[]; miembros: any[]; totalViews: number; }

function SectionScans() {
  const currentUser = getUser();
  const isSuperAdmin = !!currentUser?.is_superadmin;
  const { data, loading, refetch } = useAPI<{ scans: Scan[] }>('/api/scans');

  const [showForm, setShowForm]       = useState(false);
  const [nombre, setNombre]           = useState('');
  const [descripcion, setDesc]        = useState('');
  const [saving, setSaving]           = useState(false);
  const [feedback, setFeedback]       = useState<string | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [details, setDetails]         = useState<Record<string, ScanDetail>>({});
  const [loadingId, setLoadingId]     = useState<string | null>(null);

  const loadDetails = async (scanId: string) => {
    if (expandedId === scanId) { setExpandedId(null); return; }
    setLoadingId(scanId);
    try {
      const res = await fetch(`${API}/api/scans/${scanId}/details`, { headers: authHeaders() });
      const d = await res.json();
      setDetails(prev => ({ ...prev, [scanId]: d }));
      setExpandedId(scanId);
    } finally { setLoadingId(null); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      const res = await fetch(`${API}/api/scans`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setFeedback(`✅ Scan "${nombre}" creado`);
      setNombre(''); setDesc('');
      refetch();
      setTimeout(() => setShowForm(false), 1200);
    } catch (err: any) { setFeedback(`❌ ${err.message}`); }
    finally { setSaving(false); }
  };

  const toggleActivo = async (scan: Scan) => {
    await fetch(`${API}/api/scans/${scan.id}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: scan.nombre, descripcion: scan.descripcion, activo: !scan.activo }),
    });
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Grupos de Scan</h2>
          <p className="text-gray-500 text-sm mt-1">{data?.scans?.length ?? 0} scans registrados</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
            <Plus size={16}/> Nuevo Scan
          </button>
        )}
      </div>

      {showForm && isSuperAdmin && (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold dark:text-white mb-5 flex items-center gap-2"><Layers size={16} className="text-rose-500"/> Registrar Scan</h3>
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
              {feedback}
            </div>
          )}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre del Scan *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Crimson Scan"
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</label>
              <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Descripción del grupo..."
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none resize-none transition"/>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !nombre}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                {saving ? 'Creando...' : 'Crear Scan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className="flex flex-col gap-4">
          {data?.scans?.length === 0 && (
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
              <Layers size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No hay scans registrados</p>
              {isSuperAdmin && <p className="text-sm">Hacé click en "Nuevo Scan" para empezar</p>}
            </div>
          )}
          {data?.scans?.map(scan => {
            const det = details[scan.id];
            const isExpanded = expandedId === scan.id;
            const isLoading = loadingId === scan.id;
            return (
              <div key={scan.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {/* Fila principal del scan */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center text-violet-500 shrink-0 text-lg font-black">
                    {scan.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold dark:text-white">{scan.nombre}</p>
                    <p className="text-xs text-gray-400">{scan.descripcion || 'Sin descripción'}</p>
                  </div>

                  {/* Métricas rápidas */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={12}/> {scan.miembros} miembros</span>
                    {det && (
                      <>
                        <span className="flex items-center gap-1"><BookOpen size={12}/> {det.mangas.length} obras</span>
                        <span className="flex items-center gap-1"><Eye size={12}/> {det.totalViews.toLocaleString()} vistas</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scan.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                      {scan.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button onClick={() => loadDetails(scan.id)} disabled={isLoading}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-500/10 hover:text-violet-600 transition">
                      {isLoading ? <Loader2 size={12} className="animate-spin"/> : <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>}
                      {isExpanded ? 'Cerrar' : 'Ver detalles'}
                    </button>
                    {isSuperAdmin && (
                      <button onClick={() => toggleActivo(scan)}
                        className={`p-1.5 rounded-lg transition ${scan.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                        {scan.activo ? <Ban size={14}/> : <Check size={14}/>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel de detalles expandido */}
                {isExpanded && det && (
                  <div className="border-t border-gray-100 dark:border-white/5 px-5 py-5 bg-gray-50/50 dark:bg-white/2 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Mangas */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <BookOpen size={12}/> Obras ({det.mangas.length})
                        </h4>
                        {det.mangas.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin obras asignadas</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {det.mangas.map((m: any) => (
                              <div key={m.id} className="flex items-center justify-between bg-white dark:bg-[#111114] rounded-xl px-3 py-2.5 border border-gray-100 dark:border-white/5">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold dark:text-white truncate">{m.titulo}</p>
                                  <p className="text-[10px] text-gray-400">{m.tipo} · {m.caps_publicados} cap{m.caps_publicados !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className="text-xs text-gray-400 flex items-center gap-0.5"><Eye size={11}/> {m.views_total}</span>
                                  <Badge estado={m.estado}/>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Miembros */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Users size={12}/> Miembros ({det.miembros.length})
                        </h4>
                        {det.miembros.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Sin miembros asignados</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {det.miembros.map((m: any) => (
                              <div key={m.id} className="flex items-center justify-between bg-white dark:bg-[#111114] rounded-xl px-3 py-2.5 border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                                    {m.username.charAt(0).toUpperCase()}
                                  </div>
                                  <p className="text-sm font-semibold dark:text-white">{m.username}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge estado={m.rol}/>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                                    {m.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Métricas totales */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {[
                            { label: 'Obras', value: det.mangas.length, icon: <BookOpen size={14}/> },
                            { label: 'Vistas', value: det.totalViews.toLocaleString(), icon: <Eye size={14}/> },
                            { label: 'Caps', value: det.mangas.reduce((s: number, m: any) => s + (m.caps_publicados || 0), 0), icon: <BookMarked size={14}/> },
                          ].map(stat => (
                            <div key={stat.label} className="bg-white dark:bg-[#111114] rounded-xl p-3 border border-gray-100 dark:border-white/5 text-center">
                              <div className="text-violet-500 flex justify-center mb-1">{stat.icon}</div>
                              <p className="font-extrabold text-sm dark:text-white">{stat.value}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  SECCIÓN: CONFIGURACIÓN DEL SCAN (webhook Discord)
// ============================================================
function SectionConfig({ scanId }: { scanId: string }) {
  const [webhook, setWebhook] = useState('');
  const [saved, setSaved]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const { data: scanData, loading, refetch } = useAPI<any>(`/api/scans/${scanId}/details`);

  // Nuevo miembro
  const [showForm, setShowForm]   = useState(false);
  const [newUser, setNewUser]     = useState('');
  const [newEmail, setNewEmail]   = useState('');
  const [newPwd, setNewPwd]       = useState('');
  const [newRol, setNewRol]       = useState('uploader');
  const [creating, setCreating]   = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  useEffect(() => {
    if (scanData?.scan?.webhook_discord) setWebhook(scanData.scan.webhook_discord);
  }, [scanData]);

  const handleSave = async () => {
    setSaving(true); setSaved(null);
    try {
      const res = await fetch(`${API}/api/admin/scans/${scanId}/webhook`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_discord: webhook || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSaved('✅ Webhook guardado');
    } catch (e: any) { setSaved(`❌ ${e.message}`); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    if (!webhook) return;
    setTesting(true); setTestMsg(null);
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Webhook configurado correctamente',
            description: `El bot de **${scanData?.scan?.nombre || 'tu scan'}** está listo para notificaciones.`,
            color: 0xe11d48,
            footer: { text: "Crimson's Scan" },
            timestamp: new Date().toISOString(),
          }]
        }),
      });
      setTestMsg(res.ok ? '✅ Mensaje enviado al Discord' : '❌ URL inválida o sin permisos');
    } catch { setTestMsg('❌ No se pudo conectar con Discord'); }
    finally { setTesting(false); }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateMsg(null);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUser, email: newEmail, password: newPwd, rol: newRol, scan_id: scanId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setCreateMsg(`✅ Usuario "${newUser}" creado`);
      setNewUser(''); setNewEmail(''); setNewPwd(''); setNewRol('uploader');
      refetch();
      setTimeout(() => { setShowForm(false); setCreateMsg(null); }, 1500);
    } catch (e: any) { setCreateMsg(`❌ ${e.message}`); }
    finally { setCreating(false); }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-xl">
      <div>
        <h2 className="text-2xl font-extrabold dark:text-white">Mi Scan</h2>
        <p className="text-gray-500 text-sm mt-1">Miembros y notificaciones</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tu scan</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center text-violet-500 text-xl font-black">
                {scanData?.scan?.nombre?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold dark:text-white">{scanData?.scan?.nombre}</p>
                <p className="text-xs text-gray-400">{scanData?.scan?.descripcion || 'Sin descripción'}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Obras',    value: scanData?.mangas?.length ?? 0 },
                { label: 'Miembros', value: scanData?.miembros?.length ?? 0 },
                { label: 'Vistas',   value: (scanData?.totalViews ?? 0).toLocaleString() },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
                  <p className="font-extrabold text-lg dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Miembros del scan */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Miembros del scan ({scanData?.miembros?.length ?? 0})
                </p>
                <button onClick={() => { setShowForm(f => !f); setCreateMsg(null); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 transition">
                  <Plus size={13}/> Agregar miembro
                </button>
              </div>

              {/* Formulario nuevo miembro */}
              {showForm && (
                <form onSubmit={handleCreateMember} className="bg-gray-50 dark:bg-black/20 rounded-xl p-4 mb-3 flex flex-col gap-3 border border-gray-200 dark:border-white/10 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nuevo miembro</p>
                  {createMsg && (
                    <div className={`p-2 rounded-lg text-xs font-medium ${createMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                      {createMsg}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newUser} onChange={e => setNewUser(e.target.value)} required placeholder="Username" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-sm dark:text-white focus:border-rose-500 outline-none"/>
                    <input value={newEmail} onChange={e => setNewEmail(e.target.value)} required type="email" placeholder="Email" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-sm dark:text-white focus:border-rose-500 outline-none"/>
                    <input value={newPwd} onChange={e => setNewPwd(e.target.value)} required type="password" placeholder="Contraseña" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-sm dark:text-white focus:border-rose-500 outline-none"/>
                    <select value={newRol} onChange={e => setNewRol(e.target.value)} className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-sm dark:text-white focus:border-rose-500 outline-none">
                      <option value="uploader">Uploader</option>
                      <option value="admin_scan">Admin Scan</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={creating}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition">
                      {creating ? <Loader2 size={14} className="animate-spin"/> : <UserPlus size={14}/>}
                      {creating ? 'Creando...' : 'Crear'}
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {scanData?.miembros?.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">Sin miembros aún — agregá el primero</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {scanData?.miembros?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold dark:text-white truncate">{m.username}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge estado={m.rol}/>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                          {m.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook de Discord</p>
            <p className="text-xs text-gray-500 mb-4">
              Cuando se publique un capítulo de tu scan, el bot notifica automáticamente al canal.
              En Discord: Canal → Editar → Integraciones → Webhooks → Nuevo webhook.
            </p>
            {saved   && <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${saved.startsWith('✅')   ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{saved}</div>}
            {testMsg && <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${testMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{testMsg}</div>}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">URL del Webhook</label>
              <input
                value={webhook}
                onChange={e => { setWebhook(e.target.value); setSaved(null); }}
                placeholder="https://discord.com/api/webhooks/..."
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              {webhook && (
                <button onClick={handleTest} disabled={testing}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition">
                  {testing ? <Loader2 size={16} className="animate-spin"/> : null}
                  {testing ? 'Enviando...' : '🧪 Probar'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
