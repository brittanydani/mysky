// services/astrology/advancedLayers.ts
// Advanced natal chart layers: sect, decans, critical degrees, fixed stars,
// Sabian symbols, Arabic lots, and midpoints.

import { NatalChart, PlanetPlacement } from './types';

// ── Helpers ─────────────────────────────────────────────────────────

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function signFromLongitude(lon: number): string {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  return signs[Math.floor(normalize360(lon) / 30)];
}

function angularDifference(a: number, b: number): number {
  let diff = Math.abs(normalize360(a) - normalize360(b));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function getCorePlanets(chart: NatalChart): PlanetPlacement[] {
  return [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);
}

// ── 1. Sect Analysis ────────────────────────────────────────────────
// Day vs night chart, planetary sect (diurnal/nocturnal), combustion, cazimi.

export interface SectAnalysis {
  isDayChart: boolean;
  sect: 'diurnal' | 'nocturnal';
  sectLight: string;            // Sun (day) or Moon (night) — the sect luminary
  beneficInSect: string;        // Jupiter (day) or Venus (night)
  maleficInSect: string;        // Saturn (day) or Mars (night)
  beneficOutOfSect: string;
  maleficOutOfSect: string;
  combustPlanets: CombustionInfo[];
  description: string;
}

export interface CombustionInfo {
  planet: string;
  distanceFromSun: number;      // degrees
  status: 'cazimi' | 'combust' | 'under-the-beams' | 'free';
  description: string;
}

export function analyzeSect(chart: NatalChart): SectAnalysis | null {
  if (!chart.ascendant) return null; // needs time-based features

  const sunHouse = chart.sun.house;
  // Sun above horizon (houses 7–12) = day chart
  const isDayChart = sunHouse >= 7 && sunHouse <= 12;
  const sect = isDayChart ? 'diurnal' : 'nocturnal';

  // Traditional sect assignments
  const sectLight = isDayChart ? 'Sun' : 'Moon';
  const beneficInSect = isDayChart ? 'Jupiter' : 'Venus';
  const maleficInSect = isDayChart ? 'Saturn' : 'Mars';
  const beneficOutOfSect = isDayChart ? 'Venus' : 'Jupiter';
  const maleficOutOfSect = isDayChart ? 'Mars' : 'Saturn';

  // Combustion analysis — proximity to the Sun
  const sunLon = chart.sun.longitude;
  const combustible = [
    chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);

  const combustPlanets: CombustionInfo[] = combustible.map(p => {
    const dist = angularDifference(p.longitude, sunLon);
    let status: CombustionInfo['status'];
    let description: string;

    if (dist <= 0.2833) {
      // Within 17 arc-minutes — cazimi (in the heart of the Sun)
      status = 'cazimi';
      description = `${p.planet.name} is cazimi — in the heart of the Sun. This is a position of extraordinary power and focus, as though the planet receives the Sun's full blessing. ${p.planet.name} themes operate with unusual clarity and authority.`;
    } else if (dist <= 8.5) {
      // Within 8.5° — combust
      status = 'combust';
      description = `${p.planet.name} is combust — hidden in the Sun's glare at ${dist.toFixed(1)}° away. Its expression may feel obscured or internalized. You may struggle to access ${p.planet.name} themes directly, or others may not see them clearly. With awareness, combustion can produce concentrated intensity.`;
    } else if (dist <= 17) {
      // Within 17° — under the beams
      status = 'under-the-beams';
      description = `${p.planet.name} is under the beams — close enough to the Sun (${dist.toFixed(1)}°) to be somewhat overshadowed. Its expression is present but muted, emerging more fully as you mature.`;
    } else {
      status = 'free';
      description = '';
    }

    return { planet: p.planet.name, distanceFromSun: Number(dist.toFixed(2)), status, description };
  });

  const activeCombustions = combustPlanets.filter(c => c.status !== 'free');

  let description = `This is a ${sect} (${isDayChart ? 'day' : 'night'}) chart. `;
  description += `The sect luminary is the ${sectLight}, meaning ${isDayChart ? 'solar themes of identity, visibility, and purposeful action' : 'lunar themes of emotional sensitivity, receptivity, and inner knowing'} carry extra weight. `;
  description += `${beneficInSect} is the benefic in sect — its gifts flow more easily. ${maleficInSect} is the malefic in sect — its challenges are more manageable. `;
  description += `${beneficOutOfSect} and ${maleficOutOfSect} operate somewhat against the grain.`;

  if (activeCombustions.length > 0) {
    const cazimiPlanets = activeCombustions.filter(c => c.status === 'cazimi');
    const combustOnly = activeCombustions.filter(c => c.status === 'combust');
    if (cazimiPlanets.length > 0) {
      description += ` ${cazimiPlanets.map(c => c.planet).join(' and ')} ${cazimiPlanets.length === 1 ? 'is' : 'are'} cazimi — an exceptionally potent placement.`;
    }
    if (combustOnly.length > 0) {
      description += ` ${combustOnly.map(c => c.planet).join(', ')} ${combustOnly.length === 1 ? 'is' : 'are'} combust — hidden in the Sun's light.`;
    }
  }

  return {
    isDayChart, sect, sectLight,
    beneficInSect, maleficInSect, beneficOutOfSect, maleficOutOfSect,
    combustPlanets, description,
  };
}

// ── 2. Decan Analysis ───────────────────────────────────────────────
// Each 30° sign is split into three 10° decans with traditional subrulers.

export interface DecanInfo {
  planet: string;
  sign: string;
  degree: number;
  decan: 1 | 2 | 3;
  decanRuler: string;
  decanSign: string;          // sign associated with this decan
  description: string;
}

// Traditional (Chaldean) decan rulers: each sign's 3 decans ruled by
// the planets in the order of the Chaldean sequence, starting from the sign's ruler.
const DECAN_RULERS: Record<string, [string, string, string]> = {
  Aries:       ['Mars', 'Sun', 'Jupiter'],
  Taurus:      ['Venus', 'Mercury', 'Saturn'],
  Gemini:      ['Mercury', 'Venus', 'Uranus'],
  Cancer:      ['Moon', 'Pluto', 'Neptune'],
  Leo:         ['Sun', 'Jupiter', 'Mars'],
  Virgo:       ['Mercury', 'Saturn', 'Venus'],
  Libra:       ['Venus', 'Uranus', 'Mercury'],
  Scorpio:     ['Pluto', 'Neptune', 'Moon'],
  Sagittarius: ['Jupiter', 'Mars', 'Sun'],
  Capricorn:   ['Saturn', 'Venus', 'Mercury'],
  Aquarius:    ['Uranus', 'Mercury', 'Venus'],
  Pisces:      ['Neptune', 'Moon', 'Pluto'],
};

// Decan sub-signs (triplicity-based): each decan maps to a sign of the same element
const DECAN_SIGNS: Record<string, [string, string, string]> = {
  Aries:       ['Aries', 'Leo', 'Sagittarius'],
  Taurus:      ['Taurus', 'Virgo', 'Capricorn'],
  Gemini:      ['Gemini', 'Libra', 'Aquarius'],
  Cancer:      ['Cancer', 'Scorpio', 'Pisces'],
  Leo:         ['Leo', 'Sagittarius', 'Aries'],
  Virgo:       ['Virgo', 'Capricorn', 'Taurus'],
  Libra:       ['Libra', 'Aquarius', 'Gemini'],
  Scorpio:     ['Scorpio', 'Pisces', 'Cancer'],
  Sagittarius: ['Sagittarius', 'Aries', 'Leo'],
  Capricorn:   ['Capricorn', 'Taurus', 'Virgo'],
  Aquarius:    ['Aquarius', 'Gemini', 'Libra'],
  Pisces:      ['Pisces', 'Cancer', 'Scorpio'],
};

function getDecanIndex(degree: number): 0 | 1 | 2 {
  if (degree < 10) return 0;
  if (degree < 20) return 1;
  return 2;
}

export function analyzeDecans(chart: NatalChart): DecanInfo[] {
  const planets = getCorePlanets(chart);
  return planets.map(p => {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign.name;
    const idx = getDecanIndex(p.degree);
    const rulers = DECAN_RULERS[signName] ?? ['', '', ''];
    const signs = DECAN_SIGNS[signName] ?? ['', '', ''];
    const decanRuler = rulers[idx];
    const decanSign = signs[idx];
    const decan = (idx + 1) as 1 | 2 | 3;

    return {
      planet: p.planet.name,
      sign: signName,
      degree: p.degree,
      decan,
      decanRuler,
      decanSign,
      description: `${p.planet.name} is in the ${decan === 1 ? 'first' : decan === 2 ? 'second' : 'third'} decan of ${signName} (${decanSign} sub-influence, ruled by ${decanRuler}). This adds a layer of ${decanSign} flavor to how ${p.planet.name} expresses itself.`,
    };
  });
}

// ── 3. Critical Degrees & Anaretic Degree ───────────────────────────

export interface CriticalDegreeInfo {
  planet: string;
  sign: string;
  degree: number;
  minute: number;
  type: 'critical' | 'anaretic' | 'zero-degree';
  description: string;
}

const CRITICAL_CARDINAL = [0, 13, 26];  // Aries, Cancer, Libra, Capricorn
const CRITICAL_FIXED = [8, 9, 21, 22];  // Taurus, Leo, Scorpio, Aquarius
const CRITICAL_MUTABLE = [4, 17];       // Gemini, Virgo, Sagittarius, Pisces

function isCriticalDegree(degree: number, modality: string): boolean {
  if (modality === 'Cardinal') return CRITICAL_CARDINAL.includes(degree);
  if (modality === 'Fixed') return CRITICAL_FIXED.includes(degree);
  if (modality === 'Mutable') return CRITICAL_MUTABLE.includes(degree);
  return false;
}

export function detectCriticalDegrees(chart: NatalChart): CriticalDegreeInfo[] {
  const planets = getCorePlanets(chart);
  const results: CriticalDegreeInfo[] = [];

  for (const p of planets) {
    const signObj = typeof p.sign === 'object' ? p.sign : null;
    const signName = signObj ? signObj.name : String(p.sign);
    const modality = signObj?.modality ?? '';

    // Anaretic degree (29°)
    if (p.degree === 29) {
      results.push({
        planet: p.planet.name, sign: signName, degree: p.degree, minute: p.minute,
        type: 'anaretic',
        description: `${p.planet.name} at 29° ${signName} is at the anaretic degree — the final degree of a sign. This placement carries a sense of urgency, completion, or karmic weight. There can be a feeling of having mastered or exhausted the sign's lessons, creating pressure to move forward.`,
      });
    }
    // Zero degree — beginning of a new sign
    else if (p.degree === 0 && p.minute <= 30) {
      results.push({
        planet: p.planet.name, sign: signName, degree: p.degree, minute: p.minute,
        type: 'zero-degree',
        description: `${p.planet.name} at 0° ${signName} sits at the very beginning of the sign — a fresh, potent expression. This placement can feel like a new start or intense concentration of the sign's purest qualities.`,
      });
    }
    // Standard critical degrees
    else if (modality && isCriticalDegree(p.degree, modality)) {
      results.push({
        planet: p.planet.name, sign: signName, degree: p.degree, minute: p.minute,
        type: 'critical',
        description: `${p.planet.name} at ${p.degree}° ${signName} sits at a critical degree. Planets at critical degrees operate with heightened intensity — they tend to be more noticeable in the life, for better or worse, demanding attention and conscious engagement.`,
      });
    }
  }

  return results;
}

// ── 4. Fixed Star Conjunctions ──────────────────────────────────────
// Major fixed stars with J2000.0 ecliptic longitudes.
// Precession-corrected for ~2025 epoch (approximate +50.3"/year from J2000).

export interface FixedStarConjunction {
  planet: string;
  star: string;
  starLongitude: number;
  orb: number;
  nature: string;
  description: string;
}

interface FixedStarEntry {
  name: string;
  longitude: number;   // ecliptic longitude (epoch ~2025)
  nature: string;       // traditional planetary nature
  keywords: string;
}

// 15 traditionally important fixed stars, precessed to ~2025
const FIXED_STARS: FixedStarEntry[] = [
  { name: 'Algol',       longitude: 26.52,   nature: 'Saturn-Jupiter', keywords: 'intensity, raw power, facing shadow, transformation through confrontation' },
  { name: 'Alcyone',     longitude: 30.42,   nature: 'Moon-Jupiter', keywords: 'vision, mysticism, collective grief and wisdom, inner sight' },
  { name: 'Aldebaran',   longitude: 70.20,   nature: 'Mars', keywords: 'integrity, honor, leadership, moral courage, guardian energy' },
  { name: 'Rigel',       longitude: 77.17,   nature: 'Jupiter-Saturn', keywords: 'ambition, teaching, bringing knowledge to structure, benevolent authority' },
  { name: 'Sirius',      longitude: 104.38,  nature: 'Jupiter-Mars', keywords: 'brilliance, devotion, scorching intensity, fame or notoriety, spiritual fire' },
  { name: 'Castor',      longitude: 110.53,  nature: 'Mercury', keywords: 'mental sharpness, duality, writing, creative intelligence' },
  { name: 'Pollux',      longitude: 113.55,  nature: 'Mars', keywords: 'bold action, spirited courage, athleticism, audacity' },
  { name: 'Regulus',     longitude: 150.18,  nature: 'Jupiter-Mars', keywords: 'royalty, success, recognition, heart-centered leadership, pride' },
  { name: 'Zosma',       longitude: 161.60,  nature: 'Saturn-Venus', keywords: 'suffering that leads to compassion, service through personal trial' },
  { name: 'Spica',       longitude: 204.17,  nature: 'Venus-Mars', keywords: 'gifts, talent, harvest, brilliance, potential for great achievement' },
  { name: 'Arcturus',    longitude: 204.57,  nature: 'Jupiter-Mars', keywords: 'pathfinding, independence, taking a different road, trailblazing' },
  { name: 'Antares',     longitude: 250.18,  nature: 'Mars-Jupiter', keywords: 'intensity, obsession, passion, willpower, the heart of the scorpion' },
  { name: 'Vega',        longitude: 285.57,  nature: 'Venus-Mercury', keywords: 'charisma, artistic talent, magic, enchantment, idealism' },
  { name: 'Altair',      longitude: 302.13,  nature: 'Mars-Jupiter', keywords: 'boldness, daring, confidence, swift decisive action' },
  { name: 'Fomalhaut',   longitude: 334.27,  nature: 'Venus-Mercury', keywords: 'idealism, magic, mystical dreams, fame through integrity, protection' },
];

const FIXED_STAR_ORB = 1.5; // degrees

export function detectFixedStarConjunctions(chart: NatalChart): FixedStarConjunction[] {
  const planets = getCorePlanets(chart);
  // Also check angles
  const points: { name: string; longitude: number }[] = planets.map(p => ({
    name: p.planet.name, longitude: p.longitude,
  }));
  if (chart.ascendant) points.push({ name: 'Ascendant', longitude: chart.ascendant.longitude });
  if (chart.midheaven) points.push({ name: 'Midheaven', longitude: chart.midheaven.longitude });

  const results: FixedStarConjunction[] = [];

  for (const point of points) {
    for (const star of FIXED_STARS) {
      const orb = angularDifference(point.longitude, star.longitude);
      if (orb <= FIXED_STAR_ORB) {
        results.push({
          planet: point.name,
          star: star.name,
          starLongitude: star.longitude,
          orb: Number(orb.toFixed(2)),
          nature: star.nature,
          description: `${point.name} conjunct ${star.name} (${orb.toFixed(1)}° orb) — ${star.keywords}. This fixed star connection amplifies ${point.name} with ancient stellar influence, adding a layer of intensity and distinction to its expression.`,
        });
      }
    }
  }

  results.sort((a, b) => a.orb - b.orb);
  return results;
}

// ── 5. Sabian Symbols ───────────────────────────────────────────────
// The Sabian symbols assign a poetic image to each of the 360 degrees.
// The degree used is the next whole degree (e.g., 0°00'–0°59' → degree 1).

export interface SabianSymbolInfo {
  planet: string;
  sign: string;
  sabianDegree: number;      // 1–30 (Sabian convention)
  symbol: string;
}

// Sabian symbols per sign (indices 0–29 → degrees 1–30)
const SABIAN_ARIES = [
  'A woman rises from the sea; a seal embraces her',
  'A comedian entertaining a group',
  'A cameo profile of a man in the outline of his country',
  'Two lovers strolling through a secluded walk',
  'A triangle with wings',
  'A square brightly lighted on one side',
  'A man succeeds in expressing himself in two realms at once',
  'A large hat with streamers flying, facing east',
  'A crystal gazer',
  'A teacher gives new symbolic forms to traditional images',
  'The ruler of a nation',
  'A flock of wild geese',
  'An unexploded bomb reveals an unsuccessful social protest',
  'A serpent coiling near a man and a woman',
  'An Indian weaving a blanket',
  'Brownies dancing in the setting sun',
  'Two prim spinsters',
  'An empty hammock',
  'The magic carpet',
  'A young girl feeding birds in winter',
  'A pugilist entering the ring',
  'The gate to the garden of all fulfilled desires',
  'A pregnant woman in light summer dress',
  'An open window and a net curtain blowing into a cornucopia',
  'A double promise reveals its inner and outer meanings',
  'A man possessed of more gifts than he can hold',
  'Through imagination, a lost opportunity is regained',
  'A large disappointed audience',
  'A celestial choir singing',
  'A duck pond and its brood',
];

// For brevity, provide a representative sample; full 360 symbols follow the same pattern.
// The engine returns the symbol text for degree lookup.

const SABIAN_SYMBOLS: Record<string, string[]> = {
  Aries: SABIAN_ARIES,
  Taurus: [
    'A clear mountain stream', 'An electrical storm', 'Natural steps up to a lawn of clover in bloom',
    'The rainbow\'s pot of gold', 'A youthful widow, fresh and soul-cleansed, kneels at a grave',
    'A bridge being built across a gorge', 'The woman of Samaria', 'A sleigh without snow',
    'A Christmas tree decorated', 'A Red Cross nurse', 'A woman sprinkling flowers',
    'A young couple walk down main street, window-shopping', 'A man handling baggage',
    'On the beach, children play while shellfish grope at the edge of the water',
    'A man with a silk hat, muffled against the cold, braves a storm',
    'An old teacher fails to interest pupils in traditional knowledge',
    'A symbolic battle between swords and torches', 'A woman airing an old bag through an open window',
    'A newly formed continent', 'Wind clouds and haste',
    'A finger pointing in an open book', 'White dove over troubled waters',
    'A jewelry shop', 'An Indian warrior riding fiercely, human scalps at his belt',
    'A vast public park', 'A Spanish gallant', 'An old Indian woman selling beads',
    'A woman in middle life stands in rapt sudden realization of forgotten charms, a spiritual awakening',
    'Two cobblers working at a table', 'A peacock parading on an ancient lawn',
  ],
  Gemini: [
    'A glass-bottomed boat', 'Santa Claus filling stockings furtively', 'The garden of the Tuileries',
    'Holly and mistletoe', 'A radical magazine', 'Drilling for oil', 'An old-fashioned well',
    'Industrial strikes', 'A quiver filled with arrows', 'An airplane falling',
    'A newly opened lands offer virgin realms of experience', 'A Black slave girl demands her rights',
    'A great musician at his piano', 'A conversation by telepathy', 'Two Dutch children talking',
    'A woman activist in an emotional plea for social justice',
    'The head of a youth changes into that of a mature thinker',
    'Two Chinese men talking Chinese', 'A large archaic volume', 'A cafeteria',
    'A labor demonstration', 'Dancing couples in a harvest festival',
    'Three fledglings in a nest high in a tree', 'Children skating on ice',
    'A man trimming palms', 'Frost-covered trees against winter skies',
    'A gypsy coming out of the forest', 'Society granting bankruptcy',
    'The first mockingbird in spring', 'A parade of bathing beauties before large beach crowds',
  ],
  Cancer: [
    'On a ship, sailors lower a flag, replacing it with a new one', 'A man suspended over a vast level place',
    'A man all bundled up in fur, leading a shaggy deer', 'A cat arguing with a mouse',
    'At a railroad crossing, an automobile is wrecked by a train',
    'Game birds feathering their nests', 'Two fairies on a moonlit night',
    'Rabbits dressed in clothes and on parade', 'A tiny nude miss reaching in the water for a fish',
    'A large diamond not completely cut', 'A clown making grimaces',
    'A Chinese woman nursing a baby with a message', 'One hand slightly flexed with a very prominent thumb',
    'A very old man facing a vast dark space to the north east', 'A group of people who have overeaten and enjoyed it',
    'A man before a square with a manuscript scroll before him',
    'The germ grows into knowledge and life', 'A hen scratching for her chicks',
    'A priest performing a marriage ceremony', 'Venetian gondoliers in a serenade',
    'A prima donna singing', 'A woman and two men castaways on a small island',
    'Meeting of a literary society', 'A woman and two men on a bit of sunlit land facing south',
    'A man wrapped in an invisible mantle of power', 'Guests reading in the library of a luxurious home',
    'A violent storm in a canyon filled with expensive homes', 'A modern Pocahontas',
    'A Muse weighing twins in golden scales', 'A daughter of the American Revolution',
  ],
  Leo: [
    'A case of apoplexy', 'An epidemic of mumps', 'A woman having her hair bobbed',
    'A man formally dressed and a deer with its horns folded',
    'Rock formations at the edge of a precipice', 'An old-fashioned woman and a flapper',
    'The constellations in the sky', 'A Bolshevik propagandist', 'Glass blowers',
    'Early morning dew sparkles as sunlight floods the field', 'Children on a swing in a huge oak tree',
    'An evening lawn party', 'An old sea captain rocking', 'A human soul seeking opportunities for outward expression',
    'A pageant', 'Brilliant sunshine after a storm', 'A volunteer church choir makes a social event of rehearsal',
    'A teacher of chemistry', 'A houseboat party', 'The Zuni sun worshippers',
    'Chickens intoxicated', 'A carrier pigeon', 'A bareback rider',
    'Totally concentrated upon inner spiritual attainment, a man sits in a state of complete neglect of bodily appearance',
    'A large camel crossing a vast and forbidding desert', 'A rainbow',
    'Daybreak', 'Many little birds on the limb of a large tree', 'A mermaid',
    'An unsealed letter',
  ],
  Virgo: [
    'A man\'s head', 'A large white cross, upraised', 'Two angels bringing protection',
    'A colored child playing with white children', 'A man dreaming of fairies',
    'A merry-go-round', 'A harem', 'First dancing instruction',
    'A man making a futuristic drawing', 'Two heads looking out and beyond the shadows',
    'A boy molded in his mother\'s aspirations for him', 'A bride with her veil snatched away',
    'A strong hand supplanting political hysteria', 'A family tree', 'A fine lace handkerchief',
    'An orangutan', 'A volcano in eruption', 'A Ouija board',
    'A swimming race', 'A caravan of cars headed for promised lands',
    'A girls\' basketball team', 'A royal coat of arms', 'A lion tamer',
    'Mary and her white lamb', 'A flag at half mast before a public building',
    'A boy with a censer', 'Grande dames at tea', 'A bald-headed man',
    'A seeker after occult knowledge is reading an ancient scroll', 'Having an urgent task to complete, a man does not look to any comfort or reward',
  ],
  Libra: [
    'A butterfly made perfect by a dart through it', 'The light of the sixth race transmuted to the seventh',
    'The dawn of a new day, everything changed', 'A group around a campfire',
    'A man teaching the true inner knowledge', 'The ideals of a man abundantly crystallized',
    'A woman feeding chickens and protecting them from the hawks', 'A blazing fireplace in a deserted home',
    'Three old masters hanging in a special room in an art gallery', 'A canoe approaching safety through dangerous waters',
    'A professor peering over his glasses at his students', 'Miners emerging from a mine',
    'Children blowing soap bubbles', 'A noon siesta', 'Circular paths',
    'After the storms of winter, a boat landing stands in need of reconstruction',
    'A retired sea captain', 'Two men placed under arrest',
    'A gang of robbers in hiding', 'A Jewish rabbi', 'A crowd upon the beach',
    'A child giving birds a drink at a fountain', 'A chanticleer', 'A butterfly with a third wing on its left side',
    'The sight of an autumn leaf brings to a pilgrim the sudden revelation of the mystery of life and death',
    'An eagle and a large white dove turning into each other', 'An airplane hovering overhead',
    'A man in the midst of brightening influences', 'Humanity seeking to bridge the span of knowledge',
    'Three mounds of knowledge on a philosopher\'s head',
  ],
  Scorpio: [
    'A sight-seeing bus', 'A broken bottle and spilled perfume', 'A house-raising',
    'A youth holding a lighted candle', 'A massive rocky shore',
    'A gold rush', 'Deep-sea divers', 'The moon shining across a lake',
    'Dental work', 'A fellowship supper', 'A drowning man rescued',
    'An embassy ball', 'An inventor performs a laboratory experiment',
    'Telephone workers installing new connections',
    'Children playing around five mounds of sand', 'A girl\'s face breaking into a smile',
    'A woman the father of her own child', 'A path through woods brilliant with multicolored splendor',
    'A parrot listening and then talking', 'A woman drawing two dark curtains aside',
    'A soldier derelict', 'Hunters starting out for ducks', 'A bunny metamorphosed into a fairy',
    'Crowds coming down the mountain to listen to one man',
    'An X ray', 'Indians making camp', 'A military band on the march',
    'The king of the fairies approaching his domain', 'An Indian woman pleading to the chief for the lives of her children',
    'Children in Halloween costumes indulge in various pranks',
  ],
  Sagittarius: [
    'Retired army veterans gather to reawaken old memories', 'The ocean covered with whitecaps',
    'Two men playing chess', 'A little child learning to walk',
    'An old owl up in a tree', 'A game of cricket', 'Cupid knocking at the door',
    'Rocks and things forming therein', 'A mother with her child on stairs',
    'A golden-haired goddess of opportunity', 'The lamp of physical enlightenment at the left temple',
    'A flag that turns into an eagle that crows', 'A widow\'s past is brought to light',
    'The pyramids and the sphinx', 'The ground hog looking for its shadow',
    'Sea gulls watching a ship', 'An Easter sunrise service',
    'Tiny children in sunbonnets', 'Pelicans moving their habitat',
    'In winter, people cutting ice from a frozen pond', 'A child and a dog with borrowed eyeglasses',
    'A Chinese laundry', 'Immigrants entering', 'A bluebird standing at the door of the house',
    'A chubby boy on a hobbyhorse', 'A flag bearer', 'A sculptor',
    'An old bridge over a beautiful stream', 'A fat boy mowing the lawn',
    'The Pope',
  ],
  Capricorn: [
    'An Indian chief demanding recognition', 'Three stained-glass windows, one damaged by bombardment',
    'The human soul receptive to growth and understanding', 'A group of people entering a large canoe',
    'Indians rowing a canoe', 'A dark archway and ten logs at the bottom',
    'A veiled prophet of power', 'Birds in the house singing happily',
    'An angel carrying a harp', 'An albatross feeding from the hand',
    'A large group of pheasants', 'A student of nature lecturing', 'A fire worshipper',
    'An ancient bas-relief carved in granite', 'Many world leaders gather in a hospital for the ill',
    'School grounds filled with boys and girls in gymnasium suits',
    'A girl surreptitiously bathing in the nude', 'The Union Jack',
    'A child of about five with a huge shopping bag', 'Hidden choir singing during a religious service',
    'A relay race', 'A general accepting defeat gracefully',
    'Two awards for bravery in war', 'A woman entering a convent', 'An oriental rug dealer',
    'A water sprite', 'A mountain pilgrimage', 'A large aviary',
    'A woman reading tea leaves', 'A secret business conference',
  ],
  Aquarius: [
    'An old adobe mission', 'An unexpected thunderstorm', 'A deserter from the navy',
    'A Hindu healer', 'A council of ancestors', 'A performer of a mystery play',
    'A child born of an eggshell', 'Beautifully gowned wax figures',
    'A flag is seen turning into an eagle', 'A man who had for a time become the embodiment of a popular ideal',
    'During a silent hour, a man receives a new inspiration which may change his life',
    'People on stairs graduated upward', 'A barometer', 'A train entering a tunnel',
    'Two lovebirds sitting on a fence', 'A big-business man at his desk', 'A watchdog standing guard',
    'A man unmasked', 'A forest fire quenched', 'A big white dove, a message bearer',
    'A woman disappointed and disillusioned', 'A rug placed on a floor for children to play on',
    'A big bear sitting down and waving all its paws',
    'A man, having overcome his passions, teaches deep wisdom in terms of his experience',
    'A butterfly with the right wing more perfectly formed',
    'A hydrometer', 'An ancient pottery bowl filled with violets', 'A tree felled and sawed',
    'A butterfly emerging from a chrysalis', 'The field of Ardath in bloom',
  ],
  Pisces: [
    'A public market', 'A squirrel hiding from hunters', 'Petrified forest',
    'Heavy traffic on a narrow isthmus', 'A church bazaar', 'Officers on dress parade',
    'A cross lying on rocks', 'A girl blowing a bugle', 'The race begins: intent on outdistancing his rivals, a jockey spurs his horse to great speed',
    'An aviator in the clouds', 'Men seeking illumination', 'An examination of initiates',
    'A sword in a museum', 'A lady wrapped in fox fur', 'An officer preparing to drill his men',
    'The flow of inspiration', 'An Easter promenade', 'In a huge tent, a famous revivalist conducts his meeting',
    'A master instructing his pupil', 'A table set for an evening meal',
    'A little white lamb, a child, and a Chinese servant', 'A man bringing down the new law from Sinai',
    'Spiritist phenomena', 'On a small island surrounded by the vast expanse of the sea, people are seen living',
    'The purging of the priesthood', 'Watching the very thin moon crescent appearing at sunset',
    'A harvest moon illuminates a clear autumnal sky', 'A fertile garden under the full moon',
    'Light breaking into many colors as it passes through a prism', 'The Great Stone Face',
  ],
};

export function lookupSabianSymbol(planet: string, sign: string, degree: number, minute: number): SabianSymbolInfo {
  // Sabian convention: round up to next degree. 0°00' uses degree 1.
  const sabianDegree = minute > 0 ? degree + 1 : (degree === 0 ? 1 : degree);
  const idx = Math.min(Math.max(sabianDegree - 1, 0), 29);
  const symbols = SABIAN_SYMBOLS[sign];
  const symbol = symbols?.[idx] ?? '';

  return { planet, sign, sabianDegree, symbol };
}

export function analyzeSabianSymbols(chart: NatalChart): SabianSymbolInfo[] {
  const planets = getCorePlanets(chart);
  return planets.map(p => {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign.name;
    return lookupSabianSymbol(p.planet.name, signName, p.degree, p.minute);
  });
}

// ── 6. Arabic Lots / Parts ──────────────────────────────────────────
// Lot of Spirit, Lot of Eros, Lot of Necessity, Lot of Courage.

export interface ArabicLot {
  name: string;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
  house?: number;
  description: string;
}

export function calculateArabicLots(chart: NatalChart): ArabicLot[] {
  if (!chart.ascendant) return []; // needs Ascendant

  const ascLon = chart.ascendant.longitude;
  const sunLon = chart.sun.longitude;
  const moonLon = chart.moon.longitude;
  const marsLon = chart.mars.longitude;
  const venusLon = chart.venus.longitude;
  const mercuryLon = chart.mercury.longitude;

  const sunHouse = chart.sun.house;
  const isDayChart = sunHouse >= 7 && sunHouse <= 12;

  const lots: ArabicLot[] = [];

  function makeLot(name: string, lon: number, description: string): ArabicLot {
    const normalized = normalize360(lon);
    const sign = signFromLongitude(normalized);
    const degInSign = normalized % 30;
    const degree = Math.floor(degInSign);
    const minute = Math.round((degInSign - degree) * 60);
    let house: number | undefined;
    if (chart.houseCusps && chart.houseCusps.length >= 12) {
      for (let i = 0; i < 12; i++) {
        const next = (i + 1) % 12;
        const cuspStart = chart.houseCusps[i].longitude;
        const cuspEnd = chart.houseCusps[next].longitude;
        const span = ((cuspEnd - cuspStart + 360) % 360);
        const dist = ((normalized - cuspStart + 360) % 360);
        if (dist < span) { house = i + 1; break; }
      }
    }
    return { name, longitude: normalized, sign, degree, minute, house, description };
  }

  // Part of Fortune is already calculated elsewhere; Lot of Spirit is its mirror
  // Day: Spirit = ASC − Moon + Sun; Night: Spirit = ASC + Moon − Sun
  const spiritLon = isDayChart
    ? ascLon - moonLon + sunLon
    : ascLon + moonLon - sunLon;
  lots.push(makeLot('Lot of Spirit',
    spiritLon,
    'The Lot of Spirit represents conscious intention, will, and the soul\'s active engagement with life. Where the Part of Fortune shows where life\'s gifts flow naturally, the Lot of Spirit shows where purposeful effort and spiritual direction can create meaning.'));

  // Lot of Eros: Day = ASC + Venus − Spirit; Night = ASC + Spirit − Venus
  const spiritNorm = normalize360(spiritLon);
  const erosLon = isDayChart
    ? ascLon + venusLon - spiritNorm
    : ascLon + spiritNorm - venusLon;
  lots.push(makeLot('Lot of Eros',
    erosLon,
    'The Lot of Eros speaks to desire, passion, and what draws you toward connection. It reveals the nature of your longing — not just romantic, but the deeper pull toward what makes life feel vivid and worth living.'));

  // Lot of Necessity: Day = ASC + Mercury − Mars; Night = ASC + Mars − Mercury
  const necessityLon = isDayChart
    ? ascLon + mercuryLon - marsLon
    : ascLon + marsLon - mercuryLon;
  lots.push(makeLot('Lot of Necessity',
    necessityLon,
    'The Lot of Necessity reveals where fate feels most binding — areas of life where you encounter constraints, obligations, or circumstances that demand adaptation rather than choice. It can also show where disciplined effort yields the deepest results.'));

  // Lot of Courage: Day = ASC + Mars − Fortune; Night = ASC + Fortune − Mars
  const fortuneLon = chart.partOfFortune?.longitude ?? normalize360(
    isDayChart ? ascLon + moonLon - sunLon : ascLon + sunLon - moonLon
  );
  const courageLon = isDayChart
    ? ascLon + marsLon - fortuneLon
    : ascLon + fortuneLon - marsLon;
  lots.push(makeLot('Lot of Courage',
    courageLon,
    'The Lot of Courage shows where boldness and decisive action are called for. It reveals the arena of life where you must summon nerve, face conflict, or assert your will. Well-placed, it grants natural bravery; poorly placed, it highlights where fear must be confronted.'));

  // Lot of Victory (Nemesis): Day = ASC + Jupiter − Spirit; Night = ASC + Spirit − Jupiter
  const jupiterLon = chart.jupiter.longitude;
  const victoryLon = isDayChart
    ? ascLon + jupiterLon - spiritNorm
    : ascLon + spiritNorm - jupiterLon;
  lots.push(makeLot('Lot of Victory',
    victoryLon,
    'The Lot of Victory points to where success, triumph, and favorable outcomes are most accessible. It reveals the domain of life where Jupiter\'s blessings concentrate, offering expansion and reward for aligned effort.'));

  return lots;
}

// ── 7. Midpoint Analysis ────────────────────────────────────────────

export interface Midpoint {
  planet1: string;
  planet2: string;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
  occupyingPlanet?: string;     // planet conjunct the midpoint
  occupyingOrb?: number;
}

export function calculateMidpoints(chart: NatalChart): {
  keyMidpoints: Midpoint[];
  activatedMidpoints: Midpoint[];   // midpoints conjuncted by another planet
} {
  const MIDPOINT_ORB = 1.5;
  const planets = getCorePlanets(chart);

  const midpoints: Midpoint[] = [];

  // Important pairs for character analysis
  const keyPairs: [string, string][] = [
    ['Sun', 'Moon'],         // core identity + emotion blend
    ['Sun', 'Ascendant'],    // self-image
    ['Moon', 'Ascendant'],   // emotional approach to life
    ['Venus', 'Mars'],       // desire + attraction blend
    ['Sun', 'Midheaven'],    // purpose + public direction
    ['Moon', 'Midheaven'],   // emotional connection to career
    ['Mercury', 'Ascendant'],// communication style
    ['Jupiter', 'Saturn'],   // expansion vs restriction
    ['Sun', 'Saturn'],       // ambition + discipline
    ['Moon', 'Venus'],       // emotional love nature
    ['Sun', 'Jupiter'],      // confidence + opportunity
    ['Mars', 'Saturn'],      // controlled energy
    ['Venus', 'Saturn'],     // committed love
    ['Sun', 'Pluto'],        // willpower
    ['Moon', 'Pluto'],       // emotional depth
  ];

  function findPlanetLon(name: string): number | null {
    if (name === 'Ascendant') return chart.ascendant?.longitude ?? null;
    if (name === 'Midheaven') return chart.midheaven?.longitude ?? null;
    const p = planets.find(pl => pl.planet.name === name);
    return p ? p.longitude : null;
  }

  for (const [name1, name2] of keyPairs) {
    const lon1 = findPlanetLon(name1);
    const lon2 = findPlanetLon(name2);
    if (lon1 === null || lon2 === null) continue;

    // Near midpoint (shorter arc)
    let mid = normalize360((lon1 + lon2) / 2);
    // Ensure it's the nearer midpoint
    if (angularDifference(lon1, mid) > 90) {
      mid = normalize360(mid + 180);
    }

    const sign = signFromLongitude(mid);
    const degInSign = mid % 30;
    const degree = Math.floor(degInSign);
    const minute = Math.round((degInSign - degree) * 60);

    midpoints.push({ planet1: name1, planet2: name2, longitude: mid, sign, degree, minute });
  }

  // Check which midpoints are activated (another planet sits on them)
  const activatedMidpoints: Midpoint[] = [];
  for (const mp of midpoints) {
    for (const planet of planets) {
      if (planet.planet.name === mp.planet1 || planet.planet.name === mp.planet2) continue;
      const orb = angularDifference(planet.longitude, mp.longitude);
      if (orb <= MIDPOINT_ORB) {
        activatedMidpoints.push({
          ...mp,
          occupyingPlanet: planet.planet.name,
          occupyingOrb: Number(orb.toFixed(2)),
        });
      }
    }
    // Also check angles
    if (chart.ascendant && mp.planet1 !== 'Ascendant' && mp.planet2 !== 'Ascendant') {
      const orb = angularDifference(chart.ascendant.longitude, mp.longitude);
      if (orb <= MIDPOINT_ORB) {
        activatedMidpoints.push({ ...mp, occupyingPlanet: 'Ascendant', occupyingOrb: Number(orb.toFixed(2)) });
      }
    }
    if (chart.midheaven && mp.planet1 !== 'Midheaven' && mp.planet2 !== 'Midheaven') {
      const orb = angularDifference(chart.midheaven.longitude, mp.longitude);
      if (orb <= MIDPOINT_ORB) {
        activatedMidpoints.push({ ...mp, occupyingPlanet: 'Midheaven', occupyingOrb: Number(orb.toFixed(2)) });
      }
    }
  }

  activatedMidpoints.sort((a, b) => (a.occupyingOrb ?? 99) - (b.occupyingOrb ?? 99));

  return { keyMidpoints: midpoints, activatedMidpoints };
}

// ── 8. Egyptian Terms/Bounds ─────────────────────────────────────────
// Each sign is divided into 5 unequal segments ruled by planets.

export interface TermInfo {
  planet: string;
  sign: string;
  degree: number;
  termRuler: string;
  termRange: string;            // e.g. "0°–6°"
  description: string;
}

// Egyptian terms: [ruler, endDegree] pairs per sign (classic Ptolemaic scheme)
const EGYPTIAN_TERMS: Record<string, [string, number][]> = {
  Aries:       [['Jupiter', 6], ['Venus', 12], ['Mercury', 20], ['Mars', 25], ['Saturn', 30]],
  Taurus:      [['Venus', 8], ['Mercury', 14], ['Jupiter', 22], ['Saturn', 27], ['Mars', 30]],
  Gemini:      [['Mercury', 6], ['Jupiter', 12], ['Venus', 17], ['Mars', 24], ['Saturn', 30]],
  Cancer:      [['Mars', 7], ['Venus', 13], ['Mercury', 19], ['Jupiter', 26], ['Saturn', 30]],
  Leo:         [['Jupiter', 6], ['Venus', 11], ['Saturn', 18], ['Mercury', 24], ['Mars', 30]],
  Virgo:       [['Mercury', 7], ['Venus', 17], ['Jupiter', 21], ['Mars', 28], ['Saturn', 30]],
  Libra:       [['Saturn', 6], ['Mercury', 14], ['Jupiter', 21], ['Venus', 28], ['Mars', 30]],
  Scorpio:     [['Mars', 7], ['Venus', 11], ['Mercury', 19], ['Jupiter', 24], ['Saturn', 30]],
  Sagittarius: [['Jupiter', 12], ['Venus', 17], ['Mercury', 21], ['Saturn', 26], ['Mars', 30]],
  Capricorn:   [['Mercury', 7], ['Jupiter', 14], ['Venus', 22], ['Saturn', 26], ['Mars', 30]],
  Aquarius:    [['Mercury', 7], ['Venus', 13], ['Jupiter', 20], ['Mars', 25], ['Saturn', 30]],
  Pisces:      [['Venus', 12], ['Jupiter', 16], ['Mercury', 19], ['Mars', 28], ['Saturn', 30]],
};

function getTermRuler(sign: string, degree: number): { ruler: string; range: string } {
  const terms = EGYPTIAN_TERMS[sign];
  if (!terms) return { ruler: '', range: '' };
  let start = 0;
  for (const [ruler, end] of terms) {
    if (degree < end) return { ruler, range: `${start}°–${end}°` };
    start = end;
  }
  return { ruler: terms[4][0], range: `${terms[3][1]}°–30°` };
}

export function analyzeTerms(chart: NatalChart): TermInfo[] {
  const planets = getCorePlanets(chart);
  return planets.map(p => {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign.name;
    const { ruler, range } = getTermRuler(signName, p.degree);
    return {
      planet: p.planet.name,
      sign: signName,
      degree: p.degree,
      termRuler: ruler,
      termRange: range,
      description: `${p.planet.name} at ${p.degree}° ${signName} falls in the terms of ${ruler} (${range}). This adds a subtle ${ruler} coloring to how ${p.planet.name} expresses itself — a secondary influence beneath the sign ruler.`,
    };
  });
}

// ── 9. Planetary Faces (Chaldean) ───────────────────────────────────
// Each 10° decan also has a "face" ruler following the Chaldean order,
// starting from Mars for 0° Aries and cycling: Mars, Sun, Venus, Mercury,
// Moon, Saturn, Jupiter.

export interface FaceInfo {
  planet: string;
  sign: string;
  degree: number;
  faceRuler: string;
}

const CHALDEAN_ORDER = ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'];

export function analyzeFaces(chart: NatalChart): FaceInfo[] {
  const planets = getCorePlanets(chart);
  return planets.map(p => {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign.name;
    const signIdx = ALL_SIGNS.indexOf(signName);
    const decanIdx = Math.floor(p.degree / 10); // 0, 1, or 2
    const faceIdx = (signIdx * 3 + decanIdx) % 7;
    return {
      planet: p.planet.name,
      sign: signName,
      degree: p.degree,
      faceRuler: CHALDEAN_ORDER[faceIdx],
    };
  });
}

const ALL_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// ── 10. Accidental Dignity & Planet Strength Ranking ────────────────
// Scores each planet by combining essential dignity, house placement,
// aspect reception, speed, and sect.

export interface PlanetStrength {
  planet: string;
  essentialScore: number;       // from dignityService (domicile +5 … fall -4)
  accidentalScore: number;      // house, speed, aspects, sect
  totalScore: number;
  rank: number;                 // 1 = strongest
  label: string;                // e.g. "Very Strong", "Moderate", "Challenged"
  factors: string[];            // human-readable breakdown
}

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
const SUCCEDENT_HOUSES = new Set([2, 5, 8, 11]);

export function rankPlanetStrengths(chart: NatalChart, essentialScores: Map<string, number>): PlanetStrength[] {
  const planets = getCorePlanets(chart);
  const sunHouse = chart.sun.house;
  const isDayChart = sunHouse >= 7 && sunHouse <= 12;
  const aspects = chart.aspects ?? [];

  const strengths: PlanetStrength[] = planets.map(p => {
    const name = p.planet.name;
    const essential = essentialScores.get(name) ?? 0;
    let accidental = 0;
    const factors: string[] = [];

    // House placement
    if (ANGULAR_HOUSES.has(p.house)) {
      accidental += 4;
      factors.push(`Angular house (${p.house}) +4`);
    } else if (SUCCEDENT_HOUSES.has(p.house)) {
      accidental += 2;
      factors.push(`Succedent house (${p.house}) +2`);
    } else if (p.house > 0) {
      accidental += 1;
      factors.push(`Cadent house (${p.house}) +1`);
    }

    // Direct/Retrograde
    if (p.isRetrograde) {
      accidental -= 2;
      factors.push('Retrograde −2');
    } else if (name !== 'Sun' && name !== 'Moon') {
      accidental += 1;
      factors.push('Direct +1');
    }

    // Speed — fast-moving planets get a bonus
    if (Math.abs(p.speed) > 0) {
      const avgSpeeds: Record<string, number> = {
        Sun: 1.0, Moon: 13.2, Mercury: 1.2, Venus: 1.2, Mars: 0.52,
        Jupiter: 0.083, Saturn: 0.033, Uranus: 0.012, Neptune: 0.006, Pluto: 0.004,
      };
      const avg = avgSpeeds[name] ?? 0.5;
      if (Math.abs(p.speed) > avg * 1.1) {
        accidental += 1;
        factors.push('Fast motion +1');
      } else if (Math.abs(p.speed) < avg * 0.5) {
        accidental -= 1;
        factors.push('Slow motion −1');
      }
    }

    // Sect bonus
    const diurnalPlanets = new Set(['Sun', 'Jupiter', 'Saturn']);
    const nocturnalPlanets = new Set(['Moon', 'Venus', 'Mars']);
    if (isDayChart && diurnalPlanets.has(name)) {
      accidental += 1;
      factors.push('In sect +1');
    } else if (!isDayChart && nocturnalPlanets.has(name)) {
      accidental += 1;
      factors.push('In sect +1');
    }

    // Aspects from benefics / malefics
    for (const asp of aspects) {
      const other = asp.planet1.name === name ? asp.planet2.name : (asp.planet2.name === name ? asp.planet1.name : null);
      if (!other) continue;
      const isHarmonious = asp.type.nature === 'Harmonious' || asp.type.name.toLowerCase() === 'conjunction';
      if (other === 'Jupiter' || other === 'Venus') {
        accidental += isHarmonious ? 2 : 0;
        if (isHarmonious) factors.push(`${asp.type.name} ${other} +2`);
      }
      if (other === 'Saturn' || other === 'Mars') {
        if (asp.type.nature === 'Challenging') {
          accidental -= 1;
          factors.push(`${asp.type.name} ${other} −1`);
        }
      }
    }

    // Combustion penalty (close to Sun)
    if (name !== 'Sun') {
      const dist = angularDifference(p.longitude, chart.sun.longitude);
      if (dist <= 0.2833) {
        accidental += 3; // cazimi is powerful
        factors.push('Cazimi +3');
      } else if (dist <= 8.5) {
        accidental -= 3;
        factors.push('Combust −3');
      } else if (dist <= 17) {
        accidental -= 1;
        factors.push('Under the beams −1');
      }
    }

    const total = essential + accidental;
    return { planet: name, essentialScore: essential, accidentalScore: accidental, totalScore: total, rank: 0, label: '', factors };
  });

  // Sort and rank
  strengths.sort((a, b) => b.totalScore - a.totalScore);
  strengths.forEach((s, i) => {
    s.rank = i + 1;
    s.label = s.totalScore >= 8 ? 'Very Strong' : s.totalScore >= 4 ? 'Strong' : s.totalScore >= 1 ? 'Moderate' : s.totalScore >= -2 ? 'Neutral' : 'Challenged';
  });

  return strengths;
}

// ── 11. Oriental vs Occidental ──────────────────────────────────────
// A planet is oriental (morning star) if it rises before the Sun, occidental (evening star) if after.

export interface OrientalOccidental {
  planet: string;
  phase: 'oriental' | 'occidental';
  description: string;
}

export function analyzeOrientalOccidental(chart: NatalChart): OrientalOccidental[] {
  const sunLon = chart.sun.longitude;
  const targets = [chart.mercury, chart.venus, chart.mars, chart.jupiter, chart.saturn].filter(Boolean);

  return targets.map(p => {
    // A planet is oriental if it has a higher ecliptic longitude than the Sun
    // (but within 180° ahead in zodiacal order, i.e. rises before the Sun).
    const diff = normalize360(p.longitude - sunLon);
    const isOriental = diff > 180; // rises before Sun = behind Sun in zodiacal order

    return {
      planet: p.planet.name,
      phase: isOriental ? 'oriental' : 'occidental',
      description: isOriental
        ? `${p.planet.name} is oriental (morning star) — it rises before the Sun. Oriental planets tend to express their energy more proactively, visibly, and with outward initiative.`
        : `${p.planet.name} is occidental (evening star) — it sets after the Sun. Occidental planets tend to express their energy more reflectively, responsively, and with deliberation.`,
    };
  });
}

// ── 12. Aspect Grid ─────────────────────────────────────────────────
// Produces a matrix of aspects between every pair of chart points.

export interface AspectGridCell {
  point1: string;
  point2: string;
  aspectType: string | null;     // null = no aspect
  symbol: string;
  orb: number;
  nature: string;
}

export function buildAspectGrid(chart: NatalChart): {
  points: string[];
  grid: (AspectGridCell | null)[][];
} {
  const coreNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  if (chart.ascendant) coreNames.push('Ascendant');
  if (chart.midheaven) coreNames.push('Midheaven');

  const aspects = chart.aspects ?? [];
  const aspectLookup = new Map<string, { type: string; symbol: string; orb: number; nature: string }>();
  for (const a of aspects) {
    const key1 = `${a.planet1.name}|${a.planet2.name}`;
    const key2 = `${a.planet2.name}|${a.planet1.name}`;
    const val = { type: a.type.name, symbol: a.type.symbol, orb: a.orb, nature: a.type.nature };
    aspectLookup.set(key1, val);
    aspectLookup.set(key2, val);
  }

  const grid: (AspectGridCell | null)[][] = [];
  for (let i = 0; i < coreNames.length; i++) {
    const row: (AspectGridCell | null)[] = [];
    for (let j = 0; j < coreNames.length; j++) {
      if (i === j) { row.push(null); continue; }
      if (j > i) { row.push(null); continue; } // upper triangle empty (lower triangle only)
      const key = `${coreNames[i]}|${coreNames[j]}`;
      const asp = aspectLookup.get(key);
      if (asp) {
        row.push({ point1: coreNames[i], point2: coreNames[j], aspectType: asp.type, symbol: asp.symbol, orb: asp.orb, nature: asp.nature });
      } else {
        row.push({ point1: coreNames[i], point2: coreNames[j], aspectType: null, symbol: '', orb: 0, nature: '' });
      }
    }
    grid.push(row);
  }

  return { points: coreNames, grid };
}

// ── 13. Annual Profections ──────────────────────────────────────────
// A simple Hellenistic timing technique: current age % 12 determines
// the profected house, and its ruler becomes the "time lord" for the year.

export interface AnnualProfection {
  age: number;
  profectedHouse: number;       // 1–12
  profectedSign: string;        // sign on that house cusp
  timeLord: string;             // planet ruling the profected sign
  description: string;
}

const SIGN_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

export function calculateAnnualProfection(chart: NatalChart, birthDate: string): AnnualProfection | null {
  if (!chart.houseCusps || chart.houseCusps.length < 12) return null;

  const birth = new Date(birthDate);
  const now = new Date();
  if (isNaN(birth.getTime())) return null;

  let age = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) age--;
  if (age < 0) return null;

  const profectedHouse = (age % 12) + 1;
  const cusp = chart.houseCusps.find(c => c.house === profectedHouse);
  const profectedSign = cusp ? (typeof cusp.sign === 'string' ? cusp.sign : cusp.sign.name) : '';
  const timeLord = SIGN_RULERS[profectedSign] ?? '';

  const houseThemes: Record<number, string> = {
    1: 'self, identity, new beginnings',
    2: 'finances, values, self-worth',
    3: 'communication, learning, siblings',
    4: 'home, family, emotional roots',
    5: 'creativity, romance, self-expression',
    6: 'health, work, daily routines',
    7: 'relationships, partnerships, contracts',
    8: 'transformation, shared resources, intimacy',
    9: 'travel, education, philosophy, beliefs',
    10: 'career, reputation, public life',
    11: 'community, friendships, aspirations',
    12: 'solitude, spirituality, hidden matters',
  };

  return {
    age,
    profectedHouse,
    profectedSign,
    timeLord,
    description: `At age ${age}, your annual profection activates the ${profectedHouse}${profectedHouse === 1 ? 'st' : profectedHouse === 2 ? 'nd' : profectedHouse === 3 ? 'rd' : 'th'} house (${profectedSign}). The themes of ${houseThemes[profectedHouse] ?? ''} come to the foreground, and ${timeLord} becomes your time lord for the year — transits to and from ${timeLord} carry extra significance.`,
  };
}

