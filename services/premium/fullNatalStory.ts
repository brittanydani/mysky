/**
 * Full Natal Story - Premium Content
 * 
 * This is the crown jewel of Deeper Sky.
 * Instead of "You are sensitive and creative," users get
 * full emotional chapters with depth, nuance, and healing.
 * 
 * Chapters:
 * 1. Your Core Self (Sun)
 * 2. Your Emotional World (Moon)
 * 3. Your First Impression (Rising)
 * 4. How You Love (Venus)
 * 5. How You Fight (Mars)
 * 6. How You Protect Yourself
 * 7. Your Inner Child
 * 8. Your Growth Arc (Saturn)
 * 9. Your Soul's Purpose (North Node)
 * 10. Your Shadow Work (Pluto)
 */

import { NatalChart } from '../astrology/types';

export interface NatalChapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  isPremium: boolean;
  // Content varies based on premium status
  freeContent: {
    brief: string;
    teaser: string;
  };
  // Full content generated based on chart
}

export interface FullNatalStory {
  chapters: GeneratedChapter[];
  summary: string;
  affirmation: string;
}

export interface GeneratedChapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  isPremium: boolean;
  content: string;
  reflection: string;
  affirmation: string;
}

// Chapter definitions
const CHAPTER_DEFINITIONS: NatalChapter[] = [
  {
    id: 'core-self',
    title: 'Your Core Self',
    subtitle: 'The light you were born to shine',
    icon: 'sunny',
    isPremium: false,
    freeContent: {
      brief: 'Your Sun sign reveals your essential self.',
      teaser: 'Unlock Deeper Sky to explore the full story of your core identity...',
    },
  },
  {
    id: 'emotional-world',
    title: 'Your Emotional World',
    subtitle: 'How your heart learned to feel',
    icon: 'moon',
    isPremium: false,
    freeContent: {
      brief: 'Your Moon sign shapes your emotional needs.',
      teaser: 'Unlock Deeper Sky to understand your emotional patterns in depth...',
    },
  },
  {
    id: 'first-impression',
    title: 'Your First Impression',
    subtitle: 'The mask you wear and why',
    icon: 'eye',
    isPremium: false,
    freeContent: {
      brief: 'Your Rising sign is how the world first sees you.',
      teaser: 'Unlock Deeper Sky to explore the full story of your public self...',
    },
  },
  {
    id: 'how-you-love',
    title: 'How You Love',
    subtitle: 'Your heart\'s language',
    icon: 'heart',
    isPremium: true,
    freeContent: {
      brief: 'Venus reveals your love style.',
      teaser: 'Unlock Deeper Sky to understand your unique way of giving and receiving love...',
    },
  },
  {
    id: 'how-you-fight',
    title: 'How You Fight',
    subtitle: 'Your fire and your edge',
    icon: 'flame',
    isPremium: true,
    freeContent: {
      brief: 'Mars shows how you assert yourself.',
      teaser: 'Unlock Deeper Sky to explore your relationship with anger, drive, and desire...',
    },
  },
  {
    id: 'protection-style',
    title: 'How You Protect Yourself',
    subtitle: 'The walls you built and why',
    icon: 'shield',
    isPremium: true,
    freeContent: {
      brief: 'Your chart reveals your defense mechanisms.',
      teaser: 'Unlock Deeper Sky for trauma-informed insights on your protective patterns...',
    },
  },
  {
    id: 'inner-child',
    title: 'Your Inner Child',
    subtitle: 'What your younger self still needs',
    icon: 'happy',
    isPremium: true,
    freeContent: {
      brief: 'Your chart holds clues to childhood wounds.',
      teaser: 'Unlock Deeper Sky to meet your inner child and understand what they needed...',
    },
  },
  {
    id: 'growth-arc',
    title: 'Your Growth Arc',
    subtitle: 'The lessons you\'re here to learn',
    icon: 'trending-up',
    isPremium: true,
    freeContent: {
      brief: 'Saturn shows your growth challenges.',
      teaser: 'Unlock Deeper Sky to understand your life\'s curriculum...',
    },
  },
  {
    id: 'souls-purpose',
    title: 'Your Soul\'s Purpose',
    subtitle: 'Where you\'re headed',
    icon: 'compass',
    isPremium: true,
    freeContent: {
      brief: 'Your North Node points toward growth.',
      teaser: 'Unlock Deeper Sky to explore your soul\'s direction...',
    },
  },
  {
    id: 'shadow-work',
    title: 'Your Shadow Work',
    subtitle: 'What you\'re learning to integrate',
    icon: 'contrast',
    isPremium: true,
    freeContent: {
      brief: 'Pluto reveals transformation points.',
      teaser: 'Unlock Deeper Sky for deep shadow work insights...',
    },
  },
];

