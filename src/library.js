// @ts-check
// EXERCISE LIBRARY — datos puros, sin dependencias de React ni del DOM.
// Cada ejercicio lleva los metadatos que el generador usa para decidir solo:
// bloques compatibles, equipamiento, rango de intensidad (RPE 1-10), distancias
// permitidas, repeticiones, descansos, dificultad y notas de seguridad.

export const BLOCK_ORDER = /** @type {const} */ (['warmup', 'main', 'endurance']);

export const BLOCKS = {
  warmup: { id: 'warmup', name: 'Calentamiento', color: 'var(--aqua)' },
  main: { id: 'main', name: 'Bloque principal', color: 'var(--electric)' },
  endurance: { id: 'endurance', name: 'Resistencia', color: 'var(--ice)' },
};

export const EQUIPMENT = {
  board: { id: 'board', name: 'Tabla de natación', short: 'Tabla' },
  buoy: { id: 'buoy', name: 'Pull buoy / boya', short: 'Pull buoy' },
  paddles: { id: 'paddles', name: 'Palas / manoplas', short: 'Palas' },
  fins: { id: 'fins', name: 'Aletas', short: 'Aletas' },
  snorkel: { id: 'snorkel', name: 'Snorkel frontal', short: 'Snorkel' },
};
export const EQUIPMENT_ORDER = ['board', 'buoy', 'paddles', 'fins', 'snorkel'];

export const CATEGORIES = [
  { id: 'styles', name: 'Estilos completos', short: 'Estilos' },
  { id: 'arms', name: 'Ejercicios de brazos', short: 'Brazos' },
  { id: 'legs', name: 'Ejercicios de piernas', short: 'Pataleo' },
  { id: 'technique', name: 'Técnica', short: 'Técnica' },
  { id: 'speed', name: 'Velocidad', short: 'Velocidad' },
  { id: 'endurance', name: 'Resistencia', short: 'Resistencia' },
];

export const STROKES = {
  free: 'Crol',
  back: 'Espalda',
  breast: 'Braza',
  fly: 'Mariposa',
  im: 'Estilos (IM)',
  mixed: 'Mixto',
};

export const LEVELS = {
  beginner: { id: 'beginner', name: 'Principiante', n: 1 },
  intermediate: { id: 'intermediate', name: 'Intermedio', n: 2 },
  advanced: { id: 'advanced', name: 'Avanzado', n: 3 },
};
export const DIFFICULTY_LABEL = { 1: 'Principiante', 2: 'Intermedio', 3: 'Avanzado' };

const D = {
  equipmentRequired: [],
  equipmentOptional: [],
  noGearVariant: null,
  difficulty: 1,
  reps: [1, 4],
  rest: [15, 30],
  kind: 'steady',
  unitMult: 1,
  mistakes: [],
  safety: '',
  order: 2,
  blocks: ['main'],
  paddles: false,
};
const mk = (o) => ({ ...D, ...o });

const SAFE_SURFACE = 'Respirá con normalidad. Sin apnea ni largos subacuáticos.';

