/**
 * demoSeedService.ts
 *
 * Seeds realistic demo data for the App Store reviewer account only.
 * Triggers automatically on sign-in for brittanyapps@outlook.com if the
 * device has no existing charts (i.e. fresh install / fresh account).
 *
 * All other accounts are completely unaffected.
 */

import type { MoonPhaseKeyTag } from '../../utils/moonPhase';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDb } from './localDb';
import { EncryptedAsyncStorage } from './encryptedAsyncStorage';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

// ─── Config ───────────────────────────────────────────────────────────────────

const DEMO_EMAIL = 'brittanyapps@outlook.com';

// Flag stored in AsyncStorage to prevent re-seeding on subsequent logins
const SEED_FLAG_KEY = '@mysky:demo_seeded';
// Tracks the last date a daily entry was seeded (YYYY-MM-DD)
const DAILY_SEED_KEY = '@mysky:demo_last_seeded';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Crypto.randomUUID();
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysBefore(n: number): Date {
  const d = new Date('2026-03-30T12:00:00.000Z');
  d.setDate(d.getDate() - n);
  return d;
}

/** Simple numeric hash of a string — used for deterministic content rotation */
function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const CHART_ID = uid();
const CHART_CREATED = new Date('2026-03-16T09:00:00.000Z').toISOString();

const MOON_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const LUNAR_PHASES: MoonPhaseKeyTag[] = ['waxing_crescent','first_quarter','waxing_gibbous','full','waning_gibbous','last_quarter','waning_crescent','new'];
const MOODS = ['calm','soft','okay','heavy','stormy'] as const;
const AWAKEN_STATES = ['calm','curious','thoughtful','peaceful','inspired','unsettled','hopeful','relieved'];
const DREAM_THEMES = ['transformation','connection','discovery','mystery','adventure','conflict','loss','surreal'];
const ENERGY_LEVELS = ['low','medium','high'] as const;
const STRESS_LEVELS = ['low','medium','high'] as const;

const journalTitles = [
  'A slow morning with coffee and clarity',
  'Processing the week',
  'Something shifted today',
  'Gratitude for small moments',
  'A hard conversation worth having',
  'Full moon feelings',
  'Finding my rhythm again',
  'Letting go of what I can\'t control',
  'Quiet strength',
  'Dreaming bigger',
  'Rest as resistance',
  'Checking in with myself',
  'What I\'m learning about patience',
  'Today felt like a turning point',
];

const journalContents = [
  'Woke up slowly today and didn\'t rush into anything. Made coffee, sat by the window, and let the morning just be what it was. There\'s something about not immediately reaching for my phone that changes the whole energy of a day. I felt more grounded than I have in weeks. Grateful for this practice of just noticing.',
  'Had a moment this afternoon where I caught myself overthinking everything — the future, decisions I haven\'t made yet, conversations still unspoken. I took a breath and wrote it all out, and by the end I realized most of my anxiety was about things I genuinely can\'t control right now. What I can do is just show up, one day at a time.',
  'Something shifted today around midday. Hard to put words to it — just a feeling that I\'m moving in the right direction. Like something that had been tightly wound is slowly loosening. I want to be careful not to over-analyze it. Sometimes the body knows before the mind does.',
  'Three things I\'m deeply grateful for today: the sound of rain on the windows this morning, a message from an old friend who just checked in, and the fact that I made it through a hard week without falling apart. Gratitude isn\'t toxic positivity — it\'s choosing to mark what\'s real and good.',
  'Had a difficult but necessary conversation today. Said something I\'d been holding back for weeks. It wasn\'t perfect — I stumbled over my words, second-guessed myself halfway through — but I said it. And the world didn\'t end. If anything, I feel lighter. Boundaries really are a form of self-respect.',
  'Full moon nights always make me feel a little tender. Like the extra light is illuminating the parts of myself I usually keep in shadow. Sat outside for a while tonight and just let myself feel whatever came up. A little grief, a little hope. Both are true simultaneously. I\'m getting more okay with that.',
  'Better day than yesterday. Got back into my morning routine — movement, water, a few minutes of stillness before the day starts. My body is such a reliable barometer when I actually listen to it. When I skip the basics, everything feels harder. When I honor them, I feel like myself again.',
  'Trying to practice releasing outcomes I can\'t control. It\'s uncomfortable — I like having a plan, knowing what\'s coming. But I\'m recognizing that clinging to certainty is exhausting me. Today I held something loosely that I would have normally gripped tight. It wasn\'t easy, but it felt like growth.',
  'Quiet day. Stayed close to home, finished a few things I\'d been avoiding, cooked an actual meal. There\'s something profound about taking care of the basics. Not every day needs to be dramatic or revelatory. Sometimes quiet strength looks like making soup and going to bed on time.',
  'Started dreaming about things I\'ve been too afraid to want openly. Wrote them down this morning before they faded. I notice the resistance — the old voice that says "who are you to want that?" But I\'m starting to answer back. I am exactly who I am, and that is allowed to be enough.',
  'Rest used to feel like laziness to me. I\'m rewiring that. Today I took a long nap and didn\'t feel guilty about it. My body needed it. The productivity guilt crept in briefly, then I remembered: rest is how the nervous system regulates. It is not avoidance. It is repair.',
  'Checking in with myself today felt different — more honest than it usually is. I admitted to myself that I\'ve been running on low-grade anxiety for a while. Not crisis, just a hum. I want to trace that back to its root. That feels like the work right now.',
  'I used to think patience was passive. I\'m learning it\'s not. Patience is active — it\'s choosing not to force an outcome, choosing to trust the timing, choosing to stay present when everything in you wants resolution.',
  'Today had a different quality to it — like I could feel the next chapter arriving. I\'m not sure what that means concretely. But something in me is ready. Ready to be more, ask for more, give from a more solid foundation.',
];

