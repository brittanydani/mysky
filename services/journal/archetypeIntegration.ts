/**
 * Archetype Integration -- Journal Prompt Layer
 *
 * Reads the saved Jungian archetype profile and returns a mood-sensitive
 * reflection prompt used inside the Journal Entry modal.
 */

import { EncryptedAsyncStorage } from '../storage/encryptedAsyncStorage';

const ARCHETYPE_STORAGE_KEY = '@mysky:archetype_profile';

export type ArchetypeKey = 'hero' | 'caregiver' | 'seeker' | 'sage' | 'rebel';
type MoodKey = 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy';

export interface ArchetypeProfile {
  dominant: ArchetypeKey;
  scores: Record<ArchetypeKey, number>;
  completedAt: string;
}

export interface ArchetypeJournalPrompt {
  /** One-line frame shown above the question */
  context: string;
  /** The reflective question the user can tap to insert into their entry */
  question: string;
  /** Display name, e.g. "The Caregiver" */
  archetypeName: string;
  archetypeColor: string;
}

// ---------------------------------------------------------------------------
// Prompt matrix: archetype x mood
// ---------------------------------------------------------------------------

const PROMPTS: Record<ArchetypeKey, Record<MoodKey, ArchetypeJournalPrompt>> = {
  hero: {
    heavy: {
      context: 'The Hero carries weight in silence.',
      question: 'Are you pushing through something instead of letting yourself rest?',
      archetypeName: 'The Hero',
      archetypeColor: '#E8C97A',
    },
    stormy: {
      context: "The Hero's strength is tested in chaos.",
      question: "What feels like it's threatening your sense of strength or control today?",
      archetypeName: 'The Hero',
      archetypeColor: '#E8C97A',
    },
    okay: {
      context: 'The Hero between battles.',
      question: 'What is one small act of courage you could choose today?',
      archetypeName: 'The Hero',
      archetypeColor: '#E8C97A',
    },
    soft: {
      context: 'The Hero learning to receive.',
      question: "Is there something gentle you need that you haven't allowed yourself to ask for?",
      archetypeName: 'The Hero',
      archetypeColor: '#E8C97A',
    },
    calm: {
      context: 'Even the Hero finds peace in stillness.',
      question: "What have you overcome recently that you haven't given yourself credit for?",
      archetypeName: 'The Hero',
      archetypeColor: '#E8C97A',
    },
  },

  caregiver: {
    heavy: {
      context: "The Caregiver's gift can become a burden when unseen.",
      question: 'Are you over-extending your nurturing energy today?',
      archetypeName: 'The Caregiver',
      archetypeColor: '#D4A3B3',
    },
    stormy: {
      context: 'Even the Caregiver has limits.',
      question: 'Who or what is draining your reserves right now -- and what do you need to replenish?',
      archetypeName: 'The Caregiver',
      archetypeColor: '#D4A3B3',
    },
    okay: {
      context: 'The Caregiver in balance.',
      question: "Is there somewhere you're giving that you haven't yet acknowledged as generosity?",
      archetypeName: 'The Caregiver',
      archetypeColor: '#D4A3B3',
    },
    soft: {
      context: 'The Caregiver tending to themselves.',
      question: 'What does receiving care look like for you today?',
      archetypeName: 'The Caregiver',
      archetypeColor: '#D4A3B3',
    },
    calm: {
      context: "Rest is part of the Caregiver's work.",
      question: 'What does taking care of yourself look like to you right now?',
      archetypeName: 'The Caregiver',
      archetypeColor: '#D4A3B3',
    },
  },

  seeker: {
    heavy: {
      context: 'The Seeker can feel caged when life feels heavy.',
      question: "Is there something today that feels like it's limiting your freedom or movement?",
      archetypeName: 'The Seeker',
      archetypeColor: '#8BC4E8',
    },
    stormy: {
      context: 'The Seeker storms when the path is unclear.',
      question: 'What are you restlessly moving toward -- or away from -- right now?',
      archetypeName: 'The Seeker',
      archetypeColor: '#8BC4E8',
    },
    okay: {
      context: 'The Seeker between horizons.',
      question: 'What new direction or possibility is gently calling your attention?',
      archetypeName: 'The Seeker',
      archetypeColor: '#8BC4E8',
    },
    soft: {
      context: 'The Seeker resting between discoveries.',
      question: 'What moment of wonder or curiosity has stayed with you lately?',
      archetypeName: 'The Seeker',
      archetypeColor: '#8BC4E8',
    },
    calm: {
      context: 'The Seeker at rest.',
      question: 'What discovery or moment of aliveness have you had recently that you want to hold onto?',
      archetypeName: 'The Seeker',
      archetypeColor: '#8BC4E8',
    },
  },

  sage: {
    heavy: {
      context: "The Sage's mind can become its own maze.",
      question: 'Are you circling a thought without resolution? What would it mean to feel it instead of solve it?',
      archetypeName: 'The Sage',
      archetypeColor: '#A89BC8',
    },
    stormy: {
      context: "Even the Sage can't think their way through every storm.",
      question: 'What truth is most difficult for you to sit with right now?',
      archetypeName: 'The Sage',
      archetypeColor: '#A89BC8',
    },
    okay: {
      context: 'The Sage observing.',
      question: 'What pattern are you noticing in your life that you want to understand more deeply?',
      archetypeName: 'The Sage',
      archetypeColor: '#A89BC8',
    },
    soft: {
      context: 'The Sage in quiet knowing.',
      question: "What insight has been quietly forming beneath the surface that you haven't said aloud yet?",
      archetypeName: 'The Sage',
      archetypeColor: '#A89BC8',
    },
    calm: {
      context: 'The Sage in clarity.',
      question: 'What wisdom has this week revealed to you about yourself?',
      archetypeName: 'The Sage',
      archetypeColor: '#A89BC8',
    },
  },

  rebel: {
    heavy: {
      context: 'The Rebel turns inward when the world feels immovable.',
      question: "Is there something you feel you can't speak against or change right now?",
      archetypeName: 'The Rebel',
      archetypeColor: '#6EBF8B',
    },
    stormy: {
      context: "The Rebel's fire burns brightest in injustice.",
      question: 'What feels most wrong or broken in your world today, and what part of you wants to respond?',
      archetypeName: 'The Rebel',
      archetypeColor: '#6EBF8B',
    },
    okay: {
      context: 'The Rebel choosing their battles.',
      question: 'Where are you choosing to flow with the current, and where are you still swimming against it?',
      archetypeName: 'The Rebel',
      archetypeColor: '#6EBF8B',
    },
    soft: {
      context: 'The Rebel at ease.',
      question: 'What have you quietly accepted lately that once felt impossible to let go of?',
      archetypeName: 'The Rebel',
      archetypeColor: '#6EBF8B',
    },
    calm: {
      context: 'The Rebel in stillness.',
      question: "What change have you made -- or are making -- that you're quietly proud of?",
      archetypeName: 'The Rebel',
      archetypeColor: '#6EBF8B',
    },
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Load the saved archetype profile from local storage. Returns null if none. */
export async function getArchetypeProfile(): Promise<ArchetypeProfile | null> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(ARCHETYPE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ArchetypeProfile;
  } catch {
    return null;
  }
}

/**
 * Return the mood-aware archetype prompt for the current journal session.
 * Falls back to 'okay' if an exact mood match is somehow missing.
 */
export function getArchetypePrompt(
  profile: ArchetypeProfile,
  mood: MoodKey,
): ArchetypeJournalPrompt {
  return PROMPTS[profile.dominant][mood] ?? PROMPTS[profile.dominant]['okay'];
}
