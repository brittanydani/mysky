import { NatalChart } from './types';

export interface StoryChapter {
  id: string;
  chapter: string;
  title: string;
  content: string;
  preview?: string;
  isPremium: boolean;
  isLocked: boolean;
}

// ─── Sun Sign Stories ────────────────────────────────────────────────────────
const SUN_STORIES: Record<string, { title: string; content: string }> = {
  Aries: {
    title: 'The Pioneer Spirit',
    content: `Born under the sign of Aries, you carry the spark of initiation in everything you do. You are the first flame—bold, instinctive, and unafraid to leap before looking. Your courage isn't the absence of fear; it's the refusal to let fear make your decisions.

Your journey is one of self-discovery through action. Where others deliberate, you move. Where others hesitate, you ignite. The ram charges forward not out of recklessness, but out of an innate trust that the path reveals itself to those who dare to walk it.`,
  },
  Taurus: {
    title: 'The Sacred Ground',
    content: `Born under the sign of Taurus, your soul is rooted in the physical world like an ancient tree. You understand what others often miss—that beauty is not frivolous, that comfort is not weakness, that steadfastness is its own form of courage.

You build your life slowly, deliberately, with the patience of someone who knows that lasting things cannot be rushed. Your sensuality connects you to the earth itself: the taste of good food, the warmth of a loved one's hand, the peace of a garden in bloom.`,
  },
  Gemini: {
    title: 'The Eternal Seeker',
    content: `Born under the sign of Gemini, your mind is a constellation of curiosity—always reaching, always connecting, always discovering new ways to understand the world. You are the storyteller of the zodiac, weaving meaning from the threads of conversation, observation, and wonder.

Your duality is not a flaw but a gift. You hold multiple truths at once, seeing the world from angles others cannot imagine. Your restlessness is the engine of your brilliance—you were never meant to stay in one place, one idea, one version of yourself.`,
  },
  Cancer: {
    title: 'A Soul of Deep Feeling',
    content: `Born under the sign of Cancer, your journey is defined by the currents of emotion. Like the crab, you carry a protective shell, instinctively knowing when to retreat and when to emerge. You meet the world with intuitive wisdom, here to nurture and to be nurtured, forever connected to the moon's eternal rhythm.

Your emotional depth is not a weakness—it is your greatest gift. You sense what others cannot, feel what others miss. The tides of your heart guide you toward authentic connections and meaningful bonds.`,
  },
  Leo: {
    title: 'The Radiant Heart',
    content: `Born under the sign of Leo, you carry the sun's fire in your chest—a warmth that draws others toward you like moths to a golden flame. Your presence fills a room not through loudness, but through authenticity. You were born to shine, and when you do, you give others permission to shine too.

Your generosity of spirit is boundless. You love with your whole heart, create with wild abandon, and protect those you care about with fierce loyalty. The lion's roar isn't about dominance—it's about declaring your truth, unapologetically, in a world that often asks people to dim their light.`,
  },
  Virgo: {
    title: 'The Sacred Craftsman',
    content: `Born under the sign of Virgo, you see the world in exquisite detail. Where others see chaos, you find patterns. Where others feel overwhelmed, you create order. Your gift is the ability to transform the mundane into something meaningful through devotion to craft and care.

Your analytical mind is powered by a deeply caring heart. You serve not out of obligation but out of a genuine desire to make things better—for yourself, for others, for the world. Your criticism, even of yourself, comes from a vision of perfection that lives inside you.`,
  },
  Libra: {
    title: 'The Harmony Weaver',
    content: `Born under the sign of Libra, you are the artist of balance in a world that tilts toward extremes. Your soul craves beauty, fairness, and connection—not as luxuries, but as necessities for a meaningful life. You understand that relationships are mirrors, reflecting back the parts of ourselves we cannot see alone.

Your diplomacy is not people-pleasing; it's an art form. You navigate the spaces between people with grace, finding common ground where others see only division. Your indecision isn't weakness—it's the mark of someone who truly sees both sides.`,
  },
  Scorpio: {
    title: 'The Deep Transformer',
    content: `Born under the sign of Scorpio, you live in the depths where most people fear to go. You understand the power of what lies beneath the surface—the unspoken truths, the hidden motivations, the shadows that shape human behavior. Your intensity is not a flaw; it is the engine of your transformation.

You are the phoenix of the zodiac, born and reborn through crisis and catharsis. You love fiercely, grieve deeply, and emerge from darkness with a wisdom that cannot be taught—only lived. Your power lies not in control, but in your willingness to surrender to the process of becoming.`,
  },
  Sagittarius: {
    title: 'The Truth Seeker',
    content: `Born under the sign of Sagittarius, your spirit is an arrow aimed at the horizon—always reaching for something beyond what's known. You are the philosopher, the adventurer, the eternal optimist who believes that meaning exists even in the most chaotic moments of life.

Your restlessness is not escapism; it's a deep hunger for truth. You need to experience life in its fullness—different cultures, philosophies, landscapes of the soul. Your laughter is medicine, your honesty is a gift, and your faith in the journey itself is what carries you through.`,
  },
  Capricorn: {
    title: 'The Mountain Climber',
    content: `Born under the sign of Capricorn, you understand something most people learn too late: that lasting achievement requires patience, discipline, and the courage to keep climbing when the summit is hidden by clouds. You build your life like a cathedral—stone by stone, with an eye toward eternity.

Your ambition is not cold; it's powered by a deep sense of responsibility and a desire to create something that outlasts you. Beneath your composed exterior lives a dry humor, a tender heart, and a loyalty that runs deeper than most will ever know.`,
  },
  Aquarius: {
    title: 'The Visionary Rebel',
    content: `Born under the sign of Aquarius, you arrived in this world seeing what could be rather than what is. You are the humanitarian, the innovator, the quiet revolutionary who questions every assumption and reimagines every system. Your detachment isn't coldness—it's the perspective of someone who sees the bigger picture.

Your individuality is your greatest contribution. You don't follow trends; you create them. You don't fit into boxes; you redesign them. The loneliness you sometimes feel is the price of being ahead of your time—but the connections you do make are electric, authentic, and transformative.`,
  },
  Pisces: {
    title: 'The Dreamer Between Worlds',
    content: `Born under the sign of Pisces, you swim in waters that most people don't even know exist. You feel the collective heartbeat of humanity, absorbing joys and sorrows that aren't always your own. Your sensitivity is not a burden—it is an antenna tuned to frequencies of compassion, creativity, and spiritual truth.

Your imagination is boundless, your empathy oceanic. You heal others simply by being present, by witnessing their pain without judgment. The boundary between reality and dreams is thin for you, and in that liminal space, you find your greatest magic.`,
  },
};

