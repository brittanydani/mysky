/**
 * Dream Symbol Dictionary
 *
 * Maps common dream keywords to symbolic/psychological meanings.
 * Language is Jungian-adjacent but universal — no astrology terminology.
 *
 * Each symbol has multiple interpretation variants; callers should select
 * deterministically (e.g. hash of entry ID) to keep output stable per dream.
 */

export type DreamArchetype =
  | 'Shadow'        // unintegrated parts of self; what we avoid or project
  | 'Self'          // the whole, integrated psyche; who you truly are
  | 'Anima'         // inner emotional/intuitive nature
  | 'Persona'       // how you appear; social mask; performance
  | 'Threshold'     // liminal space; transitions; crossings
  | 'Transformation' // death/rebirth cycles; deep change
  | 'Integration';  // bringing something together; the process of becoming whole

export interface DreamSymbol {
  label: string;
  archetype: DreamArchetype;
  themes: string[];
  /** Multiple interpretation variants — pick by seeded index for stability */
  interpretations: string[];
}

// ─── Symbol Definitions ───────────────────────────────────────────────────────

export const DREAM_SYMBOLS: Record<string, DreamSymbol> = {
  water: {
    label: 'Water',
    archetype: 'Integration',
    themes: ['emotions in motion', 'the unconscious', 'what has been submerged'],
    interpretations: [
      'Water often carries what we haven\'t yet named — feelings in motion, things surfacing from somewhere deep. What the water felt like matters: still or turbulent, clear or murky.',
      'Water in dreams tends to reflect the emotional atmosphere beneath your waking life — what has been moving quietly below the surface, waiting to be felt.',
      'Water has long been understood as the element of feeling and memory. Where it appears, something emotional is asking to be noticed rather than managed.',
    ],
  },

  house: {
    label: 'A house or building',
    archetype: 'Self',
    themes: ['the self in various aspects', 'inner architecture', 'different parts of who you are'],
    interpretations: [
      'A house often represents the self — each room a different aspect of who you are. Unfamiliar rooms tend to suggest parts of yourself still being discovered.',
      'In the inner landscape of dreams, houses are rarely just structures. They hold something: a feeling, a memory, a part of you not yet fully inhabited.',
      'The state of the house — its familiarity, its condition, who else is in it — tends to mirror the state of your inner world at this time.',
    ],
  },

  falling: {
    label: 'Falling',
    archetype: 'Threshold',
    themes: ['loss of control', 'surrender', 'a transition in progress'],
    interpretations: [
      'Falling often appears when something in waking life feels beyond your control — a situation where you can\'t hold on in the usual way. It\'s not always fear; sometimes it\'s the beginning of letting go.',
      'The sensation of falling tends to arrive during transitions — a letting go that hasn\'t yet found its landing place. What is shifting that hasn\'t settled?',
      'Falling is one of the most universal dream experiences, and often signals a transition. The question it holds: what are you releasing, even before you feel ready?',
    ],
  },

  flying: {
    label: 'Flying',
    archetype: 'Self',
    themes: ['freedom', 'perspective shift', 'rising above what feels heavy'],
    interpretations: [
      'Flying dreams often carry the feeling of perspective — the sense of seeing things from above, outside the usual constraints. Something in you is reaching for more space.',
      'When flight appears in dreams, it often signals a longing or latent capacity for freedom — a desire to move above what has felt constricting.',
      'Flying can reflect liberation, ambition, or a part of you that knows you\'re larger than your current circumstances. What were you moving toward, or away from?',
    ],
  },

  chase: {
    label: 'Being chased',
    archetype: 'Shadow',
    themes: ['avoidance', 'something seeking your attention', 'a part of self confronting you'],
    interpretations: [
      'Being chased in a dream often represents something you\'ve been avoiding — not necessarily danger, but something that wants to be acknowledged. What was pursuing you matters less than what it might represent.',
      'The chase pattern typically reflects avoidance. The thing pursuing you is often a part of yourself — a feeling, a truth, a decision — trying to be heard.',
      'What we run from in dreams tends to be what needs our attention in waking life. The pursuer is rarely just a threat; more often, it\'s a messenger.',
    ],
  },

  stranger: {
    label: 'An unknown figure',
    archetype: 'Shadow',
    themes: ['an aspect of self', 'a projected quality', 'something not yet integrated'],
    interpretations: [
      'Unknown figures in dreams often carry qualities we haven\'t yet integrated — aspects of ourselves that feel foreign or separate. What was this figure\'s energy? That quality may be one you\'re in relationship with right now.',
      'Strangers in dreams often aren\'t strangers at all — they tend to represent parts of ourselves we haven\'t fully met yet. Their emotional tone (threatening, mysterious, warm) offers a clue.',
      'A figure you don\'t recognize often symbolizes something within you that remains unfamiliar — an unmet aspect, a quality you\'re developing, or something your inner world is introducing.',
    ],
  },

  death: {
    label: 'Death or an ending',
    archetype: 'Transformation',
    themes: ['transformation', 'a chapter completing', 'the old making way for something new'],
    interpretations: [
      'Death in dreams almost never means literal death — it tends to signal transformation. Something is completing, and space is being made. What is ending in your waking life that hasn\'t been fully acknowledged?',
      'When death appears in dreams, it often reflects an internal transition — the old making way for the new. It can feel unsettling, but it carries the energy of something being released.',
      'Dreams of death frequently carry a message of change — a threshold being crossed, a version of yourself being shed. What is no longer serving you that might be ready to complete?',
    ],
  },

  snake: {
    label: 'A snake',
    archetype: 'Transformation',
    themes: ['transformation', 'healing', 'something that sheds and renews'],
    interpretations: [
      'Snakes are among the oldest dream symbols — associated with transformation, healing, and renewal. They shed their skin entirely. Where something feels stuck or needs releasing, a snake may appear.',
      'The snake often signals something transformative at work — an energy that requires you to shed what no longer fits, even when that\'s uncomfortable.',
    ],
  },

  dog: {
    label: 'A dog',
    archetype: 'Integration',
    themes: ['loyalty', 'trust', 'unconditional connection'],
    interpretations: [
      'Dogs in dreams often represent loyalty, trust, and the quality of companionship. Their state — friendly, wild, wounded — tends to reflect something about a relationship or about how you\'re currently experiencing trust.',
      'A dog often carries themes of devotion and unconditional connection. How this dog appeared — and how it felt — offers a window into your experience of loyalty and belonging right now.',
    ],
  },

  cat: {
    label: 'A cat',
    archetype: 'Anima',
    themes: ['intuition', 'independence', 'something that moves by its own terms'],
    interpretations: [
      'Cats in dreams tend to carry themes of independence, intuition, and the parts of us that refuse to be managed. They often appear when you\'re navigating something that requires trusting your own instincts over others\' expectations.',
      'A cat\'s quality — mysterious, aloof, warm, or feral — tends to reflect the quality of your intuition right now, or something in your life operating by its own rules.',
    ],
  },

  bird: {
    label: 'A bird',
    archetype: 'Self',
    themes: ['freedom', 'perspective', 'a message from a higher vantage point'],
    interpretations: [
      'Birds often carry themes of freedom, transcendence, and the view from above. They can signal a perspective shift — a capacity in you to rise above the immediate situation.',
      'A bird in a dream tends to carry something light: a message, a possibility, a freedom that exists if you\'re willing to lift off. What it was doing — caged, soaring, wounded, singing — shapes the meaning.',
    ],
  },

  wolf: {
    label: 'A wolf',
    archetype: 'Shadow',
    themes: ['wildness', 'instinct', 'the part of you that operates outside social rules'],
    interpretations: [
      'Wolves often symbolize the wild, instinctual part of us — something that doesn\'t fit neatly into social expectations. Their energy can feel threatening or liberating depending on your relationship to your own wildness.',
      'A wolf in dreams frequently represents raw instinct — the part of you that knows something without being able to explain it, or that needs to break from the pack.',
    ],
  },

  bear: {
    label: 'A bear',
    archetype: 'Shadow',
    themes: ['primal strength', 'protection', 'a powerful force within or around you'],
    interpretations: [
      'Bears carry themes of power, protection, and boundaries. Their appearance in a dream often reflects something about your own strength — whether it\'s being called on, held back, or confronted.',
      'A bear can represent both threat and protection — an imposing force that may actually be asking you to claim your own ground rather than back away from it.',
    ],
  },

  horse: {
    label: 'A horse',
    archetype: 'Integration',
    themes: ['freedom', 'power in motion', 'a drive or energy that wants to move'],
    interpretations: [
      'Horses in dreams often represent power, freedom, and drive — the energy that wants to move and expand. Whether you\'re riding, watching, or being pursued shapes the message.',
      'A horse tends to embody vitality and momentum. What is wanting to move in your life right now that may not have full expression?',
    ],
  },

  fire: {
    label: 'Fire',
    archetype: 'Transformation',
    themes: ['creative force', 'purification', 'passion or anger seeking a channel'],
    interpretations: [
      'Fire dreams carry the energy of transformation — something burning away, something being purified. They can also reflect passion, anger, or creative force that needs acknowledgment.',
      'Fire often appears when something needs to be released or transformed. What is burning in your waking life that has gone unacknowledged? What is it making space for?',
    ],
  },

  darkness: {
    label: 'Darkness',
    archetype: 'Shadow',
    themes: ['the unknown', 'the unconscious', 'what has not yet been brought to light'],
    interpretations: [
      'Darkness in dreams is rarely just an absence — it tends to be a presence. The unknown, the unconscious, the parts of yourself not yet illuminated. Moving through darkness can mean approaching something rather than fleeing it.',
      'Darkness often holds what is not yet understood or integrated. How you moved through it — with fear, curiosity, or acceptance — offers a reflection of how you\'re meeting uncertainty right now.',
    ],
  },

  light: {
    label: 'Light',
    archetype: 'Self',
    themes: ['clarity arriving', 'awareness', 'guidance making itself visible'],
    interpretations: [
      'Light in dreams often signals awareness arriving — something becoming visible that was obscured. It can represent guidance, truth, or a clarity that\'s beginning to emerge.',
      'A source of light in a dream tends to carry the quality of direction — something illuminating the way or revealing what was hidden. What was it pointing toward?',
    ],
  },

  path: {
    label: 'A road or path',
    archetype: 'Threshold',
    themes: ['direction', 'the shape of your current journey', 'choices ahead'],
    interpretations: [
      'Roads and paths in dreams reflect the sense of direction in your life — where you\'re going, what\'s in front of you, and whether the way feels clear or obstructed.',
      'A path in a dream mirrors how you\'re experiencing your current trajectory. Was it familiar or new? Blocked or open? Traveled alone or with others?',
    ],
  },

  teeth: {
    label: 'Teeth',
    archetype: 'Persona',
    themes: ['confidence', 'how you present yourself', 'anxiety about being perceived or heard'],
    interpretations: [
      'Teeth dreams are among the most common, and tend to relate to confidence and how you feel about how you\'re presenting yourself to the world. They often surface during social anxiety or major life transitions.',
      'Losing teeth in dreams is often connected to fears about communication, appearance, or being seen in a diminished way. What area of your life has you feeling most exposed right now?',
    ],
  },

  lost: {
    label: 'Being lost or searching',
    archetype: 'Threshold',
    themes: ['seeking orientation', 'something not yet found', 'uncertainty about direction'],
    interpretations: [
      'Being lost in a dream often reflects a waking-life uncertainty — a sense of not knowing where you\'re headed, or searching for something that hasn\'t yet arrived. The place you\'re lost in offers context.',
      'The search in dreams is rarely just geographic. You may be looking for something — clarity, belonging, a sense of purpose — that hasn\'t yet fully crystallized.',
    ],
  },

  test: {
    label: 'A test or evaluation',
    archetype: 'Persona',
    themes: ['fear of being found inadequate', 'performance pressure', 'an old anxiety returning'],
    interpretations: [
      'Exam and test dreams often surface during periods of real-life evaluation — performance pressure, or the echo of an older anxiety about being measured and found wanting.',
      'Test dreams tend to reflect the part of us that fears not being prepared for something that matters. They\'re rarely about the literal test — more often about a deeper fear of inadequacy.',
    ],
  },

  child: {
    label: 'A child',
    archetype: 'Self',
    themes: ['an earlier part of yourself', 'innocence or vulnerability asking for attention', 'something young in you arising'],
    interpretations: [
      'Children in dreams often represent an earlier part of yourself — a version of you that still carries something unresolved, or a quality (wonder, openness, vulnerability) that is asking to be tended.',
      'A child in a dream may be asking you to look at something younger and more tender within yourself. What this child needed, or how you responded to them, often carries the message.',
    ],
  },

  family: {
    label: 'Family',
    archetype: 'Integration',
    themes: ['origin', 'early patterns still at work', 'the relationships that shaped your inner world'],
    interpretations: [
      'Family members in dreams often reflect the internalized dynamics of your early life — patterns still active in your current relationships. How they showed up, and how it felt, tends to be the message.',
      'Dreams featuring family are often less about those people and more about the patterns, needs, and dynamics they carry within you. The feeling tone is usually more important than the specifics.',
    ],
  },

  past: {
    label: 'Someone from your past',
    archetype: 'Shadow',
    themes: ['an unresolved thread', 'something from before returning for attention', 'a quality from that time still present in you'],
    interpretations: [
      'When someone from your past appears in a dream, it\'s rarely about them. More often, they carry a quality, a dynamic, or an unresolved thread that your inner world is returning to.',
      'A past figure in dreams tends to represent something still alive in you — not necessarily longing, but a pattern or feeling from that time that hasn\'t been fully integrated.',
    ],
  },

  birth: {
    label: 'Birth or pregnancy',
    archetype: 'Transformation',
    themes: ['something new forming', 'creative potential gestating', 'a part of you in development'],
    interpretations: [
      'Birth and pregnancy dreams often appear when something new is forming — a project, a version of yourself, a possibility still taking shape. Something is in early development.',
      'Birth imagery in dreams tends to carry the quality of potential — something not yet fully arrived, still finding its form. What new thing in your life is still emerging?',
    ],
  },

  mirror: {
    label: 'A mirror or reflection',
    archetype: 'Self',
    themes: ['self-perception', 'how you\'re currently seeing yourself', 'what the reflected image reveals'],
    interpretations: [
      'Mirrors in dreams invite you to look at self-perception — how you\'re currently seeing yourself, and whether that image feels true. What you see (or don\'t see) in the reflection tends to carry the message.',
      'A mirror dream often raises the question of identity: who do you see when you look? Is the image matching who you know yourself to be?',
    ],
  },

  vehicle: {
    label: 'A vehicle or journey',
    archetype: 'Threshold',
    themes: ['the pace and direction of your life', 'who is steering', 'where you\'re headed'],
    interpretations: [
      'Vehicles in dreams often reflect a sense of momentum — how your life feels like it\'s moving. Who was driving matters: are you in control of your own direction right now?',
      'Dream vehicles tend to mirror your relationship to movement and control. Are you steering, or are you a passenger in something beyond your influence?',
    ],
  },

  nature: {
    label: 'A natural landscape',
    archetype: 'Integration',
    themes: ['what is natural and alive in you', 'grounding', 'something beyond the constructed self'],
    interpretations: [
      'Natural landscapes in dreams often carry grounding and perspective — the sense of something larger than the immediate moment. Trees, forests, mountains: what was the quality of this space?',
      'Nature in dreams tends to reflect your inner ecology — how well-tended, how wild, how alive things feel within you right now.',
    ],
  },

  money: {
    label: 'Money or resources',
    archetype: 'Persona',
    themes: ['security', 'worth and value', 'anxiety about sufficiency'],
    interpretations: [
      'Money in dreams often reflects not literal finances but feelings of worth, security, and sufficiency. Losing or lacking money can signal anxieties about adequacy beyond the material.',
      'Dreams involving money or resources tend to explore the question of value — what you believe you deserve, what feels secure, and what feels perpetually at risk.',
    ],
  },

  ocean: {
    label: 'The ocean',
    archetype: 'Integration',
    themes: ['the vast unconscious', 'something immense within or around you', 'depth beyond the surface'],
    interpretations: [
      'The ocean often represents the vast unconscious — everything beneath the surface of daily awareness. Its state (calm, stormy, endless) mirrors your current relationship to what lies beneath.',
      'An ocean in a dream tends to hold the quality of vastness — something beyond your usual edges, both terrifying and deeply freeing.',
    ],
  },
};

