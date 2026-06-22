import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, Image, Pressable, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

type Manga = {
  id: string;
  titulo: string;
  estado: string;
  cover_r2_key?: string;
};

export default function SearchScreen() {
  const router = useRouter();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [filteredMangas, setFilteredMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchMangas() {
      try {
        const response = await api.get('/api/mangas');
        setMangas(response.data.mangas || []);
        setFilteredMangas(response.data.mangas || []);
      } catch (err) {
        console.error('Error fetching mangas for search:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMangas();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredMangas(mangas);
    } else {
      const lowerQuery = text.toLowerCase();
      const filtered = mangas.filter(m => m.titulo.toLowerCase().includes(lowerQuery));
      setFilteredMangas(filtered);
    }
  };

  const renderItem = ({ item }: { item: Manga }) => {
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
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Catálogo</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar por título..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : (
          <FlatList
            data={filteredMangas}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No se encontraron mangas.</Text>
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
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom tab bar
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
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});