// Content pools for premium chapters (element-based)
const CORE_SELF_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  fire: {
    content: `You came into this world to SHINE — not apologetically, not dimly, but fully. Your Sun in a fire sign means your core self is animated by passion, spontaneity, and an unshakeable belief that life is meant to be lived boldly.

You don't just want to exist; you want to MATTER. You want to leave a mark, inspire others, and feel the rush of being fully alive. This isn't ego (though it can look like it to people who've forgotten how to burn). This is your essence.

The challenge? Learning that you can shine without burning out. That rest isn't defeat. That sometimes the most powerful fire is the one that knows when to become embers.

Your light is a gift to those around you — but only if you don't deplete yourself giving it away. Your fire needs tending, not just output.`,
    reflection: 'When do you feel most alive? What would it look like to protect that flame instead of giving it away?',
    affirmation: 'I am allowed to shine without apology. My brightness is not too much.',
  },
  earth: {
    content: `You came into this world to BUILD — something real, something lasting, something you can touch. Your Sun in an earth sign means your core self is grounded in practicality, sensuality, and the deep satisfaction of tangible results.

You don't trust words without action. Promises mean nothing to you without follow-through. You value what you can see, taste, hold, create. This isn't materialism — it's wisdom. You know that the spiritual and physical are not separate.

The challenge? Learning that not everything valuable can be measured. That sometimes the most productive thing is rest. That your worth isn't determined by what you produce.

Your steadiness is a gift to those around you — but only if you remember that you're more than your usefulness. You deserve comfort, beauty, and pleasure simply because you exist.`,
    reflection: 'What have you built that you\'re proud of? What would it feel like to rest without guilt?',
    affirmation: 'I am worthy beyond what I produce. My presence itself is enough.',
  },
  air: {
    content: `You came into this world to UNDERSTAND — to connect ideas, share perspectives, and weave meaning from the chaos. Your Sun in an air sign means your core self is animated by curiosity, communication, and the endless quest for understanding.

Your mind is your greatest gift. You can see patterns others miss, hold multiple perspectives at once, and translate complex ideas into accessible wisdom. You live in a world of possibility, always asking "what if?"

The challenge? Learning that not everything needs to be figured out. That some truths live in the body, not the mind. That connection requires presence, not just conversation.

Your perspective is a gift to those around you — but only if you remember to come down from the clouds sometimes. Your body has wisdom too. So does silence.`,
    reflection: 'What question are you currently obsessing over? What would it feel like to simply NOT KNOW for a while?',
    affirmation: 'I don\'t have to understand everything. My presence is valuable even in silence.',
  },
  water: {
    content: `You came into this world to FEEL — deeply, fully, without the armor that most people wear. Your Sun in a water sign means your core self is animated by emotion, intuition, and an undeniable connection to the unseen currents beneath the surface.

You feel EVERYTHING. The mood of a room. The unspoken tension. The grief beneath someone's smile. This isn't a weakness — it's a superpower. You sense what others miss because you haven't learned to numb yourself to it.

The challenge? Learning that you can feel without drowning. That boundaries aren't walls — they're filters. That protecting your energy isn't the same as closing your heart.

Your depth is a gift to those around you — but only if you don't lose yourself in their emotions. You're allowed to have needs. You're allowed to surface for air.`,
    reflection: 'Whose emotions are you carrying that aren\'t yours? What would it feel like to put them down?',
    affirmation: 'I can feel deeply AND protect myself. My sensitivity is strength.',
  },
};

