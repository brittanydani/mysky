/**
 * Chart-Tied Journal Prompts
 * 
 * Premium feature: Journal prompts based on:
 * 1. User's natal placements (Moon sign, Mercury, etc.)
 * 2. Active transits for the day
 * 3. Current mood
 * 
 * Makes journaling feel personalized, not generic.
 */

import { NatalChart, PlanetPosition } from './types';
import { DailyInsightEngine, LifeDomain } from './dailyInsightEngine';
import { JournalPatternAnalyzer } from './journalPatterns';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChartTiedPrompt {
  prompt: string;
  context: string;           // e.g., "Based on your Scorpio Moon"
  domain: LifeDomain | 'general';
  source: 'natal' | 'transit' | 'mood' | 'combined';
}

export interface JournalPromptSet {
  primary: ChartTiedPrompt;
  alternatives: ChartTiedPrompt[];
  transitContext?: string;   // e.g., "Moon conjunct your natal Venus today"
}

// ─────────────────────────────────────────────────────────────────────────────
// Natal-Based Prompts
// ─────────────────────────────────────────────────────────────────────────────

const MOON_SIGN_PROMPTS: Record<string, ChartTiedPrompt[]> = {
  Aries: [
    { prompt: "What made you feel impatient today, and what was that urgency trying to protect?", context: "Your Aries Moon needs action", domain: 'energy', source: 'natal' },
    { prompt: "Where did you feel the urge to start something new? Did you follow it?", context: "Aries Moon craves fresh starts", domain: 'direction', source: 'natal' },
    { prompt: "What would it look like to honor your need for independence today?", context: "Your Aries Moon values autonomy", domain: 'mood', source: 'natal' },
  ],
  Taurus: [
    { prompt: "What brought you comfort today? Describe it with all your senses.", context: "Your Taurus Moon finds safety in the sensory", domain: 'home', source: 'natal' },
    { prompt: "Where did you feel rushed when you needed to go slow?", context: "Taurus Moon needs its own pace", domain: 'mood', source: 'natal' },
    { prompt: "What are you holding onto that still serves you? What's ready to release?", context: "Taurus Moon values security", domain: 'growth', source: 'natal' },
  ],
  Gemini: [
    { prompt: "What conversation stayed with you today? What did it stir up?", context: "Your Gemini Moon processes through words", domain: 'focus', source: 'natal' },
    { prompt: "What are you curious about right now that you haven't explored yet?", context: "Gemini Moon needs mental stimulation", domain: 'growth', source: 'natal' },
    { prompt: "Did you feel scattered today? What were the different parts of you wanting?", context: "Gemini Moon holds multitudes", domain: 'mood', source: 'natal' },
  ],
  Cancer: [
    { prompt: "Who or what felt like home today? Who or what didn't?", context: "Your Cancer Moon seeks belonging", domain: 'home', source: 'natal' },
    { prompt: "What emotion surfaced that you usually keep hidden?", context: "Cancer Moon feels deeply", domain: 'mood', source: 'natal' },
    { prompt: "How did you nurture yourself today? How did you nurture others?", context: "Cancer Moon gives and needs care", domain: 'love', source: 'natal' },
  ],
  Leo: [
    { prompt: "Where did you feel seen today? Where did you feel invisible?", context: "Your Leo Moon needs recognition", domain: 'direction', source: 'natal' },
    { prompt: "What did you create or express today that felt authentically you?", context: "Leo Moon expresses through creation", domain: 'growth', source: 'natal' },
    { prompt: "What would you do if you knew you couldn't fail?", context: "Leo Moon dares to shine", domain: 'energy', source: 'natal' },
  ],
  Virgo: [
    { prompt: "What small improvement did you make today that felt good?", context: "Your Virgo Moon finds peace in refinement", domain: 'focus', source: 'natal' },
    { prompt: "Where were you hard on yourself today? What would compassion say instead?", context: "Virgo Moon's inner critic needs softening", domain: 'mood', source: 'natal' },
    { prompt: "What felt 'good enough' today? Can you let that be enough?", context: "Virgo Moon learns to accept imperfection", domain: 'growth', source: 'natal' },
  ],
  Libra: [
    { prompt: "What relationship dynamic took up space in your mind today?", context: "Your Libra Moon processes through others", domain: 'love', source: 'natal' },
    { prompt: "Where did you compromise today? Was it balanced or did you give too much?", context: "Libra Moon seeks harmony", domain: 'mood', source: 'natal' },
    { prompt: "What would it look like to choose yourself first, just for today?", context: "Libra Moon sometimes forgets its own needs", domain: 'direction', source: 'natal' },
  ],
  Scorpio: [
    { prompt: "What intense feeling moved through you today? What was underneath it?", context: "Your Scorpio Moon feels in extremes", domain: 'mood', source: 'natal' },
    { prompt: "What truth did you avoid today? What would happen if you faced it?", context: "Scorpio Moon seeks depth", domain: 'growth', source: 'natal' },
    { prompt: "Who or what do you trust fully? What makes them safe?", context: "Scorpio Moon guards trust carefully", domain: 'love', source: 'natal' },
  ],
  Sagittarius: [
    { prompt: "What felt expansive today? What felt confining?", context: "Your Sagittarius Moon needs freedom", domain: 'growth', source: 'natal' },
    { prompt: "What are you believing right now? Is it still true?", context: "Sagittarius Moon lives by meaning", domain: 'direction', source: 'natal' },
    { prompt: "What adventure—big or small—is calling you?", context: "Sagittarius Moon craves exploration", domain: 'energy', source: 'natal' },
  ],
  Capricorn: [
    { prompt: "What did you accomplish today? And what did it cost you?", context: "Your Capricorn Moon measures in achievement", domain: 'focus', source: 'natal' },
    { prompt: "Where did you feel responsible for something that wasn't yours?", context: "Capricorn Moon takes on too much", domain: 'mood', source: 'natal' },
    { prompt: "What would rest look like without guilt?", context: "Capricorn Moon struggles to stop", domain: 'energy', source: 'natal' },
  ],
  Aquarius: [
    { prompt: "Where did you feel different from everyone else today? How did that feel?", context: "Your Aquarius Moon is wired uniquely", domain: 'direction', source: 'natal' },
    { prompt: "What idea or vision excited you today?", context: "Aquarius Moon thinks ahead", domain: 'growth', source: 'natal' },
    { prompt: "How did you balance your need for connection with your need for space?", context: "Aquarius Moon needs both", domain: 'love', source: 'natal' },
  ],
  Pisces: [
    { prompt: "What did you absorb from others today that wasn't yours?", context: "Your Pisces Moon is porous", domain: 'mood', source: 'natal' },
    { prompt: "What did your imagination offer you today?", context: "Pisces Moon lives in the invisible", domain: 'growth', source: 'natal' },
    { prompt: "Where do you need firmer boundaries? And where do you need softer ones?", context: "Pisces Moon blurs edges", domain: 'love', source: 'natal' },
  ],
};

