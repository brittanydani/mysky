// Relationship insights without compatibility scores
// Focus on understanding, not ranking

import { NatalChart } from './types';
import { EmotionalOperatingSystemGenerator } from './emotionalOperatingSystem';

export interface RelationshipInsight {
  relationshipType: 'romantic' | 'friendship' | 'parent-child' | 'caregiver-child';
  person1: PersonProfile;
  person2: PersonProfile;
  dynamics: RelationshipDynamics;
}

export interface PersonProfile {
  name: string;
  chart: NatalChart;
  howTheyShowLove: string;
  howTheyFeelSafe: string;
  conflictStyle: string;
  repairNeeds: string[];
}

export interface RelationshipDynamics {
  howYouShowLove: string;
  howTheyFeelSafe: string;
  whereYouMisreadEachOther: string[];
  howToRepairConflict: string;
  differentEmotionalPacing: string;
  complementaryStrengths: string[];
  growthOpportunities: string[];
}

export class RelationshipInsightGenerator {
  
  /**
   * Generate relationship insights between two people
   */
  static generateRelationshipInsight(
    person1Chart: NatalChart,
    person2Chart: NatalChart,
    relationshipType: 'romantic' | 'friendship' | 'parent-child' | 'caregiver-child' = 'romantic',
    person1Name: string = 'You',
    person2Name: string = 'They'
  ): RelationshipInsight {
    
    const person1Profile = this.createPersonProfile(person1Chart, person1Name);
    const person2Profile = this.createPersonProfile(person2Chart, person2Name);
    
    const dynamics = this.analyzeDynamics(person1Profile, person2Profile, relationshipType);
    
    return {
      relationshipType,
      person1: person1Profile,
      person2: person2Profile,
      dynamics
    };
  }
  
  /**
   * Create person profile for relationship analysis
   */
  private static createPersonProfile(chart: NatalChart, name: string): PersonProfile {
    const emotionalOS = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
    
    // How they show love (Venus + Mars combination)
    const howTheyShowLove = this.analyzeHowTheyShowLove(chart);
    
    // How they feel safe (Moon + Saturn combination)
    const howTheyFeelSafe = this.analyzeHowTheyFeelSafe(chart);
    
    // Conflict style (Mars + Moon combination)
    const conflictStyle = this.analyzeConflictStyle(chart);
    
    // Repair needs from emotional OS
    const repairNeeds = emotionalOS.repairStyle.repairNeeds;
    
    return {
      name,
      chart,
      howTheyShowLove,
      howTheyFeelSafe,
      conflictStyle,
      repairNeeds
    };
  }
  
  /**
   * Analyze how someone shows love
   */
  private static analyzeHowTheyShowLove(chart: NatalChart): string {
    const venus = chart.venus;
    const mars = chart.mars;
    
    let loveExpression = '';
    
    // Base love expression from Venus sign
    switch (venus.sign.name) {
      case 'Aries':
        loveExpression = 'They show love through bold gestures, initiating plans, and protecting you';
        break;
      case 'Taurus':
        loveExpression = 'They show love through physical affection, practical care, and creating comfort';
        break;
      case 'Gemini':
        loveExpression = 'They show love through communication, sharing ideas, and mental connection';
        break;
      case 'Cancer':
        loveExpression = 'They show love through nurturing, emotional support, and creating home together';
        break;
      case 'Leo':
        loveExpression = 'They show love through grand gestures, celebration, and making you feel special';
        break;
      case 'Virgo':
        loveExpression = 'They show love through acts of service, attention to your needs, and practical help';
        break;
      case 'Libra':
        loveExpression = 'They show love through harmony, beauty, and making everything pleasant for you';
        break;
      case 'Scorpio':
        loveExpression = 'They show love through intense devotion, emotional depth, and unwavering loyalty';
        break;
      case 'Sagittarius':
        loveExpression = 'They show love through adventure, growth experiences, and philosophical sharing';
        break;
      case 'Capricorn':
        loveExpression = 'They show love through commitment, building a future together, and reliable support';
        break;
      case 'Aquarius':
        loveExpression = 'They show love through friendship, intellectual connection, and supporting your uniqueness';
        break;
      case 'Pisces':
        loveExpression = 'They show love through compassion, intuitive understanding, and emotional merging';
        break;
    }
    
    // Add Mars influence for passion/action style
    switch (mars.sign.element) {
      case 'Fire':
        loveExpression += '. They express passion directly and enthusiastically';
        break;
      case 'Earth':
        loveExpression += '. They express passion through consistent, reliable actions';
        break;
      case 'Air':
        loveExpression += '. They express passion through words and mental connection';
        break;
      case 'Water':
        loveExpression += '. They express passion through emotional intensity and intuition';
        break;
    }
    
    return loveExpression;
  }
  
