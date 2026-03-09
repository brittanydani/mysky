/**
 * CharacterTracker
 *
 * System 4 — People & Relationship Intelligence
 * Extracts names of people mentioned across journal entries using
 * a simple NLP heuristic (capitalized words, 2+ characters, not
 * sentence-start or known noise words). Correlates each person with
 * the user's mood on days that person appeared.
 *
 * Output: "Annie  ·  14 mentions  ·  mood +2.1"
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { JournalEntry } from '../../services/storage/models';
import type { DailyCheckIn } from '../../services/patterns/types';

// ─── Name detection helpers ───────────────────────────────────────────────────

// Words that appear capitalized but are NOT names
const NAME_BLOCKLIST = new Set([
  'I', 'The', 'A', 'An', 'And', 'But', 'Or', 'For', 'So', 'Yet', 'Though',
  'When', 'If', 'Then', 'Today', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'New', 'This', 'That', 'My', 'Our', 'Your', 'His', 'Her', 'Their', 'Its',
  'Not', 'Just', 'Really', 'Very', 'Still', 'Also', 'Even', 'Only', 'Some',
  'All', 'Both', 'Each', 'More', 'Most', 'Other', 'Such', 'What', 'With',
  'God', 'Love', 'Life', 'Time', 'Day', 'Week', 'Year',
]);

/**
 * Extracts candidate names from journal entry content.
 * Looks for capitalized words (not at sentence start context) that
 * appear 2+ chars and are not in the blocklist.
 */
function extractNames(content: string): string[] {
  if (!content) return [];

  // Match capitalized words (Title Case) — exclude first word of sentence
  // Strategy: split on sentence boundaries, then find caps words within sentences
  const sentences = content.split(/[.!?\n]+/);
  const candidates: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Tokenize the sentence — skip first word (it's capitalized by grammar)
    const tokens = trimmed.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      const raw = tokens[i].replace(/[^a-zA-Z'-]/g, '');
      if (raw.length < 2) continue;
      // Must start with uppercase
      if (raw[0] !== raw[0].toUpperCase()) continue;
      if (raw[0] === raw[0].toLowerCase()) continue;
      if (NAME_BLOCKLIST.has(raw)) continue;
      // Probably a name if it's Title Case and not all-caps abbreviation
      if (raw === raw.toUpperCase() && raw.length > 2) continue;
      candidates.push(raw);
    }
  }

  return candidates;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  gold: '#C9AE78',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  amethyst: '#9D76C1',
  silverBlue: '#8BC4E8',
  card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  borderTop: 'rgba(255,255,255,0.10)',
  text: 'rgba(240,234,214,0.88)',
  muted: 'rgba(240,234,214,0.45)',
  surface: 'rgba(255,255,255,0.04)',
};

const AVATAR_COLORS = [
  PALETTE.gold, PALETTE.emerald, PALETTE.copper, PALETTE.amethyst, PALETTE.silverBlue,
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonRecord {
  name: string;
  mentions: number;
  avgMood: number | null;
  moodDelta: number | null; // vs overall avg mood
  dates: Set<string>;
}

interface Props {
  entries: JournalEntry[];
  checkIns: DailyCheckIn[];
  topN?: number;
}

// ─── Analysis ────────────────────────────────────────────────────────────────

function analyzeCharacters(
  entries: JournalEntry[],
  checkIns: DailyCheckIn[],
  topN: number,
): PersonRecord[] {
  // Build date → avg mood map
  const moodByDate: Record<string, number> = {};
  const dateGroups: Record<string, number[]> = {};
  for (const ci of checkIns) {
    if (!dateGroups[ci.date]) dateGroups[ci.date] = [];
    dateGroups[ci.date].push(ci.moodScore);
  }
  for (const [date, scores] of Object.entries(dateGroups)) {
    moodByDate[date] = scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  // Compute overall avg mood for delta calculation
  const allMoods = Object.values(moodByDate);
  const overallAvgMood = allMoods.length > 0
    ? allMoods.reduce((s, v) => s + v, 0) / allMoods.length
    : 5;

  // Count names across entries
  const people: Record<string, { mentions: number; dates: Set<string> }> = {};

  for (const entry of entries) {
    const names = extractNames(entry.content);
    for (const name of names) {
      if (!people[name]) people[name] = { mentions: 0, dates: new Set() };
      people[name].mentions++;
      people[name].dates.add(entry.date);
    }
  }

  // Filter noise — must appear at least twice
  const records: PersonRecord[] = Object.entries(people)
    .filter(([, { mentions }]) => mentions >= 2)
    .map(([name, { mentions, dates }]) => {
      // Average mood on days this person was mentioned
      const dayMoods = [...dates]
        .map(d => moodByDate[d])
        .filter(m => m !== undefined);

      const avgMood = dayMoods.length > 0
        ? dayMoods.reduce((s, v) => s + v, 0) / dayMoods.length
        : null;

      const moodDelta = avgMood !== null ? +(avgMood - overallAvgMood).toFixed(1) : null;

      return { name, mentions, avgMood, moodDelta, dates };
    })
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, topN);

  return records;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CharacterTracker({ entries, checkIns, topN = 5 }: Props) {
  const people = useMemo(
    () => analyzeCharacters(entries, checkIns, topN),
    [entries, checkIns, topN],
  );

  if (people.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>People in Your Story</Text>
        <Text style={styles.subtitle}>CHARACTER INTELLIGENCE</Text>
      </View>

      <View style={styles.list}>
        {people.map((person, i) => {
          const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const hasMood = person.moodDelta !== null;
          const moodPositive = (person.moodDelta ?? 0) >= 0;

          return (
            <View key={person.name} style={styles.row}>
              {/* Avatar initial */}
              <View style={[styles.avatar, { backgroundColor: `${avatarColor}22`, borderColor: `${avatarColor}44` }]}>
                <Text style={[styles.avatarText, { color: avatarColor }]}>
                  {person.name[0]}
                </Text>
              </View>

              {/* Name + mentions */}
              <View style={styles.rowMain}>
                <Text style={styles.personName}>{person.name}</Text>
                <Text style={styles.personSub}>
                  {person.mentions} mention{person.mentions !== 1 ? 's' : ''}
                  {' · '}
                  {person.dates.size} day{person.dates.size !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Mood delta badge */}
              {hasMood && (
                <View style={[
                  styles.moodBadge,
                  { backgroundColor: moodPositive ? 'rgba(110,191,139,0.12)' : 'rgba(205,127,93,0.12)' }
                ]}>
                  <Ionicons
                    name={moodPositive ? 'trending-up' : 'trending-down'}
                    size={11}
                    color={moodPositive ? PALETTE.emerald : PALETTE.copper}
                  />
                  <Text style={[
                    styles.moodDelta,
                    { color: moodPositive ? PALETTE.emerald : PALETTE.copper }
                  ]}>
                    {moodPositive ? '+' : ''}{person.moodDelta}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={12} color={PALETTE.muted} />
        <Text style={styles.footerText}>
          Mood delta = avg mood on days this person appears vs your overall average
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderTopColor: PALETTE.borderTop,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle: {
    color: PALETTE.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: PALETTE.surface,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  personName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  personSub: {
    color: PALETTE.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moodDelta: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 12,
  },
  footerText: {
    color: PALETTE.muted,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
    fontStyle: 'italic',
  },
});
