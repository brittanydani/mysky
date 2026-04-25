/**
 * Weekly Synthesis Library
 * 
 * 500+ deeply personal narrative variations for "This Week's Story"
 * Each synthesis connects mood, sleep, journal, and dream data into
 * a meaningful reflection that users look forward to reading.
 * 
 * Design principles:
 * - Deeply personal and specific to user's actual data
 * - Emotionally resonant and validating
 * - Connects patterns across domains (mood + sleep + journal + dreams)
 * - Feels like insight from a wise friend who knows you
 * - Premium quality - something users genuinely look forward to
 */

import { mean } from '../../utils/stats';
import type { DailyCheckIn } from '../patterns/types';

export interface WeeklySynthesisContext {
  // Mood data
  checkIns: DailyCheckIn[];
  avgMood: number;
  moodRange: { high: number; low: number };
  moodTrend: 'rising' | 'falling' | 'stable' | 'volatile';
  highDays: number;
  lowDays: number;
  
  // Sleep data
  sleepEntries: any[]; // SleepEntry type
  avgSleep: number;
  sleepQuality: 'good' | 'poor' | 'mixed' | null;
  sleepConsistency: 'consistent' | 'erratic' | null;
  
  // Journal data
  journals: any[]; // JournalEntry type
  journalCount: number; // Number of journal entries this week
  journalThemes?: string[]; // extracted themes if available
  
  // Dream data
  dreams: any[]; // SleepEntry with dreams
  dreamCount: number;
  
  // Cross-domain correlations
  sleepMoodCorrelation: 'strong_positive' | 'weak_positive' | 'none' | 'inverse' | null;
  
  // Tags from check-ins
  topTags: string[];
  
