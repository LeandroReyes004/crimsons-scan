import re

with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r'(<p className="text-xs text-gray-400">\{scan\.total_mangas\} obras .*? \{scan\.total_capitulos\} caps publicados</p>\s*</div>)'

replacement = r'''\1
                    {user?.is_superadmin && scan.contrato_firmado === 1 && (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Firma: {scan.representante_nombre} | Binance: {scan.binance_pay_id}
                      </p>
                    )}
                    {user?.is_superadmin && scan.contrato_firmado !== 1 && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> Contrato No Firmado
                      </p>
                    )}'''

code = re.sub(pattern, replacement, code)

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched scans list successfully via regex')
