/**
 * Journal Pattern Insights
 * 
 * Gentle astrological pattern recognition for journal entries.
 * Never diagnostic. Always supportive and curious.
 */

export interface JournalInsight {
  patternTitle: string;
  patternDescription: string;
  gentleQuestion: string;
}

// Mood-based insights that feel human, not clinical
const MOOD_INSIGHTS: Record<string, JournalInsight[]> = {
  calm: [
    {
      patternTitle: 'A moment of stillness',
      patternDescription: 'You found peace today. That\'s not small — it\'s a skill you\'ve been building.',
      gentleQuestion: 'What helped you feel this calm? How can you invite more of that?',
    },
    {
      patternTitle: 'Grounded energy',
      patternDescription: 'When your inner world feels steady, your outer world reflects it back.',
      gentleQuestion: 'What would today\'s peaceful version of you tell yesterday\'s worried version?',
    },
    {
      patternTitle: 'Rest as revolution',
      patternDescription: 'In a world that demands productivity, choosing peace is an act of courage.',
      gentleQuestion: 'What did you give yourself permission to release today?',
    },
  ],
  soft: [
    {
      patternTitle: 'Tenderness noticed',
      patternDescription: 'Softness isn\'t weakness — it\'s how we stay open to connection.',
      gentleQuestion: 'What are you holding gently today that once felt unbearable?',
    },
    {
      patternTitle: 'Heart space opening',
      patternDescription: 'Some days we feel more permeable, more sensitive. That\'s data, not drama.',
      gentleQuestion: 'What would it look like to honor your sensitivity today instead of fighting it?',
    },
    {
      patternTitle: 'Gentle thaw',
      patternDescription: 'Things that were frozen are starting to move again.',
      gentleQuestion: 'What feelings are you allowing yourself to feel that you once pushed away?',
    },
  ],
  okay: [
    {
      patternTitle: 'The in-between',
      patternDescription: '"Okay" is underrated. It means your nervous system is regulated enough to just... be.',
      gentleQuestion: 'What does "okay" mean to you right now? Is it peace, or numbness, or something else?',
    },
    {
      patternTitle: 'Neutral ground',
      patternDescription: 'Not every day needs to be transformative. Sometimes steady is the goal.',
      gentleQuestion: 'What\'s one small thing that felt good today, even if it didn\'t feel important?',
    },
    {
      patternTitle: 'The plateau',
      patternDescription: 'Plateaus are where integration happens. Growth isn\'t always visible.',
      gentleQuestion: 'What lessons are settling in quietly beneath the surface?',
    },
  ],
  heavy: [
    {
      patternTitle: 'Carrying weight',
      patternDescription: 'Heaviness often means we\'re processing something important. It\'s not failure — it\'s digestion.',
      gentleQuestion: 'What are you carrying that isn\'t yours to hold?',
    },
    {
      patternTitle: 'The undertow',
      patternDescription: 'Sometimes we get pulled under. That doesn\'t mean we\'re drowning — just that we\'re in deep waters.',
      gentleQuestion: 'What do you need to say out loud that you\'ve only been thinking?',
    },
    {
      patternTitle: 'Energy contracted',
      patternDescription: 'When we feel heavy, the body is asking for rest, not pushing through.',
      gentleQuestion: 'What would be a small act of kindness you could give yourself right now?',
    },
  ],
  stormy: [
    {
      patternTitle: 'The storm passes',
      patternDescription: 'Intense feelings are not permanent states. This will shift. You\'ve survived every storm so far.',
      gentleQuestion: 'What triggered this intensity? And what is the feeling beneath the feeling?',
    },
    {
      patternTitle: 'Turbulence as release',
      patternDescription: 'Sometimes chaos is how we finally let go of what we were holding too tight.',
      gentleQuestion: 'What are you finally allowing yourself to feel that you\'ve been suppressing?',
    },
    {
      patternTitle: 'Energy in motion',
      patternDescription: 'Stormy energy wants to move. It\'s not meant to be contained — it\'s meant to be expressed safely.',
      gentleQuestion: 'What would help this energy move through you? Movement? Sound? Tears? Writing?',
    },
  ],
};

