// File: services/astrology/dailyGuidance.ts
// Daily emotional guidance based on real astronomical transits
// ✅ Uses transiting longitudes + computed transit-to-natal aspects (SimpleAspect)
// ✅ Converts Moon absolute longitude to AstrologySign
// ✅ Produces DailyEmotionalWeather + journaling prompts
// ✅ Does NOT pretend Transit aspects are the legacy Aspect type

import {
  NatalChart,
  DailyEmotionalWeather,
  AstrologySign,
  SimpleAspect,
  ZodiacSign,
} from './types';

import { getTransitingLongitudes, computeTransitAspectsToNatal } from './transits';
import { ZODIAC_SIGNS } from './constants';
import { toLocalDateString } from '../../utils/dateUtils';

export class DailyGuidanceGenerator {
  /**
   * Generate daily emotional weather for a specific date
   */
  static generateDailyWeather(natalChart: NatalChart, date: Date = new Date()): DailyEmotionalWeather {
    const houseSystem = natalChart.houseSystem ?? 'whole-sign';

    // Transiting longitudes keyed by planet name ("Moon", "Sun", etc.) in absolute degrees 0..360
    const transits = getTransitingLongitudes(
      date,
      natalChart.birthData.latitude,
      natalChart.birthData.longitude,
      houseSystem
    );

    // Current Moon sign from real transit data
    const moonAbs = transits['Moon'];
    const currentMoonSign = moonAbs != null ? this.getSignFromAbsoluteDegree(moonAbs) : natalChart.moonSign;

    // IMPORTANT: computeTransitAspectsToNatal should return SimpleAspect[] (pointA/pointB/type/orb)
    const transitAspects: SimpleAspect[] = computeTransitAspectsToNatal(natalChart, transits);

    return this.getPersonalizedGuidance(natalChart, currentMoonSign, date, transitAspects);
  }

  /**
   * Convert absolute degree to AstrologySign
   */
  private static getSignFromAbsoluteDegree(absDeg: number): AstrologySign {
    const normalize360 = (deg: number) => {
      const x = deg % 360;
      return x < 0 ? x + 360 : x;
    };

    const idx = Math.floor(normalize360(absDeg) / 30);

    const zodiacSign = ZODIAC_SIGNS[idx];
    return {
      name: zodiacSign.name,
      symbol: zodiacSign.symbol,
      element: zodiacSign.element,
      quality: zodiacSign.modality,
      rulingPlanet: zodiacSign.ruler.name,
      dates: this.getSignDates(zodiacSign.name),
    };
  }

  private static getSignDates(signName: string): string {
    const dates: Record<string, string> = {
      Aries: 'March 21 - April 19',
      Taurus: 'April 20 - May 20',
      Gemini: 'May 21 - June 20',
      Cancer: 'June 21 - July 22',
      Leo: 'July 23 - August 22',
      Virgo: 'August 23 - September 22',
      Libra: 'September 23 - October 22',
      Scorpio: 'October 23 - November 21',
      Sagittarius: 'November 22 - December 21',
      Capricorn: 'December 22 - January 19',
      Aquarius: 'January 20 - February 18',
      Pisces: 'February 19 - March 20',
    };
    return dates[signName] || '';
  }

