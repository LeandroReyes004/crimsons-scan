import io

with io.open('frontend/src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    orig = f.read()

start_marker = '      {/* Header */}\n      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">'
end_marker = '                {/* Detalle expandido */}'

start_idx = orig.find(start_marker)
end_idx = orig.find(end_marker)

if start_idx != -1 and end_idx != -1:
    target_content = orig[start_idx:end_idx]
    with io.open('target_superadmin_top.txt', 'w', encoding='utf-8') as f:
        f.write(target_content)
    print('Block extracted successfully')
else:
    print('Markers not found')