const dreamTexts = [
  'I was in a house I didn\'t recognize but somehow felt was mine. Every room had a door I hadn\'t opened. At the end of a hallway there was soft golden light and I kept moving toward it but never arrived. I wasn\'t scared though — just curious, and strangely at peace.',
  'Running through a forest with someone I couldn\'t see clearly. There was urgency but not fear — more like we were late for something important. The trees were enormous and luminous, almost glowing.',
  'Standing in an ocean up to my waist. The water was warm and completely still. Someone was wading toward me from the horizon. We didn\'t speak. Just stood together in the water while the light turned pink and purple.',
  'Flying low over a city I didn\'t recognize. I could feel the wind and it was completely real. I kept thinking: I should be afraid, but I\'m not. Eventually I landed in a courtyard full of plants and just sat there in the sun.',
  'I was in a classroom taking a test I hadn\'t studied for. Classic dream. But this time I just laughed at the paper and set it down. Walked out into a hallway full of windows overlooking mountains. That part felt like freedom.',
  'A field of flowers stretching endlessly. Everything was vivid — more vivid than waking life. I was with people I love but their faces were soft, blurred by light. We were lying in the grass watching clouds shift shape.',
  'I was a child again in my grandmother\'s house. All the details were right — the smell of the hallway, the texture of the rug, the sound of the fan. I felt completely safe. Woke up tearful in a good way.',
  'Standing at the edge of something — a cliff, a bridge — but it didn\'t feel dangerous. There was a voice telling me to jump, not threatening but inviting. The water below was clear and deep.',
  'Driving a car that kept changing direction on its own. Not crashing — just redirecting. I kept trying to turn one way and ending up somewhere unexpected that turned out to be exactly right.',
  'In a library that had no ceiling, just open sky. The books were enormous and smelled like rain. I was looking for something specific but kept finding other things — maps, drawings, letters.',
  'A recurring figure — someone faceless but deeply familiar — appeared again. This time we sat across from each other at a table and they slid a piece of paper toward me. When I reached for it I woke up.',
  'Swimming in dark water that wasn\'t frightening. Bioluminescent creatures moving slowly around me. I felt completely held. Surfaced into a night sky full of stars and floated on my back.',
  'I was back in a neighborhood from childhood, but everything was slightly shifted — the houses were the same but taller, the street quieter.',
  'A dream where nothing happened, really, but it was beautiful. Just light and color and a feeling of deep, deep rest. Like the dream itself was the message: you\'re okay.',
];

const dreamFeelingMaps = [
  [{ id: 'wonder', intensity: 4 }, { id: 'peace', intensity: 3 }],
  [{ id: 'urgency', intensity: 3 }, { id: 'curiosity', intensity: 4 }],
  [{ id: 'longing', intensity: 4 }, { id: 'warmth', intensity: 5 }],
  [{ id: 'freedom', intensity: 5 }, { id: 'awe', intensity: 3 }],
  [{ id: 'relief', intensity: 4 }, { id: 'humor', intensity: 2 }],
  [{ id: 'joy', intensity: 5 }, { id: 'tenderness', intensity: 4 }],
  [{ id: 'nostalgia', intensity: 5 }, { id: 'safety', intensity: 4 }],
  [{ id: 'anticipation', intensity: 4 }, { id: 'stillness', intensity: 3 }],
  [{ id: 'surrender', intensity: 3 }, { id: 'trust', intensity: 4 }],
  [{ id: 'wonder', intensity: 5 }, { id: 'mystery', intensity: 4 }],
  [{ id: 'confusion', intensity: 3 }, { id: 'familiarity', intensity: 4 }],
  [{ id: 'peace', intensity: 5 }, { id: 'awe', intensity: 4 }],
  [{ id: 'nostalgia', intensity: 4 }, { id: 'melancholy', intensity: 2 }],
  [{ id: 'safety', intensity: 5 }, { id: 'peace', intensity: 5 }],
];

const insightGreetings = [
  'Good morning, Brittany — the sky has been watching over you while you slept.',
  'Brittany, something beneath the surface is quietly completing itself today.',
  'The threshold you\'ve been standing at is beginning to open, Brittany.',
  'Brittany, your chart carries a rare alignment today — the kind that only comes when the inner work has been done.',
  'Something in you is becoming more fully itself, Brittany. Honour that movement.',
  'Brittany, the cosmos is offering you a moment of unusual clarity. Receive it.',
  'You are not behind, Brittany. You are exactly where this season has been placing you.',
  'Brittany, the sky today echoes what your body already knows: you are ready.',
  'A quiet but significant shift is underway in your chart, Brittany. Stay close to yourself.',
  'Brittany, today the light enters from a new angle. Let it illuminate what you\'ve been afraid to see.',
  'Your depth is not a burden, Brittany — it is the exact quality that makes your path worth walking.',
  'Something that has been gathering momentum beneath the surface is about to break through, Brittany.',
  'Brittany, your chart speaks of integration today — the merging of who you\'ve been with who you\'re becoming.',
  'This is a day for arrival, Brittany. You\'ve been earning this ground for a long time.',
];

