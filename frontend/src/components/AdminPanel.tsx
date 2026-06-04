'use client';

import { useState, useEffect } from 'react';
import { Upload, LogIn, LogOut, Loader2, Key } from 'lucide-react';
import { login, logout, getUser, authHeaders, type CrimsonUser } from '@/lib/auth';

export default function AdminPanel() {
  const [user, setUser]             = useState<CrimsonUser | null>(null);
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError]   = useState('');

  const [mangaId, setMangaId]           = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [files, setFiles]               = useState<FileList | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const u = await login(username, password);
      setUser(u);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0 || !mangaId || !chapterNumber) return;

    setUploadLoading(true);
    setUploadStatus(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

    try {
      let uploaded = 0;
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('capitulo_id', mangaId);
        formData.append('numero', String(i + 1));
        formData.append('image', files[i]);

        const res = await fetch(`${API_URL}/api/upload/page`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        });

        if (res.ok) {
          uploaded++;
        } else {
          const d = await res.json();
          errors.push(d.error || `Error en imagen ${i + 1}`);
        }
      }

      if (errors.length === 0) {
        setUploadStatus(`✅ ${uploaded} páginas subidas exitosamente.`);
      } else {
        setUploadStatus(`⚠️ ${uploaded} ok, ${errors.length} errores: ${errors.join(', ')}`);
      }
      setFiles(null);
      setChapterNumber('');
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white/5 dark:bg-black/20 border-b border-gray-200 dark:border-white/5 py-3 px-6 w-full flex justify-end items-center">
        <form onSubmit={handleLogin} className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">
            <Key size={14}/> Acceso Miembros
          </span>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-[#0a0a0c] border border-gray-300 dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-[#0a0a0c] border border-gray-300 dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
            required
          />
          <button
            type="submit"
            disabled={authLoading}
            className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-colors"
          >
            {authLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Entrar
          </button>
          {authError && <span className="text-red-500 text-xs">{authError}</span>}
        </form>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900/50 p-6 w-full shadow-inner relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-rose-200 dark:border-rose-900/50 pb-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Upload size={22}/> Panel de Subida (Scan)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conectado como <strong>{user.username}</strong> · {user.rol}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-rose-500 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <LogOut size={16}/> Cerrar Sesión
          </button>
        </div>

        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              ID del Capítulo
            </label>
            <input
              type="text"
              value={mangaId}
              onChange={(e) => setMangaId(e.target.value)}
              placeholder="UUID del capítulo"
              className="px-3 py-2 bg-white dark:bg-[#0a0a0c] border border-gray-300 dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm"
              required
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              Número de Capítulo
            </label>
            <input
              type="number"
              step="0.1"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#0a0a0c] border border-gray-300 dark:border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            />
          </div>
          <div className="flex flex-col gap-1 flex-[2]">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
              Páginas (Imágenes)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 dark:file:bg-rose-900/30 dark:file:text-rose-400 cursor-pointer"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploadLoading || !files}
            className="bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white px-6 py-2 rounded-md font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
          >
            {uploadLoading ? <Loader2 size={18} className="animate-spin"/> : <Upload size={18}/>}
            {uploadLoading ? 'Subiendo...' : 'Publicar Capítulo'}
          </button>
        </form>

        {uploadStatus && (
          <div className={`p-3 rounded-md text-sm font-medium ${
            uploadStatus.includes('Error') || uploadStatus.includes('⚠️')
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
}
