'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authHeaders } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function ContractModal({ scanId, onClose }: { scanId: string, onClose: () => void }) {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [nombre, setNombre] = useState('');
  const [discord, setDiscord] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/config/contrato`)
      .then(r => r.json())
      .then((res: any) => {
        setTexto(res.texto || 'Error cargando contrato.');
        setLoading(false);
      })
      .catch(() => {
        setTexto('Error de conexión al cargar el contrato.');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError('Debes aceptar los términos para continuar.');
      return;
    }
    if (!nombre || !binanceId) {
      setError('El nombre y el Binance ID son obligatorios.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`${API}/api/scans/${scanId}/firmar-contrato`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          representante_nombre: nombre,
          representante_discord: discord,
          binance_pay_id: binanceId
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al firmar el contrato');
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error al firmar el contrato');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-rose-600/30 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl shadow-rose-900/20 flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-rose-950/40 to-transparent flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-rose-500"></span>
              Firma de Contrato de Alianza Requerida
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              Para continuar subiendo contenido y formar parte de la plataforma, debes leer y aceptar los términos de nuestra alianza.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm md:text-base leading-relaxed bg-[#0a0a0f] space-y-4 whitespace-pre-wrap">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            texto
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-[#12121a]">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Nombre / Nick *</label>
                <input 
                  type="text" 
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  placeholder="Tu nombre o nick"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Discord *</label>
                <input 
                  type="text"
                  required
                  value={discord}
                  onChange={e => setDiscord(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  placeholder="Usuario de Discord"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Binance Pay ID *</label>
                <input 
                  type="text" 
                  required
                  value={binanceId}
                  onChange={e => setBinanceId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors"
                  placeholder="ID para pagos"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group mt-4">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  required
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="peer sr-only" 
                />
                <div className="w-5 h-5 border-2 border-white/20 rounded bg-black/50 peer-checked:bg-rose-600 peer-checked:border-rose-600 transition-all"></div>
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-300 select-none group-hover:text-white transition-colors">
                He leído detenidamente y acepto todas las cláusulas del contrato de alianza.
              </span>
            </label>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting || !accepted}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-rose-900/20 active:scale-[0.98]"
              >
                {submitting ? 'Firmando...' : 'Firmar y Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
