// Emotional Operating System - Reframes astrology as psychological patterns
// This is MySky's unique differentiator: astrology as emotional intelligence

import { 
  NatalChart, 
  PlanetPlacement, 
  Aspect
} from './types';
import { PLANETS, ZODIAC_SIGNS } from './constants';
import { UnknownTimeHandler } from './unknownTimeHandler';

export interface EmotionalOperatingSystem {
  emotionalLanguage: EmotionalLanguage;
  protectionStyle: ProtectionStyle;
  drainingSituations: string[];
  feelingChosenTriggers: string[];
  loveWound: LoveWound;
  repairStyle: RepairStyle;
  innerChildTheme: InnerChildTheme;
}

export interface EmotionalLanguage {
  primaryMode: string; // How they process emotions
  expression: string; // How they show emotions
  needsToFeel: string; // What they need to feel safe
  overwhelmSigns: string[]; // How to recognize overwhelm
}

export interface ProtectionStyle {
  primaryDefense: string; // Main protective mechanism
  triggers: string[]; // What activates protection
  safetyNeeds: string[]; // What helps them feel safe
  gentleApproach: string; // How to approach them when guarded
}

export interface LoveWound {
  coreWound: string; // Primary love wound
  howItShows: string; // How it manifests in relationships
  healingPath: string; // Path toward healing
  greenFlags: string[]; // Signs of healthy love for them
}

export interface RepairStyle {
  conflictResponse: string; // How they handle conflict
  repairNeeds: string[]; // What they need after conflict
  apologyStyle: string; // How they apologize
  reconnectionPath: string; // How they reconnect
}

export interface InnerChildTheme {
  coreNeed: string; // What their inner child needed
  playStyle: string; // How they naturally play/create
  comfortSeeking: string; // How they seek comfort
  celebrationStyle: string; // How they like to be celebrated
}

export class EmotionalOperatingSystemGenerator {
  
  /**
   * Generate complete emotional operating system from natal chart
   */
  static generateEmotionalOS(chart: NatalChart): EmotionalOperatingSystem {
    return {
      emotionalLanguage: this.analyzeEmotionalLanguage(chart),
      protectionStyle: this.analyzeProtectionStyle(chart),
      drainingSituations: this.identifyDrainingSituations(chart),
      feelingChosenTriggers: this.identifyFeelingChosenTriggers(chart),
      loveWound: this.analyzeLoveWound(chart),
      repairStyle: this.analyzeRepairStyle(chart),
      innerChildTheme: this.analyzeInnerChildTheme(chart)
    };
  }
  