// ── 14. Full Advanced Layers Report ─────────────────────────────────

export interface AdvancedNatalLayers {
  sect: SectAnalysis | null;
  decans: DecanInfo[];
  criticalDegrees: CriticalDegreeInfo[];
  fixedStars: FixedStarConjunction[];
  sabianSymbols: SabianSymbolInfo[];
  arabicLots: ArabicLot[];
  midpoints: { keyMidpoints: Midpoint[]; activatedMidpoints: Midpoint[] };
  terms: TermInfo[];
  faces: FaceInfo[];
  orientalOccidental: OrientalOccidental[];
  aspectGrid: { points: string[]; grid: (AspectGridCell | null)[][] };
  profection: AnnualProfection | null;
  planetStrengths: PlanetStrength[];
}

export function generateAdvancedLayers(chart: NatalChart): AdvancedNatalLayers {
  // Gather essential dignity scores for strength ranking (inlined to avoid circular import)
  const essentialScores = new Map<string, number>();
  const RULERS: Record<string, string[]> = {
    Aries: ['Mars'], Taurus: ['Venus'], Gemini: ['Mercury'], Cancer: ['Moon'],
    Leo: ['Sun'], Virgo: ['Mercury'], Libra: ['Venus'], Scorpio: ['Pluto', 'Mars'],
    Sagittarius: ['Jupiter'], Capricorn: ['Saturn'], Aquarius: ['Uranus', 'Saturn'], Pisces: ['Neptune', 'Jupiter'],
  };
  const EXALT: Record<string, string> = {
    Aries: 'Sun', Taurus: 'Moon', Cancer: 'Jupiter', Virgo: 'Mercury',
    Libra: 'Saturn', Capricorn: 'Mars', Pisces: 'Venus',
  };
  const DETR: Record<string, string[]> = {
    Aries: ['Venus'], Taurus: ['Mars', 'Pluto'], Gemini: ['Jupiter'],
    Cancer: ['Saturn'], Leo: ['Saturn', 'Uranus'], Virgo: ['Neptune', 'Jupiter'],
    Libra: ['Mars'], Scorpio: ['Venus'], Sagittarius: ['Mercury'],
    Capricorn: ['Moon'], Aquarius: ['Sun'], Pisces: ['Mercury'],
  };
  const FALL_MAP: Record<string, string> = {
    Libra: 'Sun', Scorpio: 'Moon', Capricorn: 'Jupiter', Pisces: 'Mercury',
    Aries: 'Saturn', Cancer: 'Mars', Virgo: 'Venus',
  };
  for (const p of getCorePlanets(chart)) {
    const sn = typeof p.sign === 'string' ? p.sign : p.sign.name;
    const name = p.planet.name;
    if (RULERS[sn]?.includes(name)) { essentialScores.set(name, 5); continue; }
    if (EXALT[sn] === name) { essentialScores.set(name, 4); continue; }
    if (FALL_MAP[sn] === name) { essentialScores.set(name, -4); continue; }
    if (DETR[sn]?.includes(name)) { essentialScores.set(name, -3); continue; }
    essentialScores.set(name, 0);
  }

  return {
    sect: analyzeSect(chart),
    decans: analyzeDecans(chart),
    criticalDegrees: detectCriticalDegrees(chart),
    fixedStars: detectFixedStarConjunctions(chart),
    sabianSymbols: analyzeSabianSymbols(chart),
    arabicLots: calculateArabicLots(chart),
    midpoints: calculateMidpoints(chart),
    terms: analyzeTerms(chart),
    faces: analyzeFaces(chart),
    orientalOccidental: analyzeOrientalOccidental(chart),
    aspectGrid: buildAspectGrid(chart),
    profection: calculateAnnualProfection(chart, chart.birthData.date),
    planetStrengths: rankPlanetStrengths(chart, essentialScores),
  };
}
