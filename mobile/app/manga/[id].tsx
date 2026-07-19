import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ActivityIndicator, FlatList, Pressable, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';

const { height } = Dimensions.get('window');

type Capitulo = {
  id: string;
  numero: number;
  titulo?: string;
  fecha_subida: string;
};

type MangaDetalle = {
  id: string;
  titulo: string;
  descripcion: string;
  generos: string;
  estado: string;
  cover_r2_key?: string;
  views_total: number;
};

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [manga, setManga] = useState<MangaDetalle | null>(null);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Detalles' | 'Capítulos'>('Detalles');

  useEffect(() => {
    async function fetchMangaDetails() {
      try {
        const response = await api.get(`/api/mangas/${id}`);
        setManga(response.data.manga);
        setCapitulos(response.data.capitulos || []);
      } catch (err) {
        console.error('Error fetching manga details:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMangaDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  if (!manga) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{color: '#fff', fontSize: 16, marginBottom: 20}}>No se pudo cargar el manga.</Text>
        <Pressable onPress={() => router.back()} style={{padding: 10, backgroundColor: '#e11d48', borderRadius: 8}}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const imageUrl = manga.cover_r2_key ? `${api.defaults.baseURL}/api/cover/${manga.id}` : 'https://via.placeholder.com/300x450/111/444?text=Sin+Portada';
  const generosArr: string[] = JSON.parse(manga.generos || '[]');
  // Puntuación real (si la base de datos la soportara en el futuro), por ahora no mostramos una inventada.

  const renderHeader = () => (
    <View>
      <View style={styles.heroSection}>
        {/* Fondo oscuro absoluto, sin desenfoque esta vez, más similar a la captura */}
        <Image source={{ uri: imageUrl }} style={styles.heroBackground} blurRadius={20} />
        <View style={styles.heroGradient} />
        
        {/* Contenedor central (Imagen y Título) */}
        <View style={styles.heroContentCenter}>
          <Image source={{ uri: imageUrl }} style={styles.heroCoverLarge} />
          <Text style={styles.titleLarge} numberOfLines={2}>{manga.titulo}</Text>
          <Text style={styles.subtitleSmall}>Crimson Scan • {capitulos.length} Capítulos</Text>
        </View>
      </View>

      {/* Tabs Customizados */}
      <View style={styles.tabsContainer}>
        <Pressable style={[styles.tabButton, activeTab === 'Detalles' && styles.tabButtonActive]} onPress={() => setActiveTab('Detalles')}>
          <Text style={[styles.tabText, activeTab === 'Detalles' && styles.tabTextActive]}>Detalles</Text>
        </Pressable>
        <Pressable style={[styles.tabButton, activeTab === 'Capítulos' && styles.tabButtonActive]} onPress={() => setActiveTab('Capítulos')}>
          <Text style={[styles.tabText, activeTab === 'Capítulos' && styles.tabTextActive]}>Capítulos</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderDetalles = () => (
    <View style={styles.detailsContent}>
      {/* Estadísticas */}
      <View style={styles.statsRow}>
        <Text style={styles.statusText}>{manga.estado.replace('_', ' ')}</Text>
        <View style={styles.starsContainer}>
          <Text style={styles.viewsIcon}>👁️ {manga.views_total > 1000 ? (manga.views_total / 1000).toFixed(1) + 'K' : manga.views_total || 0} vistas</Text>
        </View>
      </View>

      {/* Etiquetas */}
      <View style={styles.tagsContainer}>
        {generosArr.map((g, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{g}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.descriptionText}>{manga.descripcion || 'Sin descripción disponible.'}</Text>
      
      {/* Espacio para el botón flotante */}
      <View style={{ height: 100 }} />
    </View>
  );

  const renderCapitulos = () => (
    <View style={styles.chaptersContent}>
      {capitulos.map((item) => {
        // Formatear la fecha real (si existe)
        const fecha = item.fecha_subida ? new Date(item.fecha_subida).toLocaleDateString() : '';
        return (
          <Pressable 
            key={item.id}
            style={styles.chapterRow}
            onPress={() => router.push(`/manga/${id}/chapter/${item.id}`)}
          >
            <View style={styles.chapterInfo}>
              <Text style={styles.chapterNumber}>Capítulo {item.numero}</Text>
              {item.titulo ? <Text style={styles.chapterTitle}>{item.titulo}</Text> : null}
            </View>
            <Text style={{color: '#6b7280', fontSize: 12}}>{fecha}</Text>
          </Pressable>
        );
      })}
      <View style={{ height: 100 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Pressable style={styles.floatingBackButton} onPress={() => router.back()}>
        <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>←</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {renderHeader()}
        {activeTab === 'Detalles' ? renderDetalles() : renderCapitulos()}
      </ScrollView>

      {/* Botón Call to Action Flotante */}
      {capitulos.length > 0 && (
        <View style={styles.floatingCTAContainer}>
          <Pressable 
            style={styles.ctaButton}
            onPress={() => router.push(`/manga/${id}/chapter/${capitulos[capitulos.length - 1].id}`)}
          >
            <Text style={styles.ctaButtonText}>Empezar a leer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0c' },
  floatingBackButton: {
    position: 'absolute', top: 50, left: 20, zIndex: 100,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroSection: {
    height: 380,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.7)',
  },
  heroContentCenter: {
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  heroCoverLarge: {
    width: 140,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleSmall: {
    fontSize: 13,
    color: '#9ca3af',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#e11d48',
  },
  tabText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#fff',
  },
  detailsContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: '#e11d48',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  starIcon: { color: '#fbbf24', fontSize: 13, fontWeight: 'bold' },
  viewsIcon: { color: '#9ca3af', fontSize: 13, fontWeight: 'bold' },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { color: '#d1d5db', fontSize: 11, fontWeight: '600' },
  descriptionText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 24,
  },
  chaptersContent: {
    paddingTop: 10,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0a0a0c', // Forza el repintado (Hardware Acceleration fix para Android)
  },
  chapterInfo: { flex: 1 },
  chapterNumber: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  chapterTitle: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  floatingCTAContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(10,10,12,0.9)',
  },
  ctaButton: {
    backgroundColor: '#e11d48',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