  /**
   * Analyze how someone's nervous system learned to process emotions
   */
  private static analyzeEmotionalLanguage(chart: NatalChart): EmotionalLanguage {
    const moon = chart.moon;
    const moonSign = moon.sign;
    const moonHouse = moon.house;
    
    // Find Moon aspects for additional context
    const moonAspects = chart.aspects.filter(a => 
      a.planet1.name === 'Moon' || a.planet2.name === 'Moon'
    );
    
    let primaryMode = '';
    let expression = '';
    let needsToFeel = '';
    let overwhelmSigns: string[] = [];
    
    // Base emotional language from Moon sign
    switch (moonSign.name) {
      case 'Aries':
        primaryMode = 'Your nervous system learned to process emotions through action and movement';
        expression = 'You may express feelings directly and immediately, sometimes before you fully understand them';
        needsToFeel = 'You need to feel free to respond authentically without judgment';
        overwhelmSigns = ['Restlessness', 'Impatience', 'Sudden anger', 'Need to move or escape'];
        break;
        
      case 'Taurus':
        primaryMode = 'Your nervous system learned to process emotions through your body and physical comfort';
        expression = 'You may express feelings slowly and steadily, preferring actions over words';
        needsToFeel = 'You need physical comfort and stability to feel emotionally safe';
        overwhelmSigns = ['Physical tension', 'Stubbornness', 'Withdrawal', 'Craving comfort foods'];
        break;
        
      case 'Gemini':
        primaryMode = 'Your nervous system learned to process emotions through thinking and talking';
        expression = 'You may express feelings through words, stories, or by sharing information';
        needsToFeel = 'You need to understand and communicate your emotions to feel settled';
        overwhelmSigns = ['Racing thoughts', 'Talking rapidly', 'Scattered attention', 'Information seeking'];
        break;
        
      case 'Cancer':
        primaryMode = 'Your nervous system learned to process emotions through nurturing and protection';
        expression = 'You may express feelings through caring for others or creating safe spaces';
        needsToFeel = 'You need emotional safety and belonging to open up';
        overwhelmSigns = ['Withdrawal into shell', 'Emotional flooding', 'Caretaking others', 'Nostalgia'];
        break;
        
      case 'Leo':
        primaryMode = 'Your nervous system learned to process emotions through creative expression and recognition';
        expression = 'You may express feelings dramatically and need them to be witnessed and appreciated';
        needsToFeel = 'You need to feel seen, appreciated, and celebrated for who you are';
        overwhelmSigns = ['Attention-seeking', 'Dramatic reactions', 'Pride wounds', 'Performance pressure'];
        break;
        
      case 'Virgo':
        primaryMode = 'Your nervous system learned to process emotions through analysis and service';
        expression = 'You may express feelings through helpful actions or by organizing your environment';
        needsToFeel = 'You need to feel useful and to understand the practical purpose of emotions';
        overwhelmSigns = ['Over-analyzing', 'Criticism of self/others', 'Perfectionism', 'Health anxiety'];
        break;
        
      case 'Libra':
        primaryMode = 'Your nervous system learned to process emotions through relationships and harmony';
        expression = 'You may express feelings indirectly or by seeking balance and fairness';
        needsToFeel = 'You need harmony and to feel that your relationships are balanced';
        overwhelmSigns = ['People-pleasing', 'Indecision', 'Conflict avoidance', 'Relationship anxiety'];
        break;
        
      case 'Scorpio':
        primaryMode = 'Your nervous system learned to process emotions through depth and transformation';
        expression = 'You may express feelings intensely or keep them private until you feel completely safe';
        needsToFeel = 'You need emotional authenticity and to trust that others can handle your depth';
        overwhelmSigns = ['Emotional intensity', 'Secretiveness', 'Jealousy', 'Need for control'];
        break;
        
      case 'Sagittarius':
        primaryMode = 'Your nervous system learned to process emotions through meaning-making and expansion';
        expression = 'You may express feelings through stories, philosophy, or by seeking new experiences';
        needsToFeel = 'You need freedom and to understand the bigger picture of your emotions';
        overwhelmSigns = ['Restlessness', 'Philosophical detachment', 'Escape seeking', 'Blunt honesty'];
        break;
        
      case 'Capricorn':
        primaryMode = 'Your nervous system learned to process emotions through structure and achievement';
        expression = 'You may express feelings through responsible actions or by building something lasting';
        needsToFeel = 'You need to feel competent and to see the practical value of emotional expression';
        overwhelmSigns = ['Emotional shutdown', 'Workaholism', 'Pessimism', 'Rigid control'];
        break;
        
      case 'Aquarius':
        primaryMode = 'Your nervous system learned to process emotions through detachment and innovation';
        expression = 'You may express feelings intellectually or by focusing on humanitarian causes';
        needsToFeel = 'You need emotional freedom and to feel accepted for your uniqueness';
        overwhelmSigns = ['Emotional detachment', 'Rebelliousness', 'Social anxiety', 'Future worry'];
        break;
        
      case 'Pisces':
        primaryMode = 'Your nervous system learned to process emotions through intuition and compassion';
        expression = 'You may express feelings through art, music, or by absorbing others\' emotions';
        needsToFeel = 'You need emotional boundaries and to feel spiritually connected';
        overwhelmSigns = ['Emotional overwhelm', 'Escapism', 'Boundary confusion', 'Victim mentality'];
        break;
    }
    
    // Modify based on challenging Moon aspects
    const challengingMoonAspects = moonAspects.filter(a => a.type.nature === 'Challenging');
    if (challengingMoonAspects.length > 0) {
      const aspect = challengingMoonAspects[0];
      const otherPlanet = aspect.planet1.name === 'Moon' ? aspect.planet2 : aspect.planet1;
      
      if (otherPlanet.name === 'Saturn') {
        primaryMode += '. You may have learned to be cautious with emotional expression, perhaps feeling you needed to earn the right to have feelings';
        overwhelmSigns.push('Self-criticism about emotions');
      } else if (otherPlanet.name === 'Mars') {
        primaryMode += '. You may have learned that emotions can feel intense or overwhelming, requiring healthy outlets';
        overwhelmSigns.push('Emotional reactivity');
      } else if (otherPlanet.name === 'Pluto') {
        primaryMode += '. You may have learned that emotions can be transformative but also intense, requiring deep processing';
        overwhelmSigns.push('Emotional intensity');
      }
    }
    
    return {
      primaryMode,
      expression,
      needsToFeel,
      overwhelmSigns
    };
  }
  
