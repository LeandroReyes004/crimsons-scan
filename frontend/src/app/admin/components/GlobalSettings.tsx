import { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { authHeaders } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function GlobalSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [webhook, setWebhook] = useState('');
  const [telegram, setTelegram] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        setWebhook(data.discord_webhook_url || '');
        setTelegram(data.telegram_chat_id || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/api/admin/settings`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_webhook_url: webhook,
          telegram_chat_id: telegram
        })
      });
      if (res.ok) {
        setMessage('✅ Ajustes guardados correctamente.');
      } else {
        setMessage('❌ Error al guardar.');
      }
    } catch (e) {
      setMessage('❌ Error de conexión.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      <h3 className="font-bold dark:text-white mb-4 flex items-center gap-2">
        <Settings size={16} className="text-rose-500"/> Notificaciones Oficiales (Globales)
      </h3>
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-6">
        <p className="text-sm text-gray-500 mb-6">
          Estos son los canales principales donde se anunciará cada nuevo capítulo publicado, independientemente del Scan al que pertenezcan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Discord Webhook Oficial</label>
            <input
              value={webhook}
              onChange={e => setWebhook(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Telegram Chat ID Oficial</label>
            <input
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder="-10023456789"
              className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Ajustes
          </button>
          
          {message && <span className="text-sm font-medium animate-in fade-in">{message}</span>}
        </div>
      </div>
    </div>
  );
}
