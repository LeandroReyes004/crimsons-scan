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
  ArrowUp, ArrowDown, Save, Download, FileText, AlertTriangle
} from 'lucide-react';
import { getUser, getToken, authHeaders, logout, refreshUser } from '@/lib/auth';
import { toWebP } from '@/lib/webp';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

type Section = 'dashboard' | 'mangas' | 'revision' | 'usuarios' | 'scans' | 'config' | 'revenue' | 'seguridad' | 'soporte';

// â”€â”€ Tipos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Stats { mangas: number; capitulos: number; scanners: number; pendientes: number; }
interface Manga { id: string; titulo: string; tipo: string; estado: string; cover_r2_key: string | null; views_total: number; fecha_actualizacion: string; scan_nombre?: string; descripcion?: string | null; es_adulto?: number; scan_id?: string | null; generos?: string; joint_scan_id?: string | null; joint_status?: string | null; joint_scan_nombre?: string | null; }
interface Capitulo { id: string; numero: number; titulo: string; estado: string; manga_titulo: string; manga_id: string; uploader_username: string; notas_admin: string | null; fecha_subida: string; num_paginas?: number; }
interface Usuario { id: string; username: string; email: string; rol: string; activo: number; fecha_registro: string; ultimo_acceso: string | null; scan_id?: string; scan_nombre?: string; cuenta_pendiente?: number | boolean; }
interface Scan { id: string; nombre: string; descripcion: string | null; activo: number; miembros: number; contrato_firmado?: number; representante_nombre?: string; representante_discord?: string; binance_pay_id?: string; }

// â”€â”€ Hook: fetch con auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Componentes pequeÃ±os â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string; }) {
  return (
    <div className="bg-white dark:bg-[#111114] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-extrabold dark:text-white">{value ?? 'â€”'}</p>
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
        logout(); setLoginErr('No tenÃ©s permisos de admin.'); return;
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
    return () => window.removeEventListener('open-contract', handleOpen);
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  // â”€â”€ Pantalla de login si no hay sesiÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!user) return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo.png" alt="CrimsonScan" className="h-10 w-auto object-contain" />
          <div>
            <p className="font-bold text-white leading-tight">CrimsonHQ</p>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">âš¡ Acceso Restringido</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111114] border border-white/10 rounded-2xl p-7 flex flex-col gap-4 shadow-2xl">
          <h2 className="text-lg font-bold text-white text-center mb-1">Iniciar SesiÃ³n</h2>

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
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">ContraseÃ±a</label>
            <input
              type="password"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
            Â¿No tenÃ©s cuenta?{' '}
            <Link href="/register" className="text-rose-500 font-bold hover:underline">
              Registrate
            </Link>
          </p>
        </form>

        <Link href="/" className="block text-center text-xs text-gray-600 hover:text-gray-400 transition mt-5">
          â† Volver al sitio
        </Link>
      </div>
    </div>
  );

  const needsContract = user && user.scan_id && !user.is_superadmin && (user.scan_contrato_version || 0) < (user.global_contrato_version || 1);

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-[#07070a] text-gray-900 dark:text-gray-100 font-sans">
      {(needsContract || forceContract) && <ContractModal scanId={user.scan_id!} onClose={() => setForceContract(false)} />}

      {/* â”€â”€ Overlay mobile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              {user.is_superadmin ? 'âš¡ SuperAdmin' : user.rol === 'admin_scan' ? 'ðŸ›¡ Admin Scan' : user.rol === 'soporte' ? 'ðŸŽ§ Soporte' : 'Admin'}
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
            { id: 'seguridad', icon: <ShieldCheck size={16}/>,     label: 'AuditorÃ­a / Logs', show: !!user.is_superadmin || user.rol === 'soporte' },
            { id: 'config',    icon: <Settings size={16}/>,        label: 'Mi Scan',   show: !user.is_superadmin && (user.rol === 'admin' || user.rol === 'admin_scan') && !!user.scan_id },
            { id: 'soporte',   icon: <MessageSquare size={16}/>,   label: 'Soporte',   show: !!user.is_superadmin || user.rol === 'soporte' },
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

      {/* â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#0d0d10] border-b border-gray-200 dark:border-white/5 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition"
              aria-label="Abrir menÃº"
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
//  SECCIÃ“N: DASHBOARD
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
          <StatCard icon={<Clock size={20}/>}       label="Pendientes"         value={data?.pendientes ?? 0}  color="bg-amber-50 dark:bg-amber-500/10 text-amber-500"/>
        </div>
      )}

      {/* Ãšltimos mangas */}
      <div>
        <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-rose-500"/> Proyectos Recientes
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
          )) ?? <p className="text-gray-400 text-sm p-5">No hay proyectos aÃºn.</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SECCIÃ“N: MANGAS
