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
const SEED_FLAG_KEY = '@mysky:demo_seeded_v8';
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
  'Morning pages',
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
  'First page of the year',
  'The weight of January',
  'Small ritual, big anchor',
  'What the body knows',
  'Hard night, okay morning',
  'On disappointment',
  'Choosing presence',
  'What I owe myself',
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
  'A conversation I\'m proud of',
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
  'January morning pages — the ritual of writing before my brain gets distracted. Three pages of loose thoughts, no editing. Processed a worry that had been sitting at the edge of my mind. Already feel better.',
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
  'New year energy without the pressure of resolutions. Just sat with my coffee and thought about what I actually want — not the version I think I should want. The list was shorter than expected and more honest.',
  'January has a particular heaviness to it I always underestimate. The days are short. I\'m trying not to fight that but just let it be what it is. It will lift.',
  'Made a point of doing my morning pages before checking my phone. One week in. Already feel more grounded than usual. Rituals work because repetition works.',
  'Something in my body has been trying to tell me something for days. Not sure what yet. I\'m paying attention instead of overriding it. That\'s the shift.',
  'Last night was rough — couldn\'t sleep, thoughts spiraling. But morning came and things looked different. Not fixed, just lighter. That always surprises me and I\'m glad it still does.',
  'Disappointed about something I can\'t fully articulate. The diffuse disappointment is the worst kind — it doesn\'t have a clear object. Just a dull ache I have to move through.',
  'Put the phone in another room for the evening. Finished a book, made a real meal, went to bed at a reasonable hour. The basics work. I always forget how much they work.',
  'Kept a commitment to myself today that I almost broke. Showed up for the thing I said I\'d do. That sounds small. It wasn\'t to me.',
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
  'Had a conversation today where I stayed calm, said what I meant, and listened to the response. No spiral after. Just a clean exchange.',
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
  'Brittany, the planets today carry a quieter frequency — one that rewards listening over speaking.',
  'Something in your chart is completing its cycle, Brittany. Trust the timing of this.',
  'Brittany, today you are allowed to want more. The wanting itself is a form of wisdom.',
  'The stars today speak of convergence, Brittany. Things that have been separate are beginning to meet.',
  'Brittany, rest does not interrupt the journey — it is part of it. Honour that today.',
  'Your chart carries an unusual clarity this morning, Brittany. Name what you see.',
  'Brittany, the patterns you\'ve been recognizing are the first step toward releasing them.',
  'A season of tending is yielding now, Brittany. Notice what\'s beginning to bloom.',
  'Brittany, today the sky is asking you to receive — not to reach, not to push, just to receive.',
  'Something you thought was finished is offering a final resolution, Brittany. Stay open to it.',
  'Brittany, the work you\'ve done on yourself is not invisible. It\'s visible in how you move through this day.',
  'Your chart speaks of expansion today, Brittany — the kind that happens from the inside out.',
  'Brittany, the tension you\'ve been holding is beginning to find its form. Let it.',
  'Today\'s sky favours simplicity, Brittany. The most honest path is also the most direct one.',
  'Brittany, what you are not allowing yourself to hope for is exactly what your chart is pointing toward.',
  'Something stubborn is softening, Brittany. You may feel this more in the body than the mind today.',
  'Brittany, today belongs to the slow things — the quiet agreements you make with yourself.',
  'The sky today is holding space for your complexity, Brittany. You don\'t have to simplify.',
  'Brittany, your chart carries movement — not the frantic kind, but the underground kind that reshapes landscapes.',
  'Today is a day for marking what is true, Brittany. Write it down.',
  'Brittany, the part of you that resists tenderness is the same part that wants it most.',
  'The alignment in your chart today is rare and specific, Brittany. It says: now is the time.',
  'Brittany, today something you\'ve been afraid to trust is offering to be trusted.',
  'Your chart this morning carries a frequency of completion, Brittany. Something is done.',
  'Brittany, you are being asked today to show yourself as clearly as you show up for others.',
  'The sky today holds a particular kind of grace for you, Brittany. Let it in.',
  'Brittany, your chart speaks of a deepening — not a widening. Quality over volume today.',
  'Something beneath the resistance is beginning to agree with what you\'re trying to do, Brittany.',
  'Brittany, today your sensitivity is your compass. Follow it without apology.',
  'The work you\'ve been doing in the quiet is becoming visible, Brittany. Let it be seen.',
  'Brittany, today the sky mirrors the patience you have been practicing. It\'s ready to give something back.',
  'A meeting point approaches in your chart, Brittany — between who you are and who you\'ve been afraid to be.',
  'Brittany, the way forward is gentler than you think it is. The chart confirms it.',
  'Today is a day for saying yes to something you once refused out of self-protection, Brittany.',
  'Brittany, your chart today asks you to move through the day as if your belonging here is not in question.',
  'Something you\'ve been preparing for is preparing for you, Brittany.',
  'Brittany, the chart today speaks of your own readiness — which you have not yet acknowledged.',
  'The quiet is not emptiness, Brittany. Your chart reminds you today: something is growing in it.',
  'Brittany, what has been incomplete is finding its resolution. Trust the final step.',
  'The sky today carries the frequency of the brave, Brittany. You are among them.',
  'Brittany, something tender and true is available to you today. Don\'t rush past it.',
  'Your chart this morning carries an opening, Brittany — in the place where you normally close.',
  'Brittany, the direction the chart is pointing in is also the direction you already know you need to go.',
  'Today you are more resourced than you feel, Brittany. Your chart confirms what the tired mind forgets.',
  'Brittany, something has been with you through all of this. Today it steps forward to be acknowledged.',
  'The long arc bends today, Brittany. Slowly, but it bends.',
  'Brittany, today your chart speaks of a new chapter that begins with a single honest thing.',
  'Something about today has the quality of an exhale, Brittany. Your whole chart consents.',
  'Brittany, what you call starting over, your chart calls arriving. Welcome.',
  'The timing is not a punishment, Brittany — it\'s the exact interval required for what comes next to take root.',
  'Brittany, the sky today says: bring your full self. Not the edited one. The whole one.',
  'Something is resolving at a depth that won\'t be visible right away, Brittany. Trust the underground.',
  'Brittany, today your tenderness is an asset, not a liability. Your chart confirms it.',
  'The chart today speaks of integration, Brittany — the peaceful kind, where things stop fighting.',
  'Brittany, you\'ve been accumulating more than you realize. Today begins the harvest.',
  'Something is meeting you where you are today, Brittany — not where you think you should be.',
  'Brittany, your chart this morning carries the quality of a threshold you have already crossed.',
  'The sky today is asking for your attention, Brittany — not your effort. Just your attention.',
  'Brittany, what has felt slow is simply what it looks like from inside a real transformation.',
  'Today the chart offers you the word you\'ve been looking for, Brittany. Be still enough to hear it.',
  'Brittany, the version of yourself you\'re becoming is already beginning to live here, in these ordinary moments.',
  'Something in the chart today asks you to simply be present, Brittany. That is enough. It is more than enough.',
  'Brittany, today\'s sky is easy. Let yourself be easy with it.',
  'The chart this morning holds warmth for you specifically, Brittany. Receive it.',
  'Brittany, what you are building is also building you. The chart holds that truth today.',
  'Today is a good day to ask for what you need, Brittany. The chart says you have more support than you\'ve let yourself feel.',
  'Brittany, something is coming into focus. Give it time — the image is almost clear.',
  'The sky today is in your corner, Brittany. Move through the day knowing that.',
  'Brittany, your chart closes this chapter with a quiet affirmation: you arrived. You stayed. You grew.',
  'Today\'s chart carries a specific frequency for you, Brittany — one of quiet belonging. You are not out of place here.',
  'Brittany, the sky today confirms what you have quietly suspected: the direction you\'re moving in is right.',
  'Something is ready to be named, Brittany. Your chart gives you the clarity today to name it.',
  'Brittany, this morning\'s alignment asks you to receive, not produce. Let the day offer what it carries.',
  'The chart today holds a particular kindness for the part of you that has been working hardest, Brittany.',
  'Brittany, what you have built — in yourself, in your life — is more solid than it feels on difficult days. Your chart confirms the ground.',
  'Today your chart speaks of completion and continuation at once, Brittany. An ending that is also a doorway.',
  'Brittany, the sky today asks very little and offers a great deal. Let yourself accept the offering.',
];

