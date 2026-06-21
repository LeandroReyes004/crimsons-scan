'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { setToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!aceptaTerminos) {
      setError('Debes aceptar el Reglamento y las Políticas de Privacidad.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          display_name: displayName, 
          email, 
          password, 
          fecha_nacimiento: fechaNacimiento 
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      // Guardar token y redirigir
      if (data.token) {
        setToken(data.token, data.user);
        router.push('/');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <img src="/logo.png" alt="CrimsonScan" className="h-12 w-auto object-contain" />
          <div className="text-center">
            <h1 className="font-extrabold text-2xl text-white tracking-tight">Crear Cuenta</h1>
            <p className="text-gray-400 text-sm mt-1">Unite a la comunidad de Crimson's Scan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111114] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Usuario (Login) *</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="manga_fan99"
                required
                pattern="^[a-zA-Z0-9_-]{3,20}$"
                title="Solo letras, números, guiones y sin espacios. Min 3 caracteres."
                className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Apodo (Visible)</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Manga Fan 99"
                className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contraseña *</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha de Nacimiento *</label>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={e => setFechaNacimiento(e.target.value)}
              required
              max={new Date().toISOString().split("T")[0]}
              className="bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-white text-sm focus:border-rose-500 outline-none transition [color-scheme:dark]"
            />
            <p className="text-[10px] text-gray-500">Requerido para acceder a contenido +18.</p>
          </div>

          <div className="flex items-start gap-2.5 my-1">
            <input
              type="checkbox"
              id="acepta-terminos"
              checked={aceptaTerminos}
              onChange={e => setAceptaTerminos(e.target.checked)}
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-white/10 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-500"
            />
            <label htmlFor="acepta-terminos" className="text-xs text-gray-400 leading-relaxed cursor-pointer select-none">
              Acepto el <Link href="/reglamento" target="_blank" className="text-rose-500 font-bold hover:underline">Reglamento y Políticas de Privacidad</Link> de Scan Crimson.
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {loading ? <Loader2 size={18} className="animate-spin"/> : null}
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-2">
          <p className="text-gray-500 text-sm">
            ¿Ya tenés cuenta?{' '}
            <Link href="/admin" className="text-rose-500 font-bold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
