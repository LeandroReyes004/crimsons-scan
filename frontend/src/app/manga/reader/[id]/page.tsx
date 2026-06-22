'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Play, Eye, Tag, Clock, Heart, LogIn, LogOut, User, Send, MessageCircle, Layers } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';
import { getUser, login, logout, authHeaders } from '@/lib/auth';
import AdPopUnder from '@/components/AdPopUnder';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Manga {
  id: string; slug?: string | null; titulo: string; titulo_alt: string | null; descripcion: string | null;
  generos: string; tipo: string; estado: string; cover_r2_key: string | null; views_total: number;
  es_adulto?: number | boolean; scan_id?: string | null; scan_nombre?: string | null; scan_slug?: string | null;
}
interface Capitulo {
  id: string; numero: number; titulo: string | null; views: number; fecha_subida: string;
  joint_scan_nombre?: string | null; joint_scan_slug?: string | null;
}

export default function MangaDetailPage() {
  const { id } = useParams() as { id: string };

  const [manga, setManga]         = useState<Manga | null>(null);
  const [caps, setCaps]           = useState<Capitulo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastChapterId, setLast]  = useState<string | null>(null);
  const { isFav, toggle }         = useFavorites();

  // Auth
  const [user, setUser]           = useState<ReturnType<typeof getUser>>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Comentarios
  interface Comentario { id: string; usuario_id: string; username: string; contenido: string; fecha: string; }
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComent, setNuevoComent] = useState('');
  const [enviando, setEnviando]       = useState(false);
  const [comentErr, setComentErr]     = useState('');

  useEffect(() => { setUser(getUser()); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(''); setLoginLoading(true);
    try {
      const u = await login(loginUser, loginPass);
      setUser(u); setLoginOpen(false); setLoginUser(''); setLoginPass('');
    } catch (err: any) { setLoginErr(err.message || 'Error al iniciar sesión'); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => { logout(); setUser(null); };

  const fetchComentarios = () => {
    if (!id) return;
    fetch(`${API}/api/mangas/${id}/comentarios`)
      .then(r => r.json())
      .then(d => setComentarios(d.comentarios || []))
      .catch(() => {});
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComent.trim()) return;
    setEnviando(true); setComentErr('');
    try {
      const res = await fetch(`${API}/api/mangas/${id}/comentarios`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: nuevoComent }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setComentarios(prev => [d, ...prev]);
      setNuevoComent('');
    } catch (err: any) { setComentErr(err.message); }
    finally { setEnviando(false); }
  };

  useEffect(() => {
    const saved = localStorage.getItem(`crimson_last_${id}`);
    if (saved) setLast(saved);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/mangas/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setManga(d.manga);
        setCaps(d.capitulos || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    fetchComentarios();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error || !manga) return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-gray-400">
      <BookOpen size={48} className="opacity-30"/>
      <p className="font-medium">{error || 'Manga no encontrado'}</p>
      <Link href="/" className="text-rose-500 hover:underline text-sm">Volver al inicio</Link>
    </div>
  );

  let generos: string[] = [];
  try { generos = JSON.parse(manga.generos || '[]'); } catch {}

  const estadoColor: Record<string, string> = {
    en_curso:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pausado:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  const estadoLabel: Record<string, string> = { en_curso: 'En curso', completado: 'Completado', pausado: 'Pausado' };

  const coverUrl = manga.cover_r2_key
    ? `${API}/api/cover/${manga.id}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans">
      {!!manga.es_adulto && <AdPopUnder />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-4 sm:px-6 flex items-center gap-3">
        <Link href="/" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
          <ChevronLeft size={20}/>
        </Link>
        <img src="/logo.png" alt="CrimsonScan" className="h-8 w-auto object-contain" />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/perfil" className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/5 transition">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-rose-600/60 to-orange-500/60 flex items-center justify-center relative shrink-0">
                  <img src={`${API}/api/avatar/${user.id}`} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display='none'; }}/>
                  <span className="absolute text-[10px] font-black text-white">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden sm:block text-xs font-semibold text-gray-300">{user.username}</span>
              </Link>
              <button onClick={handleLogout} className="p-1.5 rounded-full text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Cerrar sesión">
                <LogOut size={15}/>
              </button>
            </>
          ) : (
            <button onClick={() => setLoginOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition px-3 py-1.5 rounded-full">
              <LogIn size={12}/> Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {/* Fondo degradado superior */}
      <div className="h-36 sm:h-48 bg-gradient-to-b from-rose-900/25 via-rose-900/10 to-transparent pointer-events-none"/>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-28 sm:-mt-40 pb-20">

        {/* Info del manga */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">

          {/* Portada */}
          <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 aspect-[3/4] bg-gradient-to-br from-rose-900/40 to-gray-900 flex items-center justify-center">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={manga.titulo}
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <BookOpen size={40} className="text-gray-600"/>
              )}
            </div>
          </div>

          {/* Datos */}
          <div className="flex-1 flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${estadoColor[manga.estado] || estadoColor.pausado}`}>
                {estadoLabel[manga.estado] || manga.estado}
              </span>
              <span className="text-xs text-gray-500 capitalize">{manga.tipo}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{manga.titulo}</h1>
            {manga.titulo_alt && <p className="text-gray-400 text-sm">{manga.titulo_alt}</p>}

            {manga.descripcion && (
              <p className="text-gray-300 text-sm leading-relaxed">{manga.descripcion}</p>
            )}

            {generos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {generos.map(g => (
                  <span key={g} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                    <Tag size={9}/> {g}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5"><Eye size={13}/> {manga.views_total.toLocaleString()} vistas</span>
              <span className="flex items-center gap-1.5"><BookOpen size={13}/> {caps.length} caps</span>
              {manga.scan_id && manga.scan_nombre && (
                <Link href={`/scan/${manga.scan_slug ?? manga.scan_id}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition text-xs font-semibold">
                  <Layers size={11}/> {manga.scan_nombre}
                </Link>
              )}
            </div>

            {caps.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-1">
                {/* Continuar leyendo */}
                {lastChapterId && caps.some(c => c.id === lastChapterId) ? (
                  <Link href={`/manga/reader/${id}/chapter/${lastChapterId}`}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/30 text-sm active:scale-95">
                    <Play size={14} fill="white"/> Continuar
                  </Link>
                ) : (
                  <Link href={`/manga/reader/${id}/chapter/${caps[caps.length - 1].id}`}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-rose-600/30 text-sm active:scale-95">
                    <Play size={14} fill="white"/> Leer desde inicio
                  </Link>
                )}
                {caps.length > 1 && (
                  <Link href={`/manga/reader/${id}/chapter/${caps[0].id}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-2.5 rounded-xl transition border border-white/10 text-sm active:scale-95">
                    Último cap.
                  </Link>
                )}
                {/* Favorito */}
                <button
                  onClick={() => toggle(id)}
                  className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl transition border text-sm active:scale-95 ${
                    isFav(id)
                      ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-rose-500/40 hover:text-rose-400'
                  }`}
                >
                  <Heart size={14} fill={isFav(id) ? 'currentColor' : 'none'}/>
                  {isFav(id) ? 'En favoritos' : 'Favorito'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista capítulos */}
        <div>
          <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-5 bg-rose-500 rounded-full shrink-0"/>
            Capítulos ({caps.length})
          </h2>

          {caps.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-10 flex flex-col items-center text-gray-500 border border-white/5">
              <Clock size={28} className="mb-3 opacity-40"/>
              <p className="font-medium text-sm">Aún no hay capítulos publicados</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {caps.map(cap => (
                <Link key={cap.id} href={`/manga/reader/${id}/chapter/${cap.id}`}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-rose-500/30 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 transition group">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-rose-500 group-hover:text-white transition">
                      {cap.numero}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-white/90 group-hover:text-white flex flex-wrap items-center gap-2">
                        <span>Capítulo {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}</span>
                        {cap.joint_scan_nombre && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">
                            🤝 Joint con {cap.joint_scan_nombre}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(() => { try { return new Date(cap.fecha_subida).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' }); } catch { return cap.fecha_subida?.slice(0, 10) ?? ''; } })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 shrink-0">
                    <span className="text-xs flex items-center gap-1"><Eye size={11}/>{cap.views}</span>
                    <Play size={14} className="opacity-0 group-hover:opacity-100 text-rose-400 transition"/>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Comentarios */}
        <div className="mt-10">
          <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-3">
            <span className="w-1 h-5 bg-rose-500 rounded-full shrink-0"/>
            <MessageCircle size={18} className="text-rose-400"/>
            Comentarios {comentarios.length > 0 && <span className="text-sm font-normal text-gray-500">({comentarios.length})</span>}
          </h2>

          {/* Formulario */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    value={nuevoComent}
                    onChange={e => setNuevoComent(e.target.value)}
                    placeholder="Escribí tu comentario..."
                    maxLength={500}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 focus:border-rose-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none transition"
                  />
                  {comentErr && <p className="text-xs text-red-400">{comentErr}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{nuevoComent.length}/500</span>
                    <button type="submit" disabled={enviando || !nuevoComent.trim()}
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
                      <Send size={12}/> {enviando ? 'Enviando...' : 'Comentar'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-400">Iniciá sesión para dejar un comentario</p>
              <button onClick={() => setLoginOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 px-3 py-2 rounded-xl transition shrink-0">
                <LogIn size={12}/> Iniciar sesión
              </button>
            </div>
          )}

          {/* Lista comentarios */}
          {comentarios.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">
              <MessageCircle size={28} className="mx-auto mb-2 opacity-30"/>
              Sé el primero en comentar
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comentarios.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-rose-600/60 to-orange-500/60 flex items-center justify-center text-white font-bold text-xs shrink-0 relative">
                    <img src={`${API}/api/avatar/${c.usuario_id}`} alt="" className="w-full h-full object-cover absolute inset-0" onError={e => { e.currentTarget.style.display='none'; }}/>
                    <span className="relative">{c.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-rose-400">{c.username}</span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(c.fecha).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{c.contenido}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal login */}
      {loginOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setLoginOpen(false); }}>
          <div className="bg-[#111114] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <h2 className="text-lg font-extrabold text-white mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mb-5">Ingresá con tu cuenta de Crimson Scan</p>
            {loginErr && <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/10 text-red-400">{loginErr}</div>}
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input value={loginUser} onChange={e => setLoginUser(e.target.value)} required placeholder="Usuario" autoComplete="username"
                className="bg-black/30 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white focus:border-rose-500 outline-none transition"/>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required placeholder="Contraseña" autoComplete="current-password"
                className="bg-black/30 border border-white/10 px-3 py-2.5 rounded-xl text-sm text-white focus:border-rose-500 outline-none transition"/>
              <div className="flex gap-2 mt-1">
                <button type="submit" disabled={loginLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition">
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </button>
                <button type="button" onClick={() => setLoginOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white/5 transition">
                  Cancelar
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-3">
                ¿No tenés cuenta?{' '}
                <Link href="/register" className="text-rose-500 font-bold hover:underline">
                  Registrate
                </Link>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
