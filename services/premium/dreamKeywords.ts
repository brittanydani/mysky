/**
 * dreamKeywords.ts — Dream Symbol Dictionary
 *
 * A comprehensive dictionary of common dream symbols, objects, scenarios,
 * and motifs mapped to psychological interpretations.
 *
 * Each entry includes:
 *   - keywords: words/phrases to match in dream journal text
 *   - meaning: one-sentence psychological interpretation (warm, grounded tone)
 *   - category: thematic grouping for deduplication
 *
 * Tone: "may", "could", "often reflects" — never absolute.
 * Sources: Jungian symbolism, somatic psychology, attachment theory, common dream research.
 *
 * This file is intentionally large. Dream journaling is the PRIMARY input.
 */

export type DreamSymbolCategory =
  | 'water'
  | 'animals'
  | 'body'
  | 'people'
  | 'places'
  | 'movement'
  | 'objects'
  | 'nature'
  | 'conflict'
  | 'loss'
  | 'transformation'
  | 'perception'
  | 'vehicles'
  | 'buildings'
  | 'emotions_expressed'
  | 'scenarios'
  | 'colors'
  | 'elements'
  | 'clothing'
  | 'food'
  | 'technology'
  | 'time'
  | 'spiritual'
  | 'relationships';

export type DreamKeywordEntry = {
  /** Unique id */
  id: string;
  /** Words/phrases to match (lowercased). First entry is the canonical label. */
  keywords: string[];
  /** One-sentence interpretation (warm, grounded, non-absolute) */
  meaning: string;
  /** Thematic category for dedup / grouping */
  category: DreamSymbolCategory;
};

// ─── The Dictionary ───────────────────────────────────────────────────────────

