import re

with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the specific line using regex to avoid unicode bullet issues
pattern = r'<p className="text-xs text-gray-400 mt-0\.5 truncate">\{m\.tipo\} \u2022 <span className="font-mono">\{m\.id\.slice\(0,8\)\}\.\.\.</span></p>'
replacement = '<p className="text-xs text-gray-400 mt-0.5 truncate uppercase tracking-wider">{m.tipo}</p>'

code = re.sub(pattern, replacement, code)

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Done')
