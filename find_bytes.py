import re
with open('frontend/src/app/admin/page.tsx', 'rb') as f:
    content = f.read()

# Find placeholder for password
lines = content.split(b'\n')
for i, line in enumerate(lines):
    if b'type="password"' in line:
        print(f"Line {i+1}:", repr(line))
        for j in range(i-2, i+6):
            if b'placeholder' in lines[j]:
                print(f"Found placeholder around line {j+1}:", repr(lines[j]))

# Find ACCESO RESTRINGIDO
for i, line in enumerate(lines):
    if b'Acceso Restringido' in line or b'ACCESO RESTRINGIDO' in line:
        print(f"Found Acceso Restringido at line {i+1}:", repr(line))
