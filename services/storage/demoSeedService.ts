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
import { type RelationshipChart } from './models';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

// ─── Config ───────────────────────────────────────────────────────────────────

const DEMO_EMAIL = 'brittanyapps@outlook.com';

// Flag stored in AsyncStorage to prevent re-seeding on subsequent logins
const SEED_FLAG_KEY = '@mysky:demo_seeded_v10';
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
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Epoch day number — guaranteed unique for consecutive days */
function dayNumber(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
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
const SEED_DAYS = 28; // ~1 month of history
const CHART_CREATED = new Date('2025-12-31T09:00:00.000Z').toISOString();

const MOON_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const LUNAR_PHASES: MoonPhaseKeyTag[] = ['waxing_crescent','first_quarter','waxing_gibbous','full','waning_gibbous','last_quarter','waning_crescent','new'];
const SIMPLE_PHASES: ('new' | 'waxing' | 'full' | 'waning')[] = ['waxing','waxing','waxing','full','waning','waning','waning','new'];
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
  'Low energy, lower expectations',
  'Untangling a thought that kept circling',
  'It\'s okay that today was hard',
  'A conversation I\'m proud of',
  'What comparison costs me',
  'The exhaustion beneath the exhaustion',
  'Anchoring back to what matters',
  'A moment of real joy',
  'Sitting with uncertainty',
  'Body stuff I can\'t ignore anymore',
  'Something small that mattered',
  'Not where I thought I\'d be, and okay with it',
  'On needing people',
  'Woke up feeling off',
  'Choosing presence',
  'What I owe myself',
  'Small ritual, big anchor',
  'What the body knows',
  'Hard night, okay morning',
  'On disappointment',
  'First page of the year',
  'The weight of January',
  'January blues, real',
  'Catching myself mid-pattern',
  'The thing I\'d been putting off',
  'Rest without guilt',
  'Reaching out',
  'Mid-January check-in',
  'The comparison spiral',
  'Body needs rest',
  'A boundary I set',
  'Flow state',
  'The hard part of growth',
  'Unremarkable Tuesday',
  'Full moon stir',
  'February arriving',
  'Something I want to say',
  'Sick day, softly',
  'Valentine\'s Day',
  'What loneliness actually is',
  'Woke up at 3am',
  'Releasing a grudge',
  'A kind thing someone said',
  'Winter into itself',
  'Three things that helped',
  'Old pattern, new awareness',
  'The day I cried twice',
  'Genuine gratitude',
  'On being known',
  'March is coming',
  'Morning movement',
  'Morning pages',
  'What I\'m actually building',
  'The grief I haven\'t named',
  'Energy returning',
  'Something I made',
  'Spring\'s edge',
  'Hard week, survived',
  'What patience looks like now',
  'People I love',
  'The thing about rest',
  'Midweek',
  'Something unexpected',
  'Old journal, new eyes',
  'A real conflict',
  'Soft morning',
  'On wanting more',
  'March energy',
  'Body check',
  'A dream that stayed',
  'Receiving',
  'Ordinary beauty',
  'Doing less, better',
  'Vulnerability window',
  'Following the energy',
  'March midpoint',
  'Today was enough',
];

