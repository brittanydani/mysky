// Mock data for Celestial Companion

// Deep psychological daily insights by theme
export const deepInsights = {
  love: [
    {
      title: 'Love',
      message: "The walls you built to protect yourself are the same ones keeping love at bay. Today asks: what if being seen is safer than hiding?",
    },
    {
      title: 'Love',
      message: "You're not too much. The right people will hold space for all of you—your intensity, your depth, your contradictions.",
    },
    {
      title: 'Love',
      message: "The love you're seeking is often mirrored in how you treat yourself in quiet moments. Are you being the partner you wish you had?",
    },
    {
      title: 'Love',
      message: "Vulnerability isn't weakness worn on the outside—it's courage that refuses to pretend anymore.",
    },
    {
      title: 'Love',
      message: "Sometimes the deepest intimacy isn't found in words but in the silences where two souls simply witness each other.",
    },
  ],
  growth: [
    {
      title: 'Growth',
      message: "The version of you that you're becoming has already begun to outgrow the story you keep telling about yourself.",
    },
    {
      title: 'Growth',
      message: "What if the thing you're most afraid to face is actually the doorway to who you're meant to become?",
    },
    {
      title: 'Growth',
      message: "You've been planted in uncomfortable soil for a reason. Some roots only grow in the dark.",
    },
    {
      title: 'Growth',
      message: "The patterns you hate repeating are also the teachers you keep ignoring. What are they trying to show you?",
    },
    {
      title: 'Growth',
      message: "Your comfort zone has become a cage disguised as safety. The key was always in your pocket.",
    },
  ],
  shadow: [
    {
      title: 'Shadow',
      message: "The traits that irritate you most in others are often reflections of parts you've disowned in yourself.",
    },
    {
      title: 'Shadow',
      message: "Your darkness isn't something to defeat—it's something to integrate. Wholeness includes all of you.",
    },
    {
      title: 'Shadow',
      message: "Behind your anger lives grief. Behind your numbness lives pain. What's your armor really protecting?",
    },
    {
      title: 'Shadow',
      message: "The story 'I'm fine' has cost you more than any honest breakdown ever would.",
    },
    {
      title: 'Shadow',
      message: "You can't heal what you won't feel. Today invites you to stop running from yourself.",
    },
  ],
  purpose: [
    {
      title: 'Purpose',
      message: "Your purpose isn't a destination you find—it's a frequency you tune into by living more honestly.",
    },
    {
      title: 'Purpose',
      message: "The things that hurt you most often point to what you were born to heal in the world.",
    },
    {
      title: 'Purpose',
      message: "Stop waiting for permission. The calling you've been ignoring won't get quieter—only more persistent.",
    },
    {
      title: 'Purpose',
      message: "You are not here to be understood by everyone. You are here to be true to something larger than approval.",
    },
    {
      title: 'Purpose',
      message: "What would you create if you weren't afraid of it being seen? That's where your gift lives.",
    },
  ],
  healing: [
    {
      title: 'Healing',
      message: "Healing isn't about becoming someone new. It's about releasing who you had to become to survive.",
    },
    {
      title: 'Healing',
      message: "The child within you is still waiting for the safety they never received. Can you offer it now?",
    },
    {
      title: 'Healing',
      message: "You don't have to forgive today. But can you soften the grip on the story, just slightly?",
    },
    {
      title: 'Healing',
      message: "Your nervous system remembers everything. Be patient—it's learning to trust safety again.",
    },
    {
      title: 'Healing',
      message: "Sometimes the bravest thing you can do is rest when everything in you says to keep pushing.",
    },
  ],
};

// Get a daily insight based on the date (rotates through different themes and messages)
export function getDailyInsight(date: Date = new Date()): { title: string; message: string } {
  const themes = Object.keys(deepInsights) as (keyof typeof deepInsights)[];
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Rotate theme based on day
  const themeIndex = dayOfYear % themes.length;
  const theme = themes[themeIndex];
  const messages = deepInsights[theme];
  
  // Rotate message within theme
  const messageIndex = Math.floor(dayOfYear / themes.length) % messages.length;
  
  return messages[messageIndex];
}