// ─── Keyword → Symbol Key Mapping ────────────────────────────────────────────

/** Maps individual words from dreamText to symbol keys */
export const DREAM_KEYWORDS: Record<string, string> = {
  // Water
  water: 'water', ocean: 'ocean', sea: 'water', river: 'water', lake: 'water',
  rain: 'water', flood: 'water', stream: 'water', pool: 'water', waves: 'water',
  swimming: 'water', drowning: 'water', shore: 'water', tide: 'water',
  waterfall: 'water', pond: 'water', creek: 'water', marsh: 'water',

  // House/building
  house: 'house', home: 'house', room: 'house', building: 'house',
  window: 'house', hallway: 'house', basement: 'house', attic: 'house',
  apartment: 'house', bedroom: 'house', kitchen: 'house', stairs: 'house',
  corridor: 'house', walls: 'house', ceiling: 'house', door: 'house',

  // Falling
  falling: 'falling', fell: 'falling', fall: 'falling', dropped: 'falling',
  sinking: 'falling', sink: 'falling', plunging: 'falling', plunge: 'falling',

  // Flying
  flying: 'flying', flew: 'flying', float: 'flying', floating: 'flying',
  soaring: 'flying', hover: 'flying', hovering: 'flying', levitate: 'flying',
  levitating: 'flying', gliding: 'flying',

  // Chase
  chase: 'chase', chased: 'chase', chasing: 'chase', chaser: 'chase',
  fleeing: 'chase', flee: 'chase', escape: 'chase', hiding: 'chase',
  hide: 'chase', hunted: 'chase', running: 'chase', run: 'chase', ran: 'chase',

  // Stranger / unknown figure
  stranger: 'stranger', figure: 'stranger', shadowy: 'stranger',
  unknown: 'stranger', presence: 'stranger',

  // Death / endings
  death: 'death', dead: 'death', dying: 'death', died: 'death',
  funeral: 'death', grave: 'death', burial: 'death', killed: 'death',
  murder: 'death', disappear: 'death', vanish: 'death',

  // Snakes
  snake: 'snake', snakes: 'snake', serpent: 'snake', serpents: 'snake',
  viper: 'snake', cobra: 'snake',

  // Dogs
  dog: 'dog', dogs: 'dog', puppy: 'dog', puppies: 'dog', hound: 'dog',

  // Cats
  cat: 'cat', cats: 'cat', kitten: 'cat', kittens: 'cat', feline: 'cat',

  // Birds
  bird: 'bird', birds: 'bird', feather: 'bird', feathers: 'bird',
  crow: 'bird', raven: 'bird', eagle: 'bird', hawk: 'bird', owl: 'bird',
  dove: 'bird', sparrow: 'bird', wing: 'bird', wings: 'bird',

  // Wolf
  wolf: 'wolf', wolves: 'wolf',

  // Bear
  bear: 'bear', bears: 'bear',

  // Horse
  horse: 'horse', horses: 'horse', stallion: 'horse', mare: 'horse',

  // Fire
  fire: 'fire', flame: 'fire', flames: 'fire', burning: 'fire',
  smoke: 'fire', heat: 'fire', blaze: 'fire', inferno: 'fire',

  // Darkness
  dark: 'darkness', darkness: 'darkness', night: 'darkness',
  shadow: 'darkness', black: 'darkness', void: 'darkness',

  // Light
  light: 'light', bright: 'light', glow: 'light', radiant: 'light',
  shining: 'light', glowing: 'light', illuminate: 'light', illuminated: 'light',

  // Path
  road: 'path', path: 'path', journey: 'path', trail: 'path',
  crossroads: 'path', intersection: 'path', walking: 'path', walked: 'path',
  traveled: 'path', direction: 'path', map: 'path',

  // Teeth
  teeth: 'teeth', tooth: 'teeth', bite: 'teeth', biting: 'teeth',
  jaw: 'teeth', dental: 'teeth', mouth: 'teeth',

  // Lost / searching
  lost: 'lost', searching: 'lost', search: 'lost', finding: 'lost',
  looking: 'lost', seek: 'lost', seeking: 'lost', wandering: 'lost',
  wander: 'lost', confused: 'lost',

  // School / test
  school: 'test', class: 'test', exam: 'test', test: 'test',
  teacher: 'test', study: 'test', classroom: 'test', homework: 'test',
  grade: 'test', university: 'test', college: 'test', professor: 'test',

  // Child / childhood
  child: 'child', children: 'child', kid: 'child', kids: 'child',
  baby: 'child', infant: 'child', toddler: 'child', childhood: 'child',
  young: 'child',

  // Family
  mother: 'family', father: 'family', parent: 'family', parents: 'family',
  sibling: 'family', sister: 'family', brother: 'family',
  family: 'family', grandmother: 'family', grandfather: 'family',
  grandma: 'family', grandpa: 'family', aunt: 'family', uncle: 'family',
  cousin: 'family',

  // Past
  ex: 'past', past: 'past', former: 'past', memory: 'past',
  memories: 'past', old: 'past',

  // Pregnancy / birth
  pregnant: 'birth', pregnancy: 'birth', born: 'birth', birth: 'birth',
  newborn: 'birth', expecting: 'birth',

  // Mirror
  mirror: 'mirror', mirrors: 'mirror', reflection: 'mirror', reflected: 'mirror',

  // Vehicle
  car: 'vehicle', driving: 'vehicle', drive: 'vehicle', drove: 'vehicle',
  train: 'vehicle', plane: 'vehicle', crash: 'vehicle', crashing: 'vehicle',
  bus: 'vehicle', truck: 'vehicle', motorcycle: 'vehicle', vehicle: 'vehicle',
  transportation: 'vehicle', airplane: 'vehicle', helicopter: 'vehicle',

  // Nature
  forest: 'nature', tree: 'nature', trees: 'nature', mountain: 'nature',
  mountains: 'nature', garden: 'nature', field: 'nature', flowers: 'nature',
  meadow: 'nature', jungle: 'nature', earth: 'nature', sky: 'nature',
  grass: 'nature', leaves: 'nature', woods: 'nature', nature: 'nature',

  // Money
  money: 'money', cash: 'money', wealth: 'money', poverty: 'money',
  debt: 'money', rich: 'money', poor: 'money', payment: 'money',
  wallet: 'money', purse: 'money', bank: 'money',
};

// ─── Extraction Function ──────────────────────────────────────────────────────

/**
 * Extract up to `max` dream symbols from free-form dream text.
 * Returns unique symbol keys in order of first appearance.
 */
export function extractSymbols(dreamText: string, max = 4): string[] {
  if (!dreamText?.trim()) return [];

  const words = dreamText
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const seen = new Set<string>();
  const found: string[] = [];

  for (const word of words) {
    const symbolKey = DREAM_KEYWORDS[word];
    if (symbolKey && !seen.has(symbolKey)) {
      seen.add(symbolKey);
      found.push(symbolKey);
      if (found.length >= max) break;
    }
  }

  return found;
}

/**
 * Pick a variant from an array deterministically based on a seed string.
 * Same seed always returns the same index — output is stable per dream entry.
 */
export function pickVariant<T>(items: T[], seed: string): T {
  if (!items || items.length === 0) return undefined as T;
  if (items.length === 1) return items[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return items[hash % items.length];
}