const journalContents = [
  'Woke up slowly today and didn\'t rush into anything. Made coffee, sat by the window, and let the morning just be what it was. There\'s something about not immediately reaching for my phone that changes the whole energy of a day. I felt more grounded than I have in weeks.',
  'Had a moment this afternoon where I caught myself overthinking everything. I took a breath and wrote it all out, and by the end I realized most of my anxiety was about things I genuinely can\'t control. What I can do is just show up, one day at a time.',
  'Something shifted today around midday. Hard to put words to it — just a feeling that I\'m moving in the right direction. Like something that had been tightly wound is slowly loosening. Sometimes the body knows before the mind does.',
  'Three things deeply grateful for today: the sound of rain this morning, a message from an old friend who just checked in, and the fact that I made it through a hard week without falling apart. Gratitude is choosing to mark what\'s real and good.',
  'Had a difficult but necessary conversation today. Said something I\'d been holding back for weeks. It wasn\'t perfect — I stumbled over my words — but I said it. And the world didn\'t end. If anything, I feel lighter.',
  'Full moon nights always make me feel tender. Like the extra light is illuminating the parts of myself I usually keep in shadow. Sat outside and let myself feel whatever came up. A little grief, a little hope. Both are true simultaneously.',
  'Better day than yesterday. Got back into my morning routine — movement, water, a few minutes of stillness before the day starts. When I skip the basics, everything feels harder. When I honour them, I feel like myself again.',
  'Trying to practice releasing outcomes I can\'t control. I\'m recognizing that clinging to certainty is exhausting me. Today I held something loosely that I would have normally gripped tight. It wasn\'t easy, but it felt like growth.',
  'Quiet day. Stayed close to home, finished a few things I\'d been avoiding, cooked an actual meal. Not every day needs to be revelatory. Sometimes quiet strength looks like making soup and going to bed on time.',
  'Started dreaming about things I\'ve been too afraid to want openly. I notice the resistance — the old voice that says who are you to want that? But I\'m starting to answer back. I am exactly who I am, and that is allowed to be enough.',
  'Rest used to feel like laziness to me. I\'m rewiring that. Today I took a long nap and didn\'t feel guilty about it. Rest is how the nervous system regulates. It is not avoidance. It is repair.',
  'Checking in with myself today felt different — more honest than usual. I admitted to myself that I\'ve been running on low-grade anxiety for a while. Not crisis, just a hum. I want to trace that back to its root.',
  'I used to think patience was passive. I\'m learning it\'s not. Patience is active — it\'s choosing not to force an outcome, choosing to trust the timing, choosing to stay present when everything in you wants resolution.',
  'Today had a different quality to it — like I could feel the next chapter arriving. Something in me is ready. Ready to be more, ask for more, give from a more solid foundation.',
  'Low energy today. Not sick, not sad exactly — just flat. Kept my expectations small. Drank water, stayed off social media, went to bed early. That counts.',
  'There\'s a thought I keep circling — something about how I keep waiting for permission I never actually needed. Writing it down helps. I don\'t have a resolution, but I feel less stuck in it.',
  'Today was genuinely hard and I\'m trying not to paper over that. Felt overwhelmed by midday, cried for a few minutes, pulled it together and kept going. Not every hard day is a crisis. Sometimes it\'s just a hard day.',
  'Had a conversation today where I stayed calm, said what I meant, and listened to the response. No spiral after. Just a clean exchange.',
  'Noticed how quickly comparison hijacks my nervous system. Saw someone\'s life through a screen and felt suddenly insufficient for about twenty minutes. Then I caught it, named it, and came back to my own actual life.',
  'The exhaustion I\'ve been feeling isn\'t just from doing too much. It\'s from holding too much — all the unresolved things, the ambiguous situations, the conversations on pause. I don\'t have to fix it all tonight.',
  'Spent some time today reconnecting with what I actually value — not what I think I should value. My real list is shorter than I expected and more specific. That\'s useful.',
  'Had a moment of pure, uncomplicated joy today. Nothing big — just laughed really hard with someone I love and felt completely present in it. Joy doesn\'t announce itself. You have to be paying attention.',
  'Uncertainty has been my companion lately. I don\'t know how a few things are going to resolve. What I\'m practicing is staying functional alongside not knowing. It\'s harder than it sounds.',
  'Body is asking for more rest than usual. Joints a little achy, energy low, brain sluggish. I have a tendency to override these signals. Today I listened. Early bed, no obligations after 8.',
  'A small moment that mattered: made eye contact with someone on the street today and smiled without thinking, and they smiled back. That\'s it. But I carried it with me all day.',
  'I\'m at a point I didn\'t expect — not where I thought I\'d be on this timeline. Strangely, I find I\'m becoming okay with it. The life I imagined and the life I\'m living are different, and this one has its own rightness.',
  'Realized today that I genuinely need people and I\'ve been performing independence as a way of avoiding that vulnerability. It costs something when I don\'t let people show up for me.',
  'Woke up feeling off and couldn\'t pinpoint why. Moved through the day gently, didn\'t push. Sometimes the most honest journal entry is: I don\'t know what\'s happening but I\'m here and I\'m okay.',
  'Put the phone in another room for the evening. Finished a book, made a real meal, went to bed at a reasonable hour. The basics work. I always forget how much they work.',
  'Kept a commitment to myself today that I almost broke. Showed up for the thing I said I\'d do. That sounds small. It wasn\'t to me.',
  'Made a point of doing my morning pages before checking my phone. One week in. Already feel more grounded than usual. Rituals work because repetition works.',
  'Something in my body has been trying to tell me something for days. Not sure what yet. I\'m paying attention instead of overriding it. That\'s the shift.',
  'Last night was rough — couldn\'t sleep, thoughts spiraling. But morning came and things looked different. Not fixed, just lighter. That always surprises me and I\'m glad it still does.',
  'Disappointed about something I can\'t fully articulate. The diffuse disappointment is the worst kind — it doesn\'t have a clear object. Just a dull ache I have to move through.',
  'New year energy without the pressure of resolutions. Just sat with my coffee and thought about what I actually want — not the version I think I should want. The list was shorter than expected and more honest.',
  'January has a particular heaviness to it I always underestimate. The days are short. I\'m trying not to fight that but just let it be what it is. It will lift.',
  'Not depressed — just bluish. The middle of winter has a specific undulation I\'ve learned to expect but still have to move through.',
  'Caught a thought today that I would have let run unchecked six months ago. Stopped it. Examined it. Let it go. The work is not dramatic, just present.',
  'Finally did the thing I\'d been putting off. It took twelve minutes. I had been carrying it for weeks. The relief was disproportionate and completely worth it.',
  'Gave myself an afternoon off with no agenda. Felt the guilt creep in around 2pm, sat with it, let it pass. Slept on the couch for an hour. Good.',
  'Reached out to someone I\'d been meaning to contact for months. They wrote back immediately. Sometimes the distance we feel is just the distance we created.',
  'Halfway through the first month. Things are okay. Not spectacular — okay. And I\'m learning that okay is an underrated state that deserves more appreciation.',
  'Fell into a comparison spiral for about an hour this afternoon. Caught it eventually. The antidote is always the same: return to what\'s actually in front of me.',
  'My body has been asking for more rest. Joints achy, energy inconsistent. Today I listened. Early night, no justification needed and none offered.',
  'Had to say something I\'d been avoiding. Not a fight — just a clarification of what I need. Felt shaky afterward and then, gradually, more like myself.',
  'Hit a proper flow state this afternoon. Three uninterrupted hours, something really good coming through. Remembered why I love this work when it\'s working.',
  'Growth requires me to let go of the story I\'ve been telling about why certain things aren\'t possible. That story was protective once. Now it\'s a ceiling.',
  'Nothing in particular happened today. I worked, I ate, I rested. I am more grateful for boring days than I used to be. They\'re a privilege.',
  'The full moon didn\'t let me sleep until midnight. Lay awake with a feeling somewhere between excitement and grief. Both true at the same time, probably.',
  'February is here. I always find February harder than January. Less novelty, still far from spring. I\'m preparing to be patient with it.',
  'I have something I want to say to someone and I haven\'t said it yet. Practicing it here first. Getting clearer about what I actually mean.',
  'Came down with a cold. Gave myself permission to do nothing. Slept ten hours. Drank hot water with lemon. Didn\'t optimize anything. It helped.',
  'Valentine\'s Day. I bought myself flowers. The gesture was partly ironic and partly not at all. Both things can be true.',
  'Lonely today not because I\'m alone but because I felt unseen in a room full of people. That\'s a more specific kind and it asks for a different remedy.',
  'Woke at 3am with a thought that felt urgent. Wrote it down. Went back to sleep. Read it this morning — it makes sense. Glad I caught it.',
  'Made a decision today to put down something I\'ve been carrying. Not absolution — just a refusal to keep carrying the weight of it. It was getting heavy.',
  'Someone said something genuinely kind about me today and I almost deflected it. Caught myself mid-deflect and just said thank you and let it land.',
  'February is deep winter and I\'m letting it be. Less pressure to produce, more permission to be quiet. The season is an excuse and I\'m using it.',
  'Things that helped this week: movement in the morning, less news, a long call with a friend who gets me. Simple inventory. Worth repeating.',
  'Watched myself fall into an old relational pattern today and caught it before it completed. Didn\'t prevent it entirely, but I shortened its duration.',
  'Cried twice today — once from tiredness, once from something unexpectedly beautiful. Both were honest. I prefer crying to holding it all the way in.',
  'Genuinely grateful today — not the performed kind. Just real. For warmth, for food, for one person who knows me completely.',
  'Thinking about what it means to be truly known by another person. How rare it is. How I sometimes hide inside warmth instead of risking it.',
  'Can feel March on the edge of the calendar. Something in me responds to the changing light. Ready to come out of winter\'s interior.',
  'Started doing brief movement right after waking up. Five days in. The difference in how the rest of the day feels is not subtle.',
  'January morning pages — the ritual of writing before my brain gets distracted. Three pages of loose thoughts, no editing. Processed a worry that had been sitting at the edge of my mind. Already feel better.',
  'Spent some time today thinking about what I\'m actually building — not the surface version but the structural one. It\'s taking a shape I like.',
  'There\'s grief sitting in me that I haven\'t fully named. Not crisis — just unattended. Gave it some attention today. It shifted a little.',
  'Energy noticeably higher this week. Not sure if it\'s the light changing or the movement habit. Grateful regardless.',
  'Made something today just for the pleasure of making it. No audience intended. Remembered what it feels like to create without performing.',
  'First genuinely warm afternoon. Sat outside for thirty minutes and didn\'t check my phone once. The light on everything looked different.',
  'Hard week. Several things at once. I handled them — imperfectly but without falling apart. Ended Friday with a quiet sense of intact-ness.',
  'Patience this week looked like not sending that message until I was sure what I meant. Three drafts. Sent none. Still not sure. Still okay.',
  'Thought today about the specific way certain people make me feel known. Not admired — known. It\'s the better thing by far.',
  'Rest isn\'t working when I\'m lying down while my brain rehearses every difficult conversation. Rest requires actual permission. Gave myself that today.',
  'Middle of the week, middle of my energy. Kept expectations proportionate. Did what I could. Left the rest. This is the practice.',
  'Something unexpectedly good happened today. I\'m sitting with it without trying to explain it or brace for its reversal. Just letting it be good.',
  'Found an old journal entry from a year ago. I was more anxious than I remembered. The distance is real. The growth is real.',
  'Had a real conflict today — one with stakes. Didn\'t handle it perfectly but handled it consciously. Said the hard thing, heard the hard thing.',
  'Soft morning. No hurry. Let myself wake slowly, drink coffee slowly, think slowly. The day can catch up with me for once.',
  'I want more than I allow myself to want. The wanting is not the problem. The suppression of it is, and I\'m starting to see that clearly.',
  'March has a specific quality of gathering-momentum. I feel it in my body. Something that has been gestating is beginning to want to move.',
  'Body is basically okay but asking for more hydration, more sleep, and less screen time. I heard it. I\'m working on it one thing at a time.',
  'A dream stayed with me all day today. Couldn\'t shake the feeling from it. Not analyzing — just letting it accompany me through the hours.',
  'Someone offered help and I said yes and let them do it. Noticed the discomfort and stayed anyway. That\'s the new version of me.',
  'The light through the kitchen window at 5pm today looked like something I\'d want painted. I stopped for thirty seconds and just looked.',
  'Did less today but did it more thoroughly. The feeling at the end was better than the days I try to accomplish everything at once.',
  'Was more vulnerable with someone today than I planned to be. Fell into honesty. The response was good. I\'m glad I didn\'t edit.',
  'Let myself follow what felt alive today instead of what was on the list. Productive in a different, more real way.',
  'Midpoint of March. The year has a different shape than I expected it would. I\'m inside it, trying to see it clearly.',
  'Today was just today. I showed up. I did what I could. I let the rest be what it was. That\'s the whole thing and it\'s enough.',
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
  'I was on a train moving through scenery I\'d never seen — mountains, then desert, then ocean, all in the span of what felt like minutes. There was someone in the seat beside me but I couldn\'t look at them directly. Their presence felt like warmth.',
  'Searching for something I\'d lost but couldn\'t name. Went through drawers, bags, rooms. At some point I stopped searching and just sat on the floor and it was fine. Whatever I lost wasn\'t the point.',
  'A version of my apartment but the ceiling was very high and the light was different — amber, late afternoon. I was alone and it felt peaceful rather than lonely. Did ordinary things in a space that felt sacred.',
  'Running but not from fear — more like practice. Testing the dream body. Found I could run without tiring. Then sat down in a field and watched the sky go through every color at once.',
  'Something was wrong in the dream — a low-level wrongness, nothing specific. I kept moving through it trying to find the source. Never did. Woke up unsettled but curious.',
  'I was talking with someone who has died. We were in a kitchen. They were completely ordinary — pouring water, explaining something about it. I didn\'t understand what they were saying but felt deeply understood by their presence.',
  'A house that kept expanding. Every door led to another room I hadn\'t known was there. One room had a window that looked out over a valley. I stayed there for a long time.',
  'Something involving water again. A river this time, fast-moving, but I was above it on a bridge. Watching it go. It felt like watching time.',
  'Woke up in the dream already knowing it was a dream. Instead of trying to control it I just walked around and noticed things — the texture of walls, the way light moved, other people going about their dream lives.',
  'Very little visual imagery — mostly just a feeling. Someone was holding space for me in the dream, not physically but in the way air carries warmth after a candle\'s been burning. Woke up with that feeling still present.',
  'A market or bazaar with things I\'d never seen before. Colors that don\'t exist in waking life. I kept being given things by strangers — small objects that felt significant but I couldn\'t say why.',
  'The dream had a quality of old light — sepia-toned, grainy. I was younger in it. Doing something simple. It felt like a memory of something that never happened but should have.',
  'A storm was coming in the dream and I was preparing for it. Not afraid, just focused. Got everything inside, closed the windows, made tea. The storm came and I just listened to it. Cozy, contained, safe.',
  'I was teaching something to a small group of people. I don\'t know what the subject was but I knew it well. People were listening. In the dream I felt clear and useful and at ease.',
  'A dream of fog and doors. I kept opening one door into another room with another door. The fog was soft, not threatening. I had the feeling I was getting closer to something but the dream ended before I arrived.',
  'My childhood bedroom but with a window that looked out over the sea. The sea wasn\'t there in waking life — but in the dream it had always been there. I sat on the bed and watched waves for what felt like hours.',
  'I was observing birds from a platform in a forest. Very tall trees. The birds were colors I\'ve never seen. Someone was standing next to me, also watching, and we communicated something without words.',
  'An underwater building, flooded but intact. Tables and chairs and bookshelves below the waterline. I was swimming through it and felt no urgency to breathe. It was like a museum of something ordinary, made strange.',
  'I was looking down at a city at night from high above. A grid of lit windows and streets. Each window held a life. I had the sensation of being able to see all of them simultaneously and feeling tenderness toward each one.',
  'In the dream I was racing somewhere and arrived — which almost never happens. Stood at the place I\'d been trying to reach. It was ordinary: a wooden door, a landing, afternoon light. But I had made it.',
  'A place from the past that no longer exists — a space that was demolished or changed, restored in the dream to exactly how it was. I walked through it knowing it was already gone, feeling both sad and grateful.',
  'The dream had a musician in it — someone playing an instrument I couldn\'t name, in a style I\'ve never heard. The sound was in my chest. I stood still and listened until I woke up.',
  'A house I\'d never been in but knew immediately was mine — as if I\'d been dreaming of it my whole life without remembering. It had a room with a skylight. I lay under the skylight and watched clouds and felt complete.',
  'A lucid dream where I stood at the edge of a cliff, aware it was a dream, and chose to step off. Fell slowly. The ground turned into water. The water turned into light. Woke up completely calm.',
  'The floor was glass and I could see the world moving below me — people, streets, rivers, mountains. I walked carefully at first, then with increasing trust that the glass would hold.',
  'I was in a conversation with a version of myself from years ago. She was scared of things that no longer frighten me. I was patient with her in a way I never was at the time.',
  'A dream of returning somewhere — I\'m not sure where, but the feeling was unmistakable. Like coming home to a place that holds a version of you intact.',
  'The room smelled like paper and old wood. I was reading something that felt important but when I woke I couldn\'t recall a single word. The feeling of meaning persisted all day anyway.',
  'I was swimming alongside something very large — not threatening, just vast. A whale, maybe, or something like it. Moving in the deep. I matched its pace and felt more alive than usual.',
  'The dream was almost entirely sound — bells, wind, a voice I recognized but couldn\'t place. I woke up feeling the way music feels sometimes, like something had been said that can\'t be said in words.',
  'I was in a room where time moved differently — slowly, like honey. I sat in a chair while the light changed from morning to evening in what felt like thirty minutes. It was peaceful beyond anything waking life usually offers.',
  'A recurring landscape: a hill with one tree. This time I climbed the tree. From the top I could see further than should have been possible. The world looked beautiful and small.',
  'Something about color in this dream — there were colors that don\'t exist in waking life, and I kept pointing at them saying those, right there. When I woke the colors were gone and I missed them.',
  'I was repairing something — I don\'t know what. Using tools I didn\'t know how to use in waking life but knew intuitively in the dream. The thing being repaired felt important. The work felt meditative.',
  'Found a room in my home I\'d never known existed. It was full of light and completely empty. I understood in the dream that it had always been there, waiting.',
  'A long walk through changing landscapes. Desert to forest to shoreline to city, all seamlessly. I had company for parts of it. At some point I was alone and it was fine.',
  'A gathering of people I love — some I haven\'t seen in years, some who no longer exist. Everyone at the table. The conversation was easy and warm. Woke up missing everyone and everything.',
  'The dream was very domestic — just cooking in a kitchen that felt completely right. The light was perfect. There was music somewhere. I kept thinking: this is the dream, to just be here like this.',
  'I could move objects with attention in this dream. Not dramatically — just small things, gently. A cup. A book. It felt like the natural order of things.',
  'Woke up from a dream within a dream, which opened into another dream. By the time I actually woke up I wasn\'t sure which layer I was in. The outermost feeling was vast quiet.',
  'Someone I never met in waking life appeared and felt important. We had a history in the dream that felt real. We parted knowing we wouldn\'t see each other again and it was tender.',
  'The sky was behaving strangely — multiple suns, or perhaps moons, moving through each other. I stood watching with a feeling of deep awe. Not disturbing, just other.',
  'I was at a celebration — not a party exactly, more like a ceremony. People moved slowly and spoke quietly. I didn\'t know what was being celebrated but participated anyway. Woke up with the feeling that something good had happened.',
  'A forest in winter, very still. Snow on everything. I was walking alone and the silence was total. Then I came to a clearing where something was glowing under the ice. I reached for it and woke up.',
  'The dream placed me in a version of my life ten years future. I couldn\'t see specifics but the feeling was one of having arrived somewhere good. Woke up with that forward-looking warmth.',
  'Fragments only — pieces of several dreams without coherent thread. A door. A face. Running water. A color. A word. None of it connected. But the residue was somehow peaceful.',
  'I was on an island that kept changing size. At high tide it was just a rock. At low tide it stretched for miles. I stayed on it through both. The changing didn\'t frighten me.',
  'In the dream I found a letter written to me with no sender — kind, specific, somehow knowing. When I tried to read it again the words had changed. I kept the envelope anyway.',
  'A deep sleep that gave no specific images but left behind a feeling: held, rested, returned. The most restorative kind.',
  'I was watching myself in the dream from slightly outside my body — not frightening, just observational. I moved through a landscape with the slow curiosity of someone touring a life they\'re learning to inhabit.',
  'A figure on a hilltop — I was moving toward them. With every step the distance stayed the same. Eventually I stopped walking and just watched the silhouette. It raised a hand. I raised mine.',
  'The dream was old-fashioned — soft edges, quiet, like looking through gauze. I was in a place from another era. I belong here, I thought. And then I woke up in this one.',
  'Water again but not the sea — a slow, clear river through tall grass. I floated on my back. The sky above was enormous and soft blue. I could hear birds I\'ve never heard.',
  'A hall of mirrors but nothing was distorted — each reflection was exactly real. Except in one mirror there was light behind me that wasn\'t there in the room. I stood looking at it for a long time.',
  'I was very small in this dream — the size of a mouse, moving through enormous landscapes of ordinary furniture and grass blades. Everything familiar made strange by scale.',
  'Running toward something instead of from it, for once. Over hills, through water, across rooftops. Arrived somewhere high up. Looked back at the distance traveled. Felt proud.',
  'The ending was what I remembered: a door closing gently, not locked, just resting shut. And the feeling on my side of it was relief.',
  'Abstract shapes and motion, no narrative — like the visual part of a piece of music. Warm colors, slow movement. I woke up feeling like I\'d been to a gallery.',
  'I was in a conversation that mattered. Can\'t remember the words. But I said the true thing, and it was received. That feeling was still there when I woke up.',
  'The whole dream took place in golden hour light. Everything was lit from the side, making shadows long. It felt like the last day of summer felt when I was a child.',
  'An old friend was there. Or someone who felt like an old friend without being someone I\'ve actually known. We walked somewhere together. It felt like the most natural thing.',
  'Something ancient in this dream — stones, mist, an older kind of sky. I understood I was standing somewhere that remembered things. I tried to listen.',
  'A very ordinary dream of a very ordinary morning, except that every small thing was suffused with meaning. The coffee. The window. The sound of someone in the next room. Sacred.',
  'I was arriving — I could feel the arrival even before I reached the thing. The dream was all anticipation leading to the moment of stepping through. And I woke up just before.',
  'Not a dream I can describe — just a color. Blue-green, specific, the exact shade of a feeling I don\'t have a name for. It was still there when I first opened my eyes.',
  'Three rooms. Same room each time. Same afternoon light. Three moments from three different points in my life, playing out simultaneously. I was watching from outside them.',
  'The dream gave me a gift: one hour of complete, uncrowded peace. I didn\'t do anything in it. Just existed without needing anything to be different.',
  'Someone was explaining something very important. I could feel the importance. But the sound was muffled — like hearing through water. I leaned in and leaned in and couldn\'t quite hear.',
  'A building I knew was being torn down. In the dream I was allowed back in first, to take what I wanted. I walked through it slowly. I didn\'t take anything. Just walked through it.',
  'Full moon in the dream, enormous and close. I could see the surface clearly. Someone stood beside me saying nothing. We both looked up.',
  'A trail I\'ve walked in waking life but transformed. The trees were different. The light was different. Something was different about me too.',
  'I was being carried. Gently, by many hands, through a space that was dark but not frightening. The motion was slow. I let it happen.',
  'Two versions of a conversation playing at once — the one I had and the one I wish I\'d had. In the dream they overlapped and resolved into something more honest than either.',
  'The door was always just ahead and I was always just about to reach it. Not frustrated in the dream — just patient. Just walking.',
  'Rain throughout — on windows, in streets, the smell of it, the sound of it. I was inside watching it, completely warm. The world outside was being washed.',
  'I was in a garden I don\'t have but felt like mine. Everything in it was specific — certain plants, a certain wall, afternoon light at a specific angle. I felt at home there.',
  'The dream unwound slowly backward — I watched events unspool in reverse until I arrived at a moment of pure beginning. Then I woke up.',
];

