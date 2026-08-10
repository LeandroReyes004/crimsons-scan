const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');
code = code.replace(
  '<p className="text-xs text-gray-400 mt-0.5 truncate">{m.tipo} • <span className="font-mono">{m.id.slice(0,8)}...</span></p>',
  '<p className="text-xs text-gray-400 mt-0.5 truncate uppercase tracking-wider">{m.tipo}</p>'
);
fs.writeFileSync('frontend/src/app/admin/page.tsx', code);
console.log('Done');
