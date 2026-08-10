import re

with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add state for telegramTemplate
old_state = """  const [telegramChatId, setTelegramChatId] = useState('');
  const [saved, setSaved]                   = useState<string | null>(null);"""
new_state = """  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramTemplate, setTelegramTemplate] = useState('');
  const [saved, setSaved]                   = useState<string | null>(null);"""
code = code.replace(old_state, new_state)

# 2. Add DEFAULT_TELEGRAM_TEMPLATE and preview function inside SectionConfig
old_preview = """  const previewTemplate = (t: string) => {
    return (t || DEFAULT_DISCORD_TEMPLATE)"""
new_preview = """  const DEFAULT_TELEGRAM_TEMPLATE = `📖 *{{manga}}*\\n\\nNuevo Capítulo {{capitulo}}{{titulo}} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí]({{url}})`;
  const previewTelegramTemplate = (t: string) => {
    return (t || DEFAULT_TELEGRAM_TEMPLATE)
      .replace(/\\{\\{manga\\}\\}/g, 'Solo Leveling')
      .replace(/\\{\\{capitulo\\}\\}/g, '145')
      .replace(/\\{\\{titulo\\}\\}/g, ' — El Despertar')
      .replace(/\\{\\{url\\}\\}/g, 'https://scancrimson.com/leer/token_secreto');
  };

  const previewTemplate = (t: string) => {
    return (t || DEFAULT_DISCORD_TEMPLATE)"""
code = code.replace(old_preview, new_preview)

# 3. Update useEffect
old_effect = """    if (scanData?.scan?.telegram_chat_id) setTelegramChatId(scanData.scan.telegram_chat_id);
    if (scanData?.scan?.discord_template) setDiscordTemplate(scanData.scan.discord_template);"""
new_effect = """    if (scanData?.scan?.telegram_chat_id) setTelegramChatId(scanData.scan.telegram_chat_id);
    if (scanData?.scan?.telegram_template) setTelegramTemplate(scanData.scan.telegram_template);
    if (scanData?.scan?.discord_template) setDiscordTemplate(scanData.scan.discord_template);"""
code = code.replace(old_effect, new_effect)

# 4. Update handleSave body
old_body = """body: JSON.stringify({ webhook_discord: webhook || null, discord_template: discordTemplate || null, telegram_chat_id: telegramChatId || null }),"""
new_body = """body: JSON.stringify({ webhook_discord: webhook || null, discord_template: discordTemplate || null, telegram_chat_id: telegramChatId || null, telegram_template: telegramTemplate || null }),"""
code = code.replace(old_body, new_body)

# 5. Add Telegram block to JSX right below Discord block
old_jsx = """          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook de Discord</p>"""

new_jsx = """          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bot de Telegram</p>
            <p className="text-xs text-gray-500 mb-4">
              Cuando se publique un capítulo, el bot notificará automáticamente a tu canal de Telegram.
              Agrega tu bot como administrador en el canal y pega aquí el Chat ID (ej. -10012345678).
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Chat ID del Canal</label>
              <input
                value={telegramChatId}
                onChange={e => { setTelegramChatId(e.target.value); setSaved(null); }}
                placeholder="-100..."
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mensaje de Telegram</label>
              <p className="text-xs text-gray-400">Usá las variables de abajo. Si lo dejás vacío se usa el mensaje por defecto. Soporta Markdown.</p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {['{{manga}}', '{{capitulo}}', '{{titulo}}', '{{url}}'].map(v => (
                  <button key={`tel-${v}`} type="button"
                    onClick={() => setTelegramTemplate(t => (t || DEFAULT_TELEGRAM_TEMPLATE) + v)}
                    className="text-[11px] font-mono bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md hover:bg-sky-200 dark:hover:bg-sky-500/25 transition">
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={telegramTemplate}
                onChange={e => { setTelegramTemplate(e.target.value); setSaved(null); }}
                placeholder={DEFAULT_TELEGRAM_TEMPLATE}
                className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-3 rounded-xl text-sm dark:text-white focus:border-rose-500 outline-none transition font-mono resize-none"
              />
              <div className="bg-[#1e1f22] rounded-xl p-3 mt-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5 font-bold">Vista previa</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{previewTelegramTemplate(telegramTemplate)}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition">
                {saving ? 'Guardando...' : 'Guardar Telegram'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook de Discord</p>"""
code = code.replace(old_jsx, new_jsx)

# If old_jsx wasn't found perfectly due to whitespace, we'll use a regex replacement just in case
if 'Bot de Telegram' not in code:
    print("Warning: JSX replacement failed!")

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Frontend patched!")