  /**
   * Analyze protection and defense mechanisms
   */
  private static analyzeProtectionStyle(chart: NatalChart): ProtectionStyle {
    const mars = chart.mars;
    const saturn = chart.saturn;
    const ascendant = chart.ascendant;
    
    let primaryDefense = '';
    let triggers: string[] = [];
    let safetyNeeds: string[] = [];
    let gentleApproach = '';
    
    // Base protection style from Mars sign (how they defend)
    switch (mars.sign.name) {
      case 'Aries':
        primaryDefense = 'You may have learned to protect yourself through direct confrontation and quick action';
        triggers = ['Feeling controlled', 'Being told what to do', 'Slow responses from others'];
        safetyNeeds = ['Freedom to act', 'Respect for your autonomy', 'Quick resolution of conflicts'];
        gentleApproach = 'Give them space to respond in their own time and acknowledge their independence';
        break;
        
      case 'Taurus':
        primaryDefense = 'You may have learned to protect yourself through stubbornness and creating stability';
        triggers = ['Sudden changes', 'Pressure to rush', 'Threats to security'];
        safetyNeeds = ['Predictability', 'Physical comfort', 'Time to process changes'];
        gentleApproach = 'Move slowly, provide reassurance, and respect their need for stability';
        break;
        
      case 'Gemini':
        primaryDefense = 'You may have learned to protect yourself through wit, distraction, and mental agility';
        triggers = ['Being misunderstood', 'Boredom', 'Emotional intensity without explanation'];
        safetyNeeds = ['Mental stimulation', 'Clear communication', 'Variety and options'];
        gentleApproach = 'Engage their mind first, explain your reasoning, and offer choices';
        break;
        
      case 'Cancer':
        primaryDefense = 'You may have learned to protect yourself by withdrawing into your shell or caretaking others';
        triggers = ['Criticism', 'Feeling unwelcome', 'Threats to loved ones'];
        safetyNeeds = ['Emotional safety', 'Belonging', 'Protection of family/home'];
        gentleApproach = 'Create emotional safety first, show care for what they care about';
        break;
        
      case 'Leo':
        primaryDefense = 'You may have learned to protect yourself through pride and maintaining your dignity';
        triggers = ['Public embarrassment', 'Being ignored', 'Attacks on your character'];
        safetyNeeds = ['Respect', 'Recognition', 'Dignity preserved'];
        gentleApproach = 'Honor their dignity, acknowledge their strengths, avoid public criticism';
        break;
        
      case 'Virgo':
        primaryDefense = 'You may have learned to protect yourself through perfectionism and helpful service';
        triggers = ['Chaos', 'Being seen as incompetent', 'Criticism without solutions'];
        safetyNeeds = ['Order', 'Competence recognized', 'Practical solutions'];
        gentleApproach = 'Acknowledge their competence, offer practical support, be specific';
        break;
        
      case 'Libra':
        primaryDefense = 'You may have learned to protect yourself by avoiding conflict and seeking harmony';
        triggers = ['Confrontation', 'Unfairness', 'Having to choose sides'];
        safetyNeeds = ['Harmony', 'Fairness', 'Diplomatic solutions'];
        gentleApproach = 'Approach conflicts gently, emphasize fairness, seek win-win solutions';
        break;
        
      case 'Scorpio':
        primaryDefense = 'You may have learned to protect yourself through emotional intensity and strategic withdrawal';
        triggers = ['Betrayal', 'Surface-level interactions', 'Loss of control'];
        safetyNeeds = ['Loyalty', 'Emotional depth', 'Trust built over time'];
        gentleApproach = 'Be authentic, respect their privacy, prove trustworthiness through actions';
        break;
        
      case 'Sagittarius':
        primaryDefense = 'You may have learned to protect yourself through humor, philosophy, and maintaining freedom';
        triggers = ['Feeling trapped', 'Narrow-mindedness', 'Micromanagement'];
        safetyNeeds = ['Freedom', 'Open-mindedness', 'Room for growth'];
        gentleApproach = 'Give them space, engage their philosophical side, avoid controlling behavior';
        break;
        
      case 'Capricorn':
        primaryDefense = 'You may have learned to protect yourself through self-reliance and maintaining control';
        triggers = ['Incompetence', 'Lack of structure', 'Dependence on others'];
        safetyNeeds = ['Competence', 'Structure', 'Respect for their authority'];
        gentleApproach = 'Respect their competence, be reliable, offer structured support';
        break;
        
      case 'Aquarius':
        primaryDefense = 'You may have learned to protect yourself through emotional detachment and intellectual superiority';
        triggers = ['Emotional manipulation', 'Conformity pressure', 'Invasion of privacy'];
        safetyNeeds = ['Intellectual respect', 'Personal freedom', 'Acceptance of uniqueness'];
        gentleApproach = 'Respect their uniqueness, engage intellectually, avoid emotional pressure';
        break;
        
      case 'Pisces':
        primaryDefense = 'You may have learned to protect yourself through emotional withdrawal and victim mentality';
        triggers = ['Harsh criticism', 'Emotional overwhelm', 'Lack of compassion'];
        safetyNeeds = ['Compassion', 'Emotional boundaries', 'Spiritual connection'];
        gentleApproach = 'Be gentle and compassionate, help them set boundaries, offer spiritual support';
        break;
    }
    
    // Modify based on Saturn aspects (additional protective mechanisms)
    const saturnAspects = chart.aspects.filter(a => 
      a.planet1.name === 'Saturn' || a.planet2.name === 'Saturn'
    );
    
    if (saturnAspects.length > 0) {
      primaryDefense += '. You may also have learned to protect yourself through self-discipline and emotional restraint';
      triggers.push('Feeling judged or criticized');
      safetyNeeds.push('Respect for your boundaries');
    }
    
    return {
      primaryDefense,
      triggers,
      safetyNeeds,
      gentleApproach
    };
  }
  
