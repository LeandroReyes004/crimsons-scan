'use client';

import { useEffect } from 'react';

const SCRIPT_URL = 'https://pl29641064.effectivecpmnetwork.com/22/96/aa/2296aae2f6e7d670692ad60295e285d2.js';

export default function AdPopUnder() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  return null;
}
