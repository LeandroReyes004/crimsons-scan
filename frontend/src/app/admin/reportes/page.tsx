'use client';
import { useEffect, useState } from 'react';
import { getToken, authHeaders } from '@/lib/auth';

interface Reporte {
  key: string;
  size: number;
  uploaded: string;
}

export default function AdminReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setError('No autenticado');
      return;
    }
    
    // Solo admin y admin_scan pueden ver esto, el worker lo valida.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reportes`, {
      headers: authHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('No tienes permisos o ocurrió un error');
        return res.json();
      })
      .then(data => {
        setReportes(data.reportes || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const descargarReporte = async (filename: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reportes/${encodeURIComponent(filename.replace('reportes/', ''))}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Error al descargar');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.split('/').pop() || 'reporte.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando reportes...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black uppercase text-white tracking-tight">Reportes Mensuales</h1>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-6">
          <p className="text-zinc-400 text-sm mb-6">
            Aquí encontrarás los reportes en PDF generados automáticamente cada fin de mes con las métricas de visitas y la actividad de los uploaders y scans.
          </p>

          {reportes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No hay reportes generados todavía. El primero se generará automáticamente el primer día del mes a las 00:00.
            </div>
          ) : (
             <div className="space-y-3">
              {reportes.map((rep, idx) => {
                const filename = rep.key.split('/').pop();
                const mes = filename?.replace('.pdf', '');
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-crimson/10 flex items-center justify-center text-crimson">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Reporte: {mes}</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Generado el {new Date(rep.uploaded).toLocaleString()} • {(rep.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => descargarReporte(rep.key)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descargar PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