const EMOTIONAL_WORLD_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  fire: {
    content: `Your emotional world runs HOT. With your Moon in a fire sign, you don't do lukewarm feelings — you blaze or you freeze. Emotions hit you fast and burn through you quickly. You need to EXPRESS to process.

When you're happy, everyone knows. When you're angry, it's impossible to hide. You wear your heart not on your sleeve, but in your entire energy field. This intensity can be overwhelming — for you and others.

What you need to feel safe: FREEDOM. Space to move, react, and be yourself without monitoring your intensity. Partners who can handle your heat. Room to process OUT LOUD.

Signs you're emotionally overwhelmed: Restlessness, picking fights, impulsive decisions, feeling trapped. You might not even realize you're upset until you've already reacted.

Healing looks like: Learning to pause between feeling and action. Finding physical outlets for emotional energy. Accepting that not everyone can match your fire — and that's okay.`,
    reflection: 'How do you typically express anger? What happens when you\'re not allowed to?',
    affirmation: 'My intensity is not too much. I can feel fire without burning bridges.',
  },
  earth: {
    content: `Your emotional world craves STABILITY. With your Moon in an earth sign, your feelings move slowly, deliberately, and deeply. You don't trust emotions that change with the wind — you need to feel the ground beneath your feet.

You process through the body — cooking, gardening, touching, creating. Talking about feelings often feels inadequate. You'd rather SHOW love than say it. You'd rather build security than promise it.

What you need to feel safe: CONSISTENCY. Knowing where you stand. Reliable routines. A stable home base. Physical comfort. Partners who show up, not just talk.

Signs you're emotionally overwhelmed: Physical symptoms (tension, digestion issues), stubbornness, materialism as comfort, emotional withdrawal. You might not even realize you're upset until your body tells you.

Healing looks like: Learning to trust the process, not just the outcome. Allowing emotions to move without needing to fix them. Accepting that some things can't be solved — only felt.`,
    reflection: 'Where do you feel emotions in your body? What physical comforts help you feel safe?',
    affirmation: 'I can feel without needing to fix. My need for stability is valid.',
  },
  air: {
    content: `Your emotional world lives in your MIND. With your Moon in an air sign, you process feelings through thinking, talking, and analyzing. You need to UNDERSTAND your emotions before you can feel them fully.

This isn't coldness — it's how your nervous system learned to cope. If you can name it, categorize it, discuss it, you can handle it. The problem is when feelings arrive faster than thoughts.

What you need to feel safe: COMMUNICATION. Partners who talk things through. Space to process out loud. Understanding that your way of feeling is valid, even if it looks different.

Signs you're emotionally overwhelmed: Racing thoughts, over-explaining, emotional detachment, seeking distraction. You might intellectualize feelings to avoid actually feeling them.

Healing looks like: Learning that some emotions don't need to be understood — just felt. Connecting mind and body. Sitting with discomfort without immediately analyzing it.`,
    reflection: 'When did you first learn to think instead of feel? What emotion is hardest for you to sit with?',
    affirmation: 'I can feel without needing to understand. My mind and heart can coexist.',
  },
  water: {
    content: `Your emotional world is an OCEAN. With your Moon in a water sign, you feel everything — yours and everyone else's. Emotions don't just visit you; they move through you like tides, sometimes gently, sometimes overwhelming.

You have emotional memories that live in your body, not your mind. You can be triggered by things you don't consciously remember. Your intuition is incredibly strong — you sense truth before it's spoken.

What you need to feel safe: EMOTIONAL ATTUNEMENT. Partners who can sit with feelings without trying to fix them. Permission to be "too sensitive." Space to withdraw and recharge.

Signs you're emotionally overwhelmed: Emotional flooding, merging with others' feelings, withdrawal into fantasy, difficulty knowing what's yours vs. theirs. The world can feel too loud, too much.

Healing looks like: Learning that boundaries are acts of love. That you can care without absorbing. That protecting your energy isn't selfish — it's survival.`,
    reflection: 'Whose emotions are you carrying right now? What would it feel like to give them back?',
    affirmation: 'I can feel deeply without drowning. My sensitivity is my gift.',
  },
};

export class FullNatalStoryGenerator {
  /**
   * Generate the complete natal story for premium users
   */
  static generateFullStory(chart: NatalChart, isPremium: boolean): FullNatalStory {
    const chapters = CHAPTER_DEFINITIONS.map(definition => 
      this.generateChapter(chart, definition, isPremium)
    );
    
    const sunElement = this.getElement(chart.sunSign?.name || 'Aries');
    const moonElement = this.getElement(chart.moonSign?.name || 'Cancer');
    
    return {
      chapters,
      summary: this.generateSummary(chart, isPremium),
      affirmation: this.generateOverallAffirmation(sunElement, moonElement),
    };
  }
  