  /**
   * Generate personalized guidance based on transit aspects (SimpleAspect)
   */
  private static getPersonalizedGuidance(
    chart: NatalChart,
    currentMoonSign: AstrologySign,
    date: Date,
    transitAspects: SimpleAspect[]
  ): DailyEmotionalWeather {
    let emotionalClimate = '';
    let moonInfluence = '';
    let energyGuidance = '';
    let gentlenessAreas: string[] = [];
    let careAction = '';
    let intensity = 0.3;
    let themes: string[] = [];

    // Base tone from Moon sign
    moonInfluence = this.generateMoonInfluence(currentMoonSign);
    themes.push(`${currentMoonSign.element.toLowerCase()} emotions`);

    // Sort aspects by tightness (smallest orb first), just in case transits.ts didn’t
    const sorted = [...transitAspects].sort((a, b) => a.orb - b.orb);
    const strongest = sorted[0];

    if (strongest) {
      // pointA should be the transiting planet, pointB the natal point
      const natalPoint = strongest.pointB;
      const aspectType = strongest.type;

      if (natalPoint === 'Moon') {
        if (aspectType === 'conjunction') {
          emotionalClimate =
            'Today may feel emotionally heightened as the Moon connects to your natal Moon. This can bring clarity about your needs and patterns.';
          intensity = 0.7;
          themes.push('emotional clarity', 'monthly reset');
        } else if (aspectType === 'square' || aspectType === 'opposition') {
          emotionalClimate =
            'Today might feel emotionally challenging as the Moon creates tension with your natal Moon. Conflicting feelings may surface.';
          intensity = 0.8;
          gentlenessAreas.push('Your emotional responses and reactions');
          themes.push('emotional tension', 'growth opportunity');
        } else if (aspectType === 'trine' || aspectType === 'sextile') {
          emotionalClimate =
            'Today may feel emotionally supportive as the Moon harmonizes with your natal Moon. A good day for emotional processing and self-care.';
          intensity = 0.4;
          themes.push('emotional harmony', 'self-care');
        }
      } else if (natalPoint === 'Sun') {
        if (aspectType === 'conjunction') {
          emotionalClimate =
            'Today may illuminate your identity and purpose. The Moon connecting with your Sun can bring emotional clarity about what matters most.';
          intensity = 0.6;
          themes.push('identity clarity', 'purpose');
        } else if (aspectType === 'square' || aspectType === 'opposition') {
          emotionalClimate =
            'Today may bring tension between emotional needs and identity. You might feel pulled between what you want and who you think you should be.';
          intensity = 0.7;
          gentlenessAreas.push('Conflicts between feelings and identity');
          themes.push('identity tension');
        } else {
          emotionalClimate =
            'Today supports emotional alignment with your sense of self. Authentic expression may feel easier.';
          intensity = 0.5;
          themes.push('authentic expression');
        }
      } else if (natalPoint === 'Saturn') {
        emotionalClimate =
          'Today may feel heavier or more serious. The Moon touching your Saturn can highlight responsibility, boundaries, and emotional maturity.';
        intensity = 0.8;
        gentlenessAreas.push('Self-criticism and harsh inner voice');
        gentlenessAreas.push('Feelings of restriction or limitation');
        themes.push('responsibility', 'boundaries');
      } else if (natalPoint === 'Venus') {
        emotionalClimate =
          'Today may feel softer and more harmonious. The Moon connecting with your Venus can enhance comfort, relationships, and sweetness.';
        intensity = 0.3;
        themes.push('harmony', 'relationships', 'beauty');
      } else if (natalPoint === 'Ascendant') {
        emotionalClimate =
          'Today you may feel more emotionally visible or sensitive to your environment. The Moon near your Ascendant can heighten responsiveness to others.';
        intensity = 0.6;
        gentlenessAreas.push("Sensitivity to others' reactions");
        themes.push('visibility', 'environment sensitivity');
      } else {
        // Generic fallback if strongest aspect hits another natal planet
        emotionalClimate =
          'Today highlights a meaningful emotional theme through your current transits. Pay attention to what feels emphasized and tender.';
        intensity = Math.max(intensity, 0.45);
        themes.push('awareness');
      }

      // Energy guidance by aspect type
      if (aspectType === 'square' || aspectType === 'opposition') {
        energyGuidance =
          "Channel today’s intensity into gentle self-reflection or creative expression. Avoid big decisions when feelings are spiking.";
      } else if (aspectType === 'trine' || aspectType === 'sextile') {
        energyGuidance =
          'This is a supportive day for emotional processing, creativity, and nurturing relationships. Trust your inner guidance.';
      } else {
        energyGuidance =
          "Notice what’s being illuminated in your emotional world today. This can be a day of useful emotional insight.";
      }
    } else {
      // No notable aspects: use Moon sign only
      emotionalClimate = `Today's emotional atmosphere is colored by the Moon in ${currentMoonSign.name}. This ${currentMoonSign.element.toLowerCase()} energy may influence how you process feelings and what you need for comfort.`;
      energyGuidance =
        'There are no major transit pressures highlighted right now. Focus on what feels authentic and nurturing.';
    }

    careAction = this.generateCareAction(currentMoonSign, Boolean(strongest));

    if (gentlenessAreas.length === 0) {
      gentlenessAreas.push('Any tendency to rush emotional processing');
      gentlenessAreas.push('Perfectionist expectations of your feelings');
    }

    return {
      date: toLocalDateString(date),
      emotionalClimate,
      moonInfluence,
      energyGuidance,
      gentlenessAreas: gentlenessAreas.slice(0, 3),
      careAction,
      intensity: Math.min(intensity, 1.0),
      themes: themes.slice(0, 5),
    };
  }

