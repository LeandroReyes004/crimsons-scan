import re

with open('src/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

new_code = '''
        if (profile && profile.scan_id) {
          const scanData = await env.DB.prepare('SELECT contrato_firmado, contrato_version FROM scans WHERE id = ?').bind(profile.scan_id).first();
          profile.scan_contrato_firmado = scanData ? scanData.contrato_firmado : 0;
          profile.scan_contrato_version = scanData ? scanData.contrato_version : 0;
          profile.global_contrato_version = parseInt(await env.KV.get('contrato_version') || '1', 10);
        }
        return json(profile);
'''

code = code.replace('return json(profile);', new_code, 1)

with open('src/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('Patched /api/auth/me!')
