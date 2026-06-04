const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const TOKEN_KEY = 'crimson_token';
const USER_KEY  = 'crimson_user';

export interface CrimsonUser {
  id: string;
  username: string;
  rol: 'lector' | 'uploader' | 'admin' | 'admin_scan';
  avatar_url?: string;
  is_superadmin?: boolean;
  scan_id?: string | null;
  scan_nombre?: string | null;
}

export async function login(username: string, password: string): Promise<CrimsonUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): CrimsonUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
