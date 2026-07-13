'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, X, Send, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { getUser } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function Footer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('sugerencia');
  const [mensaje, setMensaje] = useState('');
  const [contacto, setContacto] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/uploader')) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = getUser();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ tipo, mensaje, contacto })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ocurrió un error inesperado');
      
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setMensaje('');
        setContacto('');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <footer className="w-full py-6 mt-auto border-t border-gray-200 dark:border-white/5 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-[#0a0a0c] z-10 relative">
        <p className="text-sm text-gray-500 font-medium">© {new Date().getFullYear()} Crimson's Scan</p>
        <div className="flex items-center gap-4 text-sm flex-wrap justify-center">
          <Link href="/terminos" id="footer-reglamento-link" className="text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 font-medium bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30">
            <Shield size={14} /> Términos & Políticas
          </Link>
          <button onClick={() => setOpen(true)} className="text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 font-medium bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30">
            <MessageSquare size={14} /> Sugerencias & Soporte
          </button>
        </div>
      </footer>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="bg-white dark:bg-[#111114] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-white/10 relative">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition">
              <X size={18} />
            </button>
            
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              <MessageSquare className="text-rose-500" size={22} /> Buzón de Sugerencias
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              ¿Encontraste un error? ¿Tienes alguna idea o necesitas ayuda? Envíanos un mensaje.
            </p>

            {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                <CheckCircle2 size={48} className="text-emerald-500 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">¡Mensaje Enviado!</h3>
                <p className="text-sm text-gray-500 mt-1">Gracias por ayudarnos a mejorar.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && <div className="p-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo de mensaje</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition cursor-pointer">
                    <option value="sugerencia">💡 Sugerencia / Idea</option>
                    <option value="reporte">🐛 Reportar Error</option>
                    <option value="soporte">🎧 Ayuda / Soporte</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tu mensaje</label>
                  <textarea 
                    value={mensaje} onChange={(e) => setMensaje(e.target.value)} required rows={4}
                    placeholder="Escribe los detalles aquí..."
                    className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contacto (Opcional)</label>
                  <input 
                    type="text" value={contacto} onChange={(e) => setContacto(e.target.value)}
                    placeholder="Discord, Email o Twitter para responderte"
                    className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2.5 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
                  />
                </div>

                <button type="submit" disabled={loading} className="mt-2 w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-[0_5px_15px_rgba(225,29,72,0.2)]">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Enviar Mensaje</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
