'use client';

import { useState } from 'react';
import { Upload, Save, Link as LinkIcon, LogOut, CheckCircle, BookOpen, Settings, Users, LayoutDashboard, Plus, Eye, Edit3, Archive, X, TrendingUp, BookMarked, ShieldCheck, UserPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import CreateMangaForm from '@/components/CreateMangaForm';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<'upload' | 'mangas' | 'crew' | 'settings'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Estado de Gestionar Obras ---
  type ObraStatus = 'Activo' | 'Pausado' | 'Completado' | 'Archivado';
  interface Obra {
    id: string;
    title: string;
    cover: string;
    chapters: number;
    views: string;
    status: ObraStatus;
    genre: string;
    description: string;
  }

  const [obras, setObras] = useState<Obra[]>([
    { id: '1', title: 'Solo Leveling: Ragnarok', cover: '/portada.jpg', chapters: 2, views: '125K', status: 'Activo', genre: 'Acción, Fantasía', description: 'El legado continúa. Sung Suho debe despertar sus poderes dormidos.' },
    { id: '2', title: 'Demon Lord Origin', cover: 'https://picsum.photos/300/450?random=10', chapters: 56, views: '89K', status: 'Activo', genre: 'Seinen, Magia', description: 'Una historia épica del origen del señor del mal.' },
    { id: '3', title: 'Isekai Slime', cover: 'https://picsum.photos/300/450?random=11', chapters: 113, views: '210K', status: 'Pausado', genre: 'Isekai', description: 'Reencarnado como una baba en otro mundo.' },
  ]);

  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [showNewObraModal, setShowNewObraModal] = useState(false);
  const [newObra, setNewObra] = useState({ title: '', genre: '', description: '', status: 'Activo' as ObraStatus });

  const saveObraEdit = () => {
    if (!editingObra) return;
    setObras(prev => prev.map(o => o.id === editingObra.id ? editingObra : o));
    setEditingObra(null);
  };

  const archiveObra = (id: string) => {
    setObras(prev => prev.map(o => o.id === id ? { ...o, status: 'Archivado' as ObraStatus } : o));
  };

  const addObra = () => {
    if (!newObra.title) return;
    const obra: Obra = {
      id: Date.now().toString(),
      title: newObra.title,
      cover: `https://picsum.photos/300/450?random=${Date.now()}`,
      chapters: 0,
      views: '0',
      status: newObra.status,
      genre: newObra.genre,
      description: newObra.description,
    };
    setObras(prev => [...prev, obra]);
    setShowNewObraModal(false);
    setNewObra({ title: '', genre: '', description: '', status: 'Activo' });
  };

  // --- Estado Staff/Crew ---
  const STAFF_USERS = [
    { id: '1', name: 'Kaiser', role: 'Admin', avatar: '👑', password: 'crimson2024' },
    { id: '2', name: 'Alex_Clean', role: 'Cleaner', avatar: '🧼', password: 'clean123' },
    { id: '3', name: 'TyperPro', role: 'Typer', avatar: '✍️', password: 'type456' },
  ];
  const [loggedStaff, setLoggedStaff] = useState<typeof STAFF_USERS[0] | null>(null);
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleStaffLogin = () => {
    const user = STAFF_USERS.find(u => u.name.toLowerCase() === loginForm.name.toLowerCase() && u.password === loginForm.password);
    if (user) {
      setLoggedStaff(user);
      setLoginError(null);
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    
    // Recolectar datos del formulario
    const form = e.currentTarget;
    const mangaName = (form.elements.namedItem('mangaName') as HTMLSelectElement).value;
    const chapterNum = (form.elements.namedItem('chapterNum') as HTMLInputElement).value;
    const webhookUrl = (form.elements.namedItem('webhookUrl') as HTMLInputElement).value;
    const files = (form.elements.namedItem('images') as HTMLInputElement).files;

    if (!files || files.length === 0) {
      setError('Debes seleccionar al menos una imagen plana (RAW).');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('mangaName', mangaName);
    formData.append('chapterNum', chapterNum);
    formData.append('webhookUrl', webhookUrl);
    
    // Adjuntar todas las imágenes
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    try {
      const res = await fetch('http://localhost:3001/api/admin/upload-chapter', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Fallo en la subida al servidor central.');
      
      setSuccess(`¡Capítulo ofuscado y publicado exitosamente! (${data.pages_processed} pags). Discord notificado.`);
      setTimeout(() => setSuccess(null), 8000);
      form.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-[#050505] text-slate-900 dark:text-gray-200 selection:bg-rose-600/30 font-sans">
      
      {/* Sidebar Fijo Lateral */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#0a0a0c] border-r border-gray-200 dark:border-white/5 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo / Título */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 dark:border-white/5">
            <div className="bg-rose-600 p-1.5 rounded-lg text-white shadow-lg shadow-rose-600/20">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight dark:text-white">Admin Hub</h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Crimson's Scan</p>
            </div>
          </div>

          {/* Menú de Secciones */}
          <nav className="p-4 flex flex-col gap-2 mt-4">
            <button 
              onClick={() => setActiveSection('upload')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'upload' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
            >
              <Upload size={18} /> Subir Capítulo
            </button>
            <button 
              onClick={() => setActiveSection('mangas')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'mangas' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
            >
              <BookOpen size={18} /> Gestionar Obras
            </button>
            <button 
              onClick={() => setActiveSection('crew')}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'crew' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
            >
              <Users size={18} /> Staff (Crew)
            </button>
          </nav>
        </div>

        {/* Zona Inferior del Sidebar */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => setActiveSection('settings')}
             className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === 'settings' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            <Settings size={18} /> Ajustes & Discord
          </button>
          <Link href="/" className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
            <LogOut size={18} /> Volver a la Web
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar para móviles y Tema */}
        <header className="h-16 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex md:hidden items-center gap-2">
            <div className="bg-rose-600 p-1.5 rounded-lg text-white">
              <LayoutDashboard size={16} />
            </div>
            <span className="font-bold dark:text-white">Admin Hub</span>
          </div>
          <div className="hidden md:block">
            {/* Espacio reservado para breadcrumbs si queremos en el futuro */}
            <span className="text-sm font-bold text-gray-400">Crimson's Scan Workspace</span>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Zona Dinámica (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          
          {activeSection === 'upload' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8">
                <h2 className="text-3xl font-extrabold dark:text-white mb-2">Central de Carga Rápida</h2>
                <p className="text-gray-500 dark:text-gray-400">Selecciona imágenes. El sistema hará "Scrambling" (División criptográfica) y enviará una alerta a Discord.</p>
              </header>

              {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-bold animate-in zoom-in-95 duration-300">
                  <CheckCircle size={20} className="shrink-0" />
                  {success}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 font-bold animate-in zoom-in-95 duration-300">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-white dark:bg-[#121215] border border-gray-200 dark:border-white/10 p-6 md:p-10 rounded-3xl shadow-xl">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block tracking-wider">OBRA (MANGA/MANHWA)</label>
                    <select name="mangaName" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white transition-colors">
                      <option>Solo Leveling: Ragnarok</option>
                      <option>Demon Lord Origin</option>
                      <option>Isekai Slime</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block tracking-wider">NÚMERO DE CAPÍTULO</label>
                    <input name="chapterNum" type="number" placeholder="Ej: 25" required className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white transition-colors" />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block tracking-wider">ENLACE ALCANZADO (Opcional)</label>
                  <div className="relative">
                    <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input name="webhookUrl" type="url" placeholder="https://discord.com/api/webhooks/..." className="w-full pl-12 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white transition-colors text-sm" />
                  </div>
                </div>

                <div className="relative border-2 border-dashed border-gray-300 dark:border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 bg-gray-50/50 dark:bg-white/5 mt-2 hover:border-rose-500 transition-colors cursor-pointer group mb-10 overflow-hidden">
                  <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-500 p-4 rounded-full group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Upload size={32} strokeWidth={2.5} />
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200 text-center">
                    Arrastra todas las imágenes aquí
                  </p>
                  <p className="text-sm text-gray-500">
                    Soporta imágenes JPG / PNG directamente (El backend hace el procesado)
                  </p>
                  <input name="images" type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-extrabold text-lg py-5 rounded-2xl transition-all shadow-[0_15px_30px_rgba(225,29,72,0.3)] hover:shadow-[0_20px_40px_rgba(225,29,72,0.4)] hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                  {isUploading ? (
                    <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> Procesando Imágenes...</>
                  ) : (
                    <><Save size={24} /> Ofuscar e Iniciar Publicación 🔥</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ===================== GESTIONAR OBRAS ===================== */}
          {activeSection === 'mangas' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold dark:text-white mb-1">Gestionar Obras</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Administra el catálogo completo de mangas/manhwas del grupo.</p>
                </div>
                <button onClick={() => setShowNewObraModal(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5">
                  <Plus size={18} /> Nueva Obra
                </button>
              </div>

              {/* Stats Rápidas */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Obras Activas', value: obras.filter(o => o.status === 'Activo').length, icon: <BookMarked size={20}/>, color: 'text-rose-500' },
                  { label: 'Total Capítulos', value: obras.reduce((a, o) => a + o.chapters, 0), icon: <BookOpen size={20}/>, color: 'text-blue-500' },
                  { label: 'Visitas Totales', value: '424K', icon: <TrendingUp size={20}/>, color: 'text-emerald-500' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white dark:bg-[#121215] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                    <div className="text-2xl font-extrabold dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Grid de Obras */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {obras.map(obra => (
                  <div key={obra.id} className="bg-white dark:bg-[#121215] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <img src={obra.cover} alt={obra.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                        obra.status === 'Activo' ? 'bg-emerald-500 text-white' :
                        obra.status === 'Pausado' ? 'bg-amber-500 text-white' :
                        obra.status === 'Archivado' ? 'bg-gray-600 text-white' : 'bg-blue-500 text-white'
                      }`}>{obra.status}</span>
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-bold text-sm leading-tight line-clamp-1">{obra.title}</p>
                        <p className="text-gray-300 text-xs">{obra.genre}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <BookOpen size={14}/> <span className="font-semibold">{obra.chapters} caps</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Eye size={14}/> <span className="font-semibold">{obra.views} vistas</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingObra({...obra})} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 py-2.5 rounded-xl transition-all">
                          <Edit3 size={15}/> Editar
                        </button>
                        {obra.status !== 'Archivado' ? (
                          <button onClick={() => archiveObra(obra.id)} title="Archivar obra" className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-sm font-semibold transition-all">
                            <Archive size={15}/> Archivar
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 text-xs font-semibold">
                            Archivado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== STAFF / CREW ===================== */}
          {activeSection === 'crew' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
              {!loggedStaff ? (
                // Pantalla de Inicio de Sesión
                <div className="flex flex-col items-center pt-12">
                  <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-500 p-4 rounded-2xl mb-6">
                    <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-3xl font-extrabold dark:text-white mb-2">Acceso del Staff</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-10 text-center max-w-sm">Ingresa tus credenciales de miembro del equipo de Crimson's Scan para acceder.</p>

                  <div className="bg-white dark:bg-[#121215] border border-gray-200 dark:border-white/10 rounded-3xl p-8 w-full shadow-xl">
                    {loginError && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold">
                        ⚠️ {loginError}
                      </div>
                    )}
                    <div className="flex flex-col gap-4 mb-6">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block tracking-wider">NOMBRE DE USUARIO</label>
                        <input
                          value={loginForm.name}
                          onChange={e => setLoginForm({...loginForm, name: e.target.value})}
                          placeholder="Ej: Kaiser"
                          className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block tracking-wider">CONTRASEÑA</label>
                        <input
                          type="password"
                          value={loginForm.password}
                          onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                          placeholder="••••••••"
                          onKeyDown={e => e.key === 'Enter' && handleStaffLogin()}
                          className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-4 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm"
                        />
                      </div>
                    </div>
                    <button onClick={handleStaffLogin} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
                      <ShieldCheck size={18}/> Iniciar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                // Panel del Staff Logueado
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-extrabold dark:text-white mb-1">Staff del Equipo</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Gestiona los miembros activos de Crimson's Scan.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold dark:text-white">{loggedStaff.avatar} {loggedStaff.name}</p>
                        <p className="text-xs text-rose-500 font-semibold">{loggedStaff.role}</p>
                      </div>
                      <button onClick={() => setLoggedStaff(null)} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-rose-500 transition-colors">
                        <LogOut size={16}/>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Staff */}
                  <div className="flex flex-col gap-3 mb-8">
                    {STAFF_USERS.map(u => (
                      <div key={u.id} className="bg-white dark:bg-[#121215] border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-xl">{u.avatar}</div>
                          <div>
                            <p className="font-bold dark:text-white">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.role}</p>
                          </div>
                        </div>
                        {loggedStaff.role === 'Admin' && u.id !== loggedStaff.id && (
                          <button className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                            <Trash2 size={14}/> Remover
                          </button>
                        )}
                        {u.id === loggedStaff.id && <span className="text-xs bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-2 py-1 rounded-md">Tú</span>}
                      </div>
                    ))}
                  </div>

                  {/* Agregar Miembro (Solo Admin) */}
                  {loggedStaff.role === 'Admin' && (
                    <div className="bg-white dark:bg-[#121215] border border-dashed border-gray-300 dark:border-white/10 rounded-2xl p-6">
                      <h4 className="font-bold dark:text-white mb-4 flex items-center gap-2"><UserPlus size={18} className="text-rose-500"/> Añadir Nuevo Miembro</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Nombre de usuario" className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-3 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm" />
                        <select className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-3 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm">
                          <option>Cleaner</option><option>Typer</option><option>QA</option><option>Translator</option>
                        </select>
                        <input type="password" placeholder="Contraseña inicial" className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-3 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm" />
                        <button className="bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                          <UserPlus size={15}/> Registrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sección Ajustes */}
          {activeSection === 'settings' && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 animate-in fade-in duration-500 pt-24">
              <Settings size={64} className="text-gray-300 dark:text-white/10 mb-4" />
              <h3 className="text-2xl font-bold dark:text-gray-400">Sección en Construcción</h3>
              <p className="text-gray-500">Esta herramienta estará disponible próximamente.</p>
            </div>
          )}

        </main>
      </div>

      {/* ===== PANEL EDITOR LATERAL (Slide-in) ===== */}
      {editingObra && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingObra(null)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#121215] border-l border-gray-200 dark:border-white/10 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-xl font-bold dark:text-white">Editar Obra</h3>
              <button onClick={() => setEditingObra(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5 flex-1">
              <div className="relative h-44 rounded-2xl overflow-hidden group cursor-pointer">
                <img src={editingObra.cover} className="w-full h-full object-cover" alt="portada" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Cambiar Portada</span>
                </div>
              </div>
              {[{ label: 'Nombre de la Obra', key: 'title' }, { label: 'Géneros', key: 'genre' }].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block tracking-wider">{field.label.toUpperCase()}</label>
                  <input
                    value={(editingObra as any)[field.key]}
                    onChange={e => setEditingObra({...editingObra, [field.key]: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-3.5 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block tracking-wider">ESTADO</label>
                <select value={editingObra.status} onChange={e => setEditingObra({...editingObra, status: e.target.value as any})} className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-3.5 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm">
                  <option>Activo</option><option>Pausado</option><option>Completado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block tracking-wider">SINOPSIS</label>
                <textarea value={editingObra.description} onChange={e => setEditingObra({...editingObra, description: e.target.value})} rows={4} className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 p-3.5 rounded-xl focus:border-rose-500 focus:outline-none dark:text-white text-sm resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-white/10">
              <button onClick={saveObraEdit} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <Save size={18}/> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL NUEVA OBRA ===== */}
      {showNewObraModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto w-full h-full">
          <div className="relative w-full max-w-5xl mt-auto mb-auto animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowNewObraModal(false)} 
              className="absolute top-6 right-6 z-50 p-2 bg-gray-100 dark:bg-black/50 rounded-full hover:bg-rose-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
            >
              <X size={20}/>
            </button>
            <CreateMangaForm />
          </div>
        </div>
      )}
    </div>
  );
}
