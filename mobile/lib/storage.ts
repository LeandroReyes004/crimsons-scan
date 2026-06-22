import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error leyendo de localStorage:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error borrando de localStorage:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