  /**
   * Analyze how someone feels safe in relationships
   */
  private static analyzeHowTheyFeelSafe(chart: NatalChart): string {
    const moon = chart.moon;
    const saturn = chart.saturn;
    
    let safetyNeeds = '';
    
    // Base safety needs from Moon sign
    switch (moon.sign.name) {
      case 'Aries':
        safetyNeeds = 'They feel safe when they have freedom to be themselves and their independence is respected';
        break;
      case 'Taurus':
        safetyNeeds = 'They feel safe with consistency, physical comfort, and material security';
        break;
      case 'Gemini':
        safetyNeeds = 'They feel safe when they can communicate openly and feel mentally understood';
        break;
      case 'Cancer':
        safetyNeeds = 'They feel safe with emotional nurturing, family connection, and a secure home base';
        break;
      case 'Leo':
        safetyNeeds = 'They feel safe when they feel appreciated, celebrated, and their dignity is preserved';
        break;
      case 'Virgo':
        safetyNeeds = 'They feel safe with order, competence acknowledged, and practical support';
        break;
      case 'Libra':
        safetyNeeds = 'They feel safe with harmony, fairness, and when conflict is handled diplomatically';
        break;
      case 'Scorpio':
        safetyNeeds = 'They feel safe with emotional honesty, loyalty, and when trust is built over time';
        break;
      case 'Sagittarius':
        safetyNeeds = 'They feel safe with freedom to grow, philosophical connection, and room for adventure';
        break;
      case 'Capricorn':
        safetyNeeds = 'They feel safe with structure, respect for their competence, and long-term commitment';
        break;
      case 'Aquarius':
        safetyNeeds = 'They feel safe when their uniqueness is accepted and they have emotional freedom';
        break;
      case 'Pisces':
        safetyNeeds = 'They feel safe with compassion, emotional boundaries, and spiritual connection';
        break;
    }
    
    // Add Saturn influence for additional security needs
    const saturnAspects = chart.aspects.filter(a => 
      a.planet1.name === 'Saturn' || a.planet2.name === 'Saturn'
    );
    
    if (saturnAspects.length > 0) {
      safetyNeeds += '. They may also need extra reassurance and time to build trust';
    }
    
    return safetyNeeds;
  }
  
  /**
   * Analyze conflict style
   */
  private static analyzeConflictStyle(chart: NatalChart): string {
    const mars = chart.mars;
    const moon = chart.moon;
    
    let conflictStyle = '';
    
    // Base conflict style from Mars sign
    switch (mars.sign.name) {
      case 'Aries':
        conflictStyle = 'They approach conflict directly and want to resolve things quickly';
        break;
      case 'Taurus':
        conflictStyle = 'They may dig in their heels during conflict and need time to process';
        break;
      case 'Gemini':
        conflictStyle = 'They want to talk through conflicts and understand all perspectives';
        break;
      case 'Cancer':
        conflictStyle = 'They may withdraw emotionally during conflict and need gentle approach';
        break;
      case 'Leo':
        conflictStyle = 'They need their dignity preserved during conflict and appreciate respect';
        break;
      case 'Virgo':
        conflictStyle = 'They want to analyze what went wrong and find practical solutions';
        break;
      case 'Libra':
        conflictStyle = 'They avoid conflict when possible and seek diplomatic solutions';
        break;
      case 'Scorpio':
        conflictStyle = 'They want to get to the root of conflicts and need emotional honesty';
        break;
      case 'Sagittarius':
        conflictStyle = 'They want to understand the bigger picture and may need space to process';
        break;
      case 'Capricorn':
        conflictStyle = 'They prefer structured approaches to conflict and long-term solutions';
        break;
      case 'Aquarius':
        conflictStyle = 'They detach emotionally during conflict and seek innovative solutions';
        break;
      case 'Pisces':
        conflictStyle = 'They may become overwhelmed by conflict and need compassionate approach';
        break;
    }
    
    // Add Moon influence for emotional response
    if (moon.sign.element === 'Water') {
      conflictStyle += '. They may be more emotionally sensitive during conflicts';
    } else if (moon.sign.element === 'Fire') {
      conflictStyle += '. They may have quick emotional reactions during conflicts';
    } else if (moon.sign.element === 'Air') {
      conflictStyle += '. They may want to talk through the emotional aspects of conflicts';
    } else if (moon.sign.element === 'Earth') {
      conflictStyle += '. They may need practical solutions to feel better after conflicts';
    }
    
    return conflictStyle;
  }
  
