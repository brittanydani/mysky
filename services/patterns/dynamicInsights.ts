/**
 * Dynamic Insight Generator
 * 
 * Generates emotionally intelligent, personalized daily insights.
 * Not "today's horoscope" — instead:
 *   - Why this matters today
 *   - What part of you it's activating
 *   - What to do with it
 * 
 * Premium: conscious vs unconscious expression paths
 */

import { NatalChart } from '../astrology/types';
import { SkySnapshot, captureSkySnapshot } from './checkInService';
import { DailyCheckIn, DynamicInsight, MagicTouch } from './types';
import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// House activation messages
// ─────────────────────────────────────────────────────────────────────────────

interface HouseActivation {
  whyThisMatters: string;
  whatItsActivating: string;
  whatToDo: string;
  consciousPath: string;
  unconsciousPath: string;
  shadowLens: string;
}

const HOUSE_ACTIVATIONS: Record<number, HouseActivation> = {
  1: {
    whyThisMatters: "Today's Moon is moving through your 1st house — the most personal part of your chart.",
    whatItsActivating: "Your sense of self, how you show up, and how you feel about being seen.",
    whatToDo: "If you feel more sensitive about your appearance or impact today, that's normal. You're recalibrating how you present yourself to the world.",
    consciousPath: "Use this energy to make a small change that feels more 'you' — even just how you style your hair or how you introduce yourself.",
    unconsciousPath: "You might overreact to criticism or become unusually self-conscious. Notice without judging.",
    shadowLens: "This transit may stir the question: 'Am I allowed to take up space?' The answer is yes.",
  },
  2: {
    whyThisMatters: "Today's Moon is activating your 2nd house — your relationship with comfort, money, and self-worth.",
    whatItsActivating: "Your need for stability and the things that make you feel secure.",
    whatToDo: "If you're drawn to comfort food, online shopping, or nesting — that's this transit. Give yourself one small comfort without guilt.",
    consciousPath: "Review something that supports your sense of stability — savings, routines, or boundaries around your energy.",
    unconsciousPath: "You might overspend, eat emotionally, or feel clingy about possessions. Notice the 'need' underneath.",
    shadowLens: "This transit may echo: 'Am I enough without the things I have?' Your worth isn't measured in possessions.",
  },
  3: {
    whyThisMatters: "Today's Moon lights up your 3rd house — communication, learning, and your immediate environment.",
    whatItsActivating: "How you think, speak, and connect with the people closest to you.",
    whatToDo: "You might feel chattier or more curious than usual. Good day for meaningful conversations, journaling, or learning something new.",
    consciousPath: "Reach out to a sibling, neighbor, or close friend. Say the thing you've been meaning to say.",
    unconsciousPath: "You might gossip, overthink texts, or get caught in mental loops. Notice when your mind is spinning.",
    shadowLens: "This may stir: 'Do people really listen to me?' Your voice matters more than you think.",
  },
  4: {
    whyThisMatters: "Today's Moon is in your 4th house — this isn't about productivity. It's about safety.",
    whatItsActivating: "Your deepest emotional foundation — home, family, and where you feel you belong.",
    whatToDo: "If you feel unmotivated, that's not failure. It's a cue to slow down. Your soul is asking for rest and rootedness.",
    consciousPath: "Create a moment of home — cook something, tidy a space, call someone who feels like safety.",
    unconsciousPath: "You might withdraw, feel homesick, or pick fights with family. The need underneath is belonging.",
    shadowLens: "This transit may surface: 'Was I safe as a child?' You don't have to answer — just notice what comes up.",
  },
  5: {
    whyThisMatters: "Today's Moon activates your 5th house — the part of you that wants to play, create, and be adored.",
    whatItsActivating: "Your inner child, your creativity, and your capacity for joy.",
    whatToDo: "Make something. Flirt. Dance in your kitchen. This energy wants expression, not perfection.",
    consciousPath: "Give yourself permission to be playful — art, music, romance, anything that has no 'productive' purpose.",
    unconsciousPath: "You might seek attention, take risks, or feel hurt if you're not appreciated. The child in you needs to be seen.",
    shadowLens: "This may stir: 'Am I allowed to have fun without earning it?' Joy is your birthright.",
  },
  6: {
    whyThisMatters: "Today's Moon moves through your 6th house — daily routines, health, and the small things that keep you grounded.",
    whatItsActivating: "Your desire to be useful, healthy, and organized.",
    whatToDo: "Good day for small improvements — meal prep, a gentle workout, organizing one thing. Small wins feel big today.",
    consciousPath: "Choose one healthy habit and do it with care, not pressure. Your body is asking for attention.",
    unconsciousPath: "You might become hypercritical of yourself or others, fixate on imperfections, or feel anxious about health.",
    shadowLens: "This may echo: 'Am I doing enough?' Enough is not a destination — it's a moving target. You're already there.",
  },
  7: {
    whyThisMatters: "Today's Moon lights up your 7th house — relationships, partnerships, and how you relate to others.",
    whatItsActivating: "Your need for connection, fairness, and being truly seen by another person.",
    whatToDo: "You're more attuned to relationship dynamics today. Notice what you need from others — and ask for it.",
    consciousPath: "Have an honest conversation. Listen deeply. Show up for someone — and let someone show up for you.",
    unconsciousPath: "You might project your needs onto a partner, compare relationships, or feel dependent. Notice without judgment.",
    shadowLens: "This transit may stir: 'Can I be loved as I am, without performing?' You can. And you deserve it.",
  },
  8: {
    whyThisMatters: "Today's Moon dives into your 8th house — the deep end. Intimacy, shared resources, and transformation.",
    whatItsActivating: "Your relationship with vulnerability, trust, and letting go of control.",
    whatToDo: "Heavy feelings may surface. Don't push them away. This is integration, not breakdown.",
    consciousPath: "Let yourself feel something fully. Cry if you need to. Journal about what you're holding onto.",
    unconsciousPath: "You might become suspicious, controlling, or obsessive. The fear underneath is loss.",
    shadowLens: "This may echo: 'What would happen if I let someone see the real me?' The answer might surprise you.",
  },
  9: {
    whyThisMatters: "Today's Moon activates your 9th house — meaning, belief, and the bigger picture.",
    whatItsActivating: "Your search for purpose, truth, and what actually matters to you.",
    whatToDo: "You might feel restless or philosophical. Good day for planning a trip, reading something inspiring, or questioning a belief.",
    consciousPath: "Expand your perspective. Learn something outside your comfort zone. Ask 'what do I actually believe?'",
    unconsciousPath: "You might preach, argue about beliefs, or feel like nowhere is home. The restlessness is growth.",
    shadowLens: "This may stir: 'Does my life have meaning?' It does. Even on the days it doesn't feel like it.",
  },
  10: {
    whyThisMatters: "Today's Moon is at the top of your chart — your 10th house of ambition, reputation, and public self.",
    whatItsActivating: "How you want to be known and whether your career aligns with your soul.",
    whatToDo: "You might feel more driven or more frustrated about your progress. Both are signals worth listening to.",
    consciousPath: "Take one step toward a goal that genuinely matters to you — not one imposed by others.",
    unconsciousPath: "You might overwork, compare yourself to peers, or feel like a fraud. The need is to be respected.",
    shadowLens: "This may echo: 'Will I ever be successful enough?' Success isn't a finish line. You're already building.",
  },
  11: {
    whyThisMatters: "Today's Moon moves through your 11th house — community, belonging, and your hopes for the future.",
    whatItsActivating: "Your desire to be part of something bigger and to feel like you belong.",
    whatToDo: "Connect with a group, online or off. Share an idea. This is a good day for collective energy.",
    consciousPath: "Reach out to your people. Share a dream. Support someone's vision. Community heals isolation.",
    unconsciousPath: "You might feel like an outsider, compare yourself to friends' achievements, or overshare seeking validation.",
    shadowLens: "This may stir: 'Do I fit in anywhere?' The people who get you are looking for you too.",
  },
  12: {
    whyThisMatters: "Today's Moon is in your 12th house — the quietest, most sacred part of your chart.",
    whatItsActivating: "Your inner world, subconscious patterns, and the need for spiritual rest.",
    whatToDo: "This is NOT a productivity day. Your psyche is processing. Sleep more, move slower, and stop forcing.",
    consciousPath: "Meditate, take a bath, listen to music that moves you. Let your subconscious speak through dreams and quiet.",
    unconsciousPath: "You might feel foggy, avoidant, or inexplicably sad. This isn't depression — it's depth.",
    shadowLens: "This transit whispers: 'What am I hiding from myself?' You don't have to find the answer today. Just leave the door open.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Insight Generation
// ─────────────────────────────────────────────────────────────────────────────

export class DynamicInsightGenerator {

  /**
   * Generate today's dynamic insight based on current transits
   */
  static generateDynamicInsight(chart: NatalChart): DynamicInsight {
    const sky = captureSkySnapshot(chart);
    const activation = HOUSE_ACTIVATIONS[sky.moonHouse] || HOUSE_ACTIVATIONS[1];

    return {
      whyThisMatters: activation.whyThisMatters,
      whatItsActivating: activation.whatItsActivating,
      whatToDoWithIt: activation.whatToDo,
      consciousPath: activation.consciousPath,
      unconsciousPath: activation.unconsciousPath,
      shadowLens: activation.shadowLens,
    };
  }

  /**
   * Generate "magic touch" moments — subtle personalization
   */
  static generateMagicTouches(
    chart: NatalChart,
    checkIns: DailyCheckIn[],
    chartCreatedAt?: string,
  ): MagicTouch[] {
    const touches: MagicTouch[] = [];
    const now = new Date();
    const sky = captureSkySnapshot(chart);

    // 1. Astrology anniversary
    if (chartCreatedAt) {
      const created = new Date(chartCreatedAt);
      const daysSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 365) {
        touches.push({
          type: 'anniversary',
          message: `You created your chart exactly one year ago today. Look how far you've come. ✨`,
          icon: '🎂',
          isActionable: false,
        });
      } else if (daysSince === 30) {
        touches.push({
          type: 'anniversary',
          message: `One month since you started your chart. The patterns are just beginning to unfold.`,
          icon: '🌱',
          isActionable: false,
        });
      } else if (daysSince === 100) {
        touches.push({
          type: 'anniversary',
          message: `100 days of self-understanding. Most people give up by day 7. You didn't.`,
          icon: '💫',
          isActionable: false,
        });
      }
    }

    // 2. Check-in streak
    if (checkIns.length > 0) {
      const streakDays = this.calculateStreak(checkIns);
      if (streakDays === 7) {
        touches.push({
          type: 'streak',
          message: `7-day check-in streak! Your pattern data is getting clearer.`,
          icon: '🔥',
          isActionable: false,
        });
      } else if (streakDays === 30) {
        touches.push({
          type: 'streak',
          message: `30-day streak. You've built a genuine practice of self-awareness. That's rare.`,
          icon: '🏆',
          isActionable: false,
        });
      }
    }

    // 3. Retrograde heads up
    if (sky.retrogrades.length > 0) {
      const planet = sky.retrogrades[0];
      const messages: Record<string, string> = {
        Mercury: `Mercury is retrograde. Communication may feel off — re-read before sending, give yourself grace with delays.`,
        Saturn: `Saturn is retrograde — inner restructuring is happening. Old obligations may feel heavier. This is temporary.`,
        Jupiter: `Jupiter is retrograde — growth turns inward. What you learn about yourself now matters more than external expansion.`,
      };
      if (messages[planet]) {
        touches.push({
          type: 'retrograde_heads_up',
          message: messages[planet],
          icon: '℞',
          isActionable: false,
        });
      }
    }

    // 4. Pattern callback — reference past data
    if (checkIns.length >= 7) {
      // Find if user reported the same mood house before
      const sameHouseHistory = checkIns.filter(c => c.moonHouse === sky.moonHouse);
      if (sameHouseHistory.length >= 3) {
        const avgMood = sameHouseHistory.reduce((s, c) => s + c.moodScore, 0) / sameHouseHistory.length;
        touches.push({
          type: 'pattern_callback',
          message: `The Moon is in the same house as ${sameHouseHistory.length} previous check-ins. Your average mood during these days: ${avgMood.toFixed(1)}/10.`,
          icon: '🔮',
          isActionable: true,
          action: '/(tabs)/energy',
        });
      }
    }

    // 5. Moon reminder based on their chart
    if (sky.moonSign === chart.moon?.sign?.name) {
      touches.push({
        type: 'moon_reminder',
        message: `The Moon is in ${sky.moonSign} today — your natal Moon sign. You may feel emotions more intensely and more authentically. Honor whatever comes up.`,
        icon: '🌙',
        isActionable: false,
      });
    }

    return touches;
  }

  /**
   * Generate a "pattern seed" for new users (before enough data)
   */
  static generatePatternSeed(chart: NatalChart): string {
    const sky = captureSkySnapshot(chart);
    const house = sky.moonHouse;
    const houseTheme = HOUSE_ACTIVATIONS[house]?.whatItsActivating || 'your emotional landscape';

    return `Today's pattern seed: notice how you feel as the Moon moves through your ${house}${this.ordinalSuffix(house)} house — ${houseTheme}. Check in tonight to start building your pattern.`;
  }

  // ── Helpers ──

  private static calculateStreak(checkIns: DailyCheckIn[]): number {
    if (checkIns.length === 0) return 0;
    const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (sorted.find(c => c.date === expectedStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private static ordinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
  }
}