  private static generateMoonInfluence(currentMoonSign: AstrologySign): string {
    let influence = `The Moon in ${currentMoonSign.name} brings ${currentMoonSign.element.toLowerCase()} energy to your emotional world. `;

    switch (currentMoonSign.element) {
      case 'Fire':
        influence +=
          'You may feel more spontaneous and expressive. This supports authentic emotion and courageous honesty with yourself.';
        break;
      case 'Earth':
        influence +=
          'You may crave stability and tangible comfort. This supports grounding, routine, and caring for your body.';
        break;
      case 'Air':
        influence +=
          'You may feel more reflective and communicative. This supports talking things through, perspective, and connection.';
        break;
      case 'Water':
        influence +=
          'You may feel more intuitive and sensitive. This supports compassion, deep feeling, and emotional integration.';
        break;
    }

    return influence;
  }

  private static generateCareAction(currentMoonSign: AstrologySign, hasIntenseTransits: boolean): string {
    let action = '';

    switch (currentMoonSign.element) {
      case 'Fire':
        action = 'Do something that energizes you—move your body, create something, or follow a spark of inspiration.';
        break;
      case 'Earth':
        action = 'Ground yourself—eat something nourishing, tidy a small space, or spend time in nature.';
        break;
      case 'Air':
        action = 'Connect and process—journal, call someone safe, or learn something that helps you make meaning.';
        break;
      case 'Water':
        action = 'Slow down and feel—rest, take a bath, listen to music, or sit with what’s true.';
        break;
    }

    return hasIntenseTransits ? `Be extra gentle with yourself today. ${action}` : action;
  }

  /**
   * Generate journaling prompts (Moon sign + strongest transit aspect)
   */
  static generateJournalingPrompts(
    natalChart: NatalChart,
    currentMoonSign: AstrologySign | ZodiacSign,
    date: Date = new Date()
  ): string[] {
    const prompts: string[] = [];

    const houseSystem = natalChart.houseSystem ?? 'whole-sign';
    const transits = getTransitingLongitudes(
      date,
      natalChart.birthData.latitude,
      natalChart.birthData.longitude,
      houseSystem
    );
    const transitAspects: SimpleAspect[] = computeTransitAspectsToNatal(natalChart, transits);
    const strongest = [...transitAspects].sort((a, b) => a.orb - b.orb)[0];

    // Moon-element prompts
    switch (currentMoonSign.element) {
      case 'Fire':
        prompts.push('What am I feeling inspired to begin today?');
        prompts.push('Where do I need honest self-expression?');
        break;
      case 'Earth':
        prompts.push('What would help me feel safer and more grounded right now?');
        prompts.push('What practical step supports my wellbeing today?');
        break;
      case 'Air':
        prompts.push('What thought loop is asking to be witnessed with kindness?');
        prompts.push('What do I need to say—out loud or on paper?');
        break;
      case 'Water':
        prompts.push('What emotion is underneath my surface mood today?');
        prompts.push('What does my intuition keep whispering?');
        break;
    }

    // Transit-based prompt
    if (strongest) {
      const natalPoint = strongest.pointB;

      if (natalPoint === 'Moon') prompts.push('What pattern in my emotional responses is showing up today?');
      else if (natalPoint === 'Sun') prompts.push('What part of me wants to be seen and expressed today?');
      else if (natalPoint === 'Saturn') prompts.push('Where do I need a boundary that feels kind, not harsh?');
      else if (natalPoint === 'Venus') prompts.push('What brings me comfort and softness right now?');

      if (strongest.type === 'square' || strongest.type === 'opposition') {
        prompts.push("What growth might be hidden inside today’s friction?");
      }
    }

    prompts.push('What am I grateful for in this moment?');
    prompts.push('How can I be more compassionate with myself today?');

    return prompts.slice(0, 4);
  }
}