  /**
   * Analyze relationship dynamics between two people
   */
  private static analyzeDynamics(
    person1: PersonProfile,
    person2: PersonProfile,
    relationshipType: string
  ): RelationshipDynamics {
    
    const howYouShowLove = person1.howTheyShowLove;
    const howTheyFeelSafe = person2.howTheyFeelSafe;
    
    // Analyze potential misreadings
    const whereYouMisreadEachOther = this.analyzeMisreadings(person1, person2);
    
    // Analyze repair approach
    const howToRepairConflict = this.analyzeRepairApproach(person1, person2);
    
    // Analyze emotional pacing differences
    const differentEmotionalPacing = this.analyzeEmotionalPacing(person1, person2);
    
    // Find complementary strengths
    const complementaryStrengths = this.findComplementaryStrengths(person1, person2);
    
    // Identify growth opportunities
    const growthOpportunities = this.identifyGrowthOpportunities(person1, person2, relationshipType);
    
    return {
      howYouShowLove,
      howTheyFeelSafe,
      whereYouMisreadEachOther,
      howToRepairConflict,
      differentEmotionalPacing,
      complementaryStrengths,
      growthOpportunities
    };
  }
  
  /**
   * Analyze where people might misread each other
   */
  private static analyzeMisreadings(person1: PersonProfile, person2: PersonProfile): string[] {
    const misreadings: string[] = [];
    
    const person1Venus = person1.chart.venus.sign;
    const person1Mars = person1.chart.mars.sign;
    const person1Moon = person1.chart.moon.sign;
    
    const person2Venus = person2.chart.venus.sign;
    const person2Mars = person2.chart.mars.sign;
    const person2Moon = person2.chart.moon.sign;
    
    // Venus-Mars misreadings (love expression vs. action style)
    if (person1Venus.element === 'Fire' && person2Mars.element === 'Earth') {
      misreadings.push('You might see their steady approach as lack of passion, while they might see your enthusiasm as impatience');
    }
    
    if (person1Venus.element === 'Air' && person2Moon.element === 'Water') {
      misreadings.push('You might intellectualize emotions while they need deeper emotional connection');
    }
    
    if (person1Venus.element === 'Earth' && person2Venus.element === 'Air') {
      misreadings.push('You might show love through practical actions while they prefer verbal affection');
    }
    
    if (person1Moon.element === 'Water' && person2Mars.element === 'Fire') {
      misreadings.push('You might need emotional processing time while they want to act quickly');
    }
    
    // Element clashes
    if (person1Moon.element === 'Fire' && person2Moon.element === 'Water') {
      misreadings.push('Your direct emotional expression might feel overwhelming to their sensitive nature');
    }
    
    if (person1Moon.element === 'Earth' && person2Moon.element === 'Air') {
      misreadings.push('You might need concrete emotional security while they need mental connection');
    }
    
    // Modality differences
    if (person1Moon.modality === 'Cardinal' && person2Moon.modality === 'Fixed') {
      misreadings.push('You might want to initiate emotional changes while they prefer emotional stability');
    }
    
    if (person1Mars.modality === 'Mutable' && person2Mars.modality === 'Fixed') {
      misreadings.push('You might be flexible in conflict while they prefer consistent approaches');
    }
    
    // Default if no specific patterns found
    if (misreadings.length === 0) {
      misreadings.push('You might have different pacing in emotional expression');
      misreadings.push('You might show care in ways the other doesn\'t immediately recognize');
    }
    
    return misreadings.slice(0, 3); // Limit to most relevant
  }
  