const loveHeadlines = ['The intimacy you\'ve been protecting yourself from','What your nervous system does before your heart decides','Receiving without shrinking','The love that requires you to stay','Honesty as the deepest act of care','What you learned love was — and what it actually is','Desire and the fear of wanting too much','Vulnerability is the point, not the risk','Presence as the rarest gift you can offer','The pattern that ends when you name it','The longing beneath the longing','Closeness that doesn\'t ask you to disappear','What needs repair before it can renew','Being known without editing yourself first'];
const energyHeadlines = ['Precision over volume','The kind of momentum that actually lasts','Where your energy is leaking — and how to reclaim it','Your body is the primary instrument','The productivity hiding inside stillness','Rest that is not avoidance','Building at the level of foundation, not facade','The creative state you can\'t force — only invite','Sustainable effort as a spiritual practice','Getting back into your rhythm after you\'ve lost it','What it means to be focused and fully present at once','Energy is information — what is yours saying?','Discernment: the discipline of doing less, better','What becomes possible when you stop managing and start moving'];
const growthHeadlines = ['The lesson is in the repetition, not despite it','Growth is not always forward — sometimes it\'s release','The identity that served you then is limiting you now','What this moment is asking you to see about yourself','Courage rarely announces itself before it\'s needed','You are not the same person who started this journey','Unlearning is the hardest and most necessary work','The discomfort is not a signal to stop — it\'s the signal you\'re close','What becomes visible when the noise quiets','You are in the long arc — and the long arc is bending','The process does not need your trust to be working','This season is not wasting your time — it\'s building your character','Expansion that is rooted does not sweep you away','The version of you arriving has been prepared by everything you\'ve survived'];

const loveMessages = [
  'With Venus active in your natal chart today, there is an invitation to examine the armor you wear before entering closeness. Not the protection earned through genuine discernment — but the older armor, the kind built during a time when you had no other option. That armor kept you safe then. Ask yourself honestly today: who are you still keeping out that you actually want to let in?',
  'Your Moon placement in Virgo creates a pattern where emotional safety becomes tied to being useful, to being needed. You give care fluently and receive it awkwardly. Today, notice the moment someone offers you something — warmth, help, attention — and your instinct contracts. That contraction is where the real work lives.',
  'There is a version of connection you have imagined and a version you have actually allowed yourself to receive. The gap between those two is not the other person\'s failure — it is the distance between what you say you want and what your nervous system currently believes is safe.',
  'Mars in your chart today activates a deep pull toward authenticity over performance in intimate space. You have spent real energy showing up as the version of yourself you believe is most lovable. But the people who matter most are not asking for a performance. They are asking for your actual presence.',
  'What you call independence is partly freedom and partly protection. Today\'s sky asks you to hold both truths at once: you have genuine strength, and you also use that strength to avoid the particular vulnerability of needing someone who might not stay.',
  'Your natal Venus in Aries carries a paradox: you desire deep, lasting intimacy, and you also move fast, test quickly, and close the door when you feel unseen. Today, practice the discipline of staying one moment longer in tender ground than feels comfortable.',
  'Something about your relational history has taught you to track for early signs of abandonment. You have become extraordinarily skilled at reading tone shifts, delays, changes in warmth. Today, ask: is this skill protecting me, or is it keeping me in a permanent state of low-level surveillance?',
  'Your chart indicates a rare moment where the walls between your inner life and your expressed life are thinner than usual. What you feel today, you can actually say. Today, trust the first language. Say the thing before the edit.',
  'There is a specific kind of loneliness that comes not from being alone but from being fundamentally unseen in a room full of people. Your chart today draws it forward — not to reopen the wound, but because you are ready to understand it differently.',
  'The pattern your chart is illuminating today is the gap between how generously you hold space for others and how rarely you ask for the same. Today, practice turning that witnessing toward the relationship itself.',
  'With Neptune aspecting your Venus this week, the line between who someone is and who you need them to be may feel blurred. The practice today is discernment: see the person in front of you as clearly as possible, separate from the story you\'ve been building.',
  'Healing in relationship does not always look like resolution. Sometimes it looks like staying present through something uncomfortable without shutting down or spiraling.',
  'Your chart carries the signature of someone who has done significant inner work and is beginning to be ready for the love that reflects it. Not the love that requires you to be smaller, more careful, more contained.',
  'Today, your Sun-Venus connection in your natal chart activates a profound truth: the intimacy you most want is not primarily about the other person. It is about your willingness to stay in contact with yourself while also staying in contact with another.',
];

const energyMessages = [
  'Your natal Mars in Libra asks you to move purposefully today — not from urgency, but from clarity. Before you begin today, name one thing that, if done well, would make everything else feel worth it. Begin there.',
  'You are someone whose energy builds in waves, not in steady streams. Today the wave is gathering, not yet cresting. Your instinct will be to push through the gathering phase. Notice that instinct today, and choose differently.',
  'There is something in your current life that is quietly consuming energy you haven\'t consciously assigned to it. An unresolved conversation, a decision being perpetually deferred. Your body has been managing this without telling your mind.',
  'Your Virgo Moon creates a particular relationship with your body: you know how to work through discomfort, to override signals in service of productivity. Today, try the inverse. Start with the body. Let it lead this once.',
  'Stillness is not the absence of productivity. For someone with your chart — an active mind, a strong drive, deep sensitivity — periods of deliberate non-doing are when the integration happens. Do less in order to consolidate more.',
  'Your nervous system has been running in a state of low-grade alertness. Rest today is the specific, necessary act of returning your body to its regulated baseline. From that baseline, everything — creativity, connection, clarity — becomes available again.',
  'Something you are building is being built correctly — from the ground up, from principle outward, from self-knowledge into structure. The pace feels slow because you are doing it properly. Stay with the foundation.',
  'Your chart today holds a signature associated with creative breakthrough — the kind that arrives when you stop gripping and let your attention soften. Today, rotate toward what is interesting rather than what is required.',
  'Sustainable effort is not a productivity framework. It is a form of self-respect. For someone who feels as much as you do, the commitment to sustainable effort is the commitment to still being present in six months.',
  'You have been off your rhythm. The prescription is not to push harder. It is to return to the two or three anchors that, when present, make you feel like yourself. Begin there.',
  'Today your chart marks a window of unusual focus. Use it precisely. Not on the emails, not on maintenance tasks. On the thing that matters most and has been waiting longest for your full presence.',
  'Your energy is information, and right now it is telling you something specific if you are still enough to hear it. Follow the feeling of aliveness. Wherever you feel it, lean in.',
  'The discipline of discernment — of choosing depth over breadth, of saying no in order to say yes well — is one of the most advanced forms of productivity. What is the one thing that deserves that quality of focus right now?',
  'Something that has been building is ready to move. The next move is not another round of preparation. It is the first step into action with what you already hold. You have more than you think you need. Begin.',
];

