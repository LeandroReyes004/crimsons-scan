import re

with open('src/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

check_code = r'''
          if (caller.rol !== 'superadmin' && caller.scan_id) {
            const scanData = await env.DB.prepare('SELECT contrato_firmado, contrato_version FROM scans WHERE id = ?').bind(caller.scan_id).first();
            const globalVersion = parseInt(await env.KV.get('contrato_version') || '1', 10);
            if (!scanData || scanData.contrato_firmado === 0 || scanData.contrato_version < globalVersion) {
              return err('Debes firmar o actualizar tu contrato de alianza en el panel principal antes de subir contenido.', 403);
            }
          }
'''

def inject_check(endpoint):
    global code
    code = code.replace(
        f"if (pathname === '{endpoint}' && method === 'POST') {{",
        f"if (pathname === '{endpoint}' && method === 'POST') {{\n{check_code}"
    )

inject_check('/api/mangas')
inject_check('/api/chapters')
inject_check('/api/upload/page')
inject_check('/api/upload/text')
inject_check('/api/upload/cover')

with open('src/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('Injected security checks!')
