import re

with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Change the success message text
old_msg = "setSaved('✅ Webhook guardado');"
new_msg = "setSaved('✅ Configuración guardada exitosamente');"
code = code.replace(old_msg, new_msg)

# Duplicate the {saved} block into Telegram section
# The Discord section has:
# <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Webhook de Discord</p>
# ...
# {saved   && <div ...

# I will find the Bot de Telegram block and add it there
old_telegram_section = """            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bot de Telegram</p>
            <p className="text-xs text-gray-500 mb-4">
              Cuando se publique un capítulo, el bot notificará automáticamente a tu canal de Telegram.
              Agrega tu bot como administrador en el canal y pega aquí el Chat ID (ej. -10012345678).
            </p>"""

new_telegram_section = """            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bot de Telegram</p>
            <p className="text-xs text-gray-500 mb-4">
              Cuando se publique un capítulo, el bot notificará automáticamente a tu canal de Telegram.
              Agrega tu bot como administrador en el canal y pega aquí el Chat ID (ej. -10012345678).
            </p>
            {saved   && <div className={`mb-3 p-3 rounded-xl text-sm font-medium ${saved.startsWith('✅')   ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>{saved}</div>}"""

code = code.replace(old_telegram_section, new_telegram_section)

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("UI Fixed!")