// ─── Moon Sign Stories ───────────────────────────────────────────────────────
const MOON_STORIES: Record<string, { title: string; content: string; preview: string }> = {
  Aries: { title: 'A Heart That Burns', preview: 'Your emotions ignite with fierce intensity...', content: `With your Moon in Aries, your emotional world is a landscape of fire and impulse. You feel things immediately and intensely—joy flares up like a match, anger blazes and burns away just as quickly. You need emotional honesty and directness; games and subtlety exhaust you.\n\nYour heart heals through action. When you're hurting, you need to move, create, or fight for something meaningful. Stillness can feel unbearable, but learning to sit with your feelings without reacting is where your deepest growth awaits.` },
  Taurus: { title: 'A Heart That Holds', preview: 'Your emotional nature craves stability and warmth...', content: `With your Moon in Taurus, your emotional nature is a garden—slow to bloom, deeply rooted, and breathtakingly beautiful when given time and care. You process feelings through your body: a warm bath, comfort food, the weight of a blanket, the steadiness of routine.\n\nYou love with a quiet constancy that many mistake for simplicity. But there is nothing simple about your devotion. Once you let someone into your heart, they stay. Your challenge is learning to let go when holding on causes more pain than release.` },
  Gemini: { title: 'A Heart That Questions', preview: 'Your emotions flow through words and ideas...', content: `With your Moon in Gemini, your emotional world is a conversation—constantly processing, analyzing, and narrating the inner landscape. You need to talk through your feelings, write them down, or find intellectual frameworks that help you understand why you feel what you feel.\n\nYour emotional agility lets you adapt to almost any situation, but it can also leave you disconnected from deeper feelings. The challenge is to stop narrating and simply feel—to let the silence speak.` },
  Cancer: { title: 'A Heart That Remembers', preview: 'Your emotional depth is boundless...', content: `With your Moon in Cancer, you are doubly touched by the lunar tides. Your emotions are oceanic—deep, cyclical, and governed by rhythms you can feel but cannot always explain. You carry the memories of every kindness and every wound, weaving them into the fabric of who you are.\n\nHome is not just a place for you; it's a feeling. You create sanctuaries wherever you go, nurturing others with an instinct as natural as breathing. Your vulnerability is your superpower—but learning boundaries is essential for your survival.` },
  Leo: { title: 'A Heart That Radiates', preview: 'Your emotional nature craves recognition and warmth...', content: `With your Moon in Leo, your heart is a stage, and your emotions are the performance of a lifetime. You need to be seen, celebrated, and appreciated—not out of vanity, but because your emotional wellbeing depends on feeling valued. You love with theatrical generosity and grieve with dramatic depth.\n\nYour warmth lights up every room you enter. Children, animals, and people in need are drawn to your solar energy. Your challenge is learning that you are worthy of love even in your quiet, unperforming moments.` },
  Virgo: { title: 'A Heart That Serves', preview: 'Your emotions express themselves through care and attention...', content: `With your Moon in Virgo, you process emotions through analysis and service. When you love someone, you notice the small things—their favorite tea, the crease of worry on their forehead, the subtle shift in their voice that signals something is wrong. Your love language is attention to detail.\n\nYour inner critic can be relentless, turning your emotional world into a checklist of self-improvement. Learning to accept your feelings as they are—messy, imperfect, beautifully human—is your most important emotional work.` },
  Libra: { title: 'A Heart That Harmonizes', preview: 'Your emotional world seeks balance and beauty...', content: `With your Moon in Libra, your emotional equilibrium depends on harmony in your relationships and environment. Discord unsettles you at a cellular level; you feel conflict in your body before you process it in your mind. You need beauty, fairness, and partnership to feel emotionally grounded.\n\nYour gift is seeing every perspective, holding space for opposing truths. But this can leave you paralyzed, unsure of what you actually feel versus what you think you should feel. Your growth lies in choosing yourself, even when it disrupts the peace.` },
  Scorpio: { title: 'A Heart That Transforms', preview: 'Your emotional intensity runs deeper than most...', content: `With your Moon in Scorpio, your emotional world is an underground river—powerful, hidden, and capable of carving through stone. You feel everything at maximum intensity but reveal almost nothing. Trust is not given; it's earned through trials that most people don't even realize they're being tested with.\n\nYour emotional depth is both your gift and your burden. You understand the darkness in human nature because you've faced your own. Healing comes when you learn that vulnerability is not the same as weakness—and that letting someone see you completely won't destroy you.` },
  Sagittarius: { title: 'A Heart That Explores', preview: 'Your emotional nature needs freedom and meaning...', content: `With your Moon in Sagittarius, your heart needs space to roam. You process emotions through movement, travel, philosophy, and humor. When life gets heavy, you instinctively reach for meaning—asking "why" until the pain transforms into wisdom.\n\nYour optimism is genuine and often healing for others. But it can also be a way of bypassing difficult emotions. The arrow of Sagittarius flies forward, but sometimes healing requires you to sit still and let the feelings catch up.` },
  Capricorn: { title: 'A Heart That Endures', preview: 'Your emotional world is built on resilience...', content: `With your Moon in Capricorn, you learned early that emotions must be managed, controlled, and sometimes hidden to survive. Your heart is a fortress—not because you don't feel, but because you feel so much that you built walls to protect what's most tender inside.\n\nYour emotional maturity is extraordinary. You handle crisis with composure, provide stability for others, and carry burdens without complaint. But learning to let those walls down—to cry without purpose, to need without shame—is the key to your deepest healing.` },
  Aquarius: { title: 'A Heart That Observes', preview: 'Your emotional nature operates from a higher altitude...', content: `With your Moon in Aquarius, you experience emotions from a slight altitude—as if you're observing your feelings rather than drowning in them. This gives you remarkable clarity in crisis but can make intimate relationships confusing. You feel deeply for humanity but sometimes struggle with the messiness of individual connection.\n\nYour emotional independence is both a strength and a shield. Learning to let people in—truly in, past the intellectual analysis—is where your most transformative growth happens.` },
  Pisces: { title: 'A Heart That Dissolves', preview: 'Your emotional boundaries are beautifully thin...', content: `With your Moon in Pisces, your emotional world has no borders. You absorb the feelings of everyone around you, sometimes losing track of where you end and others begin. Your empathy is oceanic, your imagination boundless, and your need for spiritual connection as essential as breathing.\n\nYou heal others simply by being present, by holding space without judgment. But you must learn to protect your energy, to distinguish your feelings from those you've absorbed, and to create sanctuaries of solitude where your soul can return to itself.` },
};

