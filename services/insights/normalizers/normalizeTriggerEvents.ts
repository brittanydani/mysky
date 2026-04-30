import { toLocalDateString } from '../../../utils/dateUtils';
import type { TriggerEvent } from '../../../utils/triggerEventTypes';
import { SIGNALS } from '../signalDefinitions';
import { UserSignal } from '../types/knowledgeEngine';

const DRAIN_KEYWORDS: Array<{ key: string; terms: string[] }> = [
  { key: SIGNALS.MUTUALITY_NEED.key, terms: ['conflict', 'relationship', 'partner', 'friend', 'family', 'rejection'] },
  { key: SIGNALS.REASSURANCE_NEED.key, terms: ['abandon', 'uncertain', 'ignored', 'unseen', 'text'] },
  { key: SIGNALS.BOUNDARY_GROWTH.key, terms: ['boundary', 'saying yes', 'people-pleasing', 'no ', 'limit'] },
  { key: SIGNALS.HIGH_RESPONSIBILITY.key, terms: ['responsibility', 'rushing', 'unfinished', 'deadline', 'work'] },
  { key: SIGNALS.OVEREXTENSION.key, terms: ['overstimulated', 'over-stimulation', 'overwhelm', 'screens', 'too much'] },
  { key: SIGNALS.SUPPORT_SCARCITY.key, terms: ['alone', 'isolation', 'unsupported', 'lonely'] },
  { key: SIGNALS.CALM_BRACING.key, terms: ['uncertainty', 'waiting', 'control', 'bracing'] },
];

const GLIMMER_KEYWORDS: Array<{ key: string; terms: string[] }> = [
  { key: SIGNALS.QUIET_AS_REPAIR.key, terms: ['quiet', 'solitude', 'alone time', 'rest', 'deep sleep'] },
  { key: SIGNALS.BEAUTY_REGULATION.key, terms: ['beauty', 'music', 'art', 'sunlight', 'nature'] },
  { key: SIGNALS.GLIMMER_QUIET_SAFETY.key, terms: ['safe', 'peace', 'calm', 'cozy', 'home'] },
  { key: SIGNALS.GRATITUDE.key, terms: ['gratitude', 'grateful', 'thankful'] },
  { key: SIGNALS.SUPPORT_NEED.key, terms: ['support', 'conversation', 'held', 'care', 'connection'] },
  { key: SIGNALS.BOUNDARY_GROWTH.key, terms: ['boundary', 'said no', 'protected'] },
  { key: SIGNALS.TRANSFORMATION.key, terms: ['creative', 'creativity', 'movement', 'release'] },
];

const SENSATION_SIGNALS: Array<{ key: string; terms: string[] }> = [
  { key: SIGNALS.CHEST_TIGHTNESS.key, terms: ['chest', 'heart', 'tight'] },
  { key: SIGNALS.JAW_TENSION.key, terms: ['jaw', 'throat', 'neck'] },
  { key: SIGNALS.SHOULDER_TENSION.key, terms: ['shoulder', 'back'] },
  { key: SIGNALS.STOMACH_UNEASE.key, terms: ['gut', 'stomach', 'belly', 'nausea'] },
];

function eventDate(event: TriggerEvent): string {
  return toLocalDateString(new Date(event.timestamp));
}

function eventStrength(event: TriggerEvent): number {
  return Math.max(0.45, Math.min(1, (event.intensity ?? 3) / 5));
}

function addSignal(
  signals: UserSignal[],
  event: TriggerEvent,
  key: string,
  source: 'triggerLog' | 'glimmerLog',
  strength: number,
  label: string,
): void {
  const date = eventDate(event);
  signals.push({
    key,
    source,
    date,
    strength,
    evidence: {
      source,
      date,
      label,
      intensity: event.intensity,
      signal: event.event,
    },
  });
}

export function normalizeTriggerEvents(events: TriggerEvent[]): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const event of events) {
    const modeSource = event.mode === 'nourish' ? 'glimmerLog' : 'triggerLog';
    const strength = eventStrength(event);
    const searchable = [
      event.event,
      event.contextArea,
      event.resolution,
      event.beforeState,
      event.nsState,
      ...(event.sensations ?? []),
    ].filter(Boolean).join(' ').toLowerCase();

    const keywordMap = event.mode === 'nourish' ? GLIMMER_KEYWORDS : DRAIN_KEYWORDS;
    let matchedAny = false;
    for (const mapping of keywordMap) {
      const matched = mapping.terms.find((term) => searchable.includes(term));
      if (matched) {
        matchedAny = true;
        addSignal(signals, event, mapping.key, modeSource, strength, matched.trim());
      }
    }

    if (!matchedAny) {
      addSignal(
        signals,
        event,
        event.mode === 'nourish' ? SIGNALS.GLIMMER_QUIET_SAFETY.key : SIGNALS.LOW_CAPACITY.key,
        modeSource,
        strength * 0.85,
        event.mode === 'nourish' ? 'restoring event' : 'draining event',
      );
    }

    for (const mapping of SENSATION_SIGNALS) {
      const matched = mapping.terms.find((term) => searchable.includes(term));
      if (matched) {
        addSignal(signals, event, mapping.key, modeSource, strength, matched.trim());
      }
    }

    if (event.mode === 'drain' && event.nsState === 'dorsal') {
      addSignal(signals, event, SIGNALS.LOW_CAPACITY.key, modeSource, strength, 'dorsal shutdown');
    }
    if (event.mode === 'nourish' && event.nsState === 'ventral') {
      addSignal(signals, event, SIGNALS.QUIET_AS_REPAIR.key, modeSource, strength, 'ventral regulation');
    }
  }

  return signals;
}
