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

  bridge: {
    label: 'A bridge',
    archetype: 'Threshold',
    themes: ['crossing over', 'connection between two states', 'a decision point'],
    interpretations: [
      'Bridges in dreams often appear when you are navigating a transition — leaving one state of being or phase of life and moving toward another.',
      'A bridge tends to represent a connection between where you are and where you are going. Its condition often reflects how you feel about this transition.',
    ],
  },

  key: {
    label: 'A key',
    archetype: 'Integration',
    themes: ['access', 'a new solution', 'unlocking a suppressed memory or capability'],
    interpretations: [
      'Finding or using a key in a dream often suggests you are discovering a solution or gaining access to something that was previously unavailable to you.',
      'Keys point toward unlocking something — a new understanding, an opportunity, or a part of yourself that has been kept closed off.',
    ],
  },

  clock: {
    label: 'A clock or watch',
    archetype: 'Persona',
    themes: ['social pressure', 'the passage of time', 'fear of being "late" to a life stage'],
    interpretations: [
      'Clocks in dreams frequently reflect waking anxieties about time — feeling rushed, falling behind, or the pressure of external expectations and milestones.',
      'A focus on time or clocks often highlights a tension between your natural inner pace and the demands of the outer world.',
    ],
  },

  mask: {
    label: 'A mask',
    archetype: 'Persona',
    themes: ['what you hide from others', 'the roles you play', 'the gap between your inner and outer self'],
    interpretations: [
      'Masks in dreams often explore the persona — the face you present to the world versus who you are underneath. They ask to be removed or investigated.',
      'When masks appear, they tend to reflect the roles we play for safety or social acceptance, bringing attention to the gap between performance and authenticity.',
    ],
  },

  // ─── Additional Symbols ───────────────────────────────────────────────────────

  spider: {
    label: 'A spider or web',
    archetype: 'Shadow',
    themes: ['creative complexity', 'feeling entangled', 'hidden patience or dread'],
    interpretations: [
      'Spiders in dreams often carry a dual symbolism — they weave and create, but they also trap. Something in your life may require delicate, patient construction, or it may feel like an invisible web drawing you in.',
      'A spider can represent the shadow side of creativity — something intricate forming just outside your awareness. The web may be yours to weave, or one you\'ve wandered into.',
      'Spiders are often associated with female creative energy, patience, and the weaving of fate. Whether the spider felt threatening or fascinating shapes the message: are you the weaver or the caught?',
    ],
  },

  insects: {
    label: 'Insects or bugs',
    archetype: 'Shadow',
    themes: ['small irritations compounding', 'something that "bugs" you', 'neglected details'],
    interpretations: [
      'Insects in dreams often represent the small things that have accumulated — minor anxieties, unspoken irritations, or details you\'ve been dismissing that are now demanding attention.',
      'Bugs frequently appear when something beneath notice is starting to matter — an itch of awareness, a problem that started small but now swarms.',
      'The type of insect shapes the meaning: bees may reflect collective effort or social pressure, ants may suggest industriousness or feeling small, and flies may point to decay or neglect.',
    ],
  },

  naked: {
    label: 'Being naked or exposed',
    archetype: 'Persona',
    themes: ['vulnerability', 'the fear of being truly seen', 'stripped of your usual defenses'],
    interpretations: [
      'Nudity in dreams is rarely sexual — it tends to carry the feeling of exposure, of being seen without your usual protections. Something in your waking life may be asking you to show up without armor.',
      'Being naked often reflects a fear of vulnerability or judgment — the sense that others can see something you\'d prefer to keep hidden. Your response in the dream (shame, freedom, indifference) is telling.',
      'Dreams of nudity can also carry liberation — the relief of no longer performing. Were you terrified of being seen, or was there a strange freedom in it?',
    ],
  },

  stairs: {
    label: 'Stairs or an elevator',
    archetype: 'Threshold',
    themes: ['ascent or descent', 'levels of awareness', 'moving between states of being'],
    interpretations: [
      'Stairs and elevators often represent movement between different levels of consciousness or status. Going up can signal ambition or expanding awareness; going down can signal going deeper within.',
      'The direction matters — ascending toward something emerging, descending toward something buried. How the movement felt (effortful, smooth, frightening) mirrors your inner experience of the transition.',
      'Elevators in particular can reflect the pace and control of change — are you pressing the buttons, or is the elevator moving on its own?',
    ],
  },

  storm: {
    label: 'A storm',
    archetype: 'Transformation',
    themes: ['emotional upheaval', 'something that cannot be controlled', 'the release before calm'],
    interpretations: [
      'Storms in dreams often mirror emotional intensity in waking life — something building toward release, a tension that cannot be contained any longer. What has been accumulating?',
      'A storm can be terrifying or cleansing, depending on your relationship to the emotions it represents. After the storm passes, what remains? That is usually the message.',
      'Storm dreams tend to appear during periods of upheaval or when emotions have been suppressed. The storm itself is not the problem — it is the release.',
    ],
  },

  food: {
    label: 'Food or eating',
    archetype: 'Integration',
    themes: ['nourishment', 'what you are taking in or denying yourself', 'hunger beyond the physical'],
    interpretations: [
      'Food in dreams often reflects a deeper hunger — for connection, meaning, pleasure, or care. What you were eating (or unable to eat) tends to mirror what you\'re craving or starving for in waking life.',
      'Eating can represent taking something in — absorbing a new experience, accepting nourishment, or processing something difficult. Were you savoring, choking, or empty?',
      'Dreams of food preparation often signal a creative or nurturing process. You may be building something that feeds others or tending to your own needs in a way that requires care.',
    ],
  },

  clothing: {
    label: 'Clothing or costume',
    archetype: 'Persona',
    themes: ['identity and presentation', 'the roles you inhabit', 'what you wear to face the world'],
    interpretations: [
      'Clothing in dreams reflects identity — how you dress yourself for the world, the roles you step into, and whether those roles still fit. Ill-fitting clothes often signal a role that no longer matches who you are.',
      'What you\'re wearing (or not wearing) tends to mirror how comfortable you feel in your current identity. New clothes can mean a new self emerging; old clothes may reference a former version of you.',
      'Wearing someone else\'s clothes may suggest you\'re adopting their perspective or feeling pressure to be someone you\'re not.',
    ],
  },

  blood: {
    label: 'Blood',
    archetype: 'Transformation',
    themes: ['life force', 'emotional wounding', 'sacrifice or deep feeling'],
    interpretations: [
      'Blood in dreams often carries emotional intensity — it can represent vitality, passion, sacrifice, or the pain of an emotional wound. Where the blood appears tends to point to the source of the feeling.',
      'Dreaming of blood can signal that something has cut deep — a loss, a betrayal, or an experience that reached the core. It may also represent the life force that sustains you despite difficulty.',
      'Blood can symbolize connection to family, lineage, or the bonds that tie us to others. It may also reflect something primal that demands acknowledgment.',
    ],
  },

  fight: {
    label: 'Fighting or conflict',
    archetype: 'Shadow',
    themes: ['inner conflict', 'standing your ground', 'power struggles'],
    interpretations: [
      'Fighting in dreams often represents internal conflict — two parts of yourself at odds, or a struggle to assert your will in a situation that feels threatening.',
      'Dreams of conflict may reflect suppressed anger or frustration that hasn\'t found expression. Who or what you were fighting often mirrors the tension you\'re holding.',
      'Fighting can also carry a positive energy — the willingness to stand your ground and defend something that matters. Were you fighting for survival or for something you believe in?',
    ],
  },

  crying: {
    label: 'Crying or tears',
    archetype: 'Integration',
    themes: ['emotional release', 'grief asking to be felt', 'the body processing what the mind resists'],
    interpretations: [
      'Crying in dreams often represents an emotional release that your waking self has not yet allowed. Tears tend to carry what words cannot — something that needs to be felt rather than understood.',
      'Dreams of crying may signal unprocessed grief, relief, or the softening of a defense that has been held tightly. The tears themselves are often healing.',
      'If you woke with the feeling of having cried — even without remembering the images — your inner world may be processing a sadness or tenderness that your daily life hasn\'t made space for.',
    ],
  },

  wedding: {
    label: 'A wedding or ceremony',
    archetype: 'Integration',
    themes: ['commitment', 'union of opposing parts', 'a significant threshold being honored'],
    interpretations: [
      'Weddings in dreams often symbolize union — the joining of two things within yourself, a commitment being made, or a transition being formally honored.',
      'A dream wedding may reflect the integration of different qualities within you — masculine and feminine, thinking and feeling, duty and desire. Something is coming together.',
      'Wedding dreams can also carry anxiety about commitment, expectations, or the permanence of a choice. Whether the ceremony felt joyful or overwhelming shapes the message.',
    ],
  },

  hospital: {
    label: 'A hospital or illness',
    archetype: 'Transformation',
    themes: ['healing needed', 'something requiring care', 'a wound being attended to'],
    interpretations: [
      'Hospitals in dreams tend to appear when something within you needs attention or healing — not necessarily physical, but emotional, relational, or spiritual.',
      'Illness in a dream can represent something that isn\'t working, something out of balance, or a wound that has gone untended. What part of your life needs care right now?',
      'Being in a hospital may also reflect the process of being healed — the vulnerability of surrendering to care and allowing others (or yourself) to attend to what hurts.',
    ],
  },

  prison: {
    label: 'A prison or being trapped',
    archetype: 'Shadow',
    themes: ['confinement', 'self-imposed limitation', 'a situation you feel powerless to leave'],
    interpretations: [
      'Prison dreams often reflect a feeling of being trapped — by circumstances, by relationships, by your own beliefs or patterns. The bars may be more internal than external.',
      'Being confined in a dream may ask the question: what are you staying in that no longer serves you? The imprisonment may not come from outside — it may be a pattern of your own making.',
      'These dreams can also represent guilt or self-punishment — a part of you that feels it deserves to be locked away. What would it mean to set that part free?',
    ],
  },

  underwater: {
    label: 'Being underwater',
    archetype: 'Integration',
    themes: ['deep immersion in feeling', 'the depths of the unconscious', 'overwhelm or total surrender'],
    interpretations: [
      'Being underwater often represents full immersion in the emotional or unconscious realm — going deeper than the surface allows. Whether you could breathe is significant: were you drowning or at home in the deep?',
      'Underwater dreams can carry the quality of overwhelm — the sense of being in over your head — or they can signal a willing descent into the depths of yourself.',
      'If you moved freely underwater, something in you may be ready to explore what lies beneath. If you struggled, something is asking for more emotional breathing room.',
    ],
  },

  phone: {
    label: 'A phone or trying to communicate',
    archetype: 'Persona',
    themes: ['connection and disconnection', 'a message trying to reach you', 'frustration in being heard'],
    interpretations: [
      'Phone dreams often explore communication — the desire to reach someone, to be heard, or to receive a message. A phone that won\'t work often signals frustration in connection.',
      'If the call wouldn\'t go through, something in your waking life may be struggling to be communicated. Who were you trying to reach, and what did you need to say?',
      'A ringing phone you can\'t answer may represent an opportunity or insight trying to reach you — something calling for your attention that you haven\'t been able to receive.',
    ],
  },

  cave: {
    label: 'A cave',
    archetype: 'Shadow',
    themes: ['inner exploration', 'the hidden interior', 'retreat or descent into the self'],
    interpretations: [
      'Caves in dreams represent the interior — the hidden places within you that hold treasures, fears, or both. Entering a cave is often the beginning of a deeper inner journey.',
      'A cave can be a place of retreat and safety or a place of fear and isolation. How it felt — shelter or prison — reflects your current relationship to solitude and introspection.',
      'Caves are ancient symbols of initiation. Going in signals a willingness to face what you cannot see; emerging signals rebirth with new understanding.',
    ],
  },

  treasure: {
    label: 'Finding something valuable',
    archetype: 'Self',
    themes: ['hidden worth', 'discovering inner resources', 'something precious that was buried'],
    interpretations: [
      'Finding treasure in a dream often points to discovering something valuable within yourself — a talent, a truth, a quality you didn\'t know you had.',
      'What was the treasure? Its nature — gold, a jewel, a letter, something ordinary made precious — tends to mirror what your inner life is revealing to you right now.',
      'Treasure dreams often arrive during periods of self-discovery or when something long buried is ready to surface. What have you been overlooking that holds more value than you realized?',
    ],
  },

  music: {
    label: 'Music or singing',
    archetype: 'Anima',
    themes: ['emotional expression', 'harmony or dissonance', 'the soul\'s voice'],
    interpretations: [
      'Music in dreams often reflects the emotional frequency of your inner life — harmonious, chaotic, sorrowful, or ecstatic. What you heard tends to mirror what you\'re feeling beneath words.',
      'Singing in a dream can signal self-expression that has been suppressed — a voice that wants to be heard, a truth that wants to be spoken through feeling rather than logic.',
      'If the music felt beautiful, something in you is in alignment. If it felt discordant, something may be out of tune — a relationship, a situation, or your own inner state.',
    ],
  },

  climbing: {
    label: 'Climbing or ascending',
    archetype: 'Self',
    themes: ['effort and ambition', 'overcoming obstacles', 'the work of rising above a challenge'],
    interpretations: [
      'Climbing in dreams reflects effort — the sense of working toward something higher, whether that\'s a goal, a new perspective, or an inner challenge you\'re ascending through.',
      'The difficulty of the climb matters: easy and smooth, or grueling and precarious? This mirrors how you\'re experiencing your current upward movement in life.',
      'Reaching the top often carries revelation or perspective. Not reaching it may not mean failure — it may mean the journey itself is the current message.',
    ],
  },

  fog: {
    label: 'Fog or mist',
    archetype: 'Threshold',
    themes: ['uncertainty', 'something obscured', 'the liminal space before clarity arrives'],
    interpretations: [
      'Fog in dreams often represents a period of not-knowing — visibility reduced, direction unclear. It rarely signals danger; more often, it asks for patience with the unclear.',
      'Mist can be the prelude to revelation. Something is there but not yet visible. The fog may lift on its own — this dream invites trust in what is emerging.',
      'Walking through fog reflects navigating life when the path is obscured. Are you pushing forward or standing still? Both can be the right response, depending on the situation.',
    ],
  },

  island: {
    label: 'An island',
    archetype: 'Self',
    themes: ['isolation', 'self-sufficiency', 'a private interior world'],
    interpretations: [
      'Islands in dreams can represent both isolation and sanctuary — a place apart from everything else, for better or worse. Do you feel stranded or protected?',
      'An island may reflect a sense of separateness from others — emotional distance, independence, or a need for solitude. Whether this feels chosen or imposed shapes the meaning.',
      'Islands can also represent your innermost self — the part of you that exists apart from all roles and relationships. What was on the island? That is often the core message.',
    ],
  },

  gate: {
    label: 'A gate or fence',
    archetype: 'Threshold',
    themes: ['boundaries', 'what is guarded or kept out', 'the edge of permission'],
    interpretations: [
      'Gates and fences in dreams represent boundaries — between you and something else, between what is allowed and what is forbidden. Was the gate open or closed? Could you pass through?',
      'A locked gate may symbolize a limitation you\'re encountering — real or self-imposed. An open gate may be an invitation to enter new territory.',
      'Fences can also represent healthy boundaries being set or tested. Something in your life may require clearer edges, or a boundary you\'ve set may be ready to shift.',
    ],
  },

  rain: {
    label: 'Rain',
    archetype: 'Transformation',
    themes: ['emotional cleansing', 'sadness releasing', 'renewal arriving through feeling'],
    interpretations: [
      'Rain in dreams often carries cleansing — the release of emotions that have been building. Gentle rain tends to signal quiet healing; downpours can reflect overwhelming feeling needing to pass.',
      'Rain can be both melancholy and nourishing. It feeds what grows. Something in you may need to let sadness fall before new growth can begin.',
      'Getting caught in the rain may represent being immersed in feelings you didn\'t plan for — an emotional experience arriving uninvited but perhaps needed.',
    ],
  },

  flower: {
    label: 'A flower or blossoming',
    archetype: 'Self',
    themes: ['growth becoming visible', 'beauty and fragility', 'something blooming in you'],
    interpretations: [
      'Flowers in dreams tend to represent something that is opening — a new awareness, a tenderness, or a beauty that is beginning to show itself in your life.',
      'The type and state of the flower matters. A bloom in full color may signal vitality and confidence; a wilting flower may reflect something that needs tending.',
      'Flowers can also carry themes of impermanence — beauty that doesn\'t last forever. What in your life deserves appreciation while it is still in bloom?',
    ],
  },

  moon: {
    label: 'The moon',
    archetype: 'Anima',
    themes: ['intuition', 'cycles and rhythm', 'the illumination that comes from reflection rather than direct light'],
    interpretations: [
      'The moon in dreams often represents intuition, the inner world, and the light that shines in darkness. Its phase matters — full moonlight may signal clarity; a new moon, hidden potential.',
      'Moon dreams tend to appear when something in you is operating by feeling rather than logic — a knowing that doesn\'t come from reason but from deeper awareness.',
      'The moon reflects rather than generates light. Something in your life may be illuminated not by direct understanding but by reflection — seeing things from a quieter, more interior vantage point.',
    ],
  },

  sun: {
    label: 'The sun',
    archetype: 'Self',
    themes: ['vitality', 'consciousness', 'the warmth of full awareness'],
    interpretations: [
      'The sun in dreams often carries vitality, warmth, and the quality of being fully conscious and awake. Its presence tends to signal energy, clarity, and life force.',
      'Sunrise can represent something new beginning to illuminate your awareness — a dawn after a dark period. Sunset may reflect completion, surrender, or gratitude for what was.',
      'The sun\'s intensity matters — warming and giving life, or harsh and overwhelming? Your relationship to your own energy and ambition may be reflected here.',
    ],
  },

  ring: {
    label: 'A ring or circle',
    archetype: 'Integration',
    themes: ['wholeness', 'commitment', 'something that cycles back to its beginning'],
    interpretations: [
      'Rings in dreams often carry themes of wholeness, completion, and commitment. A ring given or received may signal a bond — with another, with yourself, or with a path you\'re choosing.',
      'Circles represent unity and cycles — what comes around, what completes, what has no beginning or end. Something in your life may be coming full circle.',
      'Losing a ring may reflect fear of lost connection or commitment wavering. Finding one may signal unexpected loyalty or a bond being discovered.',
    ],
  },

  weapon: {
    label: 'A weapon or sharp object',
    archetype: 'Shadow',
    themes: ['aggression or protection', 'cutting through to the truth', 'a conflict that demands decisiveness'],
    interpretations: [
      'Weapons in dreams often represent the need to defend yourself, cut through something, or make a decisive action. The weapon itself — sword, knife, gun — shapes the quality of the energy.',
      'A weapon can also represent words — the sharpness of truth, the impact of what has been said, or what needs to be said. Something may need to be cut away or pierced through.',
      'Holding a weapon may reflect a readiness to confront something. Being threatened by one may reflect a situation where you feel the stakes are high and potentially dangerous.',
    ],
  },

  dance: {
    label: 'Dancing',
    archetype: 'Anima',
    themes: ['embodied expression', 'joy or surrender', 'moving through life with rhythm and feeling'],
    interpretations: [
      'Dancing in dreams often represents the body\'s wisdom — expression through movement rather than thought. Something in you may be asking to be expressed physically or spontaneously.',
      'Dance can carry themes of joy, freedom, and being in flow — a feeling of alignment where effort and pleasure meet. It may reflect a part of you that knows how to move with life rather than against it.',
      'If the dance felt awkward or forced, something in your waking life may feel inauthentic or out of rhythm. If it felt natural, you may be closer to your center than you think.',
    ],
  },

  anger: {
    label: 'Anger or rage',
    archetype: 'Shadow',
    themes: ['suppressed force', 'boundaries being crossed', 'a power that demands expression'],
    interpretations: [
      'Anger in dreams often surfaces when something has been held back too long — a boundary that wasn\'t honored, a truth that wasn\'t spoken, a power that has been contained.',
      'Rage in a dream is not always destructive. It can signal vitality and clarity — the part of you that knows what is unacceptable and refuses to tolerate it quietly.',
      'If the anger felt disproportionate to the situation, it may be carrying older, deeper feelings — a reservoir of emotion that the dream situation merely opened.',
    ],
  },

  school_old: {
    label: 'An old school or familiar place',
    archetype: 'Shadow',
    themes: ['revisiting old lessons', 'patterns from earlier chapters', 'something from the past that still teaches'],
    interpretations: [
      'Returning to an old school or familiar place from the past often signals that an earlier lesson is being revisited — a pattern you thought you completed that may have more to teach.',
      'Familiar places from the past carry the energy of who you were when you inhabited them. Your dream may be checking in with that version of yourself.',
      'These dreams often arrive during transitions when the psyche looks backward for orientation — surveying earlier maps to navigate current terrain.',
    ],
  },

  gift: {
    label: 'Receiving or giving a gift',
    archetype: 'Integration',
    themes: ['something offered or received', 'unexpected value', 'grace and generosity'],
    interpretations: [
      'Gifts in dreams often symbolize something being offered to you — an insight, an opportunity, or a quality — that you may not have sought but that arrives with purpose.',
      'Giving a gift in a dream may reflect a desire to share something of yourself, or an energy of generosity that your inner world is practicing.',
      'The gift itself matters. Was it beautiful, strange, wrapped, or open? Its nature tends to mirror what your unconscious is trying to deliver to your waking awareness.',
    ],
  },

  desert: {
    label: 'A desert or barren place',
    archetype: 'Threshold',
    themes: ['emptiness that clarifies', 'endurance', 'stripping away what is inessential'],
    interpretations: [
      'Deserts in dreams represent the vast, stripped-down interior — a landscape without distraction, where only what is essential remains. Something in you may need simplicity.',
      'A barren landscape can feel desolate or liberating. It may signal a period of spiritual or emotional fallow — nothing growing yet, but the ground being prepared.',
      'Desert dreams often arrive when life feels dry or directionless. They ask: what do you carry when everything superfluous is removed? That is your center.',
    ],
  },

  snow: {
    label: 'Snow or ice',
    archetype: 'Threshold',
    themes: ['emotional stillness', 'something frozen in place', 'beauty within pause'],
    interpretations: [
      'Snow in dreams can signal a period of emotional pause — things cooling, slowing, settling. Something may need to be still before it can move again.',
      'Ice can represent something frozen — an emotion, a relationship, a situation that has hardened and needs warmth to release. What has become rigid in your life?',
      'Snow can also carry a strange beauty — the silence of a world blanketed and simplified. Your inner world may be asking for rest rather than movement right now.',
    ],
  },

  crowd: {
    label: 'A crowd or many people',
    archetype: 'Persona',
    themes: ['social pressure', 'feeling lost among many', 'the collective versus the individual'],
    interpretations: [
      'Crowds in dreams often reflect the relationship between your individual self and social expectations — feeling swallowed up, anonymous, or pressured to conform.',
      'A crowd can also represent the many voices within you — different needs, different opinions, different parts all clamoring for attention. Which voice is loudest?',
      'Being lost in a crowd may signal a fear of losing your identity. Standing apart from one may reflect a growing sense of differentiation — choosing yourself over the group.',
    ],
  },

  hands: {
    label: 'Hands',
    archetype: 'Self',
    themes: ['agency', 'what you hold or release', 'your capacity to create and connect'],
    interpretations: [
      'Hands in dreams represent agency and connection — what you\'re reaching for, holding onto, or letting go of. Their condition (strong, injured, empty, full) mirrors your sense of capability.',
      'Injured or bound hands may reflect feeling unable to act, create, or connect. Open hands may signal receptivity or the willingness to release control.',
      'Touching something or someone with your hands in a dream often signals a desire for direct contact — cutting through distance to feel the truth of a situation.',
    ],
  },

  voice: {
    label: 'A voice or being unable to speak',
    archetype: 'Persona',
    themes: ['expression blocked or freed', 'the truth trying to surface', 'the gap between knowing and saying'],
    interpretations: [
      'Losing your voice or being unable to scream in a dream is remarkably common and often reflects a waking sense that your truth is not being heard or spoken.',
      'A disembodied voice in a dream may carry the quality of guidance — something important trying to reach your awareness through words rather than images.',
      'These dreams often intensify during periods when something important needs to be said. The frustration of the dream may mirror the frustration of staying silent.',
    ],
  },

  rabbit: {
    label: 'A rabbit',
    archetype: 'Anima',
    themes: ['vulnerability and alertness', 'abundance', 'the anxious and gentle self'],
    interpretations: [
      'Rabbits in dreams often carry themes of vulnerability, alertness, and fertile potential. They are sensitive creatures — something in you may be hyper-aware, watchful, or ready to flee.',
      'A rabbit can also symbolize abundance and creativity — something multiplying, growing rapidly, or expressing itself prolifically. What in your life is expanding?',
      'The rabbit\'s quickness and vulnerability may reflect anxiety — the part of you that stays alert for threat. But it also represents gentleness worth protecting.',
    ],
  },

  fish: {
    label: 'A fish',
    archetype: 'Integration',
    themes: ['something moving beneath the surface', 'insight from the deep', 'the unconscious offering something up'],
    interpretations: [
      'Fish in dreams often represent thoughts, feelings, or insights moving beneath conscious awareness — something from the deep that is becoming visible.',
      'Catching a fish can symbolize bringing an unconscious insight to the surface. Watching fish swim may reflect the beauty of letting ideas and feelings move freely.',
      'The water the fish inhabits is as important as the fish itself — clear or murky, calm or turbulent. This reflects the condition of your inner emotional world.',
    ],
  },

  city: {
    label: 'A city or urban landscape',
    archetype: 'Persona',
    themes: ['social complexity', 'the constructed self', 'navigating systems and structures'],
    interpretations: [
      'Cities in dreams often represent the complex social structures you inhabit — relationships, expectations, systems, and the constructed aspects of your identity.',
      'A crowded city may reflect feeling overwhelmed by social complexity. An empty city may suggest loneliness within structures that should connect you to others.',
      'The state of the city — vibrant, decaying, familiar, foreign — tends to mirror your experience of the social and professional world around you.',
    ],
  },

  bed: {
    label: 'A bed or sleeping',
    archetype: 'Self',
    themes: ['rest and vulnerability', 'intimacy', 'the space between conscious and unconscious'],
    interpretations: [
      'A bed in a dream represents the most vulnerable and intimate space — where you rest, dream, and let go. Its state (comfortable, unmade, shared, empty) mirrors your sense of safety and rest.',
      'Dreaming of sleep within a dream can signal exhaustion or a need for deeper rest — not just physical, but emotional and mental. Something in you is asking to be replenished.',
      'Who else is in the bed, or the feeling of the space around it, often carries messages about intimacy, trust, and where you feel most or least at ease.',
    ],
  },

  book: {
    label: 'A book or library',
    archetype: 'Self',
    themes: ['inner knowledge', 'memories and stories you carry', 'wisdom waiting to be accessed'],
    interpretations: [
      'Books in dreams represent the knowledge and stories you carry within you — memories, wisdom, and the accumulated understanding of your life experience.',
      'A library can symbolize the vastness of what you know (or feel you should know), or the desire to find a specific answer among many possibilities.',
      'An unreadable book may reflect knowledge that isn\'t yet available to you. An open book may signal that the insight you need is already within reach.',
    ],
  },

  box: {
    label: 'A box or container',
    archetype: 'Shadow',
    themes: ['something hidden or stored', 'compartmentalization', 'what has been put away'],
    interpretations: [
      'A box in a dream often represents something that has been contained or put away — an emotion, a memory, a part of yourself that was stored rather than dealt with.',
      'Opening a box can signal the beginning of confronting what was hidden. The contents — surprising, frightening, or precious — tell you what your unconscious has been holding.',
      'Boxes can also represent compartmentalization — keeping different aspects of your life or self separate. The dream may be asking whether it\'s time to open up or reorganize.',
    ],
  },
};

