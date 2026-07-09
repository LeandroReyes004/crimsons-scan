import subprocess
out = subprocess.check_output(['git', 'show', 'bb55263^:frontend/src/app/admin/page.tsx'])
out_str = out.decode('utf-8', errors='replace')
for i, line in enumerate(out_str.splitlines()):
    if 'type="password"' in line or 'loginPass' in line:
        print(repr(line))