// Legacy export for backwards compatibility
export const dailyInsight = {
  date: new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }),
  love: getDailyInsight(),
  energy: {
    title: 'Energy',
    message: 'Your intuition is heightened today. Trust your inner voice.',
    icon: 'star-four-points',
  },
  growth: {
    title: 'Growth',
    message: 'Old patterns are ready to be released. Embrace change.',
    icon: 'flower-lotus',
  },
};

export const cosmicStoryChapters = [
  {
    id: '1',
    chapter: 'Chapter 1: Sun Sign',
    title: 'A Soul of Deep Feeling',
    content: `Born under the sign of Cancer, your journey is defined by the currents of emotion. Like the crab, you carry a protective shell, instinctively knowing when to retreat and when to emerge. You meet the world with intuitive wisdom, here to nurture and to be nurtured, forever connected to the moon's eternal rhythm.

Your emotional depth is not a weakness—it is your greatest gift. You sense what others cannot, feel what others miss. The tides of your heart guide you toward authentic connections and meaningful bonds.`,
    isPremium: false,
    isLocked: false,
  },
  {
    id: '2',
    chapter: 'Chapter 2: Moon Sign',
    title: 'How You Love',
    preview: 'Your heart seeks security above all...',
    content: `With your Moon in Pisces, your emotional nature flows like water through every experience. You love with a depth that transcends the ordinary, seeking soul-level connections that honor the sacred in everyday moments.

Your heart is a sanctuary of compassion. You absorb the feelings of those around you, sometimes forgetting where you end and others begin. Learning to protect your emotional energy while remaining open is your lifelong dance.`,
    isPremium: true,
    isLocked: true,
  },
  {
    id: '3',
    chapter: 'Chapter 3: Rising Sign',
    title: 'Your Outer Self',
    preview: 'The mask you show the world...',
    content: `Scorpio rising gives you an aura of mystery and intensity. Others sense your depth before you speak a word. Your presence commands attention, though you prefer to observe from the shadows before revealing yourself.`,
    isPremium: true,
    isLocked: true,
  },
  {
    id: '4',
    chapter: 'Chapter 4: Venus Placement',
    title: 'What Your Heart Desires',
    preview: 'In matters of love and beauty...',
    content: `Venus in your chart reveals your deepest desires in love and the beauty you seek in life. Your romantic nature is colored by sensitivity and imagination.`,
    isPremium: true,
    isLocked: true,
  },
  {
    id: '5',
    chapter: 'Chapter 5: Mars Energy',
    title: 'How You Take Action',
    preview: 'Your drive and passion flow through...',
    content: `Mars reveals how you assert yourself, pursue desires, and channel your vital energy into the world.`,
    isPremium: true,
    isLocked: true,
  },
];

export const healingInsights = [
  {
    id: '1',
    title: 'Inner Child Needs',
    subtitle: 'Nurturing Your Core Self',
    content: 'Nurture your sense of play. Acknowledge past wounds with compassion.',
    fullContent: `Your inner child carries the memories of your earliest emotional experiences. With Cancer sun and Pisces moon, your inner child craves safety, unconditional love, and the freedom to feel deeply without judgment.

To heal, create spaces of safety where your emotions can flow freely. Honor your need for nurturing through gentle self-care rituals. Remember: your sensitivity was always a gift, even when the world didn't understand.`,
    icon: 'heart',
    isPremium: false,
    isLocked: false,
  },
  {
    id: '2',
    title: 'Fear Patterns',
    subtitle: 'Identifying the Root of Your Anxiety',
    content: 'Identifying the root of your anxiety... and more...',
    fullContent: `Your deepest fears often stem from early experiences of emotional invalidation. The fear of abandonment and rejection runs deep, creating patterns of people-pleasing or withdrawal.

Understanding these patterns is the first step to freedom. Your fears are not failures—they are messengers pointing toward unhealed wounds that deserve your compassion.`,
    icon: 'shield',
    isPremium: true,
    isLocked: true,
  },
  {
    id: '3',
    title: 'Attachment Themes',
    subtitle: 'Exploring How You Connect',
    content: 'Exploring how you connect with others...',
    fullContent: `Your attachment style reflects the blueprint of your earliest bonds. Understanding how you attach helps you create healthier, more conscious relationships.`,
    icon: 'link',
    isPremium: true,
    isLocked: true,
  },
  {
    id: '4',
    title: 'Shadow Work',
    subtitle: 'Integrating Your Hidden Self',
    content: 'The parts of yourself you\'ve hidden away...',
    fullContent: `Shadow work involves embracing the parts of yourself you've denied or hidden. Your shadow holds immense power waiting to be reclaimed.`,
    icon: 'moon-new',
    isPremium: true,
    isLocked: true,
  },
];

