import re

with open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',  # iacute
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã\x81': 'Á',
    'Ã‰': 'É',
    'Ã\x8d': 'Í',
    'Ã“': 'Ó',
    'Ãš': 'Ú',
    'Ã‘': 'Ñ',
    'Â¿': '¿',
    'Â¡': '¡',
    'â€”': '—', # em dash
    'â€œ': '“',
    'â€': '”',
    'â€¢': '•', # bullet
    'Ã¢â‚¬â€œ': '–',
    'â†\x90': '←',
    '\x90': '←',
    '\x90': '←',
    'â”€': '─', # box drawing
    'Ã\x8d': 'Í',
    'Ã\xad': 'í',
    'Ãš': 'Ú',
    'Ãº': 'ú',
    'Ã\x81': 'Á',
    'Ã¡': 'á',
    'Ã\x89': 'É',
    'Ã©': 'é',
    'Ã\x93': 'Ó',
    'Ã³': 'ó',
    'Ã\x91': 'Ñ',
    'Ã±': 'ñ',
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

# Manual fixes for common cases that might have slightly different byte representations
content = content.replace('Ã¡', 'á').replace('Ã©', 'é').replace('Ã­', 'í').replace('Ã³', 'ó').replace('Ãº', 'ú').replace('Ã±', 'ñ')
content = content.replace('Â¿', '¿').replace('Â¡', '¡')

# Box drawing characters for comments like `// ── Componentes pequeños ──`
content = content.replace('â”€', '─')

with open('frontend/src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Mojibake replaced using dictionary.')
