import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { login } from '../lib/auth';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor llena todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(username, password);
      setUser(user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      {/* Fondo Premium (podrías cambiar la URL por una portada de tu manga favorito) */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1606558268875-197e41151e2c?q=80&w=600&auto=format&fit=crop' }} 
        style={StyleSheet.absoluteFillObject}
        blurRadius={15}
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        {/* Logo / Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoInitial}>C</Text>
          </View>
          <Text style={styles.title}>Crimson Scan</Text>
          <Text style={styles.subtitle}>Tu plataforma de lectura premium</Text>
        </View>

        {/* Formulario Glassmorphism */}
        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>USUARIO O EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: leandro123"
              placeholderTextColor="#6b7280"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardAppearance="dark"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              keyboardAppearance="dark"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar a la Bóveda</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.guestButtonText}>Continuar como Invitado</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 12, 0.85)', // Capa oscura para dar efecto dark glass
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  logoInitial: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 25,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  errorBox: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#fb7185',
    fontSize: 13,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#e11d48',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  guestButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  }
});