export const growthThemes = [
  {
    id: '1',
    title: 'Current Growth Theme',
    subtitle: 'What You\'re Learning Now',
    content: 'Learning to set boundaries while remaining open-hearted. Finding strength in vulnerability.',
    icon: 'trending-up',
    isPremium: false,
  },
  {
    id: '2',
    title: 'Life Purpose Hints',
    subtitle: 'Where Your Path Leads',
    content: 'Your soul is learning the balance between giving and receiving...',
    icon: 'compass',
    isPremium: true,
  },
];

export const relationshipInsights = {
  communicationStyle: {
    title: 'Communication Style',
    content: 'You communicate through feeling first, words second. Your intuition often speaks before logic.',
    isPremium: false,
  },
  emotionalNeeds: {
    title: 'Emotional Needs',
    content: 'You need emotional safety, consistent reassurance, and partners who honor your depth.',
    isPremium: false,
  },
  growthAreas: {
    title: 'Growth Areas',
    content: 'Learning to express needs directly, setting healthy boundaries, and trusting your worthiness of love.',
    isPremium: true,
  },
};

export const journalEntries = [
  {
    id: '1',
    date: 'December 2, 2024',
    mood: 'reflective',
    moonPhase: 'Waning Crescent',
    content: 'Today I noticed how much I\'ve been holding back my true feelings. The moon\'s energy feels so aligned with my need for release.',
    tags: ['self-reflection', 'emotions', 'release'],
    isSynced: false, // Local only for free users
  },
  {
    id: '2',
    date: 'December 1, 2024',
    mood: 'hopeful',
    moonPhase: 'Waning Crescent',
    content: 'Had a meaningful conversation with someone I trust. It reminded me that vulnerability is strength.',
    tags: ['connection', 'vulnerability', 'growth'],
    isSynced: false,
  },
  {
    id: '3',
    date: 'November 30, 2024',
    mood: 'calm',
    moonPhase: 'Third Quarter',
    content: 'Spent time in nature today. The stillness helped me reconnect with my inner voice.',
    tags: ['nature', 'peace', 'intuition'],
    isSynced: false,
  },
];

export const moodOptions = [
  { id: 'peaceful', label: 'Peaceful', emoji: '✨', color: '#6EBF8B' },
  { id: 'reflective', label: 'Reflective', emoji: '🌙', color: '#7B8FBF' },
  { id: 'hopeful', label: 'Hopeful', emoji: '🌟', color: '#C9A962' },
  { id: 'calm', label: 'Calm', emoji: '🌊', color: '#5B9BD5' },
  { id: 'anxious', label: 'Anxious', emoji: '🌪', color: '#B87A7A' },
  { id: 'grateful', label: 'Grateful', emoji: '💫', color: '#9B7BBF' },
];

export const premiumFeatures = [
  {
    id: '1',
    title: 'Full Natal Story (10+ chapters)',
    icon: 'book-open',
  },
  {
    id: '2',
    title: 'Personalized Daily Guidance',
    icon: 'sparkles',
  },
  {
    id: '3',
    title: 'Deep Healing & Trauma Insights',
    icon: 'heart',
  },
  {
    id: '4',
    title: 'Unlimited Relationship Charts',
    icon: 'users',
  },
  {
    id: '5',
    title: 'Advanced Journaling & Patterns',
    icon: 'edit-3',
  },
  {
    id: '6',
    title: 'Encrypted Backup & Restore Across Devices',
    icon: 'cloud',
  },
  {
    id: '7',
    title: 'Secure Chart & Journal Backup',
    icon: 'shield-checkmark',
  },
  {
    id: '8',
    title: 'Exclusive Visual Themes',
    icon: 'color-palette',
  },
];

export const quickAccessCards = [
  {
    id: 'story',
    title: 'Your Cosmic Story',
    icon: 'book',
    route: '/(tabs)/story',
  },
  {
    id: 'healing',
    title: 'Healing Insights',
    icon: 'heart',
    route: '/(tabs)/healing',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    icon: 'users',
    route: '/relationships',
  },
];
