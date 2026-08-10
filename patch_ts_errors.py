import sys

# 1. Admin Page fixes
admin_file = 'frontend/src/app/admin/page.tsx'
with open(admin_file, 'r', encoding='utf-8') as f:
    admin = f.read()

admin = admin.replace('mutate();', 'fetchData();')
admin = admin.replace('fecha_creacion: string;', 'fecha_creacion: string;\n  oculto?: number;\n  slug?: string;')
admin = admin.replace('<EyeOff size={12} className="text-indigo-500 shrink-0" title="Oculto" />', '<span title="Oculto"><EyeOff size={12} className="text-indigo-500 shrink-0" /></span>')

with open(admin_file, 'w', encoding='utf-8') as f:
    f.write(admin)

# 2. Uploader Page fixes
uploader_file = 'frontend/src/app/uploader/page.tsx'
with open(uploader_file, 'r', encoding='utf-8') as f:
    up = f.read()

up = up.replace('tipo: string;', 'tipo: string;\n  slug?: string;')
with open(uploader_file, 'w', encoding='utf-8') as f:
    f.write(up)

print("TS errors fixed.")
