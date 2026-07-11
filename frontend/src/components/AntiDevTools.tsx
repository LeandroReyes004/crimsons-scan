'use client';

import { useEffect } from 'react';

export default function AntiDevTools() {
  useEffect(() => {
    // 1. Bloquear atajos de teclado (F12, Ctrl+Shift+I, etc)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U') ||
        (e.ctrlKey && e.key.toUpperCase() === 'S')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Bloquear clic derecho en toda la página del lector
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 3. Trampa de Debugger (congela el DevTools si lo logran abrir)
    const debuggerTrap = setInterval(() => {
      try {
        // Ejecuta 'debugger' de una forma que es difícil de saltar estáticamente
        Function("debugger")();
      } catch (err) {}
    }, 200);

    // 4. Limpiar la página o redireccionar si se detecta DevTools mediante el rendimiento del debugger
    // (Opcional, pero Function("debugger") suele ser suficiente para molestar muchísimo al usuario)

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      clearInterval(debuggerTrap);
    };
  }, []);

  return null;
}