  /**
   * Identify what drains their energy
   */
  private static identifyDrainingSituations(chart: NatalChart): string[] {
    const draining: string[] = [];
    const isUnknownTime = UnknownTimeHandler.isUnknownTimeChart(chart);
    
    // Based on Moon sign (emotional drains)
    const moonSign = chart.moon.sign;
    switch (moonSign.element) {
      case 'Fire':
        draining.push('Slow-moving situations', 'Lack of autonomy', 'Boring routines');
        break;
      case 'Earth':
        draining.push('Constant change', 'Impractical demands', 'Chaotic environments');
        break;
      case 'Air':
        draining.push('Emotional intensity without explanation', 'Isolation', 'Repetitive tasks');
        break;
      case 'Water':
        draining.push('Emotional overwhelm from others', 'Harsh environments', 'Lack of empathy');
        break;
    }
    
    // Based on challenging aspects
    const challengingAspects = chart.aspects.filter(a => a.type.nature === 'Challenging');
    challengingAspects.forEach(aspect => {
      if (aspect.planet1.name === 'Sun' || aspect.planet2.name === 'Sun') {
        draining.push('Not being seen for who you really are');
      }
      if (aspect.planet1.name === 'Venus' || aspect.planet2.name === 'Venus') {
        draining.push('Relationship conflict', 'Lack of beauty or harmony');
      }
      if (aspect.planet1.name === 'Mars' || aspect.planet2.name === 'Mars') {
        draining.push('Suppressed anger', 'Lack of physical outlet');
      }
    });
    
    // Based on house placements
    if (!isUnknownTime) {
      if (chart.moon.house === 12) {
        draining.push('Overstimulating environments', 'Lack of alone time');
      }
      if (chart.sun.house === 6) {
        draining.push('Disorganized work environments', 'Lack of routine');
      }
    }
    
    return draining.slice(0, 5); // Limit to most relevant
  }
  