const loveHeadlines = ['The intimacy you\'ve been protecting yourself from','What your nervous system does before your heart decides','Receiving without shrinking','The love that requires you to stay','Honesty as the deepest act of care','What you learned love was — and what it actually is','Desire and the fear of wanting too much','Vulnerability is the point, not the risk','Presence as the rarest gift you can offer','The pattern that ends when you name it','The longing beneath the longing','Closeness that doesn\'t ask you to disappear','What needs repair before it can renew','Being known without editing yourself first','The part of you that learned love had conditions','When closeness feels safer with distance still in it','How you love when you\'re afraid','The gift of repair','What intimacy is asking of you now','The love you haven\'t let yourself receive fully','Trust that was broken and is slowly rebuilding','Being seen clearly and staying anyway','What love looks like when the performance stops','The deeper yes beneath the surface yes','What becomes possible when you stop bracing','When proximity feels dangerous and why','The boundary that was actually a wall','Choosing vulnerable over polished','How to want without grasping','The version of love that doesn\'t require you to disappear','What asking for what you need actually feels like','When the old pattern shows up in new relationships','The thing underneath the argument','Softness as an act of courage','Learning to stay when your impulse is to withdraw','What it means to be loved for what you\'ve hidden','The long repair','When your past speaks through your present relationship','Love as a daily practice, not a destination','The specific grief of loving from a distance','Letting someone in, slowly','Connection that survives honesty','The fear of needing someone','Recognizing the people who make you feel safe to be small','The shape of care you were never given and are learning to give','What loyalty means to you now','The old wound and the new relationship','Curiosity as a form of love','Letting yourself need','How you receive care when it\'s freely given','Tenderness toward yourself first','Attachment without losing yourself','What fighting for connection actually looks like','Discernment over pattern-matching','Softening without dissolving','The love that shows up in ordinary moments','When someone stays','Being honest about your capacity today','The repair that requires two people who want to try','What you\'d say if you trusted the aftermath','Love that grounds rather than destabilizes','The beauty of being known','The weight of unexpressed affection','Closeness as a risk worth choosing','Intimacy that requires nothing be hidden','When you stop performing for the people who already see you','The love that began with an honest conversation','Learning to ask','What you deserve in love — stated clearly','How your body responds to safety','When closeness feels earned','Loving without managing the other person\'s feelings','The specific courage of ongoing presence','The difference between closeness and merging','What love has taught you that you didn\'t expect','Letting the right people witness you','When love becomes a mirror','The care inside the conflict','What you would give someone you loved — given to yourself','The invitation inside vulnerability','What is actually solid, when you look clearly','Receiving love as fully as you give it','The version of you who lets love land','What it costs to stay closed','Today\'s invitation: let one real thing be said','The love that is patient with your becoming','Trust as something rebuilt in small increments','Belonging that doesn\'t require a performance','The love that grows when you stop managing it','What it means to feel at home in a relationship','The specific courage of showing up without armor'];
const energyHeadlines = ['Precision over volume','The kind of momentum that actually lasts','Where your energy is leaking — and how to reclaim it','Your body is the primary instrument','The productivity hiding inside stillness','Rest that is not avoidance','Building at the level of foundation, not facade','The creative state you can\'t force — only invite','Sustainable effort as a spiritual practice','Getting back into your rhythm after you\'ve lost it','What it means to be focused and fully present at once','Energy is information — what is yours saying?','Discernment: the discipline of doing less, better','What becomes possible when you stop managing and start moving','The slow kind of progress that actually holds','Coming back to your body after being in your head','The effort you don\'t have to explain to anyone','Listening to what depletes before it becomes depletion','The morning ritual that anchors the rest','Building a container before filling it','What the tired body is actually asking for','The kind of energy that doesn\'t consume itself','Permission to go at half-speed and still arrive','Output that flows from capacity, not anxiety','The difference between busy and purposeful','How you recover when you\'ve pushed too hard','When stillness is a form of power','The creative discipline hiding inside structure','What alignment feels like in the body','Pacing yourself as an act of self-respect','Your nervous system as the primary gauge','The energy audit: where does it go?','Momentum without force','Deep work in a distracted world','The value of incomplete days honestly assessed','What renewal looks like in this season of your life','Protecting your capacity as a daily practice','How flow states come — and why forcing blocks them','What it means to work with your natural rhythms','The kind of rest that actually restores you','Doing less, more fully','The investment of energy in your own becoming','When the body asks to slow down and the mind resists','Recovery as a strategy, not a weakness','Your best work arrives after your real rest','Energy as a craft to be tended','The productivity of patience','The task that matters underneath the list','What the body needs before the mind can function','Clearing before creating','Anchoring into what restores you','The sustainable output model','When the pace is honest, the work is better','Deep energy versus surface stimulation','How rest compounds over time','The creative replenishment that looks like doing nothing','What is under the fatigue that isn\'t tiredness','The habit that makes everything else easier','Moving with the day\'s natural energy instead of against it','Your body knows before your calendar does','The kind of aliveness that comes from real rest','Matching your effort to what the moment actually requires','What real focus feels like versus what it\'s performed as','Building a relationship with your body\'s rhythms','Motion that moves from the center outward','When you conserve, you can give fully when it matters','The clarity that comes after you\'ve stopped pushing','Making something with what you actually have today','What your afternoon energy is trying to tell you','Working at your natural pace as a spiritual act','The energy that comes when you stop overriding the signals','Integration as part of the productive day','Respecting the ultradian rhythm: rest and focus in cycles','Your best creative state requires your honest current state','The signal in the second wind','Stillness as the space between the notes','Trusting a slower day to hold value','What output looks like when it\'s rooted','The productive day that begins with one honest question','Momentum builds where attention flows without pressure','Energy management as a form of integrity','The alignment between your inner state and your outer effort','Effortless action built on genuine inner quietude','What your body knows that your schedule ignores','The energy available when you stop performing productivity','The energy underneath the urgency','The restoration that only comes from genuine unplugging','When the work flows because the self is steady','Working with your nature rather than against it','What completion feels like when it comes from real capacity','The quiet power of working from your actual center'];
const growthHeadlines = ['The lesson is in the repetition, not despite it','Growth is not always forward — sometimes it\'s release','The identity that served you then is limiting you now','What this moment is asking you to see about yourself','Courage rarely announces itself before it\'s needed','You are not the same person who started this journey','Unlearning is the hardest and most necessary work','The discomfort is not a signal to stop — it\'s the signal you\'re close','What becomes visible when the noise quiets','You are in the long arc — and the long arc is bending','The process does not need your trust to be working','This season is not wasting your time — it\'s building your character','Expansion that is rooted does not sweep you away','The version of you arriving has been prepared by everything you\'ve survived','What you resist knowing about yourself is what you most need to understand','The thing you keep returning to is not a weakness — it\'s a thread','Slow change is still change','What the same story, repeated, is asking you to examine','The protective function of the thing you can\'t seem to let go of','Growth that happens underground before it shows above ground','Who you are becoming through this difficulty','The false self you\'ve outgrown','What fear loses when you stop obeying it','Sitting with what isn\'t resolved — and not rushing it','Recognizing the pattern at the moment of activation','When growth feels like grief','What your current edge is asking of you','The belief underneath the behavior','Releasing the self-concept that no longer fits','Integration as the less glamorous half of growth','When you acted from your old self and noticed afterward','The wisdom inside your difficulty','What your reaction reveals about your unhealed edge','The part of you that already knows what to do','How courage shows up when you\'re exhausted','The growth in the pause before the old response','What the fear of change is actually protecting','Making peace with your own imperfect progress','The long game of becoming who you actually are','What you\'re no longer willing to tolerate','The gift disguised as the thing you didn\'t want','Resilience as the quiet accumulation of kept promises to yourself','What I\'m learning about myself right now','The version of success that fits your actual life','Naming what you outgrew','When the limit becomes a doorway','The insight that was always there, waiting for you to be ready','What breaks open, grows','Sitting with the unknown as an act of maturity','The difference between who you were and who you\'re becoming — becoming visible','What you can hold now that you couldn\'t before','Turning toward your inner life as a consistent practice','Growing in the direction of your deepest knowing','The courage of setting down what no longer serves','What you\'ve learned about yourself this year','The identity you\'re ready to update','Growth requires that you become someone who can receive what you\'re asking for','The expansion available on the other side of this fear','What the wrong path taught you that the right one couldn\'t have','The discipline of returning to yourself when you drift','What self-awareness at its most honest looks like','Integration: the unglamorous work of making change real','The version of strength that includes vulnerability','Building emotional fluency as a lifelong practice','When you catch yourself mid-pattern — that\'s the growth','The story you\'ve been telling yourself that isn\'t true anymore','What real acceptance of yourself feels like, moment to moment','The slow miracle of consistent small change','Holding paradox: you are both enough and still becoming more','The edge between who you\'ve been and who you\'re willing to be','What your younger self needed and how you can offer that now','The courage of honest self-assessment without attack','Learning to act from fullness rather than from lack','Trusting the growth you can\'t yet see','What you have already become that you haven\'t yet acknowledged','A new chapter does not require you to justify why the old one ended','Becoming someone who can receive as openly as they give','Your growth is not linear — and that is completely fine','The version of you that exists when you stop performing','Claiming what you\'ve learned from the hardest parts','What you\'re ready for that you keep thinking you\'re not','The specific change that requires your exact kind of bravery','Arriving at a new version of yourself with gratitude for the journey','The self you are becoming wants you to trust the process','What patience with your own development actually looks like','The growth happening in the places you cannot see yet','The version of you who already knows how to do this','What it means to fully inhabit the person you\'ve been becoming','The new chapter that begins not with resolution but with readiness','What changes when you fully trust the direction you are moving in','The growth that is revealed only in the living of it'];

