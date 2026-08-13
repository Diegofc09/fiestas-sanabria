# Rediseño oscuro neón + feed visual tipo Instagram

Transformación de FiestasSanabria de "revista editorial en crema" a plataforma nocturna de descubrimiento de fiestas y eventos, con feed visual en cuadrícula/masonry, fondo morado medianoche → negro y acentos neón (morado, cian, rosa).

## 1. Nuevo sistema visual (tema oscuro)

- Reemplazar la paleta clara de `src/styles.css` por una oscura: fondo degradado morado medianoche a negro azabache, superficies de tarjeta casi negras translúcidas, texto blanco/cian claro.
- Nuevos tokens semánticos: `--neon-violet`, `--neon-cyan`, `--neon-pink`, más gradientes y sombras de resplandor (`--glow-violet`, `--glow-cyan`, `--glow-pink`, `--shadow-neon`).
- Semáforo de fases del evento (sin empezar / en curso / terminada) recalibrado a versiones neón (ámbar, verde lima, rojo-rosa) para que siga leyéndose sobre fondo oscuro.
- Tipografía: titulares en sans audaz (Space Grotesk) y texto secundario en sans ligera (DM Sans), cargadas con `<link>` en la ruta raíz. El serif editorial se retira de la interfaz; el cuerpo del artículo mantiene una tipografía de lectura cómoda pero en versión clara sobre oscuro.
- Utilidades nuevas: `glow-hover`, `neon-border`, `glass-card` para reusar los efectos en toda la app.

## 2. Header con buscador

- Rediseño de `Header.tsx`: barra de búsqueda prominente y centrada con borde neón brillante y placeholder "Buscar fiestas, eventos,publicidad...".
- A la derecha: botón minimalista de menú/perfil (hamburguesa) que abre un panel deslizante con las secciones (Inicio, Fiestas, Eventos, Noticias, Otros, Calendario) y el acceso de administración.
- La búsqueda filtra el feed por palabras clave en título, entradilla y categoría (búsqueda en cliente sobre las publicaciones ya cargadas, instantánea y sin recargas). En móvil el buscador ocupa el ancho completo bajo el logo.

## 3. Feed visual tipo Instagram

- La portada (`src/routes/index.tsx`) pasa de jerarquía editorial (lead + filas) a un feed en cuadrícula responsive: 1 columna en móvil, 2 en tablet, 3-4 en escritorio, con alturas variables tipo masonry para las piezas destacadas.
- Chips de filtro rápido por categoría y por fase del evento, sobre el feed.
- Nuevo componente `FeedCard`:
  - Imagen del evento a sangre con tinte/borde neón y zoom suave al hover.
  - Superposición breve: título corto, fecha y ubicación (se usa la categoría cuando no hay ubicación explícita), en blanco neón o cian claro.
  - Fila de iconos minimalistas neón bajo la imagen: corazón (Me gusta), avión de papel (Compartir) y marcador (Guardar), con contador de asistentes y de comentarios ya existentes.
  - Resplandor neón suave alrededor de la tarjeta, intensificado al pasar el cursor.
- "Me gusta" y "Guardar" se resuelven en el propio dispositivo del visitante (persistencia local), sin cambios de base de datos; "Compartir" usa el compartir nativo del móvil con copia de enlace como alternativa.
- Las páginas de categoría (`CategoryPage`) reutilizan el mismo feed.

## 4. Coherencia en el resto del sitio

- Artículo, calendario, autenticación, panel de administración, pie de página y estados vacíos se adaptan al tema oscuro y a la nueva tipografía, sin cambiar su funcionalidad ni la lógica de datos.
- El calendario conserva los puntos de color del semáforo, con brillo neón.
- Se mantienen intactos: comentarios y valoración por estrellas, contador de asistencia, filtro antispam/insultos, códigos de suscriptor, analíticas y ciclo de vida de eventos.

## 5. Detalles técnicos

- Solo cambios de presentación: `src/styles.css`, `src/routes/__root.tsx` (fuentes y fondo), `Header.tsx`, `Footer.tsx`, nuevo `src/components/site/FeedCard.tsx` (+ `FeedGrid`, `SearchBar`, `MenuPanel`), `src/routes/index.tsx`, `CategoryPage.tsx`, `articulo.$slug.tsx`, `calendario.tsx`, `auth.tsx` y estilos del panel admin.
- Sin migraciones, sin nuevas funciones de servidor, sin tocar RLS ni `posts.functions.ts` / `engagement.functions.ts`.
- Colores siempre mediante tokens de `styles.css`; nada de clases de color fijas en componentes.
- Se revisa el resultado en móvil y escritorio con capturas del navegador antes de cerrar.