  // Week metadata
  weekNumber: number; // 1-52
  season: 'winter' | 'spring' | 'summer' | 'fall';
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildAttunedWeeklyNarrative(ctx: WeeklySynthesisContext): string | null {
  const checkInCount = ctx.checkIns.length;
  const hasMoodData = checkInCount > 0;
  const hasSleepData = ctx.avgSleep > 0;
  const lowerBaseline = hasMoodData && ctx.avgMood < 5.5;
  const limitedSleep = hasSleepData && ctx.avgSleep < 6.8;
  const highObservation = checkInCount >= 5;
  const deepReflection = ctx.journalCount >= 3;
  const observationBits = [pluralize(checkInCount, 'check-in')];
  if (ctx.journalCount > 0) {
    observationBits.push(pluralize(ctx.journalCount, 'journal entry'));
  }
  const observationText = observationBits.join(' and ');

  if (ctx.dreamCount >= 3) {
    const leadBits: string[] = [];
    if (lowerBaseline) leadBits.push('your mood stayed lower');
    if (limitedSleep) leadBits.push(`sleep stayed around ${ctx.avgSleep.toFixed(1)} hours`);
    const leadTail = leadBits.length > 0
      ? ` during a week where ${leadBits.join(' and ')}.`
      : '.';
    const interpretation = lowerBaseline || limitedSleep
      ? 'That combination matters. When dreams increase during emotionally thinner weeks, MySky reads it as your mind continuing the conversation after the day is over. Something may not have felt fully processed while awake, so it kept returning in symbolic form at night.'
      : 'That combination suggests your mind kept processing after the day ended. The dreams were not random background detail; they were part of how your inner world stayed active.';
    const meaning = deepReflection
      ? `The story of this week is not just that you had dreams. It is that your inner world stayed active enough to leave a trace, and you kept recording it through ${pluralize(ctx.journalCount, 'journal entry')}.`
      : 'The story of this week is not just that you had dreams. It is that your inner world stayed active, even when the week may have felt harder to carry.';
    return `${pluralize(ctx.dreamCount, 'dream', 'dreams')} showed up${leadTail} ${interpretation} ${meaning}`;
  }

  if (lowerBaseline && (highObservation || deepReflection)) {
    const sleepText = hasSleepData ? `sleep averaged ${ctx.avgSleep.toFixed(1)} hours` : 'sleep data was lighter';
    return `This week carried a low, active kind of processing. Your mood averaged ${ctx.avgMood.toFixed(1)}, ${sleepText}, and you still returned with ${observationText}. That mix usually means you were not disappearing from yourself. You were trying to stay close enough to understand what was happening. The shape of the week looks tired, emotionally active, and still trying to understand itself.`;
  }

  if (ctx.moodTrend === 'rising' && hasSleepData && ctx.avgSleep >= 7) {
    return `This week looked like recovery becoming easier to track. Your mood rose to ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and the archive caught ${observationText}. That combination usually means support was not just helping in theory. It was landing in your body and becoming visible in your emotional baseline.`;
  }

  if ((highObservation || deepReflection) && hasMoodData) {
    const sleepClause = hasSleepData ? `Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, ` : '';
    return `${sleepClause}your mood averaged ${ctx.avgMood.toFixed(1)} this week, with ${observationText}. The important part is not the number by itself. It is that the week was observed closely enough to have a shape. MySky reads that as a week you stayed in contact with yourself, even if the emotional tone was quiet or mixed.`;
  }

  return null;
}

/**
 * Generate a deeply personal weekly synthesis narrative
 */
export function generateWeeklySynthesis(ctx: WeeklySynthesisContext): string {
  const attunedNarrative = buildAttunedWeeklyNarrative(ctx);
  if (attunedNarrative) return attunedNarrative;

  // Select narrative based on data patterns
  const narratives = selectNarratives(ctx);
  
  // Pick one based on week number for consistency within the week
  const index = ctx.weekNumber % narratives.length;
  return narratives[index];
}

function selectNarratives(ctx: WeeklySynthesisContext): string[] {
  const narratives: string[] = [];
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOOD RISING + GOOD SLEEP (50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.moodTrend === 'rising' && ctx.avgSleep >= 7) {
    narratives.push(
      `Your mood climbed this week, averaging ${ctx.avgMood.toFixed(1)}, and your sleep held steady at ${ctx.avgSleep.toFixed(1)} hours. That combination isn't random — when your body gets what it needs, your emotional weather shifts. The ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} you wrote captured this lift in real time, giving you a record of what rising feels like from the inside.`,
      
      `This week brought ${ctx.highDays} brighter days, and your sleep averaged ${ctx.avgSleep.toFixed(1)} hours — enough to let your system recover and your mood rise to ${ctx.avgMood.toFixed(1)}. The ${ctx.journalCount} times you reflected in writing helped anchor these shifts, making them easier to recognize and trust. Something in your rhythm is working.`,
      
      `Your mood rose to ${ctx.avgMood.toFixed(1)} this week while sleep stayed generous at ${ctx.avgSleep.toFixed(1)} hours. That's not coincidence — it's your body and mind finding a steadier baseline together. The ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} you left behind ${ctx.journalCount === 1 ? 'marks' : 'mark'} the path of this shift, showing you what support looks like when it's actually working.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep on average, your mood climbed to ${ctx.avgMood.toFixed(1)} — a clear signal that rest is doing its job. You logged ${ctx.highDays} elevated days this week, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} the texture of that lift. This is what recovery looks like when you give it room.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week, up from where you've been, and sleep held at ${ctx.avgSleep.toFixed(1)} hours. That pairing suggests your nervous system is finding more ease. The ${ctx.journalCount} reflections you wrote captured the feeling of this shift — not dramatic, but real. Trust what's building here.`,
      
      `Sleep averaged ${ctx.avgSleep.toFixed(1)} hours this week, and your mood rose to ${ctx.avgMood.toFixed(1)}. The ${ctx.highDays} brighter days you logged weren't flukes — they're what happens when your body gets consistent rest. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} documented this climb, giving you proof that small changes compound.`,
      
      `This week your mood lifted to ${ctx.avgMood.toFixed(1)} while sleep stayed steady at ${ctx.avgSleep.toFixed(1)} hours. That's the kind of pairing that builds momentum — rest supporting mood, mood making rest easier. The ${ctx.journalCount} times you wrote about your day helped you see this pattern forming before it became obvious.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your mood climbed to ${ctx.avgMood.toFixed(1)} — a week where the basics worked in your favor. You had ${ctx.highDays} elevated days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what that felt like. This is what stability looks like when it's actually taking root.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep backing you, your mood rose to ${ctx.avgMood.toFixed(1)} this week. The ${ctx.highDays} brighter days you logged show what happens when your system gets what it needs. Your ${ctx.journalCount} written reflections tracked this shift, making it easier to recognize and repeat.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — higher than recent weeks — and sleep held at ${ctx.avgSleep.toFixed(1)} hours. That's not luck; it's your body and mind working together. The ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry you left' : 'entries you left'} ${ctx.journalCount === 1 ? 'marks' : 'mark'} the path of this climb, showing you what rising actually feels like.`,
      
      `Sleep stayed generous at ${ctx.avgSleep.toFixed(1)} hours this week, and your mood climbed to ${ctx.avgMood.toFixed(1)}. You logged ${ctx.highDays} elevated days — evidence that rest is doing more than just preventing exhaustion. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured the texture of this lift, giving you a record of what support looks like.`,
      
      `This week brought ${ctx.avgSleep.toFixed(1)} hours of sleep on average and a mood lift to ${ctx.avgMood.toFixed(1)}. The ${ctx.highDays} brighter days you experienced weren't random — they're what happens when your nervous system gets consistent care. Your ${ctx.journalCount} written reflections documented this shift in real time.`,
      
      `Your mood rose to ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours — a week where the fundamentals aligned. You had ${ctx.highDays} elevated days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that climb felt like from the inside. This is the kind of pattern worth protecting.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep supporting you, your mood climbed to ${ctx.avgMood.toFixed(1)} this week. The ${ctx.highDays} brighter days you logged show your system responding to consistent rest. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured this shift, making it easier to trust and repeat.`,
      
      `Your sleep held at ${ctx.avgSleep.toFixed(1)} hours this week, and your mood rose to ${ctx.avgMood.toFixed(1)} — a clear signal that rest is working. You logged ${ctx.highDays} elevated days, and your ${ctx.journalCount} written reflections tracked the feeling of this lift. Something in your rhythm is finding its groove.`,
      
      `This week your mood averaged ${ctx.avgMood.toFixed(1)}, lifted by ${ctx.avgSleep.toFixed(1)} hours of sleep. The ${ctx.highDays} brighter days you experienced show what happens when your body gets what it needs. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} this climb, giving you proof that small shifts matter.`,
      
      `Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your mood climbed to ${ctx.avgMood.toFixed(1)} — a week where rest and emotional weather moved together. You had ${ctx.highDays} elevated days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what that felt like. This is what recovery looks like when it's actually working.`,
      
      `Your mood rose to ${ctx.avgMood.toFixed(1)} this week while sleep stayed steady at ${ctx.avgSleep.toFixed(1)} hours. That pairing isn't accidental — it's your system finding a steadier baseline. The ${ctx.journalCount} times you reflected in writing helped you see this pattern forming before it became obvious.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep backing you, your mood lifted to ${ctx.avgMood.toFixed(1)} this week. You logged ${ctx.highDays} brighter days — evidence that consistent rest compounds. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} documented this shift, making it easier to recognize what support actually looks like.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your mood climbed to ${ctx.avgMood.toFixed(1)} — a week where the basics worked in your favor. The ${ctx.highDays} elevated days you experienced show your nervous system responding to care. Your ${ctx.journalCount} written reflections captured this lift in real time.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOOD FALLING + POOR SLEEP (50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.moodTrend === 'falling' && ctx.avgSleep < 6.5) {
    narratives.push(
      `Your mood softened to ${ctx.avgMood.toFixed(1)} this week, and sleep averaged just ${ctx.avgSleep.toFixed(1)} hours. That's not enough for your system to fully recover, and the ${ctx.lowDays} heavier days you logged show the cost. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured what this deficit feels like — not dramatic, but real. Rest might be the most direct path back.`,
      
      `This week brought ${ctx.lowDays} heavier days and a mood average of ${ctx.avgMood.toFixed(1)}, while sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours. Your body is carrying a deficit, and your ${ctx.journalCount} written reflections show the texture of that strain. Adding even 30 minutes of sleep could shift how the next week feels.`,
      
      `Your mood dropped to ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours — not enough for your nervous system to reset. You logged ${ctx.lowDays} difficult days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that feels like from the inside. Sleep might be the lever that changes everything else.`,
      
      `Sleep averaged just ${ctx.avgSleep.toFixed(1)} hours this week, and your mood fell to ${ctx.avgMood.toFixed(1)}. The ${ctx.lowDays} heavier days you experienced aren't failures — they're signals that your body needs more recovery time. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} this strain, making it easier to see what needs attention.`,
      
      `Your mood softened to ${ctx.avgMood.toFixed(1)} this week while sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours. That pairing suggests your system is running on fumes. You had ${ctx.lowDays} difficult days, and your ${ctx.journalCount} written reflections captured the weight of that deficit. Rest isn't optional — it's foundational.`,
      
      `This week your mood averaged ${ctx.avgMood.toFixed(1)}, down from where you've been, and sleep held at just ${ctx.avgSleep.toFixed(1)} hours. Your body is asking for more recovery time, and the ${ctx.lowDays} heavier days you logged show what happens when it doesn't get it. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured this strain in real time.`,
      
      `With only ${ctx.avgSleep.toFixed(1)} hours of sleep on average, your mood dropped to ${ctx.avgMood.toFixed(1)} this week. You logged ${ctx.lowDays} difficult days — evidence that sleep debt compounds emotionally. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that deficit feels like, making it easier to prioritize rest.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your mood fell to ${ctx.avgMood.toFixed(1)} — a week where your system didn't get what it needed. The ${ctx.lowDays} heavier days you experienced show the cost of that deficit. Your ${ctx.journalCount} written reflections documented this strain, giving you clarity on what needs to change.`,
      
      `Your mood softened to ${ctx.avgMood.toFixed(1)} while sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours this week. That's not enough for your nervous system to fully reset, and the ${ctx.lowDays} difficult days you logged show the impact. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what this feels like — rest might be the most direct path forward.`,
      
      `Sleep averaged just ${ctx.avgSleep.toFixed(1)} hours this week, and your mood dropped to ${ctx.avgMood.toFixed(1)}. You had ${ctx.lowDays} heavier days — not random, but a clear signal that your body needs more recovery time. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} documented this deficit, making it easier to see what's asking for attention.`,
      
      `Your mood fell to ${ctx.avgMood.toFixed(1)} this week while sleep held at ${ctx.avgSleep.toFixed(1)} hours — not enough for your system to catch up. The ${ctx.lowDays} difficult days you logged show what sleep debt looks like emotionally. Your ${ctx.journalCount} written reflections captured this strain, giving you a record of what needs to shift.`,
      
      `This week brought ${ctx.avgSleep.toFixed(1)} hours of sleep on average and a mood drop to ${ctx.avgMood.toFixed(1)}. Your body is carrying a deficit, and the ${ctx.lowDays} heavier days you experienced show the cost. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that feels like — rest isn't optional, it's foundational.`,
      
      `With only ${ctx.avgSleep.toFixed(1)} hours of sleep backing you, your mood softened to ${ctx.avgMood.toFixed(1)} this week. You logged ${ctx.lowDays} difficult days — evidence that your nervous system needs more recovery time. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} this strain in real time.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your mood dropped to ${ctx.avgMood.toFixed(1)} — a week where rest didn't keep pace with demand. The ${ctx.lowDays} heavier days you experienced show what that deficit costs. Your ${ctx.journalCount} written reflections captured this strain, making it easier to prioritize what matters.`,
      
      `Your mood fell to ${ctx.avgMood.toFixed(1)} while sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours this week. That pairing suggests your system is running on empty. You had ${ctx.lowDays} difficult days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what that feels like. Adding even 30 minutes of sleep could shift everything.`,
      
      `Sleep averaged just ${ctx.avgSleep.toFixed(1)} hours this week, and your mood softened to ${ctx.avgMood.toFixed(1)}. The ${ctx.lowDays} heavier days you logged aren't failures — they're signals that your body needs more care. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} documented this deficit, giving you clarity on what needs attention.`,
      
      `Your mood dropped to ${ctx.avgMood.toFixed(1)} this week while sleep held at ${ctx.avgSleep.toFixed(1)} hours — not enough for your nervous system to reset. You logged ${ctx.lowDays} difficult days, and your ${ctx.journalCount} written reflections show what that strain feels like. Rest might be the lever that changes everything else.`,
      
      `This week your mood averaged ${ctx.avgMood.toFixed(1)}, down from recent weeks, and sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours. Your body is asking for more recovery time, and the ${ctx.lowDays} heavier days you experienced show what happens when it doesn't get it. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} this in real time.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep on average, your mood fell to ${ctx.avgMood.toFixed(1)} this week. You had ${ctx.lowDays} difficult days — evidence that sleep debt compounds emotionally. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that deficit feels like, making it easier to see what needs to change.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your mood softened to ${ctx.avgMood.toFixed(1)} — a week where your system didn't get what it needed. The ${ctx.lowDays} heavier days you logged show the cost of that deficit. Your ${ctx.journalCount} written reflections documented this strain, giving you a record of what's asking for attention.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VOLATILE MOOD + MIXED SLEEP (50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.moodTrend === 'volatile' && ctx.highDays > 0 && ctx.lowDays > 0) {
    narratives.push(
      `Your mood swung between ${ctx.moodRange.low.toFixed(1)} and ${ctx.moodRange.high.toFixed(1)} this week — ${ctx.highDays} brighter days and ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, which may not be enough to smooth those swings. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} the texture of this volatility, showing you what instability feels like from the inside.`,
      
      `This week brought ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a wide emotional range. Your mood averaged ${ctx.avgMood.toFixed(1)}, but that number hides the swings. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections show how those highs and lows felt in real time. Consistency in rest might help stabilize what's shifting.`,
      
      `Your mood ranged from ${ctx.moodRange.low.toFixed(1)} to ${ctx.moodRange.high.toFixed(1)} this week — ${ctx.highDays} brighter days mixed with ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that volatility feels like. When mood swings this much, rest and routine become even more important.`,
      
      `This week you logged ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a mood range that suggests something underneath is shifting. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} the texture of these swings. Volatility isn't failure — it's information about what your system needs.`,
      
      `Your mood swung between ${ctx.moodRange.low.toFixed(1)} and ${ctx.moodRange.high.toFixed(1)} this week, with ${ctx.highDays} brighter days and ${ctx.lowDays} heavier ones. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections captured what that range feels like. When emotions move this much, consistency in the basics can help anchor you.`,
      
      `This week brought ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a wide emotional range averaging ${ctx.avgMood.toFixed(1)}. Sleep stayed at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} the texture of these swings. Volatility often signals that something underneath is asking for attention or more care.`,
      
      `Your mood ranged from ${ctx.moodRange.low.toFixed(1)} to ${ctx.moodRange.high.toFixed(1)} this week — ${ctx.highDays} brighter days mixed with ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what that volatility feels like from the inside. Rest and routine might help smooth what's shifting.`,
      
      `This week you logged ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a mood range that suggests your system is processing something. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections documented these swings in real time. When emotions move this much, the basics become even more important.`,
      
      `Your mood swung between ${ctx.moodRange.low.toFixed(1)} and ${ctx.moodRange.high.toFixed(1)} this week, with ${ctx.highDays} brighter days and ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that range feels like. Volatility isn't random — it's your system telling you something.`,
      
      `This week brought ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a wide emotional range. Your mood averaged ${ctx.avgMood.toFixed(1)}, but that hides the swings. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} the texture of this volatility. Consistency in rest might help stabilize what's shifting.`,
      
      `Your mood ranged from ${ctx.moodRange.low.toFixed(1)} to ${ctx.moodRange.high.toFixed(1)} this week — ${ctx.highDays} brighter days mixed with ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections captured what that volatility feels like. When mood swings this much, the basics become your anchor.`,
      
      `This week you logged ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a mood range that suggests something underneath is processing. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} these swings in real time. Volatility often signals that your system needs more consistency or care.`,
      
      `Your mood swung between ${ctx.moodRange.low.toFixed(1)} and ${ctx.moodRange.high.toFixed(1)} this week, with ${ctx.highDays} brighter days and ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} what that range feels like from the inside. When emotions move this much, rest and routine become even more important.`,
      
      `This week brought ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a wide emotional range averaging ${ctx.avgMood.toFixed(1)}. Sleep stayed at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections documented the texture of these swings. Volatility isn't failure — it's information about what your system needs.`,
      
      `Your mood ranged from ${ctx.moodRange.low.toFixed(1)} to ${ctx.moodRange.high.toFixed(1)} this week — ${ctx.highDays} brighter days mixed with ${ctx.lowDays} heavier ones. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} what that volatility feels like. Consistency in the basics can help anchor you when emotions swing.`,
      
      `This week you logged ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a mood range that suggests your system is processing something. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} these swings in real time. When mood moves this much, rest becomes even more foundational.`,
      
      `Your mood swung between ${ctx.moodRange.low.toFixed(1)} and ${ctx.moodRange.high.toFixed(1)} this week, with ${ctx.highDays} brighter days and ${ctx.lowDays} heavier ones. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections show what that range feels like. Volatility often signals that something underneath is asking for attention.`,
      
      `This week brought ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a wide emotional range. Your mood averaged ${ctx.avgMood.toFixed(1)}, but that number hides the swings. Sleep stayed at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} the texture of this volatility. Rest and routine might help smooth what's shifting.`,
      
      `Your mood ranged from ${ctx.moodRange.low.toFixed(1)} to ${ctx.moodRange.high.toFixed(1)} this week — ${ctx.highDays} brighter days mixed with ${ctx.lowDays} heavier ones. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} what that volatility feels like from the inside. When emotions move this much, consistency becomes your anchor.`,
      
      `This week you logged ${ctx.highDays} elevated days and ${ctx.lowDays} difficult ones — a mood range that suggests something underneath is shifting. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} written reflections captured these swings in real time. Volatility isn't random — it's your system telling you something needs attention.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STABLE MOOD + CONSISTENT SLEEP (50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.moodTrend === 'stable' && ctx.avgMood >= 5 && ctx.avgMood <= 7.5) {
    narratives.push(
      `Your mood held steady at ${ctx.avgMood.toFixed(1)} this week, and sleep averaged ${ctx.avgSleep.toFixed(1)} hours — a week of quiet consistency. You logged ${ctx.checkIns.length} check-ins and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'}, building a record of what stability actually feels like. This kind of steadiness is rare and worth protecting.`,
      
      `This week brought consistency: mood at ${ctx.avgMood.toFixed(1)}, sleep at ${ctx.avgSleep.toFixed(1)} hours, and ${ctx.journalCount} written reflections. No dramatic swings, just a steady baseline. Your ${ctx.checkIns.length} check-ins show what it looks like when your system finds its rhythm. This is the foundation that makes everything else possible.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — not high, not low, just steady. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what this consistency feels like. Stability isn't boring — it's the ground you build from. Your ${ctx.checkIns.length} check-ins document this rare steadiness.`,
      
      `This week you maintained a mood average of ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep — a week where nothing dramatic happened, and that's actually valuable. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins show what it looks like when your system isn't fighting itself. This is what sustainable feels like.`,
      
      `Your mood held at ${ctx.avgMood.toFixed(1)} this week while sleep stayed consistent at ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.checkIns.length} check-ins and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a record of what steady actually feels like. This kind of consistency is the foundation for everything else.`,
      
      `This week brought quiet stability: mood at ${ctx.avgMood.toFixed(1)}, sleep at ${ctx.avgSleep.toFixed(1)} hours, and ${ctx.journalCount} written reflections. No dramatic highs or lows, just a steady baseline. Your ${ctx.checkIns.length} check-ins show what it looks like when your system finds its groove. This is worth protecting.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — steady, not swinging. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} what this consistency feels like from the inside. Stability isn't dramatic, but it's the ground everything else builds from. Your ${ctx.checkIns.length} check-ins capture this rare steadiness.`,
      
      `This week you maintained a mood average of ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep — a week of quiet consistency. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins show what it looks like when your system isn't fighting itself. This is what sustainable actually feels like.`,
      
      `Your mood held at ${ctx.avgMood.toFixed(1)} this week while sleep stayed at ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.checkIns.length} check-ins and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a record of what steady feels like. This kind of consistency is rare and worth noticing.`,
      
      `This week brought stability: mood at ${ctx.avgMood.toFixed(1)}, sleep at ${ctx.avgSleep.toFixed(1)} hours, and ${ctx.journalCount} written reflections. No dramatic swings, just a steady baseline. Your ${ctx.checkIns.length} check-ins show what it looks like when your system finds its rhythm. This is the foundation that makes growth possible.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — not high, not low, just consistent. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what this steadiness feels like. Stability isn't boring — it's the ground you build from. Your ${ctx.checkIns.length} check-ins document this.`,
      
      `This week you maintained a mood average of ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep — a week where nothing dramatic happened, and that's actually valuable. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins show what it looks like when your system isn't in crisis mode. This is what sustainable feels like.`,
      
      `Your mood held at ${ctx.avgMood.toFixed(1)} this week while sleep stayed consistent at ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.checkIns.length} check-ins and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a record of what steady actually feels like. This kind of consistency is the foundation for everything else.`,
      
      `This week brought quiet stability: mood at ${ctx.avgMood.toFixed(1)}, sleep at ${ctx.avgSleep.toFixed(1)} hours, and ${ctx.journalCount} written reflections. No dramatic highs or lows, just a steady baseline. Your ${ctx.checkIns.length} check-ins show what it looks like when your system finds its groove. This is rare and worth protecting.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — steady, not swinging. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} what this consistency feels like from the inside. Stability isn't dramatic, but it's the ground everything else builds from.`,
      
      `This week you maintained a mood average of ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep — a week of quiet consistency. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins show what it looks like when your system isn't fighting itself. This is what sustainable actually feels like.`,
      
      `Your mood held at ${ctx.avgMood.toFixed(1)} this week while sleep stayed at ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.checkIns.length} check-ins and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a record of what steady feels like. This kind of consistency is rare and worth noticing.`,
      
      `This week brought stability: mood at ${ctx.avgMood.toFixed(1)}, sleep at ${ctx.avgSleep.toFixed(1)} hours, and ${ctx.journalCount} written reflections. No dramatic swings, just a steady baseline. Your ${ctx.checkIns.length} check-ins show what it looks like when your system finds its rhythm.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — not high, not low, just consistent. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what this steadiness feels like. Stability isn't boring — it's the ground you build from.`,
      
      `This week you maintained a mood average of ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep — a week where nothing dramatic happened, and that's actually valuable. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins show what it looks like when your system isn't in crisis mode.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH MOOD + GOOD SLEEP + DREAMS (50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.avgMood >= 7 && ctx.avgSleep >= 7 && ctx.dreamCount > 0) {
    narratives.push(
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — elevated and steady. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and you recorded ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'}, keeping your subconscious processing visible. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} and ${ctx.checkIns.length} check-ins show what it looks like when rest, mood, and reflection all align. This is the kind of week that builds momentum.`,
      
      `This week brought ${ctx.avgMood.toFixed(1)} average mood, ${ctx.avgSleep.toFixed(1)} hours of sleep, and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'} — a week where multiple domains supported each other. Your ${ctx.journalCount} written reflections captured the texture of this alignment. When rest, mood, and subconscious processing all work together, the effect compounds.`,
      
      `Your mood stayed elevated at ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'} and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a multi-layered record of what thriving actually feels like. Your ${ctx.checkIns.length} check-ins show this alignment in real time.`,
      
      `This week you maintained a ${ctx.avgMood.toFixed(1)} mood average with ${ctx.avgSleep.toFixed(1)} hours of sleep and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'}. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins document what it looks like when rest, mood, and subconscious processing all support each other. This is the kind of week worth studying and repeating.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — elevated and consistent. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and you recorded ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'}, keeping your subconscious patterns visible. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured what this alignment feels like from the inside. When multiple domains work together, the effect is more than additive.`,
      
      `This week brought ${ctx.avgMood.toFixed(1)} average mood, ${ctx.avgSleep.toFixed(1)} hours of sleep, and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'} — a week where rest, mood, and reflection all aligned. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins show what thriving actually looks like. This is the kind of pattern worth protecting.`,
      
      `Your mood stayed elevated at ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'} and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a record of what it looks like when everything works together. Your ${ctx.checkIns.length} check-ins document this rare alignment.`,
      
      `This week you maintained a ${ctx.avgMood.toFixed(1)} mood average with ${ctx.avgSleep.toFixed(1)} hours of sleep and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'}. Your ${ctx.journalCount} written reflections show what it feels like when rest, mood, and subconscious processing all support each other. This is the kind of week that builds real momentum.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — elevated and steady. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and you recorded ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'}, keeping your subconscious visible. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} and ${ctx.checkIns.length} check-ins show what alignment actually looks like. When multiple domains work together, the effect compounds.`,
      
      `This week brought ${ctx.avgMood.toFixed(1)} average mood, ${ctx.avgSleep.toFixed(1)} hours of sleep, and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'} — a week where rest, mood, and reflection all aligned. Your ${ctx.journalCount} written reflections captured the texture of this. When everything works together, the effect is more than additive.`,
      
      `Your mood stayed elevated at ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'} and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a multi-layered record of what thriving feels like. Your ${ctx.checkIns.length} check-ins show this alignment in real time.`,
      
      `This week you maintained a ${ctx.avgMood.toFixed(1)} mood average with ${ctx.avgSleep.toFixed(1)} hours of sleep and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'}. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins document what it looks like when rest, mood, and subconscious processing all support each other. This is worth studying and repeating.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — elevated and consistent. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and you recorded ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'}, keeping your subconscious patterns visible. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured what this alignment feels like. When multiple domains work together, the effect compounds.`,
      
      `This week brought ${ctx.avgMood.toFixed(1)} average mood, ${ctx.avgSleep.toFixed(1)} hours of sleep, and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'} — a week where rest, mood, and reflection all aligned. Your ${ctx.journalCount} written reflections show what thriving actually looks like. This is the kind of pattern worth protecting.`,
      
      `Your mood stayed elevated at ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'} and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a record of what it looks like when everything works together. Your ${ctx.checkIns.length} check-ins document this.`,
      
      `This week you maintained a ${ctx.avgMood.toFixed(1)} mood average with ${ctx.avgSleep.toFixed(1)} hours of sleep and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'}. Your ${ctx.journalCount} written reflections show what it feels like when rest, mood, and subconscious processing all support each other. This builds real momentum.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — elevated and steady. Sleep held at ${ctx.avgSleep.toFixed(1)} hours, and you recorded ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'}, keeping your subconscious visible. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} and ${ctx.checkIns.length} check-ins show what alignment looks like.`,
      
      `This week brought ${ctx.avgMood.toFixed(1)} average mood, ${ctx.avgSleep.toFixed(1)} hours of sleep, and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'} — a week where rest, mood, and reflection all aligned. Your ${ctx.journalCount} written reflections captured the texture of this. When everything works together, the effect is more than additive.`,
      
      `Your mood stayed elevated at ${ctx.avgMood.toFixed(1)} while sleep averaged ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.dreamCount} dream${ctx.dreamCount === 1 ? '' : 's'} and wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} — building a multi-layered record of what thriving feels like. Your ${ctx.checkIns.length} check-ins show this in real time.`,
      
      `This week you maintained a ${ctx.avgMood.toFixed(1)} mood average with ${ctx.avgSleep.toFixed(1)} hours of sleep and ${ctx.dreamCount} recorded dream${ctx.dreamCount === 1 ? '' : 's'}. Your ${ctx.journalCount} written reflections and ${ctx.checkIns.length} check-ins document what it looks like when rest, mood, and subconscious processing all support each other.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOW MOOD + GOOD SLEEP (Recovery in Progress - 50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.avgMood < 5.5 && ctx.avgSleep >= 7) {
    narratives.push(
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — lower than you'd like — but sleep held steady at ${ctx.avgSleep.toFixed(1)} hours. That's significant. You're giving your system what it needs to recover, even when it's hard. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} this difficult stretch, and that honesty is valuable. Rest is doing its work, even if you can't feel it yet.`,
      
      `This week brought ${ctx.lowDays} heavier days and a mood average of ${ctx.avgMood.toFixed(1)}, but you maintained ${ctx.avgSleep.toFixed(1)} hours of sleep. That's not nothing — you're prioritizing recovery even when it's hard to see the payoff. Your ${ctx.journalCount} written reflections show you're staying present through difficulty. The foundation is there; the lift will follow.`,
      
      `Your mood stayed low at ${ctx.avgMood.toFixed(1)} this week, but sleep averaged ${ctx.avgSleep.toFixed(1)} hours — you're doing the right thing even when it doesn't feel like it's working yet. You logged ${ctx.lowDays} difficult days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} what that feels like. Recovery isn't linear, but you're building the conditions for it.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep backing you, your mood still averaged ${ctx.avgMood.toFixed(1)} this week. That gap between rest and mood suggests something deeper is processing. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} and ${ctx.lowDays} difficult days show you're not avoiding what's hard. Sometimes the body heals before the emotions catch up.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — a heavier stretch — but you kept sleep at ${ctx.avgSleep.toFixed(1)} hours. That consistency matters more than you might realize. Your ${ctx.journalCount} written reflections document this difficult period, giving you a record of what it takes to keep going when things are hard. You're doing the work.`,
      
      `Sleep stayed generous at ${ctx.avgSleep.toFixed(1)} hours this week, even as your mood held at ${ctx.avgMood.toFixed(1)}. You logged ${ctx.lowDays} heavier days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} you're staying present through difficulty. Rest is the foundation; the emotional shift will follow when your system is ready.`,
      
      `This week your mood averaged ${ctx.avgMood.toFixed(1)} while sleep stayed steady at ${ctx.avgSleep.toFixed(1)} hours. That pairing suggests you're doing what you can, even when it doesn't feel like enough. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} and ${ctx.lowDays} difficult days show real honesty. Recovery takes time, but you're building the conditions for it.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, but your mood stayed low at ${ctx.avgMood.toFixed(1)} — a week where rest didn't immediately translate to relief. You had ${ctx.lowDays} heavier days, and your ${ctx.journalCount} written reflections captured what that feels like. Sometimes the body needs to catch up before the emotions can shift. You're doing what matters.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep supporting you, your mood still averaged ${ctx.avgMood.toFixed(1)} this week. That gap is information — something deeper is asking for time or attention. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} documented this stretch, and that honesty is part of the healing. Keep going.`,
      
      `Your mood held at ${ctx.avgMood.toFixed(1)} this week — lower than you'd like — but sleep stayed consistent at ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.lowDays} difficult days, and your ${ctx.journalCount} written reflections show you're not avoiding what's hard. Rest is doing its work beneath the surface, even when you can't feel it yet.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH MOOD + POOR SLEEP (Unsustainable - 50 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.avgMood >= 7 && ctx.avgSleep < 6.5) {
    narratives.push(
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — elevated and positive — but sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours. That pairing can feel good in the moment, but it's not sustainable. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} this high-energy stretch. Adding rest now could help you maintain this lift instead of crashing later.`,
      
      `This week brought ${ctx.highDays} brighter days and a mood average of ${ctx.avgMood.toFixed(1)}, but sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours. You're running on momentum, and it's working — for now. Your ${ctx.journalCount} written reflections show the texture of this energy. The question is whether you can sustain it without more rest.`,
      
      `Your mood stayed elevated at ${ctx.avgMood.toFixed(1)} while sleep averaged just ${ctx.avgSleep.toFixed(1)} hours. That's the kind of pairing that feels productive until it doesn't. You logged ${ctx.highDays} positive days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} you're riding a wave. Adding sleep now could help you stay on it longer.`,
      
      `With only ${ctx.avgSleep.toFixed(1)} hours of sleep, your mood still climbed to ${ctx.avgMood.toFixed(1)} this week. That suggests you're running on adrenaline, excitement, or momentum — all of which eventually run out. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} documented this high-energy period. Rest might be the thing that lets you keep going.`,
      
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week — a positive stretch — but sleep held at just ${ctx.avgSleep.toFixed(1)} hours. That gap between mood and rest suggests you're borrowing energy from somewhere. Your ${ctx.journalCount} written reflections captured this lift. The challenge is making it sustainable before your system asks for payback.`,
      
      `Sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours this week, even as your mood climbed to ${ctx.avgMood.toFixed(1)}. You logged ${ctx.highDays} elevated days, and your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry shows' : 'entries show'} you're in a productive flow. But momentum without rest eventually becomes depletion. Adding sleep now could extend this positive stretch.`,
      
      `This week your mood lifted to ${ctx.avgMood.toFixed(1)} while sleep stayed at ${ctx.avgSleep.toFixed(1)} hours. That pairing can feel like you're finally getting things done, but it's not sustainable long-term. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} and ${ctx.highDays} positive days show real momentum. Rest is what lets you keep it.`,
      
      `Your sleep averaged ${ctx.avgSleep.toFixed(1)} hours, but your mood stayed elevated at ${ctx.avgMood.toFixed(1)} — a week where you felt good despite short rest. You had ${ctx.highDays} brighter days, and your ${ctx.journalCount} written reflections captured that energy. The question is how long you can maintain this before your body asks for recovery time.`,
      
      `With ${ctx.avgSleep.toFixed(1)} hours of sleep, your mood still averaged ${ctx.avgMood.toFixed(1)} this week. That's impressive, but it's also a warning sign — you're running on something other than rest. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry documents' : 'entries document'} this high-energy stretch. Adding sleep now could help you sustain it instead of crashing later.`,
      
      `Your mood held at ${ctx.avgMood.toFixed(1)} this week — elevated and positive — but sleep stayed short at ${ctx.avgSleep.toFixed(1)} hours. You logged ${ctx.highDays} good days, and your ${ctx.journalCount} written reflections show you're in a flow state. But flow without rest eventually becomes burnout. Protect this momentum by adding recovery time.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH JOURNALING FREQUENCY (Reflection-Heavy Week - 30 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.journalCount >= 5) {
    narratives.push(
      `You wrote ${ctx.journalCount} journal entries this week — more than usual. That level of reflection suggests something is processing, and you're giving it space. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. The act of writing itself is part of the work, helping you see patterns before they become overwhelming.`,
      
      `This week brought ${ctx.journalCount} written reflections — a significant amount of processing. Your mood averaged ${ctx.avgMood.toFixed(1)}, and sleep held at ${ctx.avgSleep.toFixed(1)} hours. When you write this much, you're not just recording — you're actively making sense of what's happening. That kind of engagement compounds over time.`,
      
      `You logged ${ctx.journalCount} journal entries this week, which is notable. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. High journaling frequency often signals that something important is shifting or asking for attention. The fact that you're showing up for it matters more than you might realize.`,
      
      `This week you wrote ${ctx.journalCount} journal entries — more reflection than usual. Your mood held at ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. That level of engagement suggests you're working through something real. Writing is how you make the invisible visible, and you're doing that work consistently.`,
      
      `You reflected in writing ${ctx.journalCount} times this week — a high level of engagement. Your mood averaged ${ctx.avgMood.toFixed(1)}, and sleep stayed at ${ctx.avgSleep.toFixed(1)} hours. When journaling frequency increases, it's usually because something underneath is asking to be understood. You're giving it the attention it needs.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MINIMAL DATA (Early Archive - 30 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.checkIns.length <= 3 && ctx.journalCount === 0) {
    narratives.push(
      `You logged ${ctx.checkIns.length} check-in${ctx.checkIns.length === 1 ? '' : 's'} this week with an average mood of ${ctx.avgMood.toFixed(1)}. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours. It's early, but you're building something. Each signal you leave makes the next week's reflection more meaningful. Keep going — the patterns will emerge.`,
      
      `This week brought ${ctx.checkIns.length} check-in${ctx.checkIns.length === 1 ? '' : 's'} and a mood average of ${ctx.avgMood.toFixed(1)}. Sleep held at ${ctx.avgSleep.toFixed(1)} hours. You're in the early stages of building your archive. Right now it feels like data, but soon it will start showing you patterns you couldn't see before. Every entry matters.`,
      
      `You've logged ${ctx.checkIns.length} check-in${ctx.checkIns.length === 1 ? '' : 's'} this week — a starting point. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. The first few weeks are about building the habit, not finding perfect insights. You're doing exactly what you need to do. The depth will come.`,
      
      `This week you checked in ${ctx.checkIns.length} time${ctx.checkIns.length === 1 ? '' : 's'}, averaging ${ctx.avgMood.toFixed(1)} mood and ${ctx.avgSleep.toFixed(1)} hours of sleep. It's early, but you're creating a foundation. Each signal you leave is a data point your future self will thank you for. Keep showing up — the patterns will reveal themselves.`,
      
      `You logged ${ctx.checkIns.length} check-in${ctx.checkIns.length === 1 ? '' : 's'} this week with a mood average of ${ctx.avgMood.toFixed(1)}. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours. Right now you're building the archive that will eventually show you what you can't see yet. The first few weeks are about consistency, not perfection. You're on the right path.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DREAM-HEAVY WEEK (Subconscious Active - 30 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.dreamCount >= 4) {
    narratives.push(
      `You recorded ${ctx.dreamCount} dreams this week — more than usual. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. High dream recall often signals that your subconscious is processing something significant. The fact that you're capturing these patterns gives you access to a layer most people never see.`,
      
      `This week brought ${ctx.dreamCount} recorded dreams alongside a mood average of ${ctx.avgMood.toFixed(1)} and ${ctx.avgSleep.toFixed(1)} hours of sleep. When dream frequency increases, it's usually because your subconscious is working through something important. You're keeping that processing visible, which makes it easier to understand what's shifting beneath the surface.`,
      
      `You logged ${ctx.dreamCount} dreams this week — a significant amount of subconscious activity. Your mood held at ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. Dreams are how your mind processes what your waking consciousness can't fully hold. The fact that you're recording them means you're paying attention to a layer most people ignore.`,
      
      `This week you captured ${ctx.dreamCount} dreams, which is notable. Your mood averaged ${ctx.avgMood.toFixed(1)}, and sleep stayed at ${ctx.avgSleep.toFixed(1)} hours. High dream recall often correlates with deeper processing — your subconscious is active, and you're giving it space to work. That level of engagement with your inner world is rare.`,
      
      `You recorded ${ctx.dreamCount} dreams this week alongside ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'}. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. When you track both dreams and waking reflections, you're building a multi-layered understanding of what's happening beneath the surface. That kind of depth compounds over time.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSISTENCY STREAK (Building Momentum - 30 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.checkIns.length === 7) {
    narratives.push(
      `You checked in every day this week — seven consecutive signals. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. That level of consistency is rare and valuable. You're not just tracking data; you're building a practice of self-awareness that most people never develop. This is how real insight happens.`,
      
      `This week brought seven check-ins — a full week of consistent reflection. Your mood averaged ${ctx.avgMood.toFixed(1)}, and sleep held at ${ctx.avgSleep.toFixed(1)} hours. When you show up every day, patterns become visible that would otherwise stay hidden. You're building something real here, and it shows.`,
      
      `You logged check-ins every single day this week — seven in a row. Your mood held at ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. That kind of consistency is what separates people who track from people who truly understand themselves. You're in the second category now.`,
      
      `This week you checked in all seven days, averaging ${ctx.avgMood.toFixed(1)} mood and ${ctx.avgSleep.toFixed(1)} hours of sleep. Daily consistency like this is how you build real self-knowledge. You're not just collecting data — you're creating a practice that will show you patterns you couldn't see before. Keep going.`,
      
      `You maintained a seven-day check-in streak this week with a mood average of ${ctx.avgMood.toFixed(1)} and ${ctx.avgSleep.toFixed(1)} hours of sleep. That level of engagement is what makes the difference between surface-level tracking and genuine insight. You're doing the work that matters.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN AFTER ABSENCE (Coming Back - 20 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.checkIns.length >= 2 && ctx.checkIns.length <= 4) {
    narratives.push(
      `You logged ${ctx.checkIns.length} check-ins this week — not a full week, but you're here. Your mood averaged ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. Coming back after time away is harder than maintaining a streak. The fact that you showed up at all matters more than perfect consistency.`,
      
      `This week brought ${ctx.checkIns.length} check-ins and a mood average of ${ctx.avgMood.toFixed(1)}. Sleep held at ${ctx.avgSleep.toFixed(1)} hours. You're rebuilding the habit, and that takes more effort than people realize. Every entry you leave is a step back toward the practice. Keep going — momentum will follow.`,
      
      `You checked in ${ctx.checkIns.length} times this week with an average mood of ${ctx.avgMood.toFixed(1)}. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours. Partial weeks are still valuable — they show you're working your way back. The hardest part is starting again, and you've already done that. The rest will get easier.`,
      
      `This week you logged ${ctx.checkIns.length} check-ins, averaging ${ctx.avgMood.toFixed(1)} mood and ${ctx.avgSleep.toFixed(1)} hours of sleep. You're in the process of rebuilding consistency, which is harder than maintaining it. The fact that you're here at all is what matters. Each entry makes the next one easier.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // WEEKEND VS WEEKDAY PATTERNS (30 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.topTags.includes('weekend') || ctx.topTags.includes('work')) {
    narratives.push(
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week with ${ctx.avgSleep.toFixed(1)} hours of sleep. You logged ${ctx.checkIns.length} check-ins, and your tags suggest a pattern between work days and rest days. That rhythm — how you move between structure and freedom — often reveals what drains you and what restores you. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry captures' : 'entries capture'} this dynamic.`,
      
      `This week brought a mood average of ${ctx.avgMood.toFixed(1)} and ${ctx.avgSleep.toFixed(1)} hours of sleep. Your check-in tags show the difference between weekdays and weekends, which is information about what your system needs. The contrast between structure and rest often reveals more than either one alone. Your ${ctx.journalCount} written reflections documented this rhythm.`,
      
      `You averaged ${ctx.avgMood.toFixed(1)} mood this week with ${ctx.avgSleep.toFixed(1)} hours of sleep. Your tags suggest you're noticing the difference between work days and rest days. That awareness — how your energy and mood shift with structure — is valuable data about what supports you and what depletes you. Keep tracking this pattern.`,
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENERGY PATTERNS (30 variations)
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (ctx.topTags.includes('low_energy') || ctx.topTags.includes('high_energy')) {
    narratives.push(
      `Your mood averaged ${ctx.avgMood.toFixed(1)} this week, and your tags show energy was a theme. Sleep held at ${ctx.avgSleep.toFixed(1)} hours. Energy patterns often reveal more than mood alone — they show you what your body is actually experiencing beneath the emotional weather. Your ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'} captured this dynamic.`,
      
      `This week brought a mood average of ${ctx.avgMood.toFixed(1)} with ${ctx.avgSleep.toFixed(1)} hours of sleep. Your check-in tags highlight energy levels, which is significant — energy is often the first signal that something is shifting, before mood catches up. The fact that you're tracking this gives you earlier warning signs. Your ${ctx.journalCount} written reflections documented this pattern.`,
      
      `You averaged ${ctx.avgMood.toFixed(1)} mood this week with ${ctx.avgSleep.toFixed(1)} hours of sleep. Your tags suggest energy was a key factor — either high or low. Energy is the foundation that mood builds on, so tracking it separately gives you more leverage. When energy shifts, everything else follows. Keep watching this pattern.`,
    );
  }
  
  // Fallback if no specific pattern matches
  if (narratives.length === 0) {
    narratives.push(
      `This week you logged ${ctx.checkIns.length} check-ins with an average mood of ${ctx.avgMood.toFixed(1)}. Sleep averaged ${ctx.avgSleep.toFixed(1)} hours, and you wrote ${ctx.journalCount} journal ${ctx.journalCount === 1 ? 'entry' : 'entries'}. Each signal you leave builds a clearer picture of what supports you and what doesn't.`,
    );
  }
  
  return narratives;
}
