'use client';

const AD_KEY = '8ee74c0f889796bc175bf62ab6c3728a';
const SCRIPT  = `https://www.highperformanceformat.com/${AD_KEY}/invoke.js`;

// El script corre dentro de un iframe sandboxeado.
// Sin allow-top-navigation el ad NUNCA puede redirigir la página padre.
const AD_HTML = [
  '<!DOCTYPE html><html><head><meta charset="utf-8">',
  '<style>*{margin:0;padding:0}body{background:transparent}</style>',
  `<script>var atOptions={key:'${AD_KEY}',format:'iframe',height:300,width:160,params:{}};<\/script>`,
  `<script src="${SCRIPT}?t=${Date.now()}"><\/script>`,
  '</head><body></body></html>',
].join('');

export default function AdsterraSkyscraper() {
  return (
    <iframe
      srcDoc={AD_HTML}
      sandbox="allow-scripts allow-popups allow-same-origin"
      width="160"
      height="300"
      scrolling="no"
      style={{ border: 'none', display: 'block' }}
      title="Publicidad"
    />
  );
}