// ============================================================
const GENRES_LIST = [
  'AcciÃ³n','Aventura','Comedia','Drama','FantasÃ­a','Romance','Horror','Misterio','PsicolÃ³gico',
  'Ciencia FicciÃ³n','Sobrenatural','Thriller','Deportes','HistÃ³rico','Isekai','Mecha','Magia',
  'Artes Marciales','Superpoderes','ReencarnaciÃ³n','Supervivencia','Escolar','Vida Escolar',
  'Recuentos de la Vida (Slice of Life)','Tragedia','Adulto','Maduro','Ecchi','Harem','Harem Inverso',
  'Seinen','Shounen','Shoujo','Josei','GÃ©nero Bender','Crossdressing','Apocalipsis','PostapocalÃ­ptico',
  'Sistema','Videojuegos','VRMMO','CultivaciÃ³n','Wuxia','Xianxia','Xuanhuan','Murim','RegresiÃ³n',
  'Regresor','Viaje en el Tiempo','Venganza','Villana','Realeza','Nobleza','PolÃ­tica','Militar',
  'MÃ©dico','Cocina','MÃºsica','Idol','Oficina','Crimen','Detectives','Mafia','Monstruos','Demonios',
  'Ãngeles','Vampiros','Zombies','Mazmorras','Cazadores','InvocaciÃ³n','Magia Oscura','Alquimia',
  'Bestias MÃ¡gicas','Omegaverse','BL (Boys Love)','GL (Girls Love)','Yuri','Yaoi','Shounen Ai',
  'Josei Ai','HarÃ©n Masculino','HarÃ©n Femenino','Sadomasoquismo',
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
  // Si no es superadmin, el scan_id se fija al del usuario actual (o al del manga si ya tenÃ­a uno)
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
      await onSave({ titulo, tipo, estado, descripcion, generos, scan_id: scanId || null, joint_scan_id: jointScanId || null, es_adulto: esAdulto }, coverFile);
      setFeedback('âœ… Guardado');
      setTimeout(onCancel, 1200);
    } catch (err: any) {
      setFeedback(`âŒ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
      <h3 className="font-bold dark:text-white mb-5 flex items-center gap-2"><Plus size={16} className="text-rose-500"/> {title}</h3>
      {feedback && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
          {feedback}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">TÃ­tulo *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ej: Solo Leveling Ragnarok"
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"/>
          </div>
          {isSuperAdmin && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Layers size={11}/> Scan Responsable</label>
              <select value={scanId} onChange={e => setScanId(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="">â€” Sin asignar â€”</option>
                {scans.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
              <option value="novela">Novela</option>
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
          <div className="flex flex-col gap-1.5 md:col-span-1">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">ðŸ¤ Joint (Opcional)</label>
             <select value={jointScanId} onChange={e => setJointScanId(e.target.value)}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none">
                <option value="">â€” Ninguno â€”</option>
                {scans.filter(s => s.id !== scanId && s.id !== currentUser?.scan_id).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
             </select>
          </div>
          <div className="flex items-center gap-3 mt-1 md:col-span-2">
            <button type="button" onClick={() => setEsAdulto(v => !v)}
              className={`w-10 h-6 rounded-full transition-colors shrink-0 ${esAdulto ? 'bg-rose-500' : 'bg-gray-300 dark:bg-white/20'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${esAdulto ? 'translate-x-4' : 'translate-x-0'}`}/>
            </button>
            <span className="text-sm dark:text-white font-medium">Contenido +18</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sinopsis</label>
          <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={2} placeholder="DescripciÃ³n de la obra..."
            className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none resize-none transition"/>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
            GÃ©neros
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
          <input type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; setCoverFile(f ? await toWebP(f, 800) : null); }}
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
    if (!confirm('Â¿Eliminar este capÃ­tulo? Esta acciÃ³n no se puede deshacer.')) return;
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
      if (pages.length === 0) { alert('El capÃ­tulo no tiene pÃ¡ginas.'); setDownloadingCap(null); return; }
      
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
      alert(`Error al cargar pÃ¡ginas: ${e.message}`);
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
    if (!confirm(`Â¿Eliminar "${manga.titulo}"? Se borrarÃ¡n todos sus capÃ­tulos y pÃ¡ginas. Esta acciÃ³n no se puede deshacer.`)) return;
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
    if (!confirm(`Â¿Confirmas que querÃ©s salir del joint de "${manga.titulo}"? Tu scan ya no aparecerÃ¡ como colaborador.`)) return;
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
          <h2 className="text-2xl font-extrabold dark:text-white">GestiÃ³n de Proyectos</h2>
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
              <p className="font-medium">No hay proyectos creados aÃºn</p>
              <p className="text-sm">HacÃ© click en "Nueva Obra" para empezar</p>
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
                        <BookOpen size={16}/> CapÃ­tulos
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className={`font-bold text-sm dark:text-white ${viewMode === 'list' ? 'truncate' : 'line-clamp-2'}`} title={m.titulo}>{m.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{m.tipo} Â· <span className="font-mono">{m.id.slice(0,8)}...</span></p>
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
                          title="Ver capÃ­tulos">
                          <ChevronDown size={14} className={`transition-transform ${expandedId === m.id ? 'rotate-180' : ''}`}/>
                        </button>
                      )}
                      {/* Salir del joint â€” solo visible si el scan actual es el joint */}
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
                      {/* Deshabilitar obra â€” solo admin global o superadmin */}
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
                    <p className="text-xs text-gray-400 text-center py-3">Sin capÃ­tulos</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {(capsByManga[m.id] || []).map(cap => (
                        <div key={cap.id} className="flex flex-col">
                          <div className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-white/5 transition">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge estado={cap.estado}/>
                              <span className="text-sm dark:text-white font-medium">Cap. {cap.numero}{cap.titulo ? ` â€” ${cap.titulo}` : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={10}/>{cap.views}</span>
                              <button onClick={() => handleDownloadChapter(m, cap)} disabled={downloadingCap === cap.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition disabled:opacity-50" title="Descargar CapÃ­tulo">
                                {downloadingCap === cap.id ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
                              </button>
                              {!isReadOnly && (
                                <button onClick={() => openReorder(cap.id)}
                                  className={`p-1.5 rounded-lg transition ${reorderingCap === cap.id ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`} title="Editar pÃ¡ginas">
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
                                  <ImageIcon size={14} className="text-indigo-500"/> PÃ¡ginas (Cap. {cap.numero})
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
                                <p className="text-xs text-gray-400 text-center py-4">No hay pÃ¡ginas en este capÃ­tulo.</p>
                              ) : (
                                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
                                  {editPages.map((page, idx) => (
                                    <div key={page.id} className="flex items-center gap-3 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-lg p-2 shadow-sm">
                                      <img src={page.image_url} alt="" className="w-8 h-12 object-cover rounded bg-gray-200 dark:bg-white/5 shrink-0"/>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold dark:text-white">PÃ¡g. {String(page.orden).padStart(3, '0')}</p>
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
//  SECCIÃ“N: AGENDA DE PUBLICACIONES
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
    if (!confirm('Â¿Eliminar este capÃ­tulo? Esta acciÃ³n no se puede deshacer.')) return;
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
          <p className="text-gray-500 text-sm mt-1">{data?.capitulos?.length ?? 0} capÃ­tulos en espera</p>
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
          <p className="font-medium">No hay capÃ­tulos programados</p>
          <p className="text-sm mt-1">Los capÃ­tulos subidos aparecen aquÃ­ antes de publicarse</p>
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
                      Cap. {cap.numero}{cap.titulo ? ` â€” ${cap.titulo}` : ''} Â· por <strong className="text-rose-400">{cap.uploader_username}</strong>
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
//  SECCIÃ“N: USUARIOS
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
    if (!editEmailVal.trim() || !editEmailVal.includes('@')) { setEditEmailMsg('âŒ Email invÃ¡lido'); return; }
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

  // Reset contraseÃ±a â€” v2.0: envÃ­a email en lugar de ingresar contraseÃ±a manual
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

  // v2.0 â€” envÃ­a email de reset en lugar de ingresar contraseÃ±a manual
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
        setResetMsg(`âš ï¸ No se pudo enviar email â€” link: ${d.setupUrl ?? '(sin RESEND_API_KEY)'}`);
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
        // v2.0 â€” sin password: el usuario recibe email para configurarla
        body: JSON.stringify({ username, email, rol, scan_id: userScanId || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const msg = d.emailSent
        ? `âœ… Usuario "${username}" creado â€” email de invitaciÃ³n enviado a ${email}`
        : `âœ… Usuario "${username}" creado â€” link de setup: ${d.setupUrl ?? '(configurÃ¡ RESEND_API_KEY)'}`;
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
          <h2 className="text-2xl font-extrabold dark:text-white">GestiÃ³n de Usuarios</h2>
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
          {/* v2.0 â€” sin campo contraseÃ±a: el usuario la configura por email */}
          <div className="mb-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
            <span className="mt-0.5">ðŸ“§</span>
            <span>Se enviarÃ¡ un email al usuario con un link para que configure su propia contraseÃ±a. El link expira en 48 hs.</span>
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
                <option value="">â€” Sin scan â€”</option>
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
                  {/* Cambiar rol â€” solo superadmin */}
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
                  {/* Cambiar scan â€” solo superadmin */}
                  {isSuperAdmin && (
                    <button onClick={() => { setEditScanId(editScanId === u.id ? null : u.id); setEditScanVal(u.scan_id || ''); setEditScanMsg(null); setEditRolId(null); setEditEmailId(null); }}
                      title="Cambiar scan" className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition">
                      <Layers size={14}/>
                    </button>
                  )}
                  {/* Editar email â€” solo superadmin */}
                  {isSuperAdmin && (
                    <button onClick={() => { setEditEmailId(editEmailId === u.id ? null : u.id); setEditEmailVal(u.email); setEditEmailMsg(null); setEditRolId(null); setEditScanId(null); setResetingId(null); }}
                      title="Editar email" className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition">
                      <AtSign size={14}/>
                    </button>
                  )}
                  {/* Bloquear/activar â€” superadmin y soporte */}
                  <button onClick={() => toggleActivo(u)} title={u.activo ? 'Bloquear' : 'Activar'}
                    className={`p-1.5 rounded-lg transition ${u.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                    {u.activo ? <Ban size={14}/> : <Check size={14}/>}
                  </button>
                  {/* Resetear contraseÃ±a â€” superadmin y soporte */}
                  <button onClick={() => { setResetingId(resetingId === u.id ? null : u.id); setResetMsg(null); setEditScanId(null); setEditRolId(null); }}
                    title={!!u.cuenta_pendiente ? 'Reenviar invitaciÃ³n' : 'Resetear contraseÃ±a por email'}
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
                      <option value="">â€” Sin scan â€”</option>
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

              {/* Panel reset/reenvÃ­o invitaciÃ³n â€” v2.0: siempre envÃ­a email */}
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
                    {!!u.cuenta_pendiente ? 'Reenviar invitaciÃ³n' : 'Reset de contraseÃ±a'} â€” <strong>{u.username}</strong>
                  </p>
                  <p className={`text-xs mb-3 ${!!u.cuenta_pendiente ? 'text-sky-600 dark:text-sky-400/70' : 'text-amber-600 dark:text-amber-400/70'}`}>
                    Se enviarÃ¡ un email a <strong>{u.email}</strong> con un link para {!!u.cuenta_pendiente ? 'activar su cuenta' : 'configurar una nueva contraseÃ±a'}. El link expira en 48 hs.
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
                      {!!u.cuenta_pendiente ? 'Reenviar invitaciÃ³n' : 'Enviar email de reset'}
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
//  SECCIÃ“N: SCANS
// ============================================================
interface ScanDetail { scan: Scan; mangas: any[]; miembros: any[]; totalViews: number; }

// ============================================================
//  SECCIÃ“N: REVENUE SHARE
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
  // admin_scan ve solo su propio scan, cargado automÃ¡ticamente
  const ownScanId    = (!isSuperAdmin && currentUser?.scan_id) ? currentUser.scan_id : null;

  const { data, loading, refetch } = useAPI<{ scans: RevenueScan[]; grand_total: number; grand_total_mes: number }>(
    isSuperAdmin ? '/api/admin/revenue' : '/api/admin/revenue/__skip__'
  );
  const [expandedScan, setExpandedScan]     = useState<string | null>(ownScanId);
  const [scanDetail, setScanDetail]         = useState<Record<string, { mangas: RevenueManga[]; scan_total: number; scan_total_mes: number }>>({});
  const [loadingDetail, setLoadingDetail]   = useState<string | null>(null);
  const [expandedManga, setExpandedManga]   = useState<string | null>(null);

  // Para admin_scan: cargar el detalle de su scan directamente al montar
  useEffect(() => {
    if (!ownScanId) return;
    setLoadingDetail(ownScanId);
    fetch(`${API}/api/admin/revenue/${ownScanId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setScanDetail(prev => ({ ...prev, [ownScanId]: d })); })
      .finally(() => setLoadingDetail(null));
  }, [ownScanId]);

  const loadScanDetail = async (scanId: string) => {
    if (expandedScan === scanId) { setExpandedScan(null); return; }
    if (scanDetail[scanId]) { setExpandedScan(scanId); return; }
    setLoadingDetail(scanId);
    try {
      const res = await fetch(`${API}/api/admin/revenue/${scanId}`, { headers: authHeaders() });
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
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white flex items-center gap-2">
            <DollarSign size={22} className="text-emerald-500"/> Revenue â€” Mi Scan
          </h2>
          <p className="text-gray-500 text-sm mt-1">Vistas de tu scan â€” se reinician el 1Â° de cada mes</p>
        </div>
        {isLoading && <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>}
        {det && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Eye size={20}/></div>
                <div>
                  <p className="text-2xl font-black dark:text-white">{(det.scan_total_mes ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 font-semibold">vistas este mes</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400"><TrendingUp size={20}/></div>
                <div>
                  <p className="text-2xl font-black dark:text-white">{det.scan_total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 font-semibold">vistas histÃ³ricas</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {det.mangas.map(manga => {
                const isMangaExpanded = expandedManga === manga.id;
                return (
                  <div key={manga.id} className="bg-white dark:bg-[#111114] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                    <button onClick={() => setExpandedManga(isMangaExpanded ? null : manga.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/2 transition text-left">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold dark:text-white truncate">{manga.titulo}</p>
                        <p className="text-[10px] text-gray-400">{manga.capitulos.length} caps publicados</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-black dark:text-white tabular-nums">{(manga.views_mes ?? 0).toLocaleString()} <span className="text-xs text-emerald-500 font-bold">mes</span></p>
                          <p className="text-[10px] text-gray-400 tabular-nums">{manga.views_total.toLocaleString()} total</p>
                        </div>
                        <ChevronRight size={12} className={`text-gray-400 transition-transform ${isMangaExpanded ? 'rotate-90' : ''}`}/>
                      </div>
                    </button>
                    {isMangaExpanded && (
                      <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 px-4 py-3">
                        {manga.capitulos.map(cap => (
                          <div key={cap.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              Cap. {cap.numero}{cap.titulo ? ` â€” ${cap.titulo}` : ''}
                            </span>
                            <span className="text-xs font-bold tabular-nums dark:text-white flex items-center gap-1">
                              <Eye size={10} className="text-gray-400"/> {cap.views.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {manga.capitulos.length === 0 && <p className="text-xs text-gray-400 italic py-1">Sin capÃ­tulos publicados</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold dark:text-white flex items-center gap-2">
            <DollarSign size={22} className="text-emerald-500"/> Revenue Share
          </h2>
          <p className="text-gray-500 text-sm mt-1">Vistas acumuladas por scan â€” base para calcular pagos</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors">
          <RefreshCw size={15}/> Actualizar
        </button>
      </div>

      {/* Tarjeta total global */}
      {!loading && data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Eye size={20}/></div>
            <div>
              <p className="text-2xl font-black dark:text-white">{(data.grand_total_mes ?? 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-semibold">vistas este mes (todos los scans)</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400"><TrendingUp size={20}/></div>
            <div>
              <p className="text-2xl font-black dark:text-white">{data.grand_total.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-semibold">vistas histÃ³ricas totales</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-rose-500" size={32}/></div>
      ) : (
        <div className="flex flex-col gap-4">
          {(data?.scans ?? []).map(scan => {
            const det = scanDetail[scan.id];
            const isExpanded = expandedScan === scan.id;
            const isLoading = loadingDetail === scan.id;
            const pctGlobal = pct(scan.total_views, data?.grand_total ?? 0);

            return (
              <div key={scan.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {/* Fila del scan */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-500 shrink-0 font-black text-lg">
                    {scan.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold dark:text-white">{scan.nombre}</p>
                    <p className="text-xs text-gray-400">{scan.total_mangas} obras Â· {scan.total_capitulos} caps publicados</p>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0">
                    <p className="text-xl font-black dark:text-white">{(scan.views_mes ?? 0).toLocaleString()} <span className="text-xs text-emerald-500 font-bold">mes</span></p>
                    <p className="text-xs text-gray-400 tabular-nums">{scan.total_views.toLocaleString()} histÃ³rico</p>
                  </div>
                  {/* Barra de porcentaje */}
                  <div className="hidden lg:block w-32">
                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                        style={{ width: `${pctGlobal}%` }}/>
                    </div>
                  </div>
                  <button onClick={() => loadScanDetail(scan.id)} disabled={isLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition shrink-0">
                    {isLoading ? <Loader2 size={12} className="animate-spin"/> : <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>}
                    {isExpanded ? 'Cerrar' : 'Ver detalle'}
                  </button>
                </div>

                {/* Detalle expandido */}
                {isExpanded && det && (
                  <div className="border-t border-gray-100 dark:border-white/5 px-5 py-5 bg-gray-50/50 dark:bg-white/2 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen size={12}/> Desglose por obra
                      </p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Este mes: {(det.scan_total_mes ?? 0).toLocaleString()} Â· HistÃ³rico: {det.scan_total.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {det.mangas.map(manga => {
                        const isMangaExpanded = expandedManga === manga.id;
                        const mangaPct = pct(manga.views_total, det.scan_total);
                        return (
                          <div key={manga.id} className="bg-white dark:bg-[#111114] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                            {/* Fila manga */}
                            <button onClick={() => setExpandedManga(isMangaExpanded ? null : manga.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/2 transition text-left">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold dark:text-white truncate">{manga.titulo}</p>
                                <p className="text-[10px] text-gray-400">{manga.tipo} Â· {manga.capitulos.length} caps</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="hidden sm:block w-20">
                                  <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500/60 rounded-full"
                                      style={{ width: `${mangaPct}%` }}/>
                                  </div>
                                </div>
                                <span className="text-sm font-bold dark:text-white tabular-nums">
                                  {manga.views_total.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-400">{mangaPct}%</span>
                                <ChevronRight size={12} className={`text-gray-400 transition-transform ${isMangaExpanded ? 'rotate-90' : ''}`}/>
                              </div>
                            </button>
                            {/* Detalle capÃ­tulos */}
                            {isMangaExpanded && (
                              <div className="border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 px-4 py-3 animate-in slide-in-from-top-1 duration-150">
                                <div className="flex flex-col gap-1">
                                  {manga.capitulos.map(cap => (
                                    <div key={cap.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                                      <span className="text-xs text-gray-600 dark:text-gray-300">
                                        Cap. {cap.numero}{cap.titulo ? ` â€” ${cap.titulo}` : ''}
                                      </span>
                                      <span className="text-xs font-bold tabular-nums dark:text-white flex items-center gap-1">
                                        <Eye size={10} className="text-gray-400"/>
                                        {cap.views.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                  {manga.capitulos.length === 0 && (
                                    <p className="text-xs text-gray-400 italic py-1">Sin capÃ­tulos publicados</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {det.mangas.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">Sin obras en este scan</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(data?.scans?.length === 0) && (
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
              <BarChart2 size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No hay datos de revenue aÃºn</p>
              <p className="text-sm">Las vistas se acumulan automÃ¡ticamente cuando los usuarios leen</p>
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
        body: JSON.stringify({ texto: contractText }),
      });
      if (res.ok) setContractMsg('Contrato actualizado y versiÃ³n incrementada.');
      else setContractMsg('Error al guardar el contrato.');
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
      setFeedback(`âœ… Scan "${nombre}" creado`);
      setNombre(''); setDesc('');
      refetch();
      setTimeout(() => setShowForm(false), 1200);
    } catch (err: any) { setFeedback(`âŒ ${err.message}`); }
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
          <div className="flex gap-3">
            <button onClick={() => { setShowContractForm(!showContractForm); setShowForm(false); if (!showContractForm) loadContract(); }}
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

      {showContractForm && isSuperAdmin && (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold dark:text-white mb-2 flex items-center gap-2"><Edit3 size={16} className="text-rose-500"/> Editar Contrato de Alianza</h3>
          <p className="text-sm text-gray-500 mb-5">El texto se mostrarÃ¡ a los administradores de scan. Al guardar, se exigirÃ¡ que todos vuelvan a firmar.</p>
          {contractMsg && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${contractMsg.includes('Error') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {contractMsg}
            </div>
          )}
          <form onSubmit={handleSaveContract} className="flex flex-col gap-4">
            <div>
              <textarea 
                value={contractText} onChange={e => setContractText(e.target.value)} required rows={15}
                className="w-full bg-gray-50 dark:bg-[#07070a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 dark:text-white focus:outline-none focus:border-rose-500 transition-colors resize-y font-mono text-sm"
                placeholder="Escribe el contrato aquÃ­..."
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={contractSaving} className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all">
                {contractSaving ? 'Guardando...' : 'Guardar Nueva VersiÃ³n'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && isSuperAdmin && (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="font-bold dark:text-white mb-5 flex items-center gap-2"><Layers size={16} className="text-rose-500"/> Registrar Scan</h3>
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${feedback.startsWith('âœ…') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
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
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">DescripciÃ³n</label>
              <textarea value={descripcion} onChange={e => setDesc(e.target.value)} rows={2} placeholder="DescripciÃ³n del grupo..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.scans?.length === 0 && (
            <div className="col-span-full bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center py-16 text-gray-400">
              <Layers size={40} className="mb-3 opacity-30"/>
              <p className="font-medium">No hay scans registrados</p>
              {isSuperAdmin && <p className="text-sm">Haz clic en "Nuevo Scan" para empezar</p>}
            </div>
          )}
          {data?.scans?.map(scan => {
            const det = details[scan.id];
            const isExpanded = expandedId === scan.id;
            const isLoading = loadingId === scan.id;
            return (
              <div key={scan.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col">
                {/* Cabecera del scan (card) */}
                <div className="flex flex-col gap-3 px-5 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center text-violet-500 shrink-0 text-xl font-black">
                        {scan.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold dark:text-white truncate">{scan.nombre}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${scan.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                          {scan.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <button onClick={() => toggleActivo(scan)}
                        className={`p-2 rounded-lg transition shrink-0 ${scan.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                        {scan.activo ? <Ban size={16}/> : <Check size={16}/>}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 min-h-[2rem] mt-1">{scan.descripcion || 'Sin descripciÃ³n'}</p>

                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3 mt-2">
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Users size={12}/> {scan.miembros} miem.</span>
                      {det && (
                        <>
                          <span className="flex items-center gap-1"><BookOpen size={12}/> {det.mangas.length} proy.</span>
                          <span className="flex items-center gap-1"><Eye size={12}/> {det.totalViews >= 1000 ? (det.totalViews/1000).toFixed(1)+'k' : det.totalViews} vis.</span>
                        </>
                      )}
                    </div>
                    <button onClick={() => loadDetails(scan.id)} disabled={isLoading}
                      className="flex items-center gap-1 text-[11px] font-bold text-violet-500 hover:text-violet-400 transition">
                      {isLoading ? <Loader2 size={12} className="animate-spin"/> : isExpanded ? 'Ocultar' : 'Detalles'}
                      <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>
                    </button>
                  </div>
                </div>


                {/* Panel de detalles expandido */}
                {isExpanded && det && (
                  <div className="border-t border-gray-100 dark:border-white/5 px-5 py-5 bg-gray-50/50 dark:bg-white/2 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Contrato de Alianza */}
                    {scan.contrato_firmado ? (
                      <div className="bg-white dark:bg-[#111114] rounded-xl p-4 border border-gray-100 dark:border-white/5 mb-6 shadow-sm">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FileText size={12}/> Datos de Firma
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm">
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-0.5">Representante</p>
                            <p className="font-bold dark:text-white">{scan.representante_nombre}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-0.5">Discord</p>
                            <p className="font-bold dark:text-white">{scan.representante_discord || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-0.5">Binance Pay</p>
                            <p className="font-bold text-emerald-500 font-mono">{scan.binance_pay_id}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-200 dark:border-amber-500/20 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                          <AlertTriangle size={16}/>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Contrato Pendiente</p>
                          <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 font-medium">El administrador no ha firmado la Ãºltima versiÃ³n.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-6">

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
                              <div key={m.id} className="flex items-center gap-3 bg-white dark:bg-[#111114] rounded-xl px-3 py-2.5 border border-gray-100 dark:border-white/5">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold dark:text-white truncate">{m.titulo}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{m.tipo}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{m.caps_publicados} cap{m.caps_publicados !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 gap-1">
                                  <Badge estado={m.estado}/>
                                  <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Eye size={10}/> {(m.views_total || 0).toLocaleString()}</span>
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

                        {/* MÃ©tricas totales */}
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
//  SECCIÃ“N: CONFIGURACIÃ“N DEL SCAN (webhook Discord)
// ============================================================
const DEFAULT_DISCORD_TEMPLATE = 'ðŸ“– **{{manga}}** â€” CapÃ­tulo {{capitulo}}{{titulo}}\n\n[ðŸ‘ Leer ahora]({{url}})';

function previewTemplate(tpl: string) {
  return (tpl || DEFAULT_DISCORD_TEMPLATE)
    .replace(/\{\{manga\}\}/g, 'Atados por el Pecado')
    .replace(/\{\{capitulo\}\}/g, '42')
    .replace(/\{\{titulo\}\}/g, ' â€” El reencuentro')
    .replace(/\{\{url\}\}/g, 'https://scancrimson.com/manga/reader/...')
    .replace(/\*\*(.*?)\*\*/g, '$1');
}

function SectionConfig({ scanId }: { scanId: string }) {
  const [webhook, setWebhook]               = useState('');
  const [discordTemplate, setDiscordTemplate] = useState('');
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
        body: JSON.stringify({ webhook_discord: webhook || null, discord_template: discordTemplate || null }),
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
            description: `El bot de **${scanData?.scan?.nombre || 'tu scan'}** estÃ¡ listo para notificaciones.`,
            color: 0xe11d48,
            footer: { text: "Crimson's Scan" },
            timestamp: new Date().toISOString(),
          }]
        }),
      });
      setTestMsg(res.ok ? 'âœ… Mensaje enviado al Discord' : 'âŒ URL invÃ¡lida o sin permisos');
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
    if (raw.size > 5 * 1024 * 1024) { setImgMsg('âŒ MÃ¡ximo 5MB'); return; }
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-xl">
      <div>
        <h2 className="text-2xl font-extrabold dark:text-white">Mi Scan</h2>
        <p className="text-gray-500 text-sm mt-1">Miembros y notificaciones</p>
      </div>

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
            <p className="text-sm text-gray-500">Sube una imagen de portada para tu scan (PNG, JPG â€” mÃ¡x 5MB). Se mostrarÃ¡ en la pÃ¡gina de comunidad.</p>
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
        <>
          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tu scan</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 flex items-center justify-center text-violet-500 text-xl font-black">
                {scanData?.scan?.nombre?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-bold dark:text-white">{scanData?.scan?.nombre}</p>
                <p className="text-xs text-gray-400">{scanData?.scan?.descripcion || 'Sin descripciÃ³n'}</p>
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
                    <input value={newPwd} onChange={e => setNewPwd(e.target.value)} required type="password" placeholder="ContraseÃ±a" className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-lg text-sm dark:text-white focus:border-rose-500 outline-none"/>
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
                <p className="text-xs text-gray-400 italic py-2">Sin miembros aÃºn â€” agregÃ¡ el primero</p>
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
              Cuando se publique un capÃ­tulo de tu scan, el bot notifica automÃ¡ticamente al canal.
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
              <p className="text-xs text-gray-400">UsÃ¡ las variables de abajo. Si lo dejÃ¡s vacÃ­o se usa el mensaje por defecto. Soporta Markdown de Discord.</p>
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
                IngresÃ¡ las URLs de las redes sociales de tu grupo. Se mostrarÃ¡n y enlazarÃ¡n en tu pÃ¡gina pÃºblica.
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
        </>
      )}
    </div>
  );
}

// ============================================================
//  SECCIÃ“N: SEGURIDAD (Logs)
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
            <ShieldCheck size={22} className="text-rose-500"/> AuditorÃ­a y Logs
          </h2>
          <p className="text-gray-500 text-sm mt-1">Historial de registros de usuarios, accesos y seguridad del sistema</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors">
          <RefreshCw size={15}/> Actualizar
        </button>
      </div>

      {/* Controles de BÃºsqueda y Filtros */}
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
            <option value="robo_imagenes">Robo de ImÃ¡genes</option>
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
              <p className="text-sm">Todo estÃ¡ funcionando correctamente o ajustÃ¡ tus filtros</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredLogs.map((log: any, i: number) => {
                const tipo = log.tipo;
                let title = 'AcciÃ³n del Sistema';
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
                  title = 'Inicio de SesiÃ³n Exitoso';
                  icon = <ShieldCheck size={20}/>;
                  badgeClass = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
                } else if (tipo === 'login_fallido') {
                  title = 'Intento de ConexiÃ³n Fallido';
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

// â”€â”€ SECCIÃ“N: SOPORTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <MessageSquare className="text-rose-500" size={24}/> BuzÃ³n de Sugerencias & Soporte
        </h2>
        <p className="text-gray-500 text-sm mt-1">Gestiona los mensajes, sugerencias y reportes de los usuarios.</p>
      </div>

      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <MessageSquare size={40} className="mb-3 opacity-30"/>
            <p className="font-medium">El buzÃ³n estÃ¡ vacÃ­o</p>
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