  /**
   * Identify what makes them feel chosen and special
   */
  private static identifyFeelingChosenTriggers(chart: NatalChart): string[] {
    const triggers: string[] = [];
    
    // Based on Sun sign (core identity needs)
    const sunSign = chart.sun.sign;
    switch (sunSign.name) {
      case 'Aries':
        triggers.push('Being asked to lead', 'First choice for adventures', 'Recognized for courage');
        break;
      case 'Taurus':
        triggers.push('Appreciated for reliability', 'Chosen for comfort', 'Valued for stability');
        break;
      case 'Gemini':
        triggers.push('Asked for advice', 'Included in conversations', 'Appreciated for wit');
        break;
      case 'Cancer':
        triggers.push('Being cared for in return', 'Included in family moments', 'Trusted with emotions');
        break;
      case 'Leo':
        triggers.push('Public recognition', 'Being celebrated', 'Chosen as the favorite');
        break;
      case 'Virgo':
        triggers.push('Appreciated for helpfulness', 'Recognized for competence', 'Asked to organize');
        break;
      case 'Libra':
        triggers.push('Chosen as mediator', 'Appreciated for beauty', 'Included in social events');
        break;
      case 'Scorpio':
        triggers.push('Trusted with secrets', 'Chosen for depth', 'Valued for loyalty');
        break;
      case 'Sagittarius':
        triggers.push('Asked to explore together', 'Appreciated for wisdom', 'Chosen for adventures');
        break;
      case 'Capricorn':
        triggers.push('Respected for achievements', 'Asked to take charge', 'Valued for reliability');
        break;
      case 'Aquarius':
        triggers.push('Appreciated for uniqueness', 'Chosen for innovation', 'Valued for friendship');
        break;
      case 'Pisces':
        triggers.push('Appreciated for compassion', 'Chosen for understanding', 'Valued for intuition');
        break;
    }
    
    // Based on Venus sign (how they want to be loved)
    const venusSign = chart.venus.sign;
    switch (venusSign.element) {
      case 'Fire':
        triggers.push('Spontaneous gestures', 'Being pursued', 'Shared excitement');
        break;
      case 'Earth':
        triggers.push('Practical acts of service', 'Consistent affection', 'Material thoughtfulness');
        break;
      case 'Air':
        triggers.push('Intellectual connection', 'Verbal appreciation', 'Social inclusion');
        break;
      case 'Water':
        triggers.push('Emotional intimacy', 'Intuitive understanding', 'Empathetic responses');
        break;
    }
    
    return triggers.slice(0, 6); // Limit to most relevant
  }
  
