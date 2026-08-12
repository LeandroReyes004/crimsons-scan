import { useState, useEffect, useCallback } from 'react';

const KEY = 'crimson_favorites';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Cargar de localStorage inicialmente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  // Si hay sesión iniciada, intentar cargar favoritos reales del servidor
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('crimson_token') : null;
    if (token) {
      fetch(`${API}/api/marcadores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(d => {
        if (d.marcadores) {
          const ids = d.marcadores.map((m: any) => m.id);
          setFavorites(ids);
          localStorage.setItem(KEY, JSON.stringify(ids)); // Sincronizar local
        }
      })
      .catch(console.error);
    }
  }, []);

  const toggle = useCallback((id: string) => {
    // 1. Optimistic UI update
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });

    // 2. Enviar a la base de datos si hay sesión
    const token = typeof window !== 'undefined' ? localStorage.getItem('crimson_token') : null;
    if (token) {
      fetch(`${API}/api/marcadores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mangaId: id })
      }).catch(console.error);
    }
  }, []);

  const isFav = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFav };
}
