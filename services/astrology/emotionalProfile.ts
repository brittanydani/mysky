// Rule-based emotional interpretation system
// This layer translates astronomical data into meaningful, consistent emotional insights

import { 
  NatalChart, 
  PlanetPlacement, 
  EmotionalPattern, 
  PlacementRule,
  DailyEmotionalWeather,
  TransitData
} from './types';
import { ChartDisplayManager } from './chartDisplayManager';
import { PLANETS, ZODIAC_SIGNS, ELEMENT_MEANINGS, MODALITY_MEANINGS, HOUSE_MEANINGS } from './constants';

export class EmotionalProfileGenerator {
  
  /**
   * Generate complete emotional profile from natal chart
   */
  static generateEmotionalProfile(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    
    // Core emotional patterns based on Moon
    patterns.push(...this.analyzeMoonPatterns(chart));
    
    // Love and relationship patterns based on Venus
    patterns.push(...this.analyzeVenusPatterns(chart));
    
    // Stress and conflict patterns based on Mars and Saturn
    patterns.push(...this.analyzeStressPatterns(chart));
    
    // Communication patterns based on Mercury
    patterns.push(...this.analyzeCommunicationPatterns(chart));
    
    // Identity and self-expression patterns based on Sun and Ascendant
    patterns.push(...this.analyzeIdentityPatterns(chart));
    
    // Growth and expansion patterns based on Jupiter
    patterns.push(...this.analyzeGrowthPatterns(chart));
    
    const filtered = ChartDisplayManager.hideTimeBasedInterpretations(chart, patterns);
    return filtered.sort((a, b) => b.intensity - a.intensity);
  }
  
  /**
   * Analyze Moon patterns for emotional processing
   */
  private static analyzeMoonPatterns(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    const moon = chart.moon;
    
    // Base Moon sign pattern
    const moonSignPattern = this.createMoonSignPattern(moon);
    patterns.push(moonSignPattern);
    
    // Moon house pattern
    const moonHousePattern = this.createMoonHousePattern(moon);
    patterns.push(moonHousePattern);
    
    // Moon aspects patterns
    const moonAspects = chart.aspects.filter(a => 
      a.planet1.name === 'Moon' || a.planet2.name === 'Moon'
    );
    
    moonAspects.forEach(aspect => {
      const aspectPattern = this.createMoonAspectPattern(aspect, moon);
      if (aspectPattern) patterns.push(aspectPattern);
    });
    
    return patterns;
  }
  