// Mercury sign prompts for communication/processing style
const MERCURY_SIGN_PROMPTS: Record<string, ChartTiedPrompt> = {
  Aries: { prompt: "What did you say today before you thought? Was it true?", context: "Your Mercury in Aries speaks fast", domain: 'focus', source: 'natal' },
  Taurus: { prompt: "What idea are you slowly turning over? Let it marinate.", context: "Mercury in Taurus thinks deliberately", domain: 'focus', source: 'natal' },
  Gemini: { prompt: "What are you overthinking? Write both sides of the argument.", context: "Mercury in Gemini sees all angles", domain: 'focus', source: 'natal' },
  Cancer: { prompt: "What memory surfaced today? What is it trying to tell you?", context: "Mercury in Cancer thinks in memories", domain: 'mood', source: 'natal' },
  Leo: { prompt: "What story do you want to tell about today?", context: "Mercury in Leo narrates life dramatically", domain: 'direction', source: 'natal' },
  Virgo: { prompt: "What details did you notice that others missed?", context: "Mercury in Virgo catches everything", domain: 'focus', source: 'natal' },
  Libra: { prompt: "What decision are you weighing? What would each choice create?", context: "Mercury in Libra deliberates carefully", domain: 'focus', source: 'natal' },
  Scorpio: { prompt: "What hidden truth did you sense today? Trust your radar.", context: "Mercury in Scorpio reads between lines", domain: 'mood', source: 'natal' },
  Sagittarius: { prompt: "What bigger meaning did today hold? What's the lesson?", context: "Mercury in Sagittarius seeks wisdom", domain: 'growth', source: 'natal' },
  Capricorn: { prompt: "What practical step can you take tomorrow based on today?", context: "Mercury in Capricorn thinks in plans", domain: 'focus', source: 'natal' },
  Aquarius: { prompt: "What unconventional idea came to you today? Follow it.", context: "Mercury in Aquarius thinks differently", domain: 'growth', source: 'natal' },
  Pisces: { prompt: "What did your intuition whisper today? Write it before it fades.", context: "Mercury in Pisces receives impressions", domain: 'mood', source: 'natal' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Transit-Based Prompts
// ─────────────────────────────────────────────────────────────────────────────

const TRANSIT_PROMPTS: Record<string, Record<string, ChartTiedPrompt>> = {
  'Moon-conjunction': {
    Sun: { prompt: "Your needs and your identity are aligned today. What do both want?", context: "Moon conjunct your Sun", domain: 'direction', source: 'transit' },
    Moon: { prompt: "This is your lunar return—a monthly reset. What are you ready to begin?", context: "Moon returning to natal position", domain: 'mood', source: 'transit' },
    Venus: { prompt: "What feels beautiful or loving right now? Let yourself receive it.", context: "Moon conjunct your Venus", domain: 'love', source: 'transit' },
    Mars: { prompt: "What's stirring you to action? Is it anger, desire, or something else?", context: "Moon conjunct your Mars", domain: 'energy', source: 'transit' },
    Mercury: { prompt: "Your heart and mind are speaking the same language. What are they saying?", context: "Moon conjunct your Mercury", domain: 'focus', source: 'transit' },
  },
  'Moon-square': {
    Sun: { prompt: "You might feel pulled between what you need and who you think you should be. Both are valid.", context: "Moon square your Sun", domain: 'mood', source: 'transit' },
    Moon: { prompt: "Tension with your emotional nature is asking for attention. What's uncomfortable?", context: "Moon square natal Moon", domain: 'mood', source: 'transit' },
    Venus: { prompt: "Love or pleasure might feel complicated today. What do you actually want?", context: "Moon square your Venus", domain: 'love', source: 'transit' },
    Mars: { prompt: "Frustration is energy looking for a direction. Where could it go constructively?", context: "Moon square your Mars", domain: 'energy', source: 'transit' },
  },
  'Venus-conjunction': {
    Sun: { prompt: "You're more magnetic than usual. What do you want to attract?", context: "Venus conjunct your Sun", domain: 'love', source: 'transit' },
    Venus: { prompt: "This is your Venus return—a time to reconnect with what you truly value.", context: "Venus returning home", domain: 'love', source: 'transit' },
    Moon: { prompt: "Emotional and relational needs are harmonizing. Who do you want to be close to?", context: "Venus conjunct your Moon", domain: 'love', source: 'transit' },
  },
  'Mars-conjunction': {
    Sun: { prompt: "You have extra fire today. What will you use it for?", context: "Mars conjunct your Sun", domain: 'energy', source: 'transit' },
    Mars: { prompt: "Your drive is amplified. This is power—use it wisely.", context: "Mars returning to natal position", domain: 'energy', source: 'transit' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Service Class
// ─────────────────────────────────────────────────────────────────────────────

export class ChartTiedPromptsService {
  /**
   * Get a full prompt set for premium journaling
   */
  static getPromptSet(
    chart: NatalChart,
    mood?: string,
    date: Date = new Date()
  ): JournalPromptSet {
    const prompts: ChartTiedPrompt[] = [];
    let transitContext: string | undefined;

    // 1. Get natal-based prompts
    const moonSign = this.getMoonSign(chart);
    if (moonSign && MOON_SIGN_PROMPTS[moonSign]) {
      const moonPrompts = MOON_SIGN_PROMPTS[moonSign];
      const dayIndex = date.getDate() % moonPrompts.length;
      prompts.push(moonPrompts[dayIndex]);
    }

    const mercurySign = this.getMercurySign(chart);
    if (mercurySign && MERCURY_SIGN_PROMPTS[mercurySign]) {
      prompts.push(MERCURY_SIGN_PROMPTS[mercurySign]);
    }

    // 2. Get transit-based prompts
    try {
      const insight = DailyInsightEngine.generateDailyInsight(chart, date);
      if (insight.signals.length > 0) {
        transitContext = insight.signals[0].description;
        
        // Try to match to a transit prompt
        for (const signal of insight.signals) {
          const parts = signal.description.toLowerCase();
          for (const [transitKey, targets] of Object.entries(TRANSIT_PROMPTS)) {
            const [planet, aspect] = transitKey.split('-');
            if (parts.includes(planet.toLowerCase()) && parts.includes(aspect)) {
              for (const [target, prompt] of Object.entries(targets)) {
                if (parts.includes(target.toLowerCase())) {
                  prompts.push(prompt);
                  break;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // Transit calculation failed, continue with natal prompts
    }

    // 3. Add mood-based prompt if provided
    if (mood) {
      const moodPrompt = JournalPatternAnalyzer.getJournalPrompt(mood);
      prompts.push({
        prompt: moodPrompt,
        context: `Based on your ${mood} mood`,
        domain: 'mood',
        source: 'mood',
      });
    }

    // 4. Select primary and alternatives
    const primary = prompts[0] || this.getFallbackPrompt();
    const alternatives = prompts.slice(1, 4);

    return {
      primary,
      alternatives,
      transitContext,
    };
  }

  /**
   * Get a single prompt for free users (generic, but still good)
   */
  static getFreePrompt(mood?: string): ChartTiedPrompt {
    if (mood) {
      return {
        prompt: JournalPatternAnalyzer.getJournalPrompt(mood),
        context: 'Daily reflection',
        domain: 'general',
        source: 'mood',
      };
    }
    return this.getFallbackPrompt();
  }

  /**
   * Get moon sign from chart
   */
  private static getMoonSign(chart: NatalChart): string | null {
    // Try enhanced planets first
    if (chart.planets) {
      const moon = chart.planets.find(p => p.planet === 'Moon');
      if (moon?.sign) return moon.sign;
    }
    
    // Try legacy placements
    if (chart.placements) {
      const moon = chart.placements.find(p => p.planet?.name === 'Moon');
      if (moon?.sign?.name) return moon.sign.name;
    }
    
    return null;
  }

  /**
   * Get Mercury sign from chart
   */
  private static getMercurySign(chart: NatalChart): string | null {
    if (chart.planets) {
      const mercury = chart.planets.find(p => p.planet === 'Mercury');
      if (mercury?.sign) return mercury.sign;
    }
    
    if (chart.placements) {
      const mercury = chart.placements.find(p => p.planet?.name === 'Mercury');
      if (mercury?.sign?.name) return mercury.sign.name;
    }
    
    return null;
  }

  /**
   * Fallback prompt when nothing else matches
   */
  private static getFallbackPrompt(): ChartTiedPrompt {
    const fallbacks = [
      { prompt: "What's on your mind that you haven't said out loud yet?", context: "Open reflection", domain: 'general' as const, source: 'mood' as const },
      { prompt: "What moment from today do you want to remember?", context: "Daily reflection", domain: 'general' as const, source: 'mood' as const },
      { prompt: "What would you tell a friend who felt exactly like you do right now?", context: "Self-compassion", domain: 'general' as const, source: 'mood' as const },
    ];
    const index = new Date().getDate() % fallbacks.length;
    return fallbacks[index];
  }
}
