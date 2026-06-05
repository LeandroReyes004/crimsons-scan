'use client';

import { useEffect } from 'react';

const SCRIPT_SRC = 'https://www.highperformanceformat.com/8ee74c0f889796bc175bf62ab6c3728a/invoke.js';
const AD_KEY     = '8ee74c0f889796bc175bf62ab6c3728a';

export default function AdsterraSkyscraper() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

    (window as any).atOptions = {
      key:    AD_KEY,
      format: 'iframe',
      height: 300,
      width:  160,
      params: {},
    };

    const script = document.createElement('script');
    script.src   = SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
