import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, Pressable, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

type Manga = {
  id: string;
  titulo: string;
  estado: string;
  cover_r2_key?: string;
  views_total?: number;
};

export default function AdultsScreen() {
  const router = useRouter();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdultMangas() {
      try {
        const response = await api.get('/api/mangas/adulto');
        setMangas(response.data.mangas || []);
      } catch (err) {
        console.error('Error fetching adult mangas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdultMangas();
  }, []);

  const renderItem = ({ item }: { item: Manga }) => {
    const imageUrl = item.cover_r2_key ? `${api.defaults.baseURL}/api/cover/${item.id}` : 'https://via.placeholder.com/300x450/111/444?text=Sin+Portada';
    const vistas = item.views_total ? (item.views_total > 1000 ? (item.views_total/1000).toFixed(1) + 'k' : item.views_total) : '0';
    return (
      <Pressable style={styles.card} onPress={() => router.push(`/manga/${item.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
        <View style={styles.badgeTopLeft}>
          <Text style={styles.badgeText}>+18</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
        <Text style={styles.subtitle}>👁️ {vistas}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Sección +18</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>Contenido exclusivo para adultos</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : (
          <FlatList
            data={mangas}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay mangas para adultos disponibles.</Text>
            }
          />
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#e11d48',
    fontSize: 20,
    fontWeight: '900',
  },
  warningBanner: {
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    marginHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  warningText: {
    color: '#e11d48',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: (width - 40 - 20) / 3, // (Total Width - paddingHorizontal - gap_between_columns) / 3
  },
  coverImage: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});