const growthMessages = [
  'The pattern you keep returning to is not a failure of willpower. It is a teaching that has not yet been fully received. Today, rather than trying to break the pattern, try to become genuinely curious about it.',
  'There is a version of growth that looks like acquisition — more skills, more awareness, more insight. And then there is the version that looks like loss: the releasing of a story you\'ve been telling yourself about who you are.',
  'You have been holding an identity that served you during a chapter that is now ending. The identity of someone who manages alone, who doesn\'t need much. That identity is now the ceiling on your next evolution.',
  'Your chart today activates your natal Pluto placement — the part of you that is built for transformation, but not always for comfort. Today, look at one of those things without the impulse to fix it first. Just see it.',
  'Courage, in your chart, lives in the natal placement of your Sun in Pisces — which means your deepest courage is not the dramatic, visible kind. It is the courage of continuing to be sensitive in a world that rewards hardness.',
  'You are not who you were twelve months ago. The evidence is not the things that changed externally. It is the things that no longer trigger you the way they used to. Growth at this level is quiet, almost invisible — but it is real.',
  'Unlearning is harder than learning because it requires you to release the thing that once helped you make sense of the world. Today, notice where your automatic interpretation of a situation feels older than the situation warrants.',
  'The discomfort you are in is not a sign that something is wrong. It is a sign that you are in the middle of something between where you were and what you are becoming. The middle passage is always uncomfortable.',
  'When the noise quiets — the noise of other people\'s opinions, your own worst-case thinking, the noise of comparison — what remains is the signal. It is quiet and it is clear, and it has always known exactly what you need to do.',
  'The arc of your development over the last several years has been bending toward the same thing: the capacity to be fully present in your own life rather than managing it from a safe distance.',
  'Your chart does not require you to trust the process because the process is easy. It asks you to trust it because you have evidence — your own evidence — that something real has been occurring beneath the surface.',
  'This season has not been wasted. The pauses, the confusion, the periods where nothing seemed to resolve — these were not detours from your growth. They were the terrain of it.',
  'Rooted expansion is what your chart speaks of now: not forward movement that loses the thread of who you are, but forward movement that keeps pulling from the same deep source.',
  'The version of you that is arriving has been prepared by every difficult thing you have moved through, every pattern you have named, every moment you chose honesty over comfort. You are more ready than you feel.',
];

const gentleReminders = [
  'Your nervous system is not malfunctioning. It is responding to real things. Give it what it\'s asking for before you ask it to give more.',
  'The kindness you extend so readily to others is not wasted on yourself. You are allowed to be the recipient of your own compassion.',
  'Rest is not something you earn. It is something your body requires. You don\'t have to justify it.',
  'The version of today you planned and the version that actually arrived are allowed to be different. Adjust without punishment.',
  'You are allowed to change your mind. Growing out of an old belief is not inconsistency — it is evidence of genuine learning.',
  'Perfection is a form of self-abandonment dressed as self-improvement. The work is good enough. You are good enough. Move forward.',
  'The feeling of being behind is almost always a story, not a fact. You are not behind. You are exactly where the accumulation of your choices has placed you.',
  'Asking for help is not a sign that you\'ve failed to be enough. It is a sign that you understand how human beings are actually designed to function: in relationship, not in isolation.',
  'Something is allowed to be hard without that meaning you are failing at it. Difficulty is information. It is not a verdict.',
  'Your sensitivity is not a flaw that needs managing. It is a form of intelligence that the world undervalues. You are not too much. You are accurately calibrated.',
  'You are not required to be productive to deserve rest. Not required to perform wellness to deserve care. You are enough in the middle of it.',
  'The pause before you react is one of the most powerful places in your entire psychology. You\'ve already learned to find it. Use it today.',
  'Slowness is not failure. Integration takes the time it takes. You cannot rush becoming.',
  'Whatever you are carrying that belongs to someone else — an old expectation, an inherited belief, a grief that was never yours to hold — you are allowed to set it down. Today.',
];

const journalPrompts = [
  'What am I protecting myself from by staying where I am — and is that thing still as dangerous as I once believed it was?',
  'Where in my body do I first feel the arrival of a difficult emotion — and what does that place need from me right now?',
  'What is the story I tell most often about why I am the way I am — and what would change if I allowed that story to be only partially true?',
  'Who do I become when no one needs anything from me? Do I know how to be that person, or have I lost access to them?',
  'What decision have I been making from fear that I could begin making from desire instead?',
  'What would I let myself want if I trusted that wanting it wouldn\'t jinx it, expose me, or cost me something I can\'t afford to lose?',
  'What has changed in me over the past year that I haven\'t given myself credit for?',
  'Where am I still waiting for permission that only I can give myself?',
  'What is the most honest thing I could say right now to the person I most want to be close to — and what is stopping me from saying it?',
  'What would I do differently if I believed, truly believed, that I was not fundamentally behind?',
  'What am I tolerating in my life that quietly depletes me every day — and what would it cost to stop tolerating it?',
  'Where am I performing a version of myself rather than being one — and what am I afraid would happen if I stopped?',
  'What does the wisest, most grounded version of me already know about my current situation that my anxious self refuses to accept?',
  'What am I becoming? Not what am I trying to become — but what is actually, quietly, undeniably emerging?',
];

