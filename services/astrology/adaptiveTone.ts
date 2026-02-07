// Adaptive tone system - Different app experience based on user intent
// This makes one app feel like 3 different apps

import { NatalChart, EmotionalPattern } from './types';
import { EmotionalOperatingSystem } from './emotionalOperatingSystem';

export type UserIntent = 'understanding-myself' | 'healing' | 'relationships' | 'daily-guidance';

export interface AdaptiveToneConfig {
  intent: UserIntent;
  language: LanguageStyle;
  emphasis: ContentEmphasis;
  prompts: JournalingPrompts;
}

export interface LanguageStyle {
  explanationDepth: 'gentle' | 'deep' | 'practical';
  emotionalFraming: 'supportive' | 'growth-oriented' | 'analytical';
  terminology: 'accessible' | 'psychological' | 'astrological';
}

export interface ContentEmphasis {
  homeScreenFocus: string[];
  insightPriority: string[];
  dailyGuidanceStyle: string;
}

export interface JournalingPrompts {
  shadowWork: string[];
  boundary: string[];
  attachment: string[];
  grief: string[];
  connection: string[];
  selfCompassion: string[];
}

export class AdaptiveToneGenerator {
  
  /**
   * Generate adaptive tone configuration based on user intent
   */
  static generateToneConfig(
    intent: UserIntent,
    chart: NatalChart,
    emotionalOS: EmotionalOperatingSystem
  ): AdaptiveToneConfig {
    
    const language = this.generateLanguageStyle(intent);
    const emphasis = this.generateContentEmphasis(intent, chart);
    const prompts = this.generateJournalingPrompts(intent, chart, emotionalOS);
    
    return {
      intent,
      language,
      emphasis,
      prompts
    };
  }
  
  /**
   * Generate language style based on user intent
   */
  private static generateLanguageStyle(intent: UserIntent): LanguageStyle {
    switch (intent) {
      case 'understanding-myself':
        return {
          explanationDepth: 'deep',
          emotionalFraming: 'analytical',
          terminology: 'psychological'
        };
        
      case 'healing':
        return {
          explanationDepth: 'gentle',
          emotionalFraming: 'supportive',
          terminology: 'accessible'
        };
        
      case 'relationships':
        return {
          explanationDepth: 'practical',
          emotionalFraming: 'growth-oriented',
          terminology: 'accessible'
        };
        
      case 'daily-guidance':
        return {
          explanationDepth: 'gentle',
          emotionalFraming: 'supportive',
          terminology: 'accessible'
        };
        
      default:
        return {
          explanationDepth: 'gentle',
          emotionalFraming: 'supportive',
          terminology: 'accessible'
        };
    }
  }
  
  /**
   * Generate content emphasis based on user intent
   */
  private static generateContentEmphasis(intent: UserIntent, chart: NatalChart): ContentEmphasis {
    switch (intent) {
      case 'understanding-myself':
        return {
          homeScreenFocus: [
            'Your Emotional Language',
            'Your Protection Style',
            'Your Inner Child Theme',
            'What Makes You Feel Chosen'
          ],
          insightPriority: [
            'Core personality patterns',
            'Emotional processing style',
            'Inner child needs',
            'Growth opportunities'
          ],
          dailyGuidanceStyle: 'Self-reflection and personal insight focused'
        };
        
      case 'healing':
        return {
          homeScreenFocus: [
            'Your Love Wound',
            'Your Protection Style',
            'What Drains You',
            'Your Repair Style'
          ],
          insightPriority: [
            'Healing opportunities',
            'Trauma-informed patterns',
            'Self-compassion needs',
            'Boundary guidance'
          ],
          dailyGuidanceStyle: 'Gentle healing and self-care focused'
        };
        
      case 'relationships':
        return {
          homeScreenFocus: [
            'How You Show Love',
            'Your Repair Style',
            'What Makes You Feel Chosen',
            'Your Emotional Language'
          ],
          insightPriority: [
            'Relationship patterns',
            'Communication style',
            'Conflict resolution',
            'Love expression'
          ],
          dailyGuidanceStyle: 'Relationship harmony and connection focused'
        };
        
      case 'daily-guidance':
        return {
          homeScreenFocus: [
            'Today\'s Emotional Weather',
            'Where to Be Gentle',
            'One Act of Care',
            'Reflection Prompts'
          ],
          insightPriority: [
            'Daily emotional climate',
            'Current transits',
            'Self-care guidance',
            'Mindfulness prompts'
          ],
          dailyGuidanceStyle: 'Present-moment awareness and daily regulation focused'
        };
        
      default:
        return {
          homeScreenFocus: [
            'Your Emotional Language',
            'Today\'s Guidance',
            'Your Love Style',
            'Growth Opportunities'
          ],
          insightPriority: [
            'Core patterns',
            'Daily guidance',
            'Relationship insights',
            'Personal growth'
          ],
          dailyGuidanceStyle: 'Balanced personal insight and daily guidance'
        };
    }
  }
  
