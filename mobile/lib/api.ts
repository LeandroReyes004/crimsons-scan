import axios from 'axios';
import { getItemAsync } from './storage';

import { Platform } from 'react-native';

// Apunta al Cloudflare Worker. En Android usa 10.0.2.2, en la Web usa localhost.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación a cada petición
api.interceptors.request.use(async (config) => {
  try {
    const token = await getItemAsync('crimson_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error obteniendo el token de Storage:', error);
  }
  return config;
});
