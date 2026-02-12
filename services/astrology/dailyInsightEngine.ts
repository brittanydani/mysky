// File: services/astrology/dailyInsightEngine.ts
// "Wow accurate" daily insight system based on real natal-transit calculations
// NO trauma language - uses behavioral, life-domain framing

import { NatalChart, AspectTypeName } from './types';
import { toLocalDateString } from '../../utils/dateUtils';
import { getMoonPhaseName } from '../../utils/moonPhase';

const { Origin, Horoscope } = require('circular-natal-horoscope-js');

// ============================================================================
// TYPES
// ============================================================================

export type LifeDomain =
  | 'love' // Venus, 7th house
  | 'energy' // Mars, physical vitality
  | 'focus' // Mercury, 6th house, work
  | 'mood' // Moon, emotional needs
  | 'direction' // Sun, identity, confidence
  | 'home' // 4th house, comfort
  | 'growth'; // Jupiter, learning

export interface TransitSignal {
  transitingPlanet: string;
  natalTarget: string;
  aspectType: AspectTypeName;
  orb: number;
  score: number;
  domain: LifeDomain;
  isAngle: boolean;
  natalHouse?: number;
}

export interface DailyInsightCard {
  domain: LifeDomain;
  title: string;
  observation: string; // What will likely show up
  choicePoint: string; // What to do with it
  icon: string;
}

