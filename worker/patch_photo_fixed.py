import re

backend_path = r"c:\Users\leandro.reyes\Music\crimsons-scan\worker\src\index.js"
with open(backend_path, 'r', encoding='utf-8') as f:
    backend_content = f.read()

# I will just replace `sendPhoto` with `sendMessage`, `photo: coverUrl` with `text: caption`, and delete `caption: caption,`
backend_content = backend_content.replace('/sendPhoto', '/sendMessage')
backend_content = backend_content.replace('photo: coverUrl,', 'text: caption,')
backend_content = backend_content.replace('caption: caption,', '')

with open(backend_path, 'w', encoding='utf-8') as f:
    f.write(backend_content)
    print("Fixed!")