// ─── Rising Sign Stories ─────────────────────────────────────────────────────
const RISING_STORIES: Record<string, { title: string; content: string; preview: string }> = {
  Aries: { title: 'The Bold First Impression', preview: 'Others see your directness and courage first...', content: `With Aries rising, you enter every room like a force of nature. Your energy is palpable—direct, confident, and unapologetically authentic. People sense your courage before you speak a word, and your presence naturally commands attention.\n\nYour physical demeanor often radiates vitality and urgency. You walk fast, make decisions quickly, and project an independence that both attracts and intimidates. The world sees a warrior; what they don't always see is the tender heart that drives the fight.` },
  Taurus: { title: 'The Grounded Presence', preview: 'The world sees your calm strength and beauty...', content: `With Taurus rising, you move through the world with an unhurried grace that puts people at ease. Your presence is calming, solid, and sensual—others feel grounded simply being near you. You carry yourself with a quiet dignity that speaks of inner resources.\n\nPeople are drawn to your aesthetic sense, your warm voice, and your ability to create beauty in ordinary moments. First impressions paint you as someone reliable and pleasurable to be around—someone who takes life seriously enough to enjoy it.` },
  Gemini: { title: 'The Quicksilver Mind', preview: 'Others see your wit and adaptability first...', content: `With Gemini rising, you sparkle in conversation. Your mind moves at a pace that others find dazzling—connecting ideas, cracking jokes, and pivoting between topics with effortless charm. People are drawn to your intellectual energy and your gift for making complex things feel simple.\n\nYou appear younger than your years, both in spirit and often in appearance. Your curiosity is visible in your eyes, your restless hands, and your tendency to be doing three things at once. The world sees versatility; your inner world holds more depth than you let on.` },
  Cancer: { title: 'The Nurturing Shield', preview: 'Others sense your warmth and protectiveness...', content: `With Cancer rising, you meet the world with a soft exterior that belies your inner strength. People sense your warmth immediately—something about your presence feels like home. You attract those who need nurturing, often becoming the emotional anchor in any group.\n\nYour face is expressive, your moods visible like the tides. You wear your heart closer to the surface than you'd like, and your protective instincts extend to anyone who enters your orbit. The world sees a caretaker; what they don't always recognize is how much you need care yourself.` },
  Leo: { title: 'The Magnetic Aura', preview: 'Your presence lights up every room you enter...', content: `With Leo rising, you radiate a warmth and magnetism that's impossible to ignore. Your entrance into any space shifts the energy—not through force, but through the natural charisma that flows from genuine self-expression. People are drawn to your confidence, your generosity, and the way you make others feel special.\n\nYour physical presence often has a regal quality—the way you hold yourself, the expressiveness of your gestures, the brightness in your eyes. The world sees a natural leader, someone born to stand in the spotlight. What they may not see is how deeply you need that light reflected back.` },
  Virgo: { title: 'The Thoughtful Observer', preview: 'Others see your precision and quiet competence...', content: `With Virgo rising, you present a composed, helpful, and quietly intelligent face to the world. People see someone who has it together—organized, modest, and attentive to details others miss. Your demeanor is often calming, your movements precise and purposeful.\n\nThere's an understated quality to your presence that draws people who value substance over show. You don't seek the spotlight, but your competence and genuine kindness make you indispensable. The world sees efficiency; what lies beneath is a rich inner world of analysis and deep caring.` },
  Libra: { title: 'The Graceful Diplomat', preview: 'Others are drawn to your charm and balance...', content: `With Libra rising, you move through the world with a natural grace that makes social situations feel effortless. Your charm is genuine—you have an innate ability to make everyone feel seen, valued, and at ease. People are drawn to your sense of style, your diplomatic nature, and your beautiful smile.\n\nYour appearance often carries an aesthetic refinement—you have an eye for beauty in all its forms. First impressions paint you as someone pleasant, agreeable, and socially polished. What others don't always see is the steel beneath the velvet glove.` },
  Scorpio: { title: 'The Intense Mystery', preview: 'Others sense your depth and power immediately...', content: `With Scorpio rising, you project an intensity that others feel before they understand it. Your gaze is penetrating, your presence magnetic, and your energy carries an unspoken warning: I see everything. People are simultaneously drawn to and intimidated by your depth.\n\nYou reveal yourself slowly, layer by layer, testing the waters before showing what lies beneath. The world sees mystery and power; what they rarely glimpse is the extraordinary vulnerability that fuels your need for emotional truth and authentic connection.` },
  Sagittarius: { title: 'The Adventurous Spirit', preview: 'Others see your optimism and love of freedom...', content: `With Sagittarius rising, you meet the world with open arms and a ready laugh. Your enthusiasm is contagious—people around you feel more hopeful, more adventurous, more alive. Your physical presence often carries an athletic quality, a readiness for movement and exploration.\n\nYou project freedom, humor, and an unshakeable belief that life is fundamentally good. Your honesty can be disarming, your philosophical tangents endearing. The world sees an optimist and adventurer; your inner world holds more questions and seeking than your sunny exterior reveals.` },
  Capricorn: { title: 'The Quiet Authority', preview: 'Others see your maturity and determination...', content: `With Capricorn rising, you project an air of maturity and competence that earns respect even in youth. Your presence is serious, grounded, and dignified—people instinctively trust your judgment and look to you for leadership. You carry yourself with the composure of someone who has already weathered storms.\n\nThere's a timeless quality to your demeanor. You age in reverse—growing lighter, warmer, and more open as the years pass. The world sees ambition and discipline; what lies beneath is a deeply sensitive soul who learned early to wear armor.` },
  Aquarius: { title: 'The Unconventional Thinker', preview: 'Others see your uniqueness and intellectual spark...', content: `With Aquarius rising, you strike others as someone who marches to a completely different drum. Your presence is electric—there's something about you that feels slightly ahead of the times, slightly outside the mainstream, and utterly authentic. People are drawn to your originality.\n\nYour demeanor often carries a friendly detachment—approachable but independent, social but self-contained. The world sees an innovator and free thinker; what they may not recognize is how deeply you care about the collective good and how much your uniqueness sometimes costs you in belonging.` },
  Pisces: { title: 'The Ethereal Empath', preview: 'Others sense your gentle, otherworldly quality...', content: `With Pisces rising, you carry an ethereal quality that others find both enchanting and hard to define. Your presence is gentle, dreamy, and slightly otherworldly—as if part of you exists in a realm beyond the physical. People often project their fantasies onto you, seeing what they need to see.\n\nYour eyes often tell a story of compassion and deep seeing. You absorb the atmosphere of every room, every conversation, every encounter. The world sees gentleness; what lies within is an extraordinary resilience born from navigating the depths of human emotion.` },
};