/** @type {import('./types').Exercise[]} */
export const EXERCISES = [
  // ───────────── ESTILOS COMPLETOS ─────────────
  mk({
    id: 'style-free', name: 'Crol / estilo libre', shortName: 'Crol', category: 'styles', stroke: 'free',
    desc: 'Estilo libre completo, el pilar de casi toda sesión.', muscle: 'Cuerpo completo · aeróbico',
    instructions: ['Brazada larga y relajada, codo alto en la recuperación.', 'Rotá hombros y cadera, la cabeza sigue al cuerpo.', 'Exhalá bajo el agua y respirá cada 2 o 3 brazadas.'],
    mistakes: ['Cruzar la mano por delante de la cabeza.', 'Levantar la cabeza para respirar y hundir las piernas.'],
    goal: 'Eficiencia y ritmo estable en crol.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter' },
    variants: [
      { id: 'easy', label: 'suave', blocks: ['warmup', 'main', 'endurance'], rpe: [2, 4], dist: [50, 100, 200, 300, 400], reps: [1, 2], rest: [10, 20], order: 0, note: 'Ritmo cómodo, podrías conversar. Concentrate en soltar el agua.' },
      { id: 'steady', label: 'continuo', blocks: ['main', 'endurance'], rpe: [5, 7], dist: [100, 200, 300, 400, 500, 600], reps: [1, 3], rest: [20, 40], order: 3, note: 'Ritmo aeróbico constante, la misma cadencia de principio a fin.' },
      { id: 'build', label: 'progresivo', blocks: ['main', 'endurance'], rpe: [4, 8], dist: [100, 200, 300], reps: [1, 2], rest: [20, 40], kind: 'build', order: 4, note: 'Cada 25 m un poco más rápido. Terminá fuerte pero con técnica.' },
      { id: 'tempo', label: 'a ritmo', blocks: ['main'], rpe: [7, 8], dist: [50, 100, 200], reps: [2, 6], rest: [20, 40], order: 4.5, note: 'Ritmo de competición sostenido. Controlá la respiración.' },
    ],
  }),
  mk({
    id: 'style-back', name: 'Espalda', shortName: 'Espalda', category: 'styles', stroke: 'back', difficulty: 1,
    desc: 'Espalda completa: cuerpo plano, mirada al techo.', muscle: 'Dorsales · hombros · core',
    instructions: ['Cadera alta, cuerpo alineado en la superficie.', 'La mano entra con el meñique primero, brazo estirado.', 'Patada continua desde la cadera, rodillas casi sin salir.'],
    mistakes: ['Sentarse en el agua con la cadera caída.', 'Entrar con la palma hacia afuera.'],
    goal: 'Posición y rotación en espalda.',
    art: { pose: 'supine', arms: 'backcrawl', legs: 'flutter' },
    variants: [
      { id: 'easy', label: 'suave', blocks: ['warmup', 'main', 'endurance'], rpe: [2, 4], dist: [50, 100, 200], reps: [1, 2], rest: [10, 20], order: 0, note: 'Ritmo cómodo, respiración libre.' },
      { id: 'steady', label: 'continua', blocks: ['main', 'endurance'], rpe: [5, 7], dist: [100, 200, 300], reps: [1, 3], rest: [20, 40], order: 3, note: 'Cadencia estable, hombros relajados.' },
      { id: 'build', label: 'progresiva', blocks: ['main', 'endurance'], rpe: [4, 7], dist: [100, 200], reps: [1, 2], rest: [20, 40], kind: 'build', order: 4, note: 'Aumentá la frecuencia cada 25 m.' },
    ],
  }),
  mk({
    id: 'style-breast', name: 'Pecho / braza', shortName: 'Braza', category: 'styles', stroke: 'breast', difficulty: 2,
    desc: 'Braza completa: tirón, patada y deslizamiento.', muscle: 'Pecho · aductores · cuádriceps',
    instructions: ['Tirón corto, codos por delante de los hombros.', 'Patada simultánea y deslizá estirado un segundo.', 'La cabeza vuelve al agua antes que las manos se estiren.'],
    mistakes: ['Patada demasiado ancha.', 'Levantar demasiado los hombros al respirar.'],
    goal: 'Coordinar tirón, patada y deslizamiento.',
    art: { pose: 'breast', arms: 'sweep', legs: 'frog' },
    variants: [
      { id: 'easy', label: 'suave', blocks: ['warmup', 'main', 'endurance'], rpe: [2, 4], dist: [50, 100], reps: [1, 2], rest: [10, 25], order: 0, note: 'Ritmo cómodo, deslizá bien entre brazadas.' },
      { id: 'steady', label: 'continua', blocks: ['main', 'endurance'], rpe: [5, 7], dist: [100, 200], reps: [1, 3], rest: [20, 40], order: 3, note: 'Cadencia regular, sin acelerar la patada.' },
      { id: 'build', label: 'progresiva', blocks: ['main', 'endurance'], rpe: [4, 7], dist: [100, 200], reps: [1, 2], rest: [20, 40], kind: 'build', order: 4, note: 'Subí la frecuencia cada 50 m.' },
    ],
  }),
  mk({
    id: 'style-fly', name: 'Mariposa', shortName: 'Mariposa', category: 'styles', stroke: 'fly', difficulty: 3,
    desc: 'Mariposa completa en tramos cortos.', muscle: 'Hombros · core · glúteos',
    safety: 'Tramos cortos y con descanso. Parar si se pierde la técnica.',
    instructions: ['Dos patadas de delfín por ciclo de brazos.', 'Entrada de manos a la anchura de hombros, pecho que se hunde.', 'Respirá cada 1 o 2 ciclos mirando al frente-abajo.'],
    mistakes: ['Levantar la cabeza demasiado.', 'Brazada sin patada de entrada.'],
    goal: 'Ondulación y ritmo en mariposa.',
    art: { pose: 'fly', arms: 'fly', legs: 'dolphin' },
    reps: [2, 8], rest: [20, 40],
    variants: [
      { id: 'easy', label: 'suave', blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50], reps: [2, 6], rest: [20, 35], order: 0.5, note: 'Tramos cortos, ritmo cómodo.' },
      { id: 'steady', label: 'controlada', blocks: ['main'], rpe: [6, 8], dist: [25, 50], reps: [2, 8], rest: [25, 45], order: 3.5, note: 'Mantené la técnica; si decae, frená.' },
    ],
  }),
  mk({
    id: 'style-im', name: 'Estilos combinados (IM)', shortName: 'IM', category: 'styles', stroke: 'im', difficulty: 2, unitMult: 4,
    desc: 'Mariposa, espalda, braza y crol en un mismo tramo.', muscle: 'Cuerpo completo · coordinación',
    safety: 'Cada estilo ocupa 1/4 del tramo, que debe ser múltiplo exacto de 4 largos.',
    instructions: ['Orden: mariposa, espalda, braza y crol.', 'Transiciones limpias en cada pared.', 'Dividí el tramo en cuatro partes iguales.'],
    mistakes: ['Saltarse la técnica de viraje entre estilos.', 'Salir demasiado rápido en mariposa.'],
    goal: 'Variedad y resistencia con todos los estilos.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'im' },
    variants: [
      { id: 'easy', label: 'suave', blocks: ['warmup', 'main'], rpe: [3, 5], dist: [100, 200], reps: [1, 2], rest: [15, 30], order: 1, note: 'Ritmo cómodo; usá el crol para recuperar.' },
      { id: 'steady', label: 'continuo', blocks: ['main', 'endurance'], rpe: [5, 7], dist: [100, 200, 400], reps: [1, 3], rest: [25, 45], order: 3, note: 'Mantené la técnica en los cuatro estilos.' },
    ],
  }),

  // ───────────── EJERCICIOS DE BRAZOS ─────────────
  mk({
    id: 'arms-pull-free', name: 'Solo brazos de crol con pull buoy', shortName: 'Brazos con pull buoy', category: 'arms', stroke: 'free',
    equipmentRequired: ['buoy'],
    noGearVariant: { suffix: ' (sin boya)', note: 'Sin pull buoy: patada mínima de dos tiempos y sin empujar con las piernas.' },
    desc: 'Aísla la tracción: las piernas descansan sobre la boya.', muscle: 'Dorsales · tríceps · hombros',
    blocks: ['warmup', 'main', 'endurance'], rpe: [3, 7], dist: [50, 100, 200, 300], reps: [1, 4], rest: [15, 30], order: 2,
    instructions: ['Pull buoy entre los muslos, piernas quietas.', 'Codo alto en la tracción.', 'Empujá el agua hasta la cadera.'],
    mistakes: ['Pelear con el cuerpo para mantener la boya.', 'Tirar con el brazo estirado.'],
    goal: 'Mejorar tracción y técnica de brazada.',
    art: { pose: 'prone', arms: 'crawl', legs: 'still', eq: ['buoy'] },
  }),
  mk({
    id: 'arms-pull-back', name: 'Solo brazos de espalda', shortName: 'Brazos de espalda', category: 'arms', stroke: 'back', difficulty: 2,
    equipmentOptional: ['buoy'],
    desc: 'Brazada de espalda con piernas quietas o con boya.', muscle: 'Dorsales · hombros',
    blocks: ['warmup', 'main'], rpe: [3, 6], dist: [50, 100], reps: [1, 4], rest: [15, 30], order: 2,
    instructions: ['Piernas relajadas, cadera alta.', 'Brazo recto en la recuperación, entrada con el meñique.', 'Rotá los hombros en cada brazada.'],
    mistakes: ['Dejar caer las piernas.', 'Brazadas cortas y apuradas.'],
    goal: 'Tracción y rotación en espalda.',
    art: { pose: 'supine', arms: 'backcrawl', legs: 'still' },
  }),
  mk({
    id: 'arms-paddles', name: 'Crol con palas', shortName: 'Crol con palas', category: 'arms', stroke: 'free', difficulty: 2, paddles: true,
    equipmentRequired: ['paddles'],
    noGearVariant: { suffix: ' (puños cerrados)', note: 'Sin palas: nadá con los puños cerrados para sentir el antebrazo.' },
    desc: 'Más superficie de agarre: fuerza y sensibilidad.', muscle: 'Dorsales · hombros · antebrazos',
    safety: 'Las palas cargan el hombro: empezá suave y no las uses con dolor.',
    blocks: ['main', 'endurance'], rpe: [5, 8], dist: [50, 100, 200], reps: [2, 6], rest: [15, 30], order: 3,
    instructions: ['Entrada limpia, mano delante del hombro.', 'Apoyá la pala y tirá con el antebrazo vertical.', 'Frecuencia más baja que sin palas.'],
    mistakes: ['Tirar con el brazo estirado y cargar el hombro.', 'Palas flojas que se mueven.'],
    goal: 'Fuerza de tracción y sensación de agarre.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', eq: ['paddles'] },
  }),
  mk({
    id: 'arms-pull-paddles', name: 'Crol con pull buoy y palas', shortName: 'Pull buoy y palas', category: 'arms', stroke: 'free', difficulty: 3, paddles: true,
    equipmentRequired: ['buoy', 'paddles'],
    desc: 'Máxima carga de brazos, piernas fuera del trabajo.', muscle: 'Dorsales · hombros · antebrazos',
    safety: 'Alta carga en hombros: tramos moderados y bien recuperados.',
    blocks: ['main'], rpe: [5, 8], dist: [100, 200], reps: [1, 4], rest: [20, 35], order: 3,
    instructions: ['Boya firme, palas bien sujetas.', 'Respiración bilateral para equilibrar el cuerpo.', 'Mantené la brazada larga aunque cueste.'],
    mistakes: ['Subir demasiado la frecuencia.', 'Hacerlo con molestia en el hombro.'],
    goal: 'Fuerza específica de tracción.',
    art: { pose: 'prone', arms: 'crawl', legs: 'still', eq: ['buoy', 'paddles'] },
  }),
  mk({
    id: 'arms-one-arm', name: 'Crol con un solo brazo', shortName: 'Un solo brazo', category: 'arms', stroke: 'free', difficulty: 2,
    desc: 'Un brazo traccionando, el otro quieto junto al cuerpo.', muscle: 'Dorsales · core',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [50, 100], reps: [2, 6], rest: [15, 25], order: 2,
    instructions: ['Brazo pasivo pegado al muslo.', 'Cambiá de brazo cada largo.', 'Patada firme para mantener la cadera.'],
    mistakes: ['Dejar que el cuerpo se tuerza.', 'Tirar sin rotar.'],
    goal: 'Tracción independiente de cada brazo.',
    art: { pose: 'prone', arms: 'onearm', legs: 'flutter' },
  }),
  mk({
    id: 'arms-catch', name: 'Crol con énfasis en agarre', shortName: 'Énfasis en agarre', category: 'arms', stroke: 'free', difficulty: 2,
    equipmentOptional: ['paddles'],
    desc: 'Buscar el apoyo temprano con el antebrazo vertical.', muscle: 'Dorsales · antebrazos',
    blocks: ['warmup', 'main'], rpe: [3, 6], dist: [50, 100], reps: [2, 6], rest: [15, 25], order: 2,
    instructions: ['Estirá el brazo y flexioná la muñeca y el codo bajo el agua.', 'Antebrazo vertical antes de tirar.', 'Tirón largo hasta el muslo.'],
    mistakes: ['Tirar con el brazo caído.', 'Acelerar sin apoyo.'],
    goal: 'Sensación de agarre (early vertical forearm).',
    art: { pose: 'prone', arms: 'catch', legs: 'flutter' },
  }),
  mk({
    id: 'arms-recovery', name: 'Crol con recuperación técnica', shortName: 'Recuperación técnica', category: 'arms', stroke: 'free',
    desc: 'Foco en la recuperación con codo alto y mano relajada.', muscle: 'Hombros · dorsales',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [50, 100], reps: [2, 6], rest: [15, 25], order: 2,
    instructions: ['Codo alto, mano relajada cerca del cuerpo.', 'Entrá por delante del hombro.', 'Mantené el brazo de tracción alargado.'],
    mistakes: ['Recuperar con el brazo recto.', 'Mano tensa.'],
    goal: 'Recuperación eficiente del brazo.',
    art: { pose: 'prone', arms: 'recovery', legs: 'flutter' },
  }),

  // ───────────── EJERCICIOS DE PIERNAS ─────────────
  mk({
    id: 'legs-board-free', name: 'Pataleo de crol con tabla', shortName: 'Pataleo con tabla', category: 'legs', stroke: 'free',
    equipmentRequired: ['board'], equipmentOptional: ['fins'],
    noGearVariant: { suffix: ' (sin tabla)', note: 'Sin tabla: pataleo en flecha con los brazos estirados y la cara en el agua.' },
    desc: 'Patada de crol apoyado en la tabla.', muscle: 'Cuádriceps · glúteos · core',
    blocks: ['warmup', 'main', 'endurance'], rpe: [3, 7], dist: [25, 50, 100, 200], reps: [1, 8], rest: [15, 30], order: 1,
    instructions: ['Patada desde la cadera, no desde la rodilla.', 'Tobillos sueltos y pies en punta.', 'Brazos estirados sobre la tabla, cara baja.'],
    mistakes: ['Pedalear con las rodillas muy dobladas.', 'Levantar la cabeza y hundir la cadera.'],
    goal: 'Activar piernas y mejorar la posición corporal.',
    art: { pose: 'prone', arms: 'extended', legs: 'flutter', eq: ['board'], splash: true },
  }),
  mk({
    id: 'legs-back', name: 'Pataleo de espalda', shortName: 'Pataleo de espalda', category: 'legs', stroke: 'back',
    equipmentOptional: ['fins'],
    desc: 'Patada en espalda con brazos estirados sobre la cabeza.', muscle: 'Cuádriceps · core',
    blocks: ['warmup', 'main', 'endurance'], rpe: [3, 7], dist: [25, 50, 100, 200], reps: [1, 8], rest: [15, 30], order: 1,
    instructions: ['Brazos estirados sobre la cabeza, una mano sobre la otra.', 'Cadera alta y patada pequeña y rápida.', 'Las rodillas apenas rompen la superficie.'],
    mistakes: ['Doblar mucho las rodillas.', 'Cadera caída.'],
    goal: 'Patada eficiente en espalda.',
    art: { pose: 'supine', arms: 'overhead', legs: 'flutter', splash: true },
  }),
  mk({
    id: 'legs-breast-board', name: 'Patada de braza con tabla', shortName: 'Patada de braza', category: 'legs', stroke: 'breast', difficulty: 2,
    equipmentRequired: ['board'],
    noGearVariant: { suffix: ' (sin tabla)', note: 'Sin tabla: patada de braza con los brazos estirados en flecha.' },
    desc: 'Patada de rana apoyado en la tabla.', muscle: 'Aductores · cuádriceps',
    blocks: ['warmup', 'main'], rpe: [3, 6], dist: [25, 50, 100], reps: [2, 8], rest: [20, 30], order: 1,
    instructions: ['Recogé los talones hacia los glúteos.', 'Pies en flexión hacia afuera.', 'Cerrá con un latigazo y deslizá.'],
    mistakes: ['Abrir demasiado las rodillas.', 'Patada sin pausa de deslizamiento.'],
    goal: 'Coordinar la patada de braza.',
    art: { pose: 'prone', arms: 'extended', legs: 'frog', eq: ['board'] },
  }),
  mk({
    id: 'legs-fly-supine', name: 'Patada de delfín boca arriba', shortName: 'Delfín boca arriba', category: 'legs', stroke: 'fly', difficulty: 2,
    equipmentOptional: ['fins'], safety: SAFE_SURFACE,
    desc: 'Ondulación desde el pecho y la cadera, en superficie.', muscle: 'Core · glúteos · isquios',
    blocks: ['warmup', 'main'], rpe: [3, 6], dist: [25, 50], reps: [2, 8], rest: [20, 30], order: 1,
    instructions: ['La onda nace en el pecho y baja por la cadera.', 'Respiración normal, sin apnea prolongada.', 'Brazos estirados sobre la cabeza.'],
    mistakes: ['Mover solo las rodillas.', 'Aguantar el aire.'],
    goal: 'Movimiento ondulatorio desde el tronco y la cadera.',
    art: { pose: 'supine', arms: 'overhead', legs: 'dolphin', wave: true },
  }),
  mk({
    id: 'legs-fly-prone', name: 'Patada de delfín en posición ventral', shortName: 'Delfín ventral', category: 'legs', stroke: 'fly', difficulty: 3,
    equipmentOptional: ['fins', 'snorkel', 'board'], safety: SAFE_SURFACE + ' Con snorkel podés respirar sin levantar la cabeza.',
    desc: 'Delfín boca abajo en superficie, brazos en flecha.', muscle: 'Core · glúteos · espalda baja',
    blocks: ['main'], rpe: [4, 7], dist: [25, 50], reps: [2, 8], rest: [25, 40], order: 1.2,
    instructions: ['Brazos estirados sobre la cabeza.', 'Empujá el pecho hacia abajo y dejá que la onda llegue a los pies.', 'Respirá al final de cada largo o cada dos ondas, sin forzar.'],
    mistakes: ['Patada con las rodillas.', 'Cabeza muy levantada.'],
    goal: 'Ondulación completa en posición ventral.',
    art: { pose: 'prone', arms: 'streamline', legs: 'dolphin', wave: true },
  }),
  mk({
    id: 'legs-side', name: 'Pataleo lateral', shortName: 'Pataleo lateral', category: 'legs', stroke: 'free', difficulty: 2,
    equipmentOptional: ['fins'],
    desc: 'Patada de lado con un brazo estirado.', muscle: 'Core · oblicuos · piernas',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50], reps: [2, 8], rest: [15, 25], order: 1,
    instructions: ['Cuerpo de lado, brazo inferior estirado.', 'Brazo de arriba apoyado en el muslo.', 'Mirada hacia abajo y al costado, respirando con calma.'],
    mistakes: ['Dejar caer la cadera.', 'Torcer la cabeza hacia arriba.'],
    goal: 'Control del eje y rotación.',
    art: { pose: 'prone', arms: 'side', legs: 'side', rotate: true },
  }),
  mk({
    id: 'legs-fins-free', name: 'Pataleo de crol con aletas', shortName: 'Pataleo con aletas', category: 'legs', stroke: 'free',
    equipmentRequired: ['fins'], equipmentOptional: ['board'],
    noGearVariant: { suffix: ' (sin aletas)', note: 'Sin aletas: pataleo normal, un poco más lento.' },
    desc: 'Patada de crol con aletas: más velocidad y flexibilidad de tobillo.', muscle: 'Cuádriceps · glúteos · tobillos',
    blocks: ['main', 'endurance'], rpe: [4, 7], dist: [50, 100, 200], reps: [2, 6], rest: [15, 30], order: 1,
    instructions: ['Patada amplia desde la cadera.', 'Dejá que la aleta haga parte del trabajo.', 'Cuerpo alineado, cara en el agua.'],
    mistakes: ['Patada solo desde las rodillas.', 'Apoyarse en la tabla con el cuerpo caído.'],
    goal: 'Potencia de piernas y flexibilidad de tobillo.',
    art: { pose: 'prone', arms: 'streamline', legs: 'flutter', eq: ['fins'], splash: true },
  }),
  mk({
    id: 'legs-fins-fly', name: 'Patada de delfín con aletas', shortName: 'Delfín con aletas', category: 'legs', stroke: 'fly', difficulty: 3,
    equipmentRequired: ['fins'], safety: SAFE_SURFACE,
    desc: 'Ondulación más amplia y veloz con aletas.', muscle: 'Core · glúteos · espalda baja',
    blocks: ['main'], rpe: [5, 8], dist: [25, 50], reps: [2, 8], rest: [20, 35], order: 2,
    instructions: ['Brazos estirados, ondulación desde el pecho.', 'Patada amplia, que el tobillo siga la onda.', 'Respirá con normalidad entre ondas.'],
    mistakes: ['Cortar la onda en las rodillas.', 'Aguantar la respiración.'],
    goal: 'Potencia de ondulación.',
    art: { pose: 'prone', arms: 'streamline', legs: 'dolphin', eq: ['fins'], wave: true },
  }),

  // ───────────── TÉCNICA ─────────────
  mk({
    id: 'drill-catchup', name: 'Crol catch-up', shortName: 'Catch-up', category: 'technique', stroke: 'free',
    desc: 'Una mano espera a la otra antes de tirar.', muscle: 'Coordinación · eficiencia',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50, 100], reps: [2, 6], rest: [10, 20], order: 1.5,
    instructions: ['Una mano queda estirada hasta que la otra la toca.', 'Deslizá un instante entre brazadas.', 'Patada suave y continua.'],
    mistakes: ['Soltar la mano de adelante antes de tiempo.', 'Frenar el cuerpo al esperar.'],
    goal: 'Alargar la brazada y mejorar el deslizamiento.',
    art: { pose: 'prone', arms: 'catchup', legs: 'flutter' },
  }),
  mk({
    id: 'drill-fingertip', name: 'Crol fingertip drag', shortName: 'Fingertip drag', category: 'technique', stroke: 'free',
    desc: 'Las yemas rozan el agua en la recuperación.', muscle: 'Hombros · coordinación',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50, 100], reps: [2, 6], rest: [10, 20], order: 1.5,
    instructions: ['En la recuperación, rozá el agua con las yemas.', 'Codo alto, antebrazo suelto.', 'Entrada por delante del hombro.'],
    mistakes: ['Arrastrar toda la mano.', 'Recuperar con el brazo rígido.'],
    goal: 'Recuperación relajada y codo alto.',
    art: { pose: 'prone', arms: 'fingertip', legs: 'flutter' },
  }),
  mk({
    id: 'drill-onearm', name: 'Crol con un brazo', shortName: 'Crol con un brazo', category: 'technique', stroke: 'free', difficulty: 2,
    desc: 'Brazo pasivo estirado al frente, foco en la rotación.', muscle: 'Core · rotación',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50, 100], reps: [2, 6], rest: [15, 20], order: 1.5,
    instructions: ['Un brazo estirado al frente, el otro nada.', 'Rotá el cuerpo hacia el lado que tira.', 'Cambiá de brazo cada largo.'],
    mistakes: ['Dejar caer el brazo pasivo.', 'Quedarse plano sin rotar.'],
    goal: 'Rotación y equilibrio sobre el eje.',
    art: { pose: 'prone', arms: 'onearm-fwd', legs: 'flutter' },
  }),
  mk({
    id: 'drill-rotation', name: 'Crol con énfasis en rotación', shortName: 'Énfasis en rotación', category: 'technique', stroke: 'free',
    desc: 'Rotación completa de hombros y cadera.', muscle: 'Core · oblicuos',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50, 100], reps: [2, 6], rest: [10, 20], order: 1.5,
    instructions: ['Rotá hombros y cadera juntos, hasta unos 45°.', 'La cabeza queda alineada con la columna.', 'Patada pequeña y estable.'],
    mistakes: ['Rotar solo los hombros.', 'Rotar con la cabeza.'],
    goal: 'Mejor alcance y respiración natural.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', rotate: true },
  }),
  mk({
    id: 'drill-strokerate', name: 'Crol con control de frecuencia de brazada', shortName: 'Control de frecuencia', category: 'technique', stroke: 'free', difficulty: 2,
    desc: 'Contá brazadas por largo y ajustalas.', muscle: 'Eficiencia · ritmo',
    blocks: ['main'], rpe: [4, 6], dist: [50, 100], reps: [2, 6], rest: [15, 25], order: 2.5,
    instructions: ['Contá las brazadas de cada largo.', 'Probá bajar una brazada sin perder velocidad.', 'Después subí la frecuencia manteniendo la cuenta.'],
    mistakes: ['Alargar tanto que el cuerpo frena.', 'Contar sin mirar la técnica.'],
    goal: 'Encontrar tu relación óptima entre frecuencia y distancia por brazada.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'rate' },
  }),
  mk({
    id: 'drill-back', name: 'Espalda técnica', shortName: 'Espalda técnica', category: 'technique', stroke: 'back', difficulty: 2,
    desc: 'Ejercicios de rotación y entrada en espalda.', muscle: 'Hombros · core',
    blocks: ['warmup', 'main'], rpe: [3, 5], dist: [25, 50, 100], reps: [2, 6], rest: [10, 20], order: 1.5,
    instructions: ['Rotá y mirá hacia el hombro que entra.', 'Brazo recto en la recuperación.', 'Cabeza quieta, mirada al techo.'],
    mistakes: ['Cabeza que se mueve con cada brazada.', 'Entrada con la palma hacia afuera.'],
    goal: 'Mejor posición y entrada en espalda.',
    art: { pose: 'supine', arms: 'backcrawl', legs: 'flutter', rotate: true },
  }),
  mk({
    id: 'drill-breast', name: 'Braza técnica', shortName: 'Braza técnica', category: 'technique', stroke: 'breast', difficulty: 2,
    desc: 'Ejercicios de tirón y deslizamiento en braza.', muscle: 'Pecho · aductores',
    blocks: ['main'], rpe: [3, 5], dist: [25, 50, 100], reps: [2, 6], rest: [15, 25], order: 1.5,
    instructions: ['Dos patadas por brazada o tirón con deslizamiento largo.', 'Codos altos en el barrido.', 'Estirate bien en el deslizamiento.'],
    mistakes: ['Apurar el ciclo.', 'Barrer demasiado ancho.'],
    goal: 'Ritmo y deslizamiento en braza.',
    art: { pose: 'breast', arms: 'sweep', legs: 'frog', mark: 'glide' },
  }),
  mk({
    id: 'drill-coordination', name: 'Coordinación de patada y brazada', shortName: 'Coordinación patada-brazada', category: 'technique', stroke: 'free', difficulty: 2,
    desc: 'Sincronizar el ritmo de piernas y brazos.', muscle: 'Coordinación · core',
    blocks: ['main'], rpe: [4, 6], dist: [50, 100], reps: [2, 6], rest: [15, 25], order: 2.5,
    instructions: ['Patada de seis tiempos por ciclo de brazos.', 'Una patada de empuje al entrar cada mano.', 'Mantené la cadera alta.'],
    mistakes: ['Parar la patada al respirar.', 'Perder el ritmo bajo cansancio.'],
    goal: 'Ritmo estable entre patada y brazada.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'coord' },
  }),
  mk({
    id: 'drill-glide', name: 'Técnica de deslizamiento', shortName: 'Deslizamiento', category: 'technique', stroke: 'free',
    desc: 'Empujes y deslizamientos para alargar el cuerpo.', muscle: 'Posición · core',
    safety: 'Soltá el aire bajo el agua: nada de aguantar la respiración.',
    blocks: ['warmup', 'main'], rpe: [2, 4], dist: [25, 50], reps: [2, 8], rest: [10, 20], order: 1,
    instructions: ['Empujate de la pared en flecha.', 'Deslizá hasta casi detenerte y empezá a nadar.', 'Exhalá suavemente mientras deslizás.'],
    mistakes: ['Levantar la cabeza.', 'Brazos abiertos en la flecha.'],
    goal: 'Cuerpo largo y mínima resistencia.',
    art: { pose: 'prone', arms: 'streamline', legs: 'still', mark: 'glide' },
  }),

  // ───────────── VELOCIDAD ─────────────
  mk({
    id: 'speed-sprint25', name: 'Sprints de 25 m', shortName: 'Sprint de crol', category: 'speed', stroke: 'free', difficulty: 2, kind: 'sprint',
    desc: 'Velocidad máxima controlada en un largo.', muscle: 'Potencia · sistema neuromuscular',
    safety: 'Calentá antes de sprintar y descansá bien entre series.',
    blocks: ['main'], rpe: [8, 9], dist: [25], reps: [2, 8], rest: [25, 45], order: 5,
    instructions: ['Salida explosiva desde la pared.', 'Respirá lo mínimo, sin aguantar el aire.', 'Patada rápida y brazada corta y potente.'],
    mistakes: ['Cruzar las manos por delante.', 'Perder la técnica por apuro.'],
    goal: 'Velocidad máxima con técnica.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'sprint+dist:25' },
  }),
  mk({
    id: 'speed-sprint50', name: 'Sprints de 50 m', shortName: 'Sprint de crol', category: 'speed', stroke: 'free', difficulty: 2, kind: 'sprint',
    desc: 'Velocidad alta sostenida durante 50 m.', muscle: 'Potencia · láctico',
    safety: 'Calentá antes de sprintar y descansá bien entre series.',
    blocks: ['main'], rpe: [7, 9], dist: [50], reps: [2, 6], rest: [30, 60], order: 5,
    instructions: ['Primer largo controlado, segundo a tope.', 'Viraje rápido.', 'Mantené la frecuencia hasta tocar.'],
    mistakes: ['Salir demasiado rápido y apagarse.', 'Respirar demasiado.'],
    goal: 'Mantener velocidad alta durante más tiempo.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'sprint+dist:50' },
  }),
  mk({
    id: 'speed-progressive', name: 'Series progresivas', shortName: 'Serie progresiva', category: 'speed', stroke: 'free', difficulty: 2, kind: 'build',
    desc: 'Cada tramo un poco más rápido que el anterior.', muscle: 'Cardio · control del ritmo',
    blocks: ['main'], rpe: [5, 8], dist: [50, 100, 200], reps: [1, 4], rest: [20, 40], order: 4,
    instructions: ['Empezá suave y aumentá la velocidad cada 25 m.', 'Mantené la longitud de brazada.', 'Terminá lo más rápido que puedas con técnica.'],
    mistakes: ['Salir demasiado rápido.', 'Acelerar solo con frecuencia.'],
    goal: 'Aumentar la velocidad de forma progresiva.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'build' },
  }),
  mk({
    id: 'speed-descending', name: 'Series descendentes en tiempo', shortName: 'Serie descendente', category: 'speed', stroke: 'free', difficulty: 2, kind: 'descending',
    desc: 'Cada repetición más rápida que la anterior.', muscle: 'Cardio · control del ritmo',
    blocks: ['main'], rpe: [6, 8], dist: [50, 100], reps: [3, 6], rest: [20, 40], order: 4,
    instructions: ['La primera repetición, cómoda.', 'Bajá un poco el tiempo en cada repetición.', 'La última, la más rápida.'],
    mistakes: ['Gastar todo en la primera.', 'No mirar el tiempo.'],
    goal: 'Controlar y mejorar el ritmo.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'descend' },
  }),
  mk({
    id: 'speed-intervals', name: 'Intervalos rápidos con recuperación', shortName: 'Intervalos rápidos', category: 'speed', stroke: 'free', difficulty: 2, kind: 'intervals',
    desc: 'Tramos cortos rápidos con descanso breve.', muscle: 'Capacidad anaeróbica',
    safety: 'Si la técnica se rompe, alargá el descanso.',
    blocks: ['main'], rpe: [7, 9], dist: [25, 50], reps: [4, 12], rest: [10, 25], order: 4.5,
    instructions: ['Rápido pero controlado en cada repetición.', 'Descanso corto: mirá el reloj.', 'Mantené el mismo tiempo en todas las series.'],
    mistakes: ['Empezar demasiado fuerte.', 'Descansar de más y perder la intención.'],
    goal: 'Velocidad repetida con recuperación incompleta.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'intervals' },
  }),
  mk({
    id: 'speed-pacechange', name: 'Cambios de ritmo', shortName: 'Cambios de ritmo', category: 'speed', stroke: 'free', difficulty: 2, kind: 'pacechange',
    desc: 'Alternar tramos rápidos y tramos de recuperación.', muscle: 'Cardio · adaptación',
    blocks: ['main'], rpe: [6, 8], dist: [100, 200], reps: [1, 4], rest: [20, 40], order: 4,
    instructions: ['Alterná 25 m rápido y 25 m suave.', 'En los tramos suaves, recuperá la respiración.', 'Cambiá de marcha sin pararte.'],
    mistakes: ['Que los tramos suaves no sean suaves.', 'Rápidos sin técnica.'],
    goal: 'Adaptarse a cambios de ritmo.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'pace' },
  }),

  // ───────────── RESISTENCIA ─────────────
  mk({
    id: 'end-free-continuous', name: 'Crol continuo', shortName: 'Crol continuo', category: 'endurance', stroke: 'free',
    desc: 'Nado continuo a ritmo aeróbico constante.', muscle: 'Capacidad aeróbica',
    blocks: ['endurance', 'main'], rpe: [5, 7], dist: [200, 300, 400, 500, 600, 800, 1000], reps: [1, 2], rest: [30, 60], order: 3,
    instructions: ['Encontrá un ritmo que puedas sostener.', 'Respiración regular cada 2 o 3 brazadas.', 'Mantené la técnica hasta el final.'],
    mistakes: ['Empezar demasiado rápido.', 'Acortar la brazada al cansarse.'],
    goal: 'Ritmo aeróbico constante.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'lane' },
  }),
  mk({
    id: 'end-back-continuous', name: 'Espalda continua', shortName: 'Espalda continua', category: 'endurance', stroke: 'back', difficulty: 2,
    desc: 'Espalda continua a ritmo aeróbico.', muscle: 'Capacidad aeróbica · dorsales',
    blocks: ['endurance', 'main'], rpe: [5, 7], dist: [100, 200, 300, 400, 500], reps: [1, 2], rest: [30, 60], order: 3,
    instructions: ['Cadencia constante y cadera alta.', 'Respiración libre, ritmo regular.', 'Contá las brazadas para no perder la línea.'],
    mistakes: ['Desviarse de la línea.', 'Cadera caída por cansancio.'],
    goal: 'Resistencia con variedad de estilo.',
    art: { pose: 'supine', arms: 'backcrawl', legs: 'flutter', mark: 'lane' },
  }),
  mk({
    id: 'end-aerobic100', name: 'Series aeróbicas de 100 m', shortName: 'Aeróbicas 100 m', category: 'endurance', stroke: 'free',
    desc: 'Repeticiones de 100 m a ritmo aeróbico.', muscle: 'Capacidad aeróbica',
    blocks: ['endurance', 'main'], rpe: [5, 7], dist: [100], reps: [3, 8], rest: [15, 30], order: 3,
    instructions: ['Mismo tiempo en cada 100 m.', 'Descanso corto y constante.', 'Respirá cada 3 brazadas.'],
    mistakes: ['Subir el ritmo en las últimas.', 'Descansos desiguales.'],
    goal: 'Volumen aeróbico con descansos cortos.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'dist:100' },
  }),
  mk({
    id: 'end-aerobic200', name: 'Series aeróbicas de 200 m', shortName: 'Aeróbicas 200 m', category: 'endurance', stroke: 'free',
    desc: 'Repeticiones de 200 m a ritmo aeróbico.', muscle: 'Capacidad aeróbica',
    blocks: ['endurance', 'main'], rpe: [5, 7], dist: [200], reps: [2, 5], rest: [20, 40], order: 3,
    instructions: ['Ritmo constante en todo el tramo.', 'Intentá mantener el mismo tiempo en cada 200.', 'Respiración bilateral si te sale cómoda.'],
    mistakes: ['Salir rápido y apagarse.', 'Perder la técnica en el último largo.'],
    goal: 'Ritmo aeróbico en tramos medios.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'dist:200' },
  }),
  mk({
    id: 'end-aerobic300', name: 'Series aeróbicas de 300 m', shortName: 'Aeróbicas 300 m', category: 'endurance', stroke: 'free', difficulty: 2,
    desc: 'Repeticiones de 300 m a ritmo aeróbico.', muscle: 'Capacidad aeróbica',
    blocks: ['endurance', 'main'], rpe: [5, 7], dist: [300], reps: [2, 4], rest: [25, 45], order: 3,
    instructions: ['Dividí mentalmente en tres tramos de 100 m.', 'Mismo ritmo de principio a fin.', 'Cuidá la técnica cuando llegue el cansancio.'],
    mistakes: ['Empezar rápido.', 'Acortar la brazada.'],
    goal: 'Resistencia aeróbica en tramos largos.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'dist:300' },
  }),
  mk({
    id: 'end-long400', name: 'Series largas de 400 m', shortName: 'Largas 400 m', category: 'endurance', stroke: 'free', difficulty: 2,
    desc: 'Tramos largos de 400 m a ritmo sostenido.', muscle: 'Resistencia aeróbica',
    blocks: ['endurance'], rpe: [5, 7], dist: [400], reps: [1, 3], rest: [30, 60], order: 3,
    instructions: ['Salida controlada, ritmo regular.', 'Ajustá la respiración al cansancio.', 'Sprint corto solo si te sobra al final.'],
    mistakes: ['Pasar el primer 100 demasiado rápido.', 'Dejar de patear a mitad.'],
    goal: 'Capacidad de sostener ritmo en distancia larga.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'dist:400' },
  }),
  mk({
    id: 'end-progressive', name: 'Resistencia progresiva', shortName: 'Resistencia progresiva', category: 'endurance', stroke: 'free', difficulty: 2, kind: 'build',
    desc: 'Tramos largos que van de suave a fuerte.', muscle: 'Aeróbico · control del ritmo',
    blocks: ['endurance', 'main'], rpe: [5, 8], dist: [200, 300, 400], reps: [1, 2], rest: [30, 60], order: 4,
    instructions: ['Primer tercio suave, segundo moderado, último fuerte.', 'Mantené buena técnica durante todo el ejercicio.', 'Cambiá de marcha cada 100 m.'],
    mistakes: ['Arrancar con demasiada intensidad.', 'Perder la técnica en el último tercio.'],
    goal: 'Terminar fuerte sin perder la técnica.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'build' },
  }),
  mk({
    id: 'end-mixed', name: 'Bloques mixtos de resistencia', shortName: 'Mixtos de resistencia', category: 'endurance', stroke: 'mixed', difficulty: 2,
    desc: 'Tramos largos alternando estilos cada 100 m.', muscle: 'Aeróbico · variedad',
    blocks: ['endurance', 'main'], rpe: [5, 7], dist: [200, 300, 400], reps: [1, 2], rest: [30, 50], order: 3,
    instructions: ['Alterná crol y espalda cada 100 m.', 'Mantené el mismo esfuerzo en ambos estilos.', 'Transición limpia en la pared.'],
    mistakes: ['Descansar en el cambio de estilo.', 'Subir el ritmo en crol y bajar en espalda.'],
    goal: 'Resistencia con variedad de estilos.',
    art: { pose: 'prone', arms: 'crawl', legs: 'flutter', mark: 'mixed' },
  }),
];

