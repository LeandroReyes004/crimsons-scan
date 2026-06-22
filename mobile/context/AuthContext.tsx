import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { CrimsonUser, getUser, refreshUser } from '../lib/auth';

interface AuthContextType {
  user: CrimsonUser | null;
  setUser: (user: CrimsonUser | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CrimsonUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        let currentUser = await getUser();
        if (currentUser) {
          setUser(currentUser);
          // Refrescar sesión en segundo plano si hay token
          refreshUser().then((refreshed) => {
            if (refreshed) setUser(refreshed);
            else setUser(null);
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Protege las rutas comprobando si estamos en una pantalla de login o pública
    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Redirigir a login si no hay sesión
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirigir a la app si ya está logueado
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