// ─── Venus Stories ───────────────────────────────────────────────────────────
const VENUS_STORIES: Record<string, { title: string; content: string; preview: string }> = {
  Aries: { title: 'Love as Conquest', preview: 'In love, you pursue with fearless passion...', content: `With Venus in Aries, you love like you live—fearlessly, passionately, and without apology. You fall fast and hard, drawn to the chase, the spark, the electric moment of first connection. You need a partner who can match your fire and keep you on your toes.\n\nYour love language is action. Grand gestures, spontaneous adventures, and direct declarations of affection are how you show you care. Boredom is the death of romance for you—you need a relationship that feels alive.` },
  Taurus: { title: 'Love as Devotion', preview: 'In love, you build something lasting and beautiful...', content: `With Venus in Taurus, you love with your whole body and soul. Physical touch, shared meals, beautiful spaces—these are the currency of your affection. You build relationships slowly, brick by brick, creating something meant to last generations.\n\nYour loyalty runs bone-deep. Once committed, you are steadfast, sensual, and endlessly patient. You show love through consistency—through being there, day after day, in all the quiet ways that matter most.` },
  Gemini: { title: 'Love as Conversation', preview: 'In love, you need intellectual spark and variety...', content: `With Venus in Gemini, your heart follows your mind. You fall in love with someone's ideas, their humor, the way their mind dances between subjects. Communication is the oxygen of your relationships—without it, love suffocates.\n\nYou need variety and stimulation in love. A partner who can surprise you, challenge your thinking, and make you laugh will hold your heart longer than anyone. Your affection expresses itself through words—love letters, inside jokes, and conversations that last until dawn.` },
  Cancer: { title: 'Love as Sanctuary', preview: 'In love, you create a world of warmth and safety...', content: `With Venus in Cancer, you love by creating sanctuary. Your affection wraps around people like a warm blanket—comforting, protective, and deeply nourishing. You remember every detail, anticipate every need, and love with a tenderness that can bring others to tears.\n\nYou need emotional security in relationships above all else. Without it, your walls go up, your shell closes, and the generous heart that defines you retreats into self-protection. The right partner makes you feel safe enough to remain open.` },
  Leo: { title: 'Love as Celebration', preview: 'In love, you are generous, loyal, and radiant...', content: `With Venus in Leo, you love like the sun loves the earth—generously, magnificently, and with total commitment. When you love someone, they become the center of your universe, showered with attention, affection, and unwavering loyalty.\n\nYou need to be adored in return. Not as a narcissistic demand, but as a genuine need for your love to be recognized and celebrated. Romance is not optional for you—it's essential. You want the grand love story, and you're willing to create it.` },
  Virgo: { title: 'Love as Service', preview: 'In love, you show care through thoughtful actions...', content: `With Venus in Virgo, you love through acts of service and attention to detail. You notice what others need before they ask, remembering preferences, fixing problems, and quietly making life smoother for those you care about.\n\nYour love may not always be dramatic, but it is incredibly real. You show affection by being useful, by being present, by caring about the small things that add up to everything. Your challenge is accepting love that doesn't come in the same careful, considered form you give it.` },
  Libra: { title: 'Love as Art', preview: 'In love, you seek beauty, balance, and true partnership...', content: `With Venus in Libra, love is your art form. You understand partnership at a soul level—the dance of two people creating something more beautiful together than either could alone. You bring grace, consideration, and aesthetic beauty to every relationship.\n\nYou need harmony in love. Conflict disturbs you deeply, and you'll go to great lengths to maintain peace. Your challenge is learning that authentic love sometimes requires difficult conversations, and that true partnership includes space for disagreement.` },
  Scorpio: { title: 'Love as Transformation', preview: 'In love, you seek soul-deep connection...', content: `With Venus in Scorpio, you don't love halfway. Your heart demands total honesty, absolute loyalty, and soul-level intimacy. Surface connections bore you; you need a partner who is willing to go to the depths with you—to face the shadows together.\n\nYour love is transformative. Relationships change you at a cellular level, and you change your partners too. The intensity of your devotion can be overwhelming, but for the right person, it is the most profound gift imaginable.` },
  Sagittarius: { title: 'Love as Adventure', preview: 'In love, you need freedom and shared exploration...', content: `With Venus in Sagittarius, your heart needs room to roam. You fall in love with minds, with spirits, with people who make the world feel bigger and more exciting. You need a partner who shares your hunger for truth, growth, and adventure.\n\nYour love is generous, honest, and infectiously optimistic. You bring joy and expansion to every relationship, but you also need partners who respect your independence. The cage of possessive love will always send you running toward the horizon.` },
  Capricorn: { title: 'Love as Legacy', preview: 'In love, you build with patience and commitment...', content: `With Venus in Capricorn, you approach love with the same seriousness you bring to your greatest ambitions. You're not interested in casual connections—you want a partnership that builds something lasting, something worthy of the investment of your heart.\n\nYour affection grows slowly, like a fine wine improving with age. You show love through commitment, through showing up consistently, through building a life together that stands the test of time. Behind your reserved exterior beats one of the most loyal hearts in the zodiac.` },
  Aquarius: { title: 'Love as Liberation', preview: 'In love, you value freedom and authentic connection...', content: `With Venus in Aquarius, you love in unconventional ways. You're drawn to people who are different—unusual minds, independent spirits, those who challenge the status quo. Your ideal relationship is a meeting of equals who choose to be together, not because they need to be, but because they want to be.\n\nFriendship is the foundation of your love. You need intellectual stimulation, shared ideals, and the freedom to remain yourself within a partnership. Your love may look unusual to others, but it's deeply authentic to who you are.` },
  Pisces: { title: 'Love as Transcendence', preview: 'In love, you dissolve all boundaries...', content: `With Venus in Pisces, you love with a devotion that borders on the mystical. You see the divine in your partner, the sacred in every moment of connection. Your empathy in relationships is extraordinary—you feel what your loved ones feel, sometimes before they feel it themselves.\n\nYour love is selfless, imaginative, and deeply romantic. You need a partner who appreciates your sensitivity and doesn't exploit it. The right relationship for you feels less like a contract and more like a spiritual homecoming.` },
};