/** @type {Record<string, import('./types').Exercise>} */
export const BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/**
 * Variantes de un ejercicio. Los que no definen `variants` tienen una sola
 * variante implícita construida con sus campos de nivel superior.
 * @param {import('./types').Exercise} ex
 * @returns {import('./types').Variant[]}
 */
export function variantsOf(ex) {
  if (ex.variants && ex.variants.length) {
    return ex.variants.map((v) => ({
      kind: ex.kind, rest: ex.rest, reps: ex.reps, note: '', label: '', ...v,
    }));
  }
  return [{
    id: 'base', label: '', blocks: ex.blocks, rpe: ex.rpe, dist: ex.dist, reps: ex.reps,
    rest: ex.rest, kind: ex.kind, order: ex.order, note: '',
  }];
}

export function exerciseById(id) { return BY_ID[id] || null; }
export function exercisesOfCategory(cat) { return EXERCISES.filter((e) => e.category === cat); }

/** Texto corto del equipamiento requerido, p. ej. "Tabla + Aletas". */
export function equipmentLabel(ids) {
  return ids.map((i) => (EQUIPMENT[i] ? EQUIPMENT[i].short : i)).join(' + ');
}

/** Nombre visible de una serie: "Crol suave", "Sprint de crol", "Pataleo con tabla (sin tabla)". */
export function itemName(ex, variant, noGear) {
  let n;
  if (variant && variant.label) n = `${ex.shortName} ${variant.label}`;
  else if (ex.kind === 'sprint') n = ex.shortName;
  else n = ex.name;
  if (noGear && ex.noGearVariant) n += ex.noGearVariant.suffix;
  return n;
}

export const RPE_LABEL = {
  1: 'Muy suave', 2: 'Muy suave', 3: 'Suave', 4: 'Suave', 5: 'Moderada',
  6: 'Moderada', 7: 'Fuerte', 8: 'Muy fuerte', 9: 'Sprint', 10: 'Máximo',
};

/** "4/10" o "4→7/10" para series progresivas. */
export function intensityText(item) {
  return item.rpeStart && item.rpeStart < item.rpe ? `${item.rpeStart}→${item.rpe}/10` : `${item.rpe}/10`;
}

/** Ejercicio y variante de una serie (con reserva si el id ya no existe). */
export function resolveItem(item) {
  const ex = BY_ID[item.exId] || null;
  const variant = ex ? variantsOf(ex).find((v) => v.id === item.variantId) || variantsOf(ex)[0] : null;
  return { ex, variant };
}