const loveMessages = [
  'With Venus active in your natal chart today, there is an invitation to examine the armor you wear before entering closeness. Not the protection earned through genuine discernment — but the older armor, the kind built during a time when you had no other option. That armor kept you safe then. Ask yourself honestly today: who are you still keeping out that you actually want to let in?',
  'Your Moon placement in Virgo creates a pattern where emotional safety becomes tied to being useful, to being needed. You give care fluently and receive it awkwardly. Today, notice the moment someone offers you something — warmth, help, attention — and your instinct contracts. That contraction is where the real work lives.',
  'There is a version of connection you have imagined and a version you have actually allowed yourself to receive. The gap between those two is not the other person\'s failure — it is the distance between what you say you want and what your nervous system currently believes is safe.',
  'Mars in your chart today activates a deep pull toward authenticity over performance in intimate space. You have spent real energy showing up as the version of yourself you believe is most lovable. But the people who matter most are not asking for a performance. They are asking for your actual presence.',
  'What you call independence is partly freedom and partly protection. Today\'s sky asks you to hold both truths at once: you have genuine strength, and you also use that strength to avoid the particular vulnerability of needing someone who might not stay.',
  'Your natal Venus placement carries a paradox: you desire deep, lasting intimacy, and you also move fast, test quickly, and close the door when you feel unseen. Today, practice the discipline of staying one moment longer in tender ground than feels comfortable.',
  'Something about your relational history has taught you to track for early signs of abandonment. You have become extraordinarily skilled at reading tone shifts, delays, changes in warmth. Today, ask: is this skill protecting me, or is it keeping me in a permanent state of low-level surveillance?',
  'Your chart indicates a rare moment where the walls between your inner life and your expressed life are thinner than usual. What you feel today, you can actually say. Today, trust the first language. Say the thing before the edit.',
  'There is a specific kind of loneliness that comes not from being alone but from being fundamentally unseen in a room full of people. Your chart today draws it forward — not to reopen the wound, but because you are ready to understand it differently.',
  'The pattern your chart is illuminating today is the gap between how generously you hold space for others and how rarely you ask for the same. Today, practice turning that witnessing toward the relationship itself.',
  'With Neptune aspecting your Venus this week, the line between who someone is and who you need them to be may feel blurred. The practice today is discernment: see the person in front of you as clearly as possible, separate from the story you\'ve been building.',
  'Healing in relationship does not always look like resolution. Sometimes it looks like staying present through something uncomfortable without shutting down or spiraling.',
  'Your chart carries the signature of someone who has done significant inner work and is beginning to be ready for the love that reflects it. Not the love that requires you to be smaller, more careful, more contained.',
  'Today, your Sun-Venus connection activates a profound truth: the intimacy you most want is not primarily about the other person. It is about your willingness to stay in contact with yourself while also staying in contact with another.',
  'The way you love is deeply influenced by what you believe you deserve. Today, your chart invites a simple, honest audit of that belief. Not to analyze it to pieces — just to see it, as clearly as possible, and ask if it is still serving you.',
  'There is a moment in every deepening relationship where the choice arrives: stay on the surface, or risk being truly known. Your chart today marks that threshold. The invitation is to step through it.',
  'Intimacy requires you to be the same person in front of someone else that you are alone. The rehearsed version, the improved version, the version editing out the difficult parts — none of these can be truly loved. Only the actual you can.',
  'Your chart today highlights a pattern where you pull back when connection gets close. Not because you don\'t want it — but because the closer it gets, the more you stand to lose. Notice this pattern today without judgment. Noticing is the first movement.',
  'The love that is available to you right now — in the relationships already present in your life — is asking for your attention. Not grand gestures. Just the quality of your presence. Are you actually here, with the people who are already here?',
  'Something you experienced early about what love feels like versus what it actually is has been quietly running in the background of every relationship since. Today your chart asks you to name it, clearly and without softening.',
  'The relationship you most need to strengthen right now is the one you have with yourself in the presence of others. How do you change when someone you care about enters the room? What part of you disappears or diminishes? That is where the work is.',
  'Receiving love requires a particular kind of courage — the willingness to let something good be true about yourself, in someone else\'s eyes that you can\'t control or undo. That is exactly what today\'s chart is asking you to practice.',
  'When you feel the impulse to withdraw from someone you care about, there is almost always something underneath it that is trying to protect something tender. Today, before you withdraw, name the tender thing. You may find the withdrawal becomes unnecessary.',
  'Your chart carries a signature of depth in relationship — which means the connections that matter to you require real presence, not surface interaction. Today, invest depth rather than breadth in your relational energy.',
  'There is a version of the conversation you\'ve been putting off that is available today if you choose it. Not because the moment is perfect — it never will be — but because the discomfort of not having it is beginning to cost more than the discomfort of having it.',
  'The pattern of giving more than you receive in relationship is not generosity — it is a form of control. If you give everything, you don\'t have to be vulnerable by asking. Today, notice where this bargain is operating.',
  'Love that is honest about needs, limits, and preferences is not difficult love — it is sustainable love. The relationships in your life that have lasted are the ones where both people were allowed to be real.',
  'Today\'s sky asks: who in your life knows the actual version of you — not the capable, together, generous version, but the uncertain, tender, sometimes-overwhelmed version? If the answer is no one, that is important information.',
  'Your chart today holds a particularly clear view of the relational wound you carry — not to punish you with it, but because you are developed enough now to look at it directly and begin to move it.',
  'The longing you feel for deeper connection is not a sign that something is wrong with your relationships. It is a sign that you are capable of more depth than you have yet allowed yourself to inhabit.',
  'Today, notice the difference between the version of closeness you perform and the version you actually feel. The gap between them is the exact territory your chart is illuminating.',
  'Your chart marks a day when vulnerability, offered honestly, will be met with more care than your nervous system believes is possible. The evidence for this is already present in the relationships around you. You simply haven\'t let yourself see it yet.',
  'What you are protecting yourself from in relationship has a name. Today, your chart asks you to say that name quietly to yourself — not as an accusation, but as an act of honest self-knowledge that begins the change.',
  'There is something your body already knows about a relationship in your life that your mind has been talking you out of. Today, put the mind aside briefly and listen to what the body is consistently pointing toward.',
  'The full expression of who you are is what the people who love you are actually asking for. Not your best, most edited, most prepared self. The full, present, sometimes-uncertain you. That is what love is actually for.',
  'Your capacity for deep care is one of the most remarkable things about you. And it functions best when it flows in both directions — when you are as genuinely cared for as you are caring. Today, let yourself be on the receiving end.',
  'Connection at the level you are capable of requires that you remain legible to yourself first. When you lose track of what you feel, what you need, what is true for you — intimate connection becomes impossible. Keep the thread back to yourself today.',
  'Love does not ask you to tolerate what diminishes you. It asks you to be honest about what you need and to hold steady in that truth even when it costs something.',
  'The repair work in a relationship you care about is available right now, if both people are willing. Your chart asks you today: are you willing? And can you find out if the other person is too?',
  'Your chart today illuminates the specific difference between the intimacy you settle for and the intimacy you actually want. Hold that difference clearly in mind today. One of them is available. Choose which to move toward.',
  'Something tender exists between you and someone in your life right now — a potential for real closeness that neither of you has fully named. Your chart today says: the naming is safe. The territory is safer than it looks.',
  'The version of you that loves well is also the version that has learned to ask for what you need. These are not separate skills. They develop together, and today\'s chart shows them both within reach.',
  'What you call being realistic about relationships is sometimes just the shape your fear takes in daylight. Today, hold one of your realistic assessments up to the light and ask: is this discernment, or is this protection that has gotten too rigid?',
  'Your ability to love is not in question. Your willingness to be loved — completely, without managing how it lands — is the frontier. Today, let one real thing in, all the way.',
  'Presence — actual, unhurried, unmanaged presence — is the rarest thing you can offer another person. It is also the thing that costs you the most, because it requires giving up control of how you appear. Today, try it. Just once, for just one moment.',
  'The relationships that have weathered difficulty with you are the ones worth tending now. Not the archived ones, the potential ones, or the imagined ones. The ones that are actually here. Today, tend one of them.',
  'Today\'s chart asks a simple and difficult question: where in your intimate life are you giving something other than what is true? And what would happen if, just once, you gave the truth instead?',
  'What you have learned about love by this point in your life is genuinely hard-won. Give it credit. And let it update as needed — because the love that is available to you now is different from the love that was available to you before.',
  'Love at depth requires you to let someone see your capacity for suffering as well as your capacity for joy. It requires the whole person, not just the illuminated half. Today, let a little more of the shadow be visible.',
  'You are allowed to need. You are allowed to ask for closeness, warmth, reassurance, presence. These are not signs of weakness in your chart — they are the evidence of a sophisticated emotional life that knows what it requires.',
  'Your chart today marks the beginning of a different relationship with vulnerability — one where you experiment with going first. Before you know how it will be received. That is the only way to find out.',
  'The walls that protect also isolate. Today\'s chart asks you to look honestly at which of your relational walls have become too costly to maintain — not to tear them down, but to find a door where for one person, at least, you leave it unlocked.',
  'Your love language, your attachment patterns, your relational needs — these are not deficits. They are a map. Today, use the map. Let someone who matters to you see it.',
  'The kindness you extend inward creates the possibility of genuinely kind relationship outward. This is not metaphor — it is the mechanism. How you treat yourself in private determines your floor in relationship.',
  'Something in you has been ready for more in a relationship for longer than you have admitted. Today, admit it. Not to anyone else — just to yourself. That is how real change begins.',
  'Today your chart holds space for the specific courage of saying: I want this. Not because you know it will be given. But because the wanting is true and deserves to be spoken honestly.',
  'You have made more room for others in your internal world than they may ever know. Today, allow that same space to exist for you — in your own internal world, first, and then in the relationship that matters most.',
  'The repair does not require the other person to go first. Your chart asks today: what if you went first anyway, from a place of genuine desire rather than obligation, and let the rest follow from there?',
  'The deepest intimacy is not found in the dramatic moments. It lives in the ordinary ones: the conversation that went somewhere real, the silence that didn\'t need to be filled, being known in the details. Today, look for that intimacy in the ordinary.',
  'What you bring to the people you love is rare. Your chart today asks you not to take that for granted — and not to keep it hidden behind performance. Let them actually feel it today.',
  'There is a feeling underneath the distance you sometimes create in relationship — something specific that the distance is managing. Today, instead of managing it, name it. The name gives you a choice that managing never does.',
  'Today, love in the smallest way available to you. A message sent. A question asked with genuine curiosity. A moment of full attention. The small gestures are not lesser. They are often the whole of it.',
  'Your chart today marks the end of a certain kind of relational protection and the beginning of a more honest way of being with the people who matter to you. It will feel uncomfortable. It will also feel closer to what you actually want.',
  'The love you are capable of giving is the love you are capable of receiving. The ceiling is the same. Today\'s chart asks: how high are you willing to let it go?',
  'You are, at this stage of your development, someone who knows a great deal about how you operate in relationship. The knowledge is important. But today, use it as a foundation for action rather than as a form of analysis that keeps you safely in place.',
  'The person in front of you right now — whenever you encounter them today — deserves the version of you that is fully present, not the partial, slightly withheld, managing version. That full person is available. Let them show up.',
  'Your chart today illuminates the specific quality of love you have been afraid to ask for. Not the general feeling — the specific thing. The type of presence, the form of recognition, the particular thing that makes you feel real to someone else. Ask for it today.',
  'The relationship that matters most in your life right now is being asked to evolve. Not to end, not to return to what it was — to evolve. That requires both people to be honest about what they need next. Today, your chart asks you to start that conversation.',
  'What would it feel like to be fully, unhesitatingly chosen — by someone who sees you completely? Your chart today asks you to hold that feeling in your body for one minute, without deflecting, without qualifying it, without earning it. Just feeling what it feels like to be worthy of it. Because you already are.',
  'Your nervous system has a memory of closeness that was followed by loss. That memory runs faster than conscious thought. Today, notice when old fear is misattributing to new safety. The new safety is real. You are allowed to let it be.',
  'Something you have been waiting for in a relationship has been waiting for you to take the first step. Your chart today carries the quiet encouragement: step. The waiting has gone on long enough, and the other side holds more than you have allowed yourself to hope for.',
  'Today is a day for the specific, ordinary, irreplaceable act of telling someone that they matter to you. Not implied. Not performed. Actually said, simply and truly. Your chart says this is the day. Say the thing.',
  'The love available in your life right now is not less than what you have imagined. It is different. And different, your chart suggests, is actually what you need — even if it requires letting go of the version you had been expecting. Let it be what it actually is.',
  'Your boundaries in relationship are not the problem. The rigidity of them sometimes is. Today, find one place where the boundary could flex slightly in the direction of more honest contact — and choose to flex it.',
  'Intimacy lives in the gap between what you have rehearsed and what actually comes out. That un-rehearsed place — the stumbling, honest, real one — is where connection actually happens. Today, spend some time in that gap.',
  'The love in your life is more present than fear tells you it is. Run the real inventory today, not the anxious one. Notice what\'s actually there. Then let yourself feel grateful for it — completely, without bracing for it to end.',
  'You have spent real effort learning to love well. That effort is not wasted. It is visible, every day, in the way you care for the people in your life. Today, let yourself recognize that — and let someone else recognize it too.',
  'Today\'s chart marks a particularly good moment to let your guard down, not because it is safe — it is always a risk — but because you are ready. Ready to move closer. Ready to ask for what you need. Ready to let real love look like whatever it actually is.',
  'The truest thing you can do in a relationship today is to be honest about where you actually are — not where you think you should be, not where you were, not where you\'re hoping to arrive. Just: here, now, with this person. Honest about all of it.',
  'Your chart closes this period with a clear message about love: you have more capacity for it than you have allowed yourself to use. The expansion is not about finding better people. It is about becoming someone who can receive and give from their own fullness. That person is you. You are already them.',
  'What would honest love look like in this chapter of your life — not the imagined version, not the one from before, but the love that is actually available, right here, to someone who is actually you? Your chart today asks you to look at that clearly and welcome what you see.',
  'Today\'s chart carries a specific invitation: to let one person in your life feel genuinely appreciated by you — not because you should, not because it will be reciprocated, but because they are real, they matter, and you have been meaning to say so.',
  'The version of love that asks you to abandon yourself is not love. Your chart today makes that distinction clearly. What remains, once you remove what requires your self-erasure, is what is actually worth tending.',
  'Where in your life are you currently receiving care without fully letting it in — deflecting it, minimizing it, or bracing against its depth? Today, your chart asks you to let one act of care land completely, without management.',
  'Something in your relational life has been asking for your full attention for longer than you have given it. Not because a crisis is approaching — but because what is good there deserves to be tended, not just maintained. Today, tend it.',
  'The love that lasts is the love that can hold difficulty — that can stay honest, stay present, and continue choosing each other through the complicated parts. Your chart today honors the love in your life that has that quality. Let yourself be grateful for it.',
  'Your chart today holds a simple, important truth: the people who love you do not need the best version of you. They need the actual version. Show up as that person today — uncertain, still learning, genuinely present.',
  'What would it mean to be fully known by the most important person in your life — not known despite your flaws, but known including them, and loved precisely in that fullness? Your chart today says that kind of love is closer than fear tells you it is.',
  'Today, love with less strategy. Less planning how it will land, less tracking how it is received, less managing the aftermath. Just the direct, simple act of caring — offered honestly, without a net.',
  'Your chart closes this season with a reminder about love: the barriers you carried into it are smaller now. The capacity is larger. Whatever comes next in your relational life, you will meet it differently — more honestly, more openly, from a deeper place. That is real growth. Let it matter.',
  'The love that has been most consistent in your life — the love that has shown up without drama, without condition, without needing you to be other than you are — is worth naming today. Let yourself know it. Let yourself receive it fully.',
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
  'Something that has been building is ready to move. The next step is not another round of preparation. It is the first step into action with what you already hold. You have more than you think you need. Begin.',
  'Your body is the first and final authority on your energy levels. Before you plan what you will do today, ask your body what it can actually give. Then plan from that honest answer — not from the version of yourself you wish you were running today.',
  'The output you are asking of yourself right now may not match the input your life is currently providing. This is a calibration issue, not a character flaw. Today, adjust the output to meet the honest input. See what becomes available.',
  'Energy spent in alignment with your actual values does not deplete the same way as energy spent performing what you think others expect. Your chart today asks: how much of your energy today is going to the real thing versus the performance of the real thing?',
  'The creative state you are hoping for is available to you in shorter windows than you believe. You do not need hours of unstructured time to access it. You need ten minutes of genuine permission. Give yourself that today.',
  'There is a task you have been carrying — not working on, just carrying — that is heavier than its actual weight. The carrying is the problem, not the task. Today, either do it or consciously set it down. Either choice ends the carrying.',
  'Your chart today highlights a specific kind of depletion: the kind that comes from unexpressed emotion that has been converted into productivity. The energy powering your busyness is actually something that wants to be felt. Today, feel it.',
  'The rhythm of deep work and genuine rest — the ultradian cycle — is how your body was designed to operate. Today, honor one full cycle: intense focus followed by real disengagement. Not both at once. One, then the other.',
  'You are allowed to work at a pace that does not hollow you out. That statement should feel obvious. If it does not — if you feel a resistance to it, a sense that you haven\'t earned the right to a sane pace — that resistance is the thing your chart is asking you to examine today.',
  'The things on your list that are not getting done are not failures. They are signals. Something about those specific things requires more than time. Today, pick one and ask: what is actually in my way here? The answer is rarely what the surface suggests.',
  'Your chart carries an invitation today to protect a specific block of time for the work that requires your deepest self. Not the reactive work. Not the administrative work. The work that moves things that matter. Guard that block like anything important — because it is.',
  'Something you have been treating as an obstacle in your work today is actually a redirection. Your chart suggests the energy blocked in that direction wants to go somewhere else. Follow the energy, not the original plan.',
  'Today, your most valuable productivity tool is the quality of your attention — which is not infinite and is not automatically renewed by busyness. It is renewed by rest, by beauty, by genuine interest, by moving your body. Invest in those things today in order to have more to invest in the work.',
  'Where in your current work are you spending effort that produces results, and where are you spending effort that produces only the feeling of having worked? Your chart today asks you to be honest about that distinction.',
  'The pace that is right for you is not the pace that is right for everyone else. Your chart carries a particular signature around timing — you work in depth rather than in breadth, in cycles rather than in streams. Honor that today, even if it doesn\'t look like what productivity is supposed to look like.',
  'Your body carries information about what kind of day you\'re in before your mind has processed it. Before you look at your list today, check in: what does the body say about what quality of engagement is available? Then let the plan honor that.',
  'The creative question you\'ve been circling without directly approaching it is ready to be approached. Not solved — approached. What would that look like today, if you let yourself sit with it for twenty unguarded minutes?',
  'Your chart marks today as particularly suited for completion over initiation. There are things you have started that are ninety percent done and deserve the ten percent that would make them whole. Today, finish something. The satisfaction will carry forward.',
  'The energy required for deep creative or intellectual work is not the same as the energy required for daily functioning. Both are real. Today, notice which you have more of, and route the harder work to where the deeper resource is actually available.',
  'There is a version of efficiency that is actually just speed — moving through things quickly without moving through them well. Your chart today asks for a different kind of efficiency: fewer things, done with full presence, completed in a way that doesn\'t need revisiting.',
  'Rest is not a reward you earn after sufficient productivity. It is a biological requirement that, when honored, produces more sustainable output over time. You already know this. Today, act from that knowledge rather than from the guilt that overrides it.',
  'What you are building does not need to look dramatic to be real. The quiet accumulation of consistent, careful work is building something your future self will be grateful for. Today, trust the quiet work.',
  'Your chart today asks you to notice the difference between the urgent and the important. These are never the same thing. The important things rarely announce themselves urgently. They wait. Today, do something important that has been waiting quietly.',
  'Your best work happens within a specific window of your natural daily energy cycle, and you know when that window is. Today, protect it. Give it to the work that most deserves it. Route everything less demanding to the windows outside it.',
  'The momentum available today is different from yesterday\'s — quieter, more interior. It is not a day for broadcasting or expanding outward. It is a day for deepening, for following one thread further than feels comfortable, for going all the way into one thing instead of touching many.',
  'Today your chart favors recovery over performance. If you push — and you will be tempted to — you will spend tomorrow paying the cost. If you recover — genuinely, with permission — you will have something real to give in the days ahead.',
  'Something in your current project or commitment is misaligned with your deeper purpose, and the misalignment is draining energy that should be going toward what actually matters. Your chart today asks you to name it. Not to act immediately — just to see it clearly.',
  'Motivation is not the cause of action. It is the result of it. Your chart today asks you to take one small, specific action toward something meaningful before you wait to feel ready. The feeling of readiness will follow the action. It rarely precedes it.',
  'Your chart carries a clear message about precision today: do one thing well rather than many things adequately. The one thing that done well would actually change something — find it, commit to it, be uncompromising about doing it properly.',
  'The energy you spend managing other people\'s experience of your work is energy that could be going into the work itself. Today, put it back. Do the work without simultaneously curating the perception of it.',
  'Something about your relationship with effort needs examination. You are capable of tremendous output, and you are also capable of using that output as a form of control — making yourself indispensable, managing outcomes through overwork. Today, ask honestly: is today\'s effort coming from love of the work, or from fear of what happens when I stop?',
  'Your chart today marks a period of integration. You have taken in a great deal — information, experience, emotional material. The work today is not to produce but to digest. Integration is invisible from the outside. It is not invisible in its effects.',
  'The thing that would most move your current work forward is not on your to-do list. It is the deeper question underneath the task — the thing you have been moving around rather than moving through. Your chart today asks you to move through it.',
  'When your energy is low, the work that is most worth doing tends to shrink to its essential form. This is not deprivation — it is clarity. Today, work from that reduced, essential form. See how much unnecessary complexity falls away.',
  'Your chart marks a window of genuine forward momentum today. Not forced momentum — not the kind that requires overriding your body or suppressing doubt. Real momentum, which is alignment between your intention and your actual state. Check for that alignment before you begin.',
  'The work that expresses who you most deeply are is not always the work that produces the most visible output. Today, make room for the work that is true — even if it is slow, even if no one sees it yet. Your chart says it is the work that matters most right now.',
  'Your energy today needs something to move toward that actually matters to you — not what should matter, not what is expected to matter. Something you genuinely care about, that your energy can organize itself around naturally. Find that thing. Move toward it.',
  'Today, the most powerful thing you can do for your energy is to reduce the number of open loops you are managing simultaneously. Pick one. Close it. Then pick another. The relief will free more capacity than any amount of caffeination.',
  'Your chart marks a day suited for slow, deep, uninterrupted work. The conditions for that kind of work must be created deliberately — environment, time, permission. Today, create those conditions before you begin, and then trust that what you produce inside them will be worth the preparation.',
  'The quality of aliveness you feel in your best creative or productive states is not an accident. It is the result of alignment between the work and who you actually are. Your chart today asks: is this work mine? Not whether it is good — whether it is authentic to who you are. Because only that will sustain.',
  'Something in your work practice is asking to be simplified. The complexity has accumulated gradually and now costs more than it produces. Today, find one place where you can return to simplicity — and do it, knowing simplicity is not inadequacy. It is honesty about what is needed.',
  'Your chart today marks a moment of restored clarity after a period of unclear direction. Use this clarity precisely: to name what you are actually trying to build, why you are building it, and what the next genuine step is. Write it down. Let it anchor the week ahead.',
  'There is a creative or intellectual risk you have been approaching but not quite taking. The hesitation is not lack of readiness — you are ready. It is the specific discomfort of being seen doing something you care about before you know how it will land. Your chart today says: take the step. The landing is better than the hesitation prepares you for.',
  'When you are in resistance to the work, the most useful question is not "how do I get myself to do this?" — it is "what does this resistance know that I haven\'t listened to yet?" Today, ask that second question. The answer may redirect you toward what actually needs doing.',
  'Your chart today asks for a specific act of discernment: can you identify the one commitment in your current life that is requiring energy disproportionate to its return? Not because you must drop it — but because naming it begins the process of right-sizing it.',
  'The recovery available to you today, if you actually give yourself to it, is the kind that compounds. The next three days of work will be different if you rest properly today. That is a trade your chart suggests is worth making.',
  'Today your energy is best invested in the work that creates the conditions for better work in the future — the structural work, the foundational work, the work that doesn\'t produce visible output today but changes what is possible in the months ahead. Your chart says this is that kind of day.',
  'Something you have been treating as a distraction is actually telling you something important. The pull you feel toward a different direction, a different focus, a different way of working — your chart asks you to take it seriously for at least ten minutes today, before you dismiss it as avoidance.',
  'The output that matters over time is not the brilliant single day — it is the presence of intelligent effort applied, day after day, toward something that actually matters. Your chart today honors the un-dramatic version of that effort. Keep showing up.',
  'When you move from a place of fullness — when your body is rested, your mind is clear, your nervous system is not in alert — the quality of what you produce is genuinely different. Today, your chart asks: what would it take to work from that place, even for just one hour today?',
  'Your chart today marks a useful kind of restlessness — the kind that signals something is ready to move. Before you redirect that energy into busyness, take three minutes to ask what it most wants to move toward. The answer, if you sit with it honestly, is usually clear.',
  'The people around you benefit most from the version of you that is not overextended. The quality of your presence, your thought, your care — all of it is higher when you are not running on empty. Taking care of your energy is not selfish. It is generosity with a longer view.',
  'Today\'s chart closes this period with a simple observation: you have been operating near your limits more than is sustainable, and your body has been patient about it. The invitation now is to genuinely recover — not to plan recovery, not to optimize rest, but to actually rest. Your chart says the work will be better for it. It will.',
  'The work that is most aligned with who you are has a particular quality to it — it draws rather than demands, it sustains rather than depletes, it feels like contribution rather than performance. Today, notice where that quality is present in your work and move toward it.',
  'Something your energy has been trying to tell you all week has not been heard yet. Before you plan today, sit for two minutes and ask your body: what does it actually need? Then let the answer inform at least one decision you make today.',
  'The kind of focus that produces your best work is not available on demand. It must be cultivated — through rest, through clear intention, through the removal of small frictions that accumulate into large noise. Today, remove one friction. Then see what opens.',
  'Your chart today honors the version of productivity that is invisible from the outside — the thinking, the integrating, the letting-things-settle that cannot be measured but is doing its essential work. Trust that kind of working today.',
  'Something you have been spending energy on has been draining rather than building. Your chart today asks you to name it honestly — not to eliminate it immediately, but to see it clearly. What you see clearly, you can choose consciously.',
  'The most useful thing you can do for your long-term productivity today is to strengthen one sustainable habit rather than sprint toward one impressive outcome. Small, consistent, sustainable. Your chart today honors the slow compound.',
  'Your chart today holds a specific insight about your creative cycle: you are between peaks, not in decline. The quietness is not emptiness. It is the interval before the next accumulation. Rest in it rather than forcing through it.',
  'What you are building requires your honest best — not your exhausted best, not your performing-wellness best, but the best you can actually give from where you actually are. Today, give that. It is more than enough.',
  'The energy available to you today is well-suited for one specific kind of task: the kind that requires depth rather than breadth, sustained attention rather than rapid switching, care rather than speed. Assign your best hours accordingly.',
  'Something you have been managing from outside yourself — the schedule, the list, the expectations — wants to be managed from inside yourself instead. From your actual energy, your real priorities, your body\'s honest signals. Today, try that.',
  'Your chart today marks a window suited for creative risk rather than safe repetition. Not the reckless kind of risk — the kind where you go further into what is actually interesting to you, further into what you actually care about, further than comfort but not further than integrity.',
  'The version of your work that is most alive is the version that is also most honest about where it is coming from. Today, let the work come from the real place — not the place you think it should come from, but the place it actually wants to emerge from.',
  'When your energy matches your intention, things get done differently — not faster, but better. More real. More aligned with what actually matters. Today, check for that alignment before you begin, and adjust your intention to match your honest energy.',
  'There is a form of rest that can happen in the middle of a working day — not sleep, not disengagement, but the shift from striving to allowing. From pushing to receiving. Today, find a small moment of that shift. Let the work breathe.',
  'Your chart today marks the end of this period with a note about how you have managed your energy across it: imperfectly, sometimes beautifully, often better than you gave yourself credit for. The work ahead benefits from what you\'ve learned. Take that knowledge forward.',
  'Today\'s chart holds a final thought on energy for this season: you are not a machine, and the best things you produce come from the parts of you that are most human — most feeling, most present, most genuinely invested. Protect those parts. They are your actual resource.',
  'The relationship between what you love and what you produce is the most important relationship in your work life. When those two things are close, work feels different. Today, close that gap by even one small degree: do one thing you genuinely love doing, and let that be part of the day.',
  'The most sustainable version of your energy practice is the one that you can maintain without willpower — the one that is rooted in genuine self-knowledge about when you are at your best, what depletes you, and what restores you. Today, honor one of those known truths.',
  'Your chart today closes this chapter of energy with something important: you know more about yourself and how you work best than you did when this chapter began. Use that knowledge going forward. It is one of the most valuable things this season produced.',
  'What becomes possible in your work when you stop apologizing for how you naturally function — for your pacing, your rhythms, your need for depth over speed? Today, work in a way that requires no apology. See what the work looks like from there.',
  'Something you have been circling in your work for days is ready to be approached directly. Not because the perfect conditions have arrived — they haven\'t. But because the circling is costing more than the approach would. Today, approach it.',
  'Your productive life is not separate from your inner life. The quality of your presence in one is the quality of your presence in the other. Today, do one thing that enriches your inner life. Notice what it gives to your work.',
  'Today\'s energy is not yesterday\'s. Before you assume it is, check. What is actually available right now? What does the body say? What does the spirit say? Meet today with what is actually true rather than what was true before.',
  'The output that has felt most meaningful to you this season — the work you would point to with genuine pride — came from a particular quality of presence and care. Recall what that felt like. Bring that quality to today.',
  'Your energy this season has been asked to do a great deal. Today, close the chapter by acknowledging what it carried — not just the tasks and outputs, but the emotional weight, the private effort, the persistence through resistance. That was all real work. Acknowledge it as such.',
];