  /**
   * Create emotional pattern based on Moon sign
   */
  private static createMoonSignPattern(moon: PlanetPlacement): EmotionalPattern {
    const sign = moon.sign;
    const element = sign.element;
    const modality = sign.modality;
    
    let description = '';
    let themes: string[] = [];
    let intensity = 0.8; // Moon patterns are always significant
    
    // Element-based emotional processing
    switch (element) {
      case 'Fire':
        description = 'You may process emotions through action and expression. When feelings arise, you might feel called to do something about them rather than sit with them quietly.';
        themes = ['expressive emotions', 'action-oriented processing', 'enthusiasm', 'quick emotional responses'];
        break;
      case 'Earth':
        description = 'You may process emotions through practical action and physical comfort. You might find that tangible activities help you work through feelings.';
        themes = ['practical emotional processing', 'physical comfort needs', 'steady emotional responses', 'material security'];
        break;
      case 'Air':
        description = 'You may process emotions through thinking and talking. Understanding and communicating your feelings might be important for your emotional wellbeing.';
        themes = ['intellectual processing', 'communication needs', 'social emotional support', 'mental clarity'];
        break;
      case 'Water':
        description = 'You may experience emotions deeply and intuitively. Your feelings might be complex and changeable, like the tides.';
        themes = ['deep emotional sensitivity', 'intuitive processing', 'empathic responses', 'emotional complexity'];
        break;
    }
    
    // Modality modifications
    switch (modality) {
      case 'Cardinal':
        description += ' You might prefer to take initiative when dealing with emotional situations.';
        themes.push('emotional leadership');
        break;
      case 'Fixed':
        description += ' You may prefer emotional consistency and might need time to process changes in feelings.';
        themes.push('emotional stability');
        break;
      case 'Mutable':
        description += ' Your emotions might be adaptable and changeable, flowing with circumstances.';
        themes.push('emotional flexibility');
        break;
    }
    
    // Sign-specific additions
    switch (sign.name) {
      case 'Cancer':
        description += ' Home and family connections may be especially important for your emotional wellbeing.';
        themes.push('family bonds', 'nurturing needs');
        intensity = 0.9; // Moon in its own sign
        break;
      case 'Scorpio':
        description += ' You may experience emotions with particular intensity and depth.';
        themes.push('emotional intensity', 'transformative feelings');
        break;
      case 'Pisces':
        description += ' You might be especially sensitive to the emotional atmosphere around you.';
        themes.push('emotional sensitivity', 'boundary challenges');
        break;
      case 'Capricorn':
        description += ' You may have learned to be cautious with emotional expression, preferring to feel secure before opening up.';
        themes.push('emotional caution', 'structured feelings');
        break;
    }
    
    return {
      id: `moon_${sign.name.toLowerCase()}`,
      name: `Moon in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.moon,
        sign: sign,
        weight: 1.0
      }],
      intensity,
      themes
    };
  }
  
  /**
   * Create emotional pattern based on Moon house
   */
  private static createMoonHousePattern(moon: PlanetPlacement): EmotionalPattern {
    const house = moon.house;
    const houseInfo = HOUSE_MEANINGS[house as keyof typeof HOUSE_MEANINGS];
    
    let description = '';
    let themes: string[] = [];
    
    switch (house) {
      case 1:
        description = 'Your emotions may be readily visible to others. You might wear your heart on your sleeve and process feelings through self-expression.';
        themes = ['visible emotions', 'emotional authenticity', 'feeling-based identity'];
        break;
      case 4:
        description = 'Home, family, and your roots may be central to your emotional wellbeing. You might need a secure base to feel emotionally safe.';
        themes = ['family emotions', 'home security', 'ancestral patterns'];
        break;
      case 7:
        description = 'Relationships may be where you most clearly experience and understand your emotions. You might process feelings through connection with others.';
        themes = ['relational emotions', 'partnership feelings', 'emotional mirroring'];
        break;
      case 10:
        description = 'Your emotional life might be connected to your public role or career. You may be known for your emotional intelligence or caring nature.';
        themes = ['public emotions', 'professional caring', 'emotional reputation'];
        break;
      case 12:
        description = 'You may have a rich inner emotional life that others don\'t always see. Your feelings might be complex and sometimes hard to understand.';
        themes = ['hidden emotions', 'subconscious feelings', 'spiritual emotions'];
        break;
      default:
        description = `Your emotional life may be expressed through ${houseInfo?.theme.toLowerCase() || 'this life area'}. ${houseInfo?.keywords.join(', ')} might be important for your emotional wellbeing.`;
        themes = houseInfo?.keywords || [];
    }
    
    return {
      id: `moon_house_${house}`,
      name: `Moon in ${houseInfo?.name || `House ${house}`}`,
      description,
      triggers: [{
        planet: PLANETS.moon,
        house: house,
        weight: 0.7
      }],
      intensity: 0.6,
      themes
    };
  }
  
  /**
   * Create emotional pattern based on Moon aspects
   */
  private static createMoonAspectPattern(aspect: any, moon: PlanetPlacement): EmotionalPattern | null {
    const otherPlanet = aspect.planet1.name === 'Moon' ? aspect.planet2 : aspect.planet1;
    const aspectType = aspect.type;
    const isHarmonious = aspectType.nature === 'Harmonious';
    const isChallenging = aspectType.nature === 'Challenging';
    
    let description = '';
    let themes: string[] = [];
    let intensity = aspect.strength * 0.7;
    
    // Moon-Saturn aspects
    if (otherPlanet.name === 'Saturn') {
      if (isChallenging) {
        description = 'You may have learned to be cautious with emotional expression. There might be a part of you that feels you need to earn emotional safety or approval.';
        themes = ['emotional caution', 'self-protection', 'earned security'];
      } else {
        description = 'You may have a natural ability to create emotional stability and security. Your feelings might be grounded and reliable.';
        themes = ['emotional stability', 'grounded feelings', 'reliable emotions'];
      }
    }
    
    // Moon-Venus aspects
    else if (otherPlanet.name === 'Venus') {
      if (isHarmonious) {
        description = 'You may have a natural ability to create emotional harmony and beauty in your life. Love and aesthetics might be soothing to you.';
        themes = ['emotional harmony', 'aesthetic sensitivity', 'loving feelings'];
      } else {
        description = 'You might sometimes feel tension between your emotional needs and your desire for harmony. Learning to balance these can be part of your growth.';
        themes = ['emotional-love tension', 'harmony challenges', 'value conflicts'];
      }
    }
    
    // Moon-Mars aspects
    else if (otherPlanet.name === 'Mars') {
      if (isChallenging) {
        description = 'Your emotions might be intense and quick to arise. You may feel things strongly and need healthy outlets for emotional energy.';
        themes = ['intense emotions', 'quick feelings', 'emotional energy'];
      } else {
        description = 'You may have good access to your emotional energy and the ability to act on your feelings in healthy ways.';
        themes = ['emotional courage', 'feeling-action harmony', 'emotional strength'];
      }
    }
    
    // Moon-Neptune aspects
    else if (otherPlanet.name === 'Neptune') {
      description = 'You may be especially sensitive to subtle emotional currents and atmospheres. Your intuition about feelings might be particularly strong.';
      themes = ['emotional sensitivity', 'intuitive feelings', 'psychic emotions'];
      if (isChallenging) {
        description += ' Sometimes you might absorb others\' emotions without realizing it.';
        themes.push('emotional boundaries');
      }
    }
    
    // Moon-Pluto aspects
    else if (otherPlanet.name === 'Pluto') {
      description = 'Your emotional life may be intense and transformative. You might experience feelings deeply and have the capacity for profound emotional healing.';
      themes = ['emotional intensity', 'transformative feelings', 'deep emotions'];
      if (isChallenging) {
        description += ' Sometimes emotions might feel overwhelming, but they often lead to important insights.';
        themes.push('emotional overwhelm', 'healing potential');
      }
    }
    
    else {
      // Generic aspect pattern
      return null;
    }
    
    return {
      id: `moon_${otherPlanet.name.toLowerCase()}_${aspectType.name.toLowerCase()}`,
      name: `Moon ${aspectType.name} ${otherPlanet.name}`,
      description,
      triggers: [{
        planet: PLANETS.moon,
        aspect: {
          planet: otherPlanet,
          type: aspectType
        },
        weight: aspect.strength
      }],
      intensity,
      themes
    };
  }
  
  /**
   * Analyze Venus patterns for love and relationships
   */
  private static analyzeVenusPatterns(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    const venus = chart.venus;
    
    // Venus sign pattern
    patterns.push(this.createVenusSignPattern(venus));
    
    // Venus house pattern
    patterns.push(this.createVenusHousePattern(venus));
    
    return patterns;
  }
  
  private static createVenusSignPattern(venus: PlanetPlacement): EmotionalPattern {
    const sign = venus.sign;
    let description = '';
    let themes: string[] = [];
    
    switch (sign.element) {
      case 'Fire':
        description = 'In relationships, you may appreciate directness, enthusiasm, and shared adventures. You might be drawn to people who inspire and energize you.';
        themes = ['enthusiastic love', 'adventurous relationships', 'inspiring connections'];
        break;
      case 'Earth':
        description = 'In relationships, you may value stability, reliability, and practical expressions of care. Actions might speak louder than words for you.';
        themes = ['stable relationships', 'practical love', 'reliable connections'];
        break;
      case 'Air':
        description = 'In relationships, you may value communication, intellectual connection, and social harmony. Mental compatibility might be important to you.';
        themes = ['intellectual love', 'communicative relationships', 'social connections'];
        break;
      case 'Water':
        description = 'In relationships, you may value emotional depth, intuitive understanding, and empathic connection. Feeling understood might be especially important.';
        themes = ['emotional love', 'intuitive relationships', 'empathic connections'];
        break;
    }
    
    return {
      id: `venus_${sign.name.toLowerCase()}`,
      name: `Venus in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.venus,
        sign: sign,
        weight: 0.8
      }],
      intensity: 0.7,
      themes
    };
  }
  
  private static createVenusHousePattern(venus: PlanetPlacement): EmotionalPattern {
    const house = venus.house;
    let description = '';
    let themes: string[] = [];
    
    switch (house) {
      case 1:
        description = 'You may naturally express warmth and charm in how you present yourself. Others might find you approachable and attractive.';
        themes = ['natural charm', 'attractive presence', 'warm expression'];
        break;
      case 7:
        description = 'Partnerships and close relationships may be central to your sense of harmony and wellbeing. You might be naturally gifted at creating balance in relationships.';
        themes = ['partnership focus', 'relationship harmony', 'cooperative love'];
        break;
      case 10:
        description = 'You might be known for your aesthetic sense, diplomatic skills, or ability to create harmony in professional settings.';
        themes = ['professional charm', 'aesthetic reputation', 'diplomatic skills'];
        break;
      default:
        const houseInfo = HOUSE_MEANINGS[house as keyof typeof HOUSE_MEANINGS];
        description = `You may find beauty, harmony, and connection through ${houseInfo?.theme.toLowerCase() || 'this life area'}.`;
        themes = ['beauty', 'harmony', ...(houseInfo?.keywords || [])];
    }
    
    return {
      id: `venus_house_${house}`,
      name: `Venus in House ${house}`,
      description,
      triggers: [{
        planet: PLANETS.venus,
        house: house,
        weight: 0.6
      }],
      intensity: 0.5,
      themes
    };
  }
  
  /**
   * Analyze stress and conflict patterns
   */
  private static analyzeStressPatterns(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    
    // Mars patterns for anger and assertion
    patterns.push(this.createMarsPattern(chart.mars));
    
    // Saturn patterns for restriction and responsibility
    patterns.push(this.createSaturnPattern(chart.saturn));
    
    // Challenging aspects that create stress
    const challengingAspects = chart.aspects.filter(a => a.type.nature === 'Challenging');
    challengingAspects.forEach(aspect => {
      const stressPattern = this.createStressAspectPattern(aspect);
      if (stressPattern) patterns.push(stressPattern);
    });
    
    return patterns;
  }
  
  private static createMarsPattern(mars: PlanetPlacement): EmotionalPattern {
    const sign = mars.sign;
    let description = '';
    let themes: string[] = [];
    
    switch (sign.element) {
      case 'Fire':
        description = 'When frustrated or angry, you may respond quickly and directly. You might prefer to address conflicts head-on rather than let them simmer.';
        themes = ['direct anger', 'quick responses', 'confrontational style'];
        break;
      case 'Earth':
        description = 'When frustrated, you may prefer practical action over emotional expression. You might work through anger by doing something productive.';
        themes = ['practical anger', 'productive responses', 'steady assertion'];
        break;
      case 'Air':
        description = 'When frustrated, you may want to talk through the situation or understand it intellectually. Communication might be your preferred way to resolve conflicts.';
        themes = ['verbal anger', 'intellectual responses', 'communicative conflict'];
        break;
      case 'Water':
        description = 'When frustrated, your emotions might run deep. You may need time to process anger and might prefer indirect approaches to conflict.';
        themes = ['emotional anger', 'deep responses', 'indirect conflict'];
        break;
    }
    
    return {
      id: `mars_${sign.name.toLowerCase()}`,
      name: `Mars in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.mars,
        sign: sign,
        weight: 0.7
      }],
      intensity: 0.6,
      themes
    };
  }
  
  private static createSaturnPattern(saturn: PlanetPlacement): EmotionalPattern {
    const sign = saturn.sign;
    const house = saturn.house;
    
    let description = 'You may have learned to be particularly responsible or cautious in certain areas of life. ';
    let themes: string[] = ['responsibility', 'caution', 'structure'];
    
    // Add house-specific Saturn themes
    const houseInfo = HOUSE_MEANINGS[house as keyof typeof HOUSE_MEANINGS];
    if (houseInfo) {
      description += `This might show up especially around ${houseInfo.theme.toLowerCase()}.`;
      themes.push(...houseInfo.keywords);
    }
    
    return {
      id: `saturn_${sign.name.toLowerCase()}_house_${house}`,
      name: `Saturn in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.saturn,
        sign: sign,
        house: house,
        weight: 0.6
      }],
      intensity: 0.5,
      themes
    };
  }
  
  private static createStressAspectPattern(aspect: any): EmotionalPattern | null {
    // Only create patterns for major challenging aspects
    if (aspect.strength < 0.5) return null;
    
    const planet1 = aspect.planet1;
    const planet2 = aspect.planet2;
    const aspectType = aspect.type;
    
    let description = '';
    let themes: string[] = [];
    
    // Sun-Saturn challenging aspects
    if ((planet1.name === 'Sun' && planet2.name === 'Saturn') || 
        (planet1.name === 'Saturn' && planet2.name === 'Sun')) {
      description = 'You may sometimes feel tension between your desire for self-expression and your sense of responsibility or caution. Learning to balance these can be part of your growth.';
      themes = ['self-expression tension', 'responsibility conflicts', 'authority issues'];
    }
    
    // Moon-Saturn challenging aspects
    else if ((planet1.name === 'Moon' && planet2.name === 'Saturn') || 
             (planet1.name === 'Saturn' && planet2.name === 'Moon')) {
      description = 'You may have learned to be cautious with emotional expression. There might be a part of you that feels you need to earn emotional safety or approval.';
      themes = ['emotional caution', 'self-protection', 'earned security'];
    }
    
    else {
      return null; // Don't create patterns for other aspects yet
    }
    
    return {
      id: `stress_${planet1.name.toLowerCase()}_${planet2.name.toLowerCase()}_${aspectType.name.toLowerCase()}`,
      name: `${planet1.name} ${aspectType.name} ${planet2.name}`,
      description,
      triggers: [{
        aspect: {
          planet: planet1,
          type: aspectType
        },
        weight: aspect.strength
      }],
      intensity: aspect.strength * 0.6,
      themes
    };
  }
  
  /**
   * Analyze communication patterns based on Mercury
   */
  private static analyzeCommunicationPatterns(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    const mercury = chart.mercury;
    
    patterns.push(this.createMercuryPattern(mercury));
    
    return patterns;
  }
  
  private static createMercuryPattern(mercury: PlanetPlacement): EmotionalPattern {
    const sign = mercury.sign;
    let description = '';
    let themes: string[] = [];
    
    switch (sign.element) {
      case 'Fire':
        description = 'You may communicate with enthusiasm and directness. Your thinking might be quick and action-oriented.';
        themes = ['enthusiastic communication', 'direct thinking', 'quick mental processing'];
        break;
      case 'Earth':
        description = 'You may prefer practical, concrete communication. Your thinking might be methodical and focused on useful information.';
        themes = ['practical communication', 'concrete thinking', 'methodical processing'];
        break;
      case 'Air':
        description = 'You may enjoy intellectual discussions and sharing ideas. Your thinking might be quick and socially oriented.';
        themes = ['intellectual communication', 'social thinking', 'idea sharing'];
        break;
      case 'Water':
        description = 'You may communicate with emotional sensitivity and intuition. Your thinking might be influenced by feelings and atmosphere.';
        themes = ['intuitive communication', 'emotional thinking', 'sensitive processing'];
        break;
    }
    
    return {
      id: `mercury_${sign.name.toLowerCase()}`,
      name: `Mercury in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.mercury,
        sign: sign,
        weight: 0.6
      }],
      intensity: 0.5,
      themes
    };
  }
  
  /**
   * Analyze identity patterns based on Sun and Ascendant
   */
  private static analyzeIdentityPatterns(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    
    patterns.push(this.createSunPattern(chart.sun));
    patterns.push(this.createAscendantPattern(chart.ascendant));
    
    return patterns;
  }
  
  private static createSunPattern(sun: PlanetPlacement): EmotionalPattern {
    const sign = sun.sign;
    let description = `Your core sense of self may be expressed through ${sign.element.toLowerCase()} energy. `;
    let themes: string[] = [sign.element.toLowerCase() + ' identity'];
    
    switch (sign.element) {
      case 'Fire':
        description += 'You might feel most yourself when you\'re taking action, inspiring others, or pursuing new experiences.';
        themes.push('action-oriented identity', 'inspiring presence');
        break;
      case 'Earth':
        description += 'You might feel most yourself when you\'re building something tangible, being practical, or creating stability.';
        themes.push('practical identity', 'stable presence');
        break;
      case 'Air':
        description += 'You might feel most yourself when you\'re connecting with others, sharing ideas, or learning new things.';
        themes.push('intellectual identity', 'social presence');
        break;
      case 'Water':
        description += 'You might feel most yourself when you\'re connecting emotionally, helping others, or exploring your inner world.';
        themes.push('emotional identity', 'intuitive presence');
        break;
    }
    
    return {
      id: `sun_${sign.name.toLowerCase()}`,
      name: `Sun in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.sun,
        sign: sign,
        weight: 0.9
      }],
      intensity: 0.8,
      themes
    };
  }
  
  private static createAscendantPattern(ascendant: PlanetPlacement): EmotionalPattern {
    const sign = ascendant.sign;
    let description = `Others may first notice your ${sign.element.toLowerCase()} energy when they meet you. `;
    let themes: string[] = [sign.element.toLowerCase() + ' presentation'];
    
    switch (sign.element) {
      case 'Fire':
        description += 'You might come across as energetic, confident, or enthusiastic.';
        themes.push('energetic presence', 'confident appearance');
        break;
      case 'Earth':
        description += 'You might come across as grounded, reliable, or practical.';
        themes.push('grounded presence', 'reliable appearance');
        break;
      case 'Air':
        description += 'You might come across as friendly, curious, or communicative.';
        themes.push('friendly presence', 'communicative appearance');
        break;
      case 'Water':
        description += 'You might come across as sensitive, intuitive, or emotionally aware.';
        themes.push('sensitive presence', 'intuitive appearance');
        break;
    }
    
    return {
      id: `ascendant_${sign.name.toLowerCase()}`,
      name: `${sign.name} Rising`,
      description,
      triggers: [{
        planet: PLANETS.ascendant,
        sign: sign,
        weight: 0.7
      }],
      intensity: 0.6,
      themes
    };
  }
  
  /**
   * Analyze growth patterns based on Jupiter
   */
  private static analyzeGrowthPatterns(chart: NatalChart): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = [];
    const jupiter = chart.jupiter;
    
    patterns.push(this.createJupiterPattern(jupiter));
    
    return patterns;
  }
  
  private static createJupiterPattern(jupiter: PlanetPlacement): EmotionalPattern {
    const sign = jupiter.sign;
    const house = jupiter.house;
    
    let description = 'You may find growth and expansion through ';
    let themes: string[] = ['growth', 'expansion', 'optimism'];
    
    switch (sign.element) {
      case 'Fire':
        description += 'taking bold action, inspiring others, and pursuing adventures.';
        themes.push('adventurous growth', 'inspiring expansion');
        break;
      case 'Earth':
        description += 'practical learning, building skills, and creating tangible results.';
        themes.push('practical growth', 'skill building');
        break;
      case 'Air':
        description += 'learning new ideas, connecting with diverse people, and sharing knowledge.';
        themes.push('intellectual growth', 'social expansion');
        break;
      case 'Water':
        description += 'emotional understanding, spiritual exploration, and helping others.';
        themes.push('emotional growth', 'spiritual expansion');
        break;
    }
    
    const houseInfo = HOUSE_MEANINGS[house as keyof typeof HOUSE_MEANINGS];
    if (houseInfo) {
      description += ` This might be especially true in areas related to ${houseInfo.theme.toLowerCase()}.`;
      themes.push(...houseInfo.keywords);
    }
    
    return {
      id: `jupiter_${sign.name.toLowerCase()}_house_${house}`,
      name: `Jupiter in ${sign.name}`,
      description,
      triggers: [{
        planet: PLANETS.jupiter,
        sign: sign,
        house: house,
        weight: 0.6
      }],
      intensity: 0.5,
      themes
    };
  }
}