  /**
   * Analyze core love wound and healing path
   */
  private static analyzeLoveWound(chart: NatalChart): LoveWound {
    const venus = chart.venus;
    const moon = chart.moon;
    
    // Find challenging Venus aspects
    const venusAspects = chart.aspects.filter(a => 
      (a.planet1.name === 'Venus' || a.planet2.name === 'Venus') && 
      a.type.nature === 'Challenging'
    );
    
    let coreWound = '';
    let howItShows = '';
    let healingPath = '';
    let greenFlags: string[] = [];
    
    // Base love wound from Venus sign
    switch (venus.sign.name) {
      case 'Aries':
        coreWound = 'You may have learned that love requires you to fight for it or prove your worth through independence';
        howItShows = 'You might rush into relationships or feel you need to be the pursuer to feel loved';
        healingPath = 'Learning that healthy love allows for both independence and interdependence';
        greenFlags = ['Respects your autonomy', 'Matches your energy', 'Encourages your goals'];
        break;
        
      case 'Taurus':
        coreWound = 'You may have learned that love is conditional on your usefulness or material provision';
        howItShows = 'You might over-give materially or fear abandonment if you\'re not constantly useful';
        healingPath = 'Learning that you are lovable for who you are, not what you provide';
        greenFlags = ['Loves you during difficult times', 'Appreciates your presence', 'Shares resources freely'];
        break;
        
      case 'Gemini':
        coreWound = 'You may have learned that love requires you to be entertaining or intellectually impressive';
        howItShows = 'You might feel you need to be "on" all the time or fear being boring';
        healingPath = 'Learning that you are lovable in your quiet, ordinary moments too';
        greenFlags = ['Enjoys comfortable silence', 'Listens to your thoughts', 'Finds you interesting naturally'];
        break;
        
      case 'Cancer':
        coreWound = 'You may have learned that love means taking care of others at the expense of yourself';
        howItShows = 'You might over-nurture or feel guilty for having your own needs';
        healingPath = 'Learning that healthy love includes being cared for in return';
        greenFlags = ['Takes care of you too', 'Respects your emotions', 'Creates safety with you'];
        break;
        
      case 'Leo':
        coreWound = 'You may have learned that love requires you to perform or be perfect to be worthy';
        howItShows = 'You might feel you need to be impressive or fear being ordinary';
        healingPath = 'Learning that you are lovable in your authentic, imperfect humanity';
        greenFlags = ['Loves your flaws too', 'Celebrates your authenticity', 'Makes you feel special naturally'];
        break;
        
      case 'Virgo':
        coreWound = 'You may have learned that love is earned through perfection and service';
        howItShows = 'You might over-analyze relationships or feel you\'re never good enough';
        healingPath = 'Learning that love accepts your imperfections and values your heart over your performance';
        greenFlags = ['Accepts your imperfections', 'Appreciates your efforts', 'Doesn\'t need you to be perfect'];
        break;
        
      case 'Libra':
        coreWound = 'You may have learned that love requires you to keep everyone happy and avoid conflict';
        howItShows = 'You might lose yourself in relationships or fear disagreement';
        healingPath = 'Learning that healthy love can handle conflict and values your authentic opinions';
        greenFlags = ['Handles disagreement well', 'Wants to know your real thoughts', 'Supports your individual growth'];
        break;
        
      case 'Scorpio':
        coreWound = 'You may have learned that love is dangerous and that vulnerability leads to betrayal';
        howItShows = 'You might test partners or hold back your deepest self';
        healingPath = 'Learning that some people can be trusted with your depth and intensity';
        greenFlags = ['Proves trustworthy over time', 'Handles your intensity', 'Shares their own depth'];
        break;
        
      case 'Sagittarius':
        coreWound = 'You may have learned that love means giving up your freedom and dreams';
        howItShows = 'You might fear commitment or feel trapped in relationships';
        healingPath = 'Learning that healthy love expands your world rather than limiting it';
        greenFlags = ['Supports your growth', 'Shares adventures with you', 'Gives you space to be yourself'];
        break;
        
      case 'Capricorn':
        coreWound = 'You may have learned that love must be earned through achievement and responsibility';
        howItShows = 'You might feel you need to be successful to be lovable or fear being a burden';
        healingPath = 'Learning that you are worthy of love regardless of your accomplishments';
        greenFlags = ['Loves you during struggles', 'Supports your ambitions', 'Values your character over achievements'];
        break;
        
      case 'Aquarius':
        coreWound = 'You may have learned that love requires you to conform or hide your uniqueness';
        howItShows = 'You might feel like an outsider in relationships or fear being too different';
        healingPath = 'Learning that the right person will love you because of your uniqueness, not despite it';
        greenFlags = ['Celebrates your uniqueness', 'Shares your values', 'Gives you emotional freedom'];
        break;
        
      case 'Pisces':
        coreWound = 'You may have learned that love means sacrificing yourself or saving others';
        howItShows = 'You might attract people who need rescuing or lose your boundaries in love';
        healingPath = 'Learning that healthy love has boundaries and mutual support';
        greenFlags = ['Respects your boundaries', 'Takes responsibility for themselves', 'Supports your dreams'];
        break;
    }
    
    // Modify based on challenging Venus aspects
    if (venusAspects.length > 0) {
      const aspect = venusAspects[0];
      const otherPlanet = aspect.planet1.name === 'Venus' ? aspect.planet2 : aspect.planet1;
      
      if (otherPlanet.name === 'Saturn') {
        coreWound += '. You may also have learned that love is scarce and must be earned through hard work';
        howItShows += '. You might have high walls around your heart or fear rejection';
      } else if (otherPlanet.name === 'Mars') {
        coreWound += '. You may also have learned that love and conflict are intertwined';
        howItShows += '. You might attract passionate but volatile relationships';
      } else if (otherPlanet.name === 'Pluto') {
        coreWound += '. You may also have learned that love involves power struggles or transformation through pain';
        howItShows += '. You might experience intense, transformative relationships';
      }
    }
    
    return {
      coreWound,
      howItShows,
      healingPath,
      greenFlags
    };
  }
  
