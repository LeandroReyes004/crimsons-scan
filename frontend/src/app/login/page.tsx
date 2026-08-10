'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    setLoginLoading(true);
    try {
      await login(loginUser, loginPass);
      // Redirigir al inicio o recargar para que TopNav vea el usuario
      window.location.href = '/';
    } catch (err: any) {
      setLoginErr(err.message || 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className="bg-white dark:bg-[#111114] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-white/10">
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Iniciar sesión</h2>
        <p className="text-sm text-gray-500 mb-5">Ingresá con tu cuenta de Crimson Scan</p>
        
        {loginErr && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/10 text-red-500">{loginErr}</div>
        )}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            value={loginUser} 
            onChange={e => setLoginUser(e.target.value)} 
            required
            placeholder="Usuario" 
            autoComplete="username"
            className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm text-gray-900 dark:text-white focus:border-rose-500 outline-none transition"
          />
          <input
            type="password" 
            value={loginPass} 
            onChange={e => setLoginPass(e.target.value)} 
            required
            placeholder="Contraseña" 
            autoComplete="current-password"
            className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm text-gray-900 dark:text-white focus:border-rose-500 outline-none transition"
          />
          <div className="flex gap-2 mt-1">
            <button 
              type="submit" 
              disabled={loginLoading}
              className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition"
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </button>
            <Link 
              href="/"
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition text-center flex items-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
