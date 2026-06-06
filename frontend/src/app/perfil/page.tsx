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
  const [uploading, setUploading] = useState(false);
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

      {/* Banner degradado */}
      <div className="h-32 sm:h-40 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${acento}40, ${acento}10, transparent)` }}/>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0c]"/>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20">

        {/* Avatar + nombre */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-8">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#0a0a0c] bg-gradient-to-br from-rose-600/60 to-orange-500/60 flex items-center justify-center shadow-xl"
              style={{ borderColor: acento + '60' }}>
              <img
                key={avatarKey}
                src={avatarUrl}
                alt={perfil.username}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="absolute text-3xl font-black text-white/80 pointer-events-none select-none">
                {perfil.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-[#0a0a0c] border-2 border-white/10 flex items-center justify-center hover:border-rose-500/50 transition"
              title="Cambiar foto"
            >
              {uploading ? <Loader2 size={14} className="animate-spin text-rose-400"/> : <Camera size={14} className="text-gray-300"/>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-white">{perfil.username}</h1>
            <p className="text-gray-400 text-sm">{perfil.email}</p>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1 justify-center sm:justify-start">
              <Calendar size={11}/>
              Miembro desde {new Date(perfil.fecha_registro).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="sm:ml-auto">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
              style={{ background: acento + '20', borderColor: acento + '40', color: acento }}>
              <Shield size={11}/>
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
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-2">
            <Heart size={22} style={{ color: acento }} fill={acento}/>
            <span className="text-2xl font-extrabold text-white">{favCount}</span>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Favoritos</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-2">
            <MessageCircle size={22} className="text-gray-400"/>
            <span className="text-2xl font-extrabold text-white">{perfil.total_comentarios}</span>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Comentarios</span>
          </div>
        </div>

        {/* Color de acento */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ background: acento }}/>
            <p className="text-sm font-bold text-white">Color principal</p>
            {colorSaving && <Loader2 size={13} className="animate-spin text-gray-400 ml-auto"/>}
          </div>
          <p className="text-xs text-gray-500 mb-4">Personaliza el acento de tu perfil</p>
          <div className="flex flex-wrap gap-3">
            {COLORES.map(hex => (
              <button
                key={hex}
                onClick={() => handleColorChange(hex)}
                className="w-9 h-9 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ background: hex }}
                title={hex}
              >
                {perfil.color_acento === hex && <Check size={16} className="text-white drop-shadow"/>}
              </button>
            ))}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={() => { logout(); router.replace('/'); }}
          className="mt-6 w-full py-3 rounded-2xl text-sm font-bold text-gray-500 border border-white/5 hover:bg-white/5 hover:text-red-400 hover:border-red-500/20 transition"
        >
          Cerrar sesión
        </button>

      </div>
    </div>
  );
}
