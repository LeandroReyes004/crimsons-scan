import { StyleSheet, View, Text, Pressable, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';
import { api } from '@/lib/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.replace('/login');
  };

  if (!user) return null;

  // Si tiene avatar en R2, se carga desde /api/avatar/:userId
  const avatarUrl = user.avatar_url 
    ? `${api.defaults.baseURL}/api/avatar/${user.id}` 
    : `https://ui-avatars.com/api/?name=${user.username}&background=e11d48&color=fff&size=200`;

  const getRoleLabel = (role: string, isSuperAdmin?: boolean) => {
    if (isSuperAdmin) return 'Super Administrador';
    const labels: Record<string, string> = {
      lector: 'Lector',
      uploader: 'Uploader',
      admin: 'Administrador',
      admin_scan: 'Admin de Scan',
      soporte: 'Soporte',
    };
    return labels[role] || role;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        <View style={styles.profileSection}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.displayName}>{user.display_name || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleLabel(user.rol, user.is_superadmin)}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/profile/settings')}>
            <Text style={styles.menuItemIcon}>⚙️</Text>
            <Text style={styles.menuItemText}>Configuración</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push('/profile/history')}>
            <Text style={styles.menuItemIcon}>📚</Text>
            <Text style={styles.menuItemText}>Mi Historial</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push('/profile/bookmarks')}>
            <Text style={styles.menuItemIcon}>🔖</Text>
            <Text style={styles.menuItemText}>Marcadores</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.logoutContainer}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#e11d48',
    marginBottom: 15,
  },
  displayName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  roleText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  menuItemArrow: {
    color: '#6b7280',
    fontSize: 20,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
