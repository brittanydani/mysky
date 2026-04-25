import { EMOTIONAL_WEATHER_ANGLES } from './emotionalWeatherAngles';
import { REST_CAPACITY_ANGLES } from './restCapacityAngles';
import { SUPPORT_BELONGING_ANGLES } from './supportBelongingAngles';
import { BODY_SIGNAL_ANGLES } from './bodySignalAngles';
import { RELATIONSHIP_ANGLES } from './relationshipAngles';
import { DailyAngle } from '../types';

/**
 * Angles for Boundaries + Self-Trust
 */
export const BOUNDARY_ANGLES: DailyAngle[] = [
    {
        key: 'boundaries_001_inner_authority',
        patternKey: 'boundaries_001_boundary_rebuilding',
        title: 'Where You Draw the Line',
        triggerSignals: ['boundary_rebuilding', 'inner_authority'],
        observation: 'Your archive shows a growing shift in how you hold your limits.',
        pattern: 'Across recent entries, there is less energy spent asking whether your boundary is acceptable and more attention given to whether it is true.',
        reframe: 'This does not read as becoming cold. It reads as self-trust beginning to stand without needing everyone’s permission.',
        question: 'Which of your limits felt most honest today?',
        tone: 'clear',
    }
];

/**
 * Angles for Values + Integrity
 */
export const VALUES_ANGLES: DailyAngle[] = [
    {
        key: 'values_001_anger_truth',
        patternKey: 'values_001_justice_advocate',
        title: 'The Value Beneath Your Anger',
        triggerSignals: ['justice_sensitivity', 'anger'],
        observation: 'Your archive suggests that anger often rises when something violates a core value.',
        pattern: 'Across recent entries, your strongest emotional charge appears near unfairness, dismissal, or harm.',
        reframe: 'This does not read as being reactive. It reads as your ethics becoming impossible to silence.',
        question: 'What is your anger trying to protect today?',
        tone: 'deep',
    }
];

/**
 * Angles for Cognitive Style
 */
export const COGNITIVE_ANGLES: DailyAngle[] = [
    {
        key: 'cognitive_001_understand_to_feel',
        patternKey: 'cognitive_001_deep_processor',
        title: 'How You Process Pain',
        triggerSignals: ['deep_processing', 'meaning_making'],
        observation: 'Your archive suggests that understanding is one of the ways you regulate.',
        pattern: 'Across recent entries, you return often to meaning, context, and cause.',
        reframe: 'This does not read as overthinking. It reads as your mind trying to make something emotionally safe enough to feel.',
        question: 'What do you need to understand before this feeling can settle?',
        tone: 'soft',
    }
];

/**
 * Angles for Identity + Growth
 */
export const IDENTITY_ANGLES: DailyAngle[] = [
    {
        key: 'identity_001_becoming',
        patternKey: 'identity_001_transformation_seeker',
        title: 'The Person You Are Becoming',
        triggerSignals: ['transformation_season', 'self_definition'],
        observation: 'Your archive suggests that you are living between versions of yourself.',
        pattern: 'Across recent entries, there are signs of old roles loosening while new truths become harder to ignore.',
        reframe: 'This does not read as instability. It reads as becoming before the new shape has fully settled.',
        question: 'What new part of yourself are you currently getting to know?',
        tone: 'poetic',
    }
];

export const DAILY_ANGLES = [
  ...EMOTIONAL_WEATHER_ANGLES,
  ...REST_CAPACITY_ANGLES,
  ...SUPPORT_BELONGING_ANGLES,
  ...BODY_SIGNAL_ANGLES,
  ...RELATIONSHIP_ANGLES,
  ...BOUNDARY_ANGLES,
  ...VALUES_ANGLES,
  ...COGNITIVE_ANGLES,
  ...IDENTITY_ANGLES,
];
