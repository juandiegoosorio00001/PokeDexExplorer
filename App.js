import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchPokemonByQuery, fetchPokemonPage } from './src/services/pokemonApi';
import PokemonDetail from './src/components/PokemonDetail';

function PokemonCard({ pokemon, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${pokemon.name}`}
      onPress={onPress}
      style={styles.card}
    >
      <Image source={{ uri: pokemon.imageUrl }} style={styles.pokemonImage} />
      <Text style={styles.number}>#{String(pokemon.id).padStart(3, '0')}</Text>
      <Text style={styles.name}>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</Text>
    </Pressable>
  );
}

export default function App() {
  // useState guarda los datos y los estados de carga y error de la pantalla.
  const [pokemon, setPokemon] = useState([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listError, setListError] = useState(null);
  const [paginationError, setPaginationError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const isLoadingMoreRef = useRef(false);
  const isSearchingRef = useRef(false);

  // useEffect inicia la petición al montar la pantalla y al solicitar un reintento.
  useEffect(() => {
    let isActive = true;

    async function loadPokemon() {
      setIsLoading(true);
      setListError(null);

      try {
        const page = await fetchPokemonPage(0);
        if (isActive) {
          setPokemon(page.pokemon);
          setNextOffset(page.nextOffset);
          setHasMore(page.hasMore);
        }
      } catch {
        if (isActive) setListError('No se pudieron cargar los Pokémon. Revisa tu conexión e inténtalo de nuevo.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadPokemon();
    return () => {
      isActive = false;
    };
  }, [retryCount]);

  async function loadMorePokemon(isRetry = false) {
    if (isLoadingMoreRef.current || !hasMore || (paginationError && !isRetry) || isSearchMode) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setPaginationError(false);

    try {
      const page = await fetchPokemonPage(nextOffset);
      setPokemon((currentPokemon) => {
        // El Set elimina IDs ya cargados y repetidos dentro de la página nueva.
        const existingIds = new Set(currentPokemon.map((item) => item.id));
        const newPokemon = page.pokemon.filter((item) => {
          const isNewPokemon = !existingIds.has(item.id);
          existingIds.add(item.id);
          return isNewPokemon;
        });
        return [...currentPokemon, ...newPokemon];
      });
      setNextOffset(page.nextOffset);
      setHasMore(page.hasMore);
    } catch {
      // Se conservan las tarjetas actuales y el mismo offset para poder reintentar esta página.
      setPaginationError(true);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }

  async function handleSearch() {
    if (isSearchingRef.current) return;

    const normalizedQuery = searchText.trim().toLowerCase();
    setIsSearchMode(true);
    setSearchResult(null);
    setSearchError(null);

    if (!normalizedQuery) {
      setSearchError('Escribe un nombre o número para buscar un Pokémon.');
      return;
    }
    isSearchingRef.current = true;
    setIsSearching(true);
    try {
      const result = await fetchPokemonByQuery(normalizedQuery);
      setSearchResult(result);
    } catch (error) {
      if (error.status === 404) {
        setSearchError('No se encontró ningún Pokémon con ese nombre o número.');
      } else {
        setSearchError('No se pudo realizar la búsqueda. Revisa tu conexión e inténtalo de nuevo.');
      }
    } finally {
      isSearchingRef.current = false;
      setIsSearching(false);
    }
  }

  function returnToList() {
    setIsSearchMode(false);
    setSearchResult(null);
    setSearchError(null);
  }

  return (
    <View style={styles.container}>
      {selectedPokemon ? (
        <PokemonDetail
          key={selectedPokemon.id}
          pokemon={selectedPokemon}
          onBack={() => setSelectedPokemon(null)}
        />
      ) : (
        <>
          <Text style={styles.title}>PokéDex Explorer</Text>
          <View style={styles.searchRow}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholder="Busca por nombre o número..."
              returnKeyType="search"
              autoCapitalize="none"
              style={styles.searchInput}
            />
            <Pressable style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
              <Text style={styles.searchButtonText}>Buscar</Text>
            </Pressable>
          </View>
          {isLoading ? (
            <View style={styles.messageContainer}>
              <ActivityIndicator size="large" color="#d62828" />
              <Text style={styles.message}>Cargando Pokémon...</Text>
            </View>
          ) : listError && !isSearchMode ? (
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{listError}</Text>
              <Pressable style={styles.retryButton} onPress={() => setRetryCount((count) => count + 1)}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : isSearchMode ? (
            <View style={styles.searchResults}>
              <Pressable style={styles.backButton} onPress={returnToList}>
                <Text style={styles.backButtonText}>Volver al listado completo</Text>
              </Pressable>
              {isSearching ? (
                <View style={styles.messageContainer}>
                  <ActivityIndicator size="large" color="#d62828" />
                  <Text style={styles.message}>Buscando Pokémon...</Text>
                </View>
              ) : searchError ? (
                <Text style={styles.message}>{searchError}</Text>
              ) : searchResult ? (
                <View style={styles.singleResult}>
                  <PokemonCard pokemon={searchResult} onPress={() => setSelectedPokemon(searchResult)} />
                </View>
              ) : null}
            </View>
          ) : (
            // FlatList representa una colección de datos con renderizado eficiente y dos columnas.
            <FlatList
              data={pokemon}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => <PokemonCard pokemon={item} onPress={() => setSelectedPokemon(item)} />}
              onEndReached={() => loadMorePokemon()}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerMessage}>
                    <ActivityIndicator color="#d62828" />
                    <Text style={styles.message}>Cargando más Pokémon...</Text>
                  </View>
                ) : paginationError ? (
                  <View style={styles.footerMessage}>
                    <Text style={styles.message}>No se pudieron cargar más Pokémon.</Text>
                    <Pressable style={styles.retryButton} onPress={() => loadMorePokemon(true)}>
                      <Text style={styles.retryButtonText}>Reintentar</Text>
                    </Pressable>
                  </View>
                ) : !hasMore ? (
                  <Text style={styles.endMessage}>No hay más Pokémon para mostrar.</Text>
                ) : null
              }
            />
          )}
        </>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 56,
  },
  title: {
    color: '#202124',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#d62828',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    width: '48%',
  },
  pokemonImage: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  number: {
    color: '#777',
    fontSize: 13,
    marginTop: 4,
  },
  name: {
    color: '#202124',
    fontSize: 17,
    fontWeight: '600',
    marginTop: 2,
  },
  messageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  message: {
    color: '#444',
    fontSize: 16,
    marginTop: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#d62828',
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#b51f1f',
    fontSize: 15,
    fontWeight: '600',
  },
  singleResult: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerMessage: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  endMessage: {
    color: '#777',
    paddingVertical: 18,
    textAlign: 'center',
  },
});
