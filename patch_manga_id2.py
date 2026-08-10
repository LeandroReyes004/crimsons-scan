import re
with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r'<p className="text-xs text-gray-400 mt-0\.5 truncate">\{m\.tipo\}.*?<\/p>'
replacement = '<p className="text-xs text-gray-400 mt-0.5 truncate uppercase tracking-wider">{m.tipo}</p>'

code = re.sub(pattern, replacement, code)

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Done')
