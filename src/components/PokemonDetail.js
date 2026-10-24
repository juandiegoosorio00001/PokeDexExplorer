import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchPokemonDetails } from '../services/pokemonApi';

const TYPE_LABELS = {
  normal: 'Normal',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  ice: 'Hielo',
  fighting: 'Lucha',
  poison: 'Veneno',
  ground: 'Tierra',
  flying: 'Volador',
  psychic: 'Psíquico',
  bug: 'Bicho',
  rock: 'Roca',
  ghost: 'Fantasma',
  dragon: 'Dragón',
  dark: 'Siniestro',
  steel: 'Acero',
  fairy: 'Hada',
};

const TYPE_COLORS = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  grass: '#7AC74C',
  electric: '#F7D02C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const STAT_LABELS = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'Ataque especial',
  'special-defense': 'Defensa especial',
  speed: 'Velocidad',
};

function formatMeasure(value) {
  return (value / 10).toFixed(1);
}

function StatRow({ stat }) {
  // Calcula el porcentaje respecto al máximo 255 y lo limita entre 0 % y 100 %.
  const percentage = Math.min(Math.max((stat.value / 255) * 100, 0), 100);

  return (
    <View style={styles.statRow}>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{STAT_LABELS[stat.name] ?? stat.name}</Text>
        <Text style={styles.statValue}>{stat.value}</Text>
      </View>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

export default function PokemonDetail({ pokemon, onBack }) {
  // useState mantiene los datos completos y los estados de carga y error.
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // useEffect consulta la ficha al seleccionar un Pokémon y al solicitar un reintento.
  useEffect(() => {
    let isActive = true;
    setDetails(null);
    setError(false);
    setImageFailed(false);
    setIsLoading(true);

    async function loadDetails() {
      try {
        const result = await fetchPokemonDetails(pokemon.id);
        if (isActive) setDetails(result);
      } catch {
        if (isActive) setError(true);
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      // Ignora la respuesta tardía si la ficha se cerró o cambió de Pokémon.
      isActive = false;
    };
  }, [pokemon.id, retryCount]);

  const imageUrl = details?.imageUrl || pokemon.imageUrl;
  const displayName = details?.name ?? pokemon.name;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹  Volver a la lista</Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#d62828" />
          <Text style={styles.message}>Cargando información del Pokémon...</Text>
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>No se pudo cargar la información del Pokémon.</Text>
          <Pressable style={styles.retryButton} onPress={() => setRetryCount((count) => count + 1)}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : details ? (
        <>
          <View style={styles.hero}>
            <Text style={styles.number}>#{String(details.id).padStart(3, '0')}</Text>
            <Text style={styles.name}>{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</Text>
            {imageFailed ? (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Imagen no disponible</Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.pokemonImage}
                onError={() => setImageFailed(true)}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipos</Text>
            <View style={styles.typeList}>
              {details.types.map((type) => (
                <View key={type} style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[type] ?? '#777' }]}>
                  <Text style={styles.typeText}>{TYPE_LABELS[type] ?? type}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.measureRow}>
            <View style={styles.measureCard}>
              <Text style={styles.measureLabel}>Altura</Text>
              <Text style={styles.measureValue}>{formatMeasure(details.height)} m</Text>
            </View>
            <View style={styles.measureCard}>
              <Text style={styles.measureLabel}>Peso</Text>
              <Text style={styles.measureValue}>{formatMeasure(details.weight)} kg</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estadísticas base</Text>
            {details.stats.map((stat) => <StatRow key={stat.name} stat={stat} />)}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#b51f1f',
    fontSize: 16,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginTop: 8,
    padding: 20,
  },
  number: {
    color: '#737373',
    fontSize: 16,
    fontWeight: '600',
  },
  name: {
    color: '#202124',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 4,
  },
  pokemonImage: {
    height: 230,
    marginTop: 8,
    width: 230,
  },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 16,
    height: 230,
    justifyContent: 'center',
    marginTop: 8,
    width: 230,
  },
  placeholderText: {
    color: '#666',
    fontSize: 15,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    color: '#202124',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 14,
  },
  typeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeBadge: {
    borderRadius: 18,
    minWidth: 88,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  measureRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  measureCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    flex: 1,
    padding: 16,
  },
  measureLabel: {
    color: '#777',
    fontSize: 14,
  },
  measureValue: {
    color: '#202124',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  statRow: {
    marginBottom: 14,
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    color: '#444',
    fontSize: 14,
  },
  statValue: {
    color: '#202124',
    fontSize: 14,
    fontWeight: '700',
  },
  statTrack: {
    backgroundColor: '#e6e6e6',
    borderRadius: 6,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  statFill: {
    backgroundColor: '#d62828',
    borderRadius: 6,
    height: '100%',
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    paddingHorizontal: 20,
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
});