export const DREAM_KEYWORDS: DreamKeywordEntry[] = [

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WATER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'ocean',
    keywords: ['ocean', 'sea', 'the ocean', 'the sea', 'vast water'],
    meaning: 'The ocean often represents the unconscious mind \u2014 vast, deep, and full of what lies beneath the surface of awareness.',
    category: 'water',
  },
  {
    id: 'waves',
    keywords: ['waves', 'wave', 'tidal wave', 'tsunami', 'tidal'],
    meaning: 'Waves may reflect emotions that feel overwhelming or that come and go in powerful surges.',
    category: 'water',
  },
  {
    id: 'drowning',
    keywords: ['drowning', 'drowned', 'underwater', 'under water', 'sinking in water', 'couldn\'t breathe underwater'],
    meaning: 'Drowning in a dream often points to feeling emotionally overwhelmed \u2014 as if emotions are rising faster than you can manage.',
    category: 'water',
  },
  {
    id: 'swimming',
    keywords: ['swimming', 'swam', 'swim'],
    meaning: 'Swimming may reflect how you are navigating your emotions \u2014 whether with ease, struggle, or exhaustion.',
    category: 'water',
  },
  {
    id: 'rain',
    keywords: ['rain', 'raining', 'rained', 'downpour', 'drizzle'],
    meaning: 'Rain often symbolizes emotional release, sadness, or a cleansing process that is happening beneath conscious awareness.',
    category: 'water',
  },
  {
    id: 'flood',
    keywords: ['flood', 'flooding', 'flooded', 'rising water', 'water rising'],
    meaning: 'Flooding may represent emotions that have exceeded your capacity to contain them \u2014 something spilling over.',
    category: 'water',
  },
  {
    id: 'river',
    keywords: ['river', 'stream', 'creek', 'flowing water'],
    meaning: 'A river often reflects the flow of life or emotions \u2014 whether it feels calm, rushing, or blocked.',
    category: 'water',
  },
  {
    id: 'lake',
    keywords: ['lake', 'pond', 'still water'],
    meaning: 'A still body of water may represent inner reflection, contained emotion, or something calm on the surface but deep underneath.',
    category: 'water',
  },
  {
    id: 'pool',
    keywords: ['pool', 'swimming pool'],
    meaning: 'A pool often reflects contained emotional experience \u2014 manageable depth, perhaps a controlled setting for exploring feelings.',
    category: 'water',
  },
  {
    id: 'bath',
    keywords: ['bath', 'bathtub', 'shower', 'bathing', 'washing'],
    meaning: 'Bathing or showering may reflect a need for emotional cleansing, renewal, or washing away something that feels heavy.',
    category: 'water',
  },
  {
    id: 'ice',
    keywords: ['ice', 'frozen', 'frost', 'icy', 'frozen water', 'frozen lake'],
    meaning: 'Ice or frozen water often reflects emotions that have been suppressed, numbed, or put on hold.',
    category: 'water',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANIMALS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'snake',
    keywords: ['snake', 'snakes', 'serpent', 'viper', 'python', 'cobra'],
    meaning: 'Snakes in dreams often represent transformation, hidden fears, healing energy, or something you sense but cannot yet see clearly.',
    category: 'animals',
  },
  {
    id: 'dog',
    keywords: ['dog', 'dogs', 'puppy', 'puppies'],
    meaning: 'Dogs may reflect loyalty, companionship, protection, or the part of yourself that loves unconditionally.',
    category: 'animals',
  },
  {
    id: 'cat',
    keywords: ['cat', 'cats', 'kitten', 'kittens'],
    meaning: 'Cats often represent independence, intuition, mystery, or a part of yourself that moves through the world on its own terms.',
    category: 'animals',
  },
  {
    id: 'bird',
    keywords: ['bird', 'birds', 'flying bird', 'eagle', 'hawk', 'crow', 'raven', 'owl', 'dove', 'sparrow', 'robin'],
    meaning: 'Birds may represent freedom, perspective, spiritual messages, or a desire to rise above a current situation.',
    category: 'animals',
  },
  {
    id: 'spider',
    keywords: ['spider', 'spiders', 'web', 'spider web', 'cobweb'],
    meaning: 'Spiders often symbolize creativity, feeling trapped, the weaving of fate, or something that feels unsettling but purposeful.',
    category: 'animals',
  },
  {
    id: 'fish',
    keywords: ['fish', 'fishes', 'fishing'],
    meaning: 'Fish may represent insights rising from the unconscious, emotional nourishment, or something just below the surface.',
    category: 'animals',
  },
  {
    id: 'horse',
    keywords: ['horse', 'horses', 'stallion', 'mare', 'riding a horse'],
    meaning: 'Horses often reflect personal power, freedom, drive, or the balance between instinct and control.',
    category: 'animals',
  },
  {
    id: 'wolf',
    keywords: ['wolf', 'wolves', 'wolfpack'],
    meaning: 'A wolf may represent instinct, loyalty, a perceived threat, or the wild, untamed part of your psyche.',
    category: 'animals',
  },
  {
    id: 'bear',
    keywords: ['bear', 'bears', 'grizzly'],
    meaning: 'Bears often symbolize strength, protection, hibernation, or powerful emotions that demand space.',
    category: 'animals',
  },
  {
    id: 'lion',
    keywords: ['lion', 'lions', 'lioness'],
    meaning: 'A lion may reflect courage, authority, pride, or a powerful force in your life \u2014 whether your own or someone else\u2019s.',
    category: 'animals',
  },
  {
    id: 'insect',
    keywords: ['bug', 'bugs', 'insects', 'insect', 'cockroach', 'ant', 'ants', 'beetle', 'fly', 'flies', 'mosquito', 'worm', 'worms', 'maggot', 'maggots'],
    meaning: 'Insects in dreams may point to something small but persistent that is bothering you, or things that feel invasive or hard to control.',
    category: 'animals',
  },
  {
    id: 'mouse_rat',
    keywords: ['mouse', 'mice', 'rat', 'rats'],
    meaning: 'Mice or rats may reflect fears around vulnerability, survival instincts, or something gnawing at your peace of mind.',
    category: 'animals',
  },
  {
    id: 'shark',
    keywords: ['shark', 'sharks'],
    meaning: 'Sharks often represent a perceived threat lurking beneath the surface \u2014 danger you sense but cannot fully see.',
    category: 'animals',
  },
  {
    id: 'whale',
    keywords: ['whale', 'whales'],
    meaning: 'Whales may reflect deep emotional wisdom, the enormity of what you are carrying, or a connection to something vast and ancient within.',
    category: 'animals',
  },
  {
    id: 'butterfly',
    keywords: ['butterfly', 'butterflies', 'moth', 'moths'],
    meaning: 'Butterflies often symbolize transformation, beauty emerging from struggle, or a transitional period in life.',
    category: 'animals',
  },
  {
    id: 'deer',
    keywords: ['deer', 'doe', 'fawn', 'stag'],
    meaning: 'Deer may represent gentleness, vulnerability, grace under pressure, or a quiet inner knowing.',
    category: 'animals',
  },
  {
    id: 'alligator',
    keywords: ['alligator', 'crocodile', 'gator'],
    meaning: 'Alligators or crocodiles may reflect hidden danger, primal emotion, or something lurking just beneath a calm surface.',
    category: 'animals',
  },
  {
    id: 'monkey_ape',
    keywords: ['monkey', 'ape', 'gorilla', 'chimp', 'chimpanzee', 'primate'],
    meaning: 'Monkeys or apes may represent playfulness, mischief, primal instincts, or a part of you that wants to act without thinking.',
    category: 'animals',
  },
  {
    id: 'elephant',
    keywords: ['elephant', 'elephants'],
    meaning: 'Elephants often symbolize memory, wisdom, something too large to ignore, or a heavy truth that takes up space.',
    category: 'animals',
  },
  {
    id: 'rabbit',
    keywords: ['rabbit', 'rabbits', 'bunny', 'hare'],
    meaning: 'Rabbits may reflect vulnerability, fertility, anxiety, or the urge to flee from something uncomfortable.',
    category: 'animals',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BODY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'teeth_falling',
    keywords: ['teeth falling out', 'teeth fell out', 'losing teeth', 'lost my teeth', 'tooth fell', 'teeth broke', 'crumbling teeth', 'teeth crumbled', 'teeth'],
    meaning: 'Teeth falling out is one of the most common dream symbols \u2014 it often reflects anxiety about self-image, communication, loss of control, or fear of aging.',
    category: 'body',
  },
  {
    id: 'hair',
    keywords: ['hair', 'haircut', 'bald', 'losing hair', 'hair falling out', 'shaved head', 'long hair', 'short hair'],
    meaning: 'Hair in dreams may reflect identity, self-expression, vitality, or concerns about how others perceive you.',
    category: 'body',
  },
  {
    id: 'eyes',
    keywords: ['eyes', 'eye', 'blind', 'couldn\'t see', 'blurry vision', 'third eye', 'eye contact'],
    meaning: 'Eyes often represent awareness, insight, or how clearly you are seeing a situation \u2014 or what you are avoiding looking at.',
    category: 'body',
  },
  {
    id: 'hands',
    keywords: ['hands', 'hand', 'fingers', 'holding hands', 'my hands'],
    meaning: 'Hands may reflect your ability to create, hold on, let go, or connect \u2014 the tools of agency and touch.',
    category: 'body',
  },
  {
    id: 'blood',
    keywords: ['blood', 'bleeding', 'bled', 'bloody'],
    meaning: 'Blood often symbolizes life force, emotional pain, loss, sacrifice, or something vital that feels threatened.',
    category: 'body',
  },
  {
    id: 'pregnant',
    keywords: ['pregnant', 'pregnancy', 'giving birth', 'labor', 'baby bump', 'expecting'],
    meaning: 'Pregnancy in dreams often represents something new developing within you \u2014 a creative project, idea, relationship, or personal growth.',
    category: 'body',
  },
  {
    id: 'baby',
    keywords: ['baby', 'babies', 'newborn', 'infant'],
    meaning: 'A baby may reflect vulnerability, new beginnings, something that needs nurturing, or a part of yourself that feels young and unprotected.',
    category: 'body',
  },
  {
    id: 'wound',
    keywords: ['wound', 'injured', 'injury', 'hurt', 'bruise', 'scar', 'scars', 'broken bone', 'fracture'],
    meaning: 'Wounds or injuries often reflect emotional pain, unhealed experiences, or parts of you that still carry the impact of past events.',
    category: 'body',
  },
  {
    id: 'illness',
    keywords: ['sick', 'ill', 'illness', 'disease', 'hospital', 'cancer', 'tumor', 'fever', 'coughing', 'vomiting', 'nausea'],
    meaning: 'Illness in a dream may reflect emotional distress, something that feels toxic or draining, or a need for healing and rest.',
    category: 'body',
  },
  {
    id: 'death_self',
    keywords: ['I died', 'I was dying', 'my death', 'dying', 'dead'],
    meaning: 'Dreaming of death often represents the end of a chapter, a major transition, or the release of something that no longer serves you.',
    category: 'body',
  },
  {
    id: 'paralysis',
    keywords: ['paralyzed', 'couldn\'t move', 'frozen in place', 'sleep paralysis', 'body wouldn\'t move', 'legs wouldn\'t move'],
    meaning: 'Paralysis in dreams often reflects feeling stuck, powerless, or unable to act on something important in waking life.',
    category: 'body',
  },
  {
    id: 'voice_lost',
    keywords: ['couldn\'t speak', 'lost my voice', 'no voice', 'couldn\'t scream', 'couldn\'t yell', 'tried to scream', 'mouth wouldn\'t open'],
    meaning: 'Losing your voice in a dream often reflects suppressed expression \u2014 something you need to say but feel unable or unsafe to.',
    category: 'body',
  },
  {
    id: 'heart',
    keywords: ['heart', 'heartbeat', 'heart racing', 'chest pain', 'heart attack'],
    meaning: 'The heart in dreams often connects to emotional truth, love, vulnerability, or anxiety that makes itself known through the body.',
    category: 'body',
  },
  {
    id: 'breathing',
    keywords: ['breathing', 'breath', 'couldn\'t breathe', 'suffocating', 'choking', 'gasping'],
    meaning: 'Difficulty breathing may reflect feeling constricted, anxious, or emotionally suffocated in some area of your life.',
    category: 'body',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PEOPLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'mother',
    keywords: ['mom', 'mother', 'mama', 'mommy', 'my mom', 'my mother'],
    meaning: 'Your mother in a dream often reflects nurturing, safety, unresolved family dynamics, or your relationship with care and belonging.',
    category: 'people',
  },
  {
    id: 'father',
    keywords: ['dad', 'father', 'daddy', 'papa', 'my dad', 'my father'],
    meaning: 'Your father in a dream may represent authority, protection, approval-seeking, or your relationship with structure and guidance.',
    category: 'people',
  },
  {
    id: 'ex_partner',
    keywords: ['ex', 'my ex', 'ex boyfriend', 'ex girlfriend', 'ex husband', 'ex wife', 'former partner', 'old relationship'],
    meaning: 'An ex appearing in a dream often reflects unprocessed emotions, patterns you are still working through, or qualities they represent rather than the person themselves.',
    category: 'people',
  },
  {
    id: 'stranger',
    keywords: ['stranger', 'strangers', 'unknown person', 'someone I didn\'t know', 'someone I don\'t know', 'unfamiliar person', 'faceless person', 'faceless'],
    meaning: 'A stranger may represent an unknown part of yourself, a quality you haven\u2019t fully recognized, or something unfamiliar that is entering your life.',
    category: 'people',
  },
  {
    id: 'child_self',
    keywords: ['younger me', 'I was a child', 'I was a kid', 'little me', 'inner child', 'younger version of me', 'childhood self'],
    meaning: 'Seeing yourself as a child often reflects inner child work \u2014 unmet needs, old wounds, or a part of you that still carries early experiences.',
    category: 'people',
  },
  {
    id: 'celebrity',
    keywords: ['celebrity', 'famous person', 'famous', 'star', 'actor', 'singer', 'musician'],
    meaning: 'A celebrity in a dream often represents qualities you admire, aspirations, or the desire for recognition and validation.',
    category: 'people',
  },
  {
    id: 'deceased',
    keywords: ['dead person', 'deceased', 'passed away', 'who passed', 'who died', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'late'],
    meaning: 'Dreaming of someone who has passed may reflect unresolved grief, a longing for connection, or their qualities as a message from your unconscious.',
    category: 'people',
  },
  {
    id: 'boss',
    keywords: ['boss', 'manager', 'supervisor', 'employer', 'my boss'],
    meaning: 'A boss or authority figure may reflect your relationship with power, performance anxiety, or how you feel about being evaluated.',
    category: 'people',
  },
  {
    id: 'friend',
    keywords: ['friend', 'best friend', 'old friend', 'friends', 'my friend'],
    meaning: 'A friend in a dream may represent the qualities you associate with them, aspects of yourself, or the state of that relationship.',
    category: 'people',
  },
  {
    id: 'sibling',
    keywords: ['brother', 'sister', 'sibling', 'siblings', 'my brother', 'my sister'],
    meaning: 'Siblings in dreams often reflect family dynamics, rivalry, closeness, or aspects of yourself that developed alongside theirs.',
    category: 'people',
  },
  {
    id: 'partner',
    keywords: ['husband', 'wife', 'boyfriend', 'girlfriend', 'partner', 'spouse', 'significant other', 'my partner', 'my husband', 'my wife'],
    meaning: 'Your partner in a dream may reflect the current emotional state of the relationship, unspoken needs, or qualities they mirror back to you.',
    category: 'people',
  },
  {
    id: 'teacher',
    keywords: ['teacher', 'professor', 'instructor', 'mentor', 'tutor'],
    meaning: 'A teacher may represent a lesson your unconscious is working through, authority dynamics, or guidance you are seeking or resisting.',
    category: 'people',
  },
  {
    id: 'crowd',
    keywords: ['crowd', 'people everywhere', 'lots of people', 'crowded', 'audience', 'group of people', 'mob'],
    meaning: 'Crowds may reflect social anxiety, a sense of being lost in the collective, or pressure from others\u2019 expectations.',
    category: 'people',
  },
  {
    id: 'shadow_figure',
    keywords: ['dark figure', 'shadow figure', 'shadowy figure', 'hooded figure', 'figure in the dark', 'dark presence', 'shadow person'],
    meaning: 'A dark or shadowy figure often represents the Jungian shadow \u2014 disowned parts of yourself, unacknowledged fears, or repressed emotions.',
    category: 'people',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PLACES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'childhood_home',
    keywords: ['childhood home', 'old house', 'house I grew up in', 'where I grew up', 'parents house', 'parent\'s house'],
    meaning: 'Returning to your childhood home often reflects revisiting formative experiences, family patterns, or an emotional state from that time in your life.',
    category: 'places',
  },
  {
    id: 'school',
    keywords: ['school', 'classroom', 'high school', 'middle school', 'elementary school', 'college', 'university', 'campus'],
    meaning: 'School settings often reflect learning, testing, performance anxiety, or revisiting a period when your identity was being shaped.',
    category: 'places',
  },
  {
    id: 'hospital',
    keywords: ['hospital', 'emergency room', 'er', 'icu', 'doctor\'s office', 'operating room', 'surgery'],
    meaning: 'A hospital may reflect a need for healing, fear of vulnerability, or something in your life that requires urgent attention.',
    category: 'places',
  },
  {
    id: 'workplace',
    keywords: ['work', 'office', 'workplace', 'job', 'at work', 'my desk', 'the office'],
    meaning: 'The workplace in a dream often reflects your relationship with productivity, purpose, stress, or how you feel about your role in the world.',
    category: 'places',
  },
  {
    id: 'forest',
    keywords: ['forest', 'woods', 'trees', 'jungle', 'in the woods', 'deep in the forest'],
    meaning: 'A forest may represent the unknown, the unconscious mind, a journey inward, or feeling lost in complexity.',
    category: 'places',
  },
  {
    id: 'mountain',
    keywords: ['mountain', 'mountains', 'climbing a mountain', 'hill', 'hilltop', 'peak', 'summit', 'cliff'],
    meaning: 'Mountains often represent challenges, ambition, spiritual seeking, or obstacles that require sustained effort to overcome.',
    category: 'places',
  },
  {
    id: 'beach',
    keywords: ['beach', 'shore', 'shoreline', 'sand', 'seaside', 'coast'],
    meaning: 'The beach \u2014 where land meets water \u2014 often reflects the boundary between your conscious self and your emotional depths.',
    category: 'places',
  },
  {
    id: 'cave',
    keywords: ['cave', 'cavern', 'underground', 'tunnel', 'mine', 'bunker'],
    meaning: 'Caves or tunnels may represent the deep unconscious, hidden truths, retreat, or the journey into your inner world.',
    category: 'places',
  },
  {
    id: 'church_temple',
    keywords: ['church', 'temple', 'mosque', 'synagogue', 'chapel', 'altar', 'place of worship', 'sacred place'],
    meaning: 'A place of worship may reflect spiritual seeking, moral questions, a need for meaning, or connection to something larger than yourself.',
    category: 'places',
  },
  {
    id: 'cemetery',
    keywords: ['cemetery', 'graveyard', 'grave', 'tombstone', 'tomb', 'burial', 'mausoleum'],
    meaning: 'A cemetery often reflects endings, grief, memories of the past, or parts of yourself that have been laid to rest.',
    category: 'places',
  },
  {
    id: 'bridge',
    keywords: ['bridge', 'crossing a bridge', 'overpass'],
    meaning: 'A bridge may represent a transition, a decision point, or the passage from one emotional state or life phase to another.',
    category: 'places',
  },
  {
    id: 'prison',
    keywords: ['prison', 'jail', 'cell', 'locked up', 'behind bars', 'trapped in a room'],
    meaning: 'Being in prison may reflect feeling restricted, punished, trapped by circumstances, or confined by your own patterns.',
    category: 'places',
  },
  {
    id: 'desert',
    keywords: ['desert', 'barren', 'wasteland', 'dry land', 'arid'],
    meaning: 'A desert often symbolizes isolation, emotional dryness, spiritual wandering, or a period of feeling depleted.',
    category: 'places',
  },
  {
    id: 'island',
    keywords: ['island', 'stranded', 'deserted island'],
    meaning: 'An island may represent isolation, self-reliance, a desire for escape, or feeling cut off from others.',
    category: 'places',
  },
  {
    id: 'garden',
    keywords: ['garden', 'flowers', 'flower', 'blooming', 'plants', 'growing', 'seedlings'],
    meaning: 'A garden often reflects personal growth, nurturing, creativity, or the state of something you have been tending to emotionally.',
    category: 'places',
  },
  {
    id: 'dark_room',
    keywords: ['dark room', 'pitch black', 'darkness', 'in the dark', 'no light', 'blackout'],
    meaning: 'Darkness in a dream often represents the unknown, fear, unconscious material, or something you cannot yet see clearly.',
    category: 'places',
  },
  {
    id: 'airport',
    keywords: ['airport', 'terminal', 'departure gate', 'boarding'],
    meaning: 'An airport may represent transition, anticipation, the desire to escape, or preparing for a significant change.',
    category: 'places',
  },
  {
    id: 'hotel',
    keywords: ['hotel', 'motel', 'inn', 'hotel room'],
    meaning: 'A hotel may reflect a temporary emotional state, being in transition, or not quite feeling at home in your current situation.',
    category: 'places',
  },
  {
    id: 'rooftop',
    keywords: ['rooftop', 'on the roof', 'top of the building', 'edge of a building', 'ledge'],
    meaning: 'Being on a rooftop or ledge often reflects a vantage point, risk, high stakes, or the tension between aspiration and fear of falling.',
    category: 'places',
  },
  {
    id: 'bathroom',
    keywords: ['bathroom', 'toilet', 'restroom', 'public bathroom', 'dirty bathroom'],
    meaning: 'Bathrooms in dreams often relate to privacy, release, vulnerability, or something you need to process and let go of.',
    category: 'places',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MOVEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'flying',
    keywords: ['flying', 'flew', 'floating', 'levitating', 'hovering', 'soaring', 'I could fly'],
    meaning: 'Flying often reflects a sense of freedom, transcendence, ambition, or a desire to rise above current difficulties.',
    category: 'movement',
  },
  {
    id: 'falling',
    keywords: ['falling', 'fell', 'dropped', 'plummeting', 'free fall', 'falling off', 'falling down'],
    meaning: 'Falling is one of the most universal dream experiences \u2014 it often reflects a loss of control, insecurity, fear of failure, or the ground giving way beneath something you trusted.',
    category: 'movement',
  },
  {
    id: 'running',
    keywords: ['running', 'ran', 'sprinting', 'running away', 'running from', 'chasing', 'being chased'],
    meaning: 'Running \u2014 whether toward or away from something \u2014 often reflects urgency, avoidance, pursuit, or the fight-or-flight response activated in waking life.',
    category: 'movement',
  },
  {
    id: 'climbing',
    keywords: ['climbing', 'climbed', 'scaling', 'going up', 'ascending', 'climbing stairs', 'climbing a ladder'],
    meaning: 'Climbing may reflect striving, ambition, the effort to overcome something, or working your way toward a goal.',
    category: 'movement',
  },
  {
    id: 'lost',
    keywords: ['lost', 'got lost', 'couldn\'t find my way', 'wandering', 'wrong direction', 'no idea where I was', 'trying to find'],
    meaning: 'Being lost often reflects confusion about direction in life, feeling disconnected from your path, or uncertainty about a decision.',
    category: 'movement',
  },
  {
    id: 'slow_motion',
    keywords: ['slow motion', 'moving slowly', 'couldn\'t run fast', 'heavy legs', 'legs wouldn\'t move', 'sluggish'],
    meaning: 'Moving in slow motion may reflect feeling powerless, frustrated by your pace, or the sense that something important is slipping away despite your effort.',
    category: 'movement',
  },
  {
    id: 'jumping',
    keywords: ['jumping', 'jumped', 'leaping', 'leaped', 'leap of faith'],
    meaning: 'Jumping may reflect taking a risk, a leap of faith, or the decision to move past a barrier or fear.',
    category: 'movement',
  },
  {
    id: 'hiding',
    keywords: ['hiding', 'hid', 'hidden', 'hiding from', 'stayed hidden', 'tried to hide'],
    meaning: 'Hiding often reflects avoidance, shame, self-protection, or the desire to stay unseen until it feels safe to emerge.',
    category: 'movement',
  },
  {
    id: 'searching',
    keywords: ['looking for', 'searching', 'trying to find', 'couldn\'t find', 'searched everywhere'],
    meaning: 'Searching in a dream often reflects a longing \u2014 for meaning, a lost connection, a part of yourself, or something you feel is missing.',
    category: 'movement',
  },
  {
    id: 'sinking',
    keywords: ['sinking', 'sank', 'going down', 'pulled down', 'quicksand'],
    meaning: 'Sinking may reflect feeling weighed down by emotions, responsibilities, depression, or a situation that feels inescapable.',
    category: 'movement',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VEHICLES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'car',
    keywords: ['car', 'driving', 'drove', 'vehicle', 'in the car', 'my car', 'passenger seat'],
    meaning: 'Cars often represent your personal drive and direction in life \u2014 who is driving may reflect who feels in control.',
    category: 'vehicles',
  },
  {
    id: 'car_crash',
    keywords: ['car crash', 'car accident', 'crashed', 'collision', 'wreck', 'flipped over'],
    meaning: 'A car crash may reflect a sudden disruption, loss of control, a collision between different parts of your life, or a fear that things are headed somewhere dangerous.',
    category: 'vehicles',
  },
  {
    id: 'car_brakes',
    keywords: ['brakes', 'brakes didn\'t work', 'no brakes', 'couldn\'t stop', 'brake failure'],
    meaning: 'Brakes failing often reflects the feeling that something in your life is accelerating beyond your ability to control it.',
    category: 'vehicles',
  },
  {
    id: 'bus',
    keywords: ['bus', 'on the bus', 'missed the bus', 'school bus'],
    meaning: 'A bus may represent shared experience, going along with others\u2019 plans, or the pace of collective life.',
    category: 'vehicles',
  },
  {
    id: 'train',
    keywords: ['train', 'on the train', 'missed the train', 'train station', 'railroad', 'tracks', 'subway'],
    meaning: 'Trains often reflect life\u2019s trajectory \u2014 the path you\u2019re on, whether you feel on track, or the fear of missing an important transition.',
    category: 'vehicles',
  },
  {
    id: 'airplane',
    keywords: ['airplane', 'plane', 'flight', 'plane crash', 'turbulence', 'taking off', 'landing'],
    meaning: 'Airplanes may reflect ambitious goals, a desire for perspective, fear of the unknown, or major life transitions.',
    category: 'vehicles',
  },
  {
    id: 'boat',
    keywords: ['boat', 'ship', 'sailboat', 'yacht', 'canoe', 'kayak', 'raft', 'on a boat'],
    meaning: 'A boat often reflects how you are navigating your emotional world \u2014 the size, stability, and control of the vessel may mirror your inner state.',
    category: 'vehicles',
  },
  {
    id: 'bicycle',
    keywords: ['bicycle', 'bike', 'cycling', 'riding a bike'],
    meaning: 'A bicycle may reflect personal effort, balance, independence, or the simplicity of moving through life under your own power.',
    category: 'vehicles',
  },
  {
    id: 'elevator',
    keywords: ['elevator', 'lift', 'going up', 'going down', 'elevator falling', 'stuck in elevator'],
    meaning: 'Elevators often reflect transitions between emotional states or levels of awareness \u2014 rising, descending, or feeling stuck between floors.',
    category: 'vehicles',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BUILDINGS & STRUCTURES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'house',
    keywords: ['house', 'my house', 'a house', 'the house', 'home', 'apartment', 'condo'],
    meaning: 'A house often represents the self \u2014 different rooms may reflect different aspects of your psyche, memories, or emotional states.',
    category: 'buildings',
  },
  {
    id: 'hidden_room',
    keywords: ['hidden room', 'secret room', 'room I didn\'t know about', 'new room', 'extra room', 'discovered a room'],
    meaning: 'Discovering a hidden room often reflects untapped potential, forgotten parts of yourself, or new emotional capacity you didn\u2019t know you had.',
    category: 'buildings',
  },
  {
    id: 'basement',
    keywords: ['basement', 'cellar', 'underground room', 'downstairs'],
    meaning: 'The basement often represents the unconscious mind, buried memories, repressed emotions, or foundational experiences.',
    category: 'buildings',
  },
  {
    id: 'attic',
    keywords: ['attic', 'upstairs room', 'top floor', 'loft'],
    meaning: 'An attic may represent higher awareness, stored memories, old beliefs, or thoughts you\u2019ve set aside and forgotten about.',
    category: 'buildings',
  },
  {
    id: 'door',
    keywords: ['door', 'doors', 'locked door', 'open door', 'closed door', 'doorway', 'knocked on the door'],
    meaning: 'Doors often represent opportunities, transitions, or choices \u2014 whether they are open, closed, or locked may reflect access to possibilities.',
    category: 'buildings',
  },
  {
    id: 'window',
    keywords: ['window', 'windows', 'looking out the window', 'broken window'],
    meaning: 'Windows may reflect perspective, awareness, the ability to see beyond your current situation, or a barrier between you and the outside world.',
    category: 'buildings',
  },
  {
    id: 'stairs',
    keywords: ['stairs', 'staircase', 'steps', 'going upstairs', 'going downstairs', 'spiral staircase'],
    meaning: 'Stairs often represent progress, transitions between states of awareness, or the effort required to reach a new level of understanding.',
    category: 'buildings',
  },
  {
    id: 'collapsing_building',
    keywords: ['building collapsed', 'walls crumbling', 'roof caved in', 'building falling', 'structure collapsing', 'falling apart'],
    meaning: 'A collapsing building may reflect a sense that something foundational in your life \u2014 a belief, relationship, or identity \u2014 is breaking down.',
    category: 'buildings',
  },
  {
    id: 'mansion',
    keywords: ['mansion', 'big house', 'palace', 'castle'],
    meaning: 'A mansion or palace may reflect an expanded sense of self, aspirations, exploration of new inner territory, or feeling small within something vast.',
    category: 'buildings',
  },
  {
    id: 'abandoned_building',
    keywords: ['abandoned', 'abandoned building', 'run down', 'decrepit', 'empty building', 'old building', 'ruins'],
    meaning: 'Abandoned buildings may reflect neglected aspects of yourself, forgotten potential, or parts of your inner world that need attention.',
    category: 'buildings',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OBJECTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'mirror',
    keywords: ['mirror', 'reflection', 'looking in the mirror', 'saw myself'],
    meaning: 'Mirrors often reflect self-perception, identity, self-examination, or confronting who you really are beneath the surface.',
    category: 'objects',
  },
  {
    id: 'phone',
    keywords: ['phone', 'cell phone', 'texting', 'calling', 'phone call', 'phone broke', 'phone didn\'t work', 'couldn\'t call'],
    meaning: 'A phone may reflect communication, connection, or missed connections \u2014 a broken phone often signals feeling unable to reach someone or be heard.',
    category: 'objects',
  },
  {
    id: 'key',
    keywords: ['key', 'keys', 'lost my keys', 'couldn\'t find my keys', 'locked out'],
    meaning: 'Keys often represent access, solutions, power, or the ability to unlock something important \u2014 losing them may reflect feeling locked out of an answer.',
    category: 'objects',
  },
  {
    id: 'money',
    keywords: ['money', 'cash', 'wallet', 'purse', 'coins', 'bills', 'rich', 'poor', 'debt', 'broke'],
    meaning: 'Money in dreams often relates to self-worth, energy, power, security, or what you value and fear losing.',
    category: 'objects',
  },
  {
    id: 'clock',
    keywords: ['clock', 'watch', 'time', 'running out of time', 'late', 'no time', 'deadline'],
    meaning: 'Clocks and time pressure may reflect anxiety about deadlines, mortality, missed opportunities, or feeling like time is slipping away.',
    category: 'objects',
  },
  {
    id: 'knife',
    keywords: ['knife', 'blade', 'sharp', 'cutting', 'stabbed'],
    meaning: 'A knife may represent the need to cut something away, aggression, fear, a boundary that needs to be made, or something that can both harm and heal.',
    category: 'objects',
  },
  {
    id: 'gun',
    keywords: ['gun', 'pistol', 'rifle', 'shot', 'shooting', 'bullet', 'gunshot'],
    meaning: 'Guns in dreams often reflect power dynamics, fear, aggression, feeling targeted, or high-stakes situations where control is at play.',
    category: 'objects',
  },
  {
    id: 'book',
    keywords: ['book', 'books', 'reading', 'library', 'pages'],
    meaning: 'Books may represent knowledge, life lessons, accumulated wisdom, or a story you are telling yourself about who you are.',
    category: 'objects',
  },
  {
    id: 'ring',
    keywords: ['ring', 'engagement ring', 'wedding ring', 'jewelry'],
    meaning: 'A ring often reflects commitment, wholeness, promises, or the cycle of a relationship \u2014 finding or losing one may mirror relational dynamics.',
    category: 'objects',
  },
  {
    id: 'box',
    keywords: ['box', 'package', 'container', 'wrapped', 'unwrapped', 'opening a box'],
    meaning: 'A box may represent something hidden, contained, or not yet revealed \u2014 opening it often reflects discovering something about yourself.',
    category: 'objects',
  },
  {
    id: 'map',
    keywords: ['map', 'compass', 'directions', 'gps', 'navigation'],
    meaning: 'A map or compass may reflect your search for direction, clarity, or a sense of purpose in navigating what comes next.',
    category: 'objects',
  },
  {
    id: 'rope_chain',
    keywords: ['rope', 'chain', 'chains', 'tied up', 'bound', 'shackles', 'handcuffs'],
    meaning: 'Ropes or chains may reflect feeling bound, restricted, tethered to something, or the struggle between freedom and obligation.',
    category: 'objects',
  },
  {
    id: 'mask',
    keywords: ['mask', 'wearing a mask', 'mask fell off', 'disguise', 'costume'],
    meaning: 'A mask may represent the persona you present to the world, hiding your true self, or the fear of being seen as you really are.',
    category: 'objects',
  },
  {
    id: 'gift',
    keywords: ['gift', 'present', 'received a gift', 'gave a gift', 'surprise'],
    meaning: 'A gift may reflect recognition, love, an unexpected insight, or something being offered to you emotionally.',
    category: 'objects',
  },
  {
    id: 'medicine',
    keywords: ['medicine', 'pills', 'medication', 'prescription', 'drug', 'drugs'],
    meaning: 'Medicine may reflect a need for healing, a quick fix you are seeking, self-care, or something being used to numb or cope.',
    category: 'objects',
  },
  {
    id: 'letter',
    keywords: ['letter', 'note', 'message', 'letter in the mail', 'received a letter', 'wrote a letter'],
    meaning: 'A letter or message may represent a communication from your unconscious, something that needs to be said, or news you are expecting or dreading.',
    category: 'objects',
  },
  {
    id: 'photograph',
    keywords: ['photo', 'photograph', 'picture', 'album', 'old photos'],
    meaning: 'Photographs may reflect memories, nostalgia, a desire to hold onto the past, or how you perceive yourself at a particular moment.',
    category: 'objects',
  },
  {
    id: 'candle_light',
    keywords: ['candle', 'flame', 'torch', 'lantern', 'light in the dark', 'flashlight'],
    meaning: 'A light source in darkness may represent hope, guidance, awareness emerging, or the search for clarity.',
    category: 'objects',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NATURE & ELEMENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'fire',
    keywords: ['fire', 'flames', 'burning', 'on fire', 'house on fire', 'wildfire', 'bonfire', 'blaze'],
    meaning: 'Fire often represents passion, anger, transformation, destruction of the old, or emotional intensity that demands attention.',
    category: 'elements',
  },
  {
    id: 'storm',
    keywords: ['storm', 'thunder', 'lightning', 'thunderstorm', 'electrical storm'],
    meaning: 'Storms may reflect inner turmoil, emotional outbursts, cleansing, or the buildup and release of tension.',
    category: 'elements',
  },
  {
    id: 'wind',
    keywords: ['wind', 'windy', 'gust', 'blown away', 'strong wind', 'tornado', 'hurricane'],
    meaning: 'Wind or tornadoes may reflect sudden change, forces beyond your control, disruption, or the feeling of being swept up in chaos.',
    category: 'elements',
  },
  {
    id: 'earthquake',
    keywords: ['earthquake', 'ground shaking', 'the ground opened', 'tremor'],
    meaning: 'An earthquake often reflects a shaking of your foundations \u2014 major upheaval, instability, or something that disrupts what felt solid.',
    category: 'elements',
  },
  {
    id: 'snow',
    keywords: ['snow', 'snowing', 'snowstorm', 'blizzard', 'avalanche'],
    meaning: 'Snow may represent emotional coldness, purity, a fresh start, isolation, or feelings that have been frozen and buried.',
    category: 'elements',
  },
  {
    id: 'sun',
    keywords: ['sun', 'sunshine', 'bright', 'sunny', 'sunlight', 'sunrise', 'sunset'],
    meaning: 'The sun often reflects consciousness, vitality, clarity, hope, or the dawn of new awareness.',
    category: 'elements',
  },
  {
    id: 'moon',
    keywords: ['moon', 'moonlight', 'full moon', 'crescent moon', 'lunar'],
    meaning: 'The moon in dreams often connects to intuition, the feminine, cycles, emotions, and what is illuminated in the dark.',
    category: 'elements',
  },
  {
    id: 'stars',
    keywords: ['stars', 'starry', 'night sky', 'constellation', 'shooting star'],
    meaning: 'Stars may represent hope, guidance, destiny, aspiration, or the vast unknown that holds both wonder and uncertainty.',
    category: 'elements',
  },
  {
    id: 'earth_soil',
    keywords: ['dirt', 'soil', 'mud', 'muddy', 'earth', 'ground', 'digging', 'buried'],
    meaning: 'Earth or soil often reflects grounding, the body, buried truths, or things that are growing beneath the surface unseen.',
    category: 'elements',
  },
  {
    id: 'sky',
    keywords: ['sky', 'open sky', 'blue sky', 'cloudy sky', 'gray sky'],
    meaning: 'The sky often reflects your mental or spiritual state \u2014 clear sky may suggest clarity, while a dark or stormy sky may mirror inner turbulence.',
    category: 'elements',
  },
  {
    id: 'fog',
    keywords: ['fog', 'foggy', 'mist', 'misty', 'haze', 'hazy', 'smoky'],
    meaning: 'Fog or mist often reflects confusion, uncertainty, things not being clear yet, or the space between knowing and not knowing.',
    category: 'elements',
  },
  {
    id: 'rainbow',
    keywords: ['rainbow'],
    meaning: 'A rainbow may reflect hope after difficulty, integration of different parts of yourself, or the promise that emotional storms can pass.',
    category: 'elements',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SCENARIOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'being_chased',
    keywords: ['being chased', 'chased by', 'someone was chasing me', 'chasing me', 'running from someone', 'something chasing'],
    meaning: 'Being chased is one of the most common dream themes \u2014 it often reflects avoidance of a difficult emotion, situation, or part of yourself that is demanding attention.',
    category: 'scenarios',
  },
  {
    id: 'falling_dream',
    keywords: ['falling off a cliff', 'falling from a building', 'falling from the sky', 'fell off the edge'],
    meaning: 'Falling from a height may reflect the fear of losing status, stability, or control \u2014 or the experience of something solid giving way.',
    category: 'scenarios',
  },
  {
    id: 'naked_public',
    keywords: ['naked in public', 'no clothes on', 'undressed in public', 'people saw me naked'],
    meaning: 'Being naked in public often reflects vulnerability, exposure, shame, or the fear of being seen without your usual defenses.',
    category: 'scenarios',
  },
  {
    id: 'test_unprepared',
    keywords: ['unprepared for a test', 'forgot about the test', 'exam I didn\'t study for', 'final exam', 'didn\'t study', 'pop quiz'],
    meaning: 'Being unprepared for a test often reflects performance anxiety, self-doubt, fear of being evaluated, or a situation where you feel unready.',
    category: 'scenarios',
  },
  {
    id: 'late',
    keywords: ['running late', 'going to be late', 'missed it', 'too late', 'late for', 'arrived late'],
    meaning: 'Being late often reflects anxiety about missing an opportunity, not meeting expectations, or the pressure of time.',
    category: 'scenarios',
  },
  {
    id: 'trapped',
    keywords: ['trapped', 'stuck', 'couldn\'t get out', 'no way out', 'locked in', 'cornered'],
    meaning: 'Feeling trapped may reflect a waking-life situation where you feel confined, powerless, or unable to see a way forward.',
    category: 'scenarios',
  },
  {
    id: 'war_battle',
    keywords: ['war', 'battle', 'soldier', 'military', 'army', 'combat', 'battlefield'],
    meaning: 'War or battle in a dream may reflect inner conflict, external pressure, feeling under attack, or fighting for something important.',
    category: 'scenarios',
  },
  {
    id: 'wedding',
    keywords: ['wedding', 'getting married', 'marriage', 'bride', 'groom', 'ceremony'],
    meaning: 'A wedding may represent commitment, union of different parts of yourself, a new beginning, or anxiety about a major life decision.',
    category: 'scenarios',
  },
  {
    id: 'funeral_dream',
    keywords: ['funeral', 'wake', 'casket', 'coffin', 'mourning', 'eulogy'],
    meaning: 'A funeral often represents the ending of something \u2014 a belief, a phase, a relationship \u2014 and the grief that comes with letting go.',
    category: 'scenarios',
  },
  {
    id: 'moving_house',
    keywords: ['moving', 'packing', 'boxes', 'new house', 'moving out', 'moving in', 'relocating'],
    meaning: 'Moving houses often reflects major life transitions, shifting identity, leaving behind old patterns, or entering a new emotional space.',
    category: 'scenarios',
  },
  {
    id: 'going_back',
    keywords: ['went back to', 'returned to', 'back in', 'back at', 'revisiting', 'was back in my old'],
    meaning: 'Returning to a familiar place from the past may reflect unfinished emotional business, nostalgia, or patterns that are being revisited.',
    category: 'scenarios',
  },
  {
    id: 'apocalypse',
    keywords: ['end of the world', 'apocalypse', 'world ending', 'nuclear', 'extinction', 'doomsday'],
    meaning: 'An apocalypse may reflect the feeling that everything you knew is ending \u2014 major internal change, breakdown of belief systems, or overwhelming stress.',
    category: 'scenarios',
  },
  {
    id: 'cheating_dream',
    keywords: ['cheating', 'cheated on me', 'affair', 'infidelity', 'with someone else', 'caught cheating'],
    meaning: 'Dreaming of infidelity often reflects insecurity, trust issues, fear of abandonment, or feeling that something important is being taken away.',
    category: 'scenarios',
  },
  {
    id: 'arguing',
    keywords: ['arguing', 'argument', 'fight', 'fighting', 'yelling', 'screaming at', 'confrontation'],
    meaning: 'Arguments in dreams often reflect inner conflict, unresolved tension with someone, or emotions you haven\u2019t expressed in waking life.',
    category: 'scenarios',
  },
  {
    id: 'being_watched',
    keywords: ['being watched', 'someone watching', 'eyes on me', 'surveillance', 'being followed', 'stalked'],
    meaning: 'Feeling watched may reflect self-consciousness, paranoia, hypervigilance, or the sense that your actions are being scrutinized.',
    category: 'scenarios',
  },
  {
    id: 'rescue',
    keywords: ['rescued', 'saved me', 'someone saved', 'rescue', 'helped me escape'],
    meaning: 'Being rescued may reflect a desire for help, feeling unable to save yourself, or the arrival of inner resources you didn\u2019t know you had.',
    category: 'scenarios',
  },
  {
    id: 'flying_airplane_crash',
    keywords: ['plane crash', 'plane falling', 'plane going down'],
    meaning: 'A plane crash may reflect the collapse of high ambitions, losing altitude on a goal, or anxiety about something major going wrong.',
    category: 'scenarios',
  },
  {
    id: 'discovering',
    keywords: ['discovered', 'found out', 'realized', 'suddenly knew', 'secret revealed'],
    meaning: 'Discovery in a dream often reflects emerging awareness \u2014 something your unconscious is bringing to light that your waking mind hasn\u2019t fully processed.',
    category: 'scenarios',
  },
  {
    id: 'reunited',
    keywords: ['reunited', 'saw again', 'found them', 'they came back', 'together again'],
    meaning: 'Reuniting with someone may reflect longing, the return of a quality they represent, wishful thinking, or emotional repair that is underway.',
    category: 'scenarios',
  },
  {
    id: 'escaping',
    keywords: ['escaped', 'escaping', 'got away', 'broke free', 'managed to escape'],
    meaning: 'Escaping may reflect a breakthrough, the desire to leave a confining situation, or the relief of finally breaking free from something.',
    category: 'scenarios',
  },
  {
    id: 'dying_someone',
    keywords: ['someone died', 'they died', 'he died', 'she died', 'death of', 'killed'],
    meaning: 'Someone dying in a dream often represents the end of what that person symbolizes to you \u2014 a quality, a role, a chapter \u2014 rather than a literal prediction.',
    category: 'scenarios',
  },
  {
    id: 'giving_birth',
    keywords: ['giving birth', 'had a baby', 'delivering a baby', 'the baby was born'],
    meaning: 'Giving birth often reflects the emergence of something new \u2014 an idea, a creative effort, a new aspect of yourself coming into the world.',
    category: 'scenarios',
  },
  {
    id: 'losing_something',
    keywords: ['lost my', 'couldn\'t find my', 'misplaced', 'missing', 'disappeared'],
    meaning: 'Losing something important may reflect anxiety about security, identity, competence, or the fear that something meaningful is slipping away.',
    category: 'scenarios',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COLORS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'red',
    keywords: ['red', 'crimson', 'scarlet', 'blood red'],
    meaning: 'Red often symbolizes passion, anger, urgency, love, or danger \u2014 strong emotion that demands to be felt.',
    category: 'colors',
  },
  {
    id: 'blue',
    keywords: ['blue', 'deep blue', 'light blue', 'navy'],
    meaning: 'Blue may reflect sadness, tranquility, depth of feeling, communication, or emotional truth.',
    category: 'colors',
  },
  {
    id: 'black',
    keywords: ['black', 'pitch black', 'all black', 'dark'],
    meaning: 'Black often represents the unknown, the unconscious, grief, mystery, or the absence of clarity.',
    category: 'colors',
  },
  {
    id: 'white',
    keywords: ['white', 'bright white', 'pure white', 'all white'],
    meaning: 'White may symbolize purity, new beginnings, clarity, emptiness, or something stripped down to its essence.',
    category: 'colors',
  },
  {
    id: 'gold',
    keywords: ['gold', 'golden', 'glowing gold'],
    meaning: 'Gold often represents something precious, wisdom, achievement, spiritual value, or what you treasure most.',
    category: 'colors',
  },
  {
    id: 'green',
    keywords: ['green', 'bright green', 'dark green'],
    meaning: 'Green may reflect growth, healing, envy, nature, renewal, or the heart space.',
    category: 'colors',
  },
  {
    id: 'purple',
    keywords: ['purple', 'violet', 'lavender'],
    meaning: 'Purple often relates to intuition, spirituality, mystery, royalty, or the integration of opposites.',
    category: 'colors',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLOTHING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'clothes',
    keywords: ['clothes', 'outfit', 'dressed', 'getting dressed', 'wearing'],
    meaning: 'Clothing in dreams often reflects your persona \u2014 the image you present, how protected you feel, or how you want to be seen.',
    category: 'clothing',
  },
  {
    id: 'uniform',
    keywords: ['uniform', 'scrubs', 'suit', 'formal wear', 'work clothes'],
    meaning: 'A uniform may reflect role identity, conformity, belonging to a group, or feeling defined by your function.',
    category: 'clothing',
  },
  {
    id: 'shoes',
    keywords: ['shoes', 'barefoot', 'no shoes', 'boots', 'heels', 'sneakers'],
    meaning: 'Shoes often reflect your stance in life, readiness, grounding \u2014 being barefoot may mean feeling exposed or unprotected.',
    category: 'clothing',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FOOD & DRINK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'eating',
    keywords: ['eating', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'hungry', 'starving'],
    meaning: 'Eating in a dream may reflect nourishment, satisfaction, appetite for experience, or what you are taking in emotionally.',
    category: 'food',
  },
  {
    id: 'cooking',
    keywords: ['cooking', 'cooked', 'kitchen', 'baking', 'recipe'],
    meaning: 'Cooking may represent creativity, preparation, transformation of raw materials, or nurturing yourself and others.',
    category: 'food',
  },
  {
    id: 'drinking',
    keywords: ['drinking', 'alcohol', 'wine', 'beer', 'drunk', 'intoxicated', 'bar', 'glass of'],
    meaning: 'Drinking may reflect self-medication, celebration, the desire to loosen control, or exploring altered states of feeling.',
    category: 'food',
  },
  {
    id: 'rotten_food',
    keywords: ['rotten', 'spoiled', 'expired', 'moldy', 'rotten food', 'bad food'],
    meaning: 'Rotten or spoiled food may reflect something in your life that has gone past its time \u2014 a relationship, belief, or situation that is no longer nourishing.',
    category: 'food',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TECHNOLOGY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'computer',
    keywords: ['computer', 'laptop', 'screen', 'internet', 'website', 'social media'],
    meaning: 'Technology in dreams may reflect communication, information overload, your online persona, or the gap between virtual and real connection.',
    category: 'technology',
  },
  {
    id: 'robot',
    keywords: ['robot', 'ai', 'android', 'machine', 'cyborg'],
    meaning: 'Robots or machines may reflect automation, loss of humanity, doing things mechanically, or the fear of being replaced.',
    category: 'technology',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'past',
    keywords: ['the past', 'long ago', 'years ago', 'in the past', 'when I was young', 'old times'],
    meaning: 'The past appearing in a dream often reflects unresolved events, nostalgia, lessons being revisited, or emotions that haven\u2019t been fully processed.',
    category: 'time',
  },
  {
    id: 'future',
    keywords: ['the future', 'someday', 'years from now', 'in the future', 'futuristic'],
    meaning: 'Dreaming of the future may reflect anticipation, anxiety about what\u2019s ahead, hopes, or the mind rehearsing possibilities.',
    category: 'time',
  },
  {
    id: 'night',
    keywords: ['nighttime', 'at night', 'it was dark', 'middle of the night', 'night'],
    meaning: 'Night in a dream often reflects the unconscious, things hidden from awareness, rest, or the darker emotional territory you navigate when defenses are down.',
    category: 'time',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SPIRITUAL / ARCHETYPAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'angel',
    keywords: ['angel', 'angels', 'guardian angel', 'wings', 'divine being'],
    meaning: 'An angel may reflect guidance, protection, higher wisdom, or a messenger from the deeper layers of your psyche.',
    category: 'spiritual',
  },
  {
    id: 'demon',
    keywords: ['demon', 'devil', 'evil', 'evil presence', 'possession', 'possessed', 'demonic'],
    meaning: 'Demons in dreams often represent repressed fears, shadow aspects, intense guilt, or inner forces that feel beyond your control.',
    category: 'spiritual',
  },
  {
    id: 'god',
    keywords: ['god', 'divine', 'higher power', 'universe', 'cosmic'],
    meaning: 'A divine presence may reflect your relationship with meaning, purpose, morality, authority, or something larger than yourself.',
    category: 'spiritual',
  },
  {
    id: 'flying_spiritual',
    keywords: ['ascending', 'rising up', 'going to heaven', 'leaving my body', 'out of body', 'astral'],
    meaning: 'Spiritual ascension in dreams may reflect transcendence, the desire to escape physical limitations, or expanding consciousness.',
    category: 'spiritual',
  },
  {
    id: 'crystal',
    keywords: ['crystal', 'crystals', 'gemstone', 'diamond', 'stone', 'quartz', 'amethyst'],
    meaning: 'Crystals or gemstones may reflect inner clarity, things of value being formed under pressure, or spiritual energy.',
    category: 'spiritual',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PERCEPTION / SENSORY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'music',
    keywords: ['music', 'singing', 'song', 'melody', 'playing music', 'instrument'],
    meaning: 'Music in a dream often reflects emotional expression, harmony or dissonance, creativity, or something your soul is trying to communicate.',
    category: 'perception',
  },
  {
    id: 'smell',
    keywords: ['smell', 'smelled', 'scent', 'aroma', 'stench', 'perfume'],
    meaning: 'Smells in dreams often connect to memory and emotion \u2014 a familiar scent may be surfacing an old feeling or association.',
    category: 'perception',
  },
  {
    id: 'pain',
    keywords: ['pain', 'painful', 'it hurt', 'aching', 'throbbing'],
    meaning: 'Physical pain in a dream often reflects emotional pain, unprocessed trauma, or the body\u2019s way of communicating distress.',
    category: 'perception',
  },
  {
    id: 'silence',
    keywords: ['silence', 'silent', 'quiet', 'no sound', 'complete silence', 'muted'],
    meaning: 'Silence may reflect isolation, peace, suspension, or the absence of communication when something needs to be said.',
    category: 'perception',
  },
  {
    id: 'explosion',
    keywords: ['explosion', 'exploded', 'bomb', 'blast', 'detonation'],
    meaning: 'An explosion may reflect suppressed emotions erupting, sudden change, anger that has been building, or a shock to your system.',
    category: 'perception',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RELATIONSHIPS / ACTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'hugging',
    keywords: ['hugging', 'hugged', 'embrace', 'held each other'],
    meaning: 'Hugging often reflects a desire for closeness, comfort, reconciliation, or emotional safety.',
    category: 'relationships',
  },
  {
    id: 'kissing',
    keywords: ['kissing', 'kissed', 'almost kissed'],
    meaning: 'Kissing may represent intimacy, desire, merging, acceptance, or the union of different parts of yourself.',
    category: 'relationships',
  },
  {
    id: 'crying',
    keywords: ['crying', 'sobbing', 'tears', 'wept', 'weeping', 'bawling'],
    meaning: 'Crying in a dream often reflects emotional release, grief, relief, or feelings that need to surface and be witnessed.',
    category: 'relationships',
  },
  {
    id: 'laughing',
    keywords: ['laughing', 'laughed', 'funny', 'comedy', 'laughter'],
    meaning: 'Laughter may reflect release, joy, coping, or sometimes a defense against something that feels uncomfortable.',
    category: 'relationships',
  },
  {
    id: 'apologizing',
    keywords: ['apologized', 'sorry', 'apologizing', 'said sorry', 'forgiveness', 'forgave'],
    meaning: 'Apologizing or forgiving may reflect guilt, the desire for repair, self-forgiveness, or working through a relational wound.',
    category: 'relationships',
  },
  {
    id: 'protecting',
    keywords: ['protecting', 'protected', 'shielded', 'guarded', 'defended'],
    meaning: 'Protecting someone may reflect your nurturing instincts, a desire to control outcomes, or anxiety about someone\u2019s safety.',
    category: 'relationships',
  },
  {
    id: 'betrayal_act',
    keywords: ['betrayed', 'backstabbed', 'turned against me', 'took their side'],
    meaning: 'Experiencing betrayal in a dream often reflects broken trust, fear of vulnerability, or relational wounds that haven\u2019t fully healed.',
    category: 'relationships',
  },
  {
    id: 'abandoned_feeling',
    keywords: ['left me', 'walked away', 'left alone', 'abandoned me', 'nobody came'],
    meaning: 'Feeling abandoned may reflect attachment wounds, fear of being left, or the echo of times when support wasn\u2019t there when you needed it.',
    category: 'relationships',
  },
  {
    id: 'chasing_someone',
    keywords: ['I was chasing', 'running after', 'trying to catch', 'couldn\'t reach them'],
    meaning: 'Chasing someone may reflect pursuit of a goal, fear of losing something important, or the desire to reconnect with someone or some part of yourself.',
    category: 'relationships',
  },
  {
    id: 'holding',
    keywords: ['holding', 'held', 'carrying', 'carried', 'holding on', 'couldn\'t let go'],
    meaning: 'Holding something or someone may reflect attachment, responsibility, the emotional weight you carry, or a refusal to release what no longer serves.',
    category: 'relationships',
  },
];

