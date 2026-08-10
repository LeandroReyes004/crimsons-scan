import re

with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_str = """  const DEFAULT_DISCORD_TEMPLATE = '📖 **{{manga}}** — Capítulo {{capitulo}}{{titulo}}\\n\\n[🔗 Leer ahora]({{url}})';"""
new_str = """  const DEFAULT_DISCORD_TEMPLATE = '📖 **{{manga}}** — Capítulo {{capitulo}}{{titulo}}\\n\\n[🔗 Leer ahora]({{url}})';

  const DEFAULT_TELEGRAM_TEMPLATE = `📖 *{{manga}}*\\n\\nNuevo Capítulo {{capitulo}}{{titulo}} disponible ahora.\\n\\n🔗 [Leer Capítulo aquí]({{url}})`;
  
  function previewTelegramTemplate(tpl: string) {
    return (tpl || DEFAULT_TELEGRAM_TEMPLATE)
      .replace(/\\{\\{manga\\}\\}/g, 'Atados por el Pecado')
      .replace(/\\{\\{capitulo\\}\\}/g, '42')
      .replace(/\\{\\{titulo\\}\\}/g, ' — El reencuentro')
      .replace(/\\{\\{url\\}\\}/g, 'https://scancrimson.com/leer/token_secreto');
  }"""
code = code.replace(old_str, new_str)

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Constants added!")
