import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Image, Pressable, View, Text, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

type Manga = {
  id: string;
  titulo: string;
  descripcion: string;
  cover_r2_key?: string;
  estado: string;
  ultimo_capitulo?: number;
  views_total?: number;
};

const CATEGORIES = ['All', 'Romance', 'Action', 'Fantasy', 'Comedy', 'Drama', 'Horror'];

export default function TabOneScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function fetchMangas() {
      try {
        const response = await api.get('/api/mangas');
        setMangas(response.data.mangas || []);
      } catch (err) {
        console.error('Error fetching mangas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMangas();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  // Derived data
  const heroMangas = [...mangas].sort((a, b) => (b.views_total || 0) - (a.views_total || 0)).slice(0, 3);
  const populares = [...mangas].sort((a, b) => (b.views_total || 0) - (a.views_total || 0)).slice(0, 10);
  const recientes = [...mangas].reverse().slice(0, 10); // Simulación de recientes

  const renderHeroItem = (item: Manga) => {
    const imageUrl = item.cover_r2_key ? `${api.defaults.baseURL}/api/cover/${item.id}` : 'https://via.placeholder.com/600x400/111/444?text=Sin+Portada';
    return (
      <Pressable key={item.id} style={styles.heroCard} onPress={() => router.push(`/manga/${item.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle} numberOfLines={1}>{item.titulo}</Text>
          <Text style={styles.heroSubtitle}>Fantasia • {item.estado.replace('_', ' ')}</Text>
        </View>
      </Pressable>
    );
  };

  const renderSmallCard = ({ item }: { item: Manga }) => {
    const imageUrl = item.cover_r2_key ? `${api.defaults.baseURL}/api/cover/${item.id}` : 'https://via.placeholder.com/300x450/111/444?text=Sin+Portada';
    const vistas = item.views_total ? (item.views_total > 1000 ? (item.views_total/1000).toFixed(1) + 'k' : item.views_total) : '0';
    return (
      <Pressable style={styles.smallCard} onPress={() => router.push(`/manga/${item.id}`)}>
        <Image source={{ uri: imageUrl }} style={styles.smallCoverImage} resizeMode="cover" />
        <View style={styles.badgeTopLeft}>
          <Text style={styles.badgeText}>{item.estado.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.smallTitle} numberOfLines={2}>{item.titulo}</Text>
        <Text style={styles.smallSubtitle}>👁️ {vistas} vistas</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header superior */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.username || 'Kaiser'} 👋</Text>
            <Text style={styles.greetingSubtitle}>¿Qué vas a leer hoy?</Text>
          </View>
          <Pressable style={styles.adultButton} onPress={() => router.push('/manga/adults')}>
            <Text style={styles.adultButtonText}>🔞 +18</Text>
          </Pressable>
        </View>

        {/* Hero Carousel */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.heroContainer}
        >
          {heroMangas.map(renderHeroItem)}
        </ScrollView>

        {/* Categories Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {CATEGORIES.map(cat => (
            <Pressable 
              key={cat} 
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sección: Populares */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Populares</Text>
          <Text style={styles.sectionViewAll}>Ver todo</Text>
        </View>
        <FlatList
          horizontal
          data={populares}
          keyExtractor={(item) => item.id}
          renderItem={renderSmallCard}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Sección: Recientes */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Nuevos Capítulos</Text>
          <Text style={styles.sectionViewAll}>Ver todo</Text>
        </View>
        <FlatList
          horizontal
          data={recientes}
          keyExtractor={(item) => item.id}
          renderItem={renderSmallCard}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

      </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0c',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  greeting: {
    color: '#9ca3af',
    fontSize: 14,
  },
  greetingSubtitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  heroContainer: {
    height: 220,
    marginBottom: 20,
  },
  heroCard: {
    width: width - 40,
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#d1d5db',
    fontSize: 13,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(225,29,72,0.2)', // Rose claro
    borderColor: '#e11d48',
  },
  categoryText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#e11d48',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionViewAll: {
    color: '#6b7280',
    fontSize: 13,
  },
  horizontalList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  smallCard: {
    width: 120,
    marginBottom: 10,
  },
  smallCoverImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e11d48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  smallTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  smallSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  adultButton: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adultButtonText: {
    color: '#e11d48',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