// ─── Lookup Indices (built once at load time) ────────────────────────────────

/** Map from lowercased keyword → DreamKeywordEntry[] */
const _keywordIndex: Map<string, DreamKeywordEntry[]> = new Map();

for (const entry of DREAM_KEYWORDS) {
  for (const kw of entry.keywords) {
    const lower = kw.toLowerCase();
    const existing = _keywordIndex.get(lower);
    if (existing) {
      existing.push(entry);
    } else {
      _keywordIndex.set(lower, [entry]);
    }
  }
}

/** All unique keywords sorted longest-first (for greedy matching) */
const _allKeywordsSorted: string[] = Array.from(_keywordIndex.keys())
  .sort((a, b) => b.length - a.length);

// ─── Matcher ──────────────────────────────────────────────────────────────────

export type KeywordMatch = {
  entry: DreamKeywordEntry;
  /** The keyword that matched */
  matchedKeyword: string;
  /** Start index in the lowercased text */
  index: number;
};

/**
 * Scan dream text for known symbols/keywords.
 * Returns matched entries, deduplicated by entry id (first match wins).
 * Sorted by position in text (earliest mention first).
 */
export function matchDreamKeywords(dreamText: string): KeywordMatch[] {
  if (!dreamText || dreamText.trim().length < 3) return [];

  const lower = dreamText.toLowerCase();
  const seen = new Set<string>(); // entry id
  const matches: KeywordMatch[] = [];

  for (const kw of _allKeywordsSorted) {
    // Word boundary check: keyword must not be inside another word
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(kw, searchFrom);
      if (idx === -1) break;

      // Check word boundaries
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const after = idx + kw.length < lower.length ? lower[idx + kw.length] : ' ';
      const isWordBoundary =
        /[\s,.!?;:\-\u2014()"']/.test(before) || idx === 0;
      const isWordBoundaryAfter =
        /[\s,.!?;:\-\u2014()"']/.test(after) || idx + kw.length === lower.length;

      if (isWordBoundary && isWordBoundaryAfter) {
        const entries = _keywordIndex.get(kw) ?? [];
        for (const entry of entries) {
          if (!seen.has(entry.id)) {
            seen.add(entry.id);
            matches.push({ entry, matchedKeyword: kw, index: idx });
          }
        }
      }

      searchFrom = idx + 1;
    }
  }

  // Sort by position in text (earliest mention first)
  matches.sort((a, b) => a.index - b.index);

  return matches;
}
