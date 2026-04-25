import { type DailyAggregate } from '../services/insights/types';
import type { CrossRefInsight } from './selfKnowledgeCrossRef';

export type PatternLibraryItem = {
  title: string;
  body: string;
};

export type PatternLibrarySection = {
  title: string;
  items: PatternLibraryItem[];
};

function stableVariantSeed(...parts: Array<string | undefined>): number {
  return parts
    .filter(Boolean)
    .join('|')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function chooseVariant(options: string[], seedSource: string): string {
  if (options.length === 0) return '';
  return options[stableVariantSeed(seedSource) % options.length];
}

function sectionTitleForSource(source: CrossRefInsight['source']) {
  switch (source) {
    case 'relationship':
      return 'Relational Patterns';
    case 'values':
      return 'Values Taking Shape';
    case 'somatic':
      return 'Body Signals';
    case 'triggers':
      return 'What Activates Your System';
    case 'reflection':
      return 'Reflection Themes';
    case 'archetype':
      return 'Emerging Protective Patterns';
    case 'cognitive':
      return 'How You Seem To Process';
    default:
      return 'Pattern Analysis';
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function composeVariant(groups: string[][], seedSource: string): string {
  const seed = stableVariantSeed(seedSource);
  return cleanText(
    groups
      .map((options, index) => options[(seed + index * 17) % options.length] ?? '')
      .join(' ')
  );
}

function soundsBroken(text: string): boolean {
  const normalized = cleanText(text).toLowerCase();

  return (
    normalized.length < 20 ||
    /[a-z]+(?:-[a-z]+){3,}/.test(normalized) ||
    normalized.includes('-on-an-o') ||
    normalized.includes('-asks-me-to-tru') ||
    normalized.split(/\s+/).filter((token) => token.length < 3).length >
      Math.max(4, Math.floor(normalized.split(/\s+/).length * 0.35))
  );
}

function soundsTooGeneric(title: string, body: string): boolean {
  const combined = `${title} ${body}`.toLowerCase();

  const genericPhrases = [
    'your intelligence profile',
    'your cognitive style',
    'your dominant pattern',
    'you are healing',
    'you adapt to frameworks quickly',
    'linguistic and logical-mathematical',
    'reflection practice',
  ];

  return genericPhrases.some((phrase) => combined.includes(phrase));
}

function rewriteSourceTitle(insight: CrossRefInsight): string {
  switch (insight.source) {
    case 'values':
      return 'The values underneath your decisions are getting harder to miss';
    case 'somatic':
      return 'Your body keeps joining the conversation in the same place';
    case 'triggers':
      return 'The same conditions keep changing the way your system lands';
    case 'relationship':
      return 'The same relationship pressure points keep returning';
    case 'reflection':
      return 'Your reflections keep circling the same emotional territory';
    case 'archetype':
      return 'The way you protect yourself under strain is getting clearer';
    case 'cognitive':
      return 'The archive is learning how your mind tries to make things make sense';
    default:
      return insight.title;
  }
}

function softenIdentityLanguage(text: string): string {
  return cleanText(
    text
      .replace(/\bYour intelligence profile is\b/gi, 'An early pattern suggests you may rely most on')
      .replace(/\bYour cognitive style is\b/gi, 'An early pattern suggests you may')
      .replace(/\bYour dominant pattern is\b/gi, 'A recurring pattern suggests')
      .replace(/\bThe Caregiver Under Pressure\b/gi, 'A caregiving pattern may be showing up under strain')
      .replace(/\bYou adapt to frameworks quickly and move decisively\b/gi, 'You may move more quickly once something starts to make internal sense')
      .replace(/\bLinguistic and Logical-Mathematical\b/gi, 'language and structured sense-making')
      .replace(/\bshadow\b/gi, 'risk')
  );
}

function rewriteBodyForSource(insight: CrossRefInsight): string {
  const cleaned = cleanText(insight.body);

  switch (insight.source) {
    case 'values':
      return softenIdentityLanguage(
        cleaned.replace(
          /^Your top values are/i,
          'Across your recent reflections, the same values keep sitting underneath the story'
        )
      );

    case 'somatic':
      return softenIdentityLanguage(
        cleaned
          .replace(/^Back and spine tension keeps surfacing/i, 'A repeated body pattern is surfacing around your back and spine')
          .replace(/\bThis usually means\b/gi, 'This may point to')
      );

    case 'triggers':
      return softenIdentityLanguage(
        cleaned
          .replace(/\bkeep helping\b/gi, 'keep appearing beside your steadier days')
          .replace(/\bhelping you recover\b/gi, 'appearing around recovery')
          .replace(/\bThese are your recovery ingredients\b/gi, 'These appear to be part of what helps your system come back')
      );

    case 'relationship':
      return softenIdentityLanguage(
        cleaned
          .replace(/\bYour relational mirror\b/gi, 'Your relationship history is starting to show a repeatable pattern')
          .replace(/\bThis reveals\b/gi, 'This may suggest')
      );

    case 'reflection':
      return softenIdentityLanguage(
        cleaned
          .replace(/\bReflection practice\b/gi, 'Your reflection archive is getting specific enough to read')
          .replace(/\bThis shows\b/gi, 'This begins to show')
      );

    case 'archetype':
      return softenIdentityLanguage(
        cleaned
          .replace(/\bYour archetype\b/gi, 'An emerging protective pattern')
          .replace(/\bYou are\b/gi, 'You may be')
      );

    case 'cognitive':
      return softenIdentityLanguage(
        cleaned
          .replace(/\bThis means\b/gi, 'This may mean')
          .replace(/\bYou are\b/gi, 'You may be')
      );

    default:
      return softenIdentityLanguage(cleaned);
  }
}

function fallbackBodyForSource(insight: CrossRefInsight): string {
  const seed = `${insight.id}:${insight.title}:${insight.body}`;
  switch (insight.source) {
    case 'values':
      return composeVariant([
        [
          'Your recent reflections are not pointing in random directions.',
          'The archive is picking up a value pattern underneath the details.',
          'What you keep returning to in writing is starting to organize itself.',
          'The emotional logic underneath your choices is getting easier to read.',
        ],
        [
          'The same needs keep sitting underneath the story.',
          'What matters to you keeps shaping the page before you fully explain it.',
          'The archive keeps catching the same standards for what feels livable, honest, or emotionally clean.',
          'Your entries keep bending toward the same kind of inner yes and inner no.',
        ],
        [
          'That usually means your values are already active, not aspirational.',
          'That is where preference turns into pattern.',
          'When the same principles keep surfacing, MySky treats them as part of your decision-making spine.',
          'This is less about ideals and more about what your system actually keeps protecting.',
        ],
        [
          'The useful part is that this gives the archive something real to name about how you choose.',
          'It gives MySky a more personal read than simply tracking whether the week felt good or bad.',
          'That makes the pattern actionable, because values tend to show up before clarity does.',
          'It means your archive is starting to say what matters to you, not just what happened.',
        ],
      ], seed);
    case 'somatic':
      return composeVariant([
        [
          'Your body data is repeating in a way that is no longer stray.',
          'The same physical signal keeps appearing beside heavier days.',
          'This somatic pattern is getting too consistent to dismiss as coincidence.',
          'Your body keeps marking the same territory when things are harder to carry.',
        ],
        [
          'One region seems to be carrying more of the emotional load than the rest.',
          'The archive keeps seeing the same area register strain before the full feeling becomes verbal.',
          'That usually means your body is speaking earlier than language does.',
          'It suggests your nervous system has a preferred place to store pressure when capacity thins out.',
        ],
        [
          'MySky treats that as emotional pattern, not generic discomfort.',
          'When the same body cue repeats, it becomes part of your warning system.',
          'This is how a symptom becomes usable information.',
          'The repetition is what turns sensation into signal.',
        ],
        [
          'That matters because body awareness often arrives before interpretation does.',
          'It gives the archive a way to name what is happening earlier in the cycle.',
          'The practical value is that you can respond before the day fully unravels.',
          'It means your body may be giving you honest data ahead of your mind.',
        ],
      ], seed);
    case 'triggers':
      return composeVariant([
        [
          'Your trigger and recovery data are beginning to separate themselves cleanly.',
          'The archive is starting to sort what reliably drains you from what actually helps you come back.',
          'This read suggests your harder moments are gathering around repeatable conditions.',
          'A real nervous-system map is starting to emerge from the overlap in your entries.',
        ],
        [
          'Some conditions keep clustering around lower-capacity days.',
          'Other conditions show up closer to steadier or more recoverable moments.',
          'That distinction matters more than any single mood score by itself.',
          'It means context is starting to explain the shift instead of the archive calling it random.',
        ],
        [
          'MySky can begin telling the difference between background pressure and an actual trigger.',
          'This is where the archive starts becoming useful instead of merely descriptive.',
          'It is the first sign that your system has repeatable activation rules.',
          'That makes the pattern legible enough to plan around.',
        ],
        [
          'Once the map is clearer, the app can say more than “this week was hard.”',
          'The premium value here is precision: what changes your landing, and what helps it settle again.',
          'That turns pattern language into something protective, not decorative.',
          'It gives you a way to respond earlier and with less self-blame.',
        ],
      ], seed);
    case 'relationship':
      return composeVariant([
        [
          'Your relationship reflections are not just documenting separate moments.',
          'The same relational pressure points keep appearing often enough to form a pattern.',
          'What repeats here looks bigger than a few isolated disappointments.',
          'Your archive is beginning to show how connection changes shape under stress.',
        ],
        [
          'They are starting to show what helps closeness feel safer for you.',
          'They also show what reliably makes connection tighten, wobble, or become hard to trust.',
          'The recurring question is less about one person and more about the conditions of steadiness.',
          'What keeps surfacing is the difference between contact and felt safety.',
        ],
        [
          'That is usually how attachment patterns become visible.',
          'When the same friction appears across entries, MySky stops treating it as one bad moment.',
          'It means the archive is picking up the rules your system uses for trust.',
          'This is where relational data becomes emotionally meaningful.',
        ],
        [
          'The value is that the pattern names what you may be protecting in closeness.',
          'That gives the app a more intimate read than simply tracking whether a relationship went well.',
          'It helps explain why some connection lands as regulation while other connection lands as labor.',
          'It means your archive can start saying what kind of closeness actually works for you.',
        ],
      ], seed);
    case 'reflection':
      return composeVariant([
        [
          'Your reflections are returning to the same emotional territory often enough to matter.',
          'The archive keeps finding the same kinds of questions underneath your writing.',
          'This reflection pattern is no longer reading like a passing mood.',
          'Something in your inner world keeps reopening the same stretch of ground.',
        ],
        [
          'That repetition usually means the material has not fully metabolized yet.',
          'The same emotional concerns keep reappearing with different wording but similar weight.',
          'You may be circling something that still wants a clearer form.',
          'The archive is seeing undercurrent, not noise.',
        ],
        [
          'MySky treats that recurrence as signal rather than redundancy.',
          'This is how a personal theme starts to reveal itself before it has a neat name.',
          'When writing bends toward the same pressure point, the archive reads depth instead of repetition fatigue.',
          'It is the repetition itself that earns the pattern.',
        ],
        [
          'That gives the app permission to say more than “you reflected this week.”',
          'It means the archive can begin naming what your mind keeps returning to after the day ends.',
          'This is the kind of consistency that turns journaling into self-knowledge.',
          'The result is a more personal read of what your inner world is still working through.',
        ],
      ], seed);
    case 'archetype':
      return composeVariant([
        [
          'A repeatable protective style is starting to appear in how you respond under strain.',
          'When pressure rises, you do not seem to respond randomly.',
          'This pattern looks less like personality branding and more like survival logic.',
          'The archive is beginning to recognize the shape your protection takes when capacity drops.',
        ],
        [
          'It is early, but concrete enough to notice without pretending the picture is finished.',
          'The same maneuver keeps showing up when your system feels exposed.',
          'There appears to be a recognizable way you brace, withdraw, manage, or over-function.',
          'What repeats is not the exact event but the method of self-protection.',
        ],
        [
          'That is how a protective pattern earns its name.',
          'MySky can start mapping the strategy without flattening you into a label.',
          'The point is not to brand your personality but to understand the move your system trusts.',
          'This is useful because protection styles often become invisible from the inside.',
        ],
        [
          'Once the move is visible, you can decide when it is helping and when it is costing you.',
          'The premium value is not the archetype label itself but the self-recognition underneath it.',
          'That gives the archive a more honest read of how you survive strain.',
          'It means the card is naming a pattern you can actually work with, not just admire.',
        ],
      ], seed);
    case 'cognitive':
      return composeVariant([
        [
          'An early pattern is forming in how clarity arrives for you.',
          'Your data suggests you do have a recognizable processing style.',
          'This read is less about labels and more about sequence.',
          'The archive is beginning to notice what helps understanding actually lock into place.',
        ],
        [
          'It is starting to see how you move from confusion to coherence.',
          'It is also noticing what tends to interrupt that movement.',
          'Your mind seems to need certain conditions before a decision feels settled.',
          'Clarity for you may be less instant and more layered than it first appears.',
        ],
        [
          'That matters because mental style shapes emotional friction too.',
          'When MySky sees the sequence, it can stop offering generic advice about focus or decisiveness.',
          'This is where the archive starts reading how your mind works instead of just what you thought.',
          'A processing pattern becomes useful once it explains why some days click and others stay mentally sticky.',
        ],
        [
          'The practical value is knowing what kind of internal order helps you think cleanly.',
          'It gives the card a real job: naming the conditions your mind needs, not handing you a label.',
          'That is what makes the pattern feel personal rather than personality-test generic.',
          'It means the archive is learning the route your mind takes toward clarity.',
        ],
      ], seed);
    default:
      return composeVariant([
        [
          'A repeatable pattern is beginning to show across your recent entries.',
          'Your archive is no longer showing isolated moments only.',
          'This is still an early read, but it already looks more like pattern than noise.',
          'Something is repeating often enough for MySky to stop treating it as coincidence.',
        ],
        [
          'The label matters less than the recurrence right now.',
          'What gives it weight is the fact that it keeps coming back under different conditions.',
          'The archive is catching the same shape from more than one angle.',
          'That is how a vague impression becomes usable signal.',
        ],
        [
          'MySky treats repetition as earned evidence.',
          'That is the threshold where interpretation starts becoming justified.',
          'The signal is not finished, but it is no longer random.',
          'This is where the app begins moving from recap into recognition.',
        ],
        [
          'The value is that the archive can start saying something personal sooner, without overclaiming.',
          'It means your data is beginning to carry emotional meaning rather than isolated snapshots.',
          'That gives the pattern card something real to stand on.',
          'It lets MySky name what repeats without pretending the whole story is already complete.',
        ],
      ], seed);
  }
}

function refineCrossRefTitleAndBody(insight: CrossRefInsight): PatternLibraryItem | null {
  if (soundsBroken(insight.title) || soundsBroken(insight.body)) {
    return {
      title: rewriteSourceTitle(insight),
      body: fallbackBodyForSource(insight),
    };
  }

  const rewrittenTitle = rewriteSourceTitle(insight);
  const rewrittenBody = rewriteBodyForSource(insight);

  if (soundsTooGeneric(rewrittenTitle, rewrittenBody)) {
    return {
      title: rewriteSourceTitle(insight),
      body: fallbackBodyForSource(insight),
    };
  }

  return {
    title: rewrittenTitle,
    body: rewrittenBody,
  };
}

function buildCheckInTrendItems(dailyAggregates: DailyAggregate[]): PatternLibraryItem[] {
  const tagCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  let dreamDays = 0;
  let highStressDays = 0;

  for (const day of dailyAggregates) {
    if (day.hasDream) dreamDays += 1;
    if (day.stressAvg >= 6) highStressDays += 1;

    for (const tag of day.tagsUnion) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }

    for (const keyword of day.keywordsUnion) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count >= 2)
    .slice(0, 2);

  const aggregateItems: PatternLibraryItem[] = [];

  if (topTags.length > 0) {
    const [firstTag, secondTag] = topTags;
    const labels = topTags.map(([tag]) => readableLabel(tag));
    aggregateItems.push({
      title: 'These states are not isolated anymore',
      body: secondTag
        ? `${labels[0]} appeared ${firstTag[1]} times and ${labels[1]} appeared ${secondTag[1]} times across your recent check-ins. That repetition suggests they are part of the same emotional climate, not just one-off moods.`
        : `${labels[0]} appeared ${firstTag[1]} times in your recent check-ins. When the same state keeps returning, MySky treats it as part of your baseline story rather than a stray day.`,
    });
  }

  if (topKeywords.length > 0) {
    const [firstKeyword, secondKeyword] = topKeywords;
    const labels = topKeywords.map(([keyword]) => readableLabel(keyword));
    aggregateItems.push({
      title: 'Your writing keeps returning to the same pressure points',
      body: secondKeyword
        ? `${labels[0]} and ${labels[1]} keep surfacing in your reflections. When the same themes repeat across multiple days, the archive starts reading them as emotional territory you are still actively working through.`
        : `${labels[0]} keeps surfacing in your reflections. Repetition like that usually means your inner world is still asking for attention in the same place.`,
    });
  }

  if (dreamDays >= 3 || highStressDays >= 3) {
    aggregateItems.push({
      title: 'The archive has enough contrast to read more honestly',
      body:
        dreamDays >= 3
          ? `${dreamDays} recent days included dream material. That matters because MySky can now compare what your nights are processing with how your days are landing emotionally.`
          : `${highStressDays} recent days landed in a higher-stress range. That gives the archive enough contrast to see what changes in your system when pressure is no longer subtle.`,
    });
  }

  return aggregateItems;
}

export function buildPatternLibraryState(
  dailyAggregates: DailyAggregate[],
  crossRefs: CrossRefInsight[] = [],
) {
  const entryCount = dailyAggregates.reduce((sum, day) => sum + day.checkInCount, 0);

  const refinedCrossRefs = crossRefs.map(refineCrossRefCopy);

  const groupedInsightSections = refinedCrossRefs.reduce<PatternLibrarySection[]>((sections, insight) => {
    const item = refineCrossRefTitleAndBody(insight);
    if (!item) return sections;

    const title = sectionTitleForSource(insight.source);
    const existing = sections.find((section) => section.title === title);

    if (existing) {
      existing.items.push(item);
    } else {
      sections.push({ title, items: [item] });
    }

    return sections;
  }, []);

  const realInsightItems = groupedInsightSections.flatMap((section) => section.items);
  const hasThreshold = entryCount >= 5 || groupedInsightSections.length > 0;

  if (!hasThreshold) {
    return {
      statusLine: 'Archive still too thin for a real pattern read',
      helperText:
        'MySky should not guess. Add a few more check-ins, then layer in relationship reflections, trigger logs, somatic entries, or daily reflections so the archive has enough evidence to say something specific and earned.',
      items: [] as PatternLibraryItem[],
      sections: [] as PatternLibrarySection[],
    };
  }

  const aggregateItems = buildCheckInTrendItems(dailyAggregates);
  const aggregateSections: PatternLibrarySection[] =
    aggregateItems.length > 0
      ? [{ title: 'Check-In Trends', items: aggregateItems }]
      : [];

  const items = [...realInsightItems, ...aggregateItems];
  const sections = [...groupedInsightSections, ...aggregateSections];
  const hasAnalysisWithoutCrossRefs = entryCount >= 5 && groupedInsightSections.length === 0;

  return {
    statusLine: hasAnalysisWithoutCrossRefs ? 'Check-in read is live' : 'Archive read refreshed today',
    helperText:
      groupedInsightSections.length > 0
        ? 'This library is built from the patterns your archive keeps repeating strongly enough to name. It refreshes from your recent check-ins, reflections, and self-knowledge entries.'
        : 'Your check-in trends are strong enough to read, but the deeper source-specific sections need more relational, somatic, trigger, or reflection evidence before MySky should make stronger claims.',
    items,
    sections,
  };
}

export function readableLabel(value: string) {
  return value
    .replace(/^eq_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function refineCrossRefCopy(insight: CrossRefInsight): CrossRefInsight {
  if (insight.source === 'values') {
    return {
      ...insight,
      title: 'The values underneath your decisions are getting harder to miss',
      body: insight.body.replace(
        /^Your top values are/i,
        'Across your recent reflections, the same values keep sitting underneath the story'
      ),
    };
  }

  if (insight.source === 'cognitive') {
    return {
      ...insight,
      title: 'The archive is learning how your mind tries to make things make sense',
      body: softenIdentityLanguage(insight.body),
    };
  }

  if (insight.source === 'archetype') {
    return {
      ...insight,
      title: 'The way you protect yourself under strain is getting clearer',
      body: softenIdentityLanguage(insight.body),
    };
  }

  if (insight.source === 'reflection') {
    return {
      ...insight,
      title: 'Your reflections keep circling the same emotional territory',
      body: cleanText(insight.body),
    };
  }

  return {
    ...insight,
    title: cleanText(insight.title),
    body: cleanText(insight.body),
  };
}