export interface DailyInsight {
  date: string;
  headline: string;
  headlineSubtext: string;
  cards: DailyInsightCard[];
  mantra: string;
  moonSign: string;
  moonPhase: string;
  // "Why this?" section for trust/transparency
  signals: {
    description: string;
    orb: string;
  }[];
  // Timeline info (premium feature)
  timeline?: {
    peakInfluence: string; // "Today" or "Feb 5-6"
    easesBy: string; // "Tomorrow evening" or "Feb 8"
    isPartOfLongerCycle: boolean;
    longerCycleNote?: string; // "Saturn has been here since Dec"
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Orb rules (tight = believable)
const ORB_CONFIG: Record<string, number> & { angleBonus: number } = {
  Moon: 2.0, // Moon transits are fast, keep tight
  Sun: 3.0,
  Mercury: 3.0,
  Venus: 3.0,
  Mars: 3.0,

  // ✅ Added: slow movers (still kept tight for “wow accurate”)
  Jupiter: 2.5,
  Saturn: 2.5,

  angleBonus: 0.5, // Angles feel even tighter
};

// Aspect base weights
const ASPECT_WEIGHTS: Record<AspectTypeName, number> = {
  conjunction: 6,
  opposition: 5,
  square: 5,
  trine: 4,
  sextile: 3,
};

// Transiting planet importance
const TRANSIT_PLANET_BOOST: Record<string, number> = {
  Moon: 3,
  Mars: 2,
  Venus: 2,
  Mercury: 2,
  Sun: 2,

  // ✅ Added
  Jupiter: 2,
  Saturn: 2,
};

// Natal target importance
const NATAL_TARGET_BOOST: Record<string, number> = {
  Ascendant: 3,
  Midheaven: 3,
  Sun: 2,
  Moon: 2,
  Venus: 1,
  Mars: 1,
  Mercury: 1,

  // ✅ Added (these can now be targets too)
  Jupiter: 1,
  Saturn: 1,
};

// Domain mapping by planet
const PLANET_TO_DOMAIN: Record<string, LifeDomain> = {
  Venus: 'love',
  Mars: 'energy',
  Mercury: 'focus',
  Moon: 'mood',
  Sun: 'direction',
  Jupiter: 'growth',
  Saturn: 'focus',
};

// House to domain mapping
const HOUSE_TO_DOMAIN: Record<number, LifeDomain> = {
  1: 'direction', // Self, identity
  2: 'mood', // Values, comfort
  3: 'focus', // Communication
  4: 'home', // Home, roots
  5: 'love', // Romance, creativity
  6: 'focus', // Work, routines
  7: 'love', // Relationships
  8: 'mood', // Depth, transformation
  9: 'growth', // Learning, expansion
  10: 'direction', // Career, public
  11: 'growth', // Community, future
  12: 'mood', // Rest, inner world
};

// Domain display config
const DOMAIN_CONFIG: Record<LifeDomain, { label: string; icon: string }> = {
  love: { label: 'Love & Connection', icon: '💞' },
  energy: { label: 'Energy & Action', icon: '⚡' },
  focus: { label: 'Focus & Work', icon: '🎯' },
  mood: { label: 'Mood & Needs', icon: '🌊' },
  direction: { label: 'Direction & Identity', icon: '✨' },
  home: { label: 'Home & Comfort', icon: '🏡' },
  growth: { label: 'Growth & Learning', icon: '🌱' },
};

// ============================================================================
// TRANSIT CONTENT LIBRARY
// Keyed by: transitingPlanet -> aspectType -> natalTarget
// ============================================================================

interface TransitTemplate {
  title: string;
  observation: string;
  choicePoint: string;
}

// This is the "wow accuracy" content - behavioral, specific, not therapy-coded
const TRANSIT_TEMPLATES: Record<string, Record<string, Record<string, TransitTemplate>>> = {
  Moon: {
    conjunction: {
      Sun: {
        title: 'Your needs feel clearer',
        observation:
          "You're more aware of what energizes vs. drains you today. Small preferences feel more pronounced.",
        choicePoint: "Honor one thing that sounds genuinely good to you, even if it's small.",
      },
      Moon: {
        title: 'Monthly reset point',
        observation:
          'Emotional patterns from the last month become more visible. You may feel both tender and clear.',
        choicePoint: "Name one feeling that's been building. Let it have space.",
      },
      Venus: {
        title: 'Craving sweetness',
        observation:
          "You'll notice what feels beautiful, comfortable, or connecting. Small pleasures hit harder.",
        choicePoint: 'Indulge one sensory comfort without guilt.',
      },
      Mars: {
        title: 'Impatience is data',
        observation:
          "Frustration rises faster, but so does motivation. You'll know what you want to do.",
        choicePoint: 'Channel the energy into action, not argument.',
      },
      Mercury: {
        title: 'Thinking and feeling merge',
        observation: 'Your thoughts have emotional weight today. Words carry more impact than usual.',
        choicePoint: "Say the thing you've been circling around, or write it down.",
      },
      Ascendant: {
        title: 'Feeling visible',
        observation:
          "You're more aware of how others see you. First impressions and reactions feel amplified.",
        choicePoint: 'Show up as you actually are, not as you think you should be.',
      },
      Midheaven: {
        title: 'Purpose feels present',
        observation:
          'Career, reputation, or life direction stirs something in you. What matters feels clearer.',
        choicePoint: 'Take one small step toward what you actually want to be known for.',
      },
    },
    square: {
      Sun: {
        title: 'Identity friction',
        observation:
          "What you need and who you think you should be don't quite match today. That tension is useful.",
        choicePoint: "Don't force resolution. Let both truths coexist for now.",
      },
      Moon: {
        title: 'Emotional crossroads',
        observation: 'Conflicting needs surface. You might want opposite things simultaneously.',
        choicePoint: "Name both desires out loud. You don't have to choose yet.",
      },
      Venus: {
        title: "Don't read too far in",
        observation: 'Small signals feel louder—tone, timing, who initiates. Sensitivity is up.',
        choicePoint: 'Ask directly for what you need instead of decoding hints.',
      },
      Mars: {
        title: 'Friction before clarity',
        observation:
          'Irritation and impatience may spike. Something wants to move, but obstacles appear.',
        choicePoint: 'Physical movement helps more than rumination.',
      },
      Mercury: {
        title: 'Overthinking incoming',
        observation: 'Your mind is busy processing feelings. Thoughts loop more than resolve.',
        choicePoint: "Write it out or talk it through. Don't let it spin internally.",
      },
      Ascendant: {
        title: 'Self-perception under pressure',
        observation:
          "How you see yourself versus how you feel don't align. Minor social friction is possible.",
        choicePoint: "Don't take reactions personally today. It's cosmic weather.",
      },
      Midheaven: {
        title: 'Career vs. comfort',
        observation: 'What you need to do and what you want to feel are in tension.',
        choicePoint: 'One task. Then one comfort. Alternate rather than choose.',
      },
    },
    opposition: {
      Sun: {
        title: 'Needs vs. ego',
        observation:
          'What you want emotionally may conflict with how you want to appear. Both are valid.',
        choicePoint: 'Honor your needs, even if they feel inconvenient to your image.',
      },
      Moon: {
        title: 'Full Moon echo',
        observation:
          'Something reaches a peak or requires acknowledgment. Emotions are full, not broken.',
        choicePoint: 'Let something complete rather than pushing it forward.',
      },
      Venus: {
        title: 'Relationship mirror',
        observation: "What you want from others versus what you're giving comes into focus.",
        choicePoint: "Check: are you asking for something you're not offering?",
      },
      Mars: {
        title: 'Push and pull',
        observation: 'You may feel pulled between rest and action, patience and urgency.',
        choicePoint: 'Do one productive thing, then genuinely stop.',
      },
      Mercury: {
        title: 'Heart vs. head',
        observation: "Logic and feeling are having a conversation today. Neither is wrong.",
        choicePoint: 'Let your gut have equal say with your analysis.',
      },
      Ascendant: {
        title: 'Self meets other',
        observation:
          "Relationship dynamics are highlighted. What you project and what you receive feel mismatched.",
        choicePoint: "Notice what you're attracting. It's showing you something.",
      },
      Midheaven: {
        title: 'Private vs. public',
        observation: 'Inner needs and outer responsibilities feel at odds.',
        choicePoint: 'Protect one hour for yourself today, non-negotiably.',
      },
    },
    trine: {
      Sun: {
        title: 'Aligned and easy',
        observation: 'What you need and who you are feel harmonious. Authentic expression flows.',
        choicePoint: 'Use this ease for something that matters, not just comfort.',
      },
      Moon: {
        title: 'Emotional flow',
        observation: 'Feelings move through without getting stuck. Good day for processing or creating.',
        choicePoint: "Trust your instincts. They're calibrated well today.",
      },
      Venus: {
        title: 'Softness arrives',
        observation:
          'Connection, beauty, and pleasure feel accessible. Relationships have ease.',
        choicePoint: 'Lean into the sweetness. Receive as well as give.',
      },
      Mars: {
        title: 'Productive energy',
        observation:
          "Motivation and emotion align. You can act on what you feel without second-guessing.",
        choicePoint: 'Start the thing. The momentum is real.',
      },
      Mercury: {
        title: 'Clear communication',
        observation:
          'Thoughts and feelings translate well. Conversations flow, writing comes easier.',
        choicePoint: "Have the conversation you've been postponing.",
      },
      Ascendant: {
        title: 'Showing up naturally',
        observation:
          'How you feel and how you appear are in sync. People respond well to your presence.',
        choicePoint: 'Ask for something you want. The timing is good.',
      },
      Midheaven: {
        title: 'Purpose and feeling align',
        observation: 'Career or public efforts feel emotionally meaningful, not just obligatory.',
        choicePoint: 'Do work that actually matters to you, even briefly.',
      },
    },
    sextile: {
      Sun: {
        title: 'Quiet confidence',
        observation:
          "A gentle sense of knowing who you are and what you need. Nothing dramatic, just solid.",
        choicePoint: 'Make one choice that reflects your actual values.',
      },
      Moon: {
        title: 'Emotional opportunity',
        observation:
          "Small openings for processing or connection appear. They're easy to miss if you're busy.",
        choicePoint: 'Say yes to the soft invitation—the tea, the call, the pause.',
      },
      Venus: {
        title: 'Small pleasures',
        observation:
          "Beauty and comfort are available if you look for them. Nothing grand, just nice.",
        choicePoint: "Notice one thing that's genuinely lovely in your day.",
      },
      Mars: {
        title: 'Gentle momentum',
        observation:
          "Energy is available without pressure. You can act, but you don't have to push.",
        choicePoint: "Do one thing that moves you forward without exhausting you.",
      },
      Mercury: {
        title: 'Easy understanding',
        observation: 'Communication feels fluid. Good day for light planning or catching up.',
        choicePoint: "Send the text you've been meaning to send.",
      },
      Ascendant: {
        title: 'Approachable presence',
        observation: 'You come across as warm and open. Social situations feel lighter.',
        choicePoint: 'Be yourself in a group setting. It lands well today.',
      },
      Midheaven: {
        title: 'Career ease',
        observation: 'Professional interactions have a pleasant quality. Progress feels possible.',
        choicePoint: 'Make a small ask that advances your work.',
      },
    },
  },
  Venus: {
    conjunction: {
      Venus: {
        title: 'Venus return energy',
        observation:
          'Your relationship and aesthetic preferences feel more defined. You know what you like.',
        choicePoint: 'Invest in something beautiful or meaningful to you.',
      },
      Mars: {
        title: 'Attraction is active',
        observation:
          'Desire and affection blend. You may feel drawn to pursue what (or who) you want.',
        choicePoint: "Express interest directly. Subtlety isn't needed today.",
      },
      Ascendant: {
        title: 'Charm is heightened',
        observation: 'You appear more attractive, approachable, or magnetic. People notice you.',
        choicePoint: 'Use this visibility for something that matters to you.',
      },
    },
    square: {
      Venus: {
        title: 'Values under pressure',
        observation:
          "What you want versus what's available creates friction. Desire feels sharper.",
        choicePoint: "Name what you actually want, even if it seems unavailable.",
      },
      Mars: {
        title: 'Passion and conflict',
        observation: 'Attraction and frustration intertwine. Relationship tension may surface.',
        choicePoint: 'Say what you want clearly, without blame.',
      },
      Ascendant: {
        title: 'Self-image wobble',
        observation: "How you want to be seen and how you feel about yourself don't match.",
        choicePoint: "Don't overcompensate. Just be honest about where you are.",
      },
    },
    trine: {
      Venus: {
        title: 'Harmony flows',
        observation:
          'Relationships, beauty, and comfort feel aligned. Appreciation comes easily.',
        choicePoint: 'Tell someone what you appreciate about them.',
      },
      Mars: {
        title: 'Balanced desire',
        observation:
          "What you want and what you're willing to do for it align. Action feels romantic.",
        choicePoint: 'Make a move toward something you want.',
      },
      Ascendant: {
        title: 'Naturally magnetic',
        observation:
          'You exude warmth without effort. Good day for social or romantic situations.',
        choicePoint: 'Show up somewhere you want to be seen.',
      },
    },
    opposition: {
      Venus: {
        title: 'Mirror relationship',
        observation:
          "What you want from others reflects back what you're not giving yourself.",
        choicePoint: 'Give yourself the thing you keep waiting to receive.',
      },
      Mars: {
        title: 'Tension between love and will',
        observation:
          "What you want and what others want may clash. Compromise requires effort.",
        choicePoint: 'Find the overlap instead of the difference.',
      },
      Ascendant: {
        title: 'Relationship projection',
        observation:
          "What you attract shows you something about yourself. It's information, not judgment.",
        choicePoint: "Ask: what am I putting out that's drawing this back?",
      },
    },
    sextile: {
      Venus: {
        title: 'Easy appreciation',
        observation:
          'Small pleasures feel satisfying. Relationships have a gentle positive quality.',
        choicePoint: 'Accept the compliment. Receive the nice thing.',
      },
      Mars: {
        title: 'Graceful action',
        observation:
          'What you want and what you do align softly. Progress feels pleasant.',
        choicePoint: 'Take one step toward something you desire.',
      },
      Ascendant: {
        title: 'Subtle charm',
        observation: "You come across well without trying. Social ease is available.",
        choicePoint: "Reach out to someone you've been meaning to connect with.",
      },
    },
  },
  Mars: {
    conjunction: {
      Mars: {
        title: 'Mars return energy',
        observation:
          "Your drive, anger, and desire reset. What you're willing to fight for becomes clearer.",
        choicePoint: 'Start something that requires courage.',
      },
      Sun: {
        title: 'Willpower surge',
        observation:
          'Your sense of purpose is energized. Confidence rises, possibly with impatience.',
        choicePoint: 'Act on what you know you need to do.',
      },
      Ascendant: {
        title: 'Visible assertiveness',
        observation:
          'You come across as direct, possibly intense. Others respond to your energy.',
        choicePoint: "Lead with what you want, not what you're against.",
      },
    },
    square: {
      Mars: {
        title: 'Energy crossroads',
        observation: 'Frustration and drive compete. You may feel blocked or pushed.',
        choicePoint: 'Move your body. Physical release helps more than thinking.',
      },
      Sun: {
        title: 'Will vs. ego',
        observation: 'What you want to do and who you want to be are in tension.',
        choicePoint: 'Act from your values, not your frustration.',
      },
      Ascendant: {
        title: 'Friction with environment',
        observation:
          'You may feel at odds with your surroundings or come across too strong.',
        choicePoint: 'Pause before reacting. Count to five.',
      },
    },
    trine: {
      Mars: {
        title: 'Smooth energy',
        observation: 'Your drive and action align. What you want to do, you can do.',
        choicePoint: 'Start the project. The energy is real.',
      },
      Sun: {
        title: 'Confidence in motion',
        observation: 'Identity and action flow together. You feel capable and clear.',
        choicePoint: 'Take on something that requires courage.',
      },
      Ascendant: {
        title: 'Effective presence',
        observation: 'You come across as capable and direct. Others follow your lead.',
        choicePoint: 'Assert yourself in a situation that needs it.',
      },
    },
    opposition: {
      Mars: {
        title: 'External challenge',
        observation:
          "Competition or conflict with others may arise. It's clarifying, not just difficult.",
        choicePoint: 'Stand your ground without escalating.',
      },
      Sun: {
        title: 'Push against ego',
        observation:
          "What you're trying to do meets resistance from who you think you should be.",
        choicePoint: 'Let your actions define you, not your self-image.',
      },
      Ascendant: {
        title: 'Others push back',
        observation: 'Relationships may involve friction. Someone challenges you.',
        choicePoint: "Listen to the challenge. There's information in it.",
      },
    },
    sextile: {
      Mars: {
        title: 'Gentle drive',
        observation:
          "Energy is available without urgency. You can act without forcing.",
        choicePoint: 'Do one thing that moves a project forward.',
      },
      Sun: {
        title: 'Quiet confidence',
        observation: 'You know what you want to do and feel capable of doing it.',
        choicePoint: 'Trust your instinct to act.',
      },
      Ascendant: {
        title: 'Effective ease',
        observation: 'You come across as capable without being aggressive.',
        choicePoint: 'Take initiative in a way that feels natural.',
      },
    },
  },
  Mercury: {
    conjunction: {
      Mercury: {
        title: 'Mercury return',
        observation:
          'Your communication style resets. How you think and express yourself becomes clearer.',
        choicePoint: 'Write something that articulates who you are now.',
      },
      Moon: {
        title: 'Words meet feelings',
        observation:
          'Thoughts and emotions blend. Good for journaling, conversations that matter.',
        choicePoint: 'Say how you actually feel, not just what you think.',
      },
      Ascendant: {
        title: 'Communication is visible',
        observation:
          'Your ideas and words carry extra weight. Others notice what you say.',
        choicePoint: 'Speak up in a situation where your input matters.',
      },
    },
    square: {
      Mercury: {
        title: 'Mental friction',
        observation: "Thoughts don't flow easily. Communication may hit snags.",
        choicePoint: "Be extra clear. Don't assume understanding.",
      },
      Moon: {
        title: 'Head vs. heart noise',
        observation:
          'Logic and emotion argue. Overthinking emotional situations is likely.',
        choicePoint: 'Write it out before talking it out.',
      },
      Ascendant: {
        title: 'Miscommunication risk',
        observation: 'How you express yourself may land differently than intended.',
        choicePoint: "Ask 'did that make sense?' after important points.",
      },
    },
    trine: {
      Mercury: {
        title: 'Mental flow',
        observation: 'Thinking and communicating feel easy. Ideas connect well.',
        choicePoint: "Have the strategic conversation you've been putting off.",
      },
      Moon: {
        title: 'Emotional clarity',
        observation: 'You can articulate feelings clearly. Understanding flows.',
        choicePoint: "Name a feeling you've been avoiding. It's clearer now.",
      },
      Ascendant: {
        title: 'Words land well',
        observation:
          'Communication comes across as intended. Good for important conversations.',
        choicePoint: "Speak up. You'll be understood.",
      },
    },
    opposition: {
      Mercury: {
        title: 'Different perspectives',
        observation:
          "Your thinking meets opposing viewpoints. It's useful friction.",
        choicePoint: 'Listen to understand, not to respond.',
      },
      Moon: {
        title: 'Logic vs. instinct',
        observation:
          "What you think and what you feel are at odds. Both have truth.",
        choicePoint: "Honor both. Don't force one to win.",
      },
      Ascendant: {
        title: 'Ideas meet resistance',
        observation:
          'Your communication may be questioned. Others see it differently.',
        choicePoint: 'Be curious about the pushback instead of defensive.',
      },
    },
    sextile: {
      Mercury: {
        title: 'Easy thinking',
        observation:
          'Mental processes flow gently. Light problem-solving works well.',
        choicePoint: "Handle the admin you've been avoiding.",
      },
      Moon: {
        title: 'Soft understanding',
        observation:
          'Thoughts and feelings cooperate. Emotional conversations have ease.',
        choicePoint: 'Check in with someone you care about.',
      },
      Ascendant: {
        title: 'Pleasant exchanges',
        observation: 'Communication is smooth and well-received.',
        choicePoint: 'Reach out. The conversation will go well.',
      },
    },
  },
  Sun: {
    conjunction: {
      Sun: {
        title: 'Solar return energy',
        observation: 'Your sense of self resets. Identity, purpose, and vitality renew.',
        choicePoint: 'Set an intention for who you want to become.',
      },
      Moon: {
        title: 'New Moon personal',
        observation:
          'Conscious and unconscious align. Seeds planted now have power.',
        choicePoint: 'Start something that matters to you emotionally and practically.',
      },
      Ascendant: {
        title: 'Identity illuminated',
        observation: "You're more visible. How you present yourself is highlighted.",
        choicePoint: 'Show up fully. This is your moment to be seen.',
      },
    },
    square: {
      Sun: {
        title: 'Identity pressure',
        observation: "Who you are versus who you're becoming creates tension.",
        choicePoint: "The discomfort is growth. Don't retreat to old patterns.",
      },
      Moon: {
        title: 'Quarter Moon tension',
        observation: 'What you want to be versus what you need emotionally clash.',
        choicePoint: "Acknowledge both. You don't have to choose sides.",
      },
      Ascendant: {
        title: 'Self vs. image',
        observation: 'Your inner sense of self and outer presentation are misaligned.',
        choicePoint: 'Adjust your presentation, not your core self.',
      },
    },
    trine: {
      Sun: {
        title: 'Identity ease',
        observation: 'Who you are flows naturally. Confidence is quiet but real.',
        choicePoint: 'Take action from a place of self-trust.',
      },
      Moon: {
        title: 'Inner harmony',
        observation:
          'What you want and what you need align. Authentic expression feels easy.',
        choicePoint: 'Be yourself without explanation.',
      },
      Ascendant: {
        title: 'Natural presence',
        observation: 'You appear as you feel. No performance needed.',
        choicePoint: 'Let others see you as you are.',
      },
    },
    opposition: {
      Sun: {
        title: 'Self-reflection point',
        observation:
          "Who you were versus who you're becoming is highlighted.",
        choicePoint: "Honor what you're growing into, not just what you've been.",
      },
      Moon: {
        title: 'Full Moon personal',
        observation:
          "Needs and identity are at a peak. Something wants acknowledgment.",
        choicePoint: "Let something reach completion. Don't push it forward.",
      },
      Ascendant: {
        title: 'Others mirror you',
        observation: "Relationships reflect your identity back. It's information.",
        choicePoint: 'What you see in others is also about you.',
      },
    },
    sextile: {
      Sun: {
        title: 'Gentle identity flow',
        observation: 'Small sense of rightness about who you are. Nothing dramatic.',
        choicePoint: 'Act from your values today.',
      },
      Moon: {
        title: 'Easy alignment',
        observation: 'What you want and what you need softly cooperate.',
        choicePoint: 'Trust the impulse that feels true.',
      },
      Ascendant: {
        title: 'Approachable confidence',
        observation: 'You come across well without effort.',
        choicePoint: "Take up space. You've earned it.",
      },
    },
  },
};

// ============================================================================
// FALLBACK TEMPLATES (when no tight aspects)
// Based on Moon house placement
// ============================================================================

const MOON_IN_HOUSE_FALLBACK: Record<number, TransitTemplate> = {
  1: {
    title: 'Your mood is visible',
    observation: 'Feelings show on your face today. Others may read you easily.',
    choicePoint: "Don't perform neutrality. Let your authentic state be seen.",
  },
  2: {
    title: 'Comfort seeking',
    observation: 'You may crave security, familiar pleasures, or material comfort.',
    choicePoint: 'One small luxury is allowed. Choose it consciously.',
  },
  3: {
    title: 'Words carry feeling',
    observation: 'Communication is emotionally charged. Everyday exchanges feel weighted.',
    choicePoint: "Notice tone—yours and others'. There's information in it.",
  },
  4: {
    title: 'Home as sanctuary',
    observation: 'You need your space to feel right. Domestic details may demand attention.',
    choicePoint: 'Make one small adjustment to your environment. It helps.',
  },
  5: {
    title: 'Creative mood',
    observation: 'Playfulness, romance, or creative expression want your attention.',
    choicePoint: "Do one thing just because it's enjoyable, not productive.",
  },
  6: {
    title: 'Routines matter more',
    observation: 'Your emotional state is tied to whether things run smoothly.',
    choicePoint: "Fix one small inefficiency. It'll calm your nervous system.",
  },
  7: {
    title: 'Relationship focus',
    observation: 'Your mood is influenced by one-on-one dynamics. Partnerships feel present.',
    choicePoint: 'Check in with someone important. Connection helps.',
  },
  8: {
    title: 'Deeper waters',
    observation: 'Emotions run below the surface. You may process something private.',
    choicePoint: "Let yourself feel without having to explain.",
  },
  9: {
    title: 'Searching for meaning',
    observation: 'Your mood lifts when learning or exploring. Routine feels stale.',
    choicePoint: 'Read, research, or plan something expansive.',
  },
  10: {
    title: 'Public emotional presence',
    observation: "Career or reputation may stir feelings. You're more visible today.",
    choicePoint: 'Show up professionally as your full self, not a mask.',
  },
  11: {
    title: 'Community mood',
    observation: 'Friends, groups, or future goals color your emotional state.',
    choicePoint: 'Connect with your people. Isolation doesn’t help today.',
  },
  12: {
    title: 'Need for solitude',
    observation: 'Inner world wants attention. Quiet time is restorative, not avoidant.',
    choicePoint: "Protect time alone. You're processing more than you realize.",
  },
};

// ============================================================================
// MANTRAS BY DOMAIN
// ============================================================================

const DOMAIN_MANTRAS: Record<LifeDomain, string[]> = {
  love: [
    'Connection is a practice, not a prize.',
    'You can ask for what you need.',
    'Receiving is as important as giving.',
    'Small moments of warmth add up.',
  ],
  energy: [
    'Your pace is information, not failure.',
    'Rest is productive.',
    'Movement changes mood.',
    "You don't have to feel ready to begin.",
  ],
  focus: [
    'One thing at a time is enough.',
    'Clarity comes from starting, not waiting.',
    'Your attention is valuable. Spend it wisely.',
    'Done is better than perfect.',
  ],
  mood: [
    'Feelings pass. You remain.',
    'Your needs are valid data.',
    'You can feel without fixing.',
    "Tenderness isn't weakness.",
  ],
  direction: [
    "You don't have to have it all figured out.",
    'Small steps count.',
    'Your path is yours. Comparison is noise.',
    'Doubt is part of growth.',
  ],
  home: [
    'Your space affects your state.',
    'Comfort is not complacency.',
    'Roots help you grow.',
    'Safety is something you can create.',
  ],
  growth: [
    'Learning is allowed to be slow.',
    'Not knowing is where growth begins.',
    'Your capacity keeps expanding.',
    'Curiosity is a form of hope.',
  ],
};

// ============================================================================
// MOON PHASE CALCULATION
// ============================================================================

// getMoonPhase replaced by imported getMoonPhaseName from utils/moonPhase
function getMoonPhase(date: Date): string {
  return getMoonPhaseName(date);
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

function normalize360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function getSignFromDegree(deg: number): string {
  return SIGNS[Math.floor(normalize360(deg) / 30)];
}

function getAspectTone(aspect: AspectTypeName): { adjective: string; guidance: string } {
  switch (aspect) {
    case 'conjunction':
      return { adjective: 'amplified', guidance: 'Lean into what feels obvious—focus helps.' };
    case 'square':
      return { adjective: 'frictional', guidance: 'Use the tension as information; avoid forcing.' };
    case 'opposition':
      return { adjective: 'reflective', guidance: 'Notice the mirror effect; look for balance.' };
    case 'trine':
      return { adjective: 'smooth', guidance: 'Use the ease intentionally; momentum is available.' };
    case 'sextile':
      return { adjective: 'supportive', guidance: 'Small actions compound—take the easy opening.' };
    default:
      return { adjective: 'active', guidance: 'Stay present and make one small choice.' };
  }
}

/**
 * Tries to find the natal house of a target point/planet so domain can be more “life-area accurate”.
 * Returns undefined if not available (unknown time / no houses / no match).
 */
function getNatalHouseForTarget(natalChart: NatalChart, target: string): number | undefined {
  // If we have legacy placements with houses, use them
  if (Array.isArray(natalChart.placements) && natalChart.placements.length > 0) {
    const match = natalChart.placements.find(p => p?.planet?.name === target);
    if (match && typeof match.house === 'number' && Number.isFinite(match.house) && match.house >= 1) {
      return match.house;
    }
  }

  // If target is an angle, map by name if you have houses + angles degrees
  if (target === 'Ascendant' || target === 'Midheaven') {
    const angle = Array.isArray(natalChart.angles)
      ? natalChart.angles.find(a => a?.name === target)
      : undefined;

    if (angle && typeof angle.absoluteDegree === 'number' && Array.isArray(natalChart.houses)) {
      const deg = normalize360(angle.absoluteDegree);
      const houses = natalChart.houses
        .filter(h => typeof h.absoluteDegree === 'number' && Number.isFinite(h.absoluteDegree))
        .sort((a, b) => normalize360(a.absoluteDegree) - normalize360(b.absoluteDegree));

      if (houses.length === 12) {
        for (let i = 0; i < 12; i++) {
          const current = normalize360(houses[i].absoluteDegree);
          const next = normalize360(houses[(i + 1) % 12].absoluteDegree);

          const inHouse =
            current < next ? deg >= current && deg < next : deg >= current || deg < next;

          if (inHouse) return houses[i].house;
        }
      }
    }
  }

  // Enhanced planets array may include house on PlanetPosition
  if (Array.isArray(natalChart.planets) && natalChart.planets.length > 0) {
    const match = natalChart.planets.find(p => p?.planet === target);
    if (match && typeof match.house === 'number' && Number.isFinite(match.house) && match.house >= 1) {
      return match.house;
    }
  }

  return undefined;
}

/**
 * Generic template when a specific library entry doesn't exist (esp. Jupiter/Saturn or new targets).
 * Keeps the same “behavioral, believable” tone.
 */
function buildGenericTemplate(signal: TransitSignal): TransitTemplate {
  const tone = getAspectTone(signal.aspectType);

  const title = `${signal.transitingPlanet} feels ${tone.adjective}`;
  const observation = `${signal.transitingPlanet} is ${signal.aspectType} your ${signal.natalTarget}, which can make this theme feel more noticeable than usual. You may spot clearer patterns around choices, timing, and what matters today.`;
  const choicePoint = `${tone.guidance} Pick one action that supports your ${signal.domain} domain without overdoing it.`;

  return { title, observation, choicePoint };
}

export class DailyInsightEngine {
  /**
   * Generate the full daily insight for a user
   */
  static generateDailyInsight(natalChart: NatalChart, date: Date = new Date()): DailyInsight {
    // 1. Get transiting positions
    const transits = this.getTransitingPositions(date, natalChart);

    // 2. Compute all transit signals with scores
    const signals = this.computeAllSignals(natalChart, transits);

    // 3. Pick top 3 with variety
    const topSignals = this.selectTopSignals(signals, 3);

    // 4. Generate cards from signals
    const cards = this.generateCards(topSignals, natalChart, transits);

    // 5. If no strong signals, use Moon house fallback
    if (cards.length === 0) {
      const moonHouse = this.getMoonHouse(natalChart, transits);
      const fallbackCard = this.generateFallbackCard(moonHouse);
      cards.push(fallbackCard);
    }

    // 6. Generate headline from strongest signal
    const headline = this.generateHeadline(topSignals[0], natalChart, transits);

    // 7. Get moon info
    const moonLongitude = transits['Moon'] || 0;
    const moonSign = getSignFromDegree(moonLongitude);
    const moonPhase = getMoonPhase(date);

    // 8. Pick mantra based on dominant domain
    const dominantDomain = cards[0]?.domain || 'mood';
    const mantras = DOMAIN_MANTRAS[dominantDomain];
    const mantra = mantras[date.getDate() % mantras.length];

    // 9. Build "Why this?" section
    const signalDescriptions = topSignals.map(s => ({
      description: `${s.transitingPlanet} ${s.aspectType} natal ${s.natalTarget}`,
      orb: `${s.orb.toFixed(1)}°`,
    }));

    // 10. Calculate timeline info
    const timeline = this.calculateTimeline(topSignals, date);

    return {
      date: toLocalDateString(date),
      headline: headline.main,
      headlineSubtext: headline.subtext,
      cards,
      mantra,
      moonSign,
      moonPhase,
      signals: signalDescriptions,
      timeline,
    };
  }

  /**
   * Calculate when influence peaks and eases
   */
  private static calculateTimeline(signals: TransitSignal[], date: Date): DailyInsight['timeline'] {
    if (signals.length === 0) {
      return undefined;
    }

    const hasSaturn = signals.some(s => s.transitingPlanet === 'Saturn');
    const hasJupiter = signals.some(s => s.transitingPlanet === 'Jupiter');
    const hasMoonOnly = signals.every(s => s.transitingPlanet === 'Moon');
    const hasMars = signals.some(s => s.transitingPlanet === 'Mars');
    const hasVenus = signals.some(s => s.transitingPlanet === 'Venus');

    // Determine timeline based on fastest moving planet in signals
    let peakInfluence = 'Today';
    let easesBy = '';
    let isPartOfLongerCycle = false;
    let longerCycleNote: string | undefined;

    if (hasMoonOnly) {
      // Moon transits: very fast (hours)
      const hour = date.getHours();
      if (hour < 12) {
        peakInfluence = 'This morning';
        easesBy = 'By this evening';
      } else if (hour < 18) {
        peakInfluence = 'This afternoon';
        easesBy = 'By tomorrow morning';
      } else {
        peakInfluence = 'This evening';
        easesBy = 'By tomorrow afternoon';
      }
    } else if (hasSaturn) {
      // Saturn: very slow (weeks/months)
      peakInfluence = this.formatDateRange(date, 0, 3);
      easesBy = this.formatFutureDate(date, 14);
      isPartOfLongerCycle = true;
      longerCycleNote =
        'Saturn moves slowly — this theme has been building and will continue for a while.';
    } else if (hasJupiter) {
      // Jupiter: slow (1-2 weeks)
      peakInfluence = this.formatDateRange(date, 0, 2);
      easesBy = this.formatFutureDate(date, 10);
      isPartOfLongerCycle = true;
      longerCycleNote = 'Jupiter expands what it touches. This influence lasts about a week.';
    } else if (hasMars) {
      // Mars: moderate (3-4 days)
      peakInfluence = this.formatDateRange(date, 0, 1);
      easesBy = this.formatFutureDate(date, 4);
    } else if (hasVenus) {
      // Venus: moderate (2-3 days)
      peakInfluence = this.formatDateRange(date, 0, 1);
      easesBy = this.formatFutureDate(date, 3);
    } else {
      // Sun/Mercury: moderate (2-3 days)
      peakInfluence = this.formatDateRange(date, 0, 1);
      easesBy = this.formatFutureDate(date, 3);
    }

    return {
      peakInfluence,
      easesBy,
      isPartOfLongerCycle,
      longerCycleNote,
    };
  }

  /**
   * Format a date range for display
   */
  private static formatDateRange(startDate: Date, daysFromStart: number, daysToEnd: number): string {
    const start = new Date(startDate);
    start.setDate(start.getDate() + daysFromStart);
    const end = new Date(startDate);
    end.setDate(end.getDate() + daysToEnd);

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (daysFromStart === 0 && daysToEnd === 0) return 'Today';
    if (daysFromStart === 0 && daysToEnd === 1) return `Today & tomorrow`;
    if (startStr === endStr) return startStr;
    return `${startStr}–${endStr}`;
  }

  /**
   * Format a future date for display
   */
  private static formatFutureDate(baseDate: Date, daysAhead: number): string {
    const future = new Date(baseDate);
    future.setDate(future.getDate() + daysAhead);

    if (daysAhead === 1) return 'Tomorrow';
    if (daysAhead === 2) return 'In a couple days';
    if (daysAhead <= 4) return `Around ${future.toLocaleDateString('en-US', { weekday: 'long' })}`;
    if (daysAhead <= 7) return 'By next week';
    return future.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get transiting planet positions for a date
   */
  private static getTransitingPositions(date: Date, natalChart: NatalChart): Record<string, number> {
    const origin = new Origin({
      year: date.getFullYear(),
      month: date.getMonth(), // Origin expects 0-based month (0=Jan, 11=Dec); getMonth() already returns 0–11
      date: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      latitude: natalChart.birthData.latitude,
      longitude: natalChart.birthData.longitude,
    });

    const horoscope = new Horoscope({
      origin,
      houseSystem: natalChart.houseSystem || 'whole-sign',
      zodiac: 'tropical',
      aspectPoints: ['bodies'],
      aspectWithPoints: ['bodies'],
      aspectTypes: [],
      customOrbs: {},
      language: 'en',
    });

    const bodies = (horoscope as any).CelestialBodies || {};
    const map: Record<string, number> = {};

    const extractDeg = (obj: any): number | null => {
      const direct =
        obj?.ChartPosition?.Ecliptic?.DecimalDegrees ??
        obj?.chartPosition?.ecliptic?.decimalDegrees ??
        obj?.longitude;
      if (typeof direct === 'number' && Number.isFinite(direct)) return normalize360(direct);
      return null;
    };

    // ✅ Includes slow movers now
    const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    for (const p of planets) {
      const deg = extractDeg(bodies[p.toLowerCase()]);
      if (deg != null) map[p] = deg;
    }

    return map;
  }

  /**
   * Get natal point positions
   */
  private static getNatalPositions(natalChart: NatalChart): Record<string, number> {
    const positions: Record<string, number> = {};

    // From enhanced planets
    if (natalChart.planets) {
      for (const p of natalChart.planets) {
        if (typeof p.absoluteDegree === 'number') {
          positions[p.planet] = normalize360(p.absoluteDegree);
        }
      }
    }

    // From legacy placements
    if (natalChart.placements) {
      for (const pl of natalChart.placements) {
        if (typeof pl.longitude === 'number' && !positions[pl.planet.name]) {
          positions[pl.planet.name] = normalize360(pl.longitude);
        }
      }
    }

    // Angles
    if (natalChart.angles) {
      for (const a of natalChart.angles) {
        if (typeof a.absoluteDegree === 'number') {
          positions[a.name] = normalize360(a.absoluteDegree);
        }
      }
    }

    return positions;
  }

  /**
   * Compute all transit signals with scores
   */
  private static computeAllSignals(
    natalChart: NatalChart,
    transits: Record<string, number>
  ): TransitSignal[] {
    const natalPositions = this.getNatalPositions(natalChart);
    const signals: TransitSignal[] = [];

    // ✅ Updated: includes Jupiter + Saturn
    const transitPlanets = ['Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

    // ✅ Updated: includes Jupiter + Saturn as natal targets too (handled by generic template if no library entry)
    const natalTargets = [
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'Ascendant',
      'Midheaven',
    ];

    const aspects: Array<{ type: AspectTypeName; angle: number }> = [
      { type: 'conjunction', angle: 0 },
      { type: 'sextile', angle: 60 },
      { type: 'square', angle: 90 },
      { type: 'trine', angle: 120 },
      { type: 'opposition', angle: 180 },
    ];

    for (const tPlanet of transitPlanets) {
      const tDeg = transits[tPlanet];
      if (tDeg == null) continue;

      const maxOrb = ORB_CONFIG[tPlanet] ?? 3;

      for (const nTarget of natalTargets) {
        const nDeg = natalPositions[nTarget];
        if (nDeg == null) continue;

        let diff = Math.abs(tDeg - nDeg);
        if (diff > 180) diff = 360 - diff;

        for (const asp of aspects) {
          const orb = Math.abs(diff - asp.angle);
          const isAngle = nTarget === 'Ascendant' || nTarget === 'Midheaven';
          const effectiveMaxOrb = isAngle ? maxOrb + ORB_CONFIG.angleBonus : maxOrb;

          if (orb <= effectiveMaxOrb) {
            // Calculate score
            const baseWeight = ASPECT_WEIGHTS[asp.type] || 3;
            const planetBoost = TRANSIT_PLANET_BOOST[tPlanet] || 0;
            const natalBoost = NATAL_TARGET_BOOST[nTarget] || 0;
            const closeness = (effectiveMaxOrb - orb) / effectiveMaxOrb;
            const score = (baseWeight + planetBoost + natalBoost) * (1 + closeness);

            // ✅ Prefer house-based domain when we can determine it (more “life-domain accurate”)
            const natalHouse = getNatalHouseForTarget(natalChart, nTarget);
            const houseDomain = natalHouse ? HOUSE_TO_DOMAIN[natalHouse] : undefined;
            const planetDomain = PLANET_TO_DOMAIN[nTarget] || PLANET_TO_DOMAIN[tPlanet];
            const domain: LifeDomain = houseDomain || planetDomain || 'mood';

            signals.push({
              transitingPlanet: tPlanet,
              natalTarget: nTarget,
              aspectType: asp.type,
              orb: Number(orb.toFixed(2)),
              score,
              domain,
              isAngle,
              natalHouse,
            });
            break; // Only one aspect per planet pair
          }
        }
      }
    }

    // Sort by score descending
    signals.sort((a, b) => b.score - a.score);
    return signals;
  }

  /**
   * Select top signals with variety (different domains, different planets)
   */
  private static selectTopSignals(signals: TransitSignal[], count: number): TransitSignal[] {
    const selected: TransitSignal[] = [];
    const usedDomains = new Set<LifeDomain>();
    const usedTransitPlanets = new Set<string>();

    for (const signal of signals) {
      if (selected.length >= count) break;

      // First signal: just pick the highest
      if (selected.length === 0) {
        selected.push(signal);
        usedDomains.add(signal.domain);
        usedTransitPlanets.add(signal.transitingPlanet);
        continue;
      }

      // Subsequent signals: prefer variety
      const sameTransit = usedTransitPlanets.has(signal.transitingPlanet);
      const sameDomain = usedDomains.has(signal.domain);

      // Skip if same transit planet AND same domain (too repetitive)
      if (sameTransit && sameDomain) continue;

      // Prefer different domains
      if (!sameDomain || signal.score > selected[selected.length - 1].score * 0.8) {
        selected.push(signal);
        usedDomains.add(signal.domain);
        usedTransitPlanets.add(signal.transitingPlanet);
      }
    }

    return selected;
  }

  /**
   * Generate cards from signals
   */
  private static generateCards(
    signals: TransitSignal[],
    _natalChart: NatalChart,
    _transits: Record<string, number>
  ): DailyInsightCard[] {
    const cards: DailyInsightCard[] = [];

    for (const signal of signals) {
      const template = this.getTemplate(signal);
      if (!template) continue;

      const domainConfig = DOMAIN_CONFIG[signal.domain];
      cards.push({
        domain: signal.domain,
        title: template.title,
        observation: template.observation,
        choicePoint: template.choicePoint,
        icon: domainConfig.icon,
      });
    }

    return cards;
  }

  /**
   * Get template for a signal
   */
  private static getTemplate(signal: TransitSignal): TransitTemplate | null {
    const planetTemplates = TRANSIT_TEMPLATES[signal.transitingPlanet];
    const aspectTemplates = planetTemplates?.[signal.aspectType];
    const template = aspectTemplates?.[signal.natalTarget];

    // ✅ If no specific template exists (common for Jupiter/Saturn), fall back to a safe generic
    return template || buildGenericTemplate(signal);
  }

  /**
   * Get moon house for fallback
   */
  private static getMoonHouse(natalChart: NatalChart, transits: Record<string, number>): number {
    const moonDeg = transits['Moon'];
    if (moonDeg == null) return 1;

    // Check house cusps
    if (natalChart.houses) {
      for (let i = 0; i < natalChart.houses.length; i++) {
        const currentCusp = natalChart.houses[i].absoluteDegree;
        const nextCusp = natalChart.houses[(i + 1) % 12].absoluteDegree;

        // Handle wrap-around at 0°
        let inHouse = false;
        if (currentCusp < nextCusp) {
          inHouse = moonDeg >= currentCusp && moonDeg < nextCusp;
        } else {
          inHouse = moonDeg >= currentCusp || moonDeg < nextCusp;
        }

        if (inHouse) return natalChart.houses[i].house;
      }
    }

    // Fallback: estimate from moon longitude
    return Math.floor(moonDeg / 30) + 1;
  }

  /**
   * Generate fallback card when no strong transits
   */
  private static generateFallbackCard(moonHouse: number): DailyInsightCard {
    const template = MOON_IN_HOUSE_FALLBACK[moonHouse] || MOON_IN_HOUSE_FALLBACK[1];
    return {
      domain: HOUSE_TO_DOMAIN[moonHouse] || 'mood',
      title: template.title,
      observation: template.observation,
      choicePoint: template.choicePoint,
      icon: '🌙',
    };
  }

  /**
   * Generate headline from strongest signal
   */
  private static generateHeadline(
    signal: TransitSignal | undefined,
    _natalChart: NatalChart,
    transits: Record<string, number>
  ): { main: string; subtext: string } {
    if (!signal) {
      const moonDeg = transits['Moon'] || 0;
      const moonSign = getSignFromDegree(moonDeg);
      return {
        main: `Moon in ${moonSign}`,
        subtext: 'A quieter cosmic day—follow your own rhythm.',
      };
    }

    const template = this.getTemplate(signal);
    if (template) {
      return {
        main: template.title,
        subtext: `${signal.transitingPlanet} ${signal.aspectType} your ${signal.natalTarget} (${signal.orb.toFixed(
          1
        )}° orb)`,
      };
    }

    return {
      main: `${signal.transitingPlanet} activates your ${signal.natalTarget}`,
      subtext: `${signal.aspectType} aspect, ${signal.orb.toFixed(1)}° orb`,
    };
  }
}