// ─── Mars Stories ────────────────────────────────────────────────────────────
const MARS_STORIES: Record<string, { title: string; content: string; preview: string }> = {
  Aries: { title: 'Pure Fire in Motion', preview: 'You act on instinct with fearless energy...', content: `With Mars in Aries, your drive is pure, instinctive, and immediate. You don't deliberate—you act. Your energy is a force of nature that propels you forward with courage and directness that others find both inspiring and intimidating.\n\nYou fight clean and fast, preferring direct confrontation to manipulation. Your anger flares hot but burns away quickly. You need physical outlets for your energy—exercise, competition, anything that lets you feel your vitality in your muscles and bones.` },
  Taurus: { title: 'Steady, Unstoppable Force', preview: 'Your drive builds slowly but nothing can stop it...', content: `With Mars in Taurus, your energy is slow-building, determined, and virtually unstoppable once it starts moving. You approach goals with patience and persistence, building toward success with the steady certainty of tectonic plates shifting.\n\nYou don't waste energy on battles you can't win. Your strength lies in endurance—outlasting obstacles rather than overpowering them. When you finally do take action, it carries the weight and inevitability of a natural force.` },
  Gemini: { title: 'The Strategic Mind', preview: 'Your drive expresses through ideas and communication...', content: `With Mars in Gemini, your weapon of choice is your mind. You fight with words, ideas, and strategic communication. Your energy scatters across multiple projects and interests, and you need variety to stay motivated.\n\nYou're at your best when multitasking—your drive actually increases with stimulation. Boredom is your greatest enemy, and you'll sometimes start arguments just to feel the electrical charge of debate. Channel this mental fire wisely, and you become an unstoppable communicator.` },
  Cancer: { title: 'The Protective Guardian', preview: 'Your drive is fueled by emotional connection...', content: `With Mars in Cancer, your energy is driven by emotional currents. You fight hardest for family, home, and those you love. Your protectiveness can be fierce—cross someone you care about, and the crab's claws come out with surprising force.\n\nYour challenge is that your energy fluctuates with your moods. On good days, you're a nurturing powerhouse. On difficult days, you may retreat into passivity. Learning to act from emotional clarity rather than emotional reactivity is your path to personal power.` },
  Leo: { title: 'The Creative Warrior', preview: 'Your drive burns with creative passion and pride...', content: `With Mars in Leo, your energy is dramatic, creative, and impossible to ignore. You pursue your goals with the confidence of someone who was born to lead, bringing passion and flair to everything you do. Your drive is fueled by a desire to create, to be recognized, and to make your mark on the world.\n\nYou need to feel proud of what you're fighting for. Meaningless tasks drain you, but give you a purpose that ignites your heart, and you become an unstoppable force of creative energy and determined action.` },
  Virgo: { title: 'The Precision Strategist', preview: 'Your drive expresses through meticulous action...', content: `With Mars in Virgo, your energy is precise, methodical, and devastatingly effective. You don't waste a single movement—every action is calculated for maximum efficiency. You approach goals with analytical precision, breaking down large tasks into manageable, actionable steps.\n\nYour work ethic is extraordinary. You're driven by a desire for improvement—of yourself, your skills, your contribution to the world. Your challenge is perfectionism that can lead to paralysis. Sometimes good enough is the enemy of done.` },
  Libra: { title: 'The Diplomatic Warrior', preview: 'Your drive seeks justice and fair outcomes...', content: `With Mars in Libra, your energy is channeled through diplomacy and a passionate sense of fairness. You fight for justice, equality, and beauty—not with brute force, but with charm, strategy, and an ability to rally others to your cause.\n\nYour challenge is indecision. You see all sides so clearly that taking decisive action can feel impossible. But when you finally commit to a course, your ability to bring people together and create consensus makes you a powerful force for change.` },
  Scorpio: { title: 'The Relentless Transformer', preview: 'Your drive is intense, strategic, and transformative...', content: `With Mars in Scorpio, your energy runs deep—volcanic, strategic, and relentless. You don't do anything halfway. When you set your sights on a goal, you pursue it with the single-minded intensity of a predator who has already decided the outcome.\n\nYou never forget a slight, but you also never abandon a cause you believe in. Your power comes not from aggression but from an unshakeable will that simply refuses to stop. Others may underestimate you, but only once.` },
  Sagittarius: { title: 'The Crusading Spirit', preview: 'Your drive aims for truth and expansive goals...', content: `With Mars in Sagittarius, your energy is an arrow aimed at the future—bold, optimistic, and driven by a hunger for meaning. You pursue goals with enthusiasm and faith, trusting that the universe will support your quest for truth and adventure.\n\nYou fight for beliefs, causes, and the freedom to live on your own terms. Your energy is expansive and inspiring—you motivate others not through force but through the infectious power of your vision and your willingness to go first.` },
  Capricorn: { title: 'The Strategic Builder', preview: 'Your drive is disciplined, patient, and powerful...', content: `With Mars in Capricorn, your energy is channeled with the discipline of a master architect. You build toward your goals with patience and strategic precision, never wasting effort on battles that don't serve your long-term vision. Your ambition is quiet but absolute.\n\nYou are at your most powerful when you have a clear plan and the authority to execute it. Your drive strengthens with age—while others burn out, you steadily accumulate power, expertise, and the quiet satisfaction of goals achieved through sheer determination.` },
  Aquarius: { title: 'The Revolutionary Force', preview: 'Your drive disrupts, innovates, and liberates...', content: `With Mars in Aquarius, your energy is directed toward innovation, liberation, and breaking down systems that no longer serve humanity. You fight for the future, for the collective, for ideas that haven't been imagined yet.\n\nYour drive is unconventional—you rarely take the obvious path. Your greatest strength is your ability to detach from emotion and act on principle. You can be stubborn about your vision, but your willingness to challenge the status quo makes you a catalyst for meaningful change.` },
  Pisces: { title: 'The Gentle Force', preview: 'Your drive flows like water around obstacles...', content: `With Mars in Pisces, your energy moves like water—finding the path of least resistance, flowing around obstacles, and wearing down barriers through persistence rather than force. Your drive is fueled by compassion, imagination, and a deep connection to something larger than yourself.\n\nYou may not look like a warrior, but your strength lies in your ability to absorb, adapt, and transform. You fight through art, through empathy, through the quiet power of refusing to harden in a hard world.` },
};

