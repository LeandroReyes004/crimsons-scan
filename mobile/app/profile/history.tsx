import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';

type HistoryItem = {
  id: string;
  titulo: string;
  cover_r2_key?: string;
  capitulo_numero: number;
  capitulo_titulo?: string;
  leido_en: string;
};

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await api.get('/api/historial');
        setHistory(response.data.historial || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const imageUrl = item.cover_r2_key ? `${api.defaults.baseURL}/api/cover/${item.id}` : 'https://via.placeholder.com/300x450/111/444?text=Sin+Portada';
    const date = new Date(item.leido_en).toLocaleDateString();

    return (
      <Pressable style={styles.historyCard} onPress={() => router.push(`/manga/${item.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.chapterText}>
            Capítulo {item.capitulo_numero} {item.capitulo_titulo ? `- ${item.capitulo_titulo}` : ''}
          </Text>
          <Text style={styles.dateText}>Leído el {date}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
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
          <Text style={styles.headerTitle}>Mi Historial</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No has leído ningún manga aún.</Text>
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
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c1e',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  coverImage: { width: 60, height: 80, borderRadius: 8, marginRight: 15 },
  cardContent: { flex: 1 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  chapterText: { color: '#e11d48', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  dateText: { color: '#9ca3af', fontSize: 12 },
  chevron: { color: '#6b7280', fontSize: 24, marginLeft: 10 },
  emptyText: { color: '#9ca3af', textAlign: 'center', marginTop: 50, fontSize: 16 }
});