// ─── Main seed function ───────────────────────────────────────────────────────

export const DemoSeedService = {
  /**
   * Returns true if this email is the demo reviewer account.
   */
  isDemoAccount(email: string | null | undefined): boolean {
    return email?.toLowerCase() === DEMO_EMAIL;
  },

  /**
   * Seeds demo data if:
   * 1. The signed-in user is the demo account
   * 2. The device has never been seeded before (checks SEED_FLAG_KEY)
   *
   * Also runs a daily top-up: adds entries for any day since last seed up to today.
   */
  async seedIfNeeded(email: string | null | undefined): Promise<void> {
    if (!DemoSeedService.isDemoAccount(email)) return;

    try {
      await localDb.initialize();

      const alreadySeeded = await AsyncStorage.getItem(SEED_FLAG_KEY);
      if (alreadySeeded !== 'true') {
        logger.info('[DemoSeed] Seeding demo data for reviewer account…');
        await DemoSeedService._seed();
        await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
        await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
        logger.info('[DemoSeed] Demo seed complete.');
      } else {
        // Daily top-up: fill any days since last seed
        await DemoSeedService._dailyTopUp();
      }
    } catch (e) {
      logger.error('[DemoSeed] Seed failed:', e);
    }
  },

  /**
   * Adds one entry per missing day between last seeded date and today.
   * Silently skips days that already have data.
   */
  async _dailyTopUp(): Promise<void> {
    const charts = await localDb.getCharts();
    if (!charts.length) return;
    const chartId = charts[0].id;

    const lastStr = await AsyncStorage.getItem(DAILY_SEED_KEY);
    const today = isoDate(new Date());
    if (lastStr === today) return; // already seeded today

    const start = lastStr ? new Date(lastStr + 'T12:00:00.000Z') : new Date(today + 'T12:00:00.000Z');
    const end   = new Date(today + 'T12:00:00.000Z');

    const missing: Date[] = [];
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() + 1); // start from day after last seed
    while (cursor <= end) {
      missing.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    if (!missing.length) return;
    logger.info(`[DemoSeed] Daily top-up: adding ${missing.length} day(s).`);

    for (const d of missing) {
      const dateStr = isoDate(d);
      const idx = hashDate(dateStr);
      await DemoSeedService._seedDay(dateStr, d, chartId, idx);
    }

    // Cloud top-up
    await DemoSeedService._seedSupabaseDay(missing, chartId);
    await AsyncStorage.setItem(DAILY_SEED_KEY, today);
  },

  /**
   * Seeds one day's full data: journal + sleep + 2 check-ins + insight.
   */
  async _seedDay(dateStr: string, d: Date, chartId: string, idx: number): Promise<void> {
    const n = journalTitles.length;
    const jTs = new Date(d.getTime() + 20 * 60 * 60 * 1000).toISOString();
    const sTs = new Date(d.getTime() +  8 * 60 * 60 * 1000).toISOString();
    const iTs = new Date(d.getTime() +  7 * 60 * 60 * 1000).toISOString();
    const i14 = idx % n;

    // Journal
    await localDb.saveJournalEntry({
      id: uid(), date: dateStr,
      mood: MOODS[idx % MOODS.length],
      moonPhase: 'waxing',
      title:   journalTitles[i14],
      content: journalContents[i14],
      chartId,
      tags: [(['gratitude','growth','clarity','boundaries','rest'] as const)[idx % 5]],
      contentWordCount: journalContents[i14].split(' ').length,
      contentReadingMinutes: 1,
      createdAt: jTs, updatedAt: jTs, isDeleted: false,
    });

    // Sleep
    const sleepDurations = [7.5,6.0,8.0,7.0,6.5,8.5,7.5,7.0,9.0,6.5,8.0,7.5,7.0,8.0];
    const sleepQualities  = [4,3,5,4,3,5,4,4,5,3,4,5,4,5];
    await localDb.saveSleepEntry({
      id: uid(), chartId, date: dateStr,
      durationHours: sleepDurations[idx % sleepDurations.length],
      quality:       sleepQualities[idx % sleepQualities.length],
      dreamText:     dreamTexts[i14],
      dreamFeelings: JSON.stringify(dreamFeelingMaps[i14]),
      dreamMetadata: JSON.stringify({
        vividness:    3 + (idx % 3),
        lucidity:     1 + (idx % 3),
        controlLevel: 2 + (idx % 3),
        overallTheme: DREAM_THEMES[idx % DREAM_THEMES.length],
        awakenState:  AWAKEN_STATES[idx % AWAKEN_STATES.length],
        recurring:    idx % 11 === 0,
      }),
      createdAt: sTs, updatedAt: sTs, isDeleted: false,
    });

    // Check-ins (morning + evening)
    const tagSets = [['clarity','gratitude'],['anxiety','work'],['joy','creativity'],['boundaries','health'],['rest','alone_time'],['relationships','eq_open'],['career','productivity'],['eq_calm','nature'],['overwhelm','eq_grounded'],['growth','movement'],['eq_hopeful','social'],['grief','eq_heavy'],['confidence','eq_focused'],['family','gratitude']];
    const notes      = ['Feeling good after morning pages.','Had a productive afternoon despite low energy start.','Noticing patterns in when I feel most myself.','Processed something difficult – feeling lighter.','Stayed off social media today, huge difference.','Midday slump but recovered well.','Really present during evening walk.','Body feels tight – need to move more.','Clear head, getting things done.','Emotional morning, breakthrough by afternoon.','Tired but content.','Creative energy high today.','Needed more space than I gave myself.','In flow most of the day.'];
    const wins       = ['Finished a task I\'d been avoiding.','Had a vulnerable conversation.','Moved my body intentionally.','Set a boundary without over-explaining.','Got outside for a walk.','Actually rested when tired.','Asked for help instead of powering through.','Journaled before bed.','Said no to something draining.','Remembered to eat and drink water consistently.','Stayed in the present moment during a hard meeting.','Created something for no reason except joy.','Checked in with someone I care about.','Did something kind for myself.'];
    const challenges = ['Comparison crept in during scrolling.','Underslept and it showed.','Pushed past my limit before noticing.','Overthought an old conversation.','Got pulled into someone else\'s anxiety.','Skipped movement and felt worse for it.','Procrastinated on something uncomfortable.','Had trouble staying present.','Got caught in a loop of worst-case thinking.','More reactive than I wanted to be.','Hard to rest even when tired.','Took on too much without pausing to check in.','Needed grounding and didn\'t reach for it quickly enough.','Felt disconnected for a bit.'];
    for (let slot = 0; slot < 2; slot++) {
      const ts = new Date(d.getTime() + (slot === 0 ? 9 : 19) * 60 * 60 * 1000).toISOString();
      await localDb.saveCheckIn({
        id: uid(), date: dateStr, chartId,
        timeOfDay:   slot === 0 ? 'morning' : 'evening',
        moodScore:   Math.max(1, Math.min(10, 5 + (idx % 4) - 1 + slot)),
        energyLevel: ENERGY_LEVELS[(idx + slot) % 3],
        stressLevel: STRESS_LEVELS[(idx + slot + 1) % 3],
        tags:        tagSets[(idx + slot) % tagSets.length],
        note:        notes[(idx + slot) % notes.length],
        wins:        wins[(idx + slot) % wins.length],
        challenges:  challenges[(idx + slot) % challenges.length],
        moonSign:    MOON_SIGNS[(idx + 3) % 12],
        moonHouse:   1 + (idx % 12),
        sunHouse:    1 + ((idx + 6) % 12),
        transitEvents: [{ transitPlanet: 'Moon', natalPlanet: 'Venus', aspect: 'trine', orb: 1.2, isApplying: true }],
        lunarPhase:  LUNAR_PHASES[idx % LUNAR_PHASES.length],
        retrogrades: idx % 4 === 0 ? ['Mercury'] : [],
        createdAt: ts, updatedAt: ts,
      });
    }

    // Insight
    await localDb.saveInsight({
      id: uid(), date: dateStr, chartId,
      greeting:      insightGreetings[i14],
      loveHeadline:  loveHeadlines[i14],
      loveMessage:   loveMessages[i14],
      energyHeadline: energyHeadlines[i14],
      energyMessage:  energyMessages[i14],
      growthHeadline: growthHeadlines[i14],
      growthMessage:  growthMessages[i14],
      gentleReminder: gentleReminders[i14],
      journalPrompt:  journalPrompts[i14],
      moonSign:  MOON_SIGNS[idx % 12],
      moonPhase: LUNAR_PHASES[idx % LUNAR_PHASES.length],
      isFavorite: idx % 3 === 0,
      createdAt: iTs, updatedAt: iTs,
    });
  },

  /** Upserts Supabase rows for a set of top-up dates. */
  async _seedSupabaseDay(dates: Date[], _chartId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const userId = session.user.id;

    const dreamSymbolPool = ['water','light','door','forest','ocean','flying','field','home','bridge','library','figure','swimming','memory','color','shadow','mirror','path','garden','stars','fire'];

    const checkInRows = dates.map(d => ({
      user_id:    userId,
      log_date:   isoDate(d),
      mood_value: 5 + (hashDate(isoDate(d)) % 5),
    }));
    await supabase.from('daily_check_ins').upsert(checkInRows, { onConflict: 'user_id,log_date' });

    const logRows = dates.map(d => {
      const h = hashDate(isoDate(d));
      return {
        user_id:       userId,
        created_at:    new Date(d.getTime() + 20 * 60 * 60 * 1000).toISOString(),
        stress:        1 + (h % 6),
        anxiety:       1 + ((h + 2) % 6),
        dream_symbols: [dreamSymbolPool[h % dreamSymbolPool.length], dreamSymbolPool[(h + 7) % dreamSymbolPool.length], dreamSymbolPool[(h + 13) % dreamSymbolPool.length]],
      };
    });
    await supabase.from('daily_logs').upsert(logRows, { ignoreDuplicates: true });
  },

  async _seed(): Promise<void> {
    // ── Chart ──────────────────────────────────────────────────────────────
    // Use existing chart if the user already went through onboarding,
    // otherwise create the demo chart. This ensures all seeded entries
    // are linked to whichever chart getCharts()[0] will return.
    const existingCharts = await localDb.getCharts();
    let activeChartId: string;
    if (existingCharts.length > 0) {
      activeChartId = existingCharts[0].id;
    } else {
      activeChartId = CHART_ID;
      const chartCreated = CHART_CREATED;
      await localDb.saveChart({
        id: CHART_ID,
        name: 'Brittany',
        birthDate: '2002-03-01',
        birthTime: '12:01',
        hasUnknownTime: false,
        birthPlace: 'Austin, TX',
        latitude: 30.2672,
        longitude: -97.7431,
        timezone: 'America/Chicago',
        houseSystem: 'placidus',
        createdAt: chartCreated,
        updatedAt: chartCreated,
        isDeleted: false,
      });
    }

    // ── 14 days of historical entries (reuses _seedDay for DRY logic) ───────
    for (let i = 0; i < 14; i++) {
      const d = daysBefore(13 - i);
      await DemoSeedService._seedDay(isoDate(d), d, activeChartId, i);
    }

    // ── App settings ───────────────────────────────────────────────────────
    await localDb.saveSettings({
      id: uid(),
      cloudSyncEnabled: false,
      createdAt: CHART_CREATED,
      updatedAt: CHART_CREATED,
    });

    // ── AsyncStorage profile data ──────────────────────────────────────────
    await EncryptedAsyncStorage.setItem('msky_user_name', 'Brittany');

    // Grant premium for the reviewer account
    await AsyncStorage.setItem('@mysky:demo_premium', 'true');

    await AsyncStorage.setItem('@mysky:core_values', JSON.stringify({
      selected: ['authenticity','freedom','growth','connection','courage','creativity','peace','integrity'],
      topFive: ['authenticity','freedom','growth','connection','courage'],
    }));

    await AsyncStorage.setItem('mysky_custom_journal_tags', JSON.stringify(['gratitude','shadow work','body','dreams','clarity']));

    await EncryptedAsyncStorage.setItem('@mysky:archetype_profile', JSON.stringify({
      dominant: 'seeker',
      scores: { hero: 2, caregiver: 3, seeker: 5, sage: 4, rebel: 1 },
      completedAt: new Date('2026-03-17T10:00:00.000Z').toISOString(),
    }));

    await EncryptedAsyncStorage.setItem('@mysky:cognitive_style', JSON.stringify({
      scope: 2,
      processing: 3,
      decisions: 2,
    }));

    await EncryptedAsyncStorage.setItem('@mysky:somatic_entries', JSON.stringify([
      { id: uid(), date: new Date('2026-03-17T10:00:00Z').toISOString(), region: 'chest', emotion: 'anxiety', intensity: 3, note: 'Tightness before a difficult conversation.' },
      { id: uid(), date: new Date('2026-03-19T08:00:00Z').toISOString(), region: 'belly', emotion: 'anticipation', intensity: 4, note: 'Excited about something new starting.' },
      { id: uid(), date: new Date('2026-03-21T12:00:00Z').toISOString(), region: 'heart', emotion: 'longing', intensity: 4, note: 'Missed someone I love.' },
      { id: uid(), date: new Date('2026-03-23T18:00:00Z').toISOString(), region: 'jaw', emotion: 'frustration', intensity: 3, note: 'Old pattern I caught in the moment.' },
      { id: uid(), date: new Date('2026-03-25T15:00:00Z').toISOString(), region: 'legs', emotion: 'restlessness', intensity: 3, note: 'Needed to move more than I did.' },
      { id: uid(), date: new Date('2026-03-27T10:00:00Z').toISOString(), region: 'chest', emotion: 'grief', intensity: 3, note: 'Something from the past surfaced.' },
      { id: uid(), date: new Date('2026-03-29T11:00:00Z').toISOString(), region: 'belly', emotion: 'excitement', intensity: 4, note: 'Working on something meaningful.' },
    ]));

    await EncryptedAsyncStorage.setItem('@mysky:trigger_events', JSON.stringify([
      { id: uid(), timestamp: new Date('2026-03-18T16:00:00Z').getTime(), mode: 'nourish', event: 'Long walk in nature', nsState: 'ventral_vagal', sensations: ['warmth in chest','shoulders dropping'] },
      { id: uid(), timestamp: new Date('2026-03-20T10:00:00Z').getTime(), mode: 'nourish', event: 'Creative work with no agenda', nsState: 'ventral_vagal', sensations: ['open chest','easy breathing'] },
      { id: uid(), timestamp: new Date('2026-03-22T19:00:00Z').getTime(), mode: 'nourish', event: 'Deep conversation with a trusted friend', nsState: 'ventral_vagal', sensations: ['heart warmth','full breath'] },
      { id: uid(), timestamp: new Date('2026-03-24T15:00:00Z').getTime(), mode: 'nourish', event: 'Morning movement routine', nsState: 'ventral_vagal', sensations: ['grounded legs','calm energy'] },
      { id: uid(), timestamp: new Date('2026-03-26T12:00:00Z').getTime(), mode: 'nourish', event: 'Saying something honest and being heard', nsState: 'ventral_vagal', sensations: ['relief in chest','lighter shoulders'] },
      { id: uid(), timestamp: new Date('2026-03-19T20:00:00Z').getTime(), mode: 'drain', event: 'Overcommitting, then regretting it', nsState: 'sympathetic', sensations: ['stomach knotting','jaw clenching'] },
      { id: uid(), timestamp: new Date('2026-03-23T09:00:00Z').getTime(), mode: 'drain', event: 'Poor sleep', nsState: 'dorsal_vagal', sensations: ['heaviness','foggy head'] },
    ]));

    await EncryptedAsyncStorage.setItem('@mysky:relationship_patterns', JSON.stringify([
      { id: uid(), date: new Date('2026-03-17T17:00:00Z').toISOString(), note: 'I tend to become the emotional caretaker in friendships before I\'ve established my own ground. I watched myself do it today with awareness for the first time.', tags: ['over-giving','caretaking','awareness'] },
      { id: uid(), date: new Date('2026-03-21T21:00:00Z').toISOString(), note: 'Something I\'m learning: I attach a lot of meaning to how quickly someone responds to me. Working on tracking that without acting from it.', tags: ['anxious-attachment','noticing','growth'] },
      { id: uid(), date: new Date('2026-03-24T18:00:00Z').toISOString(), note: 'I have a pattern of testing people before I trust them — small tests they don\'t know they\'re taking. Starting to see how this creates distance.', tags: ['trust','testing','vulnerability'] },
      { id: uid(), date: new Date('2026-03-27T20:00:00Z').toISOString(), note: 'I showed up for someone today without needing anything in return and it felt clean. That\'s who I want to be — giving without ledger-keeping.', tags: ['generosity','secure-attachment','healing'] },
    ]));

    // Daily reflections
    const reflectionAnswers: object[] = [];
    const AGREEMENT = ['Not True','Somewhat True','True','Very True'];
    const FREQUENCY = ['Not at All','Some of the Time','Almost Always','Always'];
    for (let i = 0; i < 14; i++) {
      const d = daysBefore(13 - i);
      const dateStr = isoDate(d);
      const sealedAt = new Date(d.getTime() + 21 * 60 * 60 * 1000).toISOString();
      reflectionAnswers.push(
        { questionId: i * 2, category: 'values', questionText: `I felt a clear sense of meaning in what I did on day ${i + 1}.`, answer: AGREEMENT[(i + 2) % 4], scaleValue: (i + 2) % 4, date: dateStr, sealedAt },
        { questionId: i * 2 + 1, category: 'values', questionText: 'I honour my most important values consistently.', answer: AGREEMENT[(i + 2) % 4], scaleValue: (i + 2) % 4, date: dateStr, sealedAt },
        { questionId: i * 2, category: 'archetypes', questionText: 'I feel most alive when I\'m actively seeking new experiences.', answer: AGREEMENT[(i + 3) % 4], scaleValue: (i + 3) % 4, date: dateStr, sealedAt },
        { questionId: i * 2 + 1, category: 'archetypes', questionText: 'I trust my instincts over convention.', answer: AGREEMENT[(i + 3) % 4], scaleValue: (i + 3) % 4, date: dateStr, sealedAt },
        { questionId: i * 2, category: 'cognitive', questionText: 'I am able to see the whole picture before focusing on details.', answer: FREQUENCY[(i + 1) % 4], scaleValue: (i + 1) % 4, date: dateStr, sealedAt },
        { questionId: i * 2 + 1, category: 'cognitive', questionText: 'I make decisions intuitively and refine them later.', answer: FREQUENCY[(i + 1) % 4], scaleValue: (i + 1) % 4, date: dateStr, sealedAt },
      );
    }
    await EncryptedAsyncStorage.setItem('@mysky:daily_reflections', JSON.stringify({
      answers: reflectionAnswers,
      totalDaysCompleted: 14,
      startedAt: new Date('2026-03-17T00:00:00.000Z').toISOString(),
    }));

    // ── Supabase cloud tables (powers RPC-driven charts) ──────────────────
    await DemoSeedService._seedSupabase();
  },

  /**
   * Seeds Supabase cloud tables for the reviewer account.
   * Requires an active authenticated session (called after sign-in).
   * - daily_check_ins → powers Circadian Rhythm + Emotional Correlations
   * - daily_logs      → powers Dream Cluster Map
   */
  async _seedSupabase(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      logger.warn('[DemoSeed] No session — skipping Supabase seed.');
      return;
    }
    const userId = session.user.id;

    const dreamSymbolSets = [
      ['water', 'light', 'door'],
      ['forest', 'running', 'trees'],
      ['ocean', 'stillness', 'horizon'],
      ['flying', 'city', 'wind'],
      ['classroom', 'test', 'mountains'],
      ['flowers', 'field', 'clouds'],
      ['childhood', 'home', 'safety'],
      ['cliff', 'bridge', 'water'],
      ['car', 'direction', 'road'],
      ['library', 'books', 'sky'],
      ['figure', 'table', 'paper'],
      ['swimming', 'stars', 'night'],
      ['neighborhood', 'memory', 'shift'],
      ['light', 'color', 'rest'],
    ];

    const stressLevels  = [3, 6, 2, 4, 5, 3, 6, 2, 4, 5, 3, 4, 5, 2];
    const anxietyLevels = [4, 5, 3, 4, 6, 2, 5, 3, 5, 4, 3, 4, 5, 2];
    const moodValues    = [7, 5, 8, 6, 5, 8, 7, 6, 9, 5, 7, 8, 6, 8];

    // Insert daily_check_ins (one per day for 14 days)
    const checkInRows = Array.from({ length: 14 }, (_, i) => {
      const d = daysBefore(13 - i);
      return {
        user_id:    userId,
        log_date:   isoDate(d),
        mood_value: moodValues[i],
      };
    });

    const { error: ciError } = await supabase
      .from('daily_check_ins')
      .upsert(checkInRows, { onConflict: 'user_id,log_date' });

    if (ciError) {
      logger.warn('[DemoSeed] daily_check_ins upsert error:', ciError.message);
    }

    // Insert daily_logs (one per day for 14 days)
    // log_date is a GENERATED column derived from created_at, so we supply created_at.
    const dailyLogRows = Array.from({ length: 14 }, (_, i) => {
      const d = daysBefore(13 - i);
      // Mid-evening timestamp to give each day a distinct log_date in UTC
      const created_at = new Date(d.getTime() + 20 * 60 * 60 * 1000).toISOString();
      return {
        user_id: userId,
        created_at,
        stress:         stressLevels[i],
        anxiety:        anxietyLevels[i],
        dream_symbols:  dreamSymbolSets[i],
      };
    });

    // daily_logs uses a unique constraint on (user_id, log_date).
    // upsert via ignoreDuplicates since log_date is generated and can't be in onConflict.
    const { error: dlError } = await supabase
      .from('daily_logs')
      .upsert(dailyLogRows, { ignoreDuplicates: true });

    if (dlError) {
      logger.warn('[DemoSeed] daily_logs upsert error:', dlError.message);
    }

    logger.info('[DemoSeed] Supabase cloud tables seeded.');
  },
};
