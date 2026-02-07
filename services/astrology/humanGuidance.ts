// Human-First Daily Guidance
// Not charts first — people first.
// Now powered by accurate natal-transit calculations

import { NatalChart, AstrologySign, ZodiacSign } from './types';
import { DailyInsightEngine, DailyInsight, LifeDomain } from './dailyInsightEngine';
import { toLocalDateString } from '../../utils/dateUtils';

export interface HumanDailyGuidance {
  date: string;
  greeting: string;
  love: GuidanceMessage;
  energy: GuidanceMessage;
  growth: GuidanceMessage;
  gentleReminder: string;
  journalPrompt: string;
  // New fields from accurate engine (optional for backward compatibility)
  moonSign?: string;
  moonPhase?: string;
  signals?: { description: string; orb: string }[];
}

export interface GuidanceMessage {
  headline: string;
  message: string;
}

// Deep, psychologically-informed guidance pools
const LOVE_GUIDANCE = {
  supportive: [
    { headline: 'Connection flows easier today', message: 'Your heart is more open than usual. If there\'s something you\'ve been wanting to say to someone you love, today supports that vulnerability.' },
    { headline: 'Softness is available', message: 'You may find it easier to receive love today. Notice if you usually deflect compliments or care—and try letting one in.' },
    { headline: 'Your presence matters', message: 'Sometimes love isn\'t about doing—it\'s about being there. Today, your quiet presence may be exactly what someone needs.' },
    { headline: 'Old patterns can shift', message: 'You might notice a familiar dynamic playing out differently today. This is growth, even if it feels strange.' },
    { headline: 'Safety in connection', message: 'It\'s okay to want closeness and space at the same time. Both needs are valid. Today, honor whichever one speaks loudest.' },
  ],
  challenging: [
    { headline: 'Protect your soft spots', message: 'Your heart may feel more tender today. It\'s okay to be selective about who you let close. Boundaries are a form of self-love.' },
    { headline: 'Words may come out sideways', message: 'If you feel misunderstood today, pause before reacting. Sometimes our hurt speaks before our truth has a chance to.' },
    { headline: 'Old wounds may echo', message: 'Something might trigger an old feeling today. Remember: the past can inform us without defining us.' },
    { headline: 'Need more than usual? That\'s okay', message: 'Some days we need extra reassurance. You\'re not "too much"—you\'re human. Ask for what you need.' },
    { headline: 'Space isn\'t rejection', message: 'If someone needs distance today, try not to make it mean something about your worth. Sometimes people need to process alone.' },
  ],
  neutral: [
    { headline: 'Love is in the small things', message: 'Today might not be dramatic, but connection lives in quiet moments—a shared laugh, a knowing look, comfortable silence.' },
    { headline: 'Check in with yourself first', message: 'Before giving to others, notice what you need. You can\'t pour from an empty cup, and your needs matter too.' },
    { headline: 'Notice your patterns', message: 'How do you typically show love? How do you receive it? Today is a good day for curious self-observation.' },
    { headline: 'Love yourself like someone you love', message: 'What would you say to a dear friend feeling what you\'re feeling? Now say that to yourself.' },
    { headline: 'Presence over perfection', message: 'You don\'t have to be your best self to deserve love. You deserve it exactly as you are today.' },
  ],
};

const ENERGY_GUIDANCE = {
  high: [
    { headline: 'Your energy is available', message: 'You may feel more capable than usual. Use this momentum for something that matters to you—not just your to-do list.' },
    { headline: 'Good day for action', message: 'If you\'ve been putting something off, today might be the day. Start small. The hardest part is often just beginning.' },
    { headline: 'Channel, don\'t scatter', message: 'With extra energy comes the temptation to do everything at once. Choose one thing that would genuinely move the needle.' },
    { headline: 'Movement supports you', message: 'Your body wants to move today. Even a short walk can help process emotions and clear mental fog.' },
    { headline: 'Creativity is calling', message: 'Your inner artist may be awake today. Make something—not for anyone else, just for the joy of creating.' },
  ],
  low: [
    { headline: 'Rest is productive', message: 'Low energy isn\'t laziness—it\'s often your body asking for integration time. Listen to it. What if rest was the point today?' },
    { headline: 'Do less, feel more', message: 'You don\'t have to earn your worth through productivity. Today, just existing is enough.' },
    { headline: 'Be gentle with your pace', message: 'If everything feels harder today, that\'s information, not failure. Adjust expectations accordingly.' },
    { headline: 'Cozy is medicine', message: 'Your nervous system might need softness today—a warm drink, a slow morning, permission to do the bare minimum.' },
    { headline: 'You\'re not behind', message: 'Whatever you didn\'t get done yesterday (or last year) can wait. Today, just take care of the person doing the doing.' },
  ],
  moderate: [
    { headline: 'Steady energy available', message: 'Not a peak day, not a valley—just a sustainable rhythm. This is a good day for meaningful, not urgent, tasks.' },
    { headline: 'Balance input and output', message: 'Alternate between doing and being. For every hour of work, give yourself a few minutes of just existing.' },
    { headline: 'Notice what drains you', message: 'Pay attention to which tasks or people leave you feeling depleted vs. energized. This is useful data.' },
    { headline: 'Enough is a moving target', message: 'You don\'t have to do everything today. Choose the few things that matter most and let the rest wait.' },
    { headline: 'Honor your rhythms', message: 'When do you feel most alive? Most tired? Work with your natural energy instead of against it.' },
  ],
};