  /**
   * Generate a single chapter
   */
  private static generateChapter(
    chart: NatalChart, 
    definition: NatalChapter, 
    isPremium: boolean
  ): GeneratedChapter {
    // If not premium and chapter is premium, return teaser
    if (!isPremium && definition.isPremium) {
      return {
        id: definition.id,
        title: definition.title,
        subtitle: definition.subtitle,
        icon: definition.icon,
        isPremium: definition.isPremium,
        content: definition.freeContent.brief,
        reflection: definition.freeContent.teaser,
        affirmation: '',
      };
    }
    
    // Generate full content based on chart
    const content = this.getChapterContent(chart, definition.id, isPremium);
    
    return {
      id: definition.id,
      title: definition.title,
      subtitle: definition.subtitle,
      icon: definition.icon,
      isPremium: definition.isPremium,
      content: content.content,
      reflection: content.reflection,
      affirmation: content.affirmation,
    };
  }
  
  /**
   * Get chapter content based on chart placements
   */
  private static getChapterContent(
    chart: NatalChart, 
    chapterId: string,
    isPremium: boolean
  ): { content: string; reflection: string; affirmation: string } {
    const sunElement = this.getElement(chart.sunSign?.name || 'Aries');
    const moonElement = this.getElement(chart.moonSign?.name || 'Cancer');
    
    switch (chapterId) {
      case 'core-self':
        return CORE_SELF_CONTENT[sunElement] || CORE_SELF_CONTENT.fire;
        
      case 'emotional-world':
        return EMOTIONAL_WORLD_CONTENT[moonElement] || EMOTIONAL_WORLD_CONTENT.water;
        
      // For other chapters, return a condensed version for free or full for premium
      default:
        if (!isPremium) {
          const definition = CHAPTER_DEFINITIONS.find(d => d.id === chapterId);
          return {
            content: definition?.freeContent.brief || '',
            reflection: definition?.freeContent.teaser || '',
            affirmation: '',
          };
        }
        
        // Premium content for other chapters would be expanded here
        return this.getGenericPremiumContent(chapterId, sunElement, moonElement);
    }
  }
  