  /**
   * Analyze repair style after conflict
   */
  private static analyzeRepairStyle(chart: NatalChart): RepairStyle {
    const mars = chart.mars;
    const venus = chart.venus;
    const moon = chart.moon;
    
    let conflictResponse = '';
    let repairNeeds: string[] = [];
    let apologyStyle = '';
    let reconnectionPath = '';
    
    // Base conflict response from Mars sign
    switch (mars.sign.name) {
      case 'Aries':
        conflictResponse = 'You may respond to conflict with direct confrontation and want to resolve things quickly';
        repairNeeds = ['Quick acknowledgment', 'Direct communication', 'Action-oriented solutions'];
        apologyStyle = 'You likely apologize directly and want to move forward immediately';
        reconnectionPath = 'You reconnect through shared action or physical affection';
        break;
        
      case 'Taurus':
        conflictResponse = 'You may respond to conflict by digging in your heels or withdrawing to process';
        repairNeeds = ['Time to cool down', 'Practical gestures', 'Stability restored'];
        apologyStyle = 'You likely apologize through actions rather than words';
        reconnectionPath = 'You reconnect through physical comfort and routine restoration';
        break;
        
      case 'Gemini':
        conflictResponse = 'You may respond to conflict by wanting to talk it through or intellectualize it';
        repairNeeds = ['Clear communication', 'Understanding the logic', 'Multiple perspectives heard'];
        apologyStyle = 'You likely apologize through explanation and discussion';
        reconnectionPath = 'You reconnect through conversation and mental connection';
        break;
        
      case 'Cancer':
        conflictResponse = 'You may respond to conflict by withdrawing emotionally or becoming protective';
        repairNeeds = ['Emotional safety restored', 'Gentle approach', 'Care and nurturing'];
        apologyStyle = 'You likely apologize emotionally and need emotional reassurance';
        reconnectionPath = 'You reconnect through emotional intimacy and care';
        break;
        
      case 'Leo':
        conflictResponse = 'You may respond to conflict with pride and need your dignity preserved';
        repairNeeds = ['Respect maintained', 'Public dignity preserved', 'Appreciation shown'];
        apologyStyle = 'You likely apologize with dignity and need your efforts acknowledged';
        reconnectionPath = 'You reconnect through appreciation and celebration';
        break;
        
      case 'Virgo':
        conflictResponse = 'You may respond to conflict by analyzing what went wrong and wanting to fix it';
        repairNeeds = ['Practical solutions', 'Clear steps forward', 'Competence acknowledged'];
        apologyStyle = 'You likely apologize by taking responsibility and offering solutions';
        reconnectionPath = 'You reconnect through helpful actions and problem-solving together';
        break;
        
      case 'Libra':
        conflictResponse = 'You may respond to conflict by seeking balance and avoiding further discord';
        repairNeeds = ['Harmony restored', 'Fairness acknowledged', 'Diplomatic resolution'];
        apologyStyle = 'You likely apologize by seeking mutual understanding and balance';
        reconnectionPath = 'You reconnect through beauty, harmony, and shared activities';
        break;
        
      case 'Scorpio':
        conflictResponse = 'You may respond to conflict with intensity and need to get to the root of issues';
        repairNeeds = ['Deep honesty', 'Emotional truth', 'Trust rebuilt through actions'];
        apologyStyle = 'You likely apologize with deep sincerity and emotional truth';
        reconnectionPath = 'You reconnect through emotional depth and renewed intimacy';
        break;
        
      case 'Sagittarius':
        conflictResponse = 'You may respond to conflict by seeking the bigger picture or wanting space';
        repairNeeds = ['Freedom to process', 'Philosophical understanding', 'Growth-oriented solutions'];
        apologyStyle = 'You likely apologize by sharing what you\'ve learned and your growth';
        reconnectionPath = 'You reconnect through shared meaning and future-focused activities';
        break;
        
      case 'Capricorn':
        conflictResponse = 'You may respond to conflict by taking control or withdrawing to strategize';
        repairNeeds = ['Structured resolution', 'Respect for boundaries', 'Long-term solutions'];
        apologyStyle = 'You likely apologize through responsible action and commitment to change';
        reconnectionPath = 'You reconnect through shared goals and reliable follow-through';
        break;
        
      case 'Aquarius':
        conflictResponse = 'You may respond to conflict by detaching emotionally or seeking innovative solutions';
        repairNeeds = ['Intellectual understanding', 'Freedom to process', 'Unique solutions'];
        apologyStyle = 'You likely apologize by explaining your perspective and seeking mutual understanding';
        reconnectionPath = 'You reconnect through friendship and shared ideals';
        break;
        
      case 'Pisces':
        conflictResponse = 'You may respond to conflict by becoming overwhelmed or seeking to escape';
        repairNeeds = ['Gentle approach', 'Emotional support', 'Compassionate understanding'];
        apologyStyle = 'You likely apologize with deep emotion and may take on too much responsibility';
        reconnectionPath = 'You reconnect through compassion and spiritual/emotional bonding';
        break;
    }
    
    return {
      conflictResponse,
      repairNeeds,
      apologyStyle,
      reconnectionPath
    };
  }
  