  /**
   * Generate specialized journaling prompts based on intent
   */
  private static generateJournalingPrompts(
    intent: UserIntent,
    chart: NatalChart,
    emotionalOS: EmotionalOperatingSystem
  ): JournalingPrompts {
    
    const basePrompts = this.generateBasePrompts(chart, emotionalOS);
    
    // Customize prompts based on intent
    switch (intent) {
      case 'understanding-myself':
        return {
          ...basePrompts,
          shadowWork: [
            ...basePrompts.shadowWork,
            'What parts of myself do I try to hide from others?',
            'What would I do if I weren\'t afraid of judgment?',
            'What patterns do I repeat that no longer serve me?'
          ]
        };
        
      case 'healing':
        return {
          ...basePrompts,
          selfCompassion: [
            ...basePrompts.selfCompassion,
            'How can I speak to myself with more kindness today?',
            'What would I tell a friend going through what I\'m experiencing?',
            'What small act of self-care would feel nurturing right now?',
            'How can I honor my healing journey today?'
          ],
          grief: [
            ...basePrompts.grief,
            'What am I ready to let go of?',
            'What loss am I still processing?',
            'How can I honor what I\'ve been through?'
          ]
        };
        
      case 'relationships':
        return {
          ...basePrompts,
          connection: [
            ...basePrompts.connection,
            'How do I want to show up in my relationships today?',
            'What do I need to communicate that I\'ve been holding back?',
            'How can I better understand someone important to me?',
            'What relationship pattern am I ready to change?'
          ],
          boundary: [
            ...basePrompts.boundary,
            'Where do I need to set a boundary in my relationships?',
            'What am I saying yes to that I want to say no to?',
            'How can I communicate my needs more clearly?'
          ]
        };
        
      case 'daily-guidance':
        return {
          ...basePrompts,
          selfCompassion: [
            'What do I need to be gentle with myself about today?',
            'How can I support myself through today\'s challenges?',
            'What would feel most nurturing right now?'
          ],
          connection: [
            'How do I want to connect with others today?',
            'What kind of energy do I want to bring to my interactions?',
            'Who might need my care or attention today?'
          ]
        };
        
      default:
        return basePrompts;
    }
  }
  
  /**
   * Generate base prompts from chart and emotional OS
   */
  private static generateBasePrompts(
    chart: NatalChart,
    emotionalOS: EmotionalOperatingSystem
  ): JournalingPrompts {
    
    const moonSign = chart.moon.sign;
    const sunSign = chart.sun.sign;
    const venusSign = chart.venus.sign;
    
    // Shadow work prompts based on challenging aspects
    const shadowWork = this.generateShadowWorkPrompts(chart);
    
    // Boundary prompts based on protection style
    const boundary = this.generateBoundaryPrompts(emotionalOS);
    
    // Attachment prompts based on love wound
    const attachment = this.generateAttachmentPrompts(emotionalOS);
    
    // Grief prompts based on Saturn and challenging aspects
    const grief = this.generateGriefPrompts(chart);
    
    // Connection prompts based on Venus and 7th house
    const connection = this.generateConnectionPrompts(chart);
    
    // Self-compassion prompts based on Moon and inner child
    const selfCompassion = this.generateSelfCompassionPrompts(emotionalOS);
    
    return {
      shadowWork,
      boundary,
      attachment,
      grief,
      connection,
      selfCompassion
    };
  }
  