// Weekly pattern insights based on mood trends
export const PATTERN_SUMMARIES = {
  mostlyCalm: {
    title: 'A week of groundedness',
    message: 'You\'ve found stability this week. Notice what practices, people, or boundaries supported that.',
    prompt: 'What made this week feel more manageable than others?',
  },
  mostlySoft: {
    title: 'A tender week',
    message: 'Your heart has been open. That takes courage, even when it doesn\'t feel like it.',
    prompt: 'What opened in you this week? What are you beginning to trust?',
  },
  mostlyOkay: {
    title: 'A steady week',
    message: 'Consistency is its own form of healing. You\'re building something sustainable.',
    prompt: 'What small victories went unnoticed this week?',
  },
  mostlyHeavy: {
    title: 'A heavy week',
    message: 'It\'s okay if this week was hard. You don\'t have to be okay all the time to be doing okay overall.',
    prompt: 'What do you need that you haven\'t asked for?',
  },
  mostlyStormy: {
    title: 'An intense week',
    message: 'Big feelings moved through you. That\'s exhausting, but also cleansing. Be gentle with yourself.',
    prompt: 'What became clear in the chaos? What needed to break?',
  },
  mixed: {
    title: 'A full-spectrum week',
    message: 'You felt it all this week — the highs, the lows, the in-betweens. That\'s human. That\'s whole.',
    prompt: 'Which moments do you want to remember? Which do you want to release?',
  },
};

export class JournalPatternAnalyzer {
  /**
   * Get an insight for a specific mood
   */
  static getInsightForMood(mood: string): JournalInsight {
    const moodKey = mood.toLowerCase() as keyof typeof MOOD_INSIGHTS;
    const insights = MOOD_INSIGHTS[moodKey] || MOOD_INSIGHTS.okay;
    
    // Use date to deterministically select insight
    const today = new Date();
    const dayIndex = (today.getDate() + today.getMonth()) % insights.length;
    
    return insights[dayIndex];
  }
  
  /**
   * Analyze mood trends and return a weekly summary
   */
  static getWeeklyPattern(moods: string[]): {
    title: string;
    message: string;
    prompt: string;
    dominantMood: string;
  } {
    if (moods.length === 0) {
      return { ...PATTERN_SUMMARIES.mixed, dominantMood: 'mixed' };
    }
    
    const counts: Record<string, number> = {
      calm: 0,
      soft: 0,
      okay: 0,
      heavy: 0,
      stormy: 0,
    };
    
    moods.forEach(mood => {
      const key = mood.toLowerCase();
      if (key in counts) {
        counts[key]++;
      }
    });
    
    // Find dominant mood
    let maxCount = 0;
    let dominantMood = 'okay';
    
    for (const [mood, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = mood;
      }
    }
    
    // If no clear dominant (less than 40% of entries), it's mixed
    if (maxCount < moods.length * 0.4) {
      return { ...PATTERN_SUMMARIES.mixed, dominantMood: 'mixed' };
    }
    
    const summaryKey = `mostly${dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1)}` as keyof typeof PATTERN_SUMMARIES;
    const summary = PATTERN_SUMMARIES[summaryKey] || PATTERN_SUMMARIES.mixed;
    
    return { ...summary, dominantMood };
  }
  
  /**
   * Get a journaling prompt based on current mood
   */
  static getJournalPrompt(mood: string): string {
    const prompts: Record<string, string[]> = {
      calm: [
        'Describe a moment of peace you experienced today.',
        'What are you grateful for right now?',
        'What does your ideal tomorrow look like?',
      ],
      soft: [
        'What touched your heart today?',
        'What are you being gentle with yourself about?',
        'Write a letter to your past self from this softer place.',
      ],
      okay: [
        'What small joy did you notice today?',
        'What\'s quietly working in your life?',
        'What are you content to leave as-is?',
      ],
      heavy: [
        'What are you carrying that you could set down?',
        'What does your tired self need to hear?',
        'Describe the weight. Where do you feel it? What does it want?',
      ],
      stormy: [
        'What triggered you today? What\'s underneath that?',
        'Write without editing. Let it be messy.',
        'What are you afraid to admit, even to yourself?',
      ],
    };
    
    const moodKey = mood.toLowerCase() as keyof typeof prompts;
    const moodPrompts = prompts[moodKey] || prompts.okay;
    
    const today = new Date();
    const index = today.getDate() % moodPrompts.length;
    
    return moodPrompts[index];
  }
}
