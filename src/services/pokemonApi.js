const POKEMON_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const OFFICIAL_ARTWORK_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

function createPokemonCardData(item) {
  const id = item.id ?? Number(item.url.match(/\/(\d+)\/?$/)?.[1]);

  return {
    id,
    name: item.name,
    imageUrl: `${OFFICIAL_ARTWORK_URL}/${id}.png`,
  };
}

async function fetchJson(url) {
  // fetch realiza la petición HTTP; async/await permite esperar la respuesta de forma legible.
  const response = await fetch(url);

  // Se comprueba response.ok antes de intentar leer el JSON.
  if (!response.ok) {
    const error = new Error(`PokéAPI respondió con el estado ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function fetchPokemonPage(offset = 0) {
  const data = await fetchJson(`${POKEMON_API_URL}?limit=20&offset=${offset}`);

  return {
    pokemon: data.results.map(createPokemonCardData),
    hasMore: data.next !== null,
    nextOffset: offset + data.results.length,
  };
}

export async function fetchPokemonByQuery(query) {
  // Se normaliza el valor para que espacios externos y mayúsculas no afecten la búsqueda.
  const normalizedQuery = query.trim().toLowerCase();
  const data = await fetchJson(`${POKEMON_API_URL}/${encodeURIComponent(normalizedQuery)}`);

  return createPokemonCardData(data);
}

export async function fetchPokemonDetails(identifier) {
  const data = await fetchJson(`${POKEMON_API_URL}/${encodeURIComponent(String(identifier).trim().toLowerCase())}`);

  return {
    id: data.id,
    name: data.name,
    height: data.height,
    weight: data.weight,
    imageUrl: data.sprites?.other?.['official-artwork']?.front_default ?? null,
    types: data.types.map(({ type }) => type.name),
    stats: data.stats.map(({ base_stat, stat }) => ({
      name: stat.name,
      value: base_stat,
    })),
  };
}