  /**
   * Generate generic premium content for chapters not yet fully built out
   */
  private static getGenericPremiumContent(
    chapterId: string,
    sunElement: string,
    moonElement: string
  ): { content: string; reflection: string; affirmation: string } {
    const contentMap: Record<string, { content: string; reflection: string; affirmation: string }> = {
      'first-impression': {
        content: `Your Rising sign is the mask you show the world — not because you're fake, but because meeting new people requires a particular kind of energy. It's your social operating system, the filter through which others first experience you.\n\nWith your Rising sign, you naturally project ${sunElement === 'fire' ? 'confidence and warmth' : sunElement === 'earth' ? 'stability and groundedness' : sunElement === 'air' ? 'curiosity and friendliness' : 'sensitivity and depth'}. People's first impression of you may be quite different from who you are once they get to know you — and that's not deception, it's adaptation.\n\nUnderstanding your Rising sign helps you see why certain social situations feel natural while others drain you. It's not about changing who you are — it's about understanding the interface between your inner world and the outer one.`,
        reflection: 'How do you think others see you? How does that differ from how you see yourself?',
        affirmation: 'How I present myself is valid. My public self protects my private depths.',
      },
      'how-you-love': {
        content: `Venus in your chart reveals your love language — not just how you show love, but how you need to receive it. This is the part of you that longs for connection, beauty, and harmony.\n\nYou love through ${moonElement === 'fire' ? 'passionate action and grand gestures' : moonElement === 'earth' ? 'consistent presence and practical care' : moonElement === 'air' ? 'communication and intellectual connection' : 'emotional attunement and depth'}. What feels romantic to you might look different from mainstream ideals — and that's okay.\n\nYour Venus also shows your relationship with self-worth, pleasure, and what you find beautiful. When you're aligned with your Venus, you attract love effortlessly. When you're ignoring it, relationships feel like work.`,
        reflection: 'What makes you feel most loved? What do you secretly wish partners would understand?',
        affirmation: 'I deserve to be loved the way I need to be loved.',
      },
      'how-you-fight': {
        content: `Mars in your chart is your warrior energy — how you assert yourself, pursue what you want, and handle conflict. It's also connected to your relationship with anger and desire.\n\nYou express Mars energy through ${sunElement === 'fire' ? 'direct confrontation and passionate pursuit' : sunElement === 'earth' ? 'patient persistence and strategic action' : sunElement === 'air' ? 'words, debate, and mental strategy' : 'indirect resistance and emotional intensity'}.\n\nMany people have a complicated relationship with their Mars. Society teaches us to suppress anger, to "be nice," to avoid conflict. But Mars energy isn't going away — it just goes underground. Understanding your Mars helps you express this vital energy in healthy ways.`,
        reflection: 'How were you taught to handle anger growing up? How do you handle it now?',
        affirmation: 'My anger is information. I can express it without destruction.',
      },
      'protection-style': {
        content: `Your chart reveals how your nervous system learned to protect itself. These aren't flaws — they're survival strategies that once kept you safe. The question is whether they're still serving you.\n\nBased on your chart, you may protect yourself through ${moonElement === 'fire' ? 'offense (attacking before you can be hurt), impulsivity, or putting up walls of anger' : moonElement === 'earth' ? 'control, perfectionism, over-responsibility, or making yourself indispensable' : moonElement === 'air' ? 'intellectualizing emotions, detachment, keeping things light, or staying in your head' : 'withdrawal, merging with others, emotional flooding, or anticipating rejection'}.\n\nThese patterns often formed in childhood as responses to your environment. They were adaptive then. The work now is discerning when they help and when they hold you back.`,
        reflection: 'What protective pattern do you recognize in yourself? When did it first develop?',
        affirmation: 'I honor my protection patterns for keeping me safe. I can update them now.',
      },
      'inner-child': {
        content: `Your inner child is the part of you that still carries the needs, fears, and longings from your earliest years. Your chart suggests what that younger version of you needed most — and may still be seeking.\n\nBased on your placements, your inner child likely needed ${sunElement === 'fire' ? 'to be seen, celebrated, and allowed to express themselves freely' : sunElement === 'earth' ? 'stability, reliability, and the sense that they could count on their caregivers' : sunElement === 'air' ? 'to be heard, understood, and given space to ask questions' : 'emotional safety, attunement, and unconditional acceptance'}.\n\nWhen this need wasn't fully met, a wound formed. But here's the beautiful thing: you can now give yourself what was missing. You can become the parent your inner child needed.`,
        reflection: 'What did your younger self need most? How can you provide that now?',
        affirmation: 'I can reparent myself with compassion. My inner child is safe with me now.',
      },
      'growth-arc': {
        content: `Saturn in your chart represents your growth curriculum — the lessons you're here to learn, the challenges that will ultimately make you wiser and stronger.\n\nYour Saturn suggests you're learning about ${sunElement === 'fire' ? 'patience, discipline, and channeling your fire sustainably' : sunElement === 'earth' ? 'trusting the process, releasing control, and finding security within' : sunElement === 'air' ? 'commitment, follow-through, and grounding your ideas in reality' : 'boundaries, emotional resilience, and protecting your energy'}.\n\nSaturn lessons are rarely easy — they often involve delay, frustration, and repeated attempts. But Saturn is also the great rewarder. The skills you develop through these challenges become your greatest strengths.`,
        reflection: 'What challenge keeps recurring in your life? What might it be teaching you?',
        affirmation: 'My challenges are my curriculum. I am becoming wiser and stronger.',
      },
      'souls-purpose': {
        content: `Your North Node points toward your soul's growth direction — the qualities you're meant to develop in this lifetime. It's not where you're comfortable; it's where you're headed.\n\nYour chart suggests you're moving toward ${moonElement === 'fire' ? 'courage, self-expression, and trusting your impulses' : moonElement === 'earth' ? 'presence, embodiment, and building something tangible' : moonElement === 'air' ? 'connection, communication, and intellectual exploration' : 'intuition, emotional depth, and spiritual connection'}.\n\nThe North Node often feels unfamiliar and challenging because it represents new territory. Your South Node (the opposite point) shows what's comfortable but may be holding you back. Growth means leaving the familiar shore.`,
        reflection: 'What quality are you being called to develop? What makes you resist it?',
        affirmation: 'I am brave enough to grow into my full potential.',
      },
      'shadow-work': {
        content: `Pluto in your chart represents your shadow — the parts of yourself you've hidden, rejected, or disowned. Shadow work isn't about darkness being bad; it's about integration and wholeness.\n\nYour Pluto suggests your shadow themes include ${sunElement === 'fire' ? 'anger, selfishness, and the fear of being ordinary' : sunElement === 'earth' ? 'greed, stubbornness, and the fear of loss' : sunElement === 'air' ? 'manipulation, detachment, and the fear of intimacy' : 'jealousy, obsession, and the fear of abandonment'}.\n\nShadow material isn't evil — it's just the parts of yourself that weren't acceptable in your environment. When you integrate your shadow, you reclaim your full power. You stop projecting onto others what you can't accept in yourself.`,
        reflection: 'What quality do you judge most harshly in others? How might it live in you?',
        affirmation: 'All parts of me are welcome. Integration leads to wholeness.',
      },
    };
    
    return contentMap[chapterId] || {
      content: 'Full content available for Deeper Sky members.',
      reflection: 'What resonates with you about this chapter?',
      affirmation: 'I am learning and growing every day.',
    };
  }
  