// ─── Keyword → Symbol Key Mapping ────────────────────────────────────────────

/** Maps individual words from dreamText to symbol keys */
export const DREAM_KEYWORDS: Record<string, string> = {
  // Water
  water: 'water', sea: 'water', river: 'water', lake: 'water',
  flood: 'water', stream: 'water', pool: 'water', waves: 'water',
  swimming: 'water', swim: 'water', swam: 'water',
  shore: 'water', tide: 'water', tidal: 'water',
  waterfall: 'water', pond: 'water', creek: 'water', marsh: 'water',
  swamp: 'water', lagoon: 'water', spring: 'water', fountain: 'water',
  canal: 'water', rapids: 'water', current: 'water', splash: 'water',
  splashing: 'water', wading: 'water', wade: 'water', wet: 'water',
  damp: 'water', soaked: 'water', dripping: 'water', drip: 'water',
  puddle: 'water', bath: 'water', bathing: 'water', shower: 'water',
  harbor: 'water', bay: 'water', cove: 'water', whirlpool: 'water',
  tsunami: 'water', dam: 'water',

  // Ocean (separate symbol from water)
  ocean: 'ocean', abyss: 'ocean', depths: 'ocean', seabed: 'ocean',
  seafloor: 'ocean', oceanic: 'ocean',

  // House/building
  house: 'house', home: 'house', room: 'house', building: 'house',
  window: 'house', hallway: 'house', basement: 'house', attic: 'house',
  apartment: 'house', bedroom: 'house', kitchen: 'house',
  corridor: 'house', walls: 'house', ceiling: 'house', door: 'house',
  doorway: 'house', mansion: 'house', cabin: 'house', cottage: 'house',
  castle: 'house', palace: 'house', tower: 'house', shelter: 'house',
  roof: 'house', porch: 'house', garage: 'house', bathroom: 'house',
  closet: 'house', cupboard: 'house', pantry: 'house', living: 'house',
  lobby: 'house', foyer: 'house', balcony: 'house', terrace: 'house',
  fireplace: 'house', chimney: 'house', shed: 'house', warehouse: 'house',
  barn: 'house', church: 'house', temple: 'house', hotel: 'house',
  motel: 'house', inn: 'house', lodge: 'house',

  // Falling
  falling: 'falling', fell: 'falling', fall: 'falling', dropped: 'falling',
  sinking: 'falling', sink: 'falling', plunging: 'falling', plunge: 'falling',
  tumbling: 'falling', tumble: 'falling', slipping: 'falling', slip: 'falling',
  slipped: 'falling', tripping: 'falling', trip: 'falling', tripped: 'falling',
  collapsing: 'falling', collapse: 'falling', plummeting: 'falling',
  descending: 'falling', toppling: 'falling',

  // Flying
  flying: 'flying', flew: 'flying', float: 'flying', floating: 'flying',
  soaring: 'flying', hover: 'flying', hovering: 'flying', levitate: 'flying',
  levitating: 'flying', gliding: 'flying', glide: 'flying', airborne: 'flying',
  weightless: 'flying', weightlessness: 'flying', drifting: 'flying',
  drift: 'flying', rising: 'flying', lifting: 'flying', lifted: 'flying',

  // Chase
  chase: 'chase', chased: 'chase', chasing: 'chase', chaser: 'chase',
  fleeing: 'chase', flee: 'chase', escape: 'chase', escaped: 'chase',
  escaping: 'chase', hiding: 'chase',
  hide: 'chase', hid: 'chase', hidden: 'chase',
  hunted: 'chase', hunting: 'chase',
  running: 'chase', run: 'chase', ran: 'chase',
  pursued: 'chase', pursuing: 'chase', pursuit: 'chase',
  stalked: 'chase', stalking: 'chase', stalker: 'chase',
  cornered: 'chase', trapped: 'prison',
  followed: 'chase', following: 'chase',
  sprinting: 'chase', sprint: 'chase', dashing: 'chase',

  // Stranger / unknown figure
  stranger: 'stranger', figure: 'stranger', shadowy: 'stranger',
  unknown: 'stranger', presence: 'stranger', silhouette: 'stranger',
  faceless: 'stranger', hooded: 'stranger', mysterious: 'stranger',
  apparition: 'stranger', phantom: 'stranger', entity: 'stranger',
  intruder: 'stranger', visitor: 'stranger', someone: 'stranger',
  somebody: 'stranger', whoever: 'stranger',

  // Death / endings
  death: 'death', dead: 'death', dying: 'death', died: 'death',
  funeral: 'death', grave: 'death', burial: 'death', killed: 'death',
  murder: 'death', murdered: 'death', corpse: 'death', coffin: 'death',
  cemetery: 'death', graveyard: 'death', tombstone: 'death', tomb: 'death',
  afterlife: 'death', ghost: 'death', ghosts: 'death', haunted: 'death',
  mourning: 'death', mourned: 'death', deceased: 'death', lifeless: 'death',
  skeleton: 'death', skull: 'death', casket: 'death',

  // Snakes
  snake: 'snake', snakes: 'snake', serpent: 'snake', serpents: 'snake',
  viper: 'snake', cobra: 'snake', python: 'snake', rattlesnake: 'snake',
  slither: 'snake', slithering: 'snake', reptile: 'snake', boa: 'snake',

  // Dogs
  dog: 'dog', dogs: 'dog', puppy: 'dog', puppies: 'dog', hound: 'dog',
  canine: 'dog', pup: 'dog', mutt: 'dog', retriever: 'dog',
  shepherd: 'dog', terrier: 'dog', barking: 'dog', bark: 'dog',
  howling: 'dog', howl: 'dog', leash: 'dog',

  // Cats
  cat: 'cat', cats: 'cat', kitten: 'cat', kittens: 'cat', feline: 'cat',
  kitty: 'cat', tomcat: 'cat', tabby: 'cat', purring: 'cat', purr: 'cat',
  meow: 'cat', claws: 'cat', whiskers: 'cat',

  // Birds
  bird: 'bird', birds: 'bird', feather: 'bird', feathers: 'bird',
  crow: 'bird', raven: 'bird', eagle: 'bird', hawk: 'bird', owl: 'bird',
  dove: 'bird', sparrow: 'bird', wing: 'bird', wings: 'bird',
  parrot: 'bird', pelican: 'bird', swan: 'bird', heron: 'bird',
  falcon: 'bird', vulture: 'bird', songbird: 'bird', robin: 'bird',
  hummingbird: 'bird', nest: 'bird', chirping: 'bird', chirp: 'bird',
  pecking: 'bird', beak: 'bird', talons: 'bird', perch: 'bird',
  aviary: 'bird', cage: 'bird', caged: 'bird', finch: 'bird',
  pigeon: 'bird', seagull: 'bird', phoenix: 'bird',

  // Wolf
  wolf: 'wolf', wolves: 'wolf', coyote: 'wolf', howled: 'wolf',
  packmate: 'wolf', werewolf: 'wolf',

  // Bear
  bear: 'bear', bears: 'bear', grizzly: 'bear', polar: 'bear',
  hibernate: 'bear', hibernating: 'bear',

  // Horse
  horse: 'horse', horses: 'horse', stallion: 'horse', mare: 'horse',
  foal: 'horse', pony: 'horse', galloping: 'horse', gallop: 'horse',
  trotting: 'horse', trot: 'horse', riding: 'horse', rode: 'horse',
  saddle: 'horse', reins: 'horse', mustang: 'horse', equine: 'horse',

  // Fire
  fire: 'fire', flame: 'fire', flames: 'fire', burning: 'fire',
  smoke: 'fire', blaze: 'fire', inferno: 'fire',
  ember: 'fire', embers: 'fire', smoldering: 'fire', scorching: 'fire',
  scorch: 'fire', ash: 'fire', ashes: 'fire', ignite: 'fire',
  ignited: 'fire', combustion: 'fire', wildfire: 'fire',
  bonfire: 'fire', candle: 'fire', candles: 'fire', torch: 'fire',
  sparks: 'fire', spark: 'fire', searing: 'fire', charred: 'fire',

  // Darkness
  dark: 'darkness', darkness: 'darkness', night: 'darkness',
  shadow: 'darkness', void: 'darkness',
  dim: 'darkness', pitch: 'darkness', blackout: 'darkness',
  obscure: 'darkness', murky: 'darkness', gloom: 'darkness',
  gloomy: 'darkness', dusk: 'darkness', twilight: 'darkness',
  midnight: 'darkness', unlit: 'darkness', shade: 'darkness',

  // Light
  light: 'light', bright: 'light', glow: 'light', radiant: 'light',
  shining: 'light', glowing: 'light', illuminate: 'light', illuminated: 'light',
  luminous: 'light', beacon: 'light', gleaming: 'light', gleam: 'light',
  sparkle: 'light', sparkling: 'light', dazzling: 'light', brilliant: 'light',
  flash: 'light', flashing: 'light', rays: 'light', beam: 'light',
  lantern: 'light', lamp: 'light', spotlight: 'light', neon: 'light',
  shimmer: 'light', shimmering: 'light', twinkle: 'light', twinkling: 'light',
  dawn: 'light', sunrise: 'light',

  // Path
  road: 'path', path: 'path', journey: 'path', trail: 'path',
  crossroads: 'path', intersection: 'path', walking: 'path', walked: 'path',
  traveled: 'path', direction: 'path', map: 'path',
  highway: 'path', sidewalk: 'path', alley: 'path', lane: 'path',
  passage: 'path', passageway: 'path', route: 'path', detour: 'path',
  pathway: 'path', walkway: 'path', tracks: 'path', trek: 'path',
  hike: 'path', hiking: 'path', stroll: 'path', strolling: 'path',
  footsteps: 'path', footpath: 'path', navigate: 'path', navigating: 'path',

  // Teeth
  teeth: 'teeth', tooth: 'teeth', bite: 'teeth', biting: 'teeth',
  jaw: 'teeth', dental: 'teeth', mouth: 'teeth',
  chewing: 'teeth', chew: 'teeth', grinding: 'teeth', grind: 'teeth',
  gums: 'teeth', crumbling: 'teeth', loose: 'teeth', swallow: 'teeth',
  swallowing: 'teeth', tongue: 'teeth', lips: 'teeth', spit: 'teeth',

  // Lost / searching
  lost: 'lost', searching: 'lost', search: 'lost', finding: 'lost',
  looking: 'lost', seek: 'lost', seeking: 'lost', wandering: 'lost',
  wander: 'lost', confused: 'lost', misplaced: 'lost', missing: 'lost',
  disoriented: 'lost', aimless: 'lost', stranded: 'lost',
  nowhere: 'lost', maze: 'lost', labyrinth: 'lost',
  bewildered: 'lost', roaming: 'lost', roam: 'lost',

  // School / test
  school: 'test', class: 'test', exam: 'test', test: 'test',
  teacher: 'test', study: 'test', classroom: 'test', homework: 'test',
  grade: 'test', university: 'test', college: 'test', professor: 'test',
  lecture: 'test', quiz: 'test', diploma: 'test', graduation: 'test',
  locker: 'test', textbook: 'test', lesson: 'test', assignment: 'test',
  detention: 'test', principal: 'test', enrolled: 'test', semester: 'test',

  // Bridge
  bridge: 'bridge', bridges: 'bridge', crossing: 'bridge',
  span: 'bridge', overpass: 'bridge', drawbridge: 'bridge',

  // Key
  key: 'key', keys: 'key', unlock: 'key', locked: 'key',
  lock: 'key', unlocking: 'key', keyhole: 'key', padlock: 'key',

  // Clock
  clock: 'clock', timer: 'clock', ticking: 'clock',
  late: 'clock', deadline: 'clock', countdown: 'clock',
  hourglass: 'clock', alarm: 'clock', hurry: 'clock',
  rushing: 'clock', rushed: 'clock', rush: 'clock',
  overdue: 'clock', tardy: 'clock', overtime: 'clock',
  schedule: 'clock', appointment: 'clock',

  // Mask
  mask: 'mask', masks: 'mask', disguise: 'mask', disguised: 'mask',
  costume: 'clothing', pretending: 'mask', pretend: 'mask',
  imposter: 'mask', impostor: 'mask', fake: 'mask', facade: 'mask',

  // Child / childhood
  child: 'child', children: 'child', kid: 'child', kids: 'child',
  baby: 'child', infant: 'child', toddler: 'child', childhood: 'child',
  young: 'child', nursery: 'child', crib: 'child', cradle: 'child',
  playground: 'child', playful: 'child', playing: 'child',
  innocent: 'child', innocence: 'child', toy: 'child', toys: 'child',
  doll: 'child', dolls: 'child', lullaby: 'child', teddy: 'child',

  // Family
  mother: 'family', father: 'family', parent: 'family', parents: 'family',
  sibling: 'family', sister: 'family', brother: 'family',
  family: 'family', grandmother: 'family', grandfather: 'family',
  grandma: 'family', grandpa: 'family', aunt: 'family', uncle: 'family',
  cousin: 'family', mom: 'family', dad: 'family', mama: 'family',
  papa: 'family', nana: 'family', granny: 'family', ancestor: 'family',
  ancestors: 'family', bloodline: 'family', relatives: 'family',
  relative: 'family', stepmother: 'family', stepfather: 'family',
  daughter: 'family', son: 'family', husband: 'family', wife: 'family',
  spouse: 'family', partner: 'family',

  // Past
  ex: 'past', past: 'past', former: 'past', memory: 'past',
  memories: 'past', nostalgia: 'past', nostalgic: 'past',
  remember: 'past', remembering: 'past', recalled: 'past',
  flashback: 'past', reminisce: 'past', reminiscing: 'past',
  yesterday: 'past', ago: 'past', hometown: 'past', reunion: 'past',

  // Pregnancy / birth
  pregnant: 'birth', pregnancy: 'birth', born: 'birth', birth: 'birth',
  newborn: 'birth', expecting: 'birth', womb: 'birth', conceived: 'birth',
  labor: 'birth', delivery: 'birth', midwife: 'birth', fertile: 'birth',
  fertility: 'birth', embryo: 'birth', gestating: 'birth',

  // Mirror
  mirror: 'mirror', mirrors: 'mirror', reflection: 'mirror', reflected: 'mirror',
  reflecting: 'mirror', glass: 'mirror', portrait: 'mirror',
  photograph: 'mirror', photo: 'mirror', selfie: 'mirror',
  image: 'mirror', likeness: 'mirror',

  // Vehicle
  car: 'vehicle', driving: 'vehicle', drive: 'vehicle', drove: 'vehicle',
  train: 'vehicle', plane: 'vehicle', crash: 'vehicle', crashing: 'vehicle',
  bus: 'vehicle', truck: 'vehicle', motorcycle: 'vehicle', vehicle: 'vehicle',
  airplane: 'vehicle', helicopter: 'vehicle',
  taxi: 'vehicle', cab: 'vehicle', bike: 'vehicle', bicycle: 'vehicle',
  boat: 'vehicle', ship: 'vehicle', sailing: 'vehicle', sail: 'vehicle',
  ferry: 'vehicle', yacht: 'vehicle', canoe: 'vehicle', raft: 'vehicle',
  kayak: 'vehicle', subway: 'vehicle', metro: 'vehicle', trolley: 'vehicle',
  ambulance: 'vehicle', engine: 'vehicle', steering: 'vehicle',
  passenger: 'vehicle', backseat: 'vehicle',
  speeding: 'vehicle', brakes: 'vehicle', accelerating: 'vehicle',
  wreck: 'vehicle', collision: 'vehicle', swerving: 'vehicle',

  // Nature
  forest: 'nature', tree: 'nature', trees: 'nature', mountain: 'nature',
  mountains: 'nature', garden: 'nature', field: 'nature',
  meadow: 'nature', jungle: 'nature', earth: 'nature',
  grass: 'nature', leaves: 'nature', woods: 'nature', nature: 'nature',
  valley: 'nature', hill: 'nature', hills: 'nature', cliff: 'nature',
  cliffs: 'nature', canyon: 'nature', ravine: 'nature', gorge: 'nature',
  plateau: 'nature', clearing: 'nature', grove: 'nature',
  vine: 'nature', vines: 'nature', moss: 'nature', fern: 'nature',
  rock: 'nature', rocks: 'nature', boulder: 'nature', stone: 'nature',
  stones: 'nature', pebble: 'nature', pebbles: 'nature',
  wilderness: 'nature', landscape: 'nature', scenery: 'nature',
  horizon: 'nature', summit: 'nature', peak: 'nature',
  riverbank: 'nature', lakeside: 'nature', countryside: 'nature',
  pasture: 'nature', orchard: 'nature', prairie: 'nature',

  // Money
  money: 'money', cash: 'money', wealth: 'money', poverty: 'money',
  debt: 'money', rich: 'money', poor: 'money', payment: 'money',
  wallet: 'money', purse: 'money', bank: 'money',
  coins: 'money', coin: 'money', dollar: 'money', dollars: 'money',
  gold: 'money', silver: 'money', jewelry: 'money', jewels: 'money',
  diamond: 'money', diamonds: 'money', gem: 'money', gems: 'money',
  fortune: 'money', lottery: 'money', inheritance: 'money',
  salary: 'money', paycheck: 'money', bills: 'money', shopping: 'money',
  buying: 'money', selling: 'money', steal: 'money', stealing: 'money',
  stolen: 'money', robbery: 'money', robbed: 'money', thief: 'money',

  // ─── New Symbol Keywords ────────────────────────────────────────────────────

  // Spider / web
  spider: 'spider', spiders: 'spider', web: 'spider', webs: 'spider',
  cobweb: 'spider', cobwebs: 'spider', spiderweb: 'spider',
  tarantula: 'spider', arachnid: 'spider', spinning: 'spider',
  silk: 'spider', woven: 'spider', weaving: 'spider', weave: 'spider',
  entangled: 'spider', tangled: 'spider',

  // Insects / bugs
  insect: 'insects', insects: 'insects', bug: 'insects', bugs: 'insects',
  ant: 'insects', ants: 'insects', bee: 'insects', bees: 'insects',
  wasp: 'insects', wasps: 'insects', fly: 'insects', flies: 'insects',
  mosquito: 'insects', mosquitoes: 'insects', beetle: 'insects',
  cockroach: 'insects', roach: 'insects', moth: 'insects', moths: 'insects',
  butterfly: 'insects', butterflies: 'insects', dragonfly: 'insects',
  grasshopper: 'insects', cricket: 'insects', caterpillar: 'insects',
  larvae: 'insects', larva: 'insects', maggot: 'insects', maggots: 'insects',
  swarm: 'insects', swarming: 'insects', buzzing: 'insects', buzz: 'insects',
  sting: 'insects', stung: 'insects', crawling: 'insects', crawl: 'insects',
  infestation: 'insects', pest: 'insects', pests: 'insects',
  centipede: 'insects', worm: 'insects', worms: 'insects',
  termite: 'insects', termites: 'insects', locust: 'insects', locusts: 'insects',
  tick: 'insects', ticks: 'insects', flea: 'insects', fleas: 'insects',
  ladybug: 'insects', firefly: 'insects', fireflies: 'insects',

  // Naked / exposed
  naked: 'naked', nude: 'naked', nudity: 'naked', undressed: 'naked',
  exposed: 'naked', bare: 'naked', stripped: 'naked', unclothed: 'naked',
  underwear: 'naked', topless: 'naked', shirtless: 'naked',
  vulnerable: 'naked', embarrassed: 'naked', embarrassment: 'naked',
  shame: 'naked', ashamed: 'naked', humiliated: 'naked',
  humiliation: 'naked', blushing: 'naked',

  // Stairs / elevator
  stairs: 'stairs', staircase: 'stairs', stairway: 'stairs',
  steps: 'stairs', elevator: 'stairs', escalator: 'stairs',
  ascending: 'stairs',
  upstairs: 'stairs', downstairs: 'stairs',
  floor: 'stairs', floors: 'stairs', level: 'stairs', levels: 'stairs',
  penthouse: 'stairs', storey: 'stairs', story: 'stairs',

  // Storm
  storm: 'storm', storms: 'storm', thunder: 'storm', thunderstorm: 'storm',
  lightning: 'storm', tornado: 'storm', hurricane: 'storm',
  cyclone: 'storm', tempest: 'storm', gale: 'storm',
  wind: 'storm', winds: 'storm', windy: 'storm',
  hail: 'storm', downpour: 'storm', cloudburst: 'storm',
  destruction: 'storm', devastation: 'storm', disaster: 'storm',
  earthquake: 'storm', quake: 'storm', eruption: 'storm',
  volcano: 'storm', avalanche: 'storm', landslide: 'storm',
  whirlwind: 'storm', typhoon: 'storm',

  // Food / eating
  food: 'food', eat: 'food', eating: 'food', ate: 'food',
  meal: 'food', dinner: 'food', lunch: 'food', breakfast: 'food',
  feast: 'food', banquet: 'food', hungry: 'food', hunger: 'food',
  starving: 'food', appetite: 'food', cooking: 'food', cook: 'food',
  baking: 'food', bake: 'food', recipe: 'food',
  restaurant: 'food', cafe: 'food', table: 'food', plate: 'food',
  bowl: 'food', serving: 'food', nourishment: 'food', nourish: 'food',
  fruit: 'food', apple: 'food', bread: 'food', cake: 'food',
  chocolate: 'food', wine: 'food', drinking: 'food', drink: 'food',
  drank: 'food', thirsty: 'food', thirst: 'food', milk: 'food',
  sugar: 'food', salt: 'food', bitter: 'food', sweet: 'food',
  sour: 'food', rotten: 'food', spoiled: 'food', poison: 'food',
  poisoned: 'food', vomit: 'food', vomiting: 'food', nausea: 'food',
  choking: 'food', choke: 'food', choked: 'food',

  // Clothing / costume
  clothing: 'clothing', clothes: 'clothing', dressed: 'clothing',
  dress: 'clothing', dressing: 'clothing', outfit: 'clothing',
  uniform: 'clothing', suit: 'clothing', gown: 'clothing',
  robe: 'clothing', cloak: 'clothing', coat: 'clothing', jacket: 'clothing',
  shirt: 'clothing', pants: 'clothing', shoes: 'clothing', shoe: 'clothing',
  boots: 'clothing', hat: 'clothing', crown: 'clothing', veil: 'clothing',
  scarf: 'clothing', gloves: 'clothing', armor: 'clothing',
  wardrobe: 'clothing', fitting: 'clothing',
  tailored: 'clothing', fabric: 'clothing', thread: 'clothing',
  sewn: 'clothing', sewing: 'clothing', stitching: 'clothing',
  cape: 'clothing', apron: 'clothing', tuxedo: 'clothing',
  wedding_dress: 'clothing', tiara: 'clothing',

  // Blood
  blood: 'blood', bleeding: 'blood', bleed: 'blood', bled: 'blood',
  bloody: 'blood', bloodstain: 'blood', wound: 'blood', wounded: 'blood',
  injury: 'blood', injured: 'blood', scar: 'blood', scars: 'blood',
  scarred: 'blood', cut: 'blood', cuts: 'blood', gash: 'blood',
  bruise: 'blood', bruised: 'blood', surgery: 'blood', stitches: 'blood',
  bandage: 'blood', bandaged: 'blood', hemorrhage: 'blood',
  transfusion: 'blood', vein: 'blood', veins: 'blood',
  artery: 'blood', pulse: 'blood', heartbeat: 'blood',

  // Fight / conflict
  fight: 'fight', fighting: 'fight', fought: 'fight', punch: 'fight',
  punching: 'fight', punched: 'fight', kick: 'fight', kicking: 'fight',
  hit: 'fight', hitting: 'fight', slap: 'fight', slapped: 'fight',
  attack: 'fight', attacked: 'fight', attacking: 'fight',
  battle: 'fight', war: 'fight', combat: 'fight', conflict: 'fight',
  struggle: 'fight', struggling: 'fight', wrestle: 'fight', wrestling: 'fight',
  confrontation: 'fight', argument: 'fight', arguing: 'fight',
  shouting: 'fight', yelling: 'fight', screaming: 'fight', scream: 'fight',
  violence: 'fight', violent: 'fight', aggression: 'fight', aggressive: 'fight',
  defend: 'fight', defending: 'fight', defense: 'fight', shield: 'fight',
  sword: 'weapon', knife: 'weapon', gun: 'weapon', blade: 'weapon',
  dagger: 'weapon', arrow: 'weapon', bow: 'weapon', spear: 'weapon',
  bullet: 'weapon', shooting: 'weapon', shot: 'weapon', stab: 'weapon',
  stabbed: 'weapon', stabbing: 'weapon', axe: 'weapon', hammer: 'weapon',

  // Crying / tears
  crying: 'crying', cry: 'crying', cried: 'crying', tears: 'crying',
  tear: 'crying', weeping: 'crying', weep: 'crying', wept: 'crying',
  sobbing: 'crying', sob: 'crying', grief: 'crying', grieving: 'crying',
  sadness: 'crying', sad: 'crying', sorrow: 'crying',
  sorrowful: 'crying', heartbreak: 'crying', heartbroken: 'crying',
  anguish: 'crying', despair: 'crying', despairing: 'crying',
  devastated: 'crying', lonely: 'crying', loneliness: 'crying',
  melancholy: 'crying', wailing: 'crying', lamenting: 'crying',
  regret: 'crying', remorse: 'crying',

  // Wedding / ceremony
  wedding: 'wedding', marriage: 'wedding', married: 'wedding', marry: 'wedding',
  engagement: 'wedding', engaged: 'wedding', ceremony: 'wedding',
  ritual: 'wedding', altar: 'wedding', vows: 'wedding', vow: 'wedding',
  bride: 'wedding', groom: 'wedding', aisle: 'wedding',
  reception: 'wedding', celebration: 'wedding', celebrate: 'wedding',
  anniversary: 'wedding', commitment: 'wedding',

  // Hospital / illness
  hospital: 'hospital', doctor: 'hospital', nurse: 'hospital',
  patient: 'hospital', medicine: 'hospital', medication: 'hospital',
  pills: 'hospital', sick: 'hospital', illness: 'hospital', ill: 'hospital',
  disease: 'hospital', diagnosis: 'hospital', cure: 'hospital',
  healing: 'hospital', healer: 'hospital', heal: 'hospital',
  emergency: 'hospital',
  clinic: 'hospital', therapy: 'hospital', therapist: 'hospital',
  operation: 'hospital', recovery: 'hospital', recovering: 'hospital',
  fever: 'hospital', pain: 'hospital', painful: 'hospital',
  suffering: 'hospital', symptom: 'hospital', symptoms: 'hospital',
  broken: 'hospital', fracture: 'hospital', crutches: 'hospital',
  wheelchair: 'hospital', needle: 'hospital', injection: 'hospital',

  // Prison / trapped
  prison: 'prison', jail: 'prison', cell: 'prison', imprisoned: 'prison',
  captive: 'prison', captivity: 'prison', chains: 'prison', chained: 'prison',
  shackles: 'prison', handcuffs: 'prison', bars: 'prison',
  confined: 'prison', confinement: 'prison',
  stuck: 'prison', suffocating: 'prison', suffocate: 'prison',
  claustrophobic: 'prison', claustrophobia: 'prison',
  restraint: 'prison', restrained: 'prison', bound: 'prison',
  paralyzed: 'prison', paralysis: 'prison', frozen: 'prison',
  immobilized: 'prison', pinned: 'prison',

  // Underwater
  underwater: 'underwater', submerged: 'underwater', diving: 'underwater',
  dive: 'underwater', dived: 'underwater', drowning: 'underwater',
  drown: 'underwater', drowned: 'underwater',
  snorkeling: 'underwater', scuba: 'underwater',
  sunken: 'underwater', submersed: 'underwater',
  breathe: 'underwater', breathing: 'underwater',
  surfacing: 'underwater', surface: 'underwater',
  coral: 'underwater', reef: 'underwater', seaweed: 'underwater',

  // Phone / communication
  phone: 'phone', telephone: 'phone', calling: 'phone', call: 'phone',
  called: 'phone', text: 'phone', texting: 'phone', message: 'phone',
  voicemail: 'phone', dialing: 'phone', dial: 'phone',
  ringing: 'phone', ring: 'ring',
  email: 'phone', letter: 'phone', letters: 'phone',
  mail: 'phone', postcard: 'phone', signal: 'phone',
  disconnect: 'phone', disconnected: 'phone',
  conversation: 'phone', talking: 'phone', talk: 'phone',
  talked: 'phone', spoke: 'phone', speaking: 'phone', speak: 'phone',
  whisper: 'phone', whispering: 'phone', whispered: 'phone',
  announcement: 'phone', broadcast: 'phone',

  // Cave
  cave: 'cave', caves: 'cave', cavern: 'cave', caverns: 'cave',
  grotto: 'cave', tunnel: 'cave', tunnels: 'cave',
  underground: 'cave', burrow: 'cave', den: 'cave',
  crypt: 'cave', catacombs: 'cave', mine: 'cave',
  mineshaft: 'cave', excavation: 'cave',

  // Treasure / finding something valuable
  treasure: 'treasure', jewel: 'treasure', precious: 'treasure',
  discovered: 'treasure', discovery: 'treasure',
  unearthed: 'treasure', uncovered: 'treasure',
  reveal: 'treasure', revealed: 'treasure', revelation: 'treasure',
  artifact: 'treasure', relic: 'treasure', antique: 'treasure',
  heirloom: 'treasure', chest: 'treasure',

  // Music / singing
  music: 'music', musical: 'music', singing: 'music', sing: 'music',
  sang: 'music', song: 'music', songs: 'music', melody: 'music',
  tune: 'music', harmony: 'music', choir: 'music',
  instrument: 'music', piano: 'music', guitar: 'music', violin: 'music',
  drums: 'music', drum: 'music', flute: 'music', harp: 'music',
  orchestra: 'music', concert: 'music', band: 'music',
  humming: 'music', hum: 'music', chanting: 'music', chant: 'music',
  rhythm: 'music', beat: 'music', sound: 'music', sounds: 'music',
  silence: 'music', silent: 'music', quiet: 'music', mute: 'music',
  deaf: 'music', echo: 'music', echoing: 'music',

  // Climbing / ascending
  climbing: 'climbing', climb: 'climbing', climbed: 'climbing',
  clambering: 'climbing', scrambling: 'climbing', scramble: 'climbing',
  scaling: 'climbing', scale: 'climbing',
  rope: 'climbing', ladder: 'climbing', ledge: 'climbing',

  // Fog / mist
  fog: 'fog', foggy: 'fog', mist: 'fog', misty: 'fog',
  haze: 'fog', hazy: 'fog', cloudy: 'fog', overcast: 'fog',
  blur: 'fog', blurry: 'fog', blurred: 'fog',
  unclear: 'fog', vague: 'fog', fuzzy: 'fog', obscured: 'fog',
  visibility: 'fog', smog: 'fog', steam: 'fog', steamy: 'fog',
  cloud: 'fog', clouds: 'fog',

  // Island
  island: 'island', islands: 'island', isle: 'island',
  shipwrecked: 'island', castaway: 'island',
  isolated: 'island', isolation: 'island', secluded: 'island',
  remote: 'island', marooned: 'island', abandoned: 'island',
  alone: 'island', solitude: 'island',

  // Gate / fence
  gate: 'gate', gates: 'gate', fence: 'gate', fences: 'gate',
  wall: 'gate', barrier: 'gate', barriers: 'gate',
  boundary: 'gate', boundaries: 'gate', border: 'gate',
  threshold: 'gate', entrance: 'gate', exit: 'gate',
  forbidden: 'gate', restricted: 'gate', trespassing: 'gate',
  guard: 'gate', guarded: 'gate', blocked: 'gate',

  // Rain
  rain: 'rain', raining: 'rain', rainy: 'rain', rainfall: 'rain',
  rained: 'rain', drizzle: 'rain', drizzling: 'rain',
  pouring: 'rain', poured: 'rain', soaking: 'rain',
  umbrella: 'rain', raincoat: 'rain', puddles: 'rain',
  monsoon: 'rain', sprinkle: 'rain',

  // Flower / blossoming
  flower: 'flower', flowers: 'flower', blossom: 'flower', blossoming: 'flower',
  bloom: 'flower', blooming: 'flower', petal: 'flower', petals: 'flower',
  rose: 'flower', roses: 'flower', lily: 'flower', lilies: 'flower',
  daisy: 'flower', sunflower: 'flower', tulip: 'flower', tulips: 'flower',
  orchid: 'flower', violet: 'flower', jasmine: 'flower', lavender: 'flower',
  bouquet: 'flower', wreath: 'flower', garland: 'flower',
  wilting: 'flower', wilted: 'flower', dried: 'flower', withered: 'flower',
  fragrant: 'flower', fragrance: 'flower', scent: 'flower', perfume: 'flower',
  seed: 'flower', seeds: 'flower', seedling: 'flower', sprout: 'flower',
  sprouting: 'flower', planted: 'flower', planting: 'flower', growing: 'flower',
  growth: 'flower',

  // Moon
  moon: 'moon', moonlight: 'moon', moonlit: 'moon', lunar: 'moon',
  crescent: 'moon', fullmoon: 'moon', eclipse: 'moon',
  moonbeam: 'moon', moonrise: 'moon', moonset: 'moon',

  // Sun
  sun: 'sun', sunlight: 'sun', sunshine: 'sun', sunny: 'sun',
  solar: 'sun', sunset: 'sun', sundown: 'sun',
  sunbeam: 'sun', sunburn: 'sun', daylight: 'sun',
  warmth: 'sun', warm: 'sun', golden: 'sun',

  // Ring / circle
  rings: 'ring', circle: 'ring', circles: 'ring',
  circular: 'ring', spiral: 'ring', spiraling: 'ring',
  loop: 'ring', looping: 'ring', orbit: 'ring', orbiting: 'ring',
  cycle: 'ring', cycling: 'ring', wheel: 'ring', revolving: 'ring',
  rotation: 'ring',

  // Weapon / sharp object
  weapon: 'weapon', weapons: 'weapon', sharp: 'weapon',
  pointed: 'weapon', cutting: 'weapon', slash: 'weapon',
  slashing: 'weapon', pierce: 'weapon', pierced: 'weapon',
  piercing: 'weapon', shatter: 'weapon', shattered: 'weapon',

  // Dance
  dance: 'dance', dancing: 'dance', danced: 'dance', dancer: 'dance',
  dancers: 'dance', ballet: 'dance', waltz: 'dance',
  twirling: 'dance', twirl: 'dance', pirouette: 'dance',
  choreography: 'dance', performance: 'dance', performing: 'dance',
  stage: 'dance', theater: 'dance', theatre: 'dance',
  audience: 'dance', applause: 'dance',

  // Anger / rage
  anger: 'anger', angry: 'anger', rage: 'anger', furious: 'anger',
  fury: 'anger', enraged: 'anger', mad: 'anger', livid: 'anger',
  frustrated: 'anger', frustration: 'anger', irritated: 'anger',
  annoyed: 'anger', resentment: 'anger', resentful: 'anger',
  outrage: 'anger', indignant: 'anger', hostile: 'anger',
  hostility: 'anger', temper: 'anger', tantrum: 'anger',
  explosive: 'anger', erupting: 'anger', seething: 'anger',
  vengeful: 'anger', revenge: 'anger',
  hatred: 'anger', hate: 'anger', loathing: 'anger',

  // Old school / familiar place
  revisiting: 'school_old', revisit: 'school_old', returned: 'school_old',
  returning: 'school_old', familiar: 'school_old', recognize: 'school_old',
  recognized: 'school_old', recognizable: 'school_old',

  // Gift
  gift: 'gift', gifts: 'gift', present: 'gift', presents: 'gift',
  wrapped: 'gift', unwrapping: 'gift', unwrap: 'gift',
  offering: 'gift', offered: 'gift', receiving: 'gift',
  received: 'gift', bestowed: 'gift', blessing: 'gift',
  surprise: 'gift', surprised: 'gift', package: 'gift',
  parcel: 'gift',

  // Desert / barren
  desert: 'desert', sand: 'desert', sandy: 'desert', dune: 'desert',
  dunes: 'desert', barren: 'desert', arid: 'desert', drought: 'desert',
  dry: 'desert', dusty: 'desert', dust: 'desert', wasteland: 'desert',
  desolate: 'desert', empty: 'desert',
  emptiness: 'desert', vacant: 'desert', scorched: 'desert', oasis: 'desert',

  // Snow / ice
  snow: 'snow', snowy: 'snow', snowfall: 'snow', snowflake: 'snow',
  snowflakes: 'snow', blizzard: 'snow', ice: 'snow', icy: 'snow',
  freezing: 'snow', frost: 'snow', frosty: 'snow',
  cold: 'snow', chill: 'snow', chilly: 'snow', frigid: 'snow',
  glacier: 'snow', iceberg: 'snow', sleet: 'snow', icicle: 'snow',
  icicles: 'snow', winter: 'snow', wintry: 'snow',

  // Crowd
  crowd: 'crowd', crowds: 'crowd', crowded: 'crowd',
  mob: 'crowd', herd: 'crowd',
  throng: 'crowd', multitude: 'crowd', masses: 'crowd',
  gathering: 'crowd', assembly: 'crowd', congregation: 'crowd',
  spectators: 'crowd', bystanders: 'crowd',
  onlookers: 'crowd', strangers: 'stranger', people: 'crowd',
  population: 'crowd', public: 'crowd', society: 'crowd',
  community: 'crowd', group: 'crowd', groups: 'crowd',
  party: 'crowd', social: 'crowd',

  // Hands
  hand: 'hands', hands: 'hands', fingers: 'hands', finger: 'hands',
  grip: 'hands', gripping: 'hands', grasp: 'hands', grasping: 'hands',
  holding: 'hands', hold: 'hands', held: 'hands', letting: 'hands',
  reaching: 'hands', reach: 'hands', reached: 'hands', touch: 'hands',
  touching: 'hands', touched: 'hands', caress: 'hands', caressing: 'hands',
  palm: 'hands', palms: 'hands', fist: 'hands', fists: 'hands',
  thumb: 'hands', wrist: 'hands', grab: 'hands', grabbed: 'hands',
  clutch: 'hands', clutching: 'hands', squeeze: 'hands', squeezing: 'hands',

  // Voice / unable to speak
  voice: 'voice', voices: 'voice',
  speechless: 'voice', voiceless: 'voice',
  screamed: 'voice',
  yelled: 'voice',
  unable: 'voice', cannot: 'voice',

  // Rabbit
  rabbit: 'rabbit', rabbits: 'rabbit', bunny: 'rabbit', bunnies: 'rabbit',
  hare: 'rabbit', warren: 'rabbit',

  // Fish
  fish: 'fish', fishes: 'fish', fishing: 'fish', caught: 'fish',
  aquarium: 'fish', fishtank: 'fish', goldfish: 'fish',
  shark: 'fish', sharks: 'fish', whale: 'fish', whales: 'fish',
  dolphin: 'fish', dolphins: 'fish', jellyfish: 'fish',
  octopus: 'fish', squid: 'fish', starfish: 'fish',
  trout: 'fish', salmon: 'fish', tuna: 'fish',
  mermaid: 'fish', merman: 'fish',

  // City
  city: 'city', cities: 'city', town: 'city', downtown: 'city',
  urban: 'city', metropolis: 'city', skyscraper: 'city', skyscrapers: 'city',
  street: 'city', streets: 'city', avenue: 'city', boulevard: 'city',
  neighborhood: 'city', block: 'city', buildings: 'house',
  market: 'city', mall: 'city', shop: 'city', store: 'city',
  office: 'city', workplace: 'city', work: 'city', job: 'city',
  boss: 'city', coworker: 'city', colleague: 'city',
  meeting: 'city', interview: 'city',

  // Bed / sleeping
  bed: 'bed', beds: 'bed', sleeping: 'bed', sleep: 'bed',
  slept: 'bed', asleep: 'bed', nap: 'bed', napping: 'bed',
  pillow: 'bed', blanket: 'bed', blankets: 'bed', mattress: 'bed',
  sheets: 'bed', duvet: 'bed', comforter: 'bed',
  awake: 'bed', awakened: 'bed', woke: 'bed', woken: 'bed',
  insomnia: 'bed', restless: 'bed', nightmare: 'bed',
  nightmares: 'bed', dreaming: 'bed',

  // Book / library
  book: 'book', books: 'book', library: 'book', reading: 'book',
  read: 'book', wrote: 'book', writing: 'book', write: 'book',
  written: 'book', page: 'book', pages: 'book', chapter: 'book',
  novel: 'book', scroll: 'book', manuscript: 'book',
  journal: 'book', diary: 'book', notebook: 'book', pen: 'book',
  pencil: 'book', ink: 'book', words: 'book', script: 'book',
  poem: 'book', poetry: 'book', literature: 'book',
  newspaper: 'book', headline: 'book', article: 'book',

  // Box / container
  box: 'box', boxes: 'box', container: 'box', crate: 'box',
  trunk: 'box', drawer: 'box', drawers: 'box', cabinet: 'box',
  vault: 'box', safe: 'box', jar: 'box',
  bottle: 'box', envelope: 'box', suitcase: 'box', luggage: 'box',
  baggage: 'box', bag: 'box', bags: 'box', backpack: 'box',
  storage: 'box',
  packed: 'box', packing: 'box', unpacking: 'box', unpack: 'box',
  opened: 'box', opening: 'box', closed: 'box', closing: 'box',
  sealed: 'box', buried: 'box', burying: 'box',

  // ─── Emotion / State Keywords ──────────────────────────────────────────────

  // Fear / anxiety (maps to chase — avoidance/anxiety archetype)
  afraid: 'chase', fear: 'chase', scared: 'chase', terrified: 'chase',
  terror: 'chase', panic: 'chase', panicking: 'chase', anxious: 'chase',
  anxiety: 'chase', nervous: 'chase', dread: 'chase', dreading: 'chase',
  worry: 'chase', worried: 'chase', uneasy: 'chase', creepy: 'chase',
  eerie: 'chase', ominous: 'chase', foreboding: 'chase',
  threatening: 'chase', threat: 'chase',

  // Joy / happiness (maps to dance — embodied expression)
  happy: 'dance', happiness: 'dance', joy: 'dance', joyful: 'dance',
  bliss: 'dance', blissful: 'dance', ecstasy: 'dance', ecstatic: 'dance',
  elated: 'dance', euphoria: 'dance', euphoric: 'dance',
  delight: 'dance', delighted: 'dance', cheerful: 'dance',
  laughing: 'dance', laugh: 'dance', laughter: 'dance', giggling: 'dance',
  smiling: 'dance', smile: 'dance',

  // Love / connection (maps to wedding — union/commitment)
  love: 'wedding', loved: 'wedding', loving: 'wedding', lover: 'wedding',
  romance: 'wedding', romantic: 'wedding',
  kiss: 'wedding', kissing: 'wedding', kissed: 'wedding',
  embrace: 'wedding', embracing: 'wedding', embraced: 'wedding',
  hug: 'wedding', hugging: 'wedding', hugged: 'wedding',
  intimate: 'wedding', intimacy: 'wedding',
  passion: 'wedding', passionate: 'wedding',
  longing: 'wedding', yearning: 'wedding', desire: 'wedding',
  attracted: 'wedding', attraction: 'wedding',
  crush: 'wedding', infatuation: 'wedding',
  sex: 'wedding', sexual: 'wedding', erotic: 'wedding',
  seduction: 'wedding', seduced: 'wedding',
  boyfriend: 'wedding', girlfriend: 'wedding',
  friend: 'wedding', friends: 'wedding', friendship: 'wedding',

  // Confusion / disorientation (maps to fog)
  confusion: 'fog',
  uncertain: 'fog', uncertainty: 'fog', doubt: 'fog', doubtful: 'fog',
  indecisive: 'fog', undecided: 'fog', unsure: 'fog',
  puzzled: 'fog', perplexed: 'fog', baffled: 'fog',

  // Power / authority (maps to climbing — ambition/overcoming)
  powerful: 'climbing', power: 'climbing', authority: 'climbing',
  control: 'climbing', controlling: 'climbing',
  leader: 'climbing', leadership: 'climbing',
  king: 'climbing', queen: 'climbing', royalty: 'climbing',
  throne: 'climbing', royal: 'climbing',
  commanding: 'climbing', dominant: 'climbing', domination: 'climbing',
  triumph: 'climbing', victory: 'climbing', winning: 'climbing',
  champion: 'climbing', conquer: 'climbing', conquering: 'climbing',

  // Shame / guilt (maps to naked — vulnerability/exposure)
  guilt: 'naked', guilty: 'naked',
  worthless: 'naked', inadequate: 'naked', inferior: 'naked',
  failure: 'naked', failed: 'naked', failing: 'naked',
  rejected: 'naked', rejection: 'naked', outcast: 'naked',
  betrayed: 'naked', betrayal: 'naked',
  abandonment: 'island',

  // Transformation
  transform: 'birth', transformed: 'birth', transforming: 'birth',
  transformation: 'birth', metamorphosis: 'birth',
  changing: 'birth', changed: 'birth', change: 'birth',
  evolving: 'birth', evolved: 'birth', becoming: 'birth',
  renewal: 'birth', rebirth: 'birth', reborn: 'birth',
  shedding: 'snake', molting: 'snake',

  // Animals (additional)
  lion: 'bear', tiger: 'bear', leopard: 'bear', panther: 'bear',
  fox: 'cat', deer: 'nature', elk: 'nature', moose: 'nature',
  elephant: 'bear', gorilla: 'bear', monkey: 'child', ape: 'child',
  mouse: 'rabbit', mice: 'rabbit', rat: 'insects', rats: 'insects',
  frog: 'snake', toad: 'snake', lizard: 'snake', alligator: 'snake',
  crocodile: 'snake', turtle: 'nature', tortoise: 'nature',
  pig: 'nature', cow: 'nature', sheep: 'nature', lamb: 'child',
  goat: 'nature', donkey: 'horse', camel: 'desert',
  dragon: 'snake', unicorn: 'horse', pegasus: 'flying',
  monster: 'stranger', creature: 'stranger', beast: 'bear',
  animal: 'nature', animals: 'nature', pet: 'dog', pets: 'dog',
  zoo: 'nature', wildlife: 'nature',
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
