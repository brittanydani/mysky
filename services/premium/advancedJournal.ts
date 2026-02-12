// File: services/premium/advancedJournal.ts
// Premium journal features: mood tracking, pattern insights, transit correlations
// "you feel this way during X transit" - the magic premium unlock

import { NatalChart, SimpleAspect } from '../astrology/types';
import { getTransitingLongitudes, computeTransitAspectsToNatal } from '../astrology/transits';
import { toLocalDateString } from '../../utils/dateUtils';

// ============================================================================
// TYPES
// ============================================================================

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type MoodCategory = 'overall' | 'energy' | 'anxiety' | 'connection' | 'clarity';

export interface MoodEntry {
  overall: MoodLevel;
  energy?: MoodLevel;
  anxiety?: MoodLevel;
  connection?: MoodLevel;
  clarity?: MoodLevel;
}

export interface JournalEntryMeta {
  id: string;
  date: string;
  mood?: MoodEntry;
  tags?: string[];
  transitSnapshot?: TransitSnapshot;
  wordCount: number;
}

export interface TransitSnapshot {
  date: string;
  moonSign: string;
  moonPhase: string;
  strongestAspects: TransitAspectSummary[];
}

export interface TransitAspectSummary {
  transitingPlanet: string;
  natalPlanet: string;
  aspectType: string;
  orb: number;
}

export interface PatternInsight {
  type: 'mood_pattern' | 'transit_correlation' | 'theme_pattern' | 'timing_pattern';
  title: string;
  description: string;
  confidence: 'emerging' | 'suggested' | 'strong';
  evidence: string;
  actionable?: string;
}

export interface JournalAnalytics {
  totalEntries: number;
  streakDays: number;
  longestStreak: number;
  averageMood: number;
  moodTrend: 'improving' | 'stable' | 'declining' | 'variable';
  topTags: string[];
  writingPatterns: WritingPattern[];
  transitCorrelations: TransitCorrelation[];
}

export interface WritingPattern {
  pattern: string;
  frequency: number;
  insight: string;
}

export interface TransitCorrelation {
  transitDescription: string;
  moodEffect: 'elevates' | 'challenges' | 'neutral';
  averageMoodDuring: number;
  sampleSize: number;
  insight: string;
}

// ============================================================================
// MOOD TRACKING SYSTEM
// ============================================================================

const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Struggling',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const CATEGORY_PROMPTS: Record<MoodCategory, string> = {
  overall: 'How are you feeling overall?',
  energy: 'How is your energy level?',
  anxiety: 'How calm or anxious are you feeling?',
  connection: 'How connected do you feel to others?',
  clarity: 'How clear is your thinking?',
};

// ============================================================================
// TRANSIT CORRELATION DATA
// ============================================================================

interface TransitMoodCorrelation {
  transit: string;
  typicalMoodEffect: 'elevates' | 'challenges' | 'neutral';
  description: string;
  copingTip: string;
}