const growthMessages = [
  'The pattern you keep returning to is not a failure of willpower. It is a teaching that has not yet been fully received. Today, rather than trying to break the pattern, try to become genuinely curious about it.',
  'There is a version of growth that looks like acquisition — more skills, more awareness, more insight. And then there is the version that looks like loss: the releasing of a story you\'ve been telling yourself about who you are.',
  'You have been holding an identity that served you during a chapter that is now ending. The identity of someone who manages alone, who doesn\'t need much. That identity is now the ceiling on your next evolution.',
  'Your chart today activates your natal Pluto placement — the part of you that is built for transformation, but not always for comfort. Today, look at one of those things without the impulse to fix it first. Just see it.',
  'Courage, in your chart, is not the dramatic, visible kind. It is the courage of continuing to be sensitive in a world that rewards hardness. Continuing to care in a culture that frames detachment as sophistication.',
  'You are not who you were twelve months ago. The evidence is not the things that changed externally. It is the things that no longer trigger you the way they used to. Growth at this level is quiet, almost invisible — but it is real.',
  'Unlearning is harder than learning because it requires you to release the thing that once helped you make sense of the world. Today, notice where your automatic interpretation of a situation feels older than the situation warrants.',
  'The discomfort you are in is not a sign that something is wrong. It is a sign that you are in the middle of something between where you were and what you are becoming. The middle passage is always uncomfortable.',
  'When the noise quiets — the noise of other people\'s opinions, your own worst-case thinking, the noise of comparison — what remains is the signal. It is quiet and it is clear, and it has always known exactly what you need to do.',
  'The arc of your development over the last several years has been bending toward the same thing: the capacity to be fully present in your own life rather than managing it from a safe distance.',
  'Your chart does not require you to trust the process because the process is easy. It asks you to trust it because you have evidence — your own evidence — that something real has been occurring beneath the surface.',
  'This season has not been wasted. The pauses, the confusion, the periods where nothing seemed to resolve — these were not detours from your growth. They were the terrain of it.',
  'Rooted expansion is what your chart speaks of now: not forward movement that loses the thread of who you are, but forward movement that keeps pulling from the same deep source.',
  'The version of you that is arriving has been prepared by every difficult thing you have moved through, every pattern you have named, every moment you chose honesty over comfort. You are more ready than you feel.',
  'Growth requires you to grieve what you are leaving behind, even when what you are leaving behind was limited. Today, make room for that grief. It is not an obstacle to the next chapter — it is part of the passage.',
  'The resistance you feel toward this next step is not evidence that you shouldn\'t take it. It is evidence that it matters. The things that don\'t matter don\'t generate resistance. They just generate indifference.',
  'There is a story about yourself that you have told so many times it has become invisible — more background than narrative. Today, try to find it and hold it in front of you. Ask honestly: is this story true? Is it still true? Did it ever fully serve you?',
  'Your chart today illuminates a particular growth edge: the gap between knowing what you believe and living as though you believe it. Today is a day for closing that gap by even one small degree in one specific area.',
  'The growth available to you right now does not require big decisions or dramatic changes. It requires a slightly more honest version of your daily life — slightly more honest about what you need, what you feel, what you want, what you\'re willing to do.',
  'Something is completing within you — a long cycle of learning, carrying, and gradually releasing. The completion may not feel triumphant. It may feel quiet, even anticlimactic. Trust the quietness. It is real.',
  'Your chart today asks you to distinguish between growth you are genuinely ready for and growth you are performing because you feel you should be at a certain stage by now. The former will stick. The latter will exhaust you. Choose the former.',
  'Fear of your own potential is a real thing. It is not false modesty — it is the genuine discomfort of becoming someone with more visibility, more responsibility, more exposure. Your chart today names this fear and asks: what if you moved toward it anyway, incrementally, beginning today?',
  'The healing that is available to you right now is not the healing of becoming a different person. It is the healing of becoming more fully the person you already are — the version that doesn\'t have to manage or perform, the version that exists when no one is watching.',
  'Your chart today illuminates the relationship between your inner life and your outer behavior. There is a gap somewhere — a place where what you believe is true about yourself does not yet appear in how you move through the world. Today, notice where that gap is. Begin to close it.',
  'Something you were taught early about what it means to be a good person has shaped your growth in ways you don\'t always recognize. Today, hold that teaching up to the light. Some of it is gold. Some of it is borrowed constraint. Today, identify which is which.',
  'The capacity for genuine self-compassion — not performance, not sentiment, but the actual kind, the kind that holds your difficulty the way you would hold a friend\'s — is a form of growth your chart marks as the work of this season.',
  'There is a version of your life you have been imagining from a distance but not quite stepping toward. Your chart today asks what the first real step toward it would look like — and whether the hesitation is wisdom or protection that has lasted longer than necessary.',
  'Growth, in your chart, is not measured by achievement. It is measured by the depth of your contact with your own actual life — how present you are to what is real, how honest you are about what you feel, how genuinely you inhabit the days you are given.',
  'The thing you are building toward requires a version of you that is slightly more undefended than your current default. Not naive — just more available. That version of you, less defended and more genuinely present, is what your chart is pointing toward today.',
  'Today\'s chart asks you to hold something your growth has produced — something you can now do, or see, or carry, that you couldn\'t before. Not as proof of anything. Just as acknowledgment. You have grown. It is real.',
  'Your chart today points to the hidden cost of always being the capable, together one in the room. The cost is not just energy. It is the specific kind of growth that only happens when you let someone else see you uncertain, in process, not yet arrived.',
  'Change at depth requires you to tolerate not knowing who you are in the middle of it. The familiar self recedes. The new self has not yet arrived fully. The work, in that in-between, is to remain curious rather than to collapse back into what you already know.',
  'There is something you have been approaching in your growth but consistently stepping away from at the last moment. Your chart today brings it into clear view. The question is not whether you see it — you do. The question is whether this is the day you stop stepping away.',
  'Spiritual and psychological maturity, in your chart, is not about achieving a state of peace. It is about developing the capacity to be present with states of non-peace without destroying things. You have been developing this. Today, notice how much is available to you that wasn\'t before.',
  'Your chart today marks an important distinction: the growth that comes from healing old wounds is different from the growth that comes from expanding into new capacity. Right now, both are available. Know which one today is asking for your attention.',
  'Today\'s sky asks you to take credit for the growth you have done. Not in public — privately, honestly, to yourself. The growth has been real. Your own underestimation of it is itself a pattern to work with. Begin by seeing the change accurately.',
  'The next level of your development requires not more knowledge but more embodiment of what you already know. You understand, intellectually, how you want to live. Today, close the gap between the understanding and the living of it.',
  'Something in your growth right now is asking for patience of a particular kind — not passive waiting, but active trust. Trust that what is forming underground is forming. Trust that the silence between the insights is not absence of progress but preparation.',
  'Your chart today asks you to examine the difference between your public growth narrative — the one you share when people ask how you\'re doing — and your private one. Which is more honest? Which contains the more important information? Which would it benefit you to live closer to?',
  'The version of yourself you have been becoming over the last several years has more integrity, more self-awareness, and more genuine capacity than the version you started with. Today, honor that. Not by announcing it — by being it, quietly and without apology.',
  'Growth, at its most honest, requires the willingness to be wrong about yourself — wrong about what your limits are, wrong about what you are capable of, wrong about what you deserve. Today, hold one area where you might be wrong in exactly that way.',
  'The completion that is near is not an ending. It is a graduation. You are not losing something — you are outgrowing the need for it. Today, let that feel like an accomplishment, because it is.',
  'Your chart closes this period with a clear message: you are not the person you were at the beginning of this chapter. The evidence is everywhere in your daily life, in the quality of your choices, in the way you recover, in the things that no longer have power over you that once did. You have grown. Let that be enough. And let it be the beginning.',
  'The work of becoming is never finished, but it has chapters. This chapter is ending. Something real was learned. Something that was tight has loosened. Something that was in shadow has come into light. Whatever comes next, you enter it different. Your chart says: know that. Carry it forward.',
  'There is a specific form of courage that your chart marks as yours — not dramatic, not performed, but the quiet daily courage of choosing to remain soft, open, and present in circumstances that reward hardness. You have been practicing that courage. Today, practice it again.',
  'Your growth this season has happened largely in the dark — in work that was not visible, in choices that no one applauded, in the accumulation of honest small moments. Your chart today asks you to acknowledge that the unseen work is the real work. And you have been doing it.',
  'Something your chart has been tracking for months arrives today at a place of quiet resolution. Not drama — resolution. The kind where the thing that was tangled finally comes loose, gently. Notice it. Let yourself feel what it\'s like to be on the other side.',
  'Your chart today holds a specific invitation for integration: to take something that has been circling in your awareness for weeks and bring it down into your body, into your behavior, into how you actually live. The insight is not the growth. The embodiment is. Today, embody one thing.',
  'The version of yourself that exists when you are most fully yourself — unperforming, unguarded, genuinely present — is the version your chart says is your most important growth edge now. Not becoming more, but becoming less obscured. Less managed. More real.',
  'Today closes with a reflection on the full arc of this season. You entered it one way and are leaving it another. The change is quiet but it is real. You have more capacity for honesty, for presence, for the kind of growth that doesn\'t need applause. Your chart sees it. Let yourself see it too.',
  'Growth does not always ask for your permission. Sometimes it simply happens — in the way you responded to something today that would have undone you six months ago, in the smaller charge of what used to destabilize you, in the steadiness that arrives without effort. Notice it today.',
  'The thing you are in the middle of right now — the uncertainty, the not-knowing, the difficult stretch — is not a detour from your development. It is the development. Your chart today honors you for being in it rather than around it.',
  'Your current growth edge is not where you expect it to be. It is not the dramatic area, the area you are working on most visibly. It is the quiet, unguarded area — the place where the old way still runs automatically when you are not paying attention. Today, pay attention.',
  'There is a quality in you that has deepened this season without fanfare: the capacity to sit with uncertainty without immediately trying to resolve it. That is not a small thing. Your chart today asks you to name it as the genuine development it is.',
  'What you have learned about yourself this season could be stated in one honest sentence. Try to state it today — not as a performance, not for anyone else, just for yourself. One sentence that captures what this period has actually shown you about who you are and what you need.',
  'The growth that is most useful to others — the growth that makes you someone safe to be around, someone honest and present and genuinely caring — is the growth that is happening in you right now. It may not feel visible from the inside. From the outside, it is real.',
  'Today\'s chart asks a specific question about your development: what is the one area where the gap between who you know yourself to be and how you actually behave is widest? Not to judge — to know. Because knowing it is the first step to something genuinely changing.',
  'Something you have been afraid of becoming — more visible, more honest, more fully present in your own life — is beginning to happen anyway. Your chart today marks that transition and asks you to welcome it rather than resist the person you are becoming.',
  'The version of yourself that is most clear-sighted, most honest, most genuinely grounded — that version already exists. It is not in the future. It shows up in specific moments when you are least defended. Your work now is to create more of those moments intentionally.',
  'Growth in your chart this season has had a specific shape: the loosening of what was held too tight, and the strengthening of what needed more real structure. Both are happening simultaneously. Today, notice both.',
  'The breakthrough that is coming in your development is not going to look like a breakthrough. It is going to look like a quiet morning when something that used to be hard simply isn\'t anymore. Watch for that.',
  'Something your growth has required of you this season is the willingness to be seen in the middle of it — not finished, not polished, but genuinely in process. That vulnerability is itself a form of maturity. Your chart honors it.',
  'Today\'s chart recognizes something specific: you have been practicing a kind of honesty with yourself that is rare. Not the kind that attacks, not the kind that inflates — the accurate kind, the kind that actually sees. That practice is changing you from the inside out.',
  'The willingness to stay in a difficult season without needing it to resolve prematurely is one of the most important psychological skills there is. You have been practicing it. Today, recognize it as the sophisticated capacity it is.',
  'What your growth has been building toward is not a destination. It is a way of being — more present, more honest, more genuinely available to your own life. That way of being is not a future state. It is available in every ordinary moment. Including this one.',
  'The pattern you identified months ago and have been working with patiently has genuinely shifted. Not gone — shifted. The activation is less automatic. The recovery is faster. The cycle is shorter. Your chart today asks you to track that evidence clearly.',
  'Today is a significant day in your development — not because anything dramatic happens, but because you carry forward everything this season has built in you. The next chapter begins with what this one has deposited. And what it has deposited is substantial.',
  'There is something your growth wants to do next that your current life doesn\'t quite have room for yet. Today\'s chart asks: what is that thing? And what is one way to make even a small amount of space for it?',
  'Your chart marks a specific maturity that has developed this season: the ability to distinguish between what you feel and what is real, between what your fear says will happen and what is actually likely to happen. That discernment is one of your most important new tools.',
  'The version of yourself that you were at the beginning of this chapter needed certain things to feel safe, certain reassurances to function, certain conditions to show up fully. Today, notice how many of those conditions you no longer require. That is the measurement of your growth.',
  'Something that was wounded in you has not fully healed — but it has been genuinely tended. And tended wounds heal differently than untended ones. Your chart today honors the tending you have done, consistently, without always knowing if it was working. It was.',
  'The growth available in the next chapter of your life requires the specific things this season has been building in you: increased honesty, increased capacity to receive, decreased reactivity to the old patterns. You are more prepared than you know. Your chart says: go.',
  'What you carry forward from this season is not just insight. It is capacity. The specific, embodied, lived-in capacity to do something you could not do before. Name what that something is. Carry it intentionally. It belongs to you.',
  'Today\'s chart closes with a recognition that is important: the growth you have done this season was not easy, and it was not always visible, and it required more from you than most people will understand. Your chart sees the full scope of it. It was real. It mattered. You are different. That is enough.',
  'The arc of your development is long, slow, and genuinely beautiful. This season has been one part of it — the part that asked you to deepen rather than expand, to root rather than branch, to become more real rather than more. You have. And the work continues, different now, from a better place.',
  'What you are arriving at is not a finished self. It is a more honest one — a self that knows more about its patterns, its needs, its edges, and its genuine capacities. That more honest self is the one that the next chapter is waiting for. Begin as that person. You already are.',
  'Your chart closes this season with one final message about growth: the version of you that began this chapter was doing their best. The version closing it is doing better, in the specific ways that matter. That is all growth ever is. And it is real. And it is yours.',
  'Today\'s growth insight is the quietest and most important one: you are allowed to stop working so hard at becoming yourself. You are already, undeniably, irreducibly yourself. The growth now is in inhabiting that more fully — not in becoming something other than what you already essentially are.',
  'The thing your development has been pointing toward for some time is beginning to come into view. Not as a destination — as a quality. A quality of presence, honesty, and self-knowledge that is becoming your natural orientation. Today, be that. Let it come naturally.',
  'Where you are in your development today is exactly where this season has placed you — and this season has placed you well. You did not shortcut. You did the work. The ground beneath you is solid. Move forward from it.',
  'The last page of this chapter: you grew. Not in the ways you expected, not on the timeline you preferred, and not without difficulty. But you grew. In the ways that matter — slower, deeper, more honest than you were before. That is the only kind of growth that holds. You have it.',
  'Nothing from this season is wasted. The confusion, the effort, the quiet persistence, the private reckonings — all of it contributed. What you are at the end of this is the sum of all of that. And the sum is someone worth becoming. It is you. It has always been you.',
  'Your chart today asks: who have you become, in this chapter, that you couldn\'t have anticipated? Write that person down. Know them. Introduce yourself to the future from that place of genuine, earned arrival.',
  'The growth completed in this season is not the end of the work. It is the beginning of new work — harder in some ways, lighter in others, more rooted in who you actually are. That is the best kind of beginning. Today, you begin again.',
  'What this season has ultimately been about — beneath the specific challenges, the particular insights, the cycles of effort and rest — has been a deepening of your relationship with yourself. More honest. More patient. More genuinely kind. That relationship is the foundation of everything else. It is more solid now.',
  'The most honest version of your growth story is not the one that looks good — it is the one that is true. Today, let it be true. Let the difficult parts count. Let the private victories count. Let the whole story be what actually happened.',
  'Something that once required great effort from you now requires almost none. Before you move on, take a moment to notice that — to feel the difference between where you were and where you are. That is what growth feels like from the inside.',
  'Your chart today marks a quiet turning point: the thing you most needed to learn this season has been learned. Not perfectly, not permanently — but genuinely. It is now part of how you move through the world. That is no small thing.',
  'The version of yourself you have been growing into this season does not need to be announced. It simply needs to be inhabited. Today, inhabit it — in the small choices, the quiet moments, the ordinary interactions where who you are actually shows.',
  'You have done the kind of work this season that most people avoid for years. Not because you are exceptional — but because you made a choice to be honest, to stay with difficulty, and to grow rather than avoid. That choice, made again and again, is what changes a life.',
  'Today closes the growth chapter with one clear truth: the person you are now carries less weight than the person who began it. Not because the world got lighter — because you set something down. That something was heavy. That setting-down was real. Carry less into what comes next.',
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
  'You do not have to have everything figured out to move forward. Moving forward is how things get figured out.',
  'The thing you are most hard on yourself about is probably a place where more compassion, not more pressure, is what creates real change.',
  'A boundary is not a wall. It is a statement of what you need to remain whole. You are allowed to need things. That is not a burden on the people who love you.',
  'The comparison you\'ve been making between yourself and someone else is based on incomplete information about both of you. Release it. Your path is yours.',
  'You have survived every difficult thing you have encountered so far. That is not a small thing. It is evidence of a deep and consistent resilience that deserves acknowledgment.',
  'Your feelings are not inconvenient data that needs to be managed. They are information from a sophisticated system that is trying to take care of you. Listen to them.',
  'The version of you that needs to rest today is not weaker than the version who pushes through. They are the same person at different points in the same cycle. Honor the cycle.',
  'You are allowed to not know. Certainty is not required for forward movement. You can take the next small step without having a clear view of the whole path.',
  'The thing that is weighing on you right now is real. You don\'t have to minimize it to be okay. You can hold it honestly and still be okay.',
  'Your body has been patient with you. Today, be patient with it. Move gently, eat something nourishing, drink water, rest when you can. These are not trivial acts. They are the ground everything else runs on.',
  'You are more than your productivity. You were enough before you accomplished anything today, and you will be enough if you accomplish nothing. This is not a consolation. It is a fact.',
  'Something you are ashamed of is not the whole truth about you. It is one part of a much larger, more complex, more interesting person. Hold the whole, not just the part you\'ve been critiquing.',
  'You don\'t have to be at your best to be worthy of care — from others or from yourself. Care is not conditional on performance. Receive it today, even imperfectly.',
  'The mistake you made was not a sign of who you fundamentally are. It was information about what you need to learn. Different thing. Much more workable.',
  'What you are afraid of is often smaller than it appears in your anxiety. Not always — sometimes it is real. But today, try looking at it directly and asking: what is the actual, specific thing I am afraid of? The named fear is smaller than the unnamed one.',
  'Stillness is not laziness. It is how the mind consolidates, how the body repairs, how the inner life resynchronizes with the outer one. You are allowed to be still today.',
  'The voice that tells you it\'s not enough — your work, your love, your presence, your effort — is not an honest assessor. It is a pattern. Notice it. Name it. Do not automatically believe it.',
  'You are in the process of something. Not finished. Not failing. In the process. That is exactly where you are supposed to be.',
  'The help you offer others so naturally is also available to you. You do not have to be the only person who goes without. Let someone carry something with you today.',
  'Whatever you are feeling right now is welcome here. Not as a problem to be solved. Just as what is true, for you, in this moment. That is enough of a reason to feel it.',
  'Being honest about your limits is not weakness. It is information. People who love you would rather know your actual limits than receive a performance of limitlessness that costs you everything.',
  'Today\'s reminder: you are doing better than your inner critic believes. The gap between how you assess yourself and how the people who love you see you is almost always wider than you think. Bridge it, a little, today.',
  'The season of difficult growth you have been in is real and it has been hard. That deserves acknowledgment. Not just from others — from you, to yourself. Today, acknowledge it.',
  'Something that has been difficult for a long time is allowed to become easier. You don\'t have to brace for the ease. You don\'t have to suspect it. Things do get easier. Let this be one of those things.',
  'Your worth is not tied to your usefulness. You are not a tool. You are a person. That distinction matters more than you have been allowing it to matter.',
  'When you are in the middle of something hard, the most reliable indicator that you are okay is not the absence of difficulty. It is the continuity of your own presence — the fact that you are still here, still honest, still showing up. You are. That means you are okay.',
  'Today\'s reminder is simple: you are allowed to be where you actually are. Not where you think you should be. Not where you were. Not where you hope to arrive. Where you actually are, right now, is a valid and legitimate place to stand.',
  'Something tender is alive in you today. It doesn\'t need to be explained or justified or transformed into something more useful. It is allowed to just be what it is. Be gentle with it. Be gentle with yourself.',
  'You have been carrying more than you have been saying. Today, you don\'t have to carry it alone. Tell one person one true thing, and see what becomes available on the other side of that honesty.',
  'The way you recover from difficult things is evidence of your integrity. You come back. You try again. You stay honest about what happened. That recovery is not nothing. It is one of your most important qualities.',
  'Today is not the whole story. However today feels, it is one chapter in something much longer. The longer arc does not require this chapter to be easy. It only requires you to move through it honestly. You are doing that.',
  'Rest that is earned feels like relief. Rest that is allowed feels like grace. You don\'t have to earn it today. Let it be grace. Let yourself simply be rested, and let that be enough.',
  'The harshest version of your inner voice developed in circumstances that are not your current circumstances. It is running old software on new terrain. Gently, today, remind yourself: this is not then. You are different. So is this.',
  'Something good is happening in your life that you may not be fully feeling because you are braced for its reversal. Today, let the good thing be good without immediately looking for the catch. You are allowed to receive it.',
  'Today\'s reminder: the work you are doing on yourself — the slow, unsexy, non-dramatic kind, the kind that nobody sees but you — that is the real work. And you have been doing it. It matters. You matter.',
  'Whatever you didn\'t finish, whatever you said wrong, whatever you left undone today — it is not the sum of you. Tomorrow is real. The chance to try again is real. You are allowed to let today be imperfect and still be enough.',
  'Your tenderness toward others is one of your most important qualities. It does not require you to be bottomless. It requires you to be genuine. Today, be tender with one person — including yourself.',
  'The question is not whether you will always feel this way. You won\'t. The question is whether you can be with how you feel right now without making it mean something permanent. You can. You\'ve done it before. You\'re doing it right now.',
  'You are allowed to have limits. Not as a character flaw to overcome, but as honest information about what a particular moment or day can hold. Honor your limits today and see what becomes possible on the other side of that honesty.',
  'One thing that is true, right now, regardless of everything else: you are still here. Still trying. Still showing up for the life you\'ve been given. That is not nothing. It is the ground everything else grows from.',
  'The exhaustion you are carrying is real. It deserves to be named and addressed — not pushed through, not optimized around, not apologized for. You are allowed to be tired and to do something about it today.',
  'You do not have to justify the things that bring you joy. Joy is not a reward. It is a signal. When something consistently brings you joy, it is telling you something important about who you are. Listen to it today.',
  'There is no version of your life that requires you to be someone other than who you are. The pressure to be different, more, better — today, release it. The version of you that already exists is the one that is needed.',
  'Something you have been critical of yourself about deserves a different frame. Not denial — a different frame. What if it were happening for a reason? What if it were evidence of something other than what the inner critic says it means?',
  'You are in the middle of something. That is a real place to be — not a failure, not an arrival, just the middle. The middle has its own kind of dignity. You are allowed to inhabit it without apology.',
  'The people who matter most to you do not need you to be your best self today. They need you to be your real self. Real and present and honest. That version of you is already available. It is enough.',
  'Today\'s reminder is about the quality of your inner voice. Is it treating you the way you would treat a struggling friend — with patience, with acknowledgment, with genuine care? If not, today is a good day to practice a kinder register.',
  'When things are hard, the most generous thing you can do for yourself is to reduce the number of things you are asking of yourself. Not forever — just today. What can come off the list? What can wait? What is the actual minimum? Work from there.',
  'Your presence in the lives of the people you love is not a given. It requires care and attention and the kind of showing up that is only possible when you have also shown up for yourself. Today, both.',
  'The grief underneath the difficulty deserves acknowledgment. Not as a problem — as a real feeling in a real body responding to something that actually matters. Allow it to be what it is for a few minutes today without trying to fix it.',
  'Something about today is going to be okay. Not perfect, not easy, not everything you hoped — but okay. You have been okay before. You are more resilient than the anxious mind reminds you of. Today, let that be enough.',
  'You are not required to have everything sorted out. The sorted state is a temporary condition, not the natural one. The natural state includes ambiguity, unresolved things, questions without answers. That is not a crisis. That is life. You are in it. You are okay.',
  'Today, do one kind thing for your future self. Not a grand act — one small act of genuine care. Get to bed a little earlier. Eat something real. Send the message you\'ve been avoiding. The future version of you will be grateful.',
  'Where you currently are in your life is not where you will always be. That is a neutral fact. Today, let it be a comforting one: nothing is permanent. Including the difficulty. Including the stuck feeling. Including the distance between where you are and where you hope to arrive.',
  'You are under no obligation to perform well today. You are only obligated to show up honestly — to do what you can, from where you actually are, with what you actually have. Everything else is negotiable. Your honest presence is not.',
  'Something you have been ashamed of deserves your own compassion before you share it with anyone else. Turn toward it today with the gentleness you would extend to someone you loved. It responds to that. It always does.',
  'The version of you that exists when you are rested, connected, and genuinely cared for is the version everyone in your life most benefits from. Today, move toward the conditions that produce that version — not because you owe it to others, but because you deserve to inhabit that version of yourself.',
  'What your life looks like from the outside is not the whole picture. The inside — the effort, the private reckonings, the choices no one sees — is where most of the real life happens. Your chart today honors the inside story, the one only you carry. It matters.',
  'There is something in you today that is quietly okay — a steadiness underneath whatever is difficult. It may not be easy to access. But it is there. Today, try to locate it. Even a brief contact with it changes the quality of the whole day.',
  'The rest you most need today might not be physical. It might be emotional rest — a pause from the effort of managing your interior, a reprieve from the self-monitoring, a moment of simply existing without assessment. Give yourself that today, if only for ten minutes.',
  'Today\'s reminder is the simplest one: you are enough. Not because you have earned it, not because you have achieved it, not because someone has confirmed it. Just as a baseline fact about your existence. You are enough. Let that be true today.',
  'What would today look like if you moved through it with the assumption that you were fundamentally okay — that you were not behind, not broken, not failing at something essential? Move through it that way. Just for today. See what changes.',
  'Something you have been holding as evidence against yourself deserves to be examined more carefully. Is it actually what you think it is? Is the interpretation fixed, or could it be understood differently? Today, look at it again. More gently. More accurately.',
  'You are not the sum of your worst days or worst moments. You are also the sum of your best ones — the acts of courage, the moments of genuine care, the times you held together when it would have been easier not to. Hold that whole picture today.',
  'The kindness you need most today is not from anyone else. It is from yourself to yourself. Find one moment today to offer that — one moment of genuine self-compassion, offered not as performance but as true recognition of how hard this has been. You have been working hard. You deserve to know that.',
  'Today is a day for the simplest things. Nourishment, rest, one honest moment, one real connection. The elaborate is not required. The simple is always enough and often more. Let today be simple. Let that be enough.',
  'Your capacity to keep going when things are hard is not stubbornness. It is resilience. And resilience is not the absence of feeling — it is the ability to feel fully and keep moving anyway. You have been doing that. Today, honor what that costs and tend to yourself accordingly.',
  'The future you are moving toward is not guaranteed, but the direction you are moving in is real. Today, trust the direction. One step in the right direction, from where you actually are, is enough. That is always enough.',
  'Something in your life is genuinely working right now. Today, notice it. Let it be real. Let it count. The difficult things get named quickly. The working things need naming too — so you know what to protect, what to return to, what the foundation of your okay actually is.',
  'Today\'s reminder for the end of this season: you have been a kinder, more honest, more genuine version of yourself than this chapter asked for. The difficulty asked for survival. You offered growth. That is the version of you that moves into what comes next. Let it be proud of itself.',
  'Whatever this day holds, you will meet it as the person you have been becoming — more grounded, more honest, more genuinely present than the person who began this chapter. That is a gift you have given yourself, through all the ordinary difficult days. Meet today as that person.',
  'The final gentle reminder of this season: you are more okay than your fear tells you. More loved than your doubt believes. More capable than your exhaustion suggests. And more yourself — more genuinely, honestly yourself — than you have been in a long time. Go gently from here.',
  'Today you are allowed to simply be where you are — without analysis, without improvement, without striving toward anything. Just here. Just this. Just the ordinary miracle of being present to your actual life, exactly as it is right now. That is enough. It has always been enough.',
  'The small act of noticing something beautiful today — a sound, a light, a moment of connection — is not a distraction from the important things. It is one of the important things. Let yourself be touched by something small today.',
  'What you have been through this season is real. It counts. It belongs to your story. You do not have to minimize it, explain it, or justify it. You are allowed to say: that was hard. And I am still here. Both of those things are true.',
  'There is someone in your life who would be genuinely glad to know that you are okay. Today, let them know. Not because you owe it to them, but because connection is one of the things that makes difficulty bearable. Reach out. It matters.',
  'The closing reminder for this season is simply this: you did not give up. You stayed with it. You showed up, imperfectly and honestly, for the full arc of a difficult and growth-filled chapter. That is something to be genuinely proud of. Let yourself feel that today.',
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
  'What would I do today if I trusted that it was enough — that my presence, my small effort, my imperfect showing up was genuinely sufficient?',
  'What relationship in my life is asking for more honesty than I have been giving it? What is the honest thing I have been withholding?',
  'Where in my life am I spending energy maintaining a version of myself that I have already outgrown?',
  'What is one belief about what I deserve — in love, in work, in rest — that I would change if I could? Why haven\'t I changed it yet?',
  'What would it feel like to be fully rested? To have nothing unfinished, nothing deferred, nothing urgent? Describe that state in as much sensory detail as you can.',
  'What have I been most afraid to write honestly about in this journal? Write about it now.',
  'Who in my life makes me feel most like myself — and am I spending enough time with that person?',
  'What is one way I regularly abandon myself in relationships? What would it look like to stop that one time today?',
  'What am I most proud of from the last thirty days that I haven\'t acknowledged out loud or in writing?',
  'What is the difference between the life I am living and the life I most want to be living? How wide is that gap? What is inside that gap?',
  'What old version of myself am I still trying to protect that no longer needs protecting?',
  'If I could speak directly to the part of me that is most afraid right now, what would I say? What would that part need to hear?',
  'Where am I most alive in my daily life — the most engaged, most present, most genuinely interested? How could I get more of that?',
  'What am I carrying today that I do not have to carry alone? Who could I share it with? What stops me from sharing it?',
  'What is one thing I know I need to change that I keep finding reasons to defer? What is the real reason I keep deferring it?',
  'What does my body know right now that my mind has been overriding? If my body could speak directly, what would it say?',
  'What would be different about today if I moved through it with the assumption that I was someone who deserved good things?',
  'What conversation have I been rehearsing in my head that I need to actually have? What would it take to have it this week?',
  'What does my ideal relationship with rest look like? How far am I from it? What is one step toward it that I could actually take?',
  'Where in my life am I being genuinely, sustainably generous — and where is my generosity actually a form of control or avoidance?',
  'What is the thing I am most curious about right now — in my own psychology, in the world, in the people I love? Follow that thread for ten minutes.',
  'What have I been denying myself, either consciously or unconsciously, that my body and spirit are actually asking for?',
  'What has this season asked of me that I didn\'t know I had the capacity for? What did I find out I could do?',
  'Where is the gap between how I present myself to the world and who I actually am at home, in private, unobserved? What lives in that gap?',
  'What would I stop doing immediately if I no longer feared what other people would think? What does that tell me?',
  'What is the most important thing happening in my inner life right now that my outer life doesn\'t yet reflect?',
  'What do I know to be true about myself that I rarely say out loud? Write it. Own it. Let it be true here.',
  'What would the most honest letter to my future self say about this current moment in my life?',
  'What is one way I could honor myself today that would cost nothing and require only the decision to do it?',
  'What has grief, difficulty, or loss taught me that I could not have learned any other way?',
  'What part of me that I used to suppress or minimize am I starting to actually value?',
  'When I imagine the person I most want to become, what qualities do they have that I am currently afraid to embody?',
  'What would it mean to fully trust my own judgment — about myself, about others, about what I need? What stops me from that trust?',
  'If this chapter of my life ended today, what would I want the next one to begin with? What seed could I plant right now?',
  'What am I consistently doing for others that I have never thought to do for myself? What would it feel like to do one of those things for myself today?',
  'Where is the place in my life where I feel most free? What makes freedom possible there, and how could I bring that quality to another area of my life?',
  'What thought, belief, or story am I holding onto that, if I were brave enough to release it, would lighten everything?',
  'What do I want the people closest to me to know about me that I haven\'t yet told them?',
  'What would it feel like to fully inhabit my own life — to live it completely instead of observing it from the side?',
  'What is working in my life right now that I haven\'t taken a moment to appreciate? Write down three things that are genuinely working.',
  'What does my relationship with my own body tell me about my relationship with myself? What needs to shift there?',
  'If I could release one fear today — permanently, completely — which would I choose, and what would my life look like without it?',
  'What is the best evidence I have that I am genuinely growing? Not the evidence I perform for others — the private evidence I actually believe.',
  'Who needs to hear from me today? What is the thing I would say to them if I was acting from love rather than from self-protection?',
  'What is beneath the surface of a current frustration or difficulty — the real thing underneath the thing I keep talking about?',
  'What would it mean to be fully committed to my own wellbeing — not as a project, but as a quiet, daily, unapologetic priority?',
  'What is the kindest thing I could say to myself right now, in this moment, about exactly where I am?',
  'What is the quality of my presence in the moments that matter most? Am I actually there — in body and mind — for the things and people I say I care about most?',
  'What is the most alive I have felt in the last thirty days? What was happening? What made it possible? How do I create the conditions for more of it?',
  'Look back at the beginning of this year. What do you know now that you didn\'t know then? What has been the most important thing this period has taught you about yourself?',
  'What is the thing you have been most afraid to want? Write it plainly. Let it be true. It is allowed to be true.',
  'What does this season need from you — not what do you need to do, but what quality of presence, attention, or honesty does this moment require?',
  'What is one area of your life where you have been settling — not dramatically, but quietly, steadily — and what would it look like to stop settling there?',
  'What would your most honest, unedited journal entry say today? Write the version you wouldn\'t show anyone. Let it be real.',
  'What are you already okay — that right now, in this moment, you are fundamentally okay? Write that down and then write what it feels like to believe it, even briefly.',
  'What is the most important question in your life right now — the question underneath all the other questions? Let yourself sit with it without needing to answer it today.',
  'What is one way you could tell the truth more fully today — in how you present yourself, in how you speak about what matters to you, in how you ask for what you need?',
  'What has this season made possible that was not possible before — in you, in your relationships, in your understanding of your own life?',
  'What do you want? Plainly, honestly, without qualifications or apologies. Write a list of the things you actually want. Not what you think you should want. What you want.',
  'Today is the last entry in this chapter. What does this season mean to you? What did it require? What did it give? What are you carrying forward into what comes next? Write honestly. Write completely. Let it be the whole truth.',
  'What does courage look like in my life right now — not the dramatic kind, but the small daily kind? Where am I being brave in ways I don\'t acknowledge?',
  'What am I currently outsourcing to someone or something else that I actually need to own myself? Where have I been waiting for an external change to produce an internal shift?',
  'What does my relationship with time tell me about my relationship with myself? Am I always rushing, always saving, always managing? What would it mean to simply be in time?',
  'What would I write to myself a year from now, looking back at who I am today? What would I want my future self to know about this moment?',
  'What part of my experience am I currently labeling as a problem that might, from a wider view, be part of the solution?',
  'What is the most important lesson this season has taught me that I haven\'t yet put into practice?',
  'Where in my life am I still seeking external validation for something I already know to be true about myself?',
  'What relationship in my life has asked the most of me recently — and what has it revealed about my own edges, my own needs, my own capacity for love?',
  'If I could rewrite one belief I formed about myself before the age of fifteen, which would it be? And what would I write instead?',
  'What is the pattern I most want to break in the next chapter of my life? What would breaking it actually require of me?',
  'What does this day need from me — not what do I need to accomplish, but what quality of presence does this day ask for? Can I give it that?',
  'What has this season asked me to learn about receiving versus giving? Which is harder for me, and what does that difficulty tell me?',
  'What would my life look like if I stopped waiting for things to settle before I started living fully? What would I do differently today?',
  'At the end of this chapter, what do I know about myself that I didn\'t know at the beginning? Write it down. Mark it. Let it be yours.',
  'What does it mean to live with integrity in the smallest moments — the private moments, the unobserved choices, the daily practice of being true to yourself when no one is watching?',
  'What is the next brave thing — the specific, concrete, not-too-big-and-not-too-small brave thing that this season has prepared you to do? Name it. And then name the first step.',
  'Close this chapter with one complete truth: what has it actually been like to do this inner work, day after day, honestly and imperfectly? What does it feel like to be the person who chose to do this? Write that. Let it be the last thing you say before the next chapter begins.',
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

    // Prune entries older than SEED_DAYS to keep the demo data window fixed
    const cutoff = isoDate(daysBefore(SEED_DAYS));
    const db = await localDb.getDb();
    await db.runAsync('DELETE FROM journal_entries WHERE date < ?', [cutoff]);
    await db.runAsync('DELETE FROM sleep_entries WHERE date < ?', [cutoff]);
    await db.runAsync('DELETE FROM daily_check_ins WHERE date < ?', [cutoff]);
    await db.runAsync('DELETE FROM insight_history WHERE date < ?', [cutoff]);

    // Cloud top-up
    await DemoSeedService._seedSupabaseDay(missing, chartId);
    await AsyncStorage.setItem(DAILY_SEED_KEY, today);
  },

  /**
   * Seeds one day's full data: journal + sleep + 2 check-ins + insight.
   */
  async _seedDay(dateStr: string, d: Date, chartId: string, idx: number): Promise<void> {
    const N_JOURNAL = journalTitles.length;   // 91
    const N_DREAM   = dreamTexts.length;      // 91
    const N_INSIGHT = insightGreetings.length; // 91

    // Decouple content indexes so journal/dream/insight don't cycle together
    const iJ = idx % N_JOURNAL;              // journal index
    const iD = (idx * 3 + 5) % N_DREAM;     // dream index — different stride
    const iI = (idx * 5 + 2) % N_INSIGHT;   // insight index

    const jTs = new Date(d.getTime() + 20 * 60 * 60 * 1000).toISOString();
    const sTs = new Date(d.getTime() +  8 * 60 * 60 * 1000).toISOString();
    const iTs = new Date(d.getTime() +  7 * 60 * 60 * 1000).toISOString();

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

    // Journal
    await localDb.saveJournalEntry({
      id: `demo-journal-${dateStr}`, date: dateStr,
      mood: MOODS[idx % MOODS.length],
      moonPhase: SIMPLE_PHASES[idx % SIMPLE_PHASES.length],
      title:   journalTitles[iJ],
      content: journalContents[iJ],
      chartId,
      tags: [(['gratitude','growth','clarity','boundaries','rest','reflection','awareness','healing'] as const)[idx % 8]],
      contentWordCount: journalContents[iJ].split(' ').length,
      contentReadingMinutes: 1,
      createdAt: jTs, updatedAt: jTs, isDeleted: false,
    });

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

    // Insight
    await localDb.saveInsight({
      id: `demo-insight-${dateStr}`, date: dateStr, chartId,
      greeting:      insightGreetings[iI],
      loveHeadline:  loveHeadlines[iI],
      loveMessage:   loveMessages[iI],
      energyHeadline: energyHeadlines[iI],
      energyMessage:  energyMessages[iI],
      growthHeadline: growthHeadlines[iI],
      growthMessage:  growthMessages[iI],
      gentleReminder: gentleReminders[iI % gentleReminders.length],
      journalPrompt:  journalPrompts[iI % journalPrompts.length],
      moonSign:  MOON_SIGNS[idx % 12],
      moonPhase: LUNAR_PHASES[idx % LUNAR_PHASES.length],
      isFavorite: idx % 7 === 0,
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
    // Clear old demo seed entries to prevent duplicates from previous seed versions
    const db = await localDb.getDb();
    await db.runAsync("DELETE FROM journal_entries WHERE id LIKE 'demo-%'");
    await db.runAsync("DELETE FROM sleep_entries WHERE id LIKE 'demo-%'");
    await db.runAsync("DELETE FROM daily_check_ins WHERE id LIKE 'demo-%'");
    await db.runAsync("DELETE FROM insight_history WHERE id LIKE 'demo-%'");

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

    // ── 91 days (~3 months) of historical entries ───────────────────────────
    for (let i = 0; i < SEED_DAYS; i++) {
      const d = daysBefore(SEED_DAYS - 1 - i);
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

    // Daily reflections
    const reflectionAnswers: object[] = [];
    const AGREEMENT = ['Not True','Somewhat True','True','Very True'];
    const FREQUENCY = ['Not at All','Some of the Time','Almost Always','Always'];
    for (let i = 0; i < SEED_DAYS; i++) {
      const d = daysBefore(SEED_DAYS - 1 - i);
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