  /**
   * Generate shadow work prompts from challenging aspects
   */
  private static generateShadowWorkPrompts(chart: NatalChart): string[] {
    const prompts: string[] = [];
    
    const challengingAspects = chart.aspects.filter(a => a.type.nature === 'Challenging');
    
    challengingAspects.forEach(aspect => {
      if (aspect.planet1.name === 'Sun' || aspect.planet2.name === 'Sun') {
        prompts.push('What part of my authentic self do I hide to be accepted?');
      }
      if (aspect.planet1.name === 'Moon' || aspect.planet2.name === 'Moon') {
        prompts.push('What emotions do I judge myself for having?');
      }
      if (aspect.planet1.name === 'Venus' || aspect.planet2.name === 'Venus') {
        prompts.push('What do I believe I need to do to be lovable?');
      }
      if (aspect.planet1.name === 'Mars' || aspect.planet2.name === 'Mars') {
        prompts.push('How do I handle anger in ways that might not serve me?');
      }
    });
    
    // Default shadow work prompts
    if (prompts.length === 0) {
      prompts.push('What would I do if I weren\'t afraid?');
      prompts.push('What pattern keeps showing up in my life?');
    }
    
    return prompts.slice(0, 4);
  }
  
  /**
   * Generate boundary prompts from protection style
   */
  private static generateBoundaryPrompts(emotionalOS: EmotionalOperatingSystem): string[] {
    const protectionStyle = emotionalOS.protectionStyle;
    
    return [
      'Where in my life do I need stronger boundaries?',
      'What am I tolerating that I don\'t want to tolerate?',
      `Given that I feel triggered by ${protectionStyle.triggers[0]}, what boundary would help?`,
      'How can I communicate my limits with kindness but firmness?',
      'What would change if I honored my own needs more?'
    ];
  }
  
  /**
   * Generate attachment prompts from love wound
   */
  private static generateAttachmentPrompts(emotionalOS: EmotionalOperatingSystem): string[] {
    const loveWound = emotionalOS.loveWound;
    
    return [
      'How do I show up in relationships when I feel secure vs. insecure?',
      'What do I do when I feel someone pulling away?',
      'How can I ask for what I need without feeling needy?',
      `Knowing my love wound is about ${loveWound.coreWound.toLowerCase()}, how can I heal this pattern?`,
      'What would love look like if I felt completely safe?'
    ];
  }
  
  /**
   * Generate grief prompts from Saturn and challenging aspects
   */
  private static generateGriefPrompts(chart: NatalChart): string[] {
    const prompts: string[] = [];
    
    const saturnAspects = chart.aspects.filter(a => 
      a.planet1.name === 'Saturn' || a.planet2.name === 'Saturn'
    );
    
    if (saturnAspects.length > 0) {
      prompts.push('What did I have to give up too early in life?');
      prompts.push('What part of my childhood am I still grieving?');
    }
    
    prompts.push('What loss am I still processing?');
    prompts.push('What dream am I ready to let go of?');
    prompts.push('How can I honor what I\'ve been through?');
    
    return prompts.slice(0, 4);
  }
  
  /**
   * Generate connection prompts from Venus and relationships
   */
  private static generateConnectionPrompts(chart: NatalChart): string[] {
    const venusSign = chart.venus.sign;
    
    const prompts = [
      'How do I want to show love today?',
      'What kind of connection am I craving?',
      'How can I be more present in my relationships?',
      'What do I appreciate about the people in my life?'
    ];
    
    // Add Venus-specific prompts
    switch (venusSign.element) {
      case 'Fire':
        prompts.push('How can I bring more enthusiasm to my connections?');
        break;
      case 'Earth':
        prompts.push('How can I show care through practical actions?');
        break;
      case 'Air':
        prompts.push('What important conversation do I need to have?');
        break;
      case 'Water':
        prompts.push('How can I create deeper emotional intimacy?');
        break;
    }
    
    return prompts.slice(0, 5);
  }
  
