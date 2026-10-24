# PokéDex Explorer

PokéDex Explorer es una aplicación académica móvil para explorar Pokémon con datos de la API pública [PokéAPI](https://pokeapi.co/api/v2/). Permite recorrer un listado, buscar por nombre o número y consultar la ficha de cada Pokémon.

## Tecnologías

- JavaScript (código de la aplicación).
- React 19.3.0.
- React Native 0.88.0.
- Expo SDK 58 (`expo` `^58.0.0`).
- Expo Status Bar (`expo-status-bar` `~58.0.4`).
- React Native Safe Area Context (`react-native-safe-area-context` `~5.10.1`).
- PokéAPI para los datos y las imágenes oficiales de Pokémon.

La aplicación usa componentes incluidos en React Native, como `FlatList`, `TextInput`, `Pressable`, `Image` y `ScrollView`. No usa una librería adicional de navegación: la pantalla de detalle se controla mediante estado de React.

## Instalación y ejecución

Requisitos: Node.js compatible con Expo SDK 58, npm y una versión de Expo Go compatible con SDK 58 si se ejecuta en un dispositivo móvil.

Desde la carpeta raíz del proyecto:

```bash
npm install
npm run start
```

El servidor de Expo muestra un código QR. Escanéalo con Expo Go para abrir la aplicación. El proyecto también define estos comandos:

```bash
npm run android
npm run ios
npm run web
```

## Funcionalidades

- Muestra los primeros 20 Pokémon en una cuadrícula de dos columnas.
- Presenta en cada tarjeta el arte oficial, el número con tres dígitos y el nombre capitalizado.
- Busca un Pokémon por nombre o número al pulsar **Buscar**. La búsqueda ignora mayúsculas y espacios al inicio y al final.
- Carga páginas sucesivas de 20 Pokémon al acercarse al final de la lista, evita IDs duplicados y ofrece reintentar si falla una página.
- Abre una ficha al pulsar una tarjeta, tanto en el listado como en el resultado de búsqueda.
- Permite volver a la lista sin descartar el estado de búsqueda ni los Pokémon ya cargados.
- Presenta estados de carga, error, reintento y búsqueda sin resultados.

## Consumo de PokéAPI

Las peticiones HTTP están separadas de los componentes visuales en `src/services/pokemonApi.js`. El servicio usa `fetch` con `async/await` y comprueba `response.ok` antes de procesar el JSON.

### Listado y paginación

El listado solicita páginas usando `limit=20` y un `offset` que avanza después de cada respuesta:

```text
GET https://pokeapi.co/api/v2/pokemon?limit=20&offset=0
GET https://pokeapi.co/api/v2/pokemon?limit=20&offset=20
```

`App.js` inicia la primera página al montar la pantalla. `FlatList` usa `numColumns={2}` y su callback `onEndReached` solicita la página siguiente. La respuesta de PokéAPI contiene `next`; cuando es `null`, no se solicitan más páginas. Antes de añadir resultados, la aplicación filtra IDs ya presentes y repetidos dentro de la nueva página.

### Búsqueda

La búsqueda solo se ejecuta al pulsar **Buscar** o enviar el campo desde el teclado. El término se normaliza con `trim()` y `toLowerCase()`, y se envía como nombre o número al endpoint individual:

```text
GET https://pokeapi.co/api/v2/pokemon/{nombre-o-id}
```

Una búsqueda vacía muestra un mensaje sin hacer una petición. Si PokéAPI responde con HTTP 404, la interfaz informa que no encontró el Pokémon. El botón **Volver al listado completo** conserva la lista paginada.

### Ficha de detalle

Al pulsar una tarjeta, la aplicación solicita el Pokémon por ID con el mismo endpoint individual. La ficha muestra el nombre, número, imagen oficial y todos sus tipos traducidos al español y diferenciados por color. La API entrega `height` en decímetros y `weight` en hectogramos; la interfaz divide cada valor entre 10 para mostrarlos en metros y kilogramos. También presenta las seis estadísticas de `stats` con sus valores originales y barras calculadas respecto a un máximo de 255, limitadas al intervalo de 0 % a 100 %.

La ficha tiene estados de carga, error con botón para reintentar y un mensaje de respaldo si la imagen no está disponible. El control de estado de la petición evita que una respuesta tardía actualice una ficha que ya se cerró.

## Estructura del proyecto

```text
pokedex-explorer/
├── assets/
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
├── evidencias/
│   ├── BusquedaPokemonNumero.jpeg
│   ├── CargaDelFinal.jpeg
│   ├── FichaDePokemon.jpeg
│   ├── FiltroPokemonNombre.jpeg
│   └── PaginaPrincipal.jpeg
├── src/
│   ├── components/
│   │   └── PokemonDetail.js
│   └── services/
│       └── pokemonApi.js
├── .gitignore
├── App.js
├── app.json
├── index.js
├── LICENSE
├── package.json
├── package-lock.json
└── README.md
```

La carpeta `evidencias/` reúne capturas de la aplicación. `node_modules/` contiene dependencias instaladas; `.expo/` contiene archivos generados por Expo. La entrega excluye ambas carpetas, al igual que `AGENTS.md` y `.claude/settings.json`, que son ajustes/instrucciones locales y no se necesitan para ejecutar la aplicación.

## Responsabilidad de cada archivo

- `App.js`: pantalla principal; administra el listado, búsqueda, paginación y selección para abrir/cerrar el detalle. También define la tarjeta reutilizada en el listado y en los resultados de búsqueda.
- `src/components/PokemonDetail.js`: solicita y presenta los datos detallados, los tipos traducidos, las medidas, las estadísticas y sus estados de carga/error.
- `src/services/pokemonApi.js`: centraliza las peticiones a PokéAPI, comprueba las respuestas HTTP y adapta los datos para la interfaz.
- `index.js`: registra `App` como componente raíz de Expo.
- `app.json`: configura nombre, orientación, iconos y otros ajustes de Expo.
- `package.json`: declara las dependencias y los comandos npm del proyecto.
- `package-lock.json`: fija el árbol de dependencias instalado por npm.
- `.gitignore`: excluye dependencias, archivos generados y otros archivos locales del control de versiones.
- `.claude/settings.json`: ajustes locales de herramientas para el entorno de desarrollo.
- `AGENTS.md`: contiene instrucciones locales para el trabajo de desarrollo asistido en este repositorio.
- `LICENSE`: incluye la licencia distribuida con el proyecto.
- `assets/`: contiene los iconos de la aplicación, el favicon y los recursos de inicio.
- `evidencias/`: contiene capturas de la pantalla principal, búsqueda, paginación y ficha de detalle.
- `README.md`: explica el objetivo, la instalación, las funcionalidades, la API y la estructura del proyecto.