  /**
   * Analyze inner child themes and needs
   */
  private static analyzeInnerChildTheme(chart: NatalChart): InnerChildTheme {
    const sun = chart.sun;
    const moon = chart.moon;
    const venus = chart.venus;
    
    let coreNeed = '';
    let playStyle = '';
    let comfortSeeking = '';
    let celebrationStyle = '';
    
    // Base inner child need from Sun sign
    switch (sun.sign.name) {
      case 'Aries':
        coreNeed = 'Your inner child needed to feel brave, independent, and free to explore';
        playStyle = 'You naturally play through physical activity, competition, and adventure';
        comfortSeeking = 'You seek comfort through action, movement, and new experiences';
        celebrationStyle = 'You like to be celebrated for your courage, leadership, and pioneering spirit';
        break;
        
      case 'Taurus':
        coreNeed = 'Your inner child needed to feel safe, comfortable, and materially secure';
        playStyle = 'You naturally play through sensory experiences, building, and creative arts';
        comfortSeeking = 'You seek comfort through physical pleasure, nature, and beautiful things';
        celebrationStyle = 'You like to be celebrated for your reliability, creativity, and grounding presence';
        break;
        
      case 'Gemini':
        coreNeed = 'Your inner child needed to feel heard, understood, and intellectually stimulated';
        playStyle = 'You naturally play through games, conversation, learning, and variety';
        comfortSeeking = 'You seek comfort through communication, books, and mental stimulation';
        celebrationStyle = 'You like to be celebrated for your wit, intelligence, and communication skills';
        break;
        
      case 'Cancer':
        coreNeed = 'Your inner child needed to feel emotionally safe, nurtured, and belonging';
        playStyle = 'You naturally play through nurturing activities, home-making, and family games';
        comfortSeeking = 'You seek comfort through emotional connection, home, and familiar things';
        celebrationStyle = 'You like to be celebrated for your caring nature, intuition, and emotional wisdom';
        break;
        
      case 'Leo':
        coreNeed = 'Your inner child needed to feel special, appreciated, and creatively expressed';
        playStyle = 'You naturally play through performance, creative expression, and being the center of attention';
        comfortSeeking = 'You seek comfort through appreciation, creative expression, and warm attention';
        celebrationStyle = 'You like to be celebrated dramatically, publicly, and with genuine appreciation';
        break;
        
      case 'Virgo':
        coreNeed = 'Your inner child needed to feel useful, competent, and appreciated for their helpfulness';
        playStyle = 'You naturally play through organizing, helping, crafting, and perfecting skills';
        comfortSeeking = 'You seek comfort through order, usefulness, and health-supporting activities';
        celebrationStyle = 'You like to be celebrated for your helpfulness, attention to detail, and competence';
        break;
        
      case 'Libra':
        coreNeed = 'Your inner child needed to feel harmonious, beautiful, and socially connected';
        playStyle = 'You naturally play through social activities, art, music, and cooperative games';
        comfortSeeking = 'You seek comfort through beauty, harmony, and pleasant social connection';
        celebrationStyle = 'You like to be celebrated for your diplomacy, aesthetic sense, and ability to bring harmony';
        break;
        
      case 'Scorpio':
        coreNeed = 'Your inner child needed to feel emotionally safe to be intense and deeply authentic';
        playStyle = 'You naturally play through mystery, depth, transformation games, and intense activities';
        comfortSeeking = 'You seek comfort through emotional depth, privacy, and transformative experiences';
        celebrationStyle = 'You like to be celebrated for your depth, loyalty, and transformative power';
        break;
        
      case 'Sagittarius':
        coreNeed = 'Your inner child needed to feel free to explore, learn, and expand their horizons';
        playStyle = 'You naturally play through adventure, exploration, learning, and philosophical games';
        comfortSeeking = 'You seek comfort through freedom, adventure, and expanding your understanding';
        celebrationStyle = 'You like to be celebrated for your wisdom, adventurous spirit, and optimism';
        break;
        
      case 'Capricorn':
        coreNeed = 'Your inner child needed to feel respected, competent, and able to build something lasting';
        playStyle = 'You naturally play through building, achieving goals, and structured activities';
        comfortSeeking = 'You seek comfort through achievement, structure, and long-term security';
        celebrationStyle = 'You like to be celebrated for your achievements, responsibility, and wisdom';
        break;
        
      case 'Aquarius':
        coreNeed = 'Your inner child needed to feel accepted for their uniqueness and free to innovate';
        playStyle = 'You naturally play through innovation, group activities, and unique creative expression';
        comfortSeeking = 'You seek comfort through friendship, innovation, and acceptance of your uniqueness';
        celebrationStyle = 'You like to be celebrated for your uniqueness, innovation, and humanitarian spirit';
        break;
        
      case 'Pisces':
        coreNeed = 'Your inner child needed to feel emotionally understood and free to dream and create';
        playStyle = 'You naturally play through imagination, art, music, and compassionate activities';
        comfortSeeking = 'You seek comfort through creativity, spirituality, and compassionate connection';
        celebrationStyle = 'You like to be celebrated for your compassion, creativity, and spiritual wisdom';
        break;
    }
    
    return {
      coreNeed,
      playStyle,
      comfortSeeking,
      celebrationStyle
    };
  }
}