const KNOWN_TRANSIT_CORRELATIONS: TransitMoodCorrelation[] = [
  {
    transit: 'Moon conjunct natal Moon',
    typicalMoodEffect: 'neutral',
    description: 'Monthly emotional reset. You may feel your needs more clearly.',
    copingTip: 'Honor what surfaces. Your feelings are showing you something real.',
  },
  {
    transit: 'Moon square natal Moon',
    typicalMoodEffect: 'challenges',
    description: 'Emotional tension. Conflicting needs may create inner friction.',
    copingTip: 'Don\'t force resolution. Sit with the discomfort and let it teach you.',
  },
  {
    transit: 'Moon conjunct natal Saturn',
    typicalMoodEffect: 'challenges',
    description: 'Heavier emotional atmosphere. Themes of responsibility or self-criticism.',
    copingTip: 'Be your own compassionate parent today. The heaviness will pass.',
  },
  {
    transit: 'Moon square natal Saturn',
    typicalMoodEffect: 'challenges',
    description: 'Friction between feelings and obligations. May feel restricted or serious.',
    copingTip: 'This isn\'t permanent. Focus on one small thing you can control.',
  },
  {
    transit: 'Moon conjunct natal Venus',
    typicalMoodEffect: 'elevates',
    description: 'Soft, harmonious energy. Enhanced appreciation for beauty and connection.',
    copingTip: 'Lean into pleasure. This is a good day for self-care and relationships.',
  },
  {
    transit: 'Moon trine natal Venus',
    typicalMoodEffect: 'elevates',
    description: 'Emotional flow and harmony. Relationships feel easier.',
    copingTip: 'Enjoy the ease. Not every day has to be effortful.',
  },
  {
    transit: 'Moon conjunct natal Mars',
    typicalMoodEffect: 'neutral',
    description: 'Emotional intensity and drive. Can manifest as motivation or irritation.',
    copingTip: 'Channel the energy into action. Suppression makes it worse.',
  },
  {
    transit: 'Moon square natal Mars',
    typicalMoodEffect: 'challenges',
    description: 'Emotional friction and possible irritability. Conflicts may flare.',
    copingTip: 'Move your body. The tension needs somewhere to go.',
  },
  {
    transit: 'Moon conjunct natal Sun',
    typicalMoodEffect: 'elevates',
    description: 'Alignment between feelings and identity. Authenticity feels accessible.',
    copingTip: 'Express yourself. You\'re more visible and integrated today.',
  },
  {
    transit: 'Moon opposite natal Sun',
    typicalMoodEffect: 'neutral',
    description: 'Tension between emotional needs and identity expression.',
    copingTip: 'Notice the pull. What do you need vs. who are you trying to be?',
  },
];

// ============================================================================
// PATTERN DETECTION LOGIC
// ============================================================================

export class AdvancedJournalAnalyzer {
  /**
   * Capture transit snapshot for a journal entry
   */
  static captureTransitSnapshot(natalChart: NatalChart, date: Date = new Date()): TransitSnapshot {
    const houseSystem = natalChart.houseSystem ?? 'whole-sign';
    const transits = getTransitingLongitudes(
      date,
      natalChart.birthData.latitude,
      natalChart.birthData.longitude,
      houseSystem
    );

    const transitAspects: SimpleAspect[] = computeTransitAspectsToNatal(natalChart, transits);
    const sorted = [...transitAspects].sort((a, b) => a.orb - b.orb);

    // Get moon sign from transit longitude
    const moonLongitude = transits['Moon'] || 0;
    const moonSignIndex = Math.floor(moonLongitude / 30);
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const moonSign = signs[moonSignIndex] || 'Unknown';

    return {
      date: toLocalDateString(date),
      moonSign,
      moonPhase: this.getMoonPhase(date),
      strongestAspects: sorted.slice(0, 3).map(a => ({
        transitingPlanet: a.pointA,
        natalPlanet: a.pointB,
        aspectType: a.type,
        orb: a.orb,
      })),
    };
  }

  /**
   * Get moon phase name
   */
  private static getMoonPhase(date: Date): string {
    const synodicMonth = 29.53059;
    const knownNewMoon = new Date('2024-01-11');
    const daysSinceNew = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phaseDay = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth;

    if (phaseDay < 1.85) return 'New Moon';
    if (phaseDay < 7.38) return 'Waxing Crescent';
    if (phaseDay < 9.23) return 'First Quarter';
    if (phaseDay < 14.77) return 'Waxing Gibbous';
    if (phaseDay < 16.61) return 'Full Moon';
    if (phaseDay < 22.15) return 'Waning Gibbous';
    if (phaseDay < 23.99) return 'Last Quarter';
    return 'Waning Crescent';
  }

  /**
   * Analyze patterns across journal entries
   * This is the premium magic: connecting mood data to transits
   */
  static analyzePatterns(
    entries: JournalEntryMeta[],
    isPremium: boolean = true
  ): PatternInsight[] {
    if (!isPremium) {
      return [{
        type: 'mood_pattern',
        title: 'Unlock Pattern Insights',
        description: 'Deeper Sky reveals the cosmic patterns behind your emotional experiences.',
        confidence: 'emerging',
        evidence: `You have ${entries.length} journal entries. With Deeper Sky, we'd show you what they reveal.`,
        actionable: 'Upgrade to see your personal patterns.',
      }];
    }

    const insights: PatternInsight[] = [];

    // Pattern 1: Transit correlations with mood
    const transitCorrelations = this.findTransitMoodCorrelations(entries);
    insights.push(...transitCorrelations);

    // Pattern 2: Moon phase patterns
    const moonPhasePatterns = this.findMoonPhasePatterns(entries);
    insights.push(...moonPhasePatterns);

    // Pattern 3: Writing frequency patterns
    const writingPatterns = this.findWritingPatterns(entries);
    insights.push(...writingPatterns);

    // Pattern 4: Tag patterns
    const tagPatterns = this.findTagPatterns(entries);
    insights.push(...tagPatterns);

    return insights;
  }

