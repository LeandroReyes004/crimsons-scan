'use client';
// v2.0 — Página de configuración de contraseña desde email de invitación

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'invalid';

// useSearchParams requiere Suspense en Next.js App Router
function SetupPasswordContent() {
  const router       = useRouter();
  const params       = useSearchParams();
  const token        = params.get('token');

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [status, setStatus]         = useState<Status>(token ? 'idle' : 'invalid');
  const [message, setMessage]       = useState('');

  useEffect(() => {
    if (!token) setStatus('invalid');
  }, [token]);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Muy corta', 'Aceptable', 'Segura'];
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setMessage('Las contraseñas no coinciden'); return; }
    if (password.length < 6)  { setMessage('Mínimo 6 caracteres');          return; }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${API}/api/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(d.error || 'Ocurrió un error. Pedile al admin que te reenvíe el link.');
        return;
      }

      // Auto-login con el token que devuelve el backend
      if (d.token) {
        localStorage.setItem('crimson_token', d.token);
        localStorage.setItem('crimson_user', JSON.stringify({
          username: d.username,
          rol: 'uploader',
          is_superadmin: false,
        }));
      }

      setStatus('success');
      setMessage(d.message || '¡Contraseña configurada!');
      setTimeout(() => router.push('/'), 2500);

    } catch {
      setStatus('error');
      setMessage('No se pudo conectar con el servidor. Intentá de nuevo.');
    }
  };

  // Token inválido o ausente
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-400"/>
          </div>
          <h1 className="text-white text-xl font-bold">Link inválido</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Este link de configuración no existe o ya fue utilizado. Pedile al admin que te reenvíe la invitación.
          </p>
          <Link href="/" className="text-rose-500 hover:text-rose-400 text-sm font-semibold transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Éxito
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle size={28} className="text-emerald-400"/>
          </div>
          <h1 className="text-white text-xl font-bold">¡Todo listo!</h1>
          <p className="text-gray-400 text-sm">{message}</p>
          <p className="text-gray-500 text-xs">Redirigiendo al inicio...</p>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl max-w-sm w-full p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="CrimsonScan" className="h-10 w-auto object-contain" />
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-rose-500"/>
              <h1 className="text-white text-xl font-bold">Configurar contraseña</h1>
            </div>
            <p className="text-gray-400 text-sm">Elegí una contraseña segura para tu cuenta.</p>
          </div>
        </div>

        {/* Mensaje de error */}
        {message && status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0"/>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
                className="w-full bg-black/30 border border-white/10 px-4 py-3 pr-11 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {/* Barra de fuerza */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strengthColor[strength]}`}
                    style={{ width: `${(strength / 3) * 100}%` }}/>
                </div>
                <span className={`text-[10px] font-semibold ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Confirmar contraseña</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              className={`w-full bg-black/30 border px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition ${
                confirm && confirm !== password ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {confirm && confirm !== password && (
              <p className="text-red-400 text-[11px]">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || password !== confirm || password.length < 6}
            className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {status === 'loading'
              ? <><Loader2 size={16} className="animate-spin"/> Guardando...</>
              : <><ShieldCheck size={16}/> Activar mi cuenta</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    }>
      <SetupPasswordContent />
    </Suspense>
  );
}