const GROWTH_GUIDANCE = {
  transformation: [
    { headline: 'Something is shifting', message: 'You may sense an ending or beginning today. Growth often feels like loss before it feels like expansion. Trust the process.' },
    { headline: 'Old stories are loosening', message: 'A belief you\'ve held about yourself may be ready to change. What if the thing you\'ve always told yourself isn\'t actually true?' },
    { headline: 'Discomfort is data', message: 'That uneasy feeling? It might be pointing toward growth. Lean in gently—you don\'t have to force anything.' },
    { headline: 'You\'re outgrowing something', message: 'What used to fit might feel tight now. This isn\'t regression—it\'s evolution. You\'re allowed to change.' },
    { headline: 'Healing isn\'t linear', message: 'You might revisit an old pattern or wound today. This isn\'t failure—it\'s integration at a deeper level.' },
  ],
  reflection: [
    { headline: 'Good day for honesty', message: 'Ask yourself a hard question today. Not to judge the answer, but to know yourself better.' },
    { headline: 'What are you avoiding?', message: 'Usually, the thing we resist is the thing we most need to face. What would gentle confrontation look like?' },
    { headline: 'Name what you\'re feeling', message: 'Beneath "fine" is usually something more specific. Sad? Anxious? Hopeful? Naming it helps you work with it.' },
    { headline: 'Your triggers are teachers', message: 'If something sets you off today, get curious instead of critical. What is this reaction trying to protect?' },
    { headline: 'Notice your self-talk', message: 'How do you speak to yourself when no one\'s listening? Would you talk to a friend that way?' },
  ],
  stability: [
    { headline: 'Consistency is growth too', message: 'Not every day is a breakthrough. Sometimes showing up, again, is the bravest thing.' },
    { headline: 'Integration over acquisition', message: 'You don\'t need new insight today. You might need to sit with what you already know.' },
    { headline: 'Trust your progress', message: 'Growth isn\'t always visible, but it\'s happening. The person you were a year ago would be proud of who you\'re becoming.' },
    { headline: 'Small steps count', message: 'One degree of change, repeated daily, leads somewhere new. Don\'t underestimate the power of tiny shifts.' },
    { headline: 'You\'re already enough', message: 'Growth isn\'t about fixing what\'s broken. You\'re not broken. You\'re becoming more yourself.' },
  ],
};

const GENTLE_REMINDERS = [
  'You don\'t have to have it all figured out. You just have to show up for today.',
  'Your feelings are valid, even the inconvenient ones.',
  'It\'s okay to be a work in progress and a masterpiece at the same time.',
  'You are not your worst day. You are not your best day either. You are all of your days.',
  'The goal isn\'t to be happy all the time. It\'s to be real.',
  'You can hold two truths at once: things can be hard AND you can be okay.',
  'What you water grows. Where is your attention today?',
  'You don\'t have to earn rest. You don\'t have to justify joy.',
  'Be the friend to yourself that you\'d want for someone you love.',
  'This season will pass. So will the next one. Breathe into this moment.',
  'You carry more strength than you give yourself credit for.',
  'Healing isn\'t about becoming someone new—it\'s about coming home to who you always were.',
  'Your sensitivity is not a flaw. It\'s how you read the world.',
  'You are allowed to take up space, have needs, and ask for help.',
  'Not everything that weighs on you is yours to carry.',
];

const JOURNAL_PROMPTS = [
  'What am I feeling beneath the surface today?',
  'What would I tell my younger self about what I\'m going through?',
  'Where am I being too hard on myself?',
  'What am I ready to let go of?',
  'What does my heart need that I\'ve been ignoring?',
  'Who do I become when I feel safe?',
  'What pattern keeps showing up in my life?',
  'What would change if I fully accepted myself today?',
  'What fear is masquerading as practicality?',
  'What truth am I dancing around?',
  'What would it feel like to trust myself more?',
  'Where do I need more compassion?',
  'What old story am I ready to rewrite?',
  'What am I grateful for that I usually overlook?',
  'If my emotions were a weather system, what would today be?',
];