  /**
   * Find correlations between transits and mood
   */
  private static findTransitMoodCorrelations(entries: JournalEntryMeta[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    const transitMoodMap: Map<string, number[]> = new Map();

    // Group mood scores by transit type
    for (const entry of entries) {
      if (!entry.mood || !entry.transitSnapshot) continue;

      for (const aspect of entry.transitSnapshot.strongestAspects) {
        const key = `${aspect.transitingPlanet} ${aspect.aspectType} natal ${aspect.natalPlanet}`;
        const moods = transitMoodMap.get(key) || [];
        moods.push(entry.mood.overall);
        transitMoodMap.set(key, moods);
      }
    }

    // Analyze patterns for transits with enough data
    for (const [transit, moods] of transitMoodMap.entries()) {
      if (moods.length < 3) continue; // Need at least 3 data points

      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
      const overallAvg = this.calculateOverallAverageMood(entries);

      const diff = avgMood - overallAvg;
      const knownCorrelation = KNOWN_TRANSIT_CORRELATIONS.find(
        c => transit.toLowerCase().includes(c.transit.toLowerCase().split(' ')[0]) &&
             transit.toLowerCase().includes(c.transit.toLowerCase().split(' ')[1])
      );

      if (Math.abs(diff) > 0.5) {
        const effect = diff > 0 ? 'elevates' : 'challenges';
        const confidence = moods.length >= 5 ? 'strong' : moods.length >= 3 ? 'suggested' : 'emerging';

        insights.push({
          type: 'transit_correlation',
          title: `${effect === 'elevates' ? '✨' : '🌧️'} ${transit}`,
          description: diff > 0
            ? `Your mood tends to be ${Math.abs(diff).toFixed(1)} points higher when this transit is active.`
            : `Your mood tends to be ${Math.abs(diff).toFixed(1)} points lower when this transit is active.`,
          confidence,
          evidence: `Based on ${moods.length} journal entries with this transit.`,
          actionable: knownCorrelation?.copingTip || 
            (effect === 'challenges' 
              ? 'Be extra gentle with yourself during these times.'
              : 'This is typically a good time for you—lean into it.'),
        });
      }
    }

    return insights;
  }

  /**
   * Find patterns related to moon phases
   */
  private static findMoonPhasePatterns(entries: JournalEntryMeta[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    const phaseMoodMap: Map<string, number[]> = new Map();

    for (const entry of entries) {
      if (!entry.mood || !entry.transitSnapshot) continue;

      const phase = entry.transitSnapshot.moonPhase;
      const moods = phaseMoodMap.get(phase) || [];
      moods.push(entry.mood.overall);
      phaseMoodMap.set(phase, moods);
    }

    for (const [phase, moods] of phaseMoodMap.entries()) {
      if (moods.length < 2) continue;

      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
      const overallAvg = this.calculateOverallAverageMood(entries);
      const diff = avgMood - overallAvg;

      if (Math.abs(diff) > 0.4) {
        const phaseEmoji = this.getPhaseEmoji(phase);
        insights.push({
          type: 'mood_pattern',
          title: `${phaseEmoji} ${phase} Pattern`,
          description: diff > 0
            ? `You tend to feel better during the ${phase} (avg mood: ${avgMood.toFixed(1)}).`
            : `The ${phase} can be more challenging for you (avg mood: ${avgMood.toFixed(1)}).`,
          confidence: moods.length >= 4 ? 'suggested' : 'emerging',
          evidence: `Based on ${moods.length} entries during this phase.`,
          actionable: diff < 0
            ? `Plan extra self-care during ${phase} times.`
            : `The ${phase} is a good time for you to take on challenges.`,
        });
      }
    }

    return insights;
  }

  /**
   * Find patterns in writing frequency
   */
  private static findWritingPatterns(entries: JournalEntryMeta[]): PatternInsight[] {
    const insights: PatternInsight[] = [];

    if (entries.length < 7) return insights;

    // Analyze day-of-week patterns
    const dayMap: Map<number, number> = new Map();
    for (const entry of entries) {
      const day = new Date(entry.date).getDay();
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxDay = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0];
    
    if (maxDay && maxDay[1] >= 3) {
      insights.push({
        type: 'timing_pattern',
        title: `📅 ${days[maxDay[0]]} Journaler`,
        description: `You write most often on ${days[maxDay[0]]}s.`,
        confidence: 'suggested',
        evidence: `${maxDay[1]} entries on ${days[maxDay[0]]}s.`,
        actionable: `Consider setting a gentle reminder for your other days too.`,
      });
    }

    return insights;
  }

  /**
   * Find patterns in journal tags
   */
  private static findTagPatterns(entries: JournalEntryMeta[]): PatternInsight[] {
    const insights: PatternInsight[] = [];
    const tagMoodMap: Map<string, number[]> = new Map();

    for (const entry of entries) {
      if (!entry.mood || !entry.tags) continue;

      for (const tag of entry.tags) {
        const moods = tagMoodMap.get(tag) || [];
        moods.push(entry.mood.overall);
        tagMoodMap.set(tag, moods);
      }
    }

    for (const [tag, moods] of tagMoodMap.entries()) {
      if (moods.length < 2) continue;

      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;

      if (avgMood >= 4) {
        insights.push({
          type: 'theme_pattern',
          title: `💚 "${tag}" = Good Days`,
          description: `Entries tagged "${tag}" have an average mood of ${avgMood.toFixed(1)}.`,
          confidence: moods.length >= 3 ? 'suggested' : 'emerging',
          evidence: `Based on ${moods.length} entries with this tag.`,
          actionable: `"${tag}" seems to correlate with better days for you.`,
        });
      } else if (avgMood <= 2.5) {
        insights.push({
          type: 'theme_pattern',
          title: `🌧️ "${tag}" = Tender Days`,
          description: `Entries tagged "${tag}" have an average mood of ${avgMood.toFixed(1)}.`,
          confidence: moods.length >= 3 ? 'suggested' : 'emerging',
          evidence: `Based on ${moods.length} entries with this tag.`,
          actionable: `When "${tag}" themes arise, extra self-compassion helps.`,
        });
      }
    }

    return insights;
  }

  /**
   * Calculate overall average mood
   */
  private static calculateOverallAverageMood(entries: JournalEntryMeta[]): number {
    const entriesWithMood = entries.filter(e => e.mood);
    if (entriesWithMood.length === 0) return 3;
    
    const sum = entriesWithMood.reduce((acc, e) => acc + (e.mood?.overall || 3), 0);
    return sum / entriesWithMood.length;
  }

  /**
   * Get emoji for moon phase
   */
  private static getPhaseEmoji(phase: string): string {
    const emojis: Record<string, string> = {
      'New Moon': '🌑',
      'Waxing Crescent': '🌒',
      'First Quarter': '🌓',
      'Waxing Gibbous': '🌔',
      'Full Moon': '🌕',
      'Waning Gibbous': '🌖',
      'Last Quarter': '🌗',
      'Waning Crescent': '🌘',
    };
    return emojis[phase] || '🌙';
  }

  /**
   * Generate full analytics for premium users
   */
  static generateAnalytics(entries: JournalEntryMeta[]): JournalAnalytics {
    const entriesWithMood = entries.filter(e => e.mood);
    const avgMood = this.calculateOverallAverageMood(entries);

    // Calculate streak
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      if (lastDate) {
        const dayDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = entryDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if streak is current
    if (sortedEntries.length > 0) {
      const today = new Date();
      const lastEntry = new Date(sortedEntries[0].date);
      const daysSince = Math.floor((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));
      currentStreak = daysSince <= 1 ? tempStreak : 0;
    }

    // Mood trend (last 7 entries vs previous 7)
    let moodTrend: 'improving' | 'stable' | 'declining' | 'variable' = 'stable';
    if (entriesWithMood.length >= 14) {
      const recent = entriesWithMood.slice(0, 7);
      const previous = entriesWithMood.slice(7, 14);
      const recentAvg = recent.reduce((a, e) => a + (e.mood?.overall || 3), 0) / 7;
      const prevAvg = previous.reduce((a, e) => a + (e.mood?.overall || 3), 0) / 7;
      const diff = recentAvg - prevAvg;
      
      if (diff > 0.3) moodTrend = 'improving';
      else if (diff < -0.3) moodTrend = 'declining';
    }

    // Top tags
    const tagCounts: Map<string, number> = new Map();
    for (const entry of entries) {
      for (const tag of entry.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      totalEntries: entries.length,
      streakDays: currentStreak,
      longestStreak,
      averageMood: avgMood,
      moodTrend,
      topTags,
      writingPatterns: [],
      transitCorrelations: [],
    };
  }

  /**
   * Get the "You feel this way during X" insight
   * This is THE premium value proposition for journal
   */
  static getTransitInsightForEntry(
    entry: JournalEntryMeta,
    isPremium: boolean = true
  ): string | null {
    if (!isPremium) {
      return "🔒 Upgrade to Deeper Sky to see why you felt this way.";
    }

    if (!entry.transitSnapshot || !entry.mood) return null;

    const strongestAspect = entry.transitSnapshot.strongestAspects[0];
    if (!strongestAspect) return null;

    const transitDesc = `${strongestAspect.transitingPlanet} ${strongestAspect.aspectType} your natal ${strongestAspect.natalPlanet}`;
    
    const knownCorrelation = KNOWN_TRANSIT_CORRELATIONS.find(c => 
      c.transit.toLowerCase().includes(strongestAspect.natalPlanet.toLowerCase()) &&
      c.transit.toLowerCase().includes(strongestAspect.aspectType.toLowerCase())
    );

    if (knownCorrelation) {
      return `You felt this way because ${transitDesc}. ${knownCorrelation.description}`;
    }

    // Generic insight based on aspect type
    if (strongestAspect.aspectType === 'conjunction') {
      return `The Moon was merging with your natal ${strongestAspect.natalPlanet}, intensifying ${strongestAspect.natalPlanet.toLowerCase()} themes in your emotional experience.`;
    } else if (strongestAspect.aspectType === 'square' || strongestAspect.aspectType === 'opposition') {
      return `There was tension between the transiting ${strongestAspect.transitingPlanet} and your natal ${strongestAspect.natalPlanet}. This friction often surfaces emotions that need attention.`;
    } else {
      return `The ${strongestAspect.transitingPlanet} was harmonizing with your natal ${strongestAspect.natalPlanet}, creating supportive energy for ${strongestAspect.natalPlanet.toLowerCase()}-related experiences.`;
    }
  }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export const MOOD_CONFIG = {
  labels: MOOD_LABELS,
  emojis: MOOD_EMOJIS,
  categoryPrompts: CATEGORY_PROMPTS,
};

export function getMoodLabel(level: MoodLevel): string {
  return MOOD_LABELS[level];
}

export function getMoodEmoji(level: MoodLevel): string {
  return MOOD_EMOJIS[level];
}
