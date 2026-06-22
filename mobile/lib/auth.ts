import { api } from './api';
import { setItemAsync, getItemAsync, deleteItemAsync } from './storage';

const TOKEN_KEY = 'crimson_token';
const USER_KEY = 'crimson_user';

export interface CrimsonUser {
  id: string;
  username: string;
  display_name?: string | null;
  rol: 'lector' | 'uploader' | 'admin' | 'admin_scan' | 'soporte';
  avatar_url?: string;
  is_superadmin?: boolean;
  scan_id?: string | null;
}

export async function login(username: string, password: string): Promise<CrimsonUser> {
  // Usamos el cliente api que ya tiene configurado el BASE_URL
  const res = await api.post('/api/auth/login', { username, password });
  const data = res.data;
  
  await setItemAsync(TOKEN_KEY, data.token);
  await setItemAsync(USER_KEY, JSON.stringify(data.user));
  
  return data.user;
}

export async function logout() {
  await deleteItemAsync(TOKEN_KEY);
  await deleteItemAsync(USER_KEY);
}

export async function getToken(): Promise<string | null> {
  return await getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<CrimsonUser | null> {
  const raw = await getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function refreshUser(): Promise<CrimsonUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await api.get('/api/auth/me');
    const d = res.data;
    const user: CrimsonUser = {
      id: d.id,
      username: d.username,
      display_name: d.display_name ?? null,
      rol: d.rol,
      avatar_url: d.avatar_url || undefined,
      is_superadmin: !!d.is_superadmin,
      scan_id: d.scan_id ?? null,
    };
    await setItemAsync(USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    await logout();
    return null;
  }
}