export class HumanGuidanceGenerator {
  /**
   * Generate human-first daily guidance using accurate natal-transit engine
   */
  static generateDailyGuidance(chart: NatalChart, date: Date = new Date()): HumanDailyGuidance {
    // Use the new accurate daily insight engine
    const insight = DailyInsightEngine.generateDailyInsight(chart, date);
    
    // Map the insight cards to our love/energy/growth format
    const loveCard = insight.cards.find(c => c.domain === 'love') || 
                     insight.cards.find(c => c.domain === 'mood');
    const energyCard = insight.cards.find(c => c.domain === 'energy') ||
                       insight.cards.find(c => c.domain === 'direction');
    const growthCard = insight.cards.find(c => c.domain === 'growth') ||
                       insight.cards.find(c => c.domain === 'focus');
    
    // Use date for deterministic fallback selection
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Build love guidance - use accurate insight or fall back to pools
    const love: GuidanceMessage = loveCard 
      ? { headline: loveCard.title, message: `${loveCard.observation} ${loveCard.choicePoint}` }
      : LOVE_GUIDANCE.neutral[dayOfYear % LOVE_GUIDANCE.neutral.length];
    
    // Build energy guidance
    const energy: GuidanceMessage = energyCard
      ? { headline: energyCard.title, message: `${energyCard.observation} ${energyCard.choicePoint}` }
      : ENERGY_GUIDANCE.moderate[dayOfYear % ENERGY_GUIDANCE.moderate.length];
    
    // Build growth guidance - use any remaining card or fallback
    const remainingCard = insight.cards.find(c => 
      c !== loveCard && c !== energyCard
    );
    const growth: GuidanceMessage = remainingCard || growthCard
      ? { 
          headline: (remainingCard || growthCard)!.title, 
          message: `${(remainingCard || growthCard)!.observation} ${(remainingCard || growthCard)!.choicePoint}` 
        }
      : GROWTH_GUIDANCE.stability[dayOfYear % GROWTH_GUIDANCE.stability.length];
    
    // Use gentle reminder and journal prompt from pools (they're evergreen)
    const gentleReminder = GENTLE_REMINDERS[(dayOfYear + 3) % GENTLE_REMINDERS.length];
    const journalPrompt = JOURNAL_PROMPTS[(dayOfYear + 4) % JOURNAL_PROMPTS.length];
    
    // Create greeting based on time of day
    const hour = date.getHours();
    let greeting = '';
    if (hour < 12) {
      greeting = `Good morning. Moon in ${insight.moonSign} • ${insight.moonPhase}`;
    } else if (hour < 17) {
      greeting = `${insight.moonPhase} in ${insight.moonSign}. Here's your cosmic weather.`;
    } else {
      greeting = `Settling into evening. ${insight.moonSign} Moon, ${insight.moonPhase}.`;
    }
    
    return {
      date: insight.date,
      greeting,
      love,
      energy,
      growth,
      gentleReminder,
      journalPrompt,
      moonSign: insight.moonSign,
      moonPhase: insight.moonPhase,
      signals: insight.signals,
    };
  }
  
  /**
   * Get guidance for someone without exact birth time
   */
  static generateUnknownTimeGuidance(sunSign: string, date: Date = new Date()): HumanDailyGuidance {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Use moderate/neutral options for unknown time
    const love = LOVE_GUIDANCE.neutral[dayOfYear % LOVE_GUIDANCE.neutral.length];
    const energy = ENERGY_GUIDANCE.moderate[(dayOfYear + 1) % ENERGY_GUIDANCE.moderate.length];
    const growth = GROWTH_GUIDANCE.reflection[(dayOfYear + 2) % GROWTH_GUIDANCE.reflection.length];
    const gentleReminder = GENTLE_REMINDERS[(dayOfYear + 3) % GENTLE_REMINDERS.length];
    const journalPrompt = JOURNAL_PROMPTS[(dayOfYear + 4) % JOURNAL_PROMPTS.length];
    
    const hour = date.getHours();
    let greeting = hour < 12 
      ? 'Good morning. Here\'s what today holds for you.'
      : hour < 17 
      ? 'Hope your day is treating you gently.'
      : 'Settling into evening. Here\'s what\'s in the air.';
    
    return {
      date: toLocalDateString(date),
      greeting,
      love,
      energy,
      growth,
      gentleReminder,
      journalPrompt,
    };
  }
}
