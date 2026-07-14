'use client';
import ContractModal from './components/ContractModal';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, BookOpen, Clock, Users, LogOut, Plus, Check, X,
  ChevronRight, ChevronDown, BookMarked, Eye, TrendingUp, RefreshCw, Loader2,
  AlertCircle, Edit3, UserPlus, ShieldCheck, Ban, Upload, Image as ImageIcon,
  Layers, Trash2, Menu, Settings, Mail, BarChart2, DollarSign, AtSign, Search, MessageSquare,
  ArrowUp, ArrowDown, Save, Download, FileText, AlertTriangle, MousePointerClick, Calendar
} from 'lucide-react';
import { getUser, getToken, authHeaders, logout, refreshUser } from '@/lib/auth';
import { toWebP } from '@/lib/webp';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

type Section = 'dashboard' | 'mangas' | 'revision' | 'usuarios' | 'scans' | 'config' | 'revenue' | 'seguridad' | 'soporte';

// ── Tipos ──────────────────────────────────────────────────
interface Stats { mangas: number; capitulos: number; scanners: number; pendientes: number; }
interface Manga { id: string; titulo: string; tipo: string; estado: string; cover_r2_key: string | null; views_total: number; fecha_actualizacion: string; scan_nombre?: string; descripcion?: string | null; es_adulto?: number; scan_id?: string | null; generos?: string; joint_scan_id?: string | null; joint_status?: string | null; joint_scan_nombre?: string | null; }
interface Capitulo { id: string; numero: number; titulo: string; estado: string; manga_titulo: string; manga_id: string; uploader_username: string; notas_admin: string | null; fecha_subida: string; num_paginas?: number; }
interface Usuario { id: string; username: string; email: string; rol: string; activo: number; fecha_registro: string; ultimo_acceso: string | null; scan_id?: string; scan_nombre?: string; cuenta_pendiente?: number | boolean; }
interface Scan { id: string; nombre: string; descripcion: string | null; activo: number; miembros: number; contrato_firmado?: number; representante_nombre?: string; representante_discord?: string; binance_pay_id?: string; }

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
    soporte:     'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
    uploader:    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    lector:      'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400',
    superadmin:  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    programado:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  };
  const labels: Record<string, string> = {
    admin_scan: 'Admin Scan',
    superadmin: 'SuperAdmin',
    soporte:    'Soporte',
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
    refreshUser().then(refreshed => {
      setUser(refreshed || getUser());
      setMounted(true);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr('');
    try {
      const { login } = await import('@/lib/auth');
      const u = await login(loginUser, loginPass);
      if (!u.is_superadmin && u.rol !== 'admin' && u.rol !== 'admin_scan' && u.rol !== 'soporte') {
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

  const [forceContract, setForceContract] = useState(false);

  useEffect(() => {
    const handleOpen = () => setForceContract(true);
    window.addEventListener('open-contract', handleOpen);
    
    const handleNav = (e: any) => {
      if (e.detail) setSection(e.detail);
    };
    window.addEventListener('nav-section', handleNav);
    
    return () => {
      window.removeEventListener('open-contract', handleOpen);
      window.removeEventListener('nav-section', handleNav);
    };
  }, []);

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
          <img src="/logo.png" alt="CrimsonScan" className="h-10 w-auto object-contain" />
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

          <p className="text-center text-xs text-gray-500 mt-2">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-rose-500 font-bold hover:underline">
              Registrate
            </Link>
          </p>
        </form>

        <Link href="/" className="block text-center text-xs text-gray-600 hover:text-gray-400 transition mt-5">
          ← Volver al sitio
        </Link>
      </div>
    </div>
  );

  const needsContract = user && user.scan_id && !user.is_superadmin && !user.scan_contrato_firmado && user.rol === 'admin_scan';

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">
      {(needsContract || forceContract) && <ContractModal scanId={user.scan_id!} onClose={() => setForceContract(false)} alreadySigned={!!user.scan_contrato_firmado} />}

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
          <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
          <div>
            <p className="font-bold text-sm dark:text-white leading-tight">
              {user.is_superadmin ? 'CrimsonHQ' : (user.scan_nombre || 'Admin Panel')}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{
              color: user.is_superadmin ? '#f59e0b' : user.rol === 'admin_scan' ? '#f97316' : user.rol === 'soporte' ? '#14b8a6' : '#f43f5e'
            }}>
              {user.is_superadmin ? '⚡ SuperAdmin' : user.rol === 'admin_scan' ? '🛡 Admin Scan' : user.rol === 'soporte' ? '🎧 Soporte' : 'Admin'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1 mt-2">
          {([
            { id: 'dashboard', icon: <LayoutDashboard size={16}/>, label: 'Dashboard', show: true },
            { id: 'mangas',    icon: <BookOpen size={16}/>,        label: 'Proyectos', show: true },
            { id: 'revision',  icon: <Clock size={16}/>,           label: 'Agenda',    show: true },
            { id: 'scans',     icon: <Layers size={16}/>,          label: 'Scans',     show: !!user.is_superadmin },
            { id: 'revenue',   icon: <BarChart2 size={16}/>,       label: 'Revenue',   show: !!user.is_superadmin || ((user.rol === 'admin' || user.rol === 'admin_scan') && !!user.scan_id) },
            { id: 'usuarios',  icon: <Users size={16}/>,           label: 'Usuarios',  show: !!user.is_superadmin || user.rol === 'soporte' },
            { id: 'seguridad', icon: <ShieldCheck size={16}/>,     label: 'Auditoría / Logs', show: !!user.is_superadmin || user.rol === 'soporte' },
            { id: 'config',    icon: <Settings size={16}/>,        label: 'Mi Scan',   show: !user.is_superadmin && (user.rol === 'admin' || user.rol === 'admin_scan') && !!user.scan_id },
            { id: 'soporte',   icon: <MessageSquare size={16}/>,   label: 'Soporte',   show: !!user.is_superadmin || user.rol === 'soporte' },
          ] as const).filter(item => item.show).map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold transition-all ${
                section === item.id
                  ? 'border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 rounded-r-xl rounded-l-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl'
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
          {section === 'revenue'   && <SectionRevenue />}
          {section === 'usuarios'  && <SectionUsuarios />}
          {section === 'seguridad' && <SectionSeguridad />}
          {section === 'config'    && <SectionConfig scanId={user.scan_id!} />}
          {section === 'soporte'   && <SectionSoporte />}
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
  const { data: manga_data } = useAPI<{ mangas: Manga[] }>('/api/mangas?admin=1');

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
          <StatCard icon={<BookMarked size={20}/>}  label="Proyectos"          value={data?.mangas ?? 0}     color="bg-blue-50 dark:bg-blue-500/10 text-blue-500"/>
          <StatCard icon={<BookOpen size={20}/>}    label="Caps Publicados"    value={data?.capitulos ?? 0}   color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"/>
          <StatCard icon={<Users size={20}/>}       label="Scanners"           value={data?.scanners ?? 0}    color="bg-purple-50 dark:bg-purple-500/10 text-purple-500"/>
          <StatCard icon={<Clock size={20}/>}       label="Caps. en Revisión"  value={data?.pendientes ?? 0}  color="bg-amber-50 dark:bg-amber-500/10 text-amber-500"/>
        </div>
      )}

      {/* Últimos mangas */}
      <div>
        <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-rose-500"/> Proyectos Recientes
        </h3>
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          {manga_data?.mangas?.slice(0, 5).map((m, i) => (
            <div key={m.id} className={`flex items-center justify-between px-5 py-3.5 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-200 dark:border-white/10">
                  <img src={m.cover_r2_key ? `${API}/api/cover/${m.id}` : '/portada.jpg'} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm dark:text-white">{m.titulo}</p>
                  <p className="text-xs text-gray-400">{m.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12}/> {m.views_total}</span>
                <Badge estado={m.estado}/>
                <Link href={`/uploader?manga_id=${m.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shrink-0 ml-1">
                  <Upload size={14}/>
                </Link>
                <button onClick={() => window.dispatchEvent(new CustomEvent('nav-section', { detail: 'mangas' }))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0">
                  <Edit3 size={14}/>
                </button>
              </div>
            </div>
          )) ?? <p className="text-gray-400 text-sm p-5">No hay proyectos aún.</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SECCIÓN: MANGAS
// ============================================================
const GENRES_LIST = [
  'Acción','Aventura','Comedia','Drama','Fantasía','Romance','Horror','Misterio','Psicológico',
  'Ciencia Ficción','Sobrenatural','Thriller','Deportes','Histórico','Isekai','Mecha','Magia',
  'Artes Marciales','Superpoderes','Reencarnación','Supervivencia','Escolar','Vida Escolar',
  'Recuentos de la Vida (Slice of Life)','Tragedia','Adulto','Maduro','Ecchi','Harem','Harem Inverso',
  'Seinen','Shounen','Shoujo','Josei','Género Bender','Crossdressing','Apocalipsis','Postapocalíptico',
  'Sistema','Videojuegos','VRMMO','Cultivación','Wuxia','Xianxia','Xuanhuan','Murim','Regresión',
  'Regresor','Viaje en el Tiempo','Venganza','Villana','Realeza','Nobleza','Política','Militar',
  'Médico','Cocina','Música','Idol','Oficina','Crimen','Detectives','Mafia','Monstruos','Demonios',
  'Ángeles','Vampiros','Zombies','Mazmorras','Cazadores','Invocación','Magia Oscura','Alquimia',
  'Bestias Mágicas','Omegaverse','BL (Boys Love)','GL (Girls Love)','Yuri','Yaoi','Shounen Ai',
  'Josei Ai','Harén Masculino','Harén Femenino','Sadomasoquismo',
];

function MangaForm({ initial, onSave, onCancel, title, isSuperAdmin }: {
  initial?: Partial<Manga>;
  onSave: (data: any, coverFile: File | null) => Promise<void>;
  onCancel: () => void;
  title: string;
  isSuperAdmin: boolean;
}) {
  const currentUser = getUser();
  const [titulo, setTitulo]       = useState(initial?.titulo || '');
  const [tipo, setTipo]           = useState(initial?.tipo || 'manga');
  const [estado, setEstado]       = useState(initial?.estado || 'en_curso');
  const [descripcion, setDesc]    = useState(initial?.descripcion || '');
  const [jointScanId, setJointScanId] = useState(initial?.joint_scan_id || '');
  const [scanId, setScanId]       = useState(
    isSuperAdmin
      ? (initial?.scan_id || '')
      : (initial?.scan_id || currentUser?.scan_id || '')
  );
  const [scans, setScans]         = useState<{id:string; nombre:string}[]>([]);
  const [generos, setGeneros]     = useState<string[]>(() => {
    try { return initial ? JSON.parse(initial.generos || '[]') : []; } catch { return []; }
  });
  const [esAdulto, setEsAdulto]   = useState<boolean>(!!(initial?.es_adulto));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving]       = useState(false);
  const [feedback, setFeedback]   = useState<string | null>(null);

  // Combobox states
  const [genreSearch, setGenreSearch] = useState('');
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [jointSearch, setJointSearch] = useState('');
  const [showJointMenu, setShowJointMenu] = useState(false);
  const genreInputRef = useRef<HTMLInputElement>(null);
  const jointInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/scans`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setScans(d.scans || []));
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
       if (genreInputRef.current && !genreInputRef.current.contains(e.target as Node)) setShowGenreMenu(false);
       if (jointInputRef.current && !jointInputRef.current.contains(e.target as Node)) setShowJointMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleGenre = (g: string) => setGeneros(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await onSave({ titulo, tipo, estado, descripcion, generos, scan_id: scanId || null, joint_scan_id: jointScanId || null, es_adulto: esAdulto }, coverFile);
      setFeedback('✅ Guardado');
      setTimeout(onCancel, 1200);
    } catch (err: any) {
      setFeedback(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredGenres = GENRES_LIST.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));
  const filteredJoints = scans.filter(s => s.id !== scanId && s.id !== currentUser?.scan_id && s.nombre.toLowerCase().includes(jointSearch.toLowerCase()));

  // We find the selected joint scan name
  const selectedJointName = scans.find(s => s.id === jointScanId)?.nombre || '';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onCancel} />
      
      <div className="relative w-full max-w-[600px] h-full bg-white dark:bg-[#111114] shadow-2xl overflow-y-auto p-8 animate-in slide-in-from-right duration-300 flex flex-col">
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
          <X size={20}/>
        </button>
        
        <h3 className="font-bold dark:text-white mb-6 flex items-center gap-2 text-xl">
           <Plus size={20} className="text-rose-500"/> {title}
        </h3>
        
        {feedback && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
            {feedback}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ej: Solo Leveling Ragnarok"
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
            </div>
            
            {isSuperAdmin && (
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Layers size={11}/> Scan Responsable</label>
                <select value={scanId} onChange={e => setScanId(e.target.value)}
                  className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                  <option value="">— Sin asignar —</option>
                  {scans.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="manga">Manga</option>
                <option value="manhwa">Manhwa</option>
                <option value="manhua">Manhua</option>
                <option value="novela">Novela</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="en_curso">En curso</option>
                <option value="completado">Completado</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2 md:col-span-2 relative" ref={jointInputRef}>
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">🤝 Joint (Opcional)</label>
               <div className="relative">
                 <input 
                   type="text" 
                   value={showJointMenu ? jointSearch : selectedJointName} 
                   onChange={e => {
                     setJointSearch(e.target.value);
                     if (e.target.value === '' && !showJointMenu) setJointScanId('');
                   }}
                   onFocus={() => setShowJointMenu(true)}
                   placeholder="Buscar un grupo aliado..."
                   className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
                 />
                 {jointScanId && !showJointMenu && (
                   <button type="button" onClick={() => { setJointScanId(''); setJointSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                     <X size={14}/>
                   </button>
                 )}
               </div>
               
               {showJointMenu && (
                 <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                    {filteredJoints.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500 italic">No hay grupos disponibles</p>
                    ) : (
                      filteredJoints.map(s => (
                        <button 
                          key={s.id} 
                          type="button" 
                          onClick={() => { setJointScanId(s.id); setJointSearch(''); setShowJointMenu(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center gap-2 dark:text-white"
                        >
                          <span className={`w-2 h-2 rounded-full ${s.id ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {s.nombre}
                        </button>
                      ))
                    )}
                 </div>
               )}
            </div>
            
            <div className="flex items-center gap-3 mt-1 md:col-span-2">
              <button type="button" onClick={() => setEsAdulto(v => !v)}
                className={`w-11 h-6 rounded-full transition-colors shrink-0 ${esAdulto ? 'bg-rose-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 mt-0.5 ${esAdulto ? 'translate-x-5' : 'translate-x-0'}`}/>
              </button>
              <span className="text-sm dark:text-white font-medium">Contenido +18</span>
            </div>
          </div>
  
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sinopsis</label>
            <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Descripción de la obra..."
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none resize-none transition"/>
          </div>
  
          <div className="flex flex-col gap-2 relative" ref={genreInputRef}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
              Géneros
              {generos.length > 0 && <span className="text-rose-500 normal-case text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-full">{generos.length} seleccionados</span>}
            </label>
            <input 
               type="text" 
               value={genreSearch} 
               onChange={e => setGenreSearch(e.target.value)}
               onFocus={() => setShowGenreMenu(true)}
               placeholder="Buscar géneros..."
               className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
            />
            
            {showGenreMenu && (
              <div className="absolute top-[68px] left-0 right-0 max-h-48 overflow-y-auto bg-white dark:bg-[#1a1a1f] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                 {filteredGenres.length === 0 ? (
                   <p className="px-4 py-3 text-sm text-gray-500 italic">No hay géneros que coincidan</p>
                 ) : (
                   filteredGenres.map(g => (
                     <button 
                       key={g} 
                       type="button" 
                       onClick={() => { toggleGenre(g); setGenreSearch(''); setShowGenreMenu(false); }}
                       className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center justify-between dark:text-white"
                     >
                       {g}
                       {generos.includes(g) && <Check size={14} className="text-rose-500"/>}
                     </button>
                   ))
                 )}
              </div>
            )}
            
            {generos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {generos.map(g => (
                  <span key={g} className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-rose-100 dark:border-rose-500/20">
                    {g}
                    <button type="button" onClick={() => toggleGenre(g)} className="hover:bg-rose-200 dark:hover:bg-rose-500/30 rounded-full p-0.5 transition">
                      <X size={12}/>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
  
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"><ImageIcon size={12}/> Portada</label>
            <input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; setCoverFile(f ? await toWebP(f, 800) : null); }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700 dark:file:bg-rose-500/10 dark:file:text-rose-400 cursor-pointer border border-dashed border-gray-200 dark:border-white/10 rounded-xl py-2 px-2 hover:bg-gray-50 dark:hover:bg-white/2 transition"/>
          </div>
  
          <div className="flex gap-4 mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
            <button type="submit" disabled={saving || !titulo}
              className="flex-1 flex justify-center items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg hover:shadow-rose-500/25">
              {saving ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
              {saving ? 'Guardando Obra...' : 'Guardar Obra'}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 flex justify-center px-5 py-3.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MangaChapter { id: string; numero: number; titulo: string | null; views: number; fecha_subida: string; estado: string; }

function SectionMangas() {
  const { data, loading, refetch } = useAPI<{ mangas: Manga[] }>('/api/mangas?admin=1');
  const { data: pendingJointsData, refetch: refetchJoints } = useAPI<any[]>('/api/admin/joints/pending');
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingManga, setEditing]  = useState<Manga | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('Todos');
  const [capsByManga, setCapsByManga] = useState<Record<string, MangaChapter[]>>({});
  const [loadingCaps, setLoadingCaps] = useState<string | null>(null);
  const [deletingCap, setDeletingCap] = useState<string | null>(null);
  const [downloadingCap, setDownloadingCap] = useState<string | null>(null);
  const [reorderingCap, setReorderingCap] = useState<string | null>(null);
  const [editPages, setEditPages] = useState<{id:string; orden:number; filename:string; image_url:string}[]>([]);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);
  const [savingOrder, setSavingOrder] = useState<boolean>(false);
  const [disableModal, setDisableModal] = useState<{manga: Manga} | null>(null);
  const [disableRazon, setDisableRazon] = useState('');
  const [disabling, setDisabling] = useState(false);
  const currentUser = getUser();
  const isReadOnly   = currentUser?.rol === 'soporte';
  const isSuperAdmin = !!currentUser?.is_superadmin;
  const isGlobalAdmin = isSuperAdmin || currentUser?.rol === 'admin';

  const toggleCaps = async (mangaId: string) => {
    if (expandedId === mangaId) { setExpandedId(null); return; }
    setExpandedId(mangaId);
    if (capsByManga[mangaId]) return;
    setLoadingCaps(mangaId);
    const res = await fetch(`${API}/api/mangas/${mangaId}?admin=1`, { headers: authHeaders() });
    const d = await res.json();
    setCapsByManga(prev => ({ ...prev, [mangaId]: d.capitulos || [] }));
    setLoadingCaps(null);
  };

  const deleteChapterFromManga = async (mangaId: string, capId: string) => {
    if (!confirm('¿Eliminar este capítulo? Esta acción no se puede deshacer.')) return;
    setDeletingCap(capId);
    await fetch(`${API}/api/chapters/${capId}`, { method: 'DELETE', headers: authHeaders() });
    setCapsByManga(prev => ({ ...prev, [mangaId]: prev[mangaId].filter(c => c.id !== capId) }));
    setDeletingCap(null);
  };

  const handleDownloadChapter = async (manga: Manga, cap: MangaChapter) => {
    setDownloadingCap(cap.id);
    try {
      const res = await fetch(`${API}/api/admin/chapters/${cap.id}/pages/list`, { headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');
      const pages = d.pages || [];
      if (pages.length === 0) { alert('El capítulo no tiene páginas.'); setDownloadingCap(null); return; }
      
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const folderName = `${manga.titulo} - Cap ${cap.numero}`;
      const folder = zip.folder(folderName);
      
      for (const p of pages) {
        const imgRes = await fetch(p.image_url);
        const blob = await imgRes.blob();
        folder?.file(p.filename || `page_${p.orden}.webp`, blob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error al descargar: ${e.message}`);
    } finally {
      setDownloadingCap(null);
    }
  };

  const openReorder = async (capId: string) => {
    if (reorderingCap === capId) {
      setReorderingCap(null);
      return;
    }
    setReorderingCap(capId);
    setLoadingPages(true);
    setEditPages([]);
    try {
      const res = await fetch(`${API}/api/admin/chapters/${capId}/pages/list`, { headers: authHeaders() });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setEditPages(d.pages || []);
    } catch (e: any) {
      alert(`Error al cargar páginas: ${e.message}`);
      setReorderingCap(null);
    } finally {
      setLoadingPages(false);
    }
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const a = [...editPages];
    [a[i - 1], a[i]] = [a[i], a[i - 1]];
    setEditPages(a.map((p, j) => ({ ...p, orden: j + 1 })));
  };

  const moveDown = (i: number) => {
    if (i === editPages.length - 1) return;
    const a = [...editPages];
    [a[i], a[i + 1]] = [a[i + 1], a[i]];
    setEditPages(a.map((p, j) => ({ ...p, orden: j + 1 })));
  };

  const saveReorder = async (capId: string) => {
    setSavingOrder(true);
    try {
      const res = await fetch(`${API}/api/admin/chapters/${capId}/pages/reorder`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: editPages }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
      setReorderingCap(null);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setSavingOrder(false);
    }
  };

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

  const handleDelete = async (manga: Manga) => {
    if (!confirm(`¿Eliminar "${manga.titulo}"? Se borrarán todos sus capítulos y páginas. Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`${API}/api/mangas/${manga.id}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Error al eliminar'); return; }
    refetch();
  };

  const handleJointAction = async (mangaId: string, action: 'aprobado' | 'rechazado') => {
    try {
      const res = await fetch(`${API}/api/admin/joints/${mangaId}/action`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      refetchJoints();
      refetch();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleDisableManga = async (manga: Manga, disable: boolean) => {
    setDisabling(true);
    try {
      const res = await fetch(`${API}/api/admin/mangas/${manga.id}/disable`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ disable, razon: disableRazon || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setDisableModal(null);
      setDisableRazon('');
      refetch();
    } catch (e: any) { alert(`Error: ${e.message}`); }
    finally { setDisabling(false); }
  };

  const handleLeaveJoint = async (manga: Manga) => {
    if (!confirm(`¿Confirmas que querés salir del joint de "${manga.titulo}"? Tu scan ya no aparecerá como colaborador.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/joints/${manga.id}/leave`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      refetch();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {pendingJointsData && pendingJointsData.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm">
          <h3 className="text-amber-800 dark:text-amber-400 font-extrabold mb-3 flex items-center gap-2"><AlertCircle size={18}/> Invitaciones a Joints ({pendingJointsData.length})</h3>
          <div className="flex flex-col gap-3">
            {pendingJointsData.map((j: any) => (
               <div key={j.id} className="flex items-center justify-between bg-white dark:bg-black/30 p-3.5 rounded-xl border border-amber-100 dark:border-amber-500/10">
                 <div>
                   <p className="font-bold text-sm dark:text-white flex items-center gap-2">{j.titulo} <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pendiente</span></p>
                   <p className="text-xs text-amber-700 dark:text-amber-200/70 mt-0.5 font-medium">Invitado por: <span className="text-rose-500 font-bold">{j.scan_nombre}</span></p>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => handleJointAction(j.id, 'aprobado')} className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-500/20">Aceptar</button>
                   <button onClick={() => handleJointAction(j.id, 'rechazado')} className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-red-500/20">Rechazar</button>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Gestión de Proyectos</h2>
          <p className="text-gray-500 text-sm mt-1">{data?.mangas?.length ?? 0} obras en total</p>
        </div>
        {!isReadOnly && (
          <button onClick={() => { setShowCreate(!showCreate); setEditing(null); }}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
            <Plus size={16}/> Nueva Obra
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {['Todos', 'Manga', 'Manhwa', 'Manhua', 'Novela'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === t ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'bg-white dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            <LayoutDashboard size={16} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            <Layers size={16} />
          </button>
        </div>
      </div>

      {showCreate && !editingManga && (
        <MangaForm title="Crear Nueva Obra" onSave={handleCreate} onCancel={() => setShowCreate(false)} isSuperAdmin={isSuperAdmin} />
      )}

      {editingManga && (
        <MangaForm title={`Editar: ${editingManga.titulo}`} initial={editingManga} onSave={handleEdit} onCancel={() => setEditing(null)} isSuperAdmin={isSuperAdmin} />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className={`${viewMode === 'list' ? 'bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}`}>
          {(!data?.mangas || data.mangas.length === 0) && (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <BookOpen size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No hay proyectos creados aún</p>
              <p className="text-sm">Hacé click en "Nueva Obra" para empezar</p>
            </div>
          )}
          {data?.mangas?.filter(m => filterType === 'Todos' || m.tipo.toLowerCase() === filterType.toLowerCase()).map((m, i) => (
            <div key={m.id} className={viewMode === 'list' ? (i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : '') : 'bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col'}>
              <div className={viewMode === 'list' ? 'flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-white/2 transition' : 'flex flex-col gap-3 p-4 flex-1'}>
                <div className={viewMode === 'list' ? 'w-10 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 flex items-center justify-center text-gray-300' : 'w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 flex items-center justify-center text-gray-300 relative group'}>
                  {m.cover_r2_key ? (
                    <img src={`${API}/api/cover/${m.id}`} alt={m.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={viewMode === 'list' ? 16 : 32}/>
                  )}
                  {viewMode === 'grid' && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <button onClick={() => toggleCaps(m.id)} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                        <BookOpen size={16}/> Capítulos
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className={`font-bold text-sm dark:text-white ${viewMode === 'list' ? 'truncate' : 'line-clamp-2'}`} title={m.titulo}>{m.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate uppercase tracking-wider">{m.tipo}</p>
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
                  <div className={`flex ${viewMode === 'list' ? 'items-center shrink-0' : 'justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5'} gap-2`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={12}/>{m.views_total}</span>
                      <Badge estado={m.estado}/>
                    </div>
                    <div className="flex items-center gap-1">
                      {viewMode === 'list' && (
                        <button onClick={() => toggleCaps(m.id)}
                          className={`p-1.5 rounded-lg transition ${expandedId === m.id ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'}`}
                          title="Ver capítulos">
                          <ChevronDown size={14} className={`transition-transform ${expandedId === m.id ? 'rotate-180' : ''}`}/>
                        </button>
                      )}
                      {/* Salir del joint — solo visible si el scan actual es el joint */}
                      {!isReadOnly && m.joint_scan_id && m.joint_status === 'aprobado' && !isGlobalAdmin && (
                        <button onClick={() => handleLeaveJoint(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"
                          title="Salir del joint">
                          <span className="text-[10px] font-bold leading-none">EXIT</span>
                        </button>
                      )}
                      {!isReadOnly && (
                        <button onClick={() => { setEditing(m); setShowCreate(false); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition" title="Editar">
                          <Edit3 size={14}/>
                        </button>
                      )}
                      {/* Deshabilitar obra — solo admin global o superadmin */}
                      {isGlobalAdmin && (
                        m.estado === 'deshabilitado' ? (
                          <button onClick={() => handleDisableManga(m, false)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                            title="Reactivar obra">
                            <Check size={14}/>
                          </button>
                        ) : (
                          <button onClick={() => { setDisableModal({ manga: m }); setDisableRazon(''); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
                            title="Deshabilitar obra">
                            <Ban size={14}/>
                          </button>
                        )
                      )}
                      {!isReadOnly && (
                        <button onClick={() => handleDelete(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Eliminar">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {expandedId === m.id && (
                <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 px-5 py-3">
                  {loadingCaps === m.id ? (
                    <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-rose-500"/></div>
                  ) : (capsByManga[m.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Sin capítulos</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {(capsByManga[m.id] || []).map(cap => (
                        <div key={cap.id} className="flex flex-col">
                          <div className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-white/5 transition">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge estado={cap.estado}/>
                              <span className="text-sm dark:text-white font-medium">Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={10}/>{cap.views}</span>
                              <button onClick={() => handleDownloadChapter(m, cap)} disabled={downloadingCap === cap.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition disabled:opacity-50" title="Descargar Capítulo">
                                {downloadingCap === cap.id ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
                              </button>
                              {!isReadOnly && (
                                <button onClick={() => openReorder(cap.id)}
                                  className={`p-1.5 rounded-lg transition ${reorderingCap === cap.id ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`} title="Editar páginas">
                                  <ImageIcon size={12}/>
                                </button>
                              )}
                              {!isReadOnly && (
                                <button onClick={() => deleteChapterFromManga(m.id, cap.id)} disabled={deletingCap === cap.id}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50" title="Eliminar">
                                  {deletingCap === cap.id ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {reorderingCap === cap.id && (
                            <div className="bg-gray-100 dark:bg-black/40 rounded-xl p-4 mt-2 mb-3 mx-2 border border-gray-200 dark:border-white/10 shadow-inner">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold dark:text-white flex items-center gap-2">
                                  <ImageIcon size={14} className="text-indigo-500"/> Páginas (Cap. {cap.numero})
                                </h4>
                                <div className="flex gap-2">
                                  <button onClick={() => saveReorder(cap.id)} disabled={savingOrder || editPages.length === 0}
                                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow shadow-indigo-600/20 active:scale-95">
                                    {savingOrder ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} Guardar
                                  </button>
                                  <button onClick={() => setReorderingCap(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition">
                                    <X size={14}/>
                                  </button>
                                </div>
                              </div>
                              
                              {loadingPages ? (
                                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-indigo-500"/></div>
                              ) : editPages.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">No hay páginas en este capítulo.</p>
                              ) : (
                                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
                                  {editPages.map((page, idx) => (
                                    <div key={page.id} className="flex items-center gap-3 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-lg p-2 shadow-sm">
                                      <img src={page.image_url} alt="" className="w-8 h-12 object-cover rounded bg-gray-200 dark:bg-white/5 shrink-0"/>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold dark:text-white">Pág. {String(page.orden).padStart(3, '0')}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{page.filename}</p>
                                      </div>
                                      <div className="flex gap-1 shrink-0">
                                        <button onClick={() => moveUp(idx)} disabled={idx === 0}
                                          className="p-1.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-white/10 transition disabled:opacity-30">
                                          <ArrowUp size={14}/>
                                        </button>
                                        <button onClick={() => moveDown(idx)} disabled={idx === editPages.length - 1}
                                          className="p-1.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-200 dark:hover:bg-white/10 transition disabled:opacity-30">
                                          <ArrowDown size={14}/>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Disable modal */}
      {disableModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                <Ban size={20} className="text-orange-500"/>
              </div>
              <div>
                <h3 className="font-extrabold text-lg dark:text-white">Deshabilitar obra</h3>
                <p className="text-sm text-gray-500 mt-0.5">Esta accion ocultara la obra y todos sus capitulos del sitio publico.</p>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-3 border border-orange-100 dark:border-orange-500/20">
              <p className="text-sm font-semibold dark:text-white">{disableModal.manga.titulo}</p>
              <p className="text-xs text-gray-500 mt-0.5">{disableModal.manga.tipo}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold dark:text-white">Razon <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea rows={3} value={disableRazon} onChange={e => setDisableRazon(e.target.value)} placeholder="Ej: Solicitud de derechos de autor, DMCA takedown..." className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50"/>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setDisableModal(null); setDisableRazon(''); }} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">Cancelar</button>
              <button onClick={() => handleDisableManga(disableModal.manga, true)} disabled={disabling} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white transition disabled:opacity-60">
                {disabling ? <Loader2 size={14} className="animate-spin"/> : <Ban size={14}/>} Deshabilitar
              </button>
            </div>
          </div>
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
    const utcDate = newFecha ? new Date(newFecha).toISOString() : null;
    await fetch(`${API}/api/chapters/${id}/reschedule`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_publicacion: utcDate }),
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

  const groupedCaps = (data?.capitulos ?? []).reduce((acc: Record<string, CapAgenda[]>, cap) => {
    let groupName = "Sin Fecha Programada";
    if (cap.fecha_publicacion) {
        const date = new Date(cap.fecha_publicacion);
        const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        groupName = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(cap);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
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
        <div className="flex flex-col gap-8">
          {Object.entries(groupedCaps).map(([dateLabel, caps]) => (
            <div key={dateLabel} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">{dateLabel}</h3>
              <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111114] shadow-sm">
                {caps.map((cap, i) => {
                  const esProgramado = cap.estado === 'programado' && cap.fecha_publicacion;
                  const fechaLocal = cap.fecha_publicacion ? new Date(cap.fecha_publicacion) : null;
                  const yaVencio = fechaLocal && fechaLocal < new Date();
                  
                  return (
                    <div key={cap.id} className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 gap-4 transition hover:bg-gray-50 dark:hover:bg-white/2 ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                      
                      {/* Lado Izquierdo: Info de Manga */}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-[15px] dark:text-white truncate" title={cap.manga_titulo}>{cap.manga_titulo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-gray-400">Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10"></span>
                          <span className="text-xs font-medium text-blue-500/80 dark:text-blue-400/80 truncate">por {cap.uploader_username}</span>
                        </div>
                      </div>
                      
                      {/* Centro: Tiempo (solo si no estamos editando) */}
                      {editingId !== cap.id && (
                        <div className="flex items-center gap-3 shrink-0">
                          {!esProgramado && <Badge estado={cap.estado}/>}
                          {esProgramado && !yaVencio && (
                             <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 flex items-center gap-1.5 border border-gray-200 dark:border-white/5">
                               <Clock size={12} className="opacity-70"/>
                               {fechaLocal!.toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' })}
                               <span className="opacity-50 ml-1 font-normal">({Math.ceil((fechaLocal!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d)</span>
                             </span>
                          )}
                          {esProgramado && yaVencio && (
                             <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 flex items-center gap-1.5 border border-orange-200 dark:border-orange-500/20">
                               <Clock size={12}/> Vencido
                             </span>
                          )}
                        </div>
                      )}

                      {/* Lado Derecho: Acciones o Modo Edición */}
                      {editingId === cap.id ? (
                         <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto mt-3 lg:mt-0">
                           <input type="datetime-local" value={newFecha} onChange={e => setNewFecha(e.target.value)}
                             className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none w-full lg:w-48 transition"/>
                           <button onClick={() => reschedule(cap.id)} disabled={processing === cap.id}
                             className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex justify-center items-center h-[38px]">
                             {processing === cap.id ? <Loader2 size={16} className="animate-spin"/> : 'Guardar'}
                           </button>
                           <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition">
                             <X size={16}/>
                           </button>
                         </div>
                      ) : (
                         <div className="flex items-center gap-1 shrink-0 mt-3 lg:mt-0 ml-auto lg:ml-0">
                            <button onClick={() => {
                                setEditingId(cap.id);
                                if (cap.fecha_publicacion) {
                                  const d = new Date(cap.fecha_publicacion);
                                  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                                  setNewFecha(local.toISOString().slice(0,16));
                                } else {
                                  setNewFecha('');
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                              title="Reprogramar">
                              <Clock size={14}/> <span>Reprogramar</span>
                            </button>
                            
                            <button onClick={() => publishNow(cap.id)} disabled={processing === cap.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-gray-400 border border-transparent hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition disabled:opacity-50"
                              title="Publicar ahora de inmediato">
                              {processing === cap.id ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} <span className="hidden sm:inline">Publicar ya</span>
                            </button>
                            
                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>

                            <button onClick={() => deleteChapter(cap.id)} disabled={processing === cap.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                              title="Eliminar capítulo">
                              {processing === cap.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                            </button>
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
  const isSoporte = !isSuperAdmin && currentUser?.rol === 'soporte';
  const canManageUsers = isSuperAdmin || isSoporte;

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

  // Filtros y Tabs
  const [tab, setTab]               = useState<'staff'|'lectores'>('staff');
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

  // Editar email
  const [editEmailId, setEditEmailId]   = useState<string | null>(null);
  const [editEmailVal, setEditEmailVal] = useState('');
  const [editEmailMsg, setEditEmailMsg] = useState<string | null>(null);
  const [editEmailLoad, setEditEmailLoad] = useState(false);

  const handleChangeEmail = async (userId: string) => {
    if (!editEmailVal.trim() || !editEmailVal.includes('@')) { setEditEmailMsg('âŒ Email inválido'); return; }
    setEditEmailLoad(true); setEditEmailMsg(null);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editEmailVal.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setEditEmailMsg('âœ… Email actualizado');
      refetch();
      setTimeout(() => { setEditEmailId(null); setEditEmailMsg(null); }, 1500);
    } catch (e: any) { setEditEmailMsg(`âŒ ${e.message}`); }
    finally { setEditEmailLoad(false); }
  };

  // Reset contraseña — v2.0: envía email en lugar de ingresar contraseña manual
  const [resetingId, setResetingId] = useState<string | null>(null);
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
    const matchTab  = tab === 'lectores' ? u.rol === 'lector' : u.rol !== 'lector';
    return matchQ && matchScan && matchRol && matchTab;
  });

  // v2.0 — envía email de reset en lugar de ingresar contraseña manual
  const handleResetPassword = async (userId: string) => {
    setResetLoad(true); setResetMsg(null);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}/send-reset-email`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      if (d.emailSent) {
        setResetMsg('âœ… Email de reset enviado');
      } else {
        setResetMsg(`âš ï¸ No se pudo enviar email — link: ${d.setupUrl ?? '(sin RESEND_API_KEY)'}`);
      }
      setTimeout(() => { setResetingId(null); setResetMsg(null); }, 4000);
    } catch (e: any) { setResetMsg(`âŒ ${e.message}`); }
    finally { setResetLoad(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFeedback(null);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        // v2.0 — sin password: el usuario recibe email para configurarla
        body: JSON.stringify({ username, email, rol, scan_id: userScanId || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const msg = d.emailSent
        ? `âœ… Usuario "${username}" creado — email de invitación enviado a ${email}`
        : `âœ… Usuario "${username}" creado — link de setup: ${d.setupUrl ?? '(configurá RESEND_API_KEY)'}`;
      setFeedback(msg);
      setUsername(''); setEmail(''); setUserScanId('');
      refetch();
      setTimeout(() => setShowForm(false), 3000);
    } catch (err: any) { setFeedback(`âŒ ${err.message}`); }
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
      setEditScanMsg('âœ… Scan actualizado');
      refetch();
      setTimeout(() => { setEditScanId(null); setEditScanMsg(null); }, 1200);
    } catch (e: any) { setEditScanMsg(`âŒ ${e.message}`); }
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
        {canManageUsers && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
            <UserPlus size={16}/> Nuevo Usuario
          </button>
        )}
      </div>

      {/* Tabs de Staff vs Lectores */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 mb-2">
        <button onClick={() => setTab('staff')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${tab === 'staff' ? 'border-rose-500 text-rose-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
          Staff y Scans
        </button>
        <button onClick={() => setTab('lectores')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 ${tab === 'lectores' ? 'border-rose-500 text-rose-500' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
          Lectores
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
          <option value="soporte">Soporte</option>
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
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
              {feedback}
            </div>
          )}
          {/* v2.0 — sin campo contraseña: el usuario la configura por email */}
          <div className="mb-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
            <span className="mt-0.5">ðŸ“§</span>
            <span>Se enviará un email al usuario con un link para que configure su propia contraseña. El link expira en 48 hs.</span>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Username', value: username, set: setUsername, type: 'text', ph: 'Ej: Alex_Clean' },
              { label: 'Email', value: email, set: setEmail, type: 'email', ph: 'correo@scan.com' },
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
                <option value="lector">Lector</option>
                {!isSoporte && <option value="admin_scan">Admin de Scan</option>}
                {isSuperAdmin && <option value="admin">Admin</option>}
                {isSuperAdmin && <option value="soporte">Soporte</option>}
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
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    !!u.cuenta_pendiente
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                      : u.activo
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                  }`}>
                    {!!u.cuenta_pendiente ? 'Pendiente' : u.activo ? 'Activo' : 'Bloqueado'}
                  </span>
                </div>
              </div>
              {/* Fila de acciones */}
              {u.rol !== 'superadmin' && canManageUsers && (
                <div className="flex items-center gap-1.5 px-4 sm:px-5 pb-2 flex-wrap">
                  {u.scan_nombre && (
                    <span className="sm:hidden text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 flex items-center gap-1">
                      <Layers size={10}/> {u.scan_nombre}
                    </span>
                  )}
                  {/* Cambiar rol — solo superadmin */}
                  {isSuperAdmin && (editRolId === u.id ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <select value={editRolVal} onChange={e => setEditRolVal(e.target.value)} autoFocus
                        className="bg-gray-50 dark:bg-black/40 border border-rose-300 dark:border-rose-500/40 px-2 py-1 rounded-lg text-xs dark:text-white outline-none">
                        <option value="uploader">Uploader</option>
                        <option value="admin_scan">Admin Scan</option>
                        <option value="admin">Admin</option>
                        <option value="soporte">Soporte</option>
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
                  ))}
                  {/* Cambiar scan — solo superadmin */}
                  {isSuperAdmin && (
                    <button onClick={() => { setEditScanId(editScanId === u.id ? null : u.id); setEditScanVal(u.scan_id || ''); setEditScanMsg(null); setEditRolId(null); setEditEmailId(null); }}
                      title="Cambiar scan" className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition">
                      <Layers size={14}/>
                    </button>
                  )}
                  {/* Editar email — solo superadmin */}
                  {isSuperAdmin && (
                    <button onClick={() => { setEditEmailId(editEmailId === u.id ? null : u.id); setEditEmailVal(u.email); setEditEmailMsg(null); setEditRolId(null); setEditScanId(null); setResetingId(null); }}
                      title="Editar email" className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition">
                      <AtSign size={14}/>
                    </button>
                  )}
                  {/* Bloquear/activar — superadmin y soporte */}
                  <button onClick={() => toggleActivo(u)} title={u.activo ? 'Bloquear' : 'Activar'}
                    className={`p-1.5 rounded-lg transition ${u.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                    {u.activo ? <Ban size={14}/> : <Check size={14}/>}
                  </button>
                  {/* Resetear contraseña — superadmin y soporte */}
                  <button onClick={() => { setResetingId(resetingId === u.id ? null : u.id); setResetMsg(null); setEditScanId(null); setEditRolId(null); }}
                    title={!!u.cuenta_pendiente ? 'Reenviar invitación' : 'Resetear contraseña por email'}
                    className={`p-1.5 rounded-lg transition ${!!u.cuenta_pendiente ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}>
                    {!!u.cuenta_pendiente ? <Mail size={14}/> : <ShieldCheck size={14}/>}
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
                    <p className={`text-xs font-medium mb-2 ${editScanMsg.startsWith('âœ…') ? 'text-emerald-600' : 'text-red-600'}`}>{editScanMsg}</p>
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

              {/* Panel editar email */}
              {isSuperAdmin && editEmailId === u.id && (
                <div className="mx-5 mb-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 rounded-xl p-4 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-1.5">
                    <AtSign size={13}/> Editar email de <strong>{u.username}</strong>
                  </p>
                  {editEmailMsg && (
                    <p className={`text-xs font-medium mb-2 ${editEmailMsg.startsWith('âœ…') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{editEmailMsg}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="email" value={editEmailVal} onChange={e => setEditEmailVal(e.target.value)}
                      placeholder="nuevo@email.com" autoFocus
                      className="flex-1 bg-white dark:bg-black/30 border border-sky-200 dark:border-white/10 px-3 py-2 rounded-lg text-sm dark:text-white focus:border-sky-400 outline-none"
                    />
                    <button onClick={() => handleChangeEmail(u.id)} disabled={editEmailLoad}
                      className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
                      {editEmailLoad ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Guardar
                    </button>
                    <button onClick={() => { setEditEmailId(null); setEditEmailMsg(null); }}
                      className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition"><X size={14}/></button>
                  </div>
                </div>
              )}

              {/* Panel reset/reenvío invitación — v2.0: siempre envía email */}
              {isSuperAdmin && resetingId === u.id && (
                <div className={`mx-5 mb-3 rounded-xl p-4 animate-in slide-in-from-top-1 duration-200 border ${
                  !!u.cuenta_pendiente
                    ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                }`}>
                  <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${
                    !!u.cuenta_pendiente ? 'text-sky-700 dark:text-sky-400' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {!!u.cuenta_pendiente ? <Mail size={13}/> : <ShieldCheck size={13}/>}
                    {!!u.cuenta_pendiente ? 'Reenviar invitación' : 'Reset de contraseña'} — <strong>{u.username}</strong>
                  </p>
                  <p className={`text-xs mb-3 ${!!u.cuenta_pendiente ? 'text-sky-600 dark:text-sky-400/70' : 'text-amber-600 dark:text-amber-400/70'}`}>
                    Se enviará un email a <strong>{u.email}</strong> con un link para {!!u.cuenta_pendiente ? 'activar su cuenta' : 'configurar una nueva contraseña'}. El link expira en 48 hs.
                  </p>
                  {resetMsg && (
                    <p className={`text-xs font-medium mb-3 break-all ${resetMsg.startsWith('âœ…') ? 'text-emerald-600' : resetMsg.startsWith('âš ï¸') ? 'text-amber-600' : 'text-red-600'}`}>
                      {resetMsg}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleResetPassword(u.id)} disabled={resetLoading}
                      className={`flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                        !!u.cuenta_pendiente
                          ? 'bg-sky-500 hover:bg-sky-400'
                          : 'bg-amber-500 hover:bg-amber-400'
                      }`}>
                      {resetLoading ? <Loader2 size={14} className="animate-spin"/> : !!u.cuenta_pendiente ? <Mail size={14}/> : <ShieldCheck size={14}/>}
                      {!!u.cuenta_pendiente ? 'Reenviar invitación' : 'Enviar email de reset'}
                    </button>
                    <button onClick={() => { setResetingId(null); setResetMsg(null); }}
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

// ============================================================
//  SECCIÓN: REVENUE SHARE
// ============================================================
interface RevenueScan {
  id: string; nombre: string; total_views: number; views_mes: number;
  total_mangas: number; total_capitulos: number;
  contrato_firmado?: number; representante_nombre?: string; binance_pay_id?: string;
}
interface RevenueManga {
  id: string; titulo: string; views_total: number; views_mes: number; tipo: string; estado: string;
  capitulos: { id: string; numero: number; titulo: string | null; views: number }[];
}

function SectionRevenue() {
  const currentUser  = getUser();
  const isSuperAdmin = !!currentUser?.is_superadmin;
  // admin_scan ve solo su propio scan, cargado automáticamente
  const ownScanId    = (!isSuperAdmin && currentUser?.scan_id) ? currentUser.scan_id : null;

  const [mes, setMes]                       = useState<string>('');
  const [totalIngresos, setTotalIngresos]   = useState<number | ''>('');
  const endpointUrl = isSuperAdmin ? `/api/admin/revenue${mes ? `?mes=${mes}` : ''}` : '/api/admin/revenue/__skip__';
  const { data, loading, refetch } = useAPI<{ scans: RevenueScan[]; grand_total: number; grand_total_mes: number }>(endpointUrl);

  const [expandedScan, setExpandedScan]     = useState<string | null>(ownScanId);
  const [scanDetail, setScanDetail]         = useState<Record<string, { mangas: RevenueManga[]; scan_total: number; scan_total_mes: number }>>({});
  const [loadingDetail, setLoadingDetail]   = useState<string | null>(null);
  const [expandedManga, setExpandedManga]   = useState<string | null>(null);
  const [selectedScans, setSelectedScans]   = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.scans) setSelectedScans(new Set(data.scans.map(s => s.id)));
  }, [data]);

  const selectedViewsMes = useMemo(() => {
    if (!data?.scans) return 0;
    return data.scans.filter(s => selectedScans.has(s.id)).reduce((sum, s) => sum + (s.views_mes || 0), 0);
  }, [data, selectedScans]);

  useEffect(() => {
    setScanDetail({});
    setExpandedScan(ownScanId);
  }, [mes, ownScanId]);

  // Para admin_scan: cargar el detalle de su scan directamente al montar
  useEffect(() => {
    if (!ownScanId) return;
    setLoadingDetail(ownScanId);
    fetch(`${API}/api/admin/revenue/${ownScanId}${mes ? `?mes=${mes}` : ''}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setScanDetail(prev => ({ ...prev, [ownScanId]: d })); })
      .finally(() => setLoadingDetail(null));
  }, [ownScanId, mes]);

  const loadScanDetail = async (scanId: string) => {
    if (expandedScan === scanId) { setExpandedScan(null); return; }
    if (scanDetail[scanId]) { setExpandedScan(scanId); return; }
    setLoadingDetail(scanId);
    try {
      const res = await fetch(`${API}/api/admin/revenue/${scanId}${mes ? `?mes=${mes}` : ''}`, { headers: authHeaders() });
      const d = await res.json();
      setScanDetail(prev => ({ ...prev, [scanId]: d }));
      setExpandedScan(scanId);
    } finally { setLoadingDetail(null); }
  };

  const pct = (views: number, total: number) =>
    total > 0 ? ((views / total) * 100).toFixed(1) : '0.0';

  // Vista para admin_scan: solo su propio scan
  if (ownScanId) {
    const det = scanDetail[ownScanId];
    const isLoading = loadingDetail === ownScanId;
    
    // Calculamos valores financieros simulados basados en CPM de $1.50
    const cpm = 1.50;
    const totalGenerado = det ? (det.scan_total_mes / 1000) * cpm : 0;
    
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold dark:text-white flex items-center gap-2">
              <DollarSign size={28} className="text-emerald-500"/> 
              {currentUser?.scan_nombre || 'Tu Scan'} - Detalle de Ingresos
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-medium">Panel financiero y rendimiento de tráfico válido.</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 p-1.5 rounded-xl">
            <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Calendar size={16} className="mr-2"/> Ciclo
            </div>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none px-3 py-2 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer" />
          </div>
        </div>

        {isLoading && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40}/></div>}
        
        {det && (
          <>
            {/* Financial Summary Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#111114] dark:to-[#0A0A0C] border border-gray-800 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              {/* Background Decorator */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Generado (Estimado)</p>
                  <div className="flex items-center gap-4">
                    <h3 className="text-5xl font-black text-white tabular-nums tracking-tight">
                      ${totalGenerado.toFixed(2)} <span className="text-2xl text-gray-500 font-bold">USD</span>
                    </h3>
                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12}/> Pendiente de Liquidación
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm min-w-[140px]">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Eye size={12}/> Vistas del mes</p>
                    <p className="text-xl font-bold text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm min-w-[140px]">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12}/> CPM Acordado</p>
                    <p className="text-xl font-bold text-emerald-400 tabular-nums">${cpm.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 size={16}/> Desglose por Obra
              </h4>
              <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <th className="px-6 py-4 font-bold">Obra</th>
                        <th className="px-6 py-4 font-bold text-right">Vistas Válidas</th>
                        <th className="px-6 py-4 font-bold text-right">Tarifa / CPM</th>
                        <th className="px-6 py-4 font-bold text-right">Total Parcial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {det.mangas.map(manga => {
                        const mangaViews = manga.views_mes ?? 0;
                        const mangaRev = (mangaViews / 1000) * cpm;
                        return (
                          <tr key={manga.id} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-white/5">
                                  <BookOpen size={16}/>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold dark:text-white truncate group-hover:text-emerald-500 transition-colors">{manga.titulo}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">{manga.capitulos.length} capítulos computados</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm font-bold dark:text-white tabular-nums">{mangaViews.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm text-gray-500 tabular-nums">${cpm.toFixed(2)}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${mangaRev.toFixed(2)}</p>
                            </td>
                          </tr>
                        );
                      })}
                      {det.mangas.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 italic">No hay obras registradas en este periodo.</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-white/2 border-t border-gray-200 dark:border-white/10">
                      <tr>
                        <td className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Acumulado</td>
                        <td className="px-6 py-4 text-right text-sm font-black dark:text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-right text-base font-black text-emerald-500 tabular-nums">${totalGenerado.toFixed(2)} USD</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex items-center justify-between gap-4 shadow-sm mt-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-900 dark:text-white shadow-sm shrink-0">
                  <ShieldCheck size={20} className="text-emerald-500"/>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-0.5">Método de Recepción Registrado</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold dark:text-white">Binance Pay (ID)</p>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                      *** {currentUser?.scan_id ? currentUser.scan_id.slice(-4) : 'XXXX'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">Los pagos se procesan automáticamente entre el día 1 y 5 del mes siguiente.</p>
              </div>
            </div>

          </>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold dark:text-white flex items-center gap-2">
            <DollarSign size={28} className="text-emerald-500"/> 
            Administración Financiera Global
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">Panel de control de tráfico y liquidación de scans aliados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 p-1.5 rounded-xl">
            <div className="flex items-center px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <Calendar size={16} className="mr-2"/> Ciclo
            </div>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none px-3 py-2 rounded-lg text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer" />
          </div>
          <button onClick={refetch} className="flex items-center justify-center p-3.5 bg-gray-100 dark:bg-[#111114] hover:bg-emerald-500/10 rounded-xl hover:text-emerald-500 transition-colors border border-transparent dark:border-white/10">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* Global Financial Cards */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main Pool Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black dark:from-[#111114] dark:to-[#0A0A0C] border border-gray-800 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Pool de Ingresos a Repartir (75%)</p>
                <h3 className="text-4xl font-black text-emerald-500 tabular-nums tracking-tight">
                  ${totalIngresos ? (Number(totalIngresos) * 0.75).toFixed(2) : "0.00"} <span className="text-xl text-gray-500 font-bold">USD</span>
                </h3>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 backdrop-blur-sm">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos Brutos ($)</p>
                <input type="number" placeholder="Ej: 1000" value={totalIngresos} onChange={e => setTotalIngresos(e.target.value ? Number(e.target.value) : '')}
                  className="w-32 bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-white outline-none focus:border-emerald-500 font-bold tabular-nums" />
              </div>
            </div>
          </div>
          
          {/* Traffic Summary */}
          <div className="grid grid-cols-2 gap-4">
             {/* Views Mes */}
             <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4"><Eye size={24}/></div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Vistas Validadas (Mes)</p>
                <p className="text-3xl font-black dark:text-white tabular-nums">{(data.grand_total_mes ?? 0).toLocaleString()}</p>
             </div>
             {/* Vistas Historicas */}
             <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-4"><TrendingUp size={24}/></div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Vistas Históricas</p>
                <p className="text-3xl font-black dark:text-white tabular-nums">{data.grand_total.toLocaleString()}</p>
             </div>
          </div>
        </div>
      )}

      {/* Main List Container */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40}/></div>
      ) : (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          {/* Fake Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
             <div className="col-span-5">Scan / Grupo Aliado</div>
             <div className="col-span-3 text-right">Tráfico Válido</div>
             <div className="col-span-3 text-right">Liquidación Estimada</div>
             <div className="col-span-1 text-right"></div>
          </div>
          
          <div className="flex flex-col">
            {(data?.scans ?? []).map(scan => {
              const det = scanDetail[scan.id];
              const isExpanded = expandedScan === scan.id;
              const isLoading = loadingDetail === scan.id;
              const pctGlobal = pct(scan.total_views, data?.grand_total ?? 0);
              const isSelected = selectedScans.has(scan.id);
              const toggleSelection = () => {
                const newSet = new Set(selectedScans);
                if (isSelected) newSet.delete(scan.id);
                else newSet.add(scan.id);
                setSelectedScans(newSet);
              };
              
              const scanPago = (selectedViewsMes > 0 && totalIngresos !== '') 
                ? (((scan.views_mes ?? 0) / selectedViewsMes) * (Number(totalIngresos) * 0.75))
                : 0;

              return (
                <div key={scan.id} className={`border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors ${isSelected ? 'bg-transparent' : 'bg-gray-50/50 dark:bg-black/20 opacity-75'}`}>
                  {/* Table Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-gray-50 dark:hover:bg-white/2 transition-colors cursor-pointer" onClick={() => loadScanDetail(scan.id)}>
                    {/* Col 1: Scan Info */}
                    <div className="col-span-1 md:col-span-5 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                      {isSuperAdmin && (
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={toggleSelection} 
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-gray-100 dark:bg-white/5 cursor-pointer shrink-0"
                        />
                      )}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-500 shrink-0 font-black">
                        {scan.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold dark:text-white truncate group-hover:text-emerald-500 transition-colors">{scan.nombre}</p>
                        <p className="text-[10px] text-gray-400 truncate">{scan.total_mangas} obras activas · {scan.total_capitulos} caps</p>
                      </div>
                    </div>
                    
                    {/* Col 2: Views */}
                    <div className="col-span-1 md:col-span-3 flex flex-col md:items-end justify-center">
                      <p className="text-sm font-bold dark:text-white tabular-nums">{(scan.views_mes ?? 0).toLocaleString()} <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Mes</span></p>
                      <div className="w-24 mt-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden hidden md:block">
                        <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${pctGlobal}%` }}/>
                      </div>
                    </div>

                    {/* Col 3: Pago */}
                    <div className="col-span-1 md:col-span-3 flex flex-col md:items-end justify-center">
                      {isSelected ? (
                         <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${scanPago.toFixed(2)}</p>
                      ) : (
                         <p className="text-sm font-bold text-gray-400 tabular-nums line-through">$0.00</p>
                      )}
                      {isSelected && totalIngresos !== '' && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Liquidación</p>}
                    </div>

                    {/* Col 4: Action */}
                    <div className="col-span-1 text-right flex justify-end">
                      <button onClick={(e) => { e.stopPropagation(); loadScanDetail(scan.id); }} disabled={isLoading}
                        className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 hover:text-emerald-500 transition w-full md:w-auto">
                        {isLoading ? <Loader2 size={14} className="animate-spin"/> : (isExpanded ? "Cerrar" : "Detalle")}
                      </button>
                    </div>
                  </div>
                {/* Detalle expandido */}
                {isExpanded && det && (() => {
                  const cpm = 1.50;
                  const totalGenerado = det ? (det.scan_total_mes / 1000) * cpm : 0;
                  return (
                  <div className="border-t border-gray-100 dark:border-white/5 px-6 py-6 bg-gray-50/50 dark:bg-[#0A0A0C] animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                      <div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Generado (Estimado)</p>
                        <div className="flex items-center gap-4">
                          <h3 className="text-4xl font-black text-emerald-500 tabular-nums tracking-tight">
                            ${totalGenerado.toFixed(2)} <span className="text-xl text-gray-500 font-bold">USD</span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-white dark:bg-[#111114] rounded-2xl p-4 border border-gray-200 dark:border-white/5 min-w-[140px]">
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><Eye size={12}/> Vistas del mes</p>
                          <p className="text-xl font-bold dark:text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-[#111114] rounded-2xl p-4 border border-gray-200 dark:border-white/5 min-w-[140px]">
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12}/> CPM Acordado</p>
                          <p className="text-xl font-bold text-emerald-500 tabular-nums">${cpm.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-white/2 border-b border-gray-200 dark:border-white/5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                              <th className="px-6 py-4 font-bold">Obra</th>
                              <th className="px-6 py-4 font-bold text-right">Vistas Válidas</th>
                              <th className="px-6 py-4 font-bold text-right">Tarifa / CPM</th>
                              <th className="px-6 py-4 font-bold text-right">Total Parcial</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {det.mangas.map(manga => {
                              const mangaViews = manga.views_mes ?? 0;
                              const mangaRev = (mangaViews / 1000) * cpm;
                              return (
                                <tr key={manga.id} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200 dark:border-white/5">
                                        <BookOpen size={16}/>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold dark:text-white truncate group-hover:text-emerald-500 transition-colors">{manga.titulo}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{manga.tipo} · {manga.capitulos.length} capítulos</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-bold dark:text-white tabular-nums">{mangaViews.toLocaleString()}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-sm text-gray-500 tabular-nums">${cpm.toFixed(2)}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${mangaRev.toFixed(2)}</p>
                                  </td>
                                </tr>
                              );
                            })}
                            {det.mangas.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 italic">No hay obras registradas en este periodo.</td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-white/2 border-t border-gray-200 dark:border-white/10">
                            <tr>
                              <td className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Acumulado</td>
                              <td className="px-6 py-4 text-right text-sm font-black dark:text-white tabular-nums">{(det.scan_total_mes ?? 0).toLocaleString()}</td>
                              <td className="px-6 py-4"></td>
                              <td className="px-6 py-4 text-right text-base font-black text-emerald-500 tabular-nums">${totalGenerado.toFixed(2)} USD</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                  );
                })() }
              </div>
            );
          })}
          </div>

          {(data?.scans?.length === 0) && (
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
              <BarChart2 size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No hay datos de revenue aún</p>
              <p className="text-sm">Las vistas se acumulan automáticamente cuando los usuarios leen</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionScans() {
  const currentUser = getUser();
  const isSuperAdmin = !!currentUser?.is_superadmin;
  const { data, loading, refetch } = useAPI<{ scans: Scan[] }>('/api/scans');

  const [showForm, setShowForm]       = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractText, setContractText] = useState('');
  const [contractSaving, setContractSaving] = useState(false);
  const [contractMsg, setContractMsg] = useState<string | null>(null);
  const [forceResign, setForceResign] = useState(false);
  const [contractPin, setContractPin] = useState('');

  const loadContract = async () => {
    try {
      const res = await fetch(`${API}/api/config/contrato`);
      const d = await res.json();
      setContractText(d.texto || '');
    } catch {}
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractSaving(true);
    setContractMsg(null);
    try {
      const res = await fetch(`${API}/api/admin/config/contrato`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: contractText, forceResign, pin: contractPin }),
      });
      if (res.ok) {
        const data = await res.json();
        setContractMsg(data.message || 'Contrato actualizado.');
        setShowContractForm(false);
      } else {
        setContractMsg('Error al guardar el contrato.');
      }
    } catch {
      setContractMsg('Error de red.');
    } finally { setContractSaving(false); }
  };

  const [nombre, setNombre]           = useState('');
  const [descripcion, setDesc]        = useState('');
  const [saving, setSaving]           = useState(false);
  const [feedback, setFeedback]       = useState<string | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [details, setDetails]         = useState<Record<string, ScanDetail>>({});
  const [loadingId, setLoadingId]     = useState<string | null>(null);

  const loadDetails = async (scanId: string) => {
    if (expandedId === scanId) return; // Ya está seleccionado
    setExpandedId(scanId);
    if (details[scanId]) return; // Ya lo tenemos cacheado
    
    setLoadingId(scanId);
    try {
      const res = await fetch(`${API}/api/scans/${scanId}/details`, { headers: authHeaders() });
      const d = await res.json();
      setDetails(prev => ({ ...prev, [scanId]: d }));
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

  const activeScan = data?.scans?.find(s => s.id === expandedId);
  const activeDet = expandedId ? details[expandedId] : null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white">Grupos de Scan</h2>
          <p className="text-gray-500 text-sm mt-1">{data?.scans?.length ?? 0} scans registrados</p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-3">
            <button onClick={() => { setShowContractForm(true); setShowForm(false); loadContract(); }}
              className="flex items-center gap-2 bg-[#1a1a24] hover:bg-[#252533] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
              <Edit3 size={16}/> Editar Contrato
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowContractForm(false); }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20">
              <Plus size={16}/> Nuevo Scan
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Contrato de Alianza */}
      {showContractForm && isSuperAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowContractForm(false)}></div>
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-lg dark:text-white flex items-center gap-2">
                <Edit3 size={18} className="text-rose-500"/> Editor de Contrato de Alianza
              </h3>
              <button onClick={() => setShowContractForm(false)} className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-white rounded-full transition">
                <X size={16}/>
              </button>
            </div>
            <div className="p-6">
              {contractMsg && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${contractMsg.includes('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                  {contractMsg}
                </div>
              )}
              <form onSubmit={handleSaveContract} className="flex flex-col gap-6">
                
                {/* Editor Simulado */}
                <div className="bg-gray-50 dark:bg-[#0B0B0F] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-rose-500 transition-colors shadow-inner">
                  <div className="bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 px-3 py-2 flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    <span className="ml-3 text-[10px] font-bold uppercase text-gray-500 tracking-wider">Editor Visual</span>
                  </div>
                  <textarea 
                    value={contractText} onChange={e => setContractText(e.target.value)} required rows={18}
                    className="w-full bg-transparent px-6 py-5 dark:text-gray-200 focus:outline-none resize-y prose prose-sm dark:prose-invert font-sans leading-relaxed"
                    placeholder="Escribe el contrato aquí... usa formato Markdown para títulos (## CLÁUSULA) o listas (- Obligación)."
                  />
                </div>

                {/* Acción Destructiva */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl">
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0"><AlertTriangle size={20} className="text-amber-500"/></div>
                    <div>
                      <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">Forzar reinicio de firmas</p>
                      <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5 max-w-md">Si activas esto, todos los líderes de scan tendrán que volver a aceptar los términos para usar la plataforma.</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={forceResign} onChange={e => setForceResign(e.target.checked)}/>
                    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Footer del Modal */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10 mt-2">
                  <input
                    type="password"
                    placeholder="PIN de seguridad"
                    value={contractPin}
                    onChange={e => setContractPin(e.target.value)}
                    required
                    className="w-full sm:w-64 bg-gray-100 dark:bg-[#07070a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white focus:outline-none focus:border-rose-500 transition-colors text-sm"
                  />
                  <button type="submit" disabled={contractSaving} className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-rose-600/20">
                    {contractSaving ? 'Procesando...' : 'Guardar Nueva Versión'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Scan */}
      {showForm && isSuperAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
           <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-lg dark:text-white mb-5 flex items-center gap-2"><Layers size={18} className="text-rose-500"/> Registrar Nuevo Scan</h3>
            {feedback && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                {feedback}
              </div>
            )}
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre del Scan *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Crimson Scan"
                  className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descripción</label>
                <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Descripción del grupo..."
                  className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none resize-none transition"/>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/5 mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !nombre}
                  className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition shadow-lg shadow-rose-600/20">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                  {saving ? 'Creando...' : 'Crear Scan'}
                </button>
              </div>
            </form>
           </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={40}/></div>
      ) : data?.scans?.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-24 text-gray-400">
          <Layers size={48} className="mb-4 opacity-20"/>
          <p className="font-bold text-lg text-gray-300">No hay scans registrados</p>
          {isSuperAdmin && <p className="text-sm mt-1">Haz clic en "Nuevo Scan" para empezar</p>}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)]">
          {/* LEFT PANE (Master - Lista de Scans) */}
          <div className="w-full lg:w-[35%] shrink-0 flex flex-col gap-3 lg:overflow-y-auto pr-1 pb-4 custom-scrollbar">
            {data?.scans?.map(scan => (
              <div key={scan.id} onClick={() => loadDetails(scan.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${expandedId === scan.id ? 'bg-white dark:bg-white/10 border-rose-500 shadow-md scale-[1.01]' : 'bg-white dark:bg-[#111114] border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'}`}>
                
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center text-violet-500 shrink-0 font-black shadow-inner">
                  {scan.nombre.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm dark:text-white truncate">{scan.nombre}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${scan.activo ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                    {scan.activo ? 'Activo' : 'Inactivo'}
                    <span className="opacity-50">·</span>
                    <Users size={10}/> {scan.miembros}
                  </p>
                </div>
                
                <ChevronRight size={16} className={`shrink-0 transition-colors ${expandedId === scan.id ? 'text-rose-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`} />
              </div>
            ))}
          </div>

          {/* RIGHT PANE (Detail - Workspace) */}
          <div className="w-full lg:w-[65%] flex flex-col bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 lg:overflow-y-auto custom-scrollbar relative shadow-sm">
            {!expandedId || !activeScan ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center h-full min-h-[400px]">
                <MousePointerClick size={48} className="mb-4 opacity-20"/>
                <p className="font-bold text-lg dark:text-gray-300">Selecciona un Scan</p>
                <p className="text-sm max-w-xs mt-1">Haz clic en un grupo de la lista izquierda para ver sus obras, miembros y datos de firma.</p>
              </div>
            ) : loadingId === expandedId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 h-full min-h-[400px]">
                <Loader2 size={32} className="animate-spin text-rose-500 mb-3"/>
                <p className="text-sm text-gray-500 font-medium">Cargando detalles de {activeScan.nombre}...</p>
              </div>
            ) : (
              <div className="flex flex-col p-6 animate-in fade-in duration-200">
                
                {/* Cabecera del Detalle */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center text-violet-500 text-3xl font-black shadow-inner">
                      {activeScan.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold dark:text-white leading-tight">{activeScan.nombre}</h3>
                      <p className="text-sm text-gray-500 max-w-md mt-1">{activeScan.descripcion || 'Sin descripción'}</p>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <button onClick={() => toggleActivo(activeScan)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${activeScan.activo ? 'border-red-500/20 text-red-500 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}>
                      {activeScan.activo ? <><Ban size={14}/> Desactivar</> : <><Check size={14}/> Activar</>}
                    </button>
                  )}
                </div>

                {/* Sección Superior: Datos de Firma */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-gray-400"/>
                    <h4 className="text-sm font-bold dark:text-gray-300 uppercase tracking-widest">Datos de Firma</h4>
                  </div>
                  
                  {activeScan.contrato_firmado ? (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-200 dark:border-white/5 flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">Representante</p>
                        <p className="font-bold text-sm dark:text-white">{activeScan.representante_nombre}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">Discord ID</p>
                        <p className="font-bold text-sm dark:text-white">{activeScan.representante_discord || 'N/A'}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">Binance Pay</p>
                        <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 inline-block px-2 py-0.5 rounded">{activeScan.binance_pay_id || 'PENDIENTE'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-500/20 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                        <AlertTriangle size={20}/>
                      </div>
                      <div>
                        <p className="text-base font-bold text-amber-800 dark:text-amber-400">Contrato Pendiente de Firma</p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500/80 font-medium mt-0.5">El administrador del scan aún no ha firmado la última versión del acuerdo de alianza.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Métricas Rápidas */}
                {activeDet && (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Total Obras', value: activeDet.mangas.length, icon: <BookOpen size={16}/> },
                      { label: 'Visitas Totales', value: (activeDet.totalViews >= 1000 ? (activeDet.totalViews/1000).toFixed(1)+'k' : activeDet.totalViews) || '0', icon: <Eye size={16}/> },
                      { label: 'Capítulos', value: activeDet.mangas.reduce((s: number, m: any) => s + (m.caps_publicados || 0), 0), icon: <BookMarked size={16}/> },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 dark:bg-[#151518] rounded-xl p-4 border border-gray-100 dark:border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/5 flex items-center justify-center text-violet-500 border border-gray-200 dark:border-white/5 shadow-sm">{stat.icon}</div>
                        <div>
                          <p className="font-black text-lg dark:text-white leading-none">{stat.value}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sección Inferior: 2 Columnas (Obras / Miembros) */}
                {activeDet && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Obras */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-gray-400"/>
                          <h4 className="text-sm font-bold dark:text-gray-300 uppercase tracking-widest">Obras Asignadas</h4>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{activeDet.mangas.length}</span>
                      </div>
                      
                      {activeDet.mangas.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-[#151518] rounded-xl p-6 border border-dashed border-gray-200 dark:border-white/10 text-center">
                          <p className="text-xs font-medium text-gray-400">Sin obras en curso.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {activeDet.mangas.map((m: any) => (
                            <div key={m.id} className="flex flex-col gap-2 bg-gray-50 dark:bg-white/2 rounded-xl p-3 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                              <div className="flex items-start justify-between min-w-0 gap-2">
                                <p className="text-sm font-bold dark:text-white leading-tight">{m.titulo}</p>
                                <Badge estado={m.estado}/>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{m.tipo}</span>
                                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1"><Eye size={12}/> {(m.views_total || 0).toLocaleString()} vis</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Miembros */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400"/>
                          <h4 className="text-sm font-bold dark:text-gray-300 uppercase tracking-widest">Miembros del Scan</h4>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{activeDet.miembros.length}</span>
                      </div>

                      {activeDet.miembros.length === 0 ? (
                        <div className="bg-gray-50 dark:bg-[#151518] rounded-xl p-6 border border-dashed border-gray-200 dark:border-white/10 text-center">
                          <p className="text-xs font-medium text-gray-400">Sin miembros registrados.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {activeDet.miembros.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between bg-gray-50 dark:bg-white/2 rounded-xl p-2.5 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold dark:text-gray-300 shrink-0">
                                  {m.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-xs font-bold dark:text-white leading-none">{m.username}</p>
                                  <span className={`text-[9px] font-black uppercase tracking-wider ${m.activo ? 'text-emerald-500' : 'text-gray-500'}`}>
                                    {m.activo ? 'Cuenta Activa' : 'Desactivado'}
                                  </span>
                                </div>
                              </div>
                              <Badge estado={m.rol}/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  SECCIÓN: CONFIGURACIÓN DEL SCAN (webhook Discord)
// ============================================================
const DEFAULT_DISCORD_TEMPLATE = 'ðŸ“– **{{manga}}** — Capítulo {{capitulo}}{{titulo}}\n\n[ðŸ‘ Leer ahora]({{url}})';

function previewTemplate(tpl: string) {
  return (tpl || DEFAULT_DISCORD_TEMPLATE)
    .replace(/\{\{manga\}\}/g, 'Atados por el Pecado')
    .replace(/\{\{capitulo\}\}/g, '42')
    .replace(/\{\{titulo\}\}/g, ' — El reencuentro')
    .replace(/\{\{url\}\}/g, 'https://scancrimson.com/manga/reader/...')
    .replace(/\*\*(.*?)\*\*/g, '$1');
}

const DEFAULT_TELEGRAM_TEMPLATE = `📖 *{{manga}}*\n\nNuevo Capítulo {{capitulo}}{{titulo}} disponible ahora.\n\n🔗 [Leer Capítulo aquí]({{url}})`;
  
function previewTelegramTemplate(tpl: string) {
  return (tpl || DEFAULT_TELEGRAM_TEMPLATE)
    .replace(/\{\{manga\}\}/g, 'Atados por el Pecado')
    .replace(/\{\{capitulo\}\}/g, '42')
    .replace(/\{\{titulo\}\}/g, ' — El reencuentro')
    .replace(/\{\{url\}\}/g, 'https://scancrimson.com/leer/token_secreto');
}

function SectionConfig({ scanId }: { scanId: string }) {
  const [webhook, setWebhook]               = useState('');
  const [discordTemplate, setDiscordTemplate] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramTemplate, setTelegramTemplate] = useState('');
  const [saved, setSaved]                   = useState<string | null>(null);
  const [saving, setSaving]                 = useState(false);
  const [testing, setTesting]               = useState(false);
  const [testMsg, setTestMsg]               = useState<string | null>(null);
  const [imgKey, setImgKey]   = useState(() => Date.now());
  const [imgUploading, setImgUploading] = useState(false);
  const [imgMsg, setImgMsg]   = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const { data: scanData, loading, refetch } = useAPI<any>(`/api/scans/${scanId}/details`);

  // Redes Sociales
  const [redes, setRedes] = useState({
    discord: '',
    facebook: '',
    twitter: '',
    instagram: '',
    patreon: '',
    donations: '',
    telegram: '',
    whatsapp: '',
  });
  const [savingRedes, setSavingRedes] = useState(false);
  const [savedRedes, setSavedRedes] = useState<string | null>(null);

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
    if (scanData?.scan?.telegram_chat_id) setTelegramChatId(scanData.scan.telegram_chat_id);
    if (scanData?.scan?.telegram_template) setTelegramTemplate(scanData.scan.telegram_template);
    if (scanData?.scan?.discord_template) setDiscordTemplate(scanData.scan.discord_template);
    if (scanData?.scan?.redes) {
      try {
        const parsed = JSON.parse(scanData.scan.redes);
        setRedes(prev => ({
          ...prev,
          ...parsed
        }));
      } catch {}
    }
  }, [scanData]);

  const handleSave = async () => {
    setSaving(true); setSaved(null);
    try {
      const res = await fetch(`${API}/api/admin/scans/${scanId}/webhook`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_discord: webhook || null, discord_template: discordTemplate || null, telegram_chat_id: telegramChatId || null, telegram_template: telegramTemplate || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSaved('âœ… Webhook guardado');
    } catch (e: any) { setSaved(`âŒ ${e.message}`); }
    finally { setSaving(false); }
  };

  const handleSaveRedes = async () => {
    setSavingRedes(true); setSavedRedes(null);
    try {
      const res = await fetch(`${API}/api/admin/scans/${scanId}/redes`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ redes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSavedRedes('âœ… Redes sociales guardadas');
    } catch (e: any) { setSavedRedes(`âŒ ${e.message}`); }
    finally { setSavingRedes(false); }
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
            title: 'âœ… Webhook configurado correctamente',
            description: `El bot de **${scanData?.scan?.nombre || 'tu scan'}** está listo para notificaciones.`,
            color: 0xe11d48,
            footer: { text: "Crimson's Scan" },
            timestamp: new Date().toISOString(),
          }]
        }),
      });
      setTestMsg(res.ok ? 'âœ… Mensaje enviado al Discord' : 'âŒ URL inválida o sin permisos');
    } catch { setTestMsg('âŒ No se pudo conectar con Discord'); }
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
      setCreateMsg(`âœ… Usuario "${newUser}" creado`);
      setNewUser(''); setNewEmail(''); setNewPwd(''); setNewRol('uploader');
      refetch();
      setTimeout(() => { setShowForm(false); setCreateMsg(null); }, 1500);
    } catch (e: any) { setCreateMsg(`âŒ ${e.message}`); }
    finally { setCreating(false); }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (imgRef.current) imgRef.current.value = '';
    if (!raw) return;
    if (raw.size > 5 * 1024 * 1024) { setImgMsg('âŒ Máximo 5MB'); return; }
    setImgUploading(true); setImgMsg(null);
    const file = await toWebP(raw, 1200);
    const fd = new FormData();
    fd.append('imagen', file);
    try {
      const res = await fetch(`${API}/api/upload/scan-image`, { method: 'POST', headers: authHeaders(), body: fd });
      const d   = await res.json();
      if (!res.ok) throw new Error(d.error);
      setImgKey(Date.now());
      setImgMsg('âœ… Imagen actualizada');
    } catch (err: any) { setImgMsg(`âŒ ${err.message}`); }
    finally { setImgUploading(false); }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl w-full">
      <div>
        <h2 className="text-2xl font-extrabold dark:text-white">Mi Scan</h2>
        <p className="text-gray-500 text-sm mt-1">Miembros y notificaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">

      {/* Imagen del scan */}
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5 flex flex-col gap-4">
        <h3 className="font-bold dark:text-white flex items-center gap-2"><ImageIcon size={16} className="text-rose-500"/> Imagen del Scan</h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0 relative">
            <img
              key={imgKey}
              src={`${API}/api/scan-image/${scanId}?v=${imgKey}`}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-sm text-gray-500">Sube una imagen de portada para tu scan (PNG, JPG — máx 5MB). Se mostrará en la página de comunidad.</p>
            <button onClick={() => imgRef.current?.click()} disabled={imgUploading}
              className="flex items-center gap-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-4 py-2 rounded-xl transition w-fit">
              {imgUploading ? <><Loader2 size={14} className="animate-spin"/> Subiendo...</> : <><Upload size={14}/> Cambiar imagen</>}
            </button>
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload}/>
            {imgMsg && <p className={`text-xs font-medium ${imgMsg.startsWith('âœ…') ? 'text-emerald-400' : 'text-red-400'}`}>{imgMsg}</p>}
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
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
            
            <div className="mb-6 flex gap-3">
              <button 
                onClick={() => {
                   // Truco para abrir el modal voluntariamente
                   const evt = new CustomEvent('open-contract');
                   window.dispatchEvent(evt);
                }}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-rose-600 transition px-4 py-2 rounded-xl"
              >
                <Edit3 size={14} /> Ver Contrato de Alianza
              </button>
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
                    <div className={`p-2 rounded-lg text-xs font-medium ${createMsg.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
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
          )}
        </div>

        {!loading && (
          <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bot de Telegram</p>
            <p className="text-xs text-gray-500 mb-4">
              Cuando se publique un capítulo, el bot notificará automáticamente a tu canal de Telegram.
              Agrega tu bot como administrador en el canal y pega aquí el Chat ID (ej. -10012345678).
            </p>
            {saved   && <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${saved.startsWith('✅')   ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{saved}</div>}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Chat ID del Canal</label>
              <input
                value={telegramChatId}
                onChange={e => { setTelegramChatId(e.target.value); setSaved(null); }}
                placeholder="-100..."
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mensaje de Telegram</label>
              <p className="text-xs text-gray-400">Usá las variables de abajo. Si lo dejás vacío se usa el mensaje por defecto. Soporta Markdown.</p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {['{{manga}}', '{{capitulo}}', '{{titulo}}', '{{url}}'].map(v => (
                  <button key={`tel-${v}`} type="button"
                    onClick={() => setTelegramTemplate(t => (t || DEFAULT_TELEGRAM_TEMPLATE) + v)}
                    className="text-[11px] font-mono bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md hover:bg-sky-200 dark:hover:bg-sky-500/25 transition">
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={telegramTemplate}
                onChange={e => { setTelegramTemplate(e.target.value); setSaved(null); }}
                placeholder={DEFAULT_TELEGRAM_TEMPLATE}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono resize-none"
              />
              <div className="bg-[#1e1f22] rounded-xl p-3 mt-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5 font-bold">Vista previa</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{previewTelegramTemplate(telegramTemplate)}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition">
                {saving ? 'Guardando...' : 'Guardar Telegram'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook de Discord</p>
            <p className="text-xs text-gray-500 mb-4">
              Cuando se publique un capítulo de tu scan, el bot notifica automáticamente al canal.
              En Discord: Canal â†’ Editar â†’ Integraciones â†’ Webhooks â†’ Nuevo webhook.
            </p>
            {saved   && <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${saved.startsWith('âœ…')   ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{saved}</div>}
            {testMsg && <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${testMsg.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{testMsg}</div>}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">URL del Webhook</label>
              <input
                value={webhook}
                onChange={e => { setWebhook(e.target.value); setSaved(null); }}
                placeholder="https://discord.com/api/webhooks/..."
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mensaje del Discord</label>
              <p className="text-xs text-gray-400">Usá las variables de abajo. Si lo dejás vacío se usa el mensaje por defecto. Soporta Markdown de Discord.</p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {['{{manga}}', '{{capitulo}}', '{{titulo}}', '{{url}}'].map(v => (
                  <button key={v} type="button"
                    onClick={() => setDiscordTemplate(t => (t || DEFAULT_DISCORD_TEMPLATE) + v)}
                    className="text-[11px] font-mono bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-500/25 transition">
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={discordTemplate}
                onChange={e => { setDiscordTemplate(e.target.value); setSaved(null); }}
                placeholder={DEFAULT_DISCORD_TEMPLATE}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono resize-none"
              />
              <div className="bg-[#1e1f22] rounded-xl p-3 mt-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5 font-bold">Vista previa</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{previewTemplate(discordTemplate)}</p>
              </div>
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
                  {testing ? 'Enviando...' : 'ðŸ§ª Probar'}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Redes Sociales del Scan</p>
              <p className="text-xs text-gray-500">
                Ingresá las URLs de las redes sociales de tu grupo. Se mostrarán y enlazarán en tu página pública.
              </p>
            </div>
            
            {savedRedes && (
              <div className={`p-3 rounded-xl text-sm font-medium ${savedRedes.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                {savedRedes}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5">
              {[
                { name: 'discord', label: 'Discord', placeholder: 'https://discord.gg/codigo-invitacion' },
                { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/pagina-o-grupo' },
                { name: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/usuario' },
                { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/usuario' },
                { name: 'patreon', label: 'Patreon', placeholder: 'https://patreon.com/usuario' },
                { name: 'donations', label: 'Donaciones (PayPal / Kofi / etc)', placeholder: 'https://paypal.me/usuario' },
                { name: 'telegram', label: 'Telegram', placeholder: 'https://t.me/usuario' },
                { name: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/numero' }
              ].map(field => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{field.label}</label>
                  <input
                    type="url"
                    value={(redes as any)[field.name] || ''}
                    onChange={e => {
                      setRedes(prev => ({ ...prev, [field.name]: e.target.value }));
                      setSavedRedes(null);
                    }}
                    placeholder={field.placeholder}
                    className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button onClick={handleSaveRedes} disabled={savingRedes}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition w-fit">
                {savingRedes ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                {savingRedes ? 'Guardando Redes...' : 'Guardar Redes'}
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  SECCIÓN: SEGURIDAD (Logs)
// ============================================================
function SectionSeguridad() {
  const { data, loading, refetch } = useAPI<{ logs: any[] }>('/api/admin/logs');
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const filteredLogs = useMemo(() => {
    return (data?.logs ?? []).filter((log: any) => {
      if (filterTipo && log.tipo !== filterTipo) return false;
      const q = search.toLowerCase().trim();
      if (q) {
        const detalles = (log.detalles || '').toLowerCase();
        const ip = (log.ip || '').toLowerCase();
        const ua = (log.user_agent || '').toLowerCase();
        const tipo = (log.tipo || '').toLowerCase();
        if (!detalles.includes(q) && !ip.includes(q) && !ua.includes(q) && !tipo.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data?.logs, search, filterTipo]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white flex items-center gap-2">
            <ShieldCheck size={22} className="text-rose-500"/> Auditoría y Logs
          </h2>
          <p className="text-gray-500 text-sm mt-1">Historial de registros de usuarios, accesos y seguridad del sistema</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors">
          <RefreshCw size={15}/> Actualizar
        </button>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por IP, detalles..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14}/>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 hidden sm:inline">Tipo:</span>
          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition cursor-pointer"
          >
            <option value="">Todos los eventos</option>
            <option value="registro_usuario">Nuevos Registros</option>
            <option value="login_exitoso">Conexiones Exitosas</option>
            <option value="login_fallido">Conexiones Fallidas</option>
            <option value="robo_imagenes">Robo de Imágenes</option>
            <option value="error_sistema">Errores de Sistema</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <ShieldCheck size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No se encontraron registros de seguridad</p>
              <p className="text-sm">Todo está funcionando correctamente o ajustá tus filtros</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredLogs.map((log: any, i: number) => {
                const tipo = log.tipo;
                let title = 'Acción del Sistema';
                let icon = <AlertCircle size={20}/>;
                let badgeClass = 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400';

                if (tipo === 'robo_imagenes') {
                  title = 'Intento de robo bloqueado';
                  icon = <AlertCircle size={20}/>;
                  badgeClass = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                } else if (tipo === 'error_sistema') {
                  title = 'Error del Sistema (Bug)';
                  icon = <AlertCircle size={20}/>;
                  badgeClass = 'bg-red-500/10 text-red-500 border border-red-500/20';
                } else if (tipo === 'registro_usuario') {
                  title = 'Nuevo Registro de Usuario';
                  icon = <UserPlus size={20}/>;
                  badgeClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
                } else if (tipo === 'login_exitoso') {
                  title = 'Inicio de Sesión Exitoso';
                  icon = <ShieldCheck size={20}/>;
                  badgeClass = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
                } else if (tipo === 'login_fallido') {
                  title = 'Intento de Conexión Fallido';
                  icon = <Ban size={20}/>;
                  badgeClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                }

                return (
                  <div key={log.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 dark:hover:bg-white/2 transition ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeClass}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <p className="font-bold text-sm dark:text-white">
                          {title}
                        </p>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12}/> {new Date(log.fecha.replace(' ', 'T') + 'Z').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-2">
                        <span><strong>IP:</strong> {log.ip || 'Desconocida'}</span>
                        <span className="truncate max-w-xs" title={log.user_agent}><strong>UA:</strong> {log.user_agent || 'Desconocido'}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-3 text-xs font-mono overflow-x-auto text-gray-600 dark:text-gray-400">
                        {log.detalles}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SECCIÓN: SOPORTE ──────────────────────────────────────────
function SectionSoporte() {
  const { data, loading, refetch } = useAPI<any>('/api/admin/tickets');
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (id: string, estado: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`${API}/api/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      if (res.ok) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>;

  const tickets = data?.tickets || [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="text-rose-500" size={24}/> Buzón de Sugerencias & Soporte
        </h2>
        <p className="text-gray-500 text-sm mt-1">Gestiona los mensajes, sugerencias y reportes de los usuarios.</p>
      </div>

      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <MessageSquare size={40} className="mb-3 opacity-30"/>
            <p className="font-medium">El buzón está vacío</p>
            <p className="text-sm">No hay mensajes pendientes.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {tickets.map((t: any, i: number) => (
              <div key={t.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 dark:hover:bg-white/2 transition ${i !== 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      t.tipo === 'reporte' ? 'bg-red-500/10 text-red-500' : 
                      t.tipo === 'soporte' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {t.tipo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      t.estado === 'resuelto' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      t.estado === 'en_proceso' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                    }`}>
                      {t.estado.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                      <Clock size={12}/> {new Date(t.fecha_creacion).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap">{t.mensaje}</p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {t.username && <span><strong>Usuario:</strong> {t.username}</span>}
                    {t.contacto && <span><strong>Contacto:</strong> {t.contacto}</span>}
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0 sm:w-36">
                  {t.estado !== 'resuelto' && (
                    <button 
                      onClick={() => updateStatus(t.id, 'resuelto')}
                      disabled={updating === t.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition"
                    >
                      <Check size={14}/> Resuelto
                    </button>
                  )}
                  {t.estado === 'pendiente' && (
                    <button 
                      onClick={() => updateStatus(t.id, 'en_proceso')}
                      disabled={updating === t.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 rounded-lg text-xs font-bold transition"
                    >
                      <Clock size={14}/> En Proceso
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
