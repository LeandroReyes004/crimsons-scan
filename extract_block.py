import io

with io.open('full_section_revenue.txt', 'r', encoding='utf-8') as f:
    orig = f.read()

start_marker = '// Vista para admin_scan: solo su propio scan\n  if (ownScanId) {'
end_marker = '  return (\n    <div className="flex flex-col gap-6 animate-in fade-in duration-300">\n      {/* Header */}'

start_idx = orig.find(start_marker)
end_idx = orig.find(end_marker)

target_content = orig[start_idx:end_idx]
print(f'Target content length: {len(target_content)}')
with io.open('target_revenue_block.txt', 'w', encoding='utf-8') as f:
    f.write(target_content)
