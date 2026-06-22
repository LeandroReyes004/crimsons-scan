import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, Pressable, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

type BookmarkItem = {
  id: string;
  titulo: string;
  cover_r2_key?: string;
  estado: string;
};

export default function BookmarksScreen() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const response = await api.get('/api/marcadores');
        setBookmarks(response.data.marcadores || []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  const renderItem = ({ item }: { item: BookmarkItem }) => {
    const imageUrl = item.cover_r2_key ? `${api.defaults.baseURL}/api/cover/${item.id}` : 'https://via.placeholder.com/300x450/111/444?text=Sin+Portada';

    return (
      <Pressable style={styles.card} onPress={() => router.push(`/manga/${item.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
        <View style={styles.badgeTopLeft}>
          <Text style={styles.badgeText}>{item.estado.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Mis Marcadores</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No has guardado ningún manga en marcadores.</Text>
            }
          />
        )}
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 15 },
  card: { width: (width - 40 - 20) / 3 },
  coverImage: { width: '100%', aspectRatio: 2/3, borderRadius: 8, marginBottom: 6 },
  badgeTopLeft: {
    position: 'absolute', top: 6, left: 6, backgroundColor: '#e11d48',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  emptyText: { color: '#9ca3af', textAlign: 'center', marginTop: 50, fontSize: 16 }
});
