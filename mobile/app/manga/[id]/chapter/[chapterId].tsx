import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, FlatList, Pressable, Image, Dimensions, StatusBar, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

type Page = {
  id: string;
  numero: number;
  image_url: string;
};

type Capitulo = {
  id: string;
  numero: number;
  titulo?: string;
  manga_id: string;
  prev_chapter_id?: string | null;
  next_chapter_id?: string | null;
};

// Componente para cargar la imagen y mantener el aspect ratio correcto
const PageImage = ({ uri }: { uri: string }) => {
  const [aspectRatio, setAspectRatio] = useState<number>(0.7); // Valor por defecto
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (isMounted) {
          setAspectRatio(w / h);
          setLoading(false);
        }
      },
      () => {
        if (isMounted) setLoading(false);
      }
    );
    return () => { isMounted = false; };
  }, [uri]);

  return (
    <View style={{ width: '100%', aspectRatio, backgroundColor: '#000' }}>
      {loading && (
        <View style={StyleSheet.absoluteFillObject.container}>
          <ActivityIndicator color="#e11d48" />
        </View>
      )}
      <Image 
        source={{ uri }} 
        style={{ width: '100%', height: '100%' }} 
        resizeMode="contain"
      />
    </View>
  );
};

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string, chapterId: string }>();
  const router = useRouter();
  
  const [pages, setPages] = useState<Page[]>([]);
  const [capitulo, setCapitulo] = useState<Capitulo | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado para mostrar/ocultar menús (superpuestos)
  const [uiVisible, setUiVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      try {
        const response = await api.get(`/api/chapters/${chapterId}/pages`);
        setPages(response.data.pages || []);
        setCapitulo(response.data.capitulo);
      } catch (err) {
        console.error('Error fetching pages:', err);
      } finally {
        setLoading(false);
      }
    }
    if (chapterId) fetchPages();
  }, [chapterId]);

  const toggleUi = () => {
    const toValue = uiVisible ? 0 : 1;
    Animated.timing(fadeAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setUiVisible(!uiVisible);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e11d48" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden={!uiVisible} />

      {/* Lista de páginas del manga */}
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PageImage uri={item.image_url} />}
        showsVerticalScrollIndicator={false}
        // Configuración para pre-carga fluida de lectura
        windowSize={5}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
      />

      {/* Área invisible para abrir el menú (zona central de la pantalla) */}
      <Pressable 
        style={styles.tapZone} 
        onPress={toggleUi} 
      />

      {/* Menús Superpuestos Animados */}
      <Animated.View style={[styles.headerMenu, { opacity: fadeAnim }]} pointerEvents={uiVisible ? 'auto' : 'none'}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.iconText}>←</Text>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Capítulo {capitulo?.numero}</Text>
          {capitulo?.titulo && <Text style={styles.headerSubtitle} numberOfLines={1}>{capitulo.titulo}</Text>}
        </View>
        <View style={styles.placeholderIcon} />
      </Animated.View>

      <Animated.View style={[styles.footerMenu, { opacity: fadeAnim }]} pointerEvents={uiVisible ? 'auto' : 'none'}>
        <Pressable 
          style={[styles.navButton, !capitulo?.prev_chapter_id && styles.disabledButton]}
          disabled={!capitulo?.prev_chapter_id}
          onPress={() => router.replace(`/manga/${id}/chapter/${capitulo?.prev_chapter_id}`)}
        >
          <Text style={styles.navText}>← Anterior</Text>
        </Pressable>

        <Pressable 
          style={[styles.navButton, !capitulo?.next_chapter_id && styles.disabledButton]}
          disabled={!capitulo?.next_chapter_id}
          onPress={() => router.replace(`/manga/${id}/chapter/${capitulo?.next_chapter_id}`)}
        >
          <Text style={styles.navText}>Siguiente →</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  tapZone: {
    position: 'absolute',
    top: '25%',
    bottom: '25%',
    left: '20%',
    right: '20%',
    zIndex: 10,
  },
  headerMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(10,10,12,0.95)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    paddingRight: 15,
  },
  iconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  placeholderIcon: {
    width: 28, // Para centrar el título con el botón de atrás
  },
  footerMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(10,10,12,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 20,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.3,
  },
  navText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
