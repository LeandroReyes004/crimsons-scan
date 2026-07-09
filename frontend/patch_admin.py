import re

# 1. Update backend worker index.js
backend_path = r"c:\Users\leandro.reyes\Music\crimsons-scan\worker\src\index.js"
with open(backend_path, 'r', encoding='utf-8') as f:
    backend_content = f.read()

old_webhook = """const { webhook_discord, discord_template } = await request.json();
        await env.DB.prepare('UPDATE scans SET webhook_discord = ?, discord_template = ? WHERE id = ?')
          .bind(webhook_discord || null, discord_template || null, editWebhook[1]).run();"""

new_webhook = """const { webhook_discord, discord_template, telegram_chat_id } = await request.json();
        await env.DB.prepare('UPDATE scans SET webhook_discord = ?, discord_template = ?, telegram_chat_id = ? WHERE id = ?')
          .bind(webhook_discord || null, discord_template || null, telegram_chat_id || null, editWebhook[1]).run();"""

backend_content = backend_content.replace(old_webhook, new_webhook)

with open(backend_path, 'w', encoding='utf-8') as f:
    f.write(backend_content)


# 2. Update frontend admin page.tsx
frontend_path = r"c:\Users\leandro.reyes\Music\crimsons-scan\frontend\src\app\admin\page.tsx"
with open(frontend_path, 'r', encoding='utf-8') as f:
    frontend_content = f.read()

# Add telegram state
frontend_content = frontend_content.replace(
    "const [discordTemplate, setDiscordTemplate] = useState<string>('');",
    "const [discordTemplate, setDiscordTemplate] = useState<string>('');\n  const [telegramChatId, setTelegramChatId] = useState<string>('');"
)

# Set telegram state on load
frontend_content = frontend_content.replace(
    "if (scanData?.scan?.webhook_discord) setWebhook(scanData.scan.webhook_discord);",
    "if (scanData?.scan?.webhook_discord) setWebhook(scanData.scan.webhook_discord);\n    if (scanData?.scan?.telegram_chat_id) setTelegramChatId(scanData.scan.telegram_chat_id);"
)

# Update fetch PUT body
frontend_content = frontend_content.replace(
    "body: JSON.stringify({ webhook_discord: webhook || null, discord_template: discordTemplate || null }),",
    "body: JSON.stringify({ webhook_discord: webhook || null, discord_template: discordTemplate || null, telegram_chat_id: telegramChatId || null }),"
)

# Add Telegram input field in UI
telegram_input = """<div className="mb-4">
              <label className="block text-gray-400 text-sm font-bold mb-2">Telegram Chat ID (Ej: -100...)</label>
              <input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="-10012345678" className="w-full bg-[#111] border border-white/10 p-3 rounded-lg text-white" />
              <p className="text-xs text-gray-500 mt-1">El ID del canal de Telegram al que el bot enviará los capítulos nuevos automáticamente.</p>
            </div>
            """
frontend_content = frontend_content.replace(
    """<label className="block text-gray-400 text-sm font-bold mb-2">Webhook Discord</label>""",
    telegram_input + """<label className="block text-gray-400 text-sm font-bold mb-2">Webhook Discord</label>"""
)

with open(frontend_path, 'w', encoding='utf-8') as f:
    f.write(frontend_content)

print("Backend and Frontend patched for Telegram Chat ID!")