  /**
   * Analyze how to repair conflicts between two people
   */
  private static analyzeRepairApproach(person1: PersonProfile, person2: PersonProfile): string {
    const person1Mars = person1.chart.mars.sign;
    const person2Mars = person2.chart.mars.sign;
    const person1Moon = person1.chart.moon.sign;
    const person2Moon = person2.chart.moon.sign;
    
    let repairApproach = '';
    
    // Consider both people's repair needs
    const person1Needs = person1.repairNeeds[0] || 'understanding';
    const person2Needs = person2.repairNeeds[0] || 'understanding';
    
    // Fire-Water repair
    if ((person1Mars.element === 'Fire' && person2Moon.element === 'Water') ||
        (person1Moon.element === 'Water' && person2Mars.element === 'Fire')) {
      repairApproach = `Start with emotional acknowledgment (${person2Needs}), then move to action-oriented solutions (${person1Needs})`;
    }
    
    // Earth-Air repair
    else if ((person1Mars.element === 'Earth' && person2Moon.element === 'Air') ||
             (person1Moon.element === 'Air' && person2Mars.element === 'Earth')) {
      repairApproach = `Begin with clear communication (${person2Needs}), then follow through with practical actions (${person1Needs})`;
    }
    
    // Same element repair
    else if (person1Mars.element === person2Mars.element) {
      switch (person1Mars.element) {
        case 'Fire':
          repairApproach = 'Address conflicts directly and quickly, then reconnect through shared activity';
          break;
        case 'Earth':
          repairApproach = 'Take time to cool down, then repair through practical gestures and consistency';
          break;
        case 'Air':
          repairApproach = 'Talk through the issue thoroughly, ensuring both perspectives are heard';
          break;
        case 'Water':
          repairApproach = 'Create emotional safety first, then reconnect through empathy and understanding';
          break;
      }
    }
    
    // Default repair approach
    else {
      repairApproach = `Honor both your need for ${person1Needs} and their need for ${person2Needs}, finding a middle ground that addresses both`;
    }
    
    return repairApproach;
  }
  
  /**
   * Analyze different emotional pacing
   */
  private static analyzeEmotionalPacing(person1: PersonProfile, person2: PersonProfile): string {
    const person1Moon = person1.chart.moon.sign;
    const person2Moon = person2.chart.moon.sign;
    
    let pacingDifference = '';
    
    // Modality-based pacing
    if (person1Moon.modality === 'Cardinal' && person2Moon.modality === 'Fixed') {
      pacingDifference = 'You may want to process emotions quickly and move forward, while they prefer to take time and stay with feelings longer';
    } else if (person1Moon.modality === 'Fixed' && person2Moon.modality === 'Mutable') {
      pacingDifference = 'You may prefer emotional consistency and depth, while they adapt and change emotional focus more easily';
    } else if (person1Moon.modality === 'Mutable' && person2Moon.modality === 'Cardinal') {
      pacingDifference = 'You may be flexible with emotional processing, while they prefer to take initiative in emotional situations';
    }
    
    // Element-based pacing
    else if (person1Moon.element === 'Fire' && person2Moon.element === 'Water') {
      pacingDifference = 'You may process emotions quickly and directly, while they need more time for deep emotional processing';
    } else if (person1Moon.element === 'Air' && person2Moon.element === 'Earth') {
      pacingDifference = 'You may want to talk through emotions quickly, while they prefer to process feelings slowly and practically';
    }
    
    // Same pacing
    else if (person1Moon.modality === person2Moon.modality) {
      pacingDifference = 'You likely have similar emotional pacing, which can create natural understanding';
    }
    
    // Default
    else {
      pacingDifference = 'You may have different natural rhythms for emotional processing, which can be complementary when understood';
    }
    
    return pacingDifference;
  }
  