/**
 * Generate personalized cosmic story chapters based on the user's actual natal chart.
 */
export function generateCosmicStory(chart: NatalChart): StoryChapter[] {
  const sunSign = chart.sun.sign.name;
  const moonSign = chart.moon.sign.name;
  const risingSign = chart.ascendant?.sign?.name;
  const venusSign = chart.venus.sign.name;
  const marsSign = chart.mars.sign.name;

  const sun = SUN_STORIES[sunSign] || SUN_STORIES['Aries'];
  const moon = MOON_STORIES[moonSign] || MOON_STORIES['Aries'];
  const venus = VENUS_STORIES[venusSign] || VENUS_STORIES['Aries'];
  const mars = MARS_STORIES[marsSign] || MARS_STORIES['Aries'];

  const chapters: StoryChapter[] = [
    {
      id: '1',
      chapter: `Chapter 1: Sun in ${sunSign}`,
      title: sun.title,
      content: sun.content,
      isPremium: false,
      isLocked: false,
    },
    {
      id: '2',
      chapter: `Chapter 2: Moon in ${moonSign}`,
      title: moon.title,
      content: moon.content,
      preview: moon.preview,
      isPremium: true,
      isLocked: true,
    },
  ];

  if (risingSign) {
    const rising = RISING_STORIES[risingSign] || RISING_STORIES['Aries'];
    chapters.push({
      id: '3',
      chapter: `Chapter 3: ${risingSign} Rising`,
      title: rising.title,
      content: rising.content,
      preview: rising.preview,
      isPremium: true,
      isLocked: true,
    });
  }

  chapters.push(
    {
      id: '4',
      chapter: `Chapter 4: Venus in ${venusSign}`,
      title: venus.title,
      content: venus.content,
      preview: venus.preview,
      isPremium: true,
      isLocked: true,
    },
    {
      id: '5',
      chapter: `Chapter 5: Mars in ${marsSign}`,
      title: mars.title,
      content: mars.content,
      preview: mars.preview,
      isPremium: true,
      isLocked: true,
    }
  );

  return chapters;
}