  /**
   * Generate self-compassion prompts from inner child theme
   */
  private static generateSelfCompassionPrompts(emotionalOS: EmotionalOperatingSystem): string[] {
    const innerChild = emotionalOS.innerChildTheme;
    
    return [
      'How can I speak to myself with more kindness today?',
      'What does my inner child need to hear right now?',
      `Knowing my inner child needed ${innerChild.coreNeed.toLowerCase()}, how can I provide that for myself?`,
      'What would I tell a friend going through what I\'m experiencing?',
      'How can I celebrate myself today, even in small ways?',
      'What act of self-care would feel most nurturing right now?'
    ];
  }
  
  /**
   * Adapt insight language based on tone configuration
   */
  static adaptInsightLanguage(
    originalInsight: string,
    toneConfig: AdaptiveToneConfig,
    context: 'explanation' | 'daily-guidance' | 'relationship'
  ): string {
    
    let adaptedInsight = originalInsight;
    
    // Adjust explanation depth
    if (toneConfig.language.explanationDepth === 'gentle') {
      adaptedInsight = this.makeLanguageGentler(adaptedInsight);
    } else if (toneConfig.language.explanationDepth === 'deep') {
      adaptedInsight = this.makeLanguageDeeper(adaptedInsight);
    }
    
    // Adjust emotional framing
    if (toneConfig.language.emotionalFraming === 'supportive') {
      adaptedInsight = this.makeLanguageSupportive(adaptedInsight);
    } else if (toneConfig.language.emotionalFraming === 'growth-oriented') {
      adaptedInsight = this.makeLanguageGrowthOriented(adaptedInsight);
    }
    
    // Adjust terminology
    if (toneConfig.language.terminology === 'psychological') {
      adaptedInsight = this.addPsychologicalContext(adaptedInsight);
    } else if (toneConfig.language.terminology === 'astrological') {
      adaptedInsight = this.addAstrologicalContext(adaptedInsight);
    }
    
    return adaptedInsight;
  }
  
  /**
   * Make language gentler and more supportive
   */
  private static makeLanguageGentler(text: string): string {
    return text
      .replace(/You are/g, 'You may be')
      .replace(/You have/g, 'You might have')
      .replace(/You will/g, 'You might find')
      .replace(/You must/g, 'You could consider')
      .replace(/You should/g, 'You might want to');
  }
  
  /**
   * Make language deeper and more analytical
   */
  private static makeLanguageDeeper(text: string): string {
    // Add deeper psychological context
    if (text.includes('emotions')) {
      text += ' This pattern likely developed as an adaptive response to early experiences.';
    }
    if (text.includes('relationships')) {
      text += ' Understanding this can help you make more conscious choices in how you connect with others.';
    }
    return text;
  }
  
  /**
   * Make language more supportive and validating
   */
  private static makeLanguageSupportive(text: string): string {
    // Add validating phrases
    const supportivePhrases = [
      'This is completely understandable.',
      'Many people with similar patterns find this helpful.',
      'You\'re not alone in experiencing this.',
      'This awareness is already a step toward growth.'
    ];
    
    const randomPhrase = supportivePhrases[Math.floor(Math.random() * supportivePhrases.length)];
    return text + ' ' + randomPhrase;
  }
  
  /**
   * Make language more growth-oriented
   */
  private static makeLanguageGrowthOriented(text: string): string {
    return text + ' This awareness creates an opportunity for conscious growth and positive change.';
  }
  
  /**
   * Add psychological context
   */
  private static addPsychologicalContext(text: string): string {
    if (text.includes('learned')) {
      return text + ' This represents an adaptive coping mechanism that served you at one time.';
    }
    return text;
  }
  
  /**
   * Add astrological context
   */
  private static addAstrologicalContext(text: string): string {
    return text + ' This pattern is reflected in your natal chart placements and aspects.';
  }
}