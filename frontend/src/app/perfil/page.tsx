'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Camera, Check, Loader2, MessageCircle, Heart, User, Calendar, Shield } from 'lucide-react';
import { getUser, getToken, authHeaders, logout } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

const COLORES = [
  '#e11d48', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const ROL_LABEL: Record<string, string> = {
  lector: 'Usuario', uploader: 'Uploader', admin: 'Admin',
  admin_scan: 'Admin Scan', soporte: 'Soporte',
};

interface Perfil {
  id: string; username: string; email: string; rol: string; avatar_url: string | null;
  color_acento: string | null; fecha_registro: string; is_superadmin: number;
  scan_id: string | null; total_comentarios: number;
}

export default function PerfilPage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [perfil, setPerfil]       = useState<Perfil | null>(null);
  const [loading, setLoading]     = useState(true);
  const [avatarKey, setAvatarKey] = useState(0); // force re-render de imagen
  const [uploading, setUploading]   = useState(false);
  const [imgLoaded, setImgLoaded]   = useState(false);
  const [colorSaving, setColorSaving] = useState(false);
  const [msg, setMsg]             = useState('');
  const [favCount, setFavCount]   = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/'); return; }
    fetch(`${API}/api/auth/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.id) setPerfil(d); else router.replace('/'); })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
    // favoritos de localStorage
    try {
      const favs = JSON.parse(localStorage.getItem('crimson_favorites') || '[]');
      setFavCount(Array.isArray(favs) ? favs.length : 0);
    } catch {}
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMsg('❌ La imagen debe pesar menos de 2MB'); return; }
    setUploading(true); setMsg('');
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await fetch(`${API}/api/upload/avatar`, { method: 'POST', headers: authHeaders(), body: fd });
      const d   = await res.json();
      if (!res.ok) throw new Error(d.error);
      setImgLoaded(false); // resetea para que cargue la nueva
      setAvatarKey(k => k + 1);
      setMsg('✅ Avatar actualizado');
      // actualizar localStorage
      const stored = localStorage.getItem('crimson_user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('crimson_user', JSON.stringify({ ...u, avatar_url: d.avatar_url }));
      }
    } catch (err: any) { setMsg(`❌ ${err.message}`); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleColorChange = async (hex: string) => {
    setColorSaving(true); setMsg('');
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'PUT', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ color_acento: hex }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setPerfil(p => p ? { ...p, color_acento: hex } : p);
      setMsg('✅ Color guardado');
    } catch (err: any) { setMsg(`❌ ${err.message}`); }
    finally { setColorSaving(false); }
  };

  const avatarUrl = perfil ? `${API}/api/avatar/${perfil.id}?v=${avatarKey}` : '';
  const acento    = perfil?.color_acento || '#e11d48';

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans pb-20">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-white/5 h-14 px-4 sm:px-6 flex items-center gap-3">
        <Link href="/" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
          <ChevronLeft size={20}/>
        </Link>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center text-white font-black text-xs">CS</div>
        <span className="font-bold text-white/90">Mi Perfil</span>
      </header>

      {/* Banner con color de acento visible */}
      <div className="h-36 sm:h-44 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${acento}cc 0%, ${acento}55 50%, transparent 100%)` }}/>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, #0a0a0c 100%)' }}/>
        {/* Círculo decorativo */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-20" style={{ background: acento }}/>
        <div className="absolute right-20 top-4 w-24 h-24 rounded-full opacity-10" style={{ background: acento }}/>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 relative z-10">

        {/* Avatar + info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-8">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden flex items-center justify-center shadow-2xl relative"
              style={{ border: `4px solid ${acento}`, background: `linear-gradient(135deg, ${acento}99, ${acento}44)` }}>
              {!imgLoaded && (
                <span className="text-4xl font-black text-white/90 select-none">
                  {perfil.username.charAt(0).toUpperCase()}
                </span>
              )}
              <img key={avatarKey} src={avatarUrl} alt={perfil.username}
                className="w-full h-full object-cover absolute inset-0"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgLoaded(false)}/>
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#111115] flex items-center justify-center transition shadow-lg"
              style={{ border: `2px solid ${acento}80` }} title="Cambiar foto">
              {uploading ? <Loader2 size={15} className="animate-spin" style={{ color: acento }}/> : <Camera size={15} style={{ color: acento }}/>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
          </div>

          {/* Datos */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{perfil.username}</h1>
            <p className="text-gray-400 text-sm mt-0.5">{perfil.email}</p>
            <p className="text-gray-500 text-xs mt-1.5 flex items-center gap-1 justify-center sm:justify-start">
              <Calendar size={11}/>
              Miembro desde {new Date(perfil.fecha_registro).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mt-2"
              style={{ background: acento + '25', border: `1px solid ${acento}50`, color: acento }}>
              <Shield size={10}/>
              {perfil.is_superadmin ? 'SuperAdmin' : ROL_LABEL[perfil.rol] || perfil.rol}
            </span>
          </div>
        </div>

        {/* Feedback */}
        {msg && (
          <div className={`mb-5 p-3 rounded-xl text-sm font-medium ${msg.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {msg}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl p-5 flex flex-col items-center gap-2"
            style={{ background: acento + '12', border: `1px solid ${acento}30` }}>
            <Heart size={24} fill={acento} style={{ color: acento }}/>
            <span className="text-3xl font-extrabold text-white">{favCount}</span>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: acento + 'cc' }}>Favoritos</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-2">
            <MessageCircle size={24} style={{ color: acento }}/>
            <span className="text-3xl font-extrabold text-white">{perfil.total_comentarios}</span>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Comentarios</span>
          </div>
        </div>

        {/* Color principal */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: '#111115', border: `1px solid ${acento}30` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ background: acento, boxShadow: `0 0 8px ${acento}80` }}/>
              <p className="text-sm font-bold text-white">Color principal</p>
            </div>
            {colorSaving && <Loader2 size={13} className="animate-spin" style={{ color: acento }}/>}
          </div>
          <p className="text-xs text-gray-600 mb-4">Se aplica en tu perfil y comentarios</p>
          <div className="flex flex-wrap gap-3">
            {COLORES.map(hex => (
              <button key={hex} onClick={() => handleColorChange(hex)}
                className="w-10 h-10 rounded-full transition-all hover:scale-110 flex items-center justify-center shadow-md"
                style={{ background: hex, boxShadow: perfil.color_acento === hex ? `0 0 0 3px #0a0a0c, 0 0 0 5px ${hex}` : undefined }}>
                {perfil.color_acento === hex && <Check size={17} className="text-white drop-shadow-lg font-black"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button onClick={() => { logout(); router.replace('/'); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold transition border"
          style={{ borderColor: acento + '30', color: acento + 'aa' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = acento + '15'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          Cerrar sesión
        </button>

      </div>
    </div>
  );
}
