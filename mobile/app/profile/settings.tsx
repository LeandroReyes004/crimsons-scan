import { StyleSheet, View, Text, Pressable, SafeAreaView, Switch } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Preferencias de Lectura</Text>
          
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Ahorro de Datos</Text>
              <Text style={styles.settingDesc}>Cargar imágenes en menor calidad</Text>
            </View>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#e11d48' }}
              thumbColor="#fff"
              value={dataSaver}
              onValueChange={setDataSaver}
            />
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Notificaciones</Text>
              <Text style={styles.settingDesc}>Avisarme de nuevos capítulos</Text>
            </View>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#e11d48' }}
              thumbColor="#fff"
              value={notifications}
              onValueChange={setNotifications}
            />
          </View>

          <Text style={styles.sectionTitle}>Aplicación</Text>

          <Pressable style={styles.actionItem}>
            <Text style={styles.actionItemText}>Limpiar Caché de Imágenes</Text>
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Text style={styles.actionItemText}>Política de Privacidad</Text>
          </Pressable>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Crimson's Scan App v1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0c' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c1c1e',
    justifyContent: 'center', alignItems: 'center',
  },
  backButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { color: '#e11d48', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, marginTop: 20 },
  settingItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1c1c1e', padding: 15, borderRadius: 12, marginBottom: 10,
  },
  settingLabel: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingDesc: { color: '#9ca3af', fontSize: 12 },
  actionItem: {
    backgroundColor: '#1c1c1e', padding: 15, borderRadius: 12, marginBottom: 10,
  },
  actionItemText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  versionContainer: { marginTop: 40, alignItems: 'center' },
  versionText: { color: '#6b7280', fontSize: 14 }
});