const dreamFeelingMaps = [
  [{ id: 'wondering', intensity: 4 }, { id: 'peaceful', intensity: 3 }],
  [{ id: 'urgent', intensity: 3 }, { id: 'curious', intensity: 4 }],
  [{ id: 'longing', intensity: 4 }, { id: 'warm', intensity: 5 }],
  [{ id: 'free', intensity: 5 }, { id: 'awed', intensity: 3 }],
  [{ id: 'relieved', intensity: 4 }, { id: 'content', intensity: 2 }],
  [{ id: 'joyful', intensity: 5 }, { id: 'tender', intensity: 4 }],
  [{ id: 'bittersweet', intensity: 5 }, { id: 'safe', intensity: 4 }],
  [{ id: 'thrilled', intensity: 4 }, { id: 'settled', intensity: 3 }],
  [{ id: 'surrendered', intensity: 3 }, { id: 'trusting', intensity: 4 }],
  [{ id: 'wondering', intensity: 5 }, { id: 'surreal', intensity: 4 }],
  [{ id: 'confused', intensity: 3 }, { id: 'nostalgic', intensity: 4 }],
  [{ id: 'peaceful', intensity: 5 }, { id: 'awestruck', intensity: 4 }],
  [{ id: 'bittersweet', intensity: 4 }, { id: 'melancholic', intensity: 2 }],
  [{ id: 'secure', intensity: 5 }, { id: 'peaceful', intensity: 5 }],
  [{ id: 'warm', intensity: 4 }, { id: 'curious', intensity: 3 }],
  [{ id: 'sad', intensity: 3 }, { id: 'calm', intensity: 4 }],
  [{ id: 'content', intensity: 4 }, { id: 'settled', intensity: 3 }],
  [{ id: 'free', intensity: 4 }, { id: 'alive', intensity: 5 }],
  [{ id: 'uneasy', intensity: 3 }, { id: 'curious', intensity: 4 }],
  [{ id: 'tender', intensity: 5 }, { id: 'trusting', intensity: 4 }],
  [{ id: 'wondering', intensity: 3 }, { id: 'content', intensity: 4 }],
  [{ id: 'nostalgic', intensity: 5 }, { id: 'longing', intensity: 3 }],
  [{ id: 'wondering', intensity: 4 }, { id: 'relaxed', intensity: 4 }],
  [{ id: 'safe', intensity: 5 }, { id: 'warm', intensity: 4 }],
  [{ id: 'delighted', intensity: 4 }, { id: 'surprised', intensity: 3 }],
  [{ id: 'melancholic', intensity: 4 }, { id: 'peaceful', intensity: 3 }],
  [{ id: 'settled', intensity: 5 }, { id: 'safe', intensity: 4 }],
  [{ id: 'alive', intensity: 4 }, { id: 'confident', intensity: 3 }],
  [{ id: 'wondering', intensity: 4 }, { id: 'curious', intensity: 5 }],
  [{ id: 'nostalgic', intensity: 4 }, { id: 'bittersweet', intensity: 3 }],
  [{ id: 'awed', intensity: 5 }, { id: 'peaceful', intensity: 3 }],
  [{ id: 'warm', intensity: 5 }, { id: 'safe', intensity: 4 }],
  [{ id: 'joyful', intensity: 4 }, { id: 'tender', intensity: 3 }],
  [{ id: 'anchored', intensity: 5 }, { id: 'trusting', intensity: 4 }],
  [{ id: 'dreamlike', intensity: 5 }, { id: 'surreal', intensity: 3 }],
  [{ id: 'melancholic', intensity: 3 }, { id: 'content', intensity: 4 }],
  [{ id: 'thrilled', intensity: 4 }, { id: 'free', intensity: 5 }],
  [{ id: 'calm', intensity: 5 }, { id: 'settled', intensity: 4 }],
  [{ id: 'connected', intensity: 5 }, { id: 'warm', intensity: 4 }],
  [{ id: 'reflective', intensity: 4 }, { id: 'peaceful', intensity: 3 }],
  [{ id: 'surrendered', intensity: 4 }, { id: 'relieved', intensity: 5 }],
  [{ id: 'nostalgic', intensity: 5 }, { id: 'longing', intensity: 4 }],
  [{ id: 'awestruck', intensity: 5 }, { id: 'wondering', intensity: 4 }],
  [{ id: 'content', intensity: 5 }, { id: 'calm', intensity: 4 }],
  [{ id: 'curious', intensity: 5 }, { id: 'alive', intensity: 4 }],
  [{ id: 'uneasy', intensity: 3 }, { id: 'reflective', intensity: 4 }],
  [{ id: 'tender', intensity: 5 }, { id: 'longing', intensity: 4 }],
  [{ id: 'safe', intensity: 5 }, { id: 'trusting', intensity: 4 }],
  [{ id: 'peaceful', intensity: 5 }, { id: 'awestruck', intensity: 3 }],
  [{ id: 'blissful', intensity: 4 }, { id: 'warm', intensity: 5 }],
  [{ id: 'transformed', intensity: 4 }, { id: 'wondering', intensity: 3 }],
  [{ id: 'cherished', intensity: 5 }, { id: 'safe', intensity: 4 }],
  [{ id: 'chosen', intensity: 4 }, { id: 'content', intensity: 5 }],
  [{ id: 'seen', intensity: 5 }, { id: 'tender', intensity: 4 }],
  [{ id: 'whole', intensity: 5 }, { id: 'anchored', intensity: 4 }],
  [{ id: 'yearning', intensity: 4 }, { id: 'nostalgic', intensity: 5 }],
  [{ id: 'resilient', intensity: 4 }, { id: 'brave', intensity: 3 }],
  [{ id: 'edgy', intensity: 3 }, { id: 'curious', intensity: 4 }],
  [{ id: 'wondering', intensity: 3 }, { id: 'eerie', intensity: 2 }],
  [{ id: 'changed', intensity: 4 }, { id: 'reflective', intensity: 5 }],
  [{ id: 'capable', intensity: 4 }, { id: 'confident', intensity: 5 }],
  [{ id: 'vulnerable', intensity: 3 }, { id: 'safe', intensity: 4 }],
  [{ id: 'belonging', intensity: 5 }, { id: 'warm', intensity: 4 }],
  [{ id: 'blissful', intensity: 5 }, { id: 'free', intensity: 4 }],
  [{ id: 'reunited', intensity: 5 }, { id: 'tender', intensity: 4 }],
  [{ id: 'satisfied', intensity: 4 }, { id: 'settled', intensity: 5 }],
  [{ id: 'renewed', intensity: 5 }, { id: 'alive', intensity: 4 }],
  [{ id: 'supported', intensity: 5 }, { id: 'safe', intensity: 4 }],
  [{ id: 'drawn', intensity: 4 }, { id: 'curious', intensity: 5 }],
  [{ id: 'drained', intensity: 3 }, { id: 'peaceful', intensity: 4 }],
  [{ id: 'transformed', intensity: 5 }, { id: 'awed', intensity: 4 }],
  [{ id: 'nostalgic', intensity: 3 }, { id: 'warm', intensity: 5 }],
  [{ id: 'surreal', intensity: 5 }, { id: 'wondering', intensity: 4 }],
  [{ id: 'trusting', intensity: 5 }, { id: 'content', intensity: 4 }],
  [{ id: 'calm', intensity: 4 }, { id: 'reflective', intensity: 5 }],
  [{ id: 'longing', intensity: 5 }, { id: 'tender', intensity: 4 }],
  [{ id: 'alive', intensity: 5 }, { id: 'thrilled', intensity: 4 }],
  [{ id: 'peaceful', intensity: 4 }, { id: 'blissful', intensity: 3 }],
  [{ id: 'wondering', intensity: 5 }, { id: 'transformed', intensity: 3 }],
  [{ id: 'settled', intensity: 4 }, { id: 'safe', intensity: 5 }],
  [{ id: 'reflective', intensity: 5 }, { id: 'changed', intensity: 4 }],
  [{ id: 'warm', intensity: 4 }, { id: 'belonging', intensity: 5 }],
  [{ id: 'curious', intensity: 3 }, { id: 'awed', intensity: 5 }],
  [{ id: 'eerie', intensity: 3 }, { id: 'wondering', intensity: 4 }],
  [{ id: 'free', intensity: 4 }, { id: 'joyful', intensity: 5 }],
  [{ id: 'longing', intensity: 3 }, { id: 'bittersweet', intensity: 5 }],
  [{ id: 'content', intensity: 3 }, { id: 'warm', intensity: 4 }],
  [{ id: 'anchored', intensity: 4 }, { id: 'whole', intensity: 5 }],
  [{ id: 'dreamlike', intensity: 4 }, { id: 'awestruck', intensity: 5 }],
  [{ id: 'vulnerable', intensity: 4 }, { id: 'tender', intensity: 5 }],
  [{ id: 'peaceful', intensity: 3 }, { id: 'wondering', intensity: 5 }],
];