  /**
   * Generate summary for the natal story
   */
  private static generateSummary(chart: NatalChart, isPremium: boolean): string {
    if (!isPremium) {
      return 'Unlock Deeper Sky to see your complete natal story summary.';
    }
    
    const sunSign = chart.sunSign?.name || 'Your Sun sign';
    const moonSign = chart.moonSign?.name || 'Your Moon sign';
    const risingSign = chart.risingSign?.name || 'Your Rising sign';
    
    return `You are a ${sunSign} Sun — ${this.getElementShorthand(sunSign)} at your core. Your ${moonSign} Moon gives you ${this.getMoonShorthand(moonSign)} emotional needs. And your ${risingSign} Rising means the world first sees you as ${this.getRisingShorthand(risingSign)}.\n\nThis combination makes you uniquely YOU. There's no one else with your exact cosmic blueprint. Your chart isn't a box to fit into — it's a map to understand yourself more deeply and compassionately.`;
  }
  
  /**
   * Generate overall affirmation
   */
  private static generateOverallAffirmation(sunElement: string, moonElement: string): string {
    const affirmations: Record<string, string> = {
      'fire-fire': 'I burn brightly without burning out. My passion is sustainable.',
      'fire-earth': 'I balance my fire with groundedness. I can dream AND build.',
      'fire-air': 'I combine vision with perspective. My ideas ignite connection.',
      'fire-water': 'I blend passion with depth. My emotions fuel my purpose.',
      'earth-fire': 'I build with passion. My foundations support big dreams.',
      'earth-earth': 'I am unshakeably grounded. My stability is my strength.',
      'earth-air': 'I think practically and dream freely. Ideas become reality through me.',
      'earth-water': 'I nurture what I build. My creations have soul.',
      'air-fire': 'I think boldly and act courageously. My mind lights the way.',
      'air-earth': 'I ground my ideas in reality. Thoughts become tangible.',
      'air-air': 'I connect ideas and people. Understanding is my superpower.',
      'air-water': 'I think with my heart and feel with my mind. Both are valid.',
      'water-fire': 'I feel passionately and act intuitively. My heart guides my fire.',
      'water-earth': 'I nurture and build. My emotions create lasting foundations.',
      'water-air': 'I feel AND think. My emotional intelligence is my gift.',
      'water-water': 'I feel deeply and that is my strength. My sensitivity is wisdom.',
    };
    
    return affirmations[`${sunElement}-${moonElement}`] || 'I am exactly who I was meant to be.';
  }
  
  private static getElement(sign: string): string {
    const fireSign = ['Aries', 'Leo', 'Sagittarius'].includes(sign);
    const earthSign = ['Taurus', 'Virgo', 'Capricorn'].includes(sign);
    const airSign = ['Gemini', 'Libra', 'Aquarius'].includes(sign);
    
    if (fireSign) return 'fire';
    if (earthSign) return 'earth';
    if (airSign) return 'air';
    return 'water';
  }
  
  private static getElementShorthand(sign: string): string {
    const element = this.getElement(sign);
    const descriptions: Record<string, string> = {
      fire: 'passionate and driven',
      earth: 'grounded and reliable',
      air: 'curious and communicative',
      water: 'intuitive and deep',
    };
    return descriptions[element] || 'unique';
  }
  
  private static getMoonShorthand(sign: string): string {
    const element = this.getElement(sign);
    const descriptions: Record<string, string> = {
      fire: 'passionate and expressive',
      earth: 'stable and practical',
      air: 'analytical and communicative',
      water: 'deep and nurturing',
    };
    return descriptions[element] || 'complex';
  }
  
  private static getRisingShorthand(sign: string): string {
    const element = this.getElement(sign);
    const descriptions: Record<string, string> = {
      fire: 'confident and warm',
      earth: 'composed and capable',
      air: 'friendly and approachable',
      water: 'mysterious and empathetic',
    };
    return descriptions[element] || 'interesting';
  }
}