  /**
   * Find complementary strengths
   */
  private static findComplementaryStrengths(person1: PersonProfile, person2: PersonProfile): string[] {
    const strengths: string[] = [];
    
    const person1Sun = person1.chart.sun.sign;
    const person1Moon = person1.chart.moon.sign;
    const person2Sun = person2.chart.sun.sign;
    const person2Moon = person2.chart.moon.sign;
    
    // Element complementarity
    if (person1Sun.element === 'Fire' && person2Sun.element === 'Air') {
      strengths.push('Your enthusiasm inspires their ideas, while their communication skills help express your vision');
    }
    
    if (person1Sun.element === 'Earth' && person2Sun.element === 'Water') {
      strengths.push('Your practical grounding supports their emotional depth, while their intuition guides your decisions');
    }
    
    if (person1Moon.element === 'Fire' && person2Moon.element === 'Earth') {
      strengths.push('Your emotional spontaneity brings excitement, while their emotional stability provides security');
    }
    
    if (person1Moon.element === 'Air' && person2Moon.element === 'Water') {
      strengths.push('Your emotional clarity helps them understand feelings, while their emotional depth enriches your perspective');
    }
    
    // Modality complementarity
    if (person1Sun.modality === 'Cardinal' && person2Sun.modality === 'Fixed') {
      strengths.push('You initiate new directions while they provide the persistence to see things through');
    }
    
    if (person1Sun.modality === 'Mutable' && person2Sun.modality === 'Cardinal') {
      strengths.push('You adapt and refine their initiatives, while they provide direction for your flexibility');
    }
    
    // Default strengths
    if (strengths.length === 0) {
      strengths.push('You each bring unique perspectives that can enrich the relationship');
      strengths.push('Your different approaches can create a more complete understanding together');
    }
    
    return strengths.slice(0, 3); // Limit to most relevant
  }
  
  /**
   * Identify growth opportunities
   */
  private static identifyGrowthOpportunities(
    person1: PersonProfile,
    person2: PersonProfile,
    relationshipType: string
  ): string[] {
    const opportunities: string[] = [];
    
    const person1Moon = person1.chart.moon.sign;
    const person2Moon = person2.chart.moon.sign;
    
    // Growth through element differences
    if (person1Moon.element === 'Fire' && person2Moon.element === 'Water') {
      opportunities.push('Learning to balance action with emotional depth');
      opportunities.push('Developing patience for different emotional processing styles');
    }
    
    if (person1Moon.element === 'Air' && person2Moon.element === 'Earth') {
      opportunities.push('Integrating mental understanding with practical application');
      opportunities.push('Learning to value both ideas and concrete results');
    }
    
    // Growth through challenging aspects
    const person1ChallengingAspects = person1.chart.aspects.filter(a => a.type.nature === 'Challenging');
    const person2ChallengingAspects = person2.chart.aspects.filter(a => a.type.nature === 'Challenging');
    
    if (person1ChallengingAspects.length > 0 || person2ChallengingAspects.length > 0) {
      opportunities.push('Supporting each other through personal growth challenges');
      opportunities.push('Learning to be patient with each other\'s healing process');
    }
    
    // Relationship-type specific opportunities
    switch (relationshipType) {
      case 'romantic':
        opportunities.push('Deepening intimacy through understanding each other\'s emotional languages');
        break;
      case 'friendship':
        opportunities.push('Building trust through accepting each other\'s different approaches');
        break;
      case 'parent-child':
        opportunities.push('Learning to honor both guidance and independence needs');
        break;
      case 'caregiver-child':
        opportunities.push('Balancing care with respect for individual emotional needs');
        break;
    }
    
    // Default opportunities
    if (opportunities.length === 0) {
      opportunities.push('Learning to appreciate different emotional styles');
      opportunities.push('Growing through understanding each other\'s perspectives');
    }
    
    return opportunities.slice(0, 3); // Limit to most relevant
  }
}