const API_URL   = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
const TOKEN_KEY  = 'crimson_token';
const USER_KEY   = 'crimson_user';
const VER_KEY    = 'crimson_build';
const BUILD_ID   = process.env.NEXT_PUBLIC_BUILD_ID || '0';

export function checkVersion() {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(VER_KEY);
  if (stored && stored !== BUILD_ID) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  localStorage.setItem(VER_KEY, BUILD_ID);
}

export interface CrimsonUser {
  id: string;
  username: string;
  display_name?: string | null;
  rol: 'lector' | 'uploader' | 'admin' | 'admin_scan' | 'soporte';
  avatar_url?: string;
  is_superadmin?: boolean;
  scan_id?: string | null;
  scan_nombre?: string | null;
  scan_contrato_firmado?: number;
  scan_contrato_version?: number;
  global_contrato_version?: number;
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

export function setToken(token: string, user: CrimsonUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
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

export async function refreshUser(): Promise<CrimsonUser | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { logout(); return null; }
    const d = await res.json();
    const user: CrimsonUser = {
      id: d.id,
      username: d.username,
      display_name: d.display_name ?? null,
      rol: d.rol,
      avatar_url: d.avatar_url || undefined,
      is_superadmin: !!d.is_superadmin,
      scan_id: d.scan_id ?? null,
      scan_contrato_firmado: d.scan_contrato_firmado,
      scan_contrato_version: d.scan_contrato_version,
      global_contrato_version: d.global_contrato_version,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch { return null; }
}