// Insight arrays removed — insight_history is not displayed in the UI.
// Behavioral insights are computed on-the-fly from check-in data on the Growth tab.

// ─── Variable journal entry pattern ──────────────────────────────────────────
// Deterministic per-day entry count: some days 0, most 1, some 2, rare 3.
// Pattern repeats every 28 days. Totals: 0×5, 1×14, 2×6, 3×3 = 42 entries.
const JOURNAL_COUNTS_PER_DAY = [
  1, 0, 2, 1, 1, 3, 0, 1, 1, 2, 1, 0, 1, 1,
  2, 1, 0, 1, 3, 1, 2, 1, 1, 0, 1, 2, 3, 1,
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
      const idx = dayNumber(d);
      await DemoSeedService._seedTopUpDay(dateStr, d, chartId, idx);
    }

    // Prune only check-ins and sleep older than SEED_DAYS.
    // Journal entries, dream logs, and insights are NOT pruned so written
    // content from the initial seed stays fixed at its original count.
    const cutoff = isoDate(daysBefore(SEED_DAYS));
    const db = await localDb.getDb();
    await db.runAsync('DELETE FROM daily_check_ins WHERE date < ?', [cutoff]);
    await db.runAsync("DELETE FROM sleep_entries WHERE date < ? AND id LIKE 'demo-topup-%'", [cutoff]);

    // Cloud top-up
    await DemoSeedService._seedSupabaseDay(missing, chartId);
    await AsyncStorage.setItem(DAILY_SEED_KEY, today);
  },

  /**
   * Lightweight daily top-up: only check-ins + sleep (duration/quality).
   * No journal entries, dream text, or insights — those stay fixed from
   * the initial seed to avoid duplicated written content.
   */
  async _seedTopUpDay(dateStr: string, d: Date, chartId: string, idx: number): Promise<void> {
    // Realistic sleep durations — human variation
    const sleepDurations = [
      7.5, 6.0, 8.0, 5.5, 7.0, 8.5, 6.5, 7.5, 9.0, 6.0, 7.0, 8.0, 5.0, 7.5,
      8.5, 6.5, 7.0, 9.5, 6.0, 7.5, 8.0, 5.5, 7.0, 8.5, 7.0, 6.5, 8.0, 7.5,
    ];
    const sleepQualities = [
      4, 3, 5, 2, 4, 5, 3, 4, 5, 2, 4, 5, 2, 4,
      5, 3, 4, 5, 3, 4, 5, 2, 3, 5, 4, 3, 4, 4,
    ];
    const sTs = new Date(d.getTime() + 8 * 60 * 60 * 1000).toISOString();

    // Sleep (duration + quality only, no dream text)
    await localDb.saveSleepEntry({
      id: `demo-topup-sleep-${dateStr}`, chartId, date: dateStr,
      durationHours: sleepDurations[idx % sleepDurations.length],
      quality:       sleepQualities[idx % sleepQualities.length],
      dreamText:     '',
      dreamFeelings: '[]',
      dreamMetadata: '{}',
      createdAt: sTs, updatedAt: sTs, isDeleted: false,
    });

    // Check-ins (morning + evening)
    const moodScores = [
      6, 5, 7, 4, 6, 8, 3, 6, 7, 5, 6, 8, 4, 7,
      5, 6, 9, 4, 6, 7, 5, 3, 6, 8, 6, 5, 7, 6,
      4, 7, 6, 8, 5, 6, 4, 7, 6, 5, 8, 6, 3, 7,
    ];
    const tagSets = [
      ['clarity','gratitude'],['anxiety','work'],['joy','creativity'],['boundaries','health'],
      ['rest','alone_time'],['relationships','eq_open'],['career','productivity'],['eq_calm','nature'],
      ['overwhelm','eq_grounded'],['growth','movement'],['eq_hopeful','social'],['grief','eq_heavy'],
      ['confidence','eq_focused'],['family','gratitude'],['body','rest'],['shadow work','awareness'],
      ['reflection','healing'],['energy','focus'],['stress','eq_grounded'],['play','joy'],
    ];
    const notes = [
      'Feeling good after morning pages.','Had a productive afternoon despite low energy start.',
      'Noticing patterns in when I feel most myself.','Processed something difficult – feeling lighter.',
      'Stayed off social media today, huge difference.','Midday slump but recovered well.',
      'Really present during evening walk.','Body feels tight – need to move more.',
      'Clear head, getting things done.','Emotional morning, breakthrough by afternoon.',
      'Tired but content.','Creative energy high today.','Needed more space than I gave myself.',
      'In flow most of the day.','Rough start, gentler finish.','Didn\'t push, just showed up.',
      'Felt something loosen today.','Long day but proud of how I handled it.',
      'Took a breath before responding and it changed everything.','Just about keeping the basics going.',
    ];
    const wins = [
      'Finished a task I\'d been avoiding.','Had a vulnerable conversation.','Moved my body intentionally.',
      'Set a boundary without over-explaining.','Got outside for a walk.','Actually rested when tired.',
      'Asked for help instead of powering through.','Journaled before bed.',
      'Said no to something draining.','Remembered to eat and drink water consistently.',
      'Stayed in the present moment during a hard meeting.','Created something for no reason except joy.',
      'Checked in with someone I care about.','Did something kind for myself.',
      'Didn\'t catastrophize a minor setback.','Caught a spiral early and redirected.',
      'Ate a real meal and sat down to eat it.','Put the phone down an hour before bed.',
      'Told someone the truth gently.','Let a compliment actually land.',
    ];
    const challenges = [
      'Comparison crept in during scrolling.','Underslept and it showed.',
      'Pushed past my limit before noticing.','Overthought an old conversation.',
      'Got pulled into someone else\'s anxiety.','Skipped movement and felt worse for it.',
      'Procrastinated on something uncomfortable.','Had trouble staying present.',
      'Got caught in a loop of worst-case thinking.','More reactive than I wanted to be.',
      'Hard to rest even when tired.','Took on too much without pausing to check in.',
      'Needed grounding and didn\'t reach for it quickly enough.','Felt disconnected for a bit.',
      'Ate late, slept poorly, one thing led to another.','Low patience near end of day.',
      'Avoided a conversation I need to have.','Spent too long in my head.',
      'Said yes when I wanted to say no.','Couldn\'t shake a vague anxious feeling.',
    ];

    for (let slot = 0; slot < 2; slot++) {
      const ts = new Date(d.getTime() + (slot === 0 ? 9 : 19) * 60 * 60 * 1000).toISOString();
      const moodIdx = (idx * 2 + slot * 7) % moodScores.length;
      const rawMood = moodScores[moodIdx];
      const moodOffset = slot === 1 ? (idx % 3 === 0 ? 1 : idx % 3 === 1 ? -1 : 0) : 0;
      const moodScore = Math.max(1, Math.min(10, rawMood + moodOffset));
      await localDb.saveCheckIn({
        id: `demo-checkin-${dateStr}-${slot}`, date: dateStr, chartId,
        timeOfDay:   slot === 0 ? 'morning' : 'evening',
        moodScore,
        energyLevel: ENERGY_LEVELS[(idx + slot * 3) % 3],
        stressLevel: STRESS_LEVELS[(idx + slot + 1) % 3],
        tags:        tagSets[(idx * 2 + slot) % tagSets.length],
        note:        notes[(idx + slot * 5) % notes.length],
        wins:        wins[(idx + slot * 3) % wins.length],
        challenges:  challenges[(idx + slot * 4) % challenges.length],
        moonSign:    MOON_SIGNS[(idx + 3) % 12],
        moonHouse:   1 + (idx % 12),
        sunHouse:    1 + ((idx + 6) % 12),
        transitEvents: [{ transitPlanet: 'Moon', natalPlanet: 'Venus', aspect: 'trine', orb: 1.2, isApplying: true }],
        lunarPhase:  LUNAR_PHASES[idx % LUNAR_PHASES.length],
        retrogrades: idx % 4 === 0 ? ['Mercury'] : [],
        createdAt: ts, updatedAt: ts,
      });
    }
  },

  /**
   * Seeds one day's full data: variable journal entries + sleep + 2 check-ins.
   * Returns the number of journal entries created (so caller can advance the offset).
   */
  async _seedDay(dateStr: string, d: Date, chartId: string, idx: number, journalOffset: number): Promise<number> {
    const N_JOURNAL = journalTitles.length;   // 91
    const N_DREAM   = dreamTexts.length;      // 91

    const iD = (idx * 3 + 5) % N_DREAM;     // dream index — different stride

    const sTs = new Date(d.getTime() +  8 * 60 * 60 * 1000).toISOString();

    // How many journal entries this day (0–3, deterministic per day index)
    const journalCount = JOURNAL_COUNTS_PER_DAY[idx % JOURNAL_COUNTS_PER_DAY.length];

    // Realistic sleep durations — human variation: bad nights, good nights, average nights
    const sleepDurations = [
      7.5, 6.0, 8.0, 5.5, 7.0, 8.5, 6.5, 7.5, 9.0, 6.0, 7.0, 8.0, 5.0, 7.5,
      8.5, 6.5, 7.0, 9.5, 6.0, 7.5, 8.0, 5.5, 7.0, 8.5, 7.0, 6.5, 8.0, 7.5,
    ];
    const sleepQualities = [
      4, 3, 5, 2, 4, 5, 3, 4, 5, 2, 4, 5, 2, 4,
      5, 3, 4, 5, 3, 4, 5, 2, 3, 5, 4, 3, 4, 4,
    ];

    // Realistic mood scores — weighted toward middle, with genuine lows and highs
    const moodScores = [
      6, 5, 7, 4, 6, 8, 3, 6, 7, 5, 6, 8, 4, 7,
      5, 6, 9, 4, 6, 7, 5, 3, 6, 8, 6, 5, 7, 6,
      4, 7, 6, 8, 5, 6, 4, 7, 6, 5, 8, 6, 3, 7,
    ];

    const JOURNAL_TAGS = ['gratitude','growth','clarity','boundaries','rest','reflection','awareness','healing'] as const;

    // Journal entries (variable count per day)
    for (let j = 0; j < journalCount; j++) {
      const iJ = (journalOffset + j) % N_JOURNAL;
      // Spread timestamps across the day: morning, midday, evening
      const hourOffsets = [10, 15, 20, 22];
      const jTs = new Date(d.getTime() + hourOffsets[j] * 60 * 60 * 1000).toISOString();
      await localDb.saveJournalEntry({
        id: `demo-journal-${dateStr}-${j}`, date: dateStr,
        mood: MOODS[(idx + j) % MOODS.length],
        moonPhase: SIMPLE_PHASES[idx % SIMPLE_PHASES.length],
        title:   journalTitles[iJ],
        content: journalContents[iJ],
        chartId,
        tags: [JOURNAL_TAGS[(idx + j) % JOURNAL_TAGS.length]],
        contentWordCount: journalContents[iJ].split(' ').length,
        contentReadingMinutes: 1,
        createdAt: jTs, updatedAt: jTs, isDeleted: false,
      });
    }

    // Sleep
    await localDb.saveSleepEntry({
      id: `demo-sleep-${dateStr}`, chartId, date: dateStr,
      durationHours: sleepDurations[idx % sleepDurations.length],
      quality:       sleepQualities[idx % sleepQualities.length],
      dreamText:     dreamTexts[iD],
      dreamFeelings: JSON.stringify(dreamFeelingMaps[iD]),
      dreamMetadata: JSON.stringify({
        vividness:    1 + (idx % 5),
        lucidity:     1 + ((idx * 2) % 4),
        controlLevel: 1 + ((idx + 3) % 5),
        overallTheme: DREAM_THEMES[idx % DREAM_THEMES.length],
        awakenState:  AWAKEN_STATES[(idx * 3) % AWAKEN_STATES.length],
        recurring:    idx % 13 === 0,
      }),
      createdAt: sTs, updatedAt: sTs, isDeleted: false,
    });

    // Check-ins (morning + evening)
    const tagSets = [
      ['clarity','gratitude'],['anxiety','work'],['joy','creativity'],['boundaries','health'],
      ['rest','alone_time'],['relationships','eq_open'],['career','productivity'],['eq_calm','nature'],
      ['overwhelm','eq_grounded'],['growth','movement'],['eq_hopeful','social'],['grief','eq_heavy'],
      ['confidence','eq_focused'],['family','gratitude'],['body','rest'],['shadow work','awareness'],
      ['reflection','healing'],['energy','focus'],['stress','eq_grounded'],['play','joy'],
    ];
    const notes = [
      'Feeling good after morning pages.','Had a productive afternoon despite low energy start.',
      'Noticing patterns in when I feel most myself.','Processed something difficult – feeling lighter.',
      'Stayed off social media today, huge difference.','Midday slump but recovered well.',
      'Really present during evening walk.','Body feels tight – need to move more.',
      'Clear head, getting things done.','Emotional morning, breakthrough by afternoon.',
      'Tired but content.','Creative energy high today.','Needed more space than I gave myself.',
      'In flow most of the day.','Rough start, gentler finish.','Didn\'t push, just showed up.',
      'Felt something loosen today.','Long day but proud of how I handled it.',
      'Took a breath before responding and it changed everything.','Just about keeping the basics going.',
    ];
    const wins = [
      'Finished a task I\'d been avoiding.','Had a vulnerable conversation.','Moved my body intentionally.',
      'Set a boundary without over-explaining.','Got outside for a walk.','Actually rested when tired.',
      'Asked for help instead of powering through.','Journaled before bed.',
      'Said no to something draining.','Remembered to eat and drink water consistently.',
      'Stayed in the present moment during a hard meeting.','Created something for no reason except joy.',
      'Checked in with someone I care about.','Did something kind for myself.',
      'Didn\'t catastrophize a minor setback.','Caught a spiral early and redirected.',
      'Ate a real meal and sat down to eat it.','Put the phone down an hour before bed.',
      'Told someone the truth gently.','Let a compliment actually land.',
    ];
    const challenges = [
      'Comparison crept in during scrolling.','Underslept and it showed.',
      'Pushed past my limit before noticing.','Overthought an old conversation.',
      'Got pulled into someone else\'s anxiety.','Skipped movement and felt worse for it.',
      'Procrastinated on something uncomfortable.','Had trouble staying present.',
      'Got caught in a loop of worst-case thinking.','More reactive than I wanted to be.',
      'Hard to rest even when tired.','Took on too much without pausing to check in.',
      'Needed grounding and didn\'t reach for it quickly enough.','Felt disconnected for a bit.',
      'Ate late, slept poorly, one thing led to another.','Low patience near end of day.',
      'Avoided a conversation I need to have.','Spent too long in my head.',
      'Said yes when I wanted to say no.','Couldn\'t shake a vague anxious feeling.',
    ];

    for (let slot = 0; slot < 2; slot++) {
      const ts = new Date(d.getTime() + (slot === 0 ? 9 : 19) * 60 * 60 * 1000).toISOString();
      const moodIdx = (idx * 2 + slot * 7) % moodScores.length;
      const rawMood = moodScores[moodIdx];
      // Evening mood drifts slightly from morning — sometimes better, sometimes worse
      const moodOffset = slot === 1 ? (idx % 3 === 0 ? 1 : idx % 3 === 1 ? -1 : 0) : 0;
      const moodScore = Math.max(1, Math.min(10, rawMood + moodOffset));
      await localDb.saveCheckIn({
        id: `demo-checkin-${dateStr}-${slot}`, date: dateStr, chartId,
        timeOfDay:   slot === 0 ? 'morning' : 'evening',
        moodScore,
        energyLevel: ENERGY_LEVELS[(idx + slot * 3) % 3],
        stressLevel: STRESS_LEVELS[(idx + slot + 1) % 3],
        tags:        tagSets[(idx * 2 + slot) % tagSets.length],
        note:        notes[(idx + slot * 5) % notes.length],
        wins:        wins[(idx + slot * 3) % wins.length],
        challenges:  challenges[(idx + slot * 4) % challenges.length],
        moonSign:    MOON_SIGNS[(idx + 3) % 12],
        moonHouse:   1 + (idx % 12),
        sunHouse:    1 + ((idx + 6) % 12),
        transitEvents: [{ transitPlanet: 'Moon', natalPlanet: 'Venus', aspect: 'trine', orb: 1.2, isApplying: true }],
        lunarPhase:  LUNAR_PHASES[idx % LUNAR_PHASES.length],
        retrogrades: idx % 4 === 0 ? ['Mercury'] : [],
        createdAt: ts, updatedAt: ts,
      });
    }

    return journalCount;
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
    // Clear ALL demo entries — covers old seed versions that may have used
    // different ID formats (uid() instead of demo-* prefix)
    const db = await localDb.getDb();
    await db.runAsync("DELETE FROM journal_entries WHERE id LIKE 'demo-%'");
    await db.runAsync("DELETE FROM sleep_entries WHERE id LIKE 'demo-%'");
    await db.runAsync("DELETE FROM daily_check_ins WHERE id LIKE 'demo-%'");
    await db.runAsync("DELETE FROM insight_history WHERE id LIKE 'demo-%'");

    // Also clear by chart ID to catch entries from older seed versions
    // that used random UUIDs instead of demo-* prefixed IDs
    const allCharts = await localDb.getCharts();
    const chartIds = allCharts.map(c => c.id);
    if (chartIds.length > 0) {
      for (const cid of chartIds) {
        await db.runAsync('DELETE FROM journal_entries WHERE chart_id = ?', [cid]);
        await db.runAsync('DELETE FROM sleep_entries WHERE chart_id = ?', [cid]);
        await db.runAsync('DELETE FROM daily_check_ins WHERE chart_id = ?', [cid]);
        await db.runAsync('DELETE FROM insight_history WHERE chart_id = ?', [cid]);
      }
    }

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

    // ── 28 days of historical entries ──────────────────────────────────────
    let journalOffset = 0;
    for (let i = 0; i < SEED_DAYS; i++) {
      const d = daysBefore(SEED_DAYS - 1 - i);
      const dateStr = isoDate(d);
      const count = await DemoSeedService._seedDay(dateStr, d, activeChartId, dayNumber(d), journalOffset);
      journalOffset += count;
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
      { id: uid(), date: new Date('2026-01-05T09:00:00Z').toISOString(), region: 'chest', emotion: 'anxiety', intensity: 3, note: 'Tight chest going into the week. New year pressure.' },
      { id: uid(), date: new Date('2026-01-12T11:00:00Z').toISOString(), region: 'belly', emotion: 'anticipation', intensity: 4, note: 'Excited about a project taking shape.' },
      { id: uid(), date: new Date('2026-01-20T18:00:00Z').toISOString(), region: 'jaw', emotion: 'frustration', intensity: 3, note: 'Old pattern I caught in real time for once.' },
      { id: uid(), date: new Date('2026-01-28T10:00:00Z').toISOString(), region: 'heart', emotion: 'longing', intensity: 4, note: 'Missed someone I used to feel close to.' },
      { id: uid(), date: new Date('2026-02-05T08:00:00Z').toISOString(), region: 'legs', emotion: 'restlessness', intensity: 3, note: 'Body wanted to move. Sat too long.' },
      { id: uid(), date: new Date('2026-02-12T15:00:00Z').toISOString(), region: 'chest', emotion: 'grief', intensity: 3, note: 'A memory surfaced I hadn\'t expected.' },
      { id: uid(), date: new Date('2026-02-19T12:00:00Z').toISOString(), region: 'belly', emotion: 'excitement', intensity: 4, note: 'Starting to feel momentum with something I care about.' },
      { id: uid(), date: new Date('2026-02-26T19:00:00Z').toISOString(), region: 'shoulders', emotion: 'tension', intensity: 3, note: 'Carrying too much without asking for help.' },
      { id: uid(), date: new Date('2026-03-05T10:00:00Z').toISOString(), region: 'chest', emotion: 'openness', intensity: 4, note: 'Felt genuinely relaxed for the first time in weeks.' },
      { id: uid(), date: new Date('2026-03-12T08:00:00Z').toISOString(), region: 'belly', emotion: 'anticipation', intensity: 4, note: 'Big thing coming up. Body knew before I did.' },
      { id: uid(), date: new Date('2026-03-19T12:00:00Z').toISOString(), region: 'heart', emotion: 'warmth', intensity: 4, note: 'A genuine moment of connection today.' },
      { id: uid(), date: new Date('2026-03-26T15:00:00Z').toISOString(), region: 'jaw', emotion: 'frustration', intensity: 2, note: 'Noticed and let it go faster than usual.' },
      { id: uid(), date: new Date('2026-03-29T11:00:00Z').toISOString(), region: 'belly', emotion: 'excitement', intensity: 4, note: 'Working on something that feels truly meaningful.' },
    ]));

    await EncryptedAsyncStorage.setItem('@mysky:trigger_events', JSON.stringify([
      { id: uid(), timestamp: new Date('2026-01-07T16:00:00Z').getTime(), mode: 'nourish', event: 'Long walk in nature', nsState: 'ventral_vagal', sensations: ['warmth in chest','shoulders dropping'] },
      { id: uid(), timestamp: new Date('2026-01-15T10:00:00Z').getTime(), mode: 'nourish', event: 'Creative work with no agenda', nsState: 'ventral_vagal', sensations: ['open chest','easy breathing'] },
      { id: uid(), timestamp: new Date('2026-01-22T19:00:00Z').getTime(), mode: 'drain', event: 'Overcommitting, then regretting it', nsState: 'sympathetic', sensations: ['stomach knotting','jaw clenching'] },
      { id: uid(), timestamp: new Date('2026-01-29T09:00:00Z').getTime(), mode: 'drain', event: 'Poor sleep after a hard day', nsState: 'dorsal_vagal', sensations: ['heaviness','foggy head'] },
      { id: uid(), timestamp: new Date('2026-02-04T19:00:00Z').getTime(), mode: 'nourish', event: 'Deep conversation with a trusted friend', nsState: 'ventral_vagal', sensations: ['heart warmth','full breath'] },
      { id: uid(), timestamp: new Date('2026-02-11T15:00:00Z').getTime(), mode: 'nourish', event: 'Morning movement routine', nsState: 'ventral_vagal', sensations: ['grounded legs','calm energy'] },
      { id: uid(), timestamp: new Date('2026-02-18T12:00:00Z').getTime(), mode: 'drain', event: 'Unexpected conflict with no resolution', nsState: 'sympathetic', sensations: ['chest tightening','held breath'] },
      { id: uid(), timestamp: new Date('2026-02-25T20:00:00Z').getTime(), mode: 'nourish', event: 'Saying something honest and being heard', nsState: 'ventral_vagal', sensations: ['relief in chest','lighter shoulders'] },
      { id: uid(), timestamp: new Date('2026-03-04T16:00:00Z').getTime(), mode: 'nourish', event: 'Slow morning with no plans', nsState: 'ventral_vagal', sensations: ['softness in body','open breathing'] },
      { id: uid(), timestamp: new Date('2026-03-11T10:00:00Z').getTime(), mode: 'drain', event: 'Scrolling too long before sleep', nsState: 'dorsal_vagal', sensations: ['flat energy','disconnected'] },
      { id: uid(), timestamp: new Date('2026-03-18T19:00:00Z').getTime(), mode: 'nourish', event: 'Being fully present in a meaningful moment', nsState: 'ventral_vagal', sensations: ['alive in chest','eyes soft'] },
      { id: uid(), timestamp: new Date('2026-03-25T09:00:00Z').getTime(), mode: 'nourish', event: 'Morning movement routine', nsState: 'ventral_vagal', sensations: ['grounded legs','calm energy'] },
    ]));

    await EncryptedAsyncStorage.setItem('@mysky:relationship_patterns', JSON.stringify([
      { id: uid(), date: new Date('2026-01-08T17:00:00Z').toISOString(), note: 'I tend to become the emotional caretaker in friendships before I\'ve established my own ground. I watched myself do it today with awareness for the first time.', tags: ['over-giving','caretaking','awareness'] },
      { id: uid(), date: new Date('2026-01-21T21:00:00Z').toISOString(), note: 'Something I\'m learning: I attach a lot of meaning to how quickly someone responds to me. Working on tracking that without acting from it.', tags: ['anxious-attachment','noticing','growth'] },
      { id: uid(), date: new Date('2026-02-03T18:00:00Z').toISOString(), note: 'I have a pattern of testing people before I trust them — small tests they don\'t know they\'re taking. Starting to see how this creates distance.', tags: ['trust','testing','vulnerability'] },
      { id: uid(), date: new Date('2026-02-14T20:00:00Z').toISOString(), note: 'Valentine\'s Day made me aware of how much I perform connection instead of feeling it. Something to sit with.', tags: ['performance','authenticity','intimacy'] },
      { id: uid(), date: new Date('2026-02-24T17:00:00Z').toISOString(), note: 'I said no to something today and didn\'t spiral about it afterward. That\'s genuinely new. Boundaries without guilt.', tags: ['boundaries','self-respect','growth'] },
      { id: uid(), date: new Date('2026-03-05T21:00:00Z').toISOString(), note: 'Realized I\'ve been keeping certain people at a precise emotional distance — close enough to feel connected, far enough to stay safe. Noticing the design of it.', tags: ['avoidance','distance-regulation','awareness'] },
      { id: uid(), date: new Date('2026-03-17T18:00:00Z').toISOString(), note: 'Let someone see me struggling today instead of managing the moment. It felt uncomfortable and also necessary.', tags: ['vulnerability','authenticity','trust'] },
      { id: uid(), date: new Date('2026-03-27T20:00:00Z').toISOString(), note: 'I showed up for someone today without needing anything in return and it felt clean. That\'s who I want to be — giving without ledger-keeping.', tags: ['generosity','secure-attachment','healing'] },
    ]));

    // Daily reflections — pull unique questions from the actual question banks
    const reflectionAnswers: object[] = [];
    const AGREEMENT = ['Not True','Somewhat True','True','Very True'];
    const FREQUENCY = ['Not at All','Some of the Time','Almost Always','Always'];

    // 56 unique value questions (2 per day × 28 days), starting at id 0
    const valuesQuestions = [
      'I felt a clear sense of meaning in what I did today.',
      'I know exactly what matters most to me this week.',
      'I feel deeply aligned with my sense of purpose.',
      'I would live differently if no one was judging me.',
      'My life has a clear direction right now.',
      'I feel fully alive in my daily experiences.',
      'There is a problem in the world I feel compelled to help solve.',
      'I feel most like myself when I follow my own instincts.',
      'I would keep doing what I do even without external reward.',
      'I am consciously creating the legacy I want to leave.',
      'My days generally reflect what I consider a well-lived life.',
      'I am spending my time on what I would prioritise if it were limited.',
      'The work I do feels like play to me.',
      'I am addressing the conversations that matter deeply to me.',
      'I am actively living with life\'s most important questions.',
      'I feel proud of the person I am becoming.',
      'My experiences have fundamentally reshaped what I value.',
      'I am living in a way I want to be remembered for.',
      'A recurring desire in me is guiding my life choices.',
      'I have something meaningful I want to share with the world.',
      'I feel deep gratitude for things money cannot buy.',
      'Integrity is something I practise daily, not just believe in.',
      'I willingly sacrifice smaller things for what truly matters.',
      'I regularly experience a deep sense of satisfaction.',
      'I lose track of time doing things that matter to me.',
      'I am learning to accept difficult truths about myself.',
      'I am doing the things I would regret leaving undone.',
      'I honour my most important values consistently.',
      'My definition of success reflects my own truth, not society\'s.',
      'I choose purpose over comfort when it matters.',
      'I say yes to things that should have been a no more often than I\'d like.',
      'I am clear about which commitments truly deserve my energy.',
      'I choose growth over safety when it counts.',
      'I am tolerating things in my life that conflict with my values.',
      'I can make confident choices between two things that both matter.',
      'I handle difficult trade-offs with clarity and self-trust.',
      'I would willingly give up more to have real peace.',
      'I choose rest when I need it, without feeling guilty.',
      'My energy is distributed in proportion to what matters most.',
      'I carry obligations that no longer serve who I am.',
      'I balance ambition with contentment in a healthy way.',
      'I start my mornings in a way that reflects my true priorities.',
      'I make time for habits that align with who I want to be.',
      'I spend too much time on tasks I should let go of.',
      'My daily time reflects the person I am becoming.',
      'I can tell when something deserves my energy and when it doesn\'t.',
      'I hold back from things I want to do because of others\' judgement.',
      'I have made meaningful sacrifices for the people I love.',
      'I take my own needs as seriously as I take others\' needs.',
      'I protect what I value even when convenience tempts me otherwise.',
      'I am willing to disappoint people in order to be true to myself.',
      'Something in my life right now conflicts with who I want to be.',
      'I let go of things that aren\'t working even when I\'ve invested heavily.',
      'I consistently prioritise long-term meaning over short-term comfort.',
      'I feel at peace with how I spend my time.',
      'I am honest about what I actually want, even to myself.',
    ];

    // 56 unique archetype questions
    const archetypeQuestions = [
      'I feel most alive when I\'m actively seeking new experiences.',
      'I trust my instincts over convention.',
      'I am drawn to challenge the accepted way of doing things.',
      'I find myself naturally stepping into leadership roles.',
      'I feel compelled to protect people who cannot protect themselves.',
      'I seek knowledge as a way to feel safe in the world.',
      'Humour is one of my most important coping strategies.',
      'I feel happiest when I\'m creating something from nothing.',
      'I transform suffering into meaning more easily than most.',
      'I need deep emotional connection to feel fulfilled.',
      'I am most at peace when everything around me is in order.',
      'I express parts of myself that others keep hidden.',
      'I am willing to face danger or difficulty for what I believe in.',
      'I naturally take care of others before myself.',
      'I would rather explore the unknown than master the familiar.',
      'I see patterns and meanings that others tend to miss.',
      'I resist authority when it conflicts with my values.',
      'I delight in innocent, spontaneous moments.',
      'Freedom is more important to me than belonging.',
      'I often feel responsible for the emotional wellbeing of my group.',
      'I am motivated by the desire to prove myself.',
      'My happiest moments involve caring for someone else.',
      'I am restless when life becomes too predictable.',
      'Understanding the truth matters more to me than being comfortable.',
      'I want to overturn systems that feel unjust.',
      'I feel a strong connection to the magical or enchanted in life.',
      'I regularly envision a better world and work toward it.',
      'I notice hierarchies and authority dynamics in every group.',
      'I need periods of solitude to function at my best.',
      'I express my identity through my appearance and style.',
      'My sense of adventure sometimes leads me into difficulty.',
      'I would rather be right than liked.',
      'I go out of my way to make others feel comfortable.',
      'The journey matters more to me than the destination.',
      'I collect ideas the way some people collect possessions.',
      'I am suspicious of systems that benefit the few.',
      'I approach life with a childlike sense of wonder.',
      'I want to create something that outlasts me.',
      'I experience everyday situations with unusual intensity.',
      'I will endure hardship to transform into who I need to be.',
      'I am the person people come to when things fall apart.',
      'I am always searching for my true calling.',
      'I prefer deep conversation over small talk.',
      'I push boundaries to see what\'s possible.',
      'I dream of a more innocent, uncomplicated existence.',
      'I intuitively know what a space or group needs.',
      'I am drawn to risk when the cause feels important.',
      'I nurture projects and relationships with patient devotion.',
      'I sometimes feel like a stranger in familiar environments.',
      'My first instinct in a crisis is to understand what happened.',
      'I enjoy disrupting expectations.',
      'I feel alive during spontaneous, unplanned experiences.',
      'I am willing to stand alone for what I believe.',
      'I carry others\' pain as if it were my own.',
      'I feel a pull toward places I have never been.',
      'I believe wisdom requires sacrifice.',
    ];

    // 56 unique cognitive questions
    const cognitiveQuestions = [
      'I am able to see the whole picture before focusing on details.',
      'I make decisions intuitively and refine them later.',
      'I notice small details that others overlook.',
      'I prefer to think things through completely before acting.',
      'I adapt easily when plans change unexpectedly.',
      'I rely on logic more than feelings when making choices.',
      'I think in images, metaphors, or spatial relationships.',
      'I process information best when I can talk it through.',
      'I prefer working with concrete facts over abstract theories.',
      'I often see connections between seemingly unrelated things.',
      'I trust my gut feeling even when I can\'t explain it.',
      'I am energised by brainstorming many possibilities at once.',
      'I prefer a clear structure before starting a task.',
      'I think best when moving my body.',
      'I can hold multiple perspectives simultaneously without distress.',
      'I need to understand the why before I commit to the how.',
      'I am comfortable with ambiguity and open-ended situations.',
      'I learn best by doing rather than reading or listening.',
      'I tend to categorise and organise information naturally.',
      'I am drawn to novelty and original ways of thinking.',
      'I weigh pros and cons carefully before deciding.',
      'I notice when something feels off before I can name why.',
      'I prefer depth of knowledge over breadth.',
      'I am energised by variety in my daily routine.',
      'I break complex problems into smaller, manageable parts.',
      'I can easily switch between different types of tasks.',
      'I need silence and stillness to think clearly.',
      'I think about the future more than the past.',
      'I am more persuaded by evidence than emotion.',
      'I often revisit and revise my ideas after initial formation.',
      'I work best under a moderate amount of pressure.',
      'I process emotions through writing or creative expression.',
      'I am quick to spot logical inconsistencies.',
      'I integrate new information by relating it to what I already know.',
      'I am comfortable making decisions with incomplete information.',
      'I prefer to observe before participating.',
      'I think in systems and relationships between things.',
      'I am more reflective than reactive in difficult moments.',
      'I gravitate toward patterns in data, behaviour, or nature.',
      'I am energised by solving puzzles and problems.',
      'I need to feel emotionally safe before I can think clearly.',
      'I prefer written communication over verbal.',
      'I easily visualise outcomes before they occur.',
      'I question my own assumptions regularly.',
      'I prefer to research extensively before forming an opinion.',
      'I think about how decisions affect others before acting.',
      'I trust my reasoning even when others disagree.',
      'I am comfortable sitting with unanswered questions.',
      'I process best with a combination of quiet time and discussion.',
      'I notice the emotional tone of a room as soon as I enter.',
      'I am energised by learning something completely new.',
      'I prefer clear expectations over open-ended exploration.',
      'I can maintain focus for extended periods on interesting work.',
      'I am drawn to understanding how things work at a deep level.',
      'I adjust my thinking readily when presented with new evidence.',
      'I value precision in language and expression.',
    ];

    for (let i = 0; i < SEED_DAYS; i++) {
      const d = daysBefore(SEED_DAYS - 1 - i);
      const dateStr = isoDate(d);
      const sealedAt = new Date(d.getTime() + 21 * 60 * 60 * 1000).toISOString();
      reflectionAnswers.push(
        { questionId: i * 2, category: 'values', questionText: valuesQuestions[i * 2], answer: AGREEMENT[(i + 2) % 4], scaleValue: (i + 2) % 4, date: dateStr, sealedAt },
        { questionId: i * 2 + 1, category: 'values', questionText: valuesQuestions[i * 2 + 1], answer: AGREEMENT[(i + 2) % 4], scaleValue: (i + 2) % 4, date: dateStr, sealedAt },
        { questionId: i * 2, category: 'archetypes', questionText: archetypeQuestions[i * 2], answer: AGREEMENT[(i + 3) % 4], scaleValue: (i + 3) % 4, date: dateStr, sealedAt },
        { questionId: i * 2 + 1, category: 'archetypes', questionText: archetypeQuestions[i * 2 + 1], answer: AGREEMENT[(i + 3) % 4], scaleValue: (i + 3) % 4, date: dateStr, sealedAt },
        { questionId: i * 2, category: 'cognitive', questionText: cognitiveQuestions[i * 2], answer: FREQUENCY[(i + 1) % 4], scaleValue: (i + 1) % 4, date: dateStr, sealedAt },
        { questionId: i * 2 + 1, category: 'cognitive', questionText: cognitiveQuestions[i * 2 + 1], answer: FREQUENCY[(i + 1) % 4], scaleValue: (i + 1) % 4, date: dateStr, sealedAt },
      );
    }
    await EncryptedAsyncStorage.setItem('@mysky:daily_reflections', JSON.stringify({
      answers: reflectionAnswers,
      totalDaysCompleted: SEED_DAYS,
      startedAt: new Date('2025-12-31T00:00:00.000Z').toISOString(),
    }));

    // ── Relationship Charts (powers Relational Mirror) ─────────────────────
    const existingRels = await localDb.getRelationshipCharts(activeChartId);
    if (existingRels.length === 0) {
      const relBase = { userChartId: activeChartId, isDeleted: false as const };
      const rels: RelationshipChart[] = [
        {
          id: uid(), name: 'Jordan', relationship: 'partner',
          birthDate: '1999-07-14', birthTime: '08:30', hasUnknownTime: false,
          birthPlace: 'Denver, CO', latitude: 39.7392, longitude: -104.9903, timezone: 'America/Denver',
          createdAt: new Date('2026-01-10T12:00:00.000Z').toISOString(),
          updatedAt: new Date('2026-01-10T12:00:00.000Z').toISOString(),
          ...relBase,
        },
        {
          id: uid(), name: 'Maya', relationship: 'friend',
          birthDate: '2001-11-23', hasUnknownTime: true,
          birthPlace: 'Portland, OR', latitude: 45.5051, longitude: -122.6750, timezone: 'America/Los_Angeles',
          createdAt: new Date('2026-02-05T12:00:00.000Z').toISOString(),
          updatedAt: new Date('2026-02-05T12:00:00.000Z').toISOString(),
          ...relBase,
        },
      ];
      for (const rel of rels) await localDb.saveRelationshipChart(rel);
    }

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

    const dreamSymbolPool = ['water','light','door','forest','ocean','flying','field','home','bridge','library','figure','swimming','memory','color','shadow','mirror','path','garden','stars','fire','trees','clouds','city','mountains','night','sky'];

    // 91 days — generated deterministically from hash
    const checkInRows = Array.from({ length: SEED_DAYS }, (_, i) => {
      const d = daysBefore(SEED_DAYS - 1 - i);
      return {
        user_id:    userId,
        log_date:   isoDate(d),
        mood_value: 5 + (hashDate(isoDate(d)) % 5),
      };
    });

    const { error: ciError } = await supabase
      .from('daily_check_ins')
      .upsert(checkInRows, { onConflict: 'user_id,log_date' });

    if (ciError) {
      logger.warn('[DemoSeed] daily_check_ins upsert error:', ciError.message);
    }

    const dailyLogRows = Array.from({ length: SEED_DAYS }, (_, i) => {
      const d = daysBefore(SEED_DAYS - 1 - i);
      const h = hashDate(isoDate(d));
      return {
        user_id:      userId,
        created_at:   new Date(d.getTime() + 20 * 60 * 60 * 1000).toISOString(),
        stress:       1 + (h % 6),
        anxiety:      1 + ((h + 2) % 6),
        dream_symbols: [dreamSymbolPool[h % dreamSymbolPool.length], dreamSymbolPool[(h + 7) % dreamSymbolPool.length], dreamSymbolPool[(h + 13) % dreamSymbolPool.length]],
      };
    });

    const { error: dlError } = await supabase
      .from('daily_logs')
      .upsert(dailyLogRows, { ignoreDuplicates: true });

    if (dlError) {
      logger.warn('[DemoSeed] daily_logs upsert error:', dlError.message);
    }

    logger.info('[DemoSeed] Supabase cloud tables seeded.');
  },
};
