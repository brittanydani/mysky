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
const SEED_FLAG_KEY = '@mysky:demo_seeded_v7';
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
const SEED_DAYS = 91; // ~3 months of history
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
];

const loveHeadlines = ['The intimacy you\'ve been protecting yourself from','What your nervous system does before your heart decides','Receiving without shrinking','The love that requires you to stay','Honesty as the deepest act of care','What you learned love was — and what it actually is','Desire and the fear of wanting too much','Vulnerability is the point, not the risk','Presence as the rarest gift you can offer','The pattern that ends when you name it','The longing beneath the longing','Closeness that doesn\'t ask you to disappear','What needs repair before it can renew','Being known without editing yourself first','The part of you that learned love had conditions','When closeness feels safer with distance still in it','How you love when you\'re afraid','The gift of repair','What intimacy is asking of you now','The love you haven\'t let yourself receive fully','Trust that was broken and is slowly rebuilding','Being seen clearly and staying anyway','What love looks like when the performance stops','The deeper yes beneath the surface yes','What becomes possible when you stop bracing','When proximity feels dangerous and why','The boundary that was actually a wall','Choosing vulnerable over polished','How to want without grasping','The version of love that doesn\'t require you to disappear','What asking for what you need actually feels like','When the old pattern shows up in new relationships','The thing underneath the argument','Softness as an act of courage','Learning to stay when your impulse is to withdraw','What it means to be loved for what you\'ve hidden','The long repair','When your past speaks through your present relationship','Love as a daily practice, not a destination','The specific grief of loving from a distance','Letting someone in, slowly','Connection that survives honesty','The fear of needing someone','Recognizing the people who make you feel safe to be small','The shape of care you were never given and are learning to give','What loyalty means to you now','The old wound and the new relationship','Curiosity as a form of love','Letting yourself need','How you receive care when it\'s freely given','Tenderness toward yourself first','Attachment without losing yourself','What fighting for connection actually looks like','Discernment over pattern-matching','Softening without dissolving','The love that shows up in ordinary moments','When someone stays','Being honest about your capacity today','The repair that requires two people who want to try','What you\'d say if you trusted the aftermath','Love that grounds rather than destabilizes','The beauty of being known','The weight of unexpressed affection','Closeness as a risk worth choosing','Intimacy that requires nothing be hidden','When you stop performing for the people who already see you','The love that began with an honest conversation','Learning to ask','What you deserve in love — stated clearly','How your body responds to safety','When closeness feels earned','Loving without managing the other person\'s feelings','The specific courage of ongoing presence','The difference between closeness and merging','What love has taught you that you didn\'t expect','Letting the right people witness you','When love becomes a mirror','The care inside the conflict','What you would give someone you loved — given to yourself','The invitation inside vulnerability','What is actually solid, when you look clearly','Receiving love as fully as you give it','The version of you who lets love land','What it costs to stay closed','Today\'s invitation: let one real thing be said','The love that is patient with your becoming','Trust as something rebuilt in small increments','Belonging that doesn\'t require a performance'];
const energyHeadlines = ['Precision over volume','The kind of momentum that actually lasts','Where your energy is leaking — and how to reclaim it','Your body is the primary instrument','The productivity hiding inside stillness','Rest that is not avoidance','Building at the level of foundation, not facade','The creative state you can\'t force — only invite','Sustainable effort as a spiritual practice','Getting back into your rhythm after you\'ve lost it','What it means to be focused and fully present at once','Energy is information — what is yours saying?','Discernment: the discipline of doing less, better','What becomes possible when you stop managing and start moving','The slow kind of progress that actually holds','Coming back to your body after being in your head','The effort you don\'t have to explain to anyone','Listening to what depletes before it becomes depletion','The morning ritual that anchors the rest','Building a container before filling it','What the tired body is actually asking for','The kind of energy that doesn\'t consume itself','Permission to go at half-speed and still arrive','Output that flows from capacity, not anxiety','The difference between busy and purposeful','How you recover when you\'ve pushed too hard','When stillness is a form of power','The creative discipline hiding inside structure','What alignment feels like in the body','Pacing yourself as an act of self-respect','Your nervous system as the primary gauge','The energy audit: where does it go?','Momentum without force','Deep work in a distracted world','The value of incomplete days honestly assessed','What renewal looks like in this season of your life','Protecting your capacity as a daily practice','How flow states come — and why forcing blocks them','What it means to work with your natural rhythms','The kind of rest that actually restores you','Doing less, more fully','The investment of energy in your own becoming','When the body asks to slow down and the mind resists','Recovery as a strategy, not a weakness','Your best work arrives after your real rest','Energy as a craft to be tended','The productivity of patience','The task that matters underneath the list','What the body needs before the mind can function','Clearing before creating','Anchoring into what restores you','The sustainable output model','When the pace is honest, the work is better','Deep energy versus surface stimulation','How rest compounds over time','The creative replenishment that looks like doing nothing','What is under the fatigue that isn\'t tiredness','The habit that makes everything else easier','Moving with the day\'s natural energy instead of against it','Your body knows before your calendar does','The kind of aliveness that comes from real rest','Matching your effort to what the moment actually requires','What real focus feels like versus what it\'s performed as','Building a relationship with your body\'s rhythms','Motion that moves from the center outward','When you conserve, you can give fully when it matters','The clarity that comes after you\'ve stopped pushing','Making something with what you actually have today','What your afternoon energy is trying to tell you','Working at your natural pace as a spiritual act','The energy that comes when you stop overriding the signals','Integration as part of the productive day','Respecting the ultradian rhythm: rest and focus in cycles','Your best creative state requires your honest current state','The signal in the second wind','Stillness as the space between the notes','Trusting a slower day to hold value','What output looks like when it\'s rooted','The productive day that begins with one honest question','Momentum builds where attention flows without pressure','Energy management as a form of integrity','The alignment between your inner state and your outer effort','Effortless action built on genuine inner quietude'];
const growthHeadlines = ['The lesson is in the repetition, not despite it','Growth is not always forward — sometimes it\'s release','The identity that served you then is limiting you now','What this moment is asking you to see about yourself','Courage rarely announces itself before it\'s needed','You are not the same person who started this journey','Unlearning is the hardest and most necessary work','The discomfort is not a signal to stop — it\'s the signal you\'re close','What becomes visible when the noise quiets','You are in the long arc — and the long arc is bending','The process does not need your trust to be working','This season is not wasting your time — it\'s building your character','Expansion that is rooted does not sweep you away','The version of you arriving has been prepared by everything you\'ve survived','What you resist knowing about yourself is what you most need to understand','The thing you keep returning to is not a weakness — it\'s a thread','Slow change is still change','What the same story, repeated, is asking you to examine','The protective function of the thing you can\'t seem to let go of','Growth that happens underground before it shows above ground','Who you are becoming through this difficulty','The false self you\'ve outgrown','What fear loses when you stop obeying it','Sitting with what isn\'t resolved — and not rushing it','Recognizing the pattern at the moment of activation','When growth feels like grief','What your current edge is asking of you','The belief underneath the behavior','Releasing the self-concept that no longer fits','Integration as the less glamorous half of growth','When you acted from your old self and noticed afterward','The wisdom inside your difficulty','What your reaction reveals about your unhealed edge','The part of you that already knows what to do','How courage shows up when you\'re exhausted','The growth in the pause before the old response','What the fear of change is actually protecting','Making peace with your own imperfect progress','The long game of becoming who you actually are','What you\'re no longer willing to tolerate','The gift disguised as the thing you didn\'t want','Resilience as the quiet accumulation of kept promises to yourself','What I\'m learning about myself right now','The version of success that fits your actual life','Naming what you outgrew','When the limit becomes a doorway','The insight that was always there, waiting for you to be ready','What breaks open, grows','Sitting with the unknown as an act of maturity','The difference between who you were and who you\'re becoming — becoming visible','What you can hold now that you couldn\'t before','Turning toward your inner life as a consistent practice','Growing in the direction of your deepest knowing','The courage of setting down what no longer serves','What you\'ve learned about yourself this year','The identity you\'re ready to update','Growth requires that you become someone who can receive what you\'re asking for','The expansion available on the other side of this fear','What the wrong path taught you that the right one couldn\'t have','The discipline of returning to yourself when you drift','What self-awareness at its most honest looks like','Integration: the unglamorous work of making change real','The version of strength that includes vulnerability','Building emotional fluency as a lifelong practice','When you catch yourself mid-pattern — that\'s the growth','The story you\'ve been telling yourself that isn\'t true anymore','What real acceptance of yourself feels like, moment to moment','The slow miracle of consistent small change','Holding paradox: you are both enough and still becoming more','The edge between who you\'ve been and who you\'re willing to be','What your younger self needed and how you can offer that now','The courage of honest self-assessment without attack','Learning to act from fullness rather than from lack','Trusting the growth you can\'t yet see','What you have already become that you haven\'t yet acknowledged','A new chapter does not require you to justify why the old one ended','Becoming someone who can receive as openly as they give','Your growth is not linear — and that is completely fine','The version of you that exists when you stop performing','Claiming what you\'ve learned from the hardest parts','What you\'re ready for that you keep thinking you\'re not','The specific change that requires your exact kind of bravery','Arriving at a new version of yourself with gratitude for the journey'];

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
      id: uid(), date: dateStr,
      mood: MOODS[idx % MOODS.length],
      moonPhase: LUNAR_PHASES[idx % LUNAR_PHASES.length],
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
      id: uid(), chartId, date: dateStr,
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
        id: uid(), date: dateStr, chartId,
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
      id: uid(), date: dateStr, chartId,
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
