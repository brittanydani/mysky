// Pluto House Insight Expansion (Chapter 10)
const PLUTO_HOUSE_INSIGHT: Record<number, string> = {
  1: `🌑 House Insight — Pluto in the 1st House\n\nWith your Pluto in the 1st house, shadow work centers on identity and power. You may carry an unconscious fear of being controlled, seen too closely, or losing autonomy. Early experiences likely shaped how you present yourself for survival. You may oscillate between intensity and self-protection. Healing comes from allowing yourself to exist without armor.`,
  2: `🌑 House Insight — Pluto in the 2nd House\n\nWith your Pluto in the 2nd house, shadow patterns involve self-worth, control, and security. You may equate safety with possession or stability. Loss can feel threatening on a deep level. You might cling to what feels familiar even when it no longer serves you. Healing begins when worth becomes internal rather than conditional.`,
  3: `🌑 House Insight — Pluto in the 3rd House\n\nWith your Pluto in the 3rd house, shadow work involves communication and truth. You may have learned that words carry power — or danger. Silence, secrecy, or over-control of expression can become protective strategies. You may fear being misunderstood. Healing comes from reclaiming your voice without fear of consequence.`,
  4: `🌑 House Insight — Pluto in the 4th House\n\nWith your Pluto in the 4th house, shadow work is rooted in early emotional experiences. Family dynamics or childhood environments may have shaped deep survival patterns. Emotional safety may feel fragile or conditional. You may guard your inner world fiercely. Healing begins by transforming inherited patterns rather than repeating them.`,
  5: `🌑 House Insight — Pluto in the 5th House\n\nWith your Pluto in the 5th house, shadow work centers on joy, creativity, and vulnerability. You may fear being truly seen or loved for who you are. Pleasure may feel risky or tied to control. You might suppress playfulness to avoid exposure. Healing comes from reclaiming joy without fear of loss.`,
  6: `🌑 House Insight — Pluto in the 6th House\n\nWith your Pluto in the 6th house, shadow patterns involve control, perfectionism, and self-discipline. You may use routine or productivity to feel safe. Burnout can arise when worth becomes tied to usefulness. Letting go can feel dangerous. Healing comes from trusting yourself beyond performance.`,
  7: `🌑 House Insight — Pluto in the 7th House\n\nWith your Pluto in the 7th house, shadow work unfolds through relationships. Power dynamics, control, or fear of abandonment may surface. You may attract intense or transformative connections. Vulnerability can feel risky. Healing begins by redefining intimacy without dominance or fear.`,
  8: `🌑 House Insight — Pluto in the 8th House\n\nWith your Pluto in the 8th house, shadow work is intense and unavoidable. You are deeply familiar with loss, change, or emotional depth. Control may feel necessary for survival. Trust can be difficult. Healing comes from surrendering to transformation rather than resisting it.`,
  9: `🌑 House Insight — Pluto in the 9th House\n\nWith your Pluto in the 9th house, shadow patterns involve belief systems and truth. You may cling tightly to meaning or fear losing your worldview. Challenges to belief can feel threatening. You may fear being wrong. Healing comes from allowing beliefs to evolve rather than defend.`,
  10: `🌑 House Insight — Pluto in the 10th House\n\nWith your Pluto in the 10th house, shadow work involves authority, visibility, and control. You may fear failure or exposure. Power struggles with authority figures may arise. Identity can become tied to achievement. Healing begins by separating worth from status.`,
  11: `🌑 House Insight — Pluto in the 11th House\n\nWith your Pluto in the 11th house, shadow work centers on belonging and group dynamics. You may fear exclusion or betrayal. Power struggles within communities may surface. You may oscillate between involvement and withdrawal. Healing comes from trusting connection without self-erasure.`,
  12: `🌑 House Insight — Pluto in the 12th House\n\nWith your Pluto in the 12th house, shadow work operates beneath awareness. Deep fears or emotional patterns may feel hidden even from yourself. You may carry collective or ancestral weight. Solitude may feel both necessary and frightening. Healing comes from compassion toward what has remained unseen.`
};
// North Node House Insight Expansion (Chapter 9)
const NORTH_NODE_HOUSE_INSIGHT: Record<number, string> = {
  1: `🧭 House Insight — North Node in the 1st House\n\nWith your North Node in the 1st house, your soul’s purpose centers on self-definition. Growth comes from learning to lead with your own identity rather than shaping yourself around others. You are here to develop courage, autonomy, and self-trust. Over-reliance on external validation can pull you off course. Purpose unfolds when you choose yourself intentionally.`,
  2: `🧭 House Insight — North Node in the 2nd House\n\nWith your North Node in the 2nd house, your purpose involves developing self-worth and stability. You are learning to value yourself independently of others’ resources or approval. Growth comes from building something tangible and trusting your values. Dependence on emotional or material entanglement can feel familiar but limiting. Purpose strengthens when security becomes internal.`,
  3: `🧭 House Insight — North Node in the 3rd House\n\nWith your North Node in the 3rd house, your soul’s path involves communication and curiosity. You are here to learn, ask questions, and share ideas openly. Over-intellectual distance or rigid belief can block growth. Purpose emerges through dialogue, listening, and staying mentally flexible. Your voice matters more than certainty.`,
  4: `🧭 House Insight — North Node in the 4th House\n\nWith your North Node in the 4th house, purpose centers on emotional grounding and belonging. You are learning to prioritize inner life over external achievement. Growth comes from building emotional security and honoring personal roots. Over-identification with status can feel familiar but hollow. Purpose unfolds when home becomes internal.`,
  5: `🧭 House Insight — North Node in the 5th House\n\nWith your North Node in the 5th house, your soul’s purpose involves creative expression and joy. You are here to take emotional risks and live from the heart. Suppressing individuality to stay safe can limit growth. Purpose grows when you allow yourself to be seen authentically. Joy is a guide, not a distraction.`,
  6: `🧭 House Insight — North Node in the 6th House\n\nWith your North Node in the 6th house, purpose unfolds through meaningful service and responsibility. You are learning to show up consistently and improve systems over time. Escaping into abstraction or avoidance can feel tempting. Growth comes from engaging with daily life consciously. Purpose strengthens when effort aligns with integrity.`,
  7: `🧭 House Insight — North Node in the 7th House\n\nWith your North Node in the 7th house, your soul’s path involves partnership and cooperation. You are here to learn balance through relationship rather than self-sufficiency alone. Avoiding dependence can block growth. Purpose unfolds through mutual respect and shared understanding. Connection becomes a teacher.`,
  8: `🧭 House Insight — North Node in the 8th House\n\nWith your North Node in the 8th house, purpose involves depth and emotional transformation. You are here to face vulnerability and trust change. Clinging to comfort or surface stability can hold you back. Growth comes from emotional honesty and shared power. Purpose deepens through healing.`,
  9: `🧭 House Insight — North Node in the 9th House\n\nWith your North Node in the 9th house, your soul’s purpose is tied to truth and expansion. You are here to explore belief, philosophy, and perspective. Staying small or overly familiar can limit growth. Purpose unfolds through curiosity and openness. Meaning guides your evolution.`,
  10: `🧭 House Insight — North Node in the 10th House\n\nWith your North Node in the 10th house, purpose involves contribution and visibility. You are learning to step into responsibility and leadership. Avoiding recognition may feel safer but limits growth. Purpose strengthens through integrity in action. You are here to build something meaningful in the world.`,
  11: `🧭 House Insight — North Node in the 11th House\n\nWith your North Node in the 11th house, your soul’s purpose is connected to community and shared vision. You are here to contribute to something larger than yourself. Isolation or excessive individualism can block growth. Purpose unfolds through collaboration and ideals. Belonging fuels evolution.`,
  12: `🧭 House Insight — North Node in the 12th House\n\nWith your North Node in the 12th house, purpose unfolds quietly and internally. You are learning to trust intuition, surrender control, and develop compassion. Over-identification with external achievement can pull you away from growth. Purpose emerges through inner alignment rather than visibility. Faith becomes your compass.`
};
// Jupiter House Insight Expansion (Chapter 8)
const JUPITER_HOUSE_INSIGHT: Record<number, string> = {
  1: `🌍 House Insight — Jupiter in the 1st House\n\nWith your Jupiter in the 1st house, growth comes through trusting yourself and taking up space. Expansion happens when you allow your personality, beliefs, and presence to lead. Confidence grows as you act on faith in who you are becoming. You learn by doing, not waiting. Growth accelerates when you stop minimizing yourself.`,
  2: `🌍 House Insight — Jupiter in the 2nd House\n\nWith your Jupiter in the 2nd house, growth is closely tied to self-worth and stability. Expansion occurs when you trust your value and invest in what supports you. Abundance grows through alignment with values rather than excess. You learn that believing in your worth creates opportunity. Growth strengthens when security feels internal, not conditional.`,
  3: `🌍 House Insight — Jupiter in the 3rd House\n\nWith your Jupiter in the 3rd house, growth unfolds through curiosity and communication. Expansion comes from learning, teaching, and sharing ideas. You evolve by staying mentally open and engaged. Conversations broaden perspective. Growth thrives when you allow yourself to explore without needing immediate certainty.`,
  4: `🌍 House Insight — Jupiter in the 4th House\n\nWith your Jupiter in the 4th house, growth begins internally. Expansion comes from emotional security and healing foundational patterns. You grow when you feel safe enough to explore the world from a stable base. Inner work supports outer success. Growth deepens when you trust that home can exist within you.`,
  5: `🌍 House Insight — Jupiter in the 5th House\n\nWith your Jupiter in the 5th house, growth is fueled by joy, creativity, and self-expression. Expansion happens when you allow yourself to take emotional risks. Playfulness and passion open doors. You grow by following what excites you. Growth thrives when life feels meaningful and alive.`,
  6: `🌍 House Insight — Jupiter in the 6th House\n\nWith your Jupiter in the 6th house, growth unfolds through effort and refinement. Expansion comes from improving skills and systems over time. You learn through consistency and service. Growth feels earned rather than sudden. Meaning develops when daily effort aligns with purpose.`,
  7: `🌍 House Insight — Jupiter in the 7th House\n\nWith your Jupiter in the 7th house, growth occurs through relationships. Expansion comes from learning through others’ perspectives. You evolve through cooperation and shared experience. Growth strengthens when partnerships feel mutually supportive. You learn that connection expands understanding.`,
  8: `🌍 House Insight — Jupiter in the 8th House\n\nWith your Jupiter in the 8th house, growth comes through depth and emotional transformation. Expansion requires facing vulnerability and change. You grow by shedding old layers and trusting resilience. Growth is not always comfortable here, but it is profound. Meaning emerges through healing and renewal.`,
  9: `🌍 House Insight — Jupiter in the 9th House\n\nWith your Jupiter in the 9th house, growth comes naturally through exploration and belief. Expansion occurs through travel, philosophy, or higher learning. You grow by broadening perspective. Limitation feels stifling. Growth thrives when curiosity is honored.`,
  10: `🌍 House Insight — Jupiter in the 10th House\n\nWith your Jupiter in the 10th house, growth unfolds through achievement and responsibility. Expansion comes from stepping into visible roles. You grow when your ambitions align with integrity. Recognition reinforces belief in your path. Growth strengthens when leadership feels meaningful.`,
  11: `🌍 House Insight — Jupiter in the 11th House\n\nWith your Jupiter in the 11th house, growth comes through shared vision and connection. Expansion occurs when you engage with groups or causes. You learn through collaboration. Growth feels expansive when ideals are shared. Belonging supports evolution.`,
  12: `🌍 House Insight — Jupiter in the 12th House\n\nWith your Jupiter in the 12th house, growth unfolds quietly and internally. Expansion comes through reflection, spirituality, or compassion. You grow when you trust inner guidance. Solitude supports insight. Growth strengthens through faith rather than proof.`
};
// House Insight Library for Mercury (Inner Child)
const MERCURY_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Mercury in the 1st House',
    text: `With your Mercury in the 1st house, your inner child expresses itself quickly and openly. Thoughts, feelings, and reactions emerge before they can be filtered. Being heard and acknowledged matters deeply. When this child is ignored or dismissed, frustration arises. Safety grows when expression is met with respect rather than correction.`
  },
  2: {
    label: '🏠 House Insight — Mercury in the 2nd House',
    text: `With your Mercury in the 2nd house, your inner child needs reassurance and consistency. Safety comes from predictable responses and steady communication. Sudden changes or mixed messages can feel unsettling. Words that affirm worth help this child feel secure. Trust builds slowly and deeply here.`
  },
  3: {
    label: '🏠 House Insight — Mercury in the 3rd House',
    text: `With your Mercury in the 3rd house, the inner child is curious, talkative, and mentally alert. Questions, storytelling, and learning are sources of safety. Being encouraged to ask, explore, and express ideas builds confidence. Silence or dismissal can feel deeply invalidating. This child thrives when curiosity is welcomed.`
  },
  4: {
    label: '🏠 House Insight — Mercury in the 4th House',
    text: `With your Mercury in the 4th house, the inner child thinks and feels deeply. Memories, tone, and emotional atmosphere matter more than words alone. Safety comes from gentle communication and emotional attunement. Harsh language can wound deeply. Trust grows when conversation feels nurturing rather than corrective.`
  },
  5: {
    label: '🏠 House Insight — Mercury in the 5th House',
    text: `With your Mercury in the 5th house, the inner child communicates through play and creativity. Humor, imagination, and storytelling are emotional outlets. Being taken seriously doesn’t mean being serious. When expression is stifled, joy dims. This child heals through fun, creativity, and freedom of voice.`
  },
  6: {
    label: '🏠 House Insight — Mercury in the 6th House',
    text: `With your Mercury in the 6th house, the inner child feels safest when expectations are clear. Order, routine, and constructive feedback provide security. Confusion can lead to anxiety. This child may become overly self-critical to avoid mistakes. Healing comes from kindness in communication, not perfection.`
  },
  7: {
    label: '🏠 House Insight — Mercury in the 7th House',
    text: `With your Mercury in the 7th house, the inner child learns through interaction. Conversation and feedback shape identity. Being listened to validates existence. Conflict can feel threatening when communication breaks down. Safety grows when dialogue remains respectful and mutual.`
  },
  8: {
    label: '🏠 House Insight — Mercury in the 8th House',
    text: `With your Mercury in the 8th house, the inner child thinks deeply and privately. Not everything is shared easily. Trust must be established before expression feels safe. Words carry emotional weight. Healing comes when secrecy becomes choice rather than fear.`
  },
  9: {
    label: '🏠 House Insight — Mercury in the 9th House',
    text: `With your Mercury in the 9th house, the inner child seeks meaning through understanding. Questions about truth, belief, and purpose arise early. Being allowed to explore ideas builds safety. Dismissal of curiosity can feel invalidating. This child feels secure when curiosity is encouraged, not constrained.`
  },
  10: {
    label: '🏠 House Insight — Mercury in the 10th House',
    text: `With your Mercury in the 10th house, the inner child learns to communicate responsibly. Being taken seriously matters. Words may be chosen carefully to maintain respect. Playfulness can be overshadowed by expectations. Healing involves allowing expression without pressure to perform.`
  },
  11: {
    label: '🏠 House Insight — Mercury in the 11th House',
    text: `With your Mercury in the 11th house, the inner child thrives on shared ideas and belonging. Group conversations and friendships feel regulating. Feeling excluded can wound deeply. Safety comes from inclusion and mutual exchange. Expression is strongest when community feels supportive.`
  },
  12: {
    label: '🏠 House Insight — Mercury in the 12th House',
    text: `With your Mercury in the 12th house, the inner child communicates subtly and intuitively. Thoughts may be expressed through imagery, feeling, or silence. Loud or demanding environments feel unsafe. This child needs gentle space to speak. Healing comes from honoring quiet understanding as valid communication.`
  }
};
// ...existing code...
// House Insight Library for Moon (How You Protect Yourself)
const MOON_PROTECTION_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Moon in the 1st House',
    text: `With your Moon in the 1st house, protection happens instinctively and immediately. Emotional reactions show quickly, often before you’ve had time to process them. You protect yourself by asserting presence and responding in real time. Vulnerability can feel exposed, so you may rely on quick emotional expression as a shield. Learning when to pause before reacting strengthens your sense of safety.`
  },
  2: {
    label: '🏠 House Insight — Moon in the 2nd House',
    text: `With your Moon in the 2nd house, emotional protection comes from stability and predictability. You guard yourself by creating routines, securing resources, and maintaining consistency. Sudden change can feel threatening, even when it’s not intended that way. You feel safest when you know what to expect. Self-soothing often involves grounding and reassurance.`
  },
  3: {
    label: '🏠 House Insight — Moon in the 3rd House',
    text: `With your Moon in the 3rd house, you protect yourself by thinking things through. Naming emotions, talking them out, or seeking explanations helps you feel safer. Confusion can trigger anxiety, while clarity restores calm. You may intellectualize feelings before fully experiencing them. Emotional safety grows when communication feels open and validating.`
  },
  4: {
    label: '🏠 House Insight — Moon in the 4th House',
    text: `With your Moon in the 4th house, protection happens inwardly. When emotions feel unsafe, you retreat into privacy or familiar environments. Home — physical or emotional — becomes your refuge. You may guard your inner world carefully. Safety is restored when you feel emotionally held and unpressured.`
  },
  5: {
    label: '🏠 House Insight — Moon in the 5th House',
    text: `With your Moon in the 5th house, protection comes through emotional expression. Play, creativity, or emotional honesty help release tension. Suppressing feelings can feel unsafe or constricting. You protect yourself by allowing emotions to move outward. Joy becomes a form of emotional regulation.`
  },
  6: {
    label: '🏠 House Insight — Moon in the 6th House',
    text: `With your Moon in the 6th house, you protect yourself by managing details and maintaining order. Structure, routines, and problem-solving help you feel emotionally secure. Stress often shows up physically when emotions aren’t addressed directly. You may prioritize fixing over feeling. Safety increases when you balance care for others with care for yourself.`
  },
  7: {
    label: '🏠 House Insight — Moon in the 7th House',
    text: `With your Moon in the 7th house, protection is tied to relationships. Emotional safety comes from feeling supported, understood, and mirrored by others. Conflict or disconnection can feel destabilizing. You may prioritize harmony to avoid emotional threat. Boundaries help maintain safety without sacrificing closeness.`
  },
  8: {
    label: '🏠 House Insight — Moon in the 8th House',
    text: `With your Moon in the 8th house, protection involves emotional control and privacy. You feel deeply but reveal selectively. Trust must be established before vulnerability feels safe. Emotional exposure can feel risky. Healing comes from learning when depth is supportive rather than dangerous.`
  },
  9: {
    label: '🏠 House Insight — Moon in the 9th House',
    text: `With your Moon in the 9th house, you protect yourself by seeking perspective. Understanding the larger meaning behind experiences helps regulate emotion. Feeling trapped or hopeless can trigger emotional distress. Beliefs, spirituality, or philosophy offer emotional shelter. Safety grows when you trust your inner compass.`
  },
  10: {
    label: '🏠 House Insight — Moon in the 10th House',
    text: `With your Moon in the 10th house, protection often comes through emotional restraint. You may feel safest when appearing capable and in control. Vulnerability can feel risky in visible roles. Emotions may be managed privately. Emotional safety increases when you allow yourself to be human, not just dependable.`
  },
  11: {
    label: '🏠 House Insight — Moon in the 11th House',
    text: `With your Moon in the 11th house, protection is tied to belonging and shared vision. Feeling included helps regulate emotions. Isolation can feel threatening. You may look to friendships or communities for reassurance. Emotional safety grows when connections feel authentic rather than obligatory.`
  },
  12: {
    label: '🏠 House Insight — Moon in the 12th House',
    text: `With your Moon in the 12th house, protection happens through withdrawal and solitude. You absorb emotional atmosphere easily, so retreat helps regulate overwhelm. Boundaries between your feelings and others’ can blur. Rest, reflection, and quiet are essential. Emotional safety comes from honoring sensitivity as strength.`
  }
};
// ...existing code...
// House Insight Library for Mars (How You Fight)
const MARS_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Mars in the 1st House',
    text: `With your Mars in the 1st house, conflict is immediate and instinctive. You respond quickly when challenged and prefer addressing issues head-on rather than letting them linger. Anger rises fast but often passes just as quickly once expressed. You feel most empowered when you can assert yourself directly. Suppressing anger can lead to restlessness or frustration.`
  },
  2: {
    label: '🏠 House Insight — Mars in the 2nd House',
    text: `With your Mars in the 2nd house, you fight to protect what you value. Conflict often arises around security, boundaries, or self-worth. You may tolerate tension quietly until something you depend on feels threatened. Once engaged, your stance is firm and unwavering. Anger here is slow-burning but deeply rooted.`
  },
  3: {
    label: '🏠 House Insight — Mars in the 3rd House',
    text: `With your Mars in the 3rd house, conflict plays out through words and ideas. Arguments may emerge quickly through debate, tone, or communication style. You fight by expressing your point of view clearly and forcefully. Mental stimulation can escalate tension. Resolution comes through honest dialogue rather than avoidance.`
  },
  4: {
    label: '🏠 House Insight — Mars in the 4th House',
    text: `With your Mars in the 4th house, conflict is deeply personal. Anger is tied to emotional security and past experiences. You may withdraw or become defensive when feeling threatened at a core level. Family or close relationships often activate this placement. Healing requires creating emotional safety before resolution.`
  },
  5: {
    label: '🏠 House Insight — Mars in the 5th House',
    text: `With your Mars in the 5th house, anger seeks expression. Conflict may come out dramatically, creatively, or emotionally. You fight passionately and from the heart. Feeling ignored or unappreciated can trigger frustration. Resolution comes when you feel seen and acknowledged.`
  },
  6: {
    label: '🏠 House Insight — Mars in the 6th House',
    text: `With your Mars in the 6th house, conflict is managed through control and practicality. You may express anger through irritability, criticism, or overworking rather than direct confrontation. Stress often shows up physically. You fight by fixing problems. Balance comes from addressing emotional needs, not just tasks.`
  },
  7: {
    label: '🏠 House Insight — Mars in the 7th House',
    text: `With your Mars in the 7th house, conflict arises most clearly in relationships. You may attract assertive or confrontational dynamics. Fighting feels intertwined with connection. You may oscillate between assertion and accommodation. Learning healthy boundaries transforms conflict into growth.`
  },
  8: {
    label: '🏠 House Insight — Mars in the 8th House',
    text: `With your Mars in the 8th house, conflict is intense and emotionally charged. Anger runs deep and can be tied to control, trust, or vulnerability. You may hold resentment quietly before releasing it powerfully. Power struggles can surface. Healing comes through honest confrontation and emotional courage.`
  },
  9: {
    label: '🏠 House Insight — Mars in the 9th House',
    text: `With your Mars in the 9th house, conflict centers on beliefs and truth. You fight for what you believe in and can become passionate in debates. Challenges to your worldview may feel personal. You seek meaning even in disagreement. Resolution comes through mutual understanding rather than winning.`
  },
  10: {
    label: '🏠 House Insight — Mars in the 10th House',
    text: `With your Mars in the 10th house, conflict is tied to authority and responsibility. You may suppress anger in public settings to maintain composure. Frustration can build around ambition or recognition. You fight strategically rather than impulsively. Healthy expression requires acknowledging personal needs alongside goals.`
  },
  11: {
    label: '🏠 House Insight — Mars in the 11th House',
    text: `With your Mars in the 11th house, conflict arises around groups, ideals, or shared goals. You may fight for causes or within friendships. Tension often surfaces when values clash. You feel energized defending collective vision. Resolution comes through aligning action with shared purpose.`
  },
  12: {
    label: '🏠 House Insight — Mars in the 12th House',
    text: `With your Mars in the 12th house, anger is often hidden or internalized. You may avoid confrontation until emotions surface indirectly. Conflict can feel overwhelming or confusing. You fight silently, through withdrawal or inner struggle. Healing comes from acknowledging anger without shame.`
  }
};
// ...existing code...
// House Insight Library for Venus (How You Love)
const VENUS_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Venus in the 1st House',
    text: `With your Venus in the 1st house, love is something you embody rather than hide. Others often experience warmth, charm, or affection simply by being around you. You express love through presence, openness, and emotional availability. Feeling desirable and appreciated reinforces your sense of connection. When love feels unseen, it can affect your confidence deeply.`
  },
  2: {
    label: '🏠 House Insight — Venus in the 2nd House',
    text: `With your Venus in the 2nd house, love is tied to stability, loyalty, and shared values. You feel most connected when relationships feel dependable and grounded. Consistency matters more than grand gestures. Love is expressed through care, reliability, and building something lasting together. Emotional safety grows when trust is steady.`
  },
  3: {
    label: '🏠 House Insight — Venus in the 3rd House',
    text: `With your Venus in the 3rd house, affection flows through conversation and mental connection. Words of affirmation, shared ideas, and daily communication strengthen bonds. You feel closest when dialogue feels easy and mutual. Silence or miscommunication can create distance quickly. Love thrives when curiosity stays alive.`
  },
  4: {
    label: '🏠 House Insight — Venus in the 4th House',
    text: `With your Venus in the 4th house, love is deeply tied to emotional safety and belonging. You bond through intimacy, trust, and shared private space. Feeling emotionally held matters more than outward display. Love deepens when relationships feel like home. Without that sense of safety, connection feels fragile.`
  },
  5: {
    label: '🏠 House Insight — Venus in the 5th House',
    text: `With your Venus in the 5th house, love wants to be expressed joyfully and openly. Romance, creativity, and play are essential for connection. You feel most loved when affection feels fun, spontaneous, and heartfelt. Suppressing romance dulls emotional intimacy. Love flourishes when joy is shared freely.`
  },
  6: {
    label: '🏠 House Insight — Venus in the 6th House',
    text: `With your Venus in the 6th house, love is shown through service and attentiveness. You express affection by helping, supporting, and being useful to the people you care about. Small acts of care carry deep meaning. Over-giving can become draining if not balanced. Love feels safest when effort is mutual.`
  },
  7: {
    label: '🏠 House Insight — Venus in the 7th House',
    text: `With your Venus in the 7th house, relationships are central to how you experience love. You thrive in mutual, balanced partnerships. Connection feels strongest when there is equality and shared commitment. You value harmony and cooperation deeply. Love grows when both people feel chosen.`
  },
  8: {
    label: '🏠 House Insight — Venus in the 8th House',
    text: `With your Venus in the 8th house, love is intense, private, and transformative. You bond deeply and expect emotional honesty. Superficial relationships feel unsatisfying. Trust is essential before vulnerability unfolds. Love changes you — and you don’t enter it lightly.`
  },
  9: {
    label: '🏠 House Insight — Venus in the 9th House',
    text: `With your Venus in the 9th house, love is tied to growth and shared meaning. You connect through exploration, belief, and shared values. Relationships thrive when they expand your worldview. Feeling confined or stagnant weakens intimacy. Love feels aligned when it inspires growth.`
  },
  10: {
    label: '🏠 House Insight — Venus in the 10th House',
    text: `With your Venus in the 10th house, love is influenced by respect and recognition. You value partners who admire your efforts and ambitions. Affection may be expressed through support of goals and public alignment. Love feels secure when it’s taken seriously. Mutual pride strengthens bonds.`
  },
  11: {
    label: '🏠 House Insight — Venus in the 11th House',
    text: `With your Venus in the 11th house, love grows from friendship and shared ideals. Connection thrives when values align and mutual respect exists. You feel closest when love feels free rather than possessive. Social bonds and community may support romance. Love flourishes when individuality is honored.`
  },
  12: {
    label: '🏠 House Insight — Venus in the 12th House',
    text: `With your Venus in the 12th house, love is gentle, private, and deeply compassionate. You bond through empathy and emotional understanding. Affection may be expressed quietly rather than openly. Boundaries can blur if love becomes self-sacrificing. Love is healthiest when compassion includes yourself.`
  }
};
// ...existing code...
// House Insight Library for Ascendant (First Impression)
const ASCENDANT_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Ascendant in the 1st House',
    text: `With your Ascendant in the 1st house, your presence is immediate and unmistakable. Others quickly sense who you are and how you move through the world. You tend to meet life head-on, and your reactions shape first impressions strongly. People often feel like they “see” you clearly right away. Authenticity is central to how you’re perceived.`
  },
  2: {
    label: '🏠 House Insight — Ascendant in the 2nd House',
    text: `With your Ascendant in the 2nd house, you come across as steady, calm, and grounded. Others may sense reliability and practicality in you before anything else. Your presence feels solid rather than rushed. You tend to make people feel safe through consistency. First impressions are built on trust rather than flash.`
  },
  3: {
    label: '🏠 House Insight — Ascendant in the 3rd House',
    text: `With your Ascendant in the 3rd house, you appear curious, alert, and mentally engaged. Others often notice your communication style immediately. You may come across as talkative, thoughtful, or quick-witted. Interaction feels natural and easy around you. First impressions are shaped through conversation.`
  },
  4: {
    label: '🏠 House Insight — Ascendant in the 4th House',
    text: `With your Ascendant in the 4th house, you often come across as gentle, private, or emotionally familiar. People may feel a sense of comfort or nostalgia around you without knowing why. Your presence can feel protective or quietly nurturing. You don’t reveal everything right away. First impressions tend to feel personal rather than performative.`
  },
  5: {
    label: '🏠 House Insight — Ascendant in the 5th House',
    text: `With your Ascendant in the 5th house, your presence feels expressive and alive. Others often notice warmth, creativity, or playfulness immediately. You tend to stand out without trying. Your energy invites engagement and response. First impressions feel joyful or memorable.`
  },
  6: {
    label: '🏠 House Insight — Ascendant in the 6th House',
    text: `With your Ascendant in the 6th house, you come across as attentive, capable, and quietly observant. Others may sense diligence or helpfulness before personality. You notice details quickly and respond thoughtfully. Your presence feels practical rather than flashy. First impressions suggest reliability and competence.`
  },
  7: {
    label: '🏠 House Insight — Ascendant in the 7th House',
    text: `With your Ascendant in the 7th house, you naturally appear approachable and socially aware. Others often feel invited into connection with you. Your presence feels cooperative and responsive. You tend to mirror social energy easily. First impressions are shaped through interaction rather than assertion.`
  },
  8: {
    label: '🏠 House Insight — Ascendant in the 8th House',
    text: `With your Ascendant in the 8th house, your presence carries depth and intensity. Others may sense emotional weight or mystery right away. You often provoke curiosity or strong reactions without trying. Not everyone feels immediately comfortable, but few feel indifferent. First impressions tend to linger.`
  },
  9: {
    label: '🏠 House Insight — Ascendant in the 9th House',
    text: `With your Ascendant in the 9th house, you come across as open-minded and expansive. Others may sense curiosity, optimism, or philosophical depth. Your presence feels exploratory rather than fixed. You often appear interested in ideas, growth, or meaning. First impressions suggest possibility and movement.`
  },
  10: {
    label: '🏠 House Insight — Ascendant in the 10th House',
    text: `With your Ascendant in the 10th house, you tend to appear composed and purposeful. Others may perceive you as capable, responsible, or authoritative early on. Your presence carries a sense of direction. You often seem more put-together than you feel. First impressions are shaped by how you carry responsibility.`
  },
  11: {
    label: '🏠 House Insight — Ascendant in the 11th House',
    text: `With your Ascendant in the 11th house, you come across as friendly and community-oriented. Others may feel like you’re easy to connect with socially. Your presence feels inclusive rather than hierarchical. You often appear open to different perspectives. First impressions suggest approachability and shared vision.`
  },
  12: {
    label: '🏠 House Insight — Ascendant in the 12th House',
    text: `With your Ascendant in the 12th house, your presence can feel subtle or hard to define. Others may sense sensitivity or depth without clear explanation. You don’t always reveal yourself immediately. Your energy blends into environments easily. First impressions can feel quiet, intuitive, or mysterious.`
  }
};
// ...existing code...
// House Insight Library for Moon (Emotional World)
const MOON_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Moon in the 1st House',
    text: `With your Moon in the 1st house, emotions are close to the surface and immediately felt. You experience feelings through your body and presence before you can intellectualize them. Others often sense your emotional state without you saying a word. Emotional authenticity is essential for your well-being, but it can also leave you feeling exposed. Learning when to express and when to protect your feelings is key to emotional balance.`
  },
  2: {
    label: '🏠 House Insight — Moon in the 2nd House',
    text: `With your Moon in the 2nd house, emotional safety is closely tied to stability and consistency. You regulate feelings through routine, reliability, and knowing what you can depend on. Sudden changes can feel deeply unsettling, even if they seem minor to others. Self-worth and emotional comfort are intertwined here. When you feel grounded materially or practically, your emotional world settles as well.`
  },
  3: {
    label: '🏠 House Insight — Moon in the 3rd House',
    text: `With your Moon in the 3rd house, emotions are processed through thinking, talking, and understanding. You often need to name what you’re feeling before it can move through you. Conversation, journaling, or reflection helps regulate your inner world. Emotional overwhelm can show up as mental restlessness. Feeling heard is essential to feeling emotionally safe.`
  },
  4: {
    label: '🏠 House Insight — Moon in the 4th House',
    text: `With your Moon in the 4th house, emotions run deep and are tied to your sense of home and belonging. Your inner world is rich, private, and strongly influenced by early emotional experiences. Safety comes from familiarity and emotional continuity. You may retreat inward when overwhelmed. Creating a secure emotional base is essential for your well-being.`
  },
  5: {
    label: '🏠 House Insight — Moon in the 5th House',
    text: `With your Moon in the 5th house, emotions seek expression and release through creativity, joy, and play. You regulate feelings by allowing them to move outward rather than holding them in. Suppressing emotional expression can lead to moodiness or frustration. Feeling emotionally seen and appreciated matters deeply. Joy is not indulgent here — it’s regulating.`
  },
  6: {
    label: '🏠 House Insight — Moon in the 6th House',
    text: `With your Moon in the 6th house, emotions are regulated through routine and usefulness. You feel safest when life feels organized and manageable. Emotional stress often shows up physically or through anxiety when things feel out of order. Caring for others can be emotionally grounding, but overdoing it can be draining. Balance comes from tending to your needs as diligently as you tend to responsibilities.`
  },
  7: {
    label: '🏠 House Insight — Moon in the 7th House',
    text: `With your Moon in the 7th house, emotions are deeply influenced by relationships. You feel your feelings most clearly in response to others. Connection provides emotional regulation, while disconnection can feel destabilizing. You may absorb moods easily. Learning to maintain emotional boundaries within closeness is essential.`
  },
  8: {
    label: '🏠 House Insight — Moon in the 8th House',
    text: `With your Moon in the 8th house, emotions are intense, layered, and transformative. You feel deeply, even when you don’t show it outwardly. Emotional experiences change you rather than pass through you. Vulnerability can feel risky, but it’s also where healing occurs. Trust is essential for emotional safety.`
  },
  9: {
    label: '🏠 House Insight — Moon in the 9th House',
    text: `With your Moon in the 9th house, emotions are processed through meaning and perspective. You regulate feelings by understanding the “why” behind them. Belief systems, philosophy, or spirituality help you feel emotionally oriented. Feeling trapped or limited can cause emotional unrest. Emotional balance comes from growth and expanded understanding.`
  },
  10: {
    label: '🏠 House Insight — Moon in the 10th House',
    text: `With your Moon in the 10th house, emotions are shaped by responsibility and public roles. You may feel pressure to stay composed or emotionally capable for others. Vulnerability can feel risky when visibility is high. Emotional safety grows when you allow yourself to be human, not just reliable. Separating worth from performance is essential.`
  },
  11: {
    label: '🏠 House Insight — Moon in the 11th House',
    text: `With your Moon in the 11th house, emotional security comes from belonging and shared vision. You feel safest when connected to community or friendships that align with your values. Isolation can feel emotionally disorienting. You may be sensitive to group dynamics. Emotional well-being grows through authentic connection, not obligation.`
  },
  12: {
    label: '🏠 House Insight — Moon in the 12th House',
    text: `With your Moon in the 12th house, emotions are subtle, intuitive, and often unconscious. You absorb emotional atmosphere easily, sometimes without realizing it. Solitude is essential for emotional regulation. Boundaries between your feelings and others’ feelings can blur. Emotional safety comes from rest, reflection, and spiritual grounding.`
  }
};
// ...existing code...
// House Insight Library for Sun (Core Self)
const SUN_HOUSE_INSIGHT: Record<number, { label: string; text: string }> = {
  1: {
    label: '🏠 House Insight — Sun in the 1st House',
    text: `With your Sun in the 1st house, your identity is immediately visible to others. You experience life through embodiment — who you are is something you live outwardly, not something you keep hidden. Self-awareness develops through action and direct experience rather than reflection alone. Confidence grows when you trust your instincts and allow yourself to take up space. You are here to lead with authenticity, even when it feels vulnerable.`
  },
  2: {
    label: '🏠 House Insight — Sun in the 2nd House',
    text: `With your Sun in the 2nd house, your sense of self is closely tied to value and security. You understand who you are through what you build, protect, and sustain over time. Confidence grows when your life feels stable and aligned with your values. When self-worth feels uncertain, identity can feel shaky as well. You are here to learn that worth comes from being, not just having.`
  },
  3: {
    label: '🏠 House Insight — Sun in the 3rd House',
    text: `With your Sun in the 3rd house, identity is shaped through thought, communication, and learning. You come to know yourself by speaking, questioning, and exchanging ideas. Curiosity is essential to your sense of aliveness. When your voice feels unheard, your sense of self can dim. You are here to trust that your perspective matters and deserves expression.`
  },
  4: {
    label: '🏠 House Insight — Sun in the 4th House',
    text: `With your Sun in the 4th house, your identity is rooted in emotional foundations. Home, family, and inner safety play a central role in how you understand yourself. You are most grounded when you feel emotionally secure and supported. Without that sense of belonging, confidence can waver. You are here to build an inner home that feels safe, regardless of circumstance.`
  },
  5: {
    label: '🏠 House Insight — Sun in the 5th House',
    text: `With your Sun in the 5th house, identity comes alive through creativity, joy, and self-expression. You discover who you are when you allow yourself to play, create, and take emotional risks. Being seen for who you truly are is deeply affirming. Suppressing joy or self-expression can feel like losing yourself. You are here to live from the heart, not the sidelines.`
  },
  6: {
    label: '🏠 House Insight — Sun in the 6th House',
    text: `With your Sun in the 6th house, identity develops through usefulness and contribution. You understand yourself by showing up, improving systems, and making life work better. Confidence grows when your efforts feel meaningful and effective. Over-identifying with productivity can lead to burnout. You are here to remember that service is an expression of self, not a replacement for it.`
  },
  7: {
    label: '🏠 House Insight — Sun in the 7th House',
    text: `With your Sun in the 7th house, your sense of self is shaped through connection. You come to understand who you are through partnership, reflection, and meaningful exchange. Relationships act as mirrors, revealing aspects of yourself you might not see alone. Without mutual recognition, identity can feel incomplete. You are here to balance connection with self-definition.`
  },
  8: {
    label: '🏠 House Insight — Sun in the 8th House',
    text: `With your Sun in the 8th house, identity is forged through depth and transformation. You understand yourself by facing emotional intensity, change, and truth beneath the surface. Superficial living feels empty to you. Confidence grows when you trust your resilience and capacity to evolve. You are here to become yourself through shedding old layers.`
  },
  9: {
    label: '🏠 House Insight — Sun in the 9th House',
    text: `With your Sun in the 9th house, identity expands through exploration and belief. You discover who you are by seeking truth, wisdom, and broader perspective. Growth comes from learning, travel, or philosophical inquiry. When life feels small or restrictive, your sense of self weakens. You are here to live in alignment with meaning, not limitation.`
  },
  10: {
    label: '🏠 House Insight — Sun in the 10th House',
    text: `With your Sun in the 10th house, identity is closely tied to visibility and purpose. You understand yourself through achievement, responsibility, and the roles you hold in the world. Being recognized for your efforts matters deeply. When your path feels unclear, confidence can falter. You are here to build a life that reflects your integrity and ambition.`
  },
  11: {
    label: '🏠 House Insight — Sun in the 11th House',
    text: `With your Sun in the 11th house, identity forms through community and shared vision. You understand yourself by contributing to something larger than yourself. Belonging to groups or causes strengthens your sense of purpose. Isolation can feel disorienting. You are here to express individuality while supporting collective growth.`
  },
  12: {
    label: '🏠 House Insight — Sun in the 12th House',
    text: `With your Sun in the 12th house, identity is shaped internally rather than externally. You come to know yourself through introspection, intuition, and spiritual awareness. Being unseen does not mean being unimportant — but it can challenge confidence. You are here to trust the quiet strength of your inner world. Purpose emerges when you honor sensitivity as wisdom.`
  }
};
// Elemental Insight Library
const ELEMENTAL_INSIGHT_LIBRARY: Record<string, Record<string, { label: string; signList: string; text: string }>> = {
  fire: {
    'core-self': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire shapes identity through vitality and expression. You experience yourself most clearly when you are actively engaged with life rather than observing it from a distance. Confidence grows through action, creativity, and taking up space authentically. When your energy is blocked or suppressed, it can feel like losing access to yourself. Feeling alive is not optional for you — it is foundational to who you are.`
    },
    'emotional-world': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire processes emotions quickly and intensely. Feelings rise fast and often demand expression before they can settle. Suppressing emotion can lead to frustration or burnout, while honest release restores balance. You regulate emotionally by acknowledging what you feel in real time rather than holding it in. Passion and truth are essential to your emotional health.`
    },
    'first-impression': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire energy is immediately noticeable to others. People often experience you as animated, expressive, or confident before they know you personally. Your presence carries warmth and momentum that naturally draws attention. Even when you’re quiet, your energy is felt. You tend to leave a strong impression simply by being fully yourself.`
    },
    'how-you-love': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire loves boldly and visibly. You express affection through enthusiasm, passion, and emotional openness. Love feels most real when it is alive, mutual, and expressive. When connection becomes stagnant or overly restrained, you may feel disconnected. You thrive in relationships that encourage growth, excitement, and shared inspiration.`
    },
    'how-you-fight': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire confronts conflict directly and instinctively. Anger is not something you fear — it’s a signal that something needs action or truth. You prefer addressing issues head-on rather than letting resentment build. Conflict is resolved through honesty, movement, and courage. When handled consciously, your anger becomes clarity rather than destruction.`
    },
    'protection-style': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire protects itself through assertion and reclaiming agency. When you feel threatened or diminished, standing your ground restores emotional safety. You need to feel empowered rather than contained. Passive environments can feel unsafe over time. Protection comes from knowing you are allowed to act and respond freely.`
    },
    'inner-child': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `The fire inner child longs for freedom, play, and recognition. Expression is essential — being silenced or restrained can wound deeply. This part of you thrives when encouraged to explore and create without shame. Joy is a form of safety here. When honored, your inner child becomes a source of vitality and courage.`
    },
    'growth-arc': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire grows through expansion and risk. Progress comes when you trust yourself enough to move forward without certainty. Waiting too long can dull your motivation. Growth feels exciting when it involves possibility and discovery. Faith in yourself is the fuel that carries you forward.`
    },
    'souls-purpose': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire’s purpose is to ignite truth, inspiration, or courage. You are here to bring movement where things have stagnated. Purpose feels aligned when your life lights something up — in yourself or others. You lead by embodying belief, not preaching it. When you follow what excites you, purpose follows.`
    },
    'shadow-work': {
      label: '🔥 Elemental Insight — Fire',
      signList: '(Aries · Leo · Sagittarius)',
      text: `Fire shadow work involves unexpressed anger or suppressed vitality. When passion is denied, it can turn inward or erupt destructively. Healing comes from reclaiming desire without guilt or excess. Learning when to act — and when to pause — is key. Your power is strongest when it is conscious.`
    }
  },
  earth: { /* ...similarly for earth... */ },
  air: { /* ...similarly for air... */ },
  water: { /* ...similarly for water... */ }
};
/**
 * Full Natal Story - Premium Content
 * 
 * This is the crown jewel of Deeper Sky.
 * Instead of "You are sensitive and creative," users get
 * full emotional chapters with depth, nuance, and healing.
 * 
 * Chapters:
 * 1. Your Core Self (Sun)
 * 2. Your Emotional World (Moon)
 * 3. Your First Impression (Rising)
 * 4. How You Love (Venus)
 * 5. How You Fight (Mars)
 * 6. How You Protect Yourself
 * 7. Your Inner Child
 * 8. Your Growth Arc (Jupiter)
 * 9. Your Soul's Purpose (North Node)
 * 10. Your Shadow Work (Pluto)
 */

import { NatalChart } from '../astrology/types';

export interface NatalChapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  isPremium: boolean;
  // Content varies based on premium status
  freeContent: {
    brief: string;
    teaser: string;
  };
  // Full content generated based on chart
}

export interface FullNatalStory {
  chapters: GeneratedChapter[];
  summary: string;
  affirmation: string;
}

export interface GeneratedChapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  isPremium: boolean;
  content: string;
  reflection: string;
  affirmation: string;
}

// Chapter definitions
const CHAPTER_DEFINITIONS: NatalChapter[] = [
  {
    id: 'core-self',
    title: 'Your Core Self',
    subtitle: 'The light you were born to shine',
    icon: 'sunny',
    isPremium: false,
    freeContent: {
      brief: 'Your Sun sign reveals your essential self.',
      teaser: 'Unlock Deeper Sky to explore the full story of your core identity...',
    },
  },
  {
    id: 'emotional-world',
    title: 'Your Emotional World',
    subtitle: 'How your heart learned to feel',
    icon: 'moon',
    isPremium: false,
    freeContent: {
      brief: 'Your Moon sign shapes your emotional needs.',
      teaser: 'Unlock Deeper Sky to understand your emotional patterns in depth...',
    },
  },
  {
    id: 'first-impression',
    title: 'Your First Impression',
    subtitle: 'The mask you wear and why',
    icon: 'eye',
    isPremium: false,
    freeContent: {
      brief: 'Your Rising sign is how the world first sees you.',
      teaser: 'Unlock Deeper Sky to explore the full story of your public self...',
    },
  },
  {
    id: 'how-you-love',
    title: 'How You Love',
    subtitle: 'Your heart\'s language',
    icon: 'heart',
    isPremium: true,
    freeContent: {
      brief: 'Venus reveals your love style.',
      teaser: 'Unlock Deeper Sky to understand your unique way of giving and receiving love...',
    },
  },
  {
    id: 'how-you-fight',
    title: 'How You Fight',
    subtitle: 'Your fire and your edge',
    icon: 'flame',
    isPremium: true,
    freeContent: {
      brief: 'Mars shows how you assert yourself.',
      teaser: 'Unlock Deeper Sky to explore your relationship with anger, drive, and desire...',
    },
  },
  {
    id: 'protection-style',
    title: 'How You Protect Yourself',
    subtitle: 'The walls you built and why',
    icon: 'shield',
    isPremium: true,
    freeContent: {
      brief: 'Your chart reveals your defense mechanisms.',
      teaser: 'Unlock Deeper Sky for trauma-informed insights on your protective patterns...',
    },
  },
  {
    id: 'inner-child',
    title: 'Your Inner Child',
    subtitle: 'What your younger self still needs',
    icon: 'happy',
    isPremium: true,
    freeContent: {
      brief: 'Your chart holds clues to childhood wounds.',
      teaser: 'Unlock Deeper Sky to meet your inner child and understand what they needed...',
    },
  },
  {
    id: 'growth-arc',
    title: 'Your Growth Arc',
    subtitle: 'The lessons you\'re here to learn',
    icon: 'trending-up',
    isPremium: true,
    // placementKey: 'Jupiter', // (add if such a field is used elsewhere)
    freeContent: {
      brief: 'Jupiter shows your growth opportunities.',
      teaser: 'Unlock Deeper Sky to explore the full story of your growth and expansion...',
    },
  },
  {
    id: 'souls-purpose',
    title: 'Your Soul\'s Purpose',
    subtitle: 'Where you\'re headed',
    icon: 'compass',
    isPremium: true,
    freeContent: {
      brief: 'Your North Node points toward growth.',
      teaser: 'Unlock Deeper Sky to explore your soul\'s direction...',
    },
  },
  {
    id: 'shadow-work',
    title: 'Your Shadow Work',
    subtitle: 'What you\'re learning to integrate',
    icon: 'contrast',
    isPremium: true,
    freeContent: {
      brief: 'Pluto reveals transformation points.',
      teaser: 'Unlock Deeper Sky for deep shadow work insights...',
    },
  },
];

// Content pools for Chapter 1 — sign-specific (12 variants)
const CORE_SELF_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `At your core, you are movement. You experience life as something meant to be initiated, chosen, and acted upon. You trust your instincts before explanations form, and that trust is your power.

You feel most alive when you are beginning something — when there is momentum, challenge, or risk. Stagnation drains you. Waiting feels unnatural, even painful, because your sense of self is built through action.

Your gift is courage. You remind the world that life responds to those who step forward first.
Your challenge is learning that rest, patience, and reflection do not weaken you — they sharpen your fire.`,
    reflection: 'When was the last time you trusted an impulse that turned out to be exactly right? What stops you from trusting yourself more often?',
    affirmation: 'I am allowed to move first. My instincts are my compass.',
  },
  Taurus: {
    content: `At your core, you are steadiness. You experience life through your senses, your values, and your need for something real beneath your feet. You are here to build, to tend, to create what lasts.

You feel most like yourself when you are safe, comfortable, and grounded in what you love. You don't rush into change — you assess whether it's worth the cost. Loyalty and consistency are not habits for you; they are identity.

Your gift is endurance. You bring stability to chaotic spaces.
Your challenge is learning that growth sometimes asks you to release what once felt secure.`,
    reflection: 'What are you holding onto that no longer serves you? What would it feel like to let go — even a little?',
    affirmation: 'I am worthy beyond what I produce. My presence itself is enough.',
  },
  Gemini: {
    content: `At your core, you are curiosity. You experience life as a conversation — one that never fully ends. Your identity forms through learning, sharing, and connecting ideas together.

You feel most alive when you are mentally engaged. Silence without stimulation can feel heavy, while dialogue energizes you. You are here to ask questions others overlook and to keep meaning in motion.

Your gift is adaptability. You translate complexity into understanding.
Your challenge is learning how to stay present when depth asks for stillness instead of variety.`,
    reflection: 'What question are you currently obsessing over? What would it feel like to simply not know for a while?',
    affirmation: 'I don\'t have to understand everything. My presence is valuable even in silence.',
  },
  Cancer: {
    content: `At your core, you are emotional intelligence. You experience life through feeling, memory, and attachment. You don't just live moments — you hold them.

You feel most like yourself when you are protecting, nurturing, or emotionally connected. Home is not a place for you; it's a state of safety you instinctively try to create for others.

Your gift is care. You make people feel seen and remembered.
Your challenge is learning that protecting yourself matters just as much as protecting others.`,
    reflection: 'Whose emotions are you carrying that aren\'t yours? What would it feel like to put them down?',
    affirmation: 'I can care for others AND protect my own heart. Both are acts of love.',
  },
  Leo: {
    content: `At your core, you are expression. You experience life as something meant to be lived visibly and wholeheartedly. You don't want to exist quietly — you want to shine.

You feel most alive when you are appreciated, creative, and emotionally engaged. Recognition isn't vanity for you; it's feedback that you're being fully yourself.

Your gift is warmth. You inspire others to take up space.
Your challenge is learning that your worth remains even when the spotlight dims.`,
    reflection: 'When do you feel most like yourself? What would it look like to protect that flame instead of giving it away?',
    affirmation: 'I am allowed to shine without apology. My brightness is not too much.',
  },
  Virgo: {
    content: `At your core, you are awareness. You experience life through observation, discernment, and a desire to make things better than you found them.

You feel most like yourself when you are useful, improving systems, or offering thoughtful care. You notice what others miss — not because you're critical, but because you're attentive.

Your gift is precision. You heal through service and insight.
Your challenge is learning that perfection is not required to be worthy.`,
    reflection: 'What standard do you hold yourself to that you would never impose on someone you love?',
    affirmation: 'I am enough exactly as I am. My imperfections do not diminish my value.',
  },
  Libra: {
    content: `At your core, you are balance. You experience life relationally — through reflection, fairness, and connection. You understand yourself best when you understand others.

You feel most alive when harmony exists, whether emotionally, aesthetically, or socially. Conflict unsettles you not because you fear it, but because you sense how deeply it affects everyone involved.

Your gift is diplomacy. You create beauty and peace where there is tension.
Your challenge is learning to choose yourself without guilt.`,
    reflection: 'When was the last time you chose what YOU wanted without asking anyone else\'s opinion?',
    affirmation: 'My needs matter as much as everyone else\'s. Choosing myself is not selfish.',
  },
  Scorpio: {
    content: `At your core, you are depth. You experience life intensely, instinctively aware that truth lives beneath the surface. You don't skim experiences — you transform through them.

You feel most alive when something is emotionally real, raw, or meaningful. Superficiality drains you. You crave honesty, even when it's uncomfortable.

Your gift is transformation. You help others face what they avoid.
Your challenge is learning to trust without needing control.`,
    reflection: 'What are you afraid to let go of? What would happen if you loosened your grip — even slightly?',
    affirmation: 'I can be vulnerable without losing my power. Surrender is its own strength.',
  },
  Sagittarius: {
    content: `At your core, you are expansion. You experience life as a journey — one that must be explored freely, honestly, and with meaning.

You feel most alive when learning, traveling, or questioning belief systems. You are driven by the desire to understand why things are the way they are.

Your gift is perspective. You remind others that life is bigger than fear.
Your challenge is learning to stay grounded while still reaching outward.`,
    reflection: 'What belief have you outgrown? What new truth is trying to take its place?',
    affirmation: 'I am free to explore without needing a destination. The journey itself is the point.',
  },
  Capricorn: {
    content: `At your core, you are responsibility. You experience life as something to be built with intention, discipline, and long-term vision.

You feel most like yourself when you are working toward something meaningful. Achievement is not about status for you — it's about proving your inner strength.

Your gift is resilience. You turn effort into legacy.
Your challenge is learning that rest and vulnerability are not failures.`,
    reflection: 'What would you do if you knew it wouldn\'t be judged? What would rest look like if you truly allowed it?',
    affirmation: 'I am more than my achievements. My worth exists even when I stop producing.',
  },
  Aquarius: {
    content: `At your core, you are originality. You experience life from a slightly different angle, often sensing the future before others catch up.

You feel most alive when contributing to something bigger than yourself — ideas, communities, change. You value authenticity over conformity, even when it isolates you.

Your gift is innovation. You break patterns that no longer serve.
Your challenge is learning to stay emotionally present while remaining independent.`,
    reflection: 'When do you feel most connected to others? What happens when you let people get close?',
    affirmation: 'I can be different AND belong. My uniqueness is what makes me essential.',
  },
  Pisces: {
    content: `At your core, you are sensitivity. You experience life intuitively, emotionally, and spiritually — often absorbing more than you realize.

You feel most like yourself when creating, healing, or connecting to something unseen. Boundaries can feel thin, but compassion flows naturally through you.

Your gift is empathy. You understand without needing explanation.
Your challenge is learning to ground your dreams in reality without losing them.`,
    reflection: 'What do you sense about yourself that you\'ve never said out loud? What would it feel like to trust that knowing?',
    affirmation: 'I can feel deeply AND protect myself. My sensitivity is wisdom.',
  },
};

// Content pools for Chapter 2 — sign-specific (12 variants)
const EMOTIONAL_WORLD_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `Emotionally, you respond fast and intensely. Feelings arrive like sparks — sudden, powerful, and impossible to ignore. You don't sit with emotions for long; you move through them.

You feel safest when you're allowed to react honestly and immediately. Suppressing feelings creates inner pressure, while expression brings relief. Anger often masks vulnerability for you, not because you lack depth, but because speed feels safer than stillness.

Your emotional gift is courage.
Your emotional work is learning that softness doesn't slow you down — it steadies you.`,
    reflection: 'How do you typically express anger? What happens when you\'re not allowed to?',
    affirmation: 'My intensity is not too much. I can feel fire without burning bridges.',
  },
  Taurus: {
    content: `Emotionally, you need stability. Your inner world seeks calm, predictability, and physical comfort. You feel deeply, but you process slowly and deliberately.

You feel safest when your environment is secure and your routines are respected. Sudden emotional upheaval can feel destabilizing, even threatening. Once you trust, you are deeply loyal — but letting go is hard.

Your emotional gift is grounding.
Your emotional work is learning that change doesn't always mean loss.`,
    reflection: 'Where do you feel emotions in your body? What physical comforts help you feel safe?',
    affirmation: 'I can feel without needing to fix. My need for stability is valid.',
  },
  Gemini: {
    content: `Emotionally, you think your feelings before you feel them fully. Your inner world is active, curious, and constantly processing.

You feel safest when you can talk things through or mentally sort what you're experiencing. Silence can feel overwhelming, while conversation brings clarity. You may detach emotionally — not because you don't care, but because understanding comes first.

Your emotional gift is adaptability.
Your emotional work is learning to stay present with feelings instead of analyzing them away.`,
    reflection: 'When did you first learn to think instead of feel? What emotion is hardest for you to sit with?',
    affirmation: 'I can feel without needing to understand. My mind and heart can coexist.',
  },
  Cancer: {
    content: `Emotionally, you are deeply sensitive. Your inner world is rich with memory, intuition, and emotional awareness. You feel everything — sometimes before others even speak.

You feel safest when emotionally connected and protected. Disconnection can feel like abandonment, even when it's unintentional. You nurture instinctively, often before being asked.

Your emotional gift is attunement.
Your emotional work is learning that your needs matter as much as the ones you care for.`,
    reflection: 'Whose emotions are you carrying right now? What would it feel like to give them back?',
    affirmation: 'My sensitivity is my gift. I can care for others and still come first.',
  },
  Leo: {
    content: `Emotionally, you need appreciation and emotional warmth. Your inner world thrives on love that is visible, expressive, and affirming.

You feel safest when you feel valued and emotionally chosen. When ignored or dismissed, you may feel deeply wounded — even if you appear confident on the outside.

Your emotional gift is generosity.
Your emotional work is learning that you are worthy even without applause.`,
    reflection: 'When do you feel most emotionally seen? What happens inside when that recognition is absent?',
    affirmation: 'I am worthy of love even in silence. My heart shines without permission.',
  },
  Virgo: {
    content: `Emotionally, you process through observation and problem-solving. Your inner world is thoughtful, practical, and deeply attentive.

You feel safest when things make sense and when you can be useful. Emotional chaos can make you anxious, leading you to fix rather than feel. You often offer care quietly, without asking for recognition.

Your emotional gift is devotion.
Your emotional work is learning that you don't have to earn emotional safety.`,
    reflection: 'What standard do you hold your emotions to? What would it feel like to let feelings be messy?',
    affirmation: 'I don\'t have to earn the right to feel. My emotions are valid as they are.',
  },
  Libra: {
    content: `Emotionally, you seek harmony. Your inner world is shaped by relationships, fairness, and emotional balance.

You feel safest when emotional exchanges are peaceful and mutual. Conflict affects you deeply, sometimes causing you to suppress your own feelings to keep the peace.

Your emotional gift is empathy.
Your emotional work is learning to honor your emotions even when they disrupt harmony.`,
    reflection: 'When was the last time you chose your own emotional truth over keeping the peace?',
    affirmation: 'My feelings matter even when they are inconvenient. Harmony includes me.',
  },
  Scorpio: {
    content: `Emotionally, you feel with intensity and depth. Your inner world is private, powerful, and emotionally complex.

You feel safest when trust is absolute. Betrayal cuts deeply and is not easily forgotten. You may guard your emotions fiercely, revealing them only to those who prove themselves.

Your emotional gift is emotional truth.
Your emotional work is learning that vulnerability doesn't equal loss of control.`,
    reflection: 'What are you afraid to feel fully? What would happen if you let yourself go there?',
    affirmation: 'I can be vulnerable without losing my power. Surrender is its own strength.',
  },
  Sagittarius: {
    content: `Emotionally, you seek freedom and meaning. Your inner world needs space to explore, understand, and expand.

You feel safest when emotions are honest but not heavy. Feeling trapped — emotionally or relationally — can cause restlessness or avoidance. You heal through perspective.

Your emotional gift is optimism.
Your emotional work is learning to stay present when emotions deepen.`,
    reflection: 'What feeling do you tend to escape from? What would it teach you if you stayed?',
    affirmation: 'I can feel deeply and still be free. Depth and freedom are not opposites.',
  },
  Capricorn: {
    content: `Emotionally, you are self-contained and resilient. Your inner world values composure, control, and responsibility.

You feel safest when you are strong and capable. Vulnerability may feel risky, even unsafe. You often carry emotional weight silently, believing it's yours to manage.

Your emotional gift is endurance.
Your emotional work is learning that emotional support is not weakness.`,
    reflection: 'Who do you trust enough to be emotionally honest with? What would it cost to let someone in?',
    affirmation: 'Asking for help is strength. I don\'t have to carry everything alone.',
  },
  Aquarius: {
    content: `Emotionally, you process from a distance. Your inner world is independent, intellectual, and uniquely wired.

You feel safest when you're allowed emotional autonomy. Intense emotional demands can feel overwhelming, leading you to detach — not because you don't care, but because space helps you regulate.

Your emotional gift is perspective.
Your emotional work is learning to stay connected while remaining true to yourself.`,
    reflection: 'When do you feel most connected to others? What happens when you let people get close?',
    affirmation: 'I can be different AND belong. Connection doesn\'t require losing myself.',
  },
  Pisces: {
    content: `Emotionally, you are deeply intuitive and porous. Your inner world absorbs emotion like water absorbs color.

You feel safest when compassion flows freely and boundaries are gentle. You may struggle to distinguish your feelings from others', carrying emotional weight that isn't yours.

Your emotional gift is empathy.
Your emotional work is learning where you end and others begin.`,
    reflection: 'What emotions are you feeling right now that might not be yours? What would it feel like to release them?',
    affirmation: 'I can feel deeply without drowning. My boundaries are acts of love.',
  },
};

// Content pools for Chapter 3 — sign-specific (12 variants)
const FIRST_IMPRESSION_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `Others experience you as direct, energetic, and self-assured. You give off the impression of someone who knows where they're going — even when you're still figuring it out.

People may assume you're fearless or impulsive, noticing your confidence before your vulnerability. You naturally take the lead, often without realizing it.

Your presence feels activating.
What others don't always see is how deeply you care about doing things right.`,
    reflection: 'How do you think others see you when you walk into a room? How does that differ from how you see yourself?',
    affirmation: 'How I show up is valid. My first instinct to lead is a gift.',
  },
  Taurus: {
    content: `Others experience you as calm, steady, and dependable. Your energy feels safe and unhurried, like someone who can be trusted to stay.

People may assume you dislike change or move slowly, when in truth you simply prefer stability over chaos. Your presence brings reassurance without words.

Your presence feels grounding.
What others don't always see is how much you feel beneath your composure.`,
    reflection: 'What do people assume about you that isn\'t quite true? What do you wish they noticed instead?',
    affirmation: 'My steadiness is a gift. I don\'t have to rush to be powerful.',
  },
  Gemini: {
    content: `Others experience you as curious, expressive, and mentally quick. You come across as approachable, talkative, and interesting to be around.

People may assume you're lighthearted or non-committal, noticing your wit before your depth. You naturally spark conversation and connection.

Your presence feels stimulating.
What others don't always see is how much thought you put into understanding everything.`,
    reflection: 'When people describe you, what do they say? What part of you do you wish they could see?',
    affirmation: 'My curiosity is my superpower. I can be light and deep at the same time.',
  },
  Cancer: {
    content: `Others experience you as warm, intuitive, and emotionally aware. You give off a caring, protective energy — even when you're quiet.

People may assume you're sensitive or reserved, sensing your emotional depth immediately. Your presence feels comforting, familiar, and safe.

Your presence feels nurturing.
What others don't always see is how carefully you protect your own heart.`,
    reflection: 'Do you feel safe showing the world who you really are? What would change if you did?',
    affirmation: 'My warmth is not weakness. I can be open and still protected.',
  },
  Leo: {
    content: `Others experience you as confident, expressive, and magnetic. You naturally draw attention, whether you intend to or not.

People may assume you're bold or dramatic, noticing your charisma before your vulnerability. You give the impression of someone who belongs in the spotlight.

Your presence feels energizing.
What others don't always see is how deeply you want to be genuinely appreciated.`,
    reflection: 'What do you most want people to see in you? What are you afraid they\'ll miss?',
    affirmation: 'I am seen, and that is safe. My presence matters.',
  },
  Virgo: {
    content: `Others experience you as composed, thoughtful, and detail-oriented. You give off an impression of someone who notices everything.

People may assume you're reserved or serious, seeing your precision before your warmth. Your presence feels organized and intentional.

Your presence feels steady.
What others don't always see is how much care you quietly give.`,
    reflection: 'What do people not realize about you until they know you well?',
    affirmation: 'I don\'t have to prove my worth through service. My presence alone is enough.',
  },
  Libra: {
    content: `Others experience you as pleasant, balanced, and socially graceful. You make interactions feel smooth and comfortable.

People may assume you're easygoing or conflict-averse, noticing your diplomacy before your decisiveness. Your presence creates harmony.

Your presence feels calming.
What others don't always see is how much you weigh your choices internally.`,
    reflection: 'How much of the "you" others meet is the real you? What would it feel like to show more?',
    affirmation: 'I can be authentic and still graceful. My real self is enough.',
  },
  Scorpio: {
    content: `Others experience you as intense, mysterious, and emotionally powerful. Even when silent, your presence is felt.

People may assume you're guarded or intimidating, sensing depth before accessibility. You naturally command attention without asking for it.

Your presence feels compelling.
What others don't always see is how selective you are with trust.`,
    reflection: 'What would it cost to let people see the real you sooner? What are you protecting?',
    affirmation: 'My depth is not a barrier. I can be seen without being exposed.',
  },
  Sagittarius: {
    content: `Others experience you as optimistic, adventurous, and honest. You come across as someone who's going somewhere interesting.

People may assume you're carefree or restless, noticing your enthusiasm before your sensitivity. Your presence feels expansive.

Your presence feels uplifting.
What others don't always see is how much meaning you're searching for.`,
    reflection: 'What impression do you want to leave on people? Does it match what you actually leave?',
    affirmation: 'My openness invites connection. I can explore and still belong.',
  },
  Capricorn: {
    content: `Others experience you as capable, serious, and composed. You give off an impression of reliability and self-control.

People may assume you're distant or overly focused, seeing your strength before your softness. Your presence feels structured and grounded.

Your presence feels dependable.
What others don't always see is how much pressure you carry internally.`,
    reflection: 'Who knows the softer side of you? What would happen if more people did?',
    affirmation: 'I can be strong and soft. Vulnerability doesn\'t diminish my authority.',
  },
  Aquarius: {
    content: `Others experience you as unique, independent, and slightly unconventional. You stand out simply by being yourself.

People may assume you're detached or unpredictable, noticing your individuality before your loyalty. Your presence feels fresh and different.

Your presence feels liberating.
What others don't always see is how deeply you care about connection.`,
    reflection: 'Do you feel understood by others? What would it take to feel truly seen?',
    affirmation: 'I can be myself and still be close to people. My difference is my belonging.',
  },
  Pisces: {
    content: `Others experience you as gentle, intuitive, and emotionally receptive. You give off a soft, almost ethereal presence.

People may assume you're shy or elusive, sensing sensitivity before clarity. Your presence feels calming and compassionate.

Your presence feels soothing.
What others don't always see is how much strength lives beneath your softness.`,
    reflection: 'How do you protect your energy when the world feels too much? What boundaries keep you whole?',
    affirmation: 'My softness is strength. I can be open without being overwhelmed.',
  },
};

// Content pools for Chapter 4 — sign-specific (12 variants, Venus)
const HOW_YOU_LOVE_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `With Venus in Aries, you love like you live — fearlessly, passionately, and without apology. You fall fast and hard, drawn to the chase, the spark, the electric moment of first connection. You need a partner who can match your fire and keep you on your toes.

Your love language is action. Grand gestures, spontaneous adventures, and direct declarations of affection are how you show you care. Boredom is the death of romance for you — you need a relationship that feels alive.

Your Venus also reveals how you value yourself. When you honor your desires directly, love flows naturally. When you suppress your fire to keep the peace, resentment builds.`,
    reflection: 'What do you chase in love — and what would happen if you let love chase you instead?',
    affirmation: 'I deserve a love that matches my fire. I don\'t have to dim to be loved.',
  },
  Taurus: {
    content: `With Venus in Taurus, you love with your whole body and soul. Physical touch, shared meals, beautiful spaces — these are the currency of your affection. You build relationships slowly, brick by brick, creating something meant to last generations.

Your loyalty runs bone-deep. Once committed, you are steadfast, sensual, and endlessly patient. You show love through consistency — through being there, day after day, in all the quiet ways that matter most.

Your Venus also shapes your relationship with self-worth. When you feel secure in who you are, you attract love that honors your devotion. When you cling out of fear, love becomes a cage.`,
    reflection: 'How do you show love in the quiet moments? What would it feel like to receive that same devotion from someone else?',
    affirmation: 'I am worthy of lasting love. My devotion is a gift, not an obligation.',
  },
  Gemini: {
    content: `With Venus in Gemini, your heart follows your mind. You fall in love with someone's ideas, their humor, the way their mind dances between subjects. Communication is the oxygen of your relationships — without it, love suffocates.

You need variety and stimulation in love. A partner who can surprise you, challenge your thinking, and make you laugh will hold your heart longer than anyone. Your affection expresses itself through words — love letters, inside jokes, and conversations that last until dawn.

Your Venus also reveals how you connect to pleasure. When your mind is engaged, your heart opens. When conversation dries up, so does intimacy.`,
    reflection: 'What kind of conversation makes you fall in love? What happens when words fail?',
    affirmation: 'I can be deeply committed and endlessly curious. My need for connection is valid.',
  },
  Cancer: {
    content: `With Venus in Cancer, you love by creating sanctuary. Your affection wraps around people like a warm blanket — comforting, protective, and deeply nourishing. You remember every detail, anticipate every need, and love with a tenderness that can bring others to tears.

You need emotional security in relationships above all else. Without it, your walls go up, your shell closes, and the generous heart that defines you retreats into self-protection. The right partner makes you feel safe enough to remain open.

Your Venus also shapes how you receive love. You need someone who notices your care and returns it — not just accepts it.`,
    reflection: 'When do you feel safest in love? What happens when that safety is threatened?',
    affirmation: 'I deserve to be nurtured as deeply as I nurture others. My heart is worth protecting.',
  },
  Leo: {
    content: `With Venus in Leo, you love like the sun loves the earth — generously, magnificently, and with total commitment. When you love someone, they become the center of your universe, showered with attention, affection, and unwavering loyalty.

You need to be adored in return. Not as a narcissistic demand, but as a genuine need for your love to be recognized and celebrated. Romance is not optional for you — it's essential. You want the grand love story, and you're willing to create it.

Your Venus also reveals your relationship with receiving. When you allow yourself to be celebrated, love deepens. When you perform love without receiving it back, your heart dims.`,
    reflection: 'When was the last time you felt truly celebrated in love? What does romance mean to you?',
    affirmation: 'I am worthy of the grand love I give. My heart deserves to be adored.',
  },
  Virgo: {
    content: `With Venus in Virgo, you love through acts of service and attention to detail. You notice what others need before they ask, remembering preferences, fixing problems, and quietly making life smoother for those you care about.

Your love may not always be dramatic, but it is incredibly real. You show affection by being useful, by being present, by caring about the small things that add up to everything. Your challenge is accepting love that doesn't come in the same careful, considered form you give it.

Your Venus also shapes your self-worth. When you release the need for perfection, love becomes easier — both to give and to receive.`,
    reflection: 'How do you show love when no one is watching? What kind of love do you secretly wish for?',
    affirmation: 'I don\'t have to be perfect to be loved. My quiet care is powerful and enough.',
  },
  Libra: {
    content: `With Venus in Libra, love is your art form. You understand partnership at a soul level — the dance of two people creating something more beautiful together than either could alone. You bring grace, consideration, and aesthetic beauty to every relationship.

You need harmony in love. Conflict disturbs you deeply, and you'll go to great lengths to maintain peace. Your challenge is learning that authentic love sometimes requires difficult conversations, and that true partnership includes space for disagreement.

Your Venus also reflects how you value yourself. When you stop sacrificing your truth for harmony, your relationships become more real — and more beautiful.`,
    reflection: 'What do you sacrifice to keep the peace? What would love look like if you chose honesty over harmony?',
    affirmation: 'I can be loved for who I truly am. My needs don\'t disrupt love — they deepen it.',
  },
  Scorpio: {
    content: `With Venus in Scorpio, you don't love halfway. Your heart demands total honesty, absolute loyalty, and soul-level intimacy. Surface connections bore you; you need a partner who is willing to go to the depths with you — to face the shadows together.

Your love is transformative. Relationships change you at a cellular level, and you change your partners too. The intensity of your devotion can be overwhelming, but for the right person, it is the most profound gift imaginable.

Your Venus also reveals your relationship with vulnerability. When you trust enough to open fully, love becomes transcendent. When fear takes over, love becomes a test.`,
    reflection: 'What does trust look like for you? What would it feel like to be fully seen without losing power?',
    affirmation: 'I can love deeply without losing myself. My intensity is a gift, not a burden.',
  },
  Sagittarius: {
    content: `You love through openness, honesty, and shared exploration. Love, for you, must feel expansive — something that adds meaning to your life rather than confines it. You are drawn to connection that inspires growth, curiosity, and truth.

This pattern forms through a deep need for freedom and authenticity. You learned that love should feel uplifting, not restrictive. When relationships feel heavy or emotionally claustrophobic, your spirit resists. You value sincerity over comfort and truth over reassurance.

You're drawn to partners who are curious, optimistic, and open-minded. Shared values, humor, and philosophical connection matter deeply to you. Love feels strongest when it encourages both people to keep evolving.

What triggers you most is emotional restriction. Expectations that feel limiting, possessive, or controlling can activate restlessness or avoidance. When you feel trapped, you may emotionally distance yourself to regain space.

This can show up as pulling away when intimacy deepens or reframing emotional discomfort as a need for independence. Others may experience this as inconsistency, even though your intention is self-preservation, not detachment.

Your growth lies in learning that commitment doesn't erase freedom — it can refine it. Staying present during emotional depth doesn't limit your growth; it anchors it. When you allow intimacy to coexist with independence, love becomes an adventure rather than an obligation.`,
    reflection: 'What does freedom in love actually look like for you? What happens when intimacy asks you to stay still?',
    affirmation: 'I can love deeply and still be free. Commitment refines my freedom — it doesn\'t erase it.',
  },
  Capricorn: {
    content: `You love intentionally, carefully, and with long-term vision. Love, for you, is something to be built over time — not rushed, but earned through consistency and trust.

This pattern forms through responsibility and self-discipline. You don't enter relationships lightly. When you commit, you do so with seriousness and loyalty. Love feels safest when it's dependable and grounded in reality.

You're drawn to partners who are emotionally mature, reliable, and goal-oriented. You value stability and shared ambition. Affection is often expressed through responsibility, support, and showing up when it matters.

What triggers you most is unpredictability or emotional chaos. When relationships feel unstable, you may retreat emotionally or tighten control to restore a sense of security.

This can show up as emotional reserve, difficulty expressing vulnerability, or delaying emotional openness until trust feels absolute. Others may perceive you as distant, even though your care runs deep.

Your growth comes from allowing yourself to be emotionally seen before everything feels "perfect." Vulnerability doesn't weaken your foundation — it strengthens it. When you let love be both secure and emotionally open, connection becomes deeply sustaining.`,
    reflection: 'Do you wait for love to feel "safe enough" before opening up? What would it cost to let someone in sooner?',
    affirmation: 'I am worthy of love before I\'ve proven anything. Vulnerability strengthens my foundation.',
  },
  Aquarius: {
    content: `You love through individuality, equality, and shared ideals. Love must respect your autonomy and honor who you truly are. You value connection that feels unique rather than conventional.

This pattern forms through valuing freedom and authenticity. You resist relationships that feel possessive or emotionally demanding. Love, for you, is rooted in mutual respect and shared vision rather than emotional dependency.

You're drawn to partners who embrace difference, think independently, and allow space. Friendship is often the foundation of your strongest bonds. You want love that feels mentally stimulating and socially meaningful.

What triggers you most is emotional pressure. When expectations feel rigid or confining, you may emotionally detach to protect your independence.

This can show up as intellectualizing feelings, needing distance during emotional intensity, or struggling to express affection in traditional ways. Others may misinterpret this as lack of care.

Your growth lies in learning that emotional presence doesn't threaten freedom. Staying connected doesn't require losing yourself. When you allow emotional intimacy alongside independence, love becomes both liberating and deeply real.`,
    reflection: 'When has emotional closeness felt threatening? What would change if you let someone truly see you?',
    affirmation: 'I can be deeply connected and still be myself. Emotional presence is not a cage.',
  },
  Pisces: {
    content: `You love with openness, empathy, and emotional surrender. Love, for you, is not just a connection between two people — it's an experience that feels spiritual, intuitive, and deeply felt. When you love, you dissolve into it.

This pattern forms through heightened sensitivity and emotional permeability. You experience love as something you feel in your body, your imagination, and your inner world. Romance, emotional resonance, and shared feeling matter more than structure or definition.

You're drawn to partners who feel emotionally expressive, compassionate, and soulful. You often sense potential before it fully exists, falling in love with what could be just as much as what is. Emotional connection feels strongest when it's gentle, intuitive, and unspoken.

What triggers you most is emotional disillusionment. Harsh reality, emotional neglect, or feeling unseen in your sensitivity can cause deep hurt. When love loses its softness, you may feel lost or emotionally untethered.

This can show up as idealizing partners, overgiving, or blurring emotional boundaries. You may stay in relationships longer than you should, hoping love will heal what hurts. At times, you may lose yourself inside another person's needs or emotions.

Your growth comes from learning that love does not require self-erasure to be meaningful. Boundaries do not block love — they protect it. When you stay grounded in yourself while remaining open-hearted, love becomes nourishing rather than overwhelming. You are allowed to receive the same compassion you so freely give.`,
    reflection: 'Where do you lose yourself in love? What would it feel like to stay whole while still giving your heart?',
    affirmation: 'I deserve the same compassion I give. Love does not require me to disappear.',
  },
};

// Content pools for Chapter 5 — sign-specific (12 variants, Mars)
const HOW_YOU_FIGHT_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `When conflict appears, you meet it head-on. Anger activates your body instantly, pushing emotion straight into action. You don't hesitate — you respond.

This pattern forms because honesty feels safer than suppression. Letting things build internally feels intolerable. You'd rather clear the air immediately than sit with unresolved tension.

You're most triggered by avoidance, passive behavior, or emotional delays. When others don't respond directly, frustration escalates quickly. What hurts most isn't disagreement — it's feeling blocked or ignored.

In conflict, you may raise your voice, interrupt, or push for resolution before others are ready. Anger moves through you fast, but its impact can linger for those who process more slowly.

This pattern can repeat as intense arguments followed by quick release. You may feel ready to move on long before others have caught up emotionally.

Your growth comes from learning to pause just long enough to identify what the anger is protecting. Beneath it is often vulnerability or fear of not being taken seriously. When you slow without silencing yourself, your directness becomes grounding rather than overwhelming.`,
    reflection: 'What is your anger usually protecting? What would happen if you paused before reacting?',
    affirmation: 'My anger is valid. I can express it without losing connection.',
  },
  Taurus: {
    content: `You don't rush into conflict. Anger builds slowly for you, often after long periods of tolerance. You prefer peace and stability, and you'll try to maintain it for as long as possible. But once your limit is reached, your stance becomes firm and difficult to shift.

This pattern forms through a deep need for security. You don't like emotional disruption, and conflict feels destabilizing. Because of this, you often endure more than you should before reacting. You hope situations will resolve on their own, or that your patience will be enough.

You're most triggered when you feel pushed, rushed, or forced into change you didn't choose. Feeling controlled or threatened in your stability activates anger quickly. When your sense of safety is compromised, resistance replaces flexibility.

In conflict, you may become silent, stubborn, or emotionally closed off. Others may underestimate the seriousness of your anger because it appears calm on the surface. But internally, you've already drawn a line. Once crossed, it's hard to undo.

This pattern can repeat as prolonged resentment or emotional withdrawal in relationships. You may stay quiet for too long, then emotionally disengage when the damage feels irreversible.

Your growth comes from expressing boundaries earlier. Conflict doesn't need to reach a breaking point to be valid. When you speak up before anger hardens, you protect both your stability and your connection.`,
    reflection: 'How long do you tolerate before you speak up? What would change if you expressed discomfort earlier?',
    affirmation: 'I can set boundaries before reaching my limit. Early honesty protects my peace.',
  },
  Gemini: {
    content: `You fight through language. Conflict activates your mind before your body, and words become your primary tool for managing tension. You argue to understand, clarify, and regain control of the situation.

This pattern forms because comprehension creates safety for you. When things make sense, they feel manageable. Emotional intensity without explanation can feel overwhelming or chaotic.

You're most triggered by confusion, miscommunication, or being misunderstood. When conversations feel emotionally charged but logically unclear, frustration builds quickly. You may feel compelled to talk things through immediately.

In conflict, this can look like rapid talking, debating details, or shifting topics to regain clarity. You may minimize emotional expression while staying verbally engaged. Others may feel unheard emotionally, even as the conversation continues.

This pattern can repeat as circular arguments or avoidance of emotional depth. You may use humor, intellect, or distraction to deflect vulnerability when things get intense.

Your growth lies in allowing emotion to exist without immediate explanation. Not every feeling needs to be solved to be honored. When you stay present emotionally instead of defaulting to analysis, conflict becomes connection rather than debate.`,
    reflection: 'Do you argue to understand or to avoid feeling? What would happen if you stopped explaining and just felt?',
    affirmation: 'I can feel without needing to explain. My emotions are valid even without logic.',
  },
  Cancer: {
    content: `Conflict activates your instinct to protect yourself emotionally. Anger for you is closely tied to hurt, fear, or feeling unsafe. When tension arises, your first response is often withdrawal rather than confrontation.

This pattern forms through emotional sensitivity. You feel deeply, and conflict can feel like rejection or emotional danger, even when unintended. Because of this, you may guard your heart instinctively.

You're most triggered by emotional invalidation, harsh tones, or feeling uncared for. When your feelings aren't acknowledged, anger turns inward or becomes defensive.

In conflict, this can show up as silence, moodiness, or passive resistance. You may hope others will sense your pain without you needing to explain it. Direct confrontation can feel overwhelming.

This pattern can repeat in relationships where needs go unspoken. Hurt accumulates quietly, creating emotional distance over time.

Your growth comes from learning to express hurt directly instead of protecting through retreat. Vulnerability is not exposure — it's communication. When you name your feelings openly, conflict becomes an opportunity for reassurance rather than isolation.`,
    reflection: 'What do you need during conflict that you rarely ask for? What would repair look like for you?',
    affirmation: 'I can express my hurt without losing safety. Naming my needs is an act of courage.',
  },
  Leo: {
    content: `When conflict arises, it hits you at the level of identity. You don't experience fights as neutral disagreements — they feel personal, emotional, and charged with meaning. Anger often flares when you feel disrespected, dismissed, or emotionally overlooked.

This pattern forms because you lead with heart. You invest emotionally, show up fully, and expect that effort to be acknowledged. When it isn't, the hurt cuts deep. Your anger isn't about dominance — it's about dignity. You want to feel seen, valued, and taken seriously.

What triggers you most is feeling minimized or ignored. Being talked over, mocked, or treated as insignificant can ignite immediate emotional fire. Even subtle signs of dismissal can register as rejection.

In conflict, you may become expressive, dramatic, or emotionally intense. Your reactions are visible because you don't hide what you feel. You may raise your voice, emphasize your point strongly, or seek validation in the moment. Once your emotions are acknowledged, anger tends to soften quickly — but when they aren't, resentment can linger.

This pattern can repeat in relationships where you give generously but feel underappreciated. You may find yourself fighting not just about the issue at hand, but about a deeper need to be recognized for who you are and what you contribute.

Your growth comes from separating your self-worth from the outcome of conflict. You are worthy even when misunderstood. When you learn to express hurt without needing to prove your value, your strength becomes leadership rather than reactivity.`,
    reflection: 'When does conflict feel like a threat to your identity? What would change if you didn\'t need to be right to feel valued?',
    affirmation: 'I am worthy even when misunderstood. My value doesn\'t depend on being acknowledged.',
  },
  Virgo: {
    content: `You approach conflict with precision. Anger doesn't explode — it sharpens. When something feels wrong, your instinct is to analyze, correct, and improve.

This pattern forms through responsibility. You often feel accountable for making things work, and conflict activates your desire to fix what's broken. You don't fight for emotional release — you fight to restore order.

Your biggest triggers are chaos, inefficiency, irresponsibility, or repeated mistakes. When things feel sloppy or careless, frustration builds. Emotion often turns into critique because naming flaws feels safer than expressing vulnerability.

In conflict, this can look like nitpicking, pointing out inconsistencies, or emotionally withdrawing while mentally cataloging what went wrong. Others may feel judged, even though your intention is improvement, not harm.

This pattern can repeat in relationships where you carry more emotional labor than you admit. When resentment builds, criticism becomes a shield against disappointment. You may struggle to express anger directly, instead channeling it into correction.

Your growth lies in allowing imperfection — in others and in yourself. Not every problem needs immediate fixing to be worthy of compassion. When you learn to name your emotional needs instead of managing everyone else's, conflict becomes less about control and more about connection.`,
    reflection: 'When you criticize, what are you really feeling underneath? What need is the correction masking?',
    affirmation: 'I don\'t have to fix everything to feel safe. My feelings matter more than perfection.',
  },
  Libra: {
    content: `You don't like conflict — but that doesn't mean you don't feel anger. Instead, it tends to arrive late, after being suppressed for too long.

This pattern forms through valuing harmony and fairness. You instinctively consider both sides, often prioritizing peace over expression. You may convince yourself something "isn't worth addressing," even when it bothers you deeply.

Your biggest trigger is imbalance — emotional unfairness, one-sided effort, or being pressured into confrontation. When harmony breaks suddenly, anger surfaces all at once.

In conflict, this can look like avoidance followed by a surprising emotional release. You may stay silent for long periods, then finally reach a breaking point where resentment spills out. Others may be confused by the intensity because they didn't see the buildup.

This pattern can repeat in relationships where you suppress your needs to maintain peace. Over time, unspoken anger erodes intimacy, even when things appear calm on the surface.

Your growth comes from addressing conflict early. Naming discomfort doesn't destroy harmony — it protects it. When you trust that honesty can coexist with peace, anger no longer needs to wait for an explosion to be heard.`,
    reflection: 'What are you holding back to keep the peace? What would happen if you spoke up before it built?',
    affirmation: 'Honesty protects harmony. I can address conflict early without breaking what I love.',
  },
  Scorpio: {
    content: `When you fight, it goes deep. Conflict doesn't stay on the surface for you — it activates instinct, memory, and emotional survival. Anger feels intense, focused, and purposeful.

This pattern forms because you experience threat acutely. You are highly attuned to undercurrents, power dynamics, and emotional truth. When something feels dishonest or unsafe, your nervous system reacts immediately. You don't argue casually — you engage when something matters.

You are most triggered by betrayal, secrecy, manipulation, or loss of control. Feeling emotionally exposed without protection can activate defensive intensity. Trust, once shaken, is difficult to restore.

In conflict, you may become guarded, strategic, or emotionally testing. You might withhold vulnerability, probe for truth, or escalate intensity to regain a sense of power. Others may feel overwhelmed by the depth of your reaction, even when the issue seems small on the surface.

This pattern can repeat as power struggles in relationships — not because you want control, but because emotional safety feels essential. You may struggle to let go of anger until resolution feels complete and honest.

Your growth comes from choosing transparency over defense. True power isn't found in control — it's found in openness that doesn't abandon self-protection. When you allow vulnerability without armor, conflict transforms from a battlefield into a space for deep repair.`,
    reflection: 'What does safety look like for you during conflict? Can you be open without needing to control the outcome?',
    affirmation: 'True power is transparency. I can be vulnerable without losing my strength.',
  },
  Sagittarius: {
    content: `You fight through honesty and impulse. Anger moves quickly through you and often comes out as blunt truth before it's filtered.

This pattern forms through valuing freedom and authenticity. Suppressing anger feels dishonest to you. You believe clarity is better than emotional buildup, even if it's uncomfortable.

You're most triggered by feeling trapped, restricted, or silenced. When your autonomy feels threatened, anger flares fast. Moral disagreements or perceived hypocrisy can also activate strong reactions.

In conflict, you may speak without restraint, prioritize truth over tact, or emotionally disengage after saying your piece. You want resolution, but you don't want to linger in emotional heaviness.

This can show up as explosive arguments followed by quick forgiveness — or abrupt withdrawal once the tension peaks. Others may feel hurt by the delivery, even if the intention was honesty.

Your growth lies in learning that staying present during emotional discomfort doesn't compromise your freedom. Slowing down allows truth to land without damage. When you temper honesty with emotional awareness, your words become healing rather than incendiary.`,
    reflection: 'Do you use truth as a weapon or a bridge? What would happen if you softened the delivery without changing the message?',
    affirmation: 'I can be honest and compassionate. Truth doesn\'t have to hurt to be real.',
  },
  Capricorn: {
    content: `You fight with restraint and strategy. Anger is not something you express lightly — it's managed, contained, and often internalized.

This pattern forms through self-discipline and responsibility. You learned early that composure equals strength. Losing control feels unsafe or irresponsible.

You're most triggered by disrespect, inefficiency, or emotional chaos. When things feel out of control, you may tighten emotionally rather than express frustration outwardly.

In conflict, this can show up as emotional withdrawal, rigid boundaries, or authoritative responses. You may appear calm while carrying significant internal pressure. Others may not realize how deeply affected you are.

This pattern can repeat as emotional distance in relationships, especially when vulnerability feels risky. Anger becomes something you handle alone rather than share.

Your growth comes from allowing yourself emotional expression without fearing loss of control. Strength doesn't disappear when you soften — it deepens. When you let others see your emotional reality, conflict becomes a place of connection rather than containment.`,
    reflection: 'What would happen if you let someone see your anger instead of containing it? What are you afraid of losing?',
    affirmation: 'I can be strong and emotionally expressive. Showing my feelings doesn\'t weaken my authority.',
  },
  Aquarius: {
    content: `When conflict arises, your instinct is to step back. You fight from a place of mental clarity rather than emotional immediacy. Intensity feels overwhelming, so you create distance to think.

This pattern forms through valuing autonomy and objectivity. You learned that detachment helps you stay grounded. When emotions escalate, you instinctively remove yourself to regain perspective and control.

You're most triggered by emotional pressure, possessiveness, or demands that feel irrational or restrictive. Being told how you should feel can provoke immediate resistance. Conflict feels safest when it's logical, not emotionally charged.

In conflict, you may disengage, intellectualize, or appear aloof. You might analyze the situation instead of expressing how it affects you personally. Others may interpret this as indifference, even when you care deeply.

This can repeat as emotional distance in relationships, where partners feel shut out during disagreements. You may resolve conflict internally while others wait for emotional reassurance that never comes.

Your growth comes from learning that emotional presence doesn't compromise independence. Staying connected during conflict doesn't trap you — it builds trust. When you allow yourself to remain emotionally engaged while still honoring your individuality, conflict becomes collaborative rather than isolating.`,
    reflection: 'When do you detach during conflict? What would it feel like to stay emotionally present instead of analyzing?',
    affirmation: 'Emotional presence doesn\'t compromise my freedom. I can stay connected and still be myself.',
  },
  Pisces: {
    content: `You experience conflict as overwhelming. Anger doesn't always feel like anger — it can dissolve into sadness, confusion, or exhaustion.

This pattern forms through heightened sensitivity and empathy. You feel everything at once, often absorbing others' emotions along with your own. Direct confrontation can feel emotionally unsafe.

You're most triggered by harshness, raised voices, or emotional cruelty. Conflict feels painful rather than energizing, and you may struggle to assert yourself clearly in the moment.

In conflict, this can look like withdrawal, avoidance, or emotional shutdown. You may retreat inward, hoping tension will pass without direct confrontation. Anger often surfaces later, quietly, as grief or fatigue.

This pattern can repeat in relationships where your needs go unspoken. You may prioritize peace over honesty, even when it costs you emotionally. Resentment may build beneath compassion.

Your growth comes from grounding your anger instead of dissolving into it. Anger is not a failure of compassion — it's information. When you learn to express boundaries clearly and early, conflict becomes less overwhelming and more empowering.`,
    reflection: 'What does anger feel like in your body? What would change if you treated it as information instead of something to escape?',
    affirmation: 'My anger is not a flaw. I can hold boundaries and still be compassionate.',
  },
};

// Content pools for Chapter 6 — sign-specific (12 variants, Moon defense patterns)
const PROTECTION_STYLE_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `When emotions feel overwhelming, your instinct is to act. Protection, for you, looks like movement — doing something, changing something, responding quickly before vulnerability can take hold.

This pattern forms because stillness can feel unsafe. Sitting with emotion creates intensity in your body, so your nervous system pushes toward action as a form of regulation. You protect yourself by staying ahead of the feeling rather than inside it.

You are most likely to go into defense when emotions feel heavy, stagnant, or unresolved. Sadness, fear, or helplessness can quickly turn into irritation or anger — not because you lack depth, but because anger feels more controllable than vulnerability.

This can show up as snapping, initiating conflict, or abruptly changing direction when emotional closeness becomes intense. You may feel an urgent need to do something rather than feel something. Others might misread this as impatience, when it's actually self-protection.

Your growth comes from learning that pausing does not equal being trapped. You don't lose power by staying present with emotion — you gain clarity. When you allow yourself to sit with vulnerability without immediately reacting, your strength becomes grounding instead of defensive.`,
    reflection: 'What emotion do you most often convert into action? What would happen if you stayed still with it instead?',
    affirmation: 'I can be still and still be strong. Pausing is not the same as being trapped.',
  },
  Taurus: {
    content: `When emotions feel unsafe, you protect yourself by grounding. Stability, routine, and physical comfort become your shield against emotional disruption.

This pattern forms through a deep need for safety and predictability. Emotional upheaval feels threatening, so your nervous system seeks calm through familiarity. You regulate by slowing down, settling in, and holding onto what feels known.

You are most likely to go into defense when change feels forced or emotional pressure builds too quickly. When your sense of security is shaken, you may retreat into silence, comfort, or emotional immobility.

This can show up as withdrawing, resisting conversation, or emotionally shutting down until things feel stable again. Others may interpret this as stubbornness, but it's actually self-soothing.

Your growth lies in learning that emotional movement doesn't always mean loss. You can stay grounded while still engaging. When you allow small emotional shifts without resisting them, protection becomes resilience instead of avoidance.`,
    reflection: 'What do you hold onto when emotions feel unsafe? What would it feel like to let go — just a little?',
    affirmation: 'I can be safe and still allow change. Emotional movement doesn\'t threaten my stability.',
  },
  Gemini: {
    content: `When emotions become intense, your instinct is to think your way out. Protection, for you, looks like analyzing, explaining, or mentally distancing from the feeling.

This pattern forms because understanding creates safety. When emotions are named and categorized, they feel manageable. Emotional chaos without explanation can feel overwhelming or disorienting.

You are most likely to go into defense when feelings feel heavy, confusing, or emotionally charged without clarity. Silence, intensity, or pressure to "just feel" can trigger restlessness or detachment.

This can show up as over-talking, joking, changing the subject, or intellectualizing emotions instead of experiencing them. Others may feel you're avoiding depth, when you're actually regulating anxiety.

Your growth comes from allowing feelings to exist without immediate interpretation. You don't need to understand everything to be safe. When you let emotions move through you without analysis, protection turns into presence.`,
    reflection: 'When do you reach for words instead of feelings? What would silence feel like if you trusted it?',
    affirmation: 'I don\'t need to understand my feelings to honor them. Presence is its own kind of safety.',
  },
  Cancer: {
    content: `When emotions feel unsafe, your instinct is to retreat inward. Protection, for you, looks like pulling back, guarding your heart, and creating emotional shelter.

This pattern forms through deep emotional sensitivity. You feel things intensely, and emotional overwhelm can feel like a threat to your sense of safety. Your nervous system responds by seeking familiarity, comfort, and emotional containment.

You are most likely to go into defense when you feel emotionally exposed, misunderstood, or uncared for. Harsh tones, emotional distance, or unpredictability can activate withdrawal. You may retreat not because you don't care, but because you care deeply.

This can show up as silence, emotional shutdown, or becoming inwardly preoccupied. You may hope others will sense your hurt without you needing to explain it. While this protects you in the moment, it can create emotional distance over time.

Your growth comes from learning that expressing vulnerability doesn't remove your protection — it is protection. When you name your needs gently and directly, you allow connection to restore safety rather than relying on retreat alone.`,
    reflection: 'What do you need most when you retreat? What would happen if you asked for it instead of waiting?',
    affirmation: 'Expressing my needs is not weakness. Vulnerability invites the care I deserve.',
  },
  Leo: {
    content: `When emotions feel overwhelming, you protect yourself through pride and emotional strength. You instinctively try to stay composed, confident, and self-contained.

This pattern forms through a need to preserve dignity. Feeling emotionally exposed can feel destabilizing, so you armor yourself with confidence and warmth rather than letting others see your hurt.

You are most likely to go into defense when you feel ignored, unappreciated, or emotionally dismissed. Being overlooked can activate deep vulnerability, which you quickly cover with strength or expressive confidence.

This can show up as emotional dramatization, seeking reassurance, or pulling attention back toward yourself when you feel unseen. Others may perceive this as neediness, when it's actually a bid for emotional safety.

Your growth lies in allowing yourself to be seen even when you don't feel strong. You don't lose worth by being vulnerable. When you let others witness your emotional truth, protection becomes connection rather than performance.`,
    reflection: 'When do you perform strength instead of feeling it? What would it look like to let someone see your softer side?',
    affirmation: 'I am worthy even in my vulnerability. I don\'t have to be strong to be loved.',
  },
  Virgo: {
    content: `When emotions feel unsafe, your instinct is to control and organize. Protection, for you, looks like staying useful, composed, and internally regulated.

This pattern forms through a belief that chaos equals danger. You feel safer when things make sense and when you know what to do next. Emotional overwhelm can activate self-criticism rather than expression.

You are most likely to go into defense when emotions feel messy, unpredictable, or overwhelming. Instead of feeling, you may focus on fixing, correcting, or managing the situation.

This can show up as emotional suppression, perfectionism, or quietly taking responsibility for everyone's comfort. Others may not realize how much you're holding inside.

Your growth comes from allowing imperfection — especially emotional imperfection. You don't need to manage your feelings to deserve care. When you let yourself feel without fixing, protection becomes gentleness rather than control.`,
    reflection: 'What emotions do you try to organize instead of feel? What would happen if you let them be messy?',
    affirmation: 'I don\'t have to manage my emotions to be worthy. Messy feelings are still valid feelings.',
  },
  Libra: {
    content: `When emotions feel unsafe, your instinct is to restore balance. Protection, for you, looks like smoothing tension, mediating conflict, and keeping emotional harmony intact.

This pattern forms through sensitivity to relational dynamics. Emotional discord feels destabilizing, so your nervous system seeks equilibrium. You protect yourself by making sure everyone else is okay — hoping that peace around you will create safety within you.

You are most likely to go into defense when conflict feels intense, unfair, or emotionally charged. Raised voices, emotional volatility, or pressure to choose sides can overwhelm you. Instead of asserting your own needs, you focus on calming the situation.

This can show up as people-pleasing, minimizing your feelings, or delaying difficult conversations. You may convince yourself that your needs can wait, especially if addressing them might disrupt harmony. Over time, this can create quiet resentment or emotional fatigue.

Your growth comes from learning that your emotions are not a threat to balance — they are part of it. Naming discomfort early doesn't create chaos; it prevents it. When you allow yourself to take up emotional space, protection becomes mutual rather than self-sacrificing.`,
    reflection: 'Whose emotional comfort are you managing at the cost of your own? What would happen if you chose yourself?',
    affirmation: 'My feelings are not a disruption. Taking up emotional space is an act of balance.',
  },
  Scorpio: {
    content: `When emotions feel unsafe, your instinct is to fortify. Protection, for you, looks like emotional privacy, control, and selective vulnerability.

This pattern forms through deep emotional awareness and instinctual self-protection. You feel intensely, and emotional exposure without trust feels dangerous. Your nervous system responds by building strong internal walls.

You are most likely to go into defense when trust feels compromised, when emotions are dismissed, or when you sense hidden motives. Betrayal — real or perceived — activates immediate emotional lockdown.

This can show up as withdrawal, emotional testing, or withholding vulnerability. You may keep feelings close, revealing only what feels absolutely safe. While this protects you, it can also isolate you emotionally.

Your growth comes from learning that vulnerability doesn't mean surrendering control. You can open selectively without abandoning yourself. When you choose transparency with those who've earned trust, protection transforms into deep emotional intimacy.`,
    reflection: 'What would it cost to let someone past your walls? What are you protecting that might be safe to share?',
    affirmation: 'I can be open without being exposed. Selective vulnerability is still vulnerability.',
  },
  Sagittarius: {
    content: `When emotions feel overwhelming, your instinct is to seek space. Protection, for you, looks like movement, humor, or reframing pain into something bigger or more philosophical.

This pattern forms through a need for freedom and perspective. Emotional heaviness can feel suffocating, so your nervous system looks for relief through distance — physical, emotional, or mental.

You are most likely to go into defense when emotions feel confining, intense, or repetitive. Feeling trapped in emotional cycles can activate restlessness or avoidance.

This can show up as minimizing feelings, changing the subject, or emotionally disengaging to regain a sense of lightness. Others may feel you're avoiding depth, when you're actually regulating overwhelm.

Your growth lies in learning that staying with emotion doesn't remove freedom — it creates emotional resilience. You don't have to escape feelings to survive them. When you allow yourself to stay present, protection becomes expansion rather than avoidance.`,
    reflection: 'What feeling do you most often run from? What would it teach you if you stayed?',
    affirmation: 'I can stay present with heavy feelings and still be free. Depth doesn\'t trap me — it grounds me.',
  },
  Capricorn: {
    content: `When emotions feel unsafe, your instinct is to contain them. Protection, for you, looks like composure, self-control, and emotional responsibility.

This pattern forms through learning early that vulnerability required strength. You learned to manage your emotions privately and to stay functional even when things hurt. Emotional expression may feel risky or inefficient, especially in moments of stress.

You are most likely to go into defense when emotions feel chaotic, overwhelming, or unproductive. Feeling out of control internally can trigger shutdown, rigidity, or emotional distance. You protect yourself by staying capable.

This can show up as emotional restraint, stoicism, or taking on responsibility rather than asking for support. Others may assume you're unaffected, when in reality you're carrying a great deal silently.

Your growth comes from allowing yourself to soften without losing authority. You don't become weaker by sharing emotional weight — you become more supported. When you let others see what you're holding, protection becomes partnership instead of isolation.`,
    reflection: 'What are you carrying silently? What would it feel like to let someone help hold it?',
    affirmation: 'Asking for support is not failure. I can be strong and still be held.',
  },
  Aquarius: {
    content: `When emotions feel overwhelming, your instinct is to step back. Protection, for you, looks like distance, objectivity, and emotional independence.

This pattern forms through valuing autonomy and mental clarity. Intense emotions can feel disorganizing, so your nervous system creates space to think and regulate. You protect yourself by disengaging emotionally rather than being swept up.

You are most likely to go into defense when emotions feel demanding, dramatic, or consuming. Expectations for emotional closeness may feel like pressure rather than comfort.

This can show up as emotional withdrawal, intellectualizing feelings, or needing space during emotionally charged moments. Others may interpret this as indifference, even when you care deeply.

Your growth lies in learning that emotional presence doesn't erase independence. You can stay connected without losing yourself. When you remain emotionally engaged while honoring your boundaries, protection becomes trust rather than distance.`,
    reflection: 'When does closeness feel like pressure? What would change if you stayed present instead of stepping back?',
    affirmation: 'I can be emotionally present without losing my independence. Connection and autonomy coexist.',
  },
  Pisces: {
    content: `When emotions feel unsafe, your instinct is to dissolve rather than confront. Protection, for you, looks like retreating into imagination, compassion, or emotional numbing.

This pattern forms through extreme sensitivity. You absorb emotional energy easily, and overwhelm can feel consuming. Your nervous system protects you by escaping — emotionally, mentally, or energetically.

You are most likely to go into defense when emotions feel harsh, loud, or overwhelming. Confrontation may feel painful rather than clarifying, leading you to withdraw or disengage.

This can show up as emotional avoidance, dissociation, or self-sacrifice. You may prioritize others' feelings while neglecting your own, hoping peace will return on its own.

Your growth comes from grounding your emotions instead of disappearing inside them. Boundaries don't block compassion — they preserve it. When you learn to stay present without absorbing everything, protection becomes stability rather than self-loss.`,
    reflection: 'When do you disappear inside someone else\'s emotions? What would it feel like to stay in your own body?',
    affirmation: 'I can feel deeply without dissolving. My boundaries preserve my compassion.',
  },
};

const INNER_CHILD_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `Your inner child is brave — impulsive, fiery, and desperate to be seen. Mercury in Aries means your young mind learned to speak fast, act first, and trust instinct over explanation. You didn't wait to be called on. You raised your hand before you had the answer.

This pattern forms because your early environment rewarded speed. Being quick meant being safe, being noticed, being relevant. Hesitation felt dangerous — like the moment might pass, like someone else would take your turn, like you'd become invisible.

When this need wasn't fully met — when your boldness was punished, your directness corrected, or your volume shamed — a wound formed around expression itself. You may have learned that being yourself was "too much." That your natural speed was disruptive rather than brilliant.

This can show up now as speaking before thinking, interrupting, or feeling anxious when conversations move slowly. You may struggle to listen fully because your mind is already ten steps ahead. Or you may have overcorrected — becoming quiet when your instinct is to be loud.

Your inner child needs permission to be direct without punishment. They need to know that their speed is a gift, not a flaw. They don't need to slow down to be loved — they need someone who can keep up.

Your growth comes from learning that pausing doesn't mean you've lost your edge. You can be both quick and thoughtful. When you give your inner child space to speak without urgency, their bravery becomes wisdom rather than reactivity.`,
    reflection: 'When were you first told you were "too much"? What would that brave child say if they felt completely safe?',
    affirmation: 'My directness is a gift. I can speak my truth and still be loved.',
  },
  Taurus: {
    content: `Your inner child is grounded — steady, sensory, and quietly stubborn. Mercury in Taurus means your young mind learned through touch, repetition, and the slow accumulation of understanding. You didn't rush to conclusions. You let things settle before speaking.

This pattern forms because your early environment valued reliability. Being consistent, calm, and predictable felt safe. Your nervous system learned to process slowly and deeply rather than quickly and reactively.

When this need wasn't met — when you were rushed, pressured to respond before you were ready, or made to feel slow — a wound formed around your natural pace. You may have internalized that careful thinking means being behind, or that needing time to process means you're not smart enough.

This can show up now as difficulty articulating feelings in real time, frustration when pressured to decide quickly, or a tendency to shut down when conversations move too fast. You may hold your best thoughts inside because the moment passes before you feel ready to share them.

Your inner child needs permission to take their time. They need to know that slowness is depth, not deficiency. They don't need to speed up to be heard — they need a world that's patient enough to listen.

Your growth comes from trusting your natural rhythm even when the world feels urgent. When you honor your inner child's pace, their steadiness becomes clarity rather than hesitation.`,
    reflection: 'When were you made to feel too slow? What would your younger self say if they had all the time they needed?',
    affirmation: 'My pace is my wisdom. I don\'t need to rush to be understood.',
  },
  Gemini: {
    content: `Your inner child is endlessly curious — chatty, playful, and hungry for information. Mercury in Gemini means your young mind was electric, jumping between ideas, questions, and connections faster than anyone could follow. You wanted to know everything.

This pattern forms because your early environment stimulated your mind. Words, stories, and conversation were how you made sense of the world. Curiosity was survival — understanding meant safety, and questions were your way of mapping the unknown.

When this need wasn't met — when your questions were dismissed, your curiosity called annoying, or your quick mind was labeled scattered — a wound formed around your intellect itself. You may have learned that asking too many questions was burdensome, or that your restlessness meant something was wrong with you.

This can show up now as difficulty focusing, talking to fill silence, or constantly seeking new stimulation. You may struggle to stay present because your mind is always reaching for the next thing. Or you may have learned to suppress your curiosity, dimming your natural brightness to fit in.

Your inner child needs their questions honored. They need to know that their curiosity is a superpower, not a disruption. They don't need to focus to be valuable — they need permission to explore.

Your growth comes from giving your inner child both stimulation and stillness. When you let them be curious without anxiety driving the search, their intelligence becomes playful rather than restless.`,
    reflection: 'What question were you taught not to ask? What happens when you let your curiosity lead without judgment?',
    affirmation: 'My curiosity is a gift. I can explore freely and still find my center.',
  },
  Cancer: {
    content: `Your inner child is deeply feeling — tender, intuitive, and longing for emotional safety. Mercury in Cancer means your young mind processed the world through emotion first, logic second. You didn't just hear words — you felt the tone behind them.

This pattern forms because your early environment was emotionally significant. You were tuned into the moods of the people around you, absorbing their feelings before you had language for your own. Emotional intelligence was how you navigated safety.

When this need wasn't met — when your sensitivity was dismissed, your tears were shamed, or the emotional climate around you was unstable — a wound formed around emotional expression itself. You may have learned that feeling deeply was dangerous, or that your needs were too much for others to hold.

This can show up now as difficulty speaking about emotions directly, withdrawing when you feel misunderstood, or communicating through hints rather than statements. You may expect others to sense what you need without being told, because asking directly feels too vulnerable.

Your inner child needs emotional attunement. They need someone who notices the shift in their expression, who asks "are you okay?" and means it. They don't need to toughen up — they need to be held as they are.

Your growth comes from learning to name your emotions directly. When you give your inner child words for their feelings, their sensitivity becomes a bridge to others rather than a wall around themselves.`,
    reflection: 'What emotion were you taught to hide? What would it feel like to say it out loud to someone safe?',
    affirmation: 'My sensitivity is my wisdom. I can feel deeply and still feel safe.',
  },
  Leo: {
    content: `Your inner child is expressive — creative, warm, and longing to be celebrated. Mercury in Leo means your young mind processed the world through storytelling, self-expression, and the desire to be truly seen. You didn't just want to participate — you wanted to matter.

This pattern forms because your early environment shaped your sense of worth through recognition. Being noticed, praised, and appreciated made you feel real. Your creative expression was how you communicated your value to the world.

When this need wasn't met — when your self-expression was overshadowed, your creativity dismissed, or your need for attention shamed — a wound formed around visibility itself. You may have learned that wanting to be seen was selfish, or that your natural warmth was "showing off."

This can show up now as either craving the spotlight or avoiding it entirely. You may dramatize experiences to ensure they're heard, or you may hold back your most authentic expression for fear of judgment. Performance can become a substitute for genuine connection.

Your inner child needs to be celebrated without conditions. They need to know that their light doesn't diminish anyone else's. They don't need an audience to be worthy — but their desire to shine is not a flaw.

Your growth comes from expressing yourself for connection rather than validation. When your inner child creates for the joy of creation, their expressiveness becomes authentic presence rather than performance.`,
    reflection: 'When were you told your self-expression was "too much"? What would you create if no one was watching?',
    affirmation: 'My light is not a burden. I can shine authentically and still be loved.',
  },
  Virgo: {
    content: `Your inner child is watchful — observant, careful, and quietly perfectionistic. Mercury in Virgo means your young mind was precise, noticing details others missed, seeking order in chaos, and trying to get things exactly right. You paid attention to everything.

This pattern forms because your early environment rewarded correctness. Being accurate, helpful, and self-sufficient felt safe. Mistakes felt dangerous — not just wrong, but shameful. Your nervous system learned that control over details meant control over your world.

When this need wasn't met — when your effort went unnoticed, your mistakes were magnified, or you were held to impossible standards — a wound formed around competence itself. You may have learned that being good enough required being perfect, and that any flaw was evidence of deeper inadequacy.

This can show up now as harsh self-criticism, difficulty accepting compliments, or obsessive attention to detail that masks deeper anxiety. You may over-prepare, over-explain, or silently hold yourself to standards you'd never impose on others.

Your inner child needs to hear that they're enough as they are. They need to know that mistakes are how humans learn, not evidence of failure. They don't need to be useful to deserve love.

Your growth comes from extending to yourself the same gentleness you offer others. When you let your inner child be imperfect, their precision becomes discernment rather than self-punishment.`,
    reflection: 'What standard do you hold yourself to that you\'d never ask of someone you love? Where did that standard begin?',
    affirmation: 'I am enough without being perfect. My worth is not measured by my usefulness.',
  },
  Libra: {
    content: `Your inner child is relational — attuned, diplomatic, and deeply concerned with fairness. Mercury in Libra means your young mind was oriented toward others — reading social cues, seeking harmony, and trying to understand every side of every situation. You wanted everyone to feel included.

This pattern forms because your early environment required balance. Conflict may have felt threatening, so you learned to mediate, accommodate, and smooth things over. Keeping the peace became your way of staying safe.

When this need wasn't met — when harmony was impossible despite your best efforts, when fairness was absent, or when your own needs were consistently sacrificed for others' — a wound formed around self-assertion. You may have learned that having strong opinions was dangerous, or that your value depended on making others comfortable.

This can show up now as chronic indecision, difficulty saying no, or presenting balanced views when you actually have a strong preference. You may lose yourself in others' perspectives, or feel anxious when relationships are out of balance.

Your inner child needs to know that their needs matter as much as anyone else's. They need permission to disagree without losing connection. They don't need to keep the peace to be loved — their presence alone is enough.

Your growth comes from practicing self-assertion as an act of self-care. When you let your inner child have preferences and voice them, their diplomacy becomes authentic relating rather than self-abandonment.`,
    reflection: 'Whose comfort do you prioritize over your own? What would your younger self say if their opinion truly mattered?',
    affirmation: 'My needs matter as much as anyone else\'s. I can be honest and still be kind.',
  },
  Scorpio: {
    content: `Your inner child is private — intense, perceptive, and carrying more than they ever let on. Mercury in Scorpio means your young mind was drawn to hidden truths, unspoken dynamics, and the emotional undercurrents that others missed entirely. You saw through surfaces.

This pattern forms because your early environment taught you that knowledge was power and vulnerability was risk. You learned to observe before speaking, to hold your cards close, and to trust your instincts about what was really going on beneath the words.

When this need wasn't met — when your perceptiveness was called paranoid, your intensity was feared, or your private world was invaded — a wound formed around trust itself. You may have learned that letting others see you fully would give them power over you, or that your depth was something to hide rather than honor.

This can show up now as difficulty sharing your inner world, testing people before trusting them, or holding grudges because vulnerability feels too costly. You may communicate indirectly, revealing pieces of yourself only when you're certain of safety.

Your inner child needs to know that their depth is not a burden. They need someone who can hold their intensity without flinching. They don't need to perform lightness — they need permission to be exactly as complex as they are.

Your growth comes from learning that selective vulnerability is still vulnerability. When you let your inner child trust in small doses, their perceptiveness becomes intimacy rather than isolation.`,
    reflection: 'What truth about yourself have you never told anyone? What would change if you did?',
    affirmation: 'My depth is my strength. I can let people in without losing my power.',
  },
  Sagittarius: {
    content: `Your inner child is a truth-seeker — adventurous, philosophical, and hungry for meaning. Mercury in Sagittarius means your young mind was expansive, always looking beyond the immediate to find the bigger picture, the deeper reason, the point of it all. Small talk bored you. You wanted the real conversation.

This pattern forms because your early environment sparked your quest for understanding. Whether through travel, education, spirituality, or sheer curiosity, you learned that the world was vast and knowledge was freedom. Understanding the "why" behind everything gave you a sense of control.

When this need wasn't met — when your big questions were dismissed, your enthusiasm dampened, or your search for meaning was called naive — a wound formed around your optimism itself. You may have learned that hope was impractical, or that your need for expansiveness made you unreliable.

This can show up now as restlessness, difficulty committing to one path, or using humor and philosophy to avoid emotional depth. You may over-promise, speak in broad strokes rather than specifics, or flee situations that feel confining.

Your inner child needs their quest for truth honored. They need to know that asking "why?" is not naive — it's courageous. They don't need to settle down to be taken seriously — their expansiveness is their gift.

Your growth comes from finding depth within exploration. When you let your inner child seek meaning without running from the present moment, their adventurousness becomes wisdom rather than avoidance.`,
    reflection: 'What truth are you still searching for? What would it mean to find enough meaning right where you are?',
    affirmation: 'My search for meaning is valid. I can explore endlessly and still feel at home in myself.',
  },
  Capricorn: {
    content: `Your inner child is serious — responsible, self-contained, and old beyond their years. Mercury in Capricorn means your young mind was structured, goal-oriented, and already thinking about the future while other children lived in the present. You understood consequences early.

This pattern forms because your early environment required maturity. You may have taken on responsibility before you were ready, learned that reliability was more valued than playfulness, or internalized that your worth was tied to your competence.

When this need wasn't met — when your seriousness was exploited rather than protected, when play was unavailable, or when you were expected to handle things beyond your years — a wound formed around childhood itself. You may have learned that being a child was a luxury you couldn't afford.

This can show up now as difficulty relaxing, impostor syndrome despite real achievement, or measuring your worth through productivity. You may feel guilty resting, struggle to accept help, or dismiss your own accomplishments as never quite enough.

Your inner child needs permission to play without purpose. They need to know that they don't have to earn love through achievement. Their value isn't tied to what they produce — it exists simply because they do.

Your growth comes from giving your inner child the freedom they never had. When you let them rest, play, and be imperfect, their discipline becomes sustainable ambition rather than self-imposed pressure.`,
    reflection: 'When did you stop playing? What would your younger self do with an afternoon of no responsibilities?',
    affirmation: 'I don\'t have to earn my rest. My worth exists beyond what I achieve.',
  },
  Aquarius: {
    content: `Your inner child is unconventional — independent, original, and quietly aware that they see the world differently from everyone around them. Mercury in Aquarius means your young mind was innovative, questioning norms, and forming ideas that didn't fit neatly into the categories others used.

This pattern forms because your early environment highlighted your difference. Whether you were the one who asked questions no one expected, held opinions that confused your peers, or simply processed the world in a way that felt foreign to those around you — being different was your defining experience.

When this need wasn't met — when your uniqueness was pathologized, your independence was called defiance, or your unconventional thinking was dismissed — a wound formed around belonging itself. You may have learned that being truly yourself meant being alone, or that fitting in required dimming your originality.

This can show up now as emotional detachment, intellectualizing feelings, or maintaining distance from groups even while wanting connection. You may feel like an outsider in most social settings, or use irony and abstraction to avoid being truly known.

Your inner child needs to know that they belong without having to change. They need a world that values their unusual perspective rather than trying to normalize it. They don't need to fit in — they need people who appreciate them for standing out.

Your growth comes from allowing yourself to belong without losing your individuality. When you let your inner child connect without intellectual armor, their originality becomes contribution rather than isolation.`,
    reflection: 'When did you first realize you were different? What would belonging feel like if you didn\'t have to conform?',
    affirmation: 'I belong exactly as I am. My uniqueness is my contribution, not my barrier.',
  },
  Pisces: {
    content: `Your inner child is imaginative — dreamy, empathic, and deeply connected to a world that others can't always see. Mercury in Pisces means your young mind processed reality through feeling, image, and intuition rather than logic. You understood things before you had words for them.

This pattern forms because your early environment was experienced primarily through emotion and atmosphere. You absorbed the feelings of the people around you, blurred the boundaries between self and other, and found safety in imagination, stories, and inner worlds.

When this need wasn't met — when your sensitivity was called weakness, your imagination was dismissed as unrealistic, or your boundaries were too porous to protect you — a wound formed around reality itself. You may have learned that the real world wasn't safe for someone who felt this much, or that your inner world was more real than the outer one.

This can show up now as difficulty focusing, escapism, confusion about your own feelings versus others', or a tendency to idealize people and situations. You may struggle to assert yourself because you feel everyone's perspective simultaneously.

Your inner child needs their inner world honored. They need to know that their imagination is not escape — it's a different kind of intelligence. They don't need to "get real" — they need a reality gentle enough to hold them.

Your growth comes from learning to ground your sensitivity without numbing it. When you let your inner child feel without losing themselves in others' feelings, their imagination becomes creative power rather than overwhelm.`,
    reflection: 'What inner world did you create to feel safe? What would it feel like to bring that tenderness into your daily life?',
    affirmation: 'My sensitivity is wisdom, not weakness. I can feel everything and still know who I am.',
  },
};

const GROWTH_ARC_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `Your growth arc unfolds through courage, initiative, and willingness to take risks. You expand by acting — not by waiting until you feel ready. Life teaches you who you are by asking you to step forward.

This pattern forms because movement creates confidence for you. You don't grow by overthinking or observing from the sidelines. You grow by trying, failing, adjusting, and trying again. Experience is your teacher.

You're most expanded when you trust your instincts and allow yourself to begin something new. Leadership, entrepreneurship, and self-directed paths tend to unlock growth. Hesitation and prolonged indecision, on the other hand, can cause stagnation.

Challenges arise when impulsivity replaces intention. You may leap before checking whether something truly aligns, mistaking momentum for purpose. Burnout can follow when growth feels like constant pushing.

Your growth comes from learning when to act — and when to pause without losing faith in yourself. Courage doesn't require urgency. When you move with intention, your path becomes empowering rather than exhausting.`,
    reflection: 'Where in your life are you waiting for permission to begin? What would happen if you trusted your impulse?',
    affirmation: 'I grow through action. My courage creates my path.',
  },
  Taurus: {
    content: `Your growth arc unfolds through building something lasting. You expand by cultivating patience, consistency, and trust in slow progress. Growth for you is rooted — not rushed.

This pattern forms because security creates confidence. You thrive when you feel grounded and resourced. Sudden leaps or dramatic change can feel destabilizing, even when opportunity is present.

You expand through commitment — to people, values, and long-term goals. Financial literacy, embodied practices, and steady creative work often support your growth. When you trust the process, abundance follows naturally.

Challenges arise when comfort becomes resistance. You may avoid necessary change or cling to what feels safe even when it limits expansion.

Your growth comes from learning that evolution doesn't erase security — it deepens it. When you allow yourself to change intentionally, your foundation becomes stronger, not weaker.`,
    reflection: 'What are you holding onto that feels safe but is keeping you small? What would intentional change look like?',
    affirmation: 'I can grow without losing my ground. Evolution deepens my security.',
  },
  Gemini: {
    content: `Your growth arc unfolds through learning, communication, and mental exploration. You expand by asking questions, exchanging ideas, and staying open to multiple perspectives.

This pattern forms because knowledge excites you. Growth happens when your mind is engaged and stimulated. Variety keeps you alive, and learning feels joyful rather than heavy.

You expand through writing, speaking, teaching, and connecting information. New environments and conversations unlock insight. Stagnation occurs when curiosity is stifled or when routine dulls your engagement.

Challenges arise when depth is avoided in favor of novelty. You may skim experiences without fully integrating them, mistaking movement for growth.

Your growth comes from staying long enough to integrate what you learn. Curiosity doesn't lose its magic when it deepens — it gains meaning. When you allow insight to settle, wisdom follows.`,
    reflection: 'What have you learned recently that you haven\'t fully integrated? What would it mean to go deeper?',
    affirmation: 'My curiosity is my compass. Depth and breadth can coexist.',
  },
  Cancer: {
    content: `Your growth arc unfolds through emotional nourishment, belonging, and the creation of safety. You expand when you feel rooted — in relationships, in home, and in your inner world.

This pattern forms because emotional security allows you to take risks. When you feel cared for, supported, and emotionally understood, your confidence grows naturally. Growth for you is not about pushing forward alone; it's about feeling held as you evolve.

You expand through caregiving roles, community building, and emotionally meaningful work. Creating spaces — literal or emotional — where others feel safe often unlocks abundance for you as well. When you trust your intuition, opportunities arise organically.

Challenges emerge when fear of loss or abandonment limits expansion. You may hesitate to leave familiar emotional territory, even when growth calls you elsewhere. Overprotectiveness can keep you small.

Your growth comes from learning that you can carry safety within you. You don't have to stay where you started to remain secure. When you trust yourself to self-soothe and self-support, expansion feels nurturing rather than threatening.`,
    reflection: 'What emotional safety do you need before you can expand? Can you create that for yourself?',
    affirmation: 'I carry safety within me. I can grow and still feel held.',
  },
  Leo: {
    content: `Your growth arc unfolds through visibility, creativity, and wholehearted self-expression. You expand when you allow yourself to take up space unapologetically.

This pattern forms because joy fuels your growth. When you're engaged in what lights you up — creative pursuits, leadership, performance, or heartfelt expression — opportunities multiply. Confidence becomes a magnet.

You expand through courageously sharing your gifts. When you believe in yourself and let others see you, life responds generously. Teaching, inspiring, or leading with warmth often brings fulfillment and abundance.

Challenges arise when self-doubt or fear of judgment holds you back. You may dim your light to avoid criticism or rejection, limiting growth that requires visibility.

Your growth comes from remembering that self-expression is not arrogance — it's contribution. When you honor your creative fire and allow it to be seen, expansion becomes joyful and sustaining.`,
    reflection: 'Where have you been dimming your light? What would it feel like to share your gifts without apology?',
    affirmation: 'My self-expression is my contribution. Joy is my growth path.',
  },
  Virgo: {
    content: `Your growth arc unfolds through purpose, usefulness, and meaningful contribution. You expand when your efforts make a tangible difference.

This pattern forms because service gives your life meaning. Growth happens when you feel aligned with work that improves systems, supports others, or brings clarity. Progress feels earned through effort and intention.

You expand through skill development, thoughtful service, and practical problem-solving. Teaching, healing, or refining processes often opens doors. When your work feels helpful, abundance follows.

Challenges arise when self-criticism limits expansion. You may undervalue your contributions or hesitate to step into larger roles, believing you're not "ready enough."

Your growth comes from recognizing that you don't need perfection to expand. When you trust that your effort is already meaningful, growth becomes collaborative rather than self-punishing.`,
    reflection: 'What contribution are you undervaluing? What would happen if you trusted that you\'re already enough?',
    affirmation: 'My effort is already meaningful. I don\'t need perfection to grow.',
  },
  Libra: {
    content: `Your growth arc unfolds through connection, collaboration, and relational wisdom. You expand when you learn through others — through dialogue, partnership, and shared experience.

This pattern forms because reflection helps you understand yourself. Seeing different perspectives stretches your worldview and refines your values. Growth for you is not solitary; it's relational.

You expand through partnerships that feel fair, inspiring, and mutually respectful. Creative collaborations, mediation, and roles that require diplomacy often open doors. When relationships feel balanced, opportunity flows.

Challenges arise when indecision or people-pleasing limits forward movement. You may delay growth waiting for consensus or approval, fearing that choosing yourself could disrupt harmony.

Your growth comes from trusting your own perspective. You don't need agreement to move forward. When you choose alignment over approval, expansion becomes both graceful and self-directed.`,
    reflection: 'Where are you waiting for someone else\'s permission to grow? What would self-directed expansion look like?',
    affirmation: 'I can grow through connection and still trust my own direction.',
  },
  Scorpio: {
    content: `Your growth arc unfolds through depth, truth, and emotional transformation. You expand by facing what others avoid and by moving through intense inner change.

This pattern forms because surface-level experiences don't satisfy you. Growth for you requires emotional honesty and willingness to confront shadow. Crisis, endings, and rebirth often become gateways rather than obstacles.

You expand through healing work, psychological insight, and transformative experiences. When you lean into vulnerability instead of resisting it, profound growth follows.

Challenges arise when fear of loss or control prevents surrender. Holding tightly to old identities can stall expansion that requires release.

Your growth comes from trusting the process of transformation. You are not broken in moments of collapse — you are becoming. When you allow yourself to change fully, growth becomes powerful and liberating.`,
    reflection: 'What identity are you holding onto that no longer fits? What would it feel like to release it?',
    affirmation: 'Transformation is my growth path. I trust the process of becoming.',
  },
  Sagittarius: {
    content: `Your growth arc unfolds through exploration, meaning, and belief. You expand by seeking truth, understanding the world, and stretching beyond familiar boundaries.

This pattern forms because curiosity fuels you. Growth happens when you're learning, traveling, teaching, or questioning old assumptions. Stagnation occurs when life feels narrow or confined.

You expand through philosophy, higher education, travel, and experiences that broaden perspective. When you follow curiosity honestly, opportunity multiplies.

Challenges arise when restlessness replaces integration. You may chase new horizons without fully embodying what you've learned.

Your growth comes from grounding wisdom into lived experience. Truth becomes powerful when it's practiced, not just pursued. When you integrate insight, expansion becomes enduring.`,
    reflection: 'What truth have you been chasing that you could start living right now?',
    affirmation: 'I grow through exploration. Wisdom lives in the journey, not just the destination.',
  },
  Capricorn: {
    content: `Your growth arc unfolds through discipline, responsibility, and long-term vision. You expand by committing to something meaningful and seeing it through with patience and integrity.

This pattern forms because structure creates confidence for you. Growth isn't about luck or shortcuts — it's about effort, consistency, and earned wisdom. You become more yourself as you build something real over time.

You expand through leadership, mentorship, and taking responsibility for outcomes. Careers, legacy projects, and roles that require perseverance often unlock abundance. When you trust your ability to endure, growth follows steadily.

Challenges arise when self-pressure becomes restrictive. You may equate worth with productivity or delay expansion until everything feels "perfect." This can slow growth unnecessarily.

Your growth comes from allowing yourself to succeed and to rest. Mastery doesn't require constant self-denial. When you honor both ambition and humanity, expansion becomes sustainable and deeply fulfilling.`,
    reflection: 'Where are you pushing too hard? What would growth look like if it included rest?',
    affirmation: 'I can build something lasting and still be gentle with myself.',
  },
  Aquarius: {
    content: `Your growth arc unfolds through originality, innovation, and contribution to something larger than yourself. You expand by thinking differently and breaking patterns that no longer serve.

This pattern forms because freedom fuels growth. You thrive when you're allowed to explore unconventional ideas and connect with communities that share your vision. Growth feels meaningful when it benefits more than just you.

You expand through technology, social change, humanitarian work, and visionary thinking. When you trust your unique perspective, opportunities appear in unexpected ways.

Challenges arise when detachment replaces embodiment. You may stay in ideas without grounding them into action, or distance yourself emotionally from growth opportunities.

Your growth comes from anchoring innovation in lived experience. When you stay connected — to people, feelings, and reality — your ideas become transformative rather than theoretical.`,
    reflection: 'What vision are you holding that needs grounding? How can you connect your ideas to real impact?',
    affirmation: 'My originality is my growth path. I can innovate and still stay connected.',
  },
  Pisces: {
    content: `Your growth arc unfolds through compassion, intuition, and spiritual trust. You expand by releasing control and allowing life to guide you.

This pattern forms because sensitivity is your strength. Growth for you doesn't come from force — it comes from alignment. When you listen inwardly, life responds with synchronicity.

You expand through creativity, healing, spirituality, and service rooted in empathy. When you trust your intuition, doors open effortlessly.

Challenges arise when boundaries dissolve too completely. Overgiving, escapism, or avoidance can stall growth by draining your energy.

Your growth comes from learning that surrender doesn't mean self-erasure. Grounding your intuition allows expansion to be nourishing rather than overwhelming. When you honor both spirit and self, growth becomes graceful and profound.`,
    reflection: 'Where are you giving too much of yourself away? What would growth look like if it honored your boundaries?',
    affirmation: 'I grow through trust. Surrender and self-care are not opposites.',
  },
};

const SOULS_PURPOSE_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `Your soul's purpose is rooted in self-assertion, courage, and autonomy. In this lifetime, you are learning how to act from your own will rather than orienting yourself around others.

This path often feels uncomfortable because you may be deeply familiar with compromise, cooperation, or prioritizing relationships. Choosing yourself can feel selfish — even when it's necessary. Your growth asks you to trust your instincts and act decisively.

You are meant to develop confidence through action. Leadership, independence, and initiative are not traits you're meant to suppress — they are skills your soul is practicing. Hesitation keeps you stuck in old cycles.

Challenges arise when you wait for permission, consensus, or reassurance before acting. Life may repeatedly place you in situations where no one else can decide for you.

Your purpose unfolds when you choose yourself without apology. As you learn to lead your own life, relationships become healthier — not weaker. Courage is the doorway to alignment.`,
    reflection: 'Where are you waiting for permission to choose yourself? What would decisive action look like right now?',
    affirmation: 'I am learning to trust my own direction. Choosing myself is not selfish — it is necessary.',
  },
  Taurus: {
    content: `Your soul's purpose centers on grounding, simplicity, and self-worth. You are learning how to build security from within rather than living in constant emotional or external upheaval.

This path can feel slow or unfamiliar if you're used to intensity, crisis, or emotional extremes. Peace may initially feel boring — but it's deeply healing for you.

You are meant to cultivate patience, consistency, and trust in the physical world. Building something tangible — financial security, stable relationships, or embodied practices — supports your purpose.

Challenges arise when you cling to chaos because it feels familiar. Life may repeatedly remove dramatic situations, asking you to choose calm instead.

Your purpose unfolds when you trust that stability is not stagnation — it's freedom. When you root yourself in self-worth, growth becomes sustainable.`,
    reflection: 'Where do you mistake chaos for aliveness? What would it feel like to choose peace on purpose?',
    affirmation: 'Stability is not stagnation. I am learning that peace is my power.',
  },
  Gemini: {
    content: `Your soul's purpose involves curiosity, communication, and openness to learning. You are here to ask questions, exchange ideas, and remain mentally flexible.

This path may feel challenging if you're attached to certainty or fixed belief systems. You are learning that truth evolves — and that curiosity is wiser than knowing everything.

You are meant to communicate, write, teach, and listen. Small insights, daily conversations, and shared understanding move you forward more than grand declarations.

Challenges arise when you cling to rigid opinions or resist new information. Life may place you in situations that require adaptability and dialogue.

Your purpose unfolds when you stay curious instead of certain. Growth comes through conversation, learning, and letting your understanding change.`,
    reflection: 'What belief are you holding onto that no longer serves you? What would genuine curiosity open up?',
    affirmation: 'I don\'t need to know everything. Curiosity is its own kind of wisdom.',
  },
  Cancer: {
    content: `Your soul's purpose is rooted in emotional presence, vulnerability, and true belonging. In this lifetime, you are learning how to nurture yourself and others without armor.

This path can feel uncomfortable if you're used to relying on control, achievement, or emotional self-sufficiency. Letting yourself need can feel risky. You may have learned early to stay composed or strong instead of soft.

You are meant to cultivate emotional safety — within yourself and in your relationships. Creating home, family, or emotionally attuned spaces is part of your soul's work. Sensitivity is not something to overcome; it's something to honor.

Challenges arise when you default to emotional distance or productivity to avoid vulnerability. Life may repeatedly place you in situations that require emotional openness rather than competence.

Your purpose unfolds when you allow yourself to feel fully and to be cared for. When you choose connection over protection, you step into your deepest alignment.`,
    reflection: 'Where are you using competence to avoid vulnerability? What would it feel like to let someone care for you?',
    affirmation: 'Vulnerability is not weakness. My sensitivity is part of my soul\'s purpose.',
  },
  Leo: {
    content: `Your soul's purpose centers on self-expression, joy, and being seen for who you truly are. You are here to step out of the background and into the fullness of your individuality.

This path may feel intimidating if you're accustomed to blending in, supporting others, or staying emotionally neutral. Visibility can feel exposing — but hiding limits your growth.

You are meant to create, lead, and express yourself with heart. Confidence, play, and creative courage are not indulgences; they are necessities for your soul's evolution.

Challenges arise when you dim yourself to avoid judgment or rejection. Life may repeatedly ask you to claim your voice and take up space.

Your purpose unfolds when you allow yourself to be seen without performing. When you honor your joy and creative fire, you inspire others simply by being yourself.`,
    reflection: 'Where are you hiding to avoid judgment? What would happen if you let yourself be fully seen?',
    affirmation: 'I am meant to be visible. My self-expression is my soul\'s gift to the world.',
  },
  Virgo: {
    content: `Your soul's purpose involves discernment, service, and grounded contribution. You are learning how to bring order, care, and clarity into the world in practical ways.

This path can feel challenging if you're used to chaos, escapism, or emotional overwhelm. Grounding into the present moment may feel unfamiliar at first.

You are meant to refine, heal, and support through tangible effort. Attention to detail, thoughtful service, and practical wisdom are key to your growth.

Challenges arise when you retreat into fantasy or avoid responsibility. Life may consistently pull you back into the details, asking you to show up fully.

Your purpose unfolds when you trust that small, consistent acts matter. By serving with presence rather than perfection, you create meaningful change.`,
    reflection: 'What practical contribution are you avoiding? What would it look like to serve without needing to be perfect?',
    affirmation: 'Small acts matter. My presence and care create meaningful change.',
  },
  Libra: {
    content: `Your soul's purpose centers on cooperation, balance, and conscious relationship. In this lifetime, you are learning how to build partnerships that are fair, mutual, and emotionally present.

This path can feel challenging if you're used to independence, self-reliance, or handling everything alone. Letting others in — truly in — may feel vulnerable or inefficient. You may instinctively default to doing things yourself rather than navigating the complexity of shared space.

You are meant to learn through collaboration. Listening, compromising, and co-creating help you evolve. Relationships are not distractions from your purpose; they are part of it. Learning to consider others without abandoning yourself is a central lesson.

Challenges arise when you swing between self-sufficiency and people-pleasing. Life may repeatedly place you in situations that require negotiation, patience, and mutual respect rather than unilateral action.

Your purpose unfolds when you learn that balance doesn't mean losing yourself. True partnership strengthens your path instead of diluting it. When you choose connection with integrity, your soul feels aligned.`,
    reflection: 'Where do you resist partnership to protect your independence? What would true collaboration feel like?',
    affirmation: 'I can be whole and still choose to share my life. Partnership deepens my purpose.',
  },
  Scorpio: {
    content: `Your soul's purpose is rooted in depth, emotional truth, and profound transformation. In this lifetime, you are learning to face what is hidden — within yourself and within life — and to trust the process of change.

This path can feel intense because it asks you to release control and move through emotional vulnerability. You may be familiar with surface stability or emotional distance, but your growth demands honesty and depth.

You are meant to engage with healing, psychology, intimacy, and rebirth. Crisis and endings are not punishments for you — they are portals. Each transformation strips away what is false and reveals what is essential.

Challenges arise when you cling to comfort or resist necessary endings. Life may repeatedly pull you toward situations that require emotional courage and surrender.

Your purpose unfolds when you trust that nothing real is lost through transformation. When you allow yourself to go deep without fear, your power becomes regenerative rather than defensive.`,
    reflection: 'What are you resisting letting go of? What transformation is waiting on the other side of surrender?',
    affirmation: 'Nothing real is lost through change. Transformation reveals what is essential.',
  },
  Sagittarius: {
    content: `Your soul's purpose centers on truth, exploration, and higher understanding. In this lifetime, you are learning to expand beyond familiar perspectives and live according to deeply held beliefs.

This path can feel disorienting if you're used to details, routines, or small-scale thinking. You are meant to look outward and upward — toward meaning, philosophy, and purpose.

You are called to explore, teach, learn, and question. Travel, education, spirituality, and storytelling often play a role in your evolution. Your soul grows when life feels expansive and aligned with truth.

Challenges arise when you become overly focused on immediate concerns or lose sight of the bigger picture. Life may repeatedly push you to zoom out and reconnect with meaning.

Your purpose unfolds when you live according to what you believe, not just what's convenient. When your life reflects your truth, alignment follows naturally.`,
    reflection: 'What truth are you living that no longer fits? What bigger meaning is calling you forward?',
    affirmation: 'I am meant to seek truth. My life expands when I follow what I believe.',
  },
  Capricorn: {
    content: `Your soul's purpose centers on maturity, integrity, and self-leadership. In this lifetime, you are learning how to stand in your authority — not through control, but through earned self-trust.

This path can feel heavy because responsibility is a core teacher for you. You may be deeply familiar with emotional dependence, caretaking, or being pulled into others' needs. Your growth asks you to develop boundaries, discipline, and a clear sense of direction.

You are meant to build something meaningful over time. Structure, commitment, and long-term goals support your alignment. Leadership is part of your soul's work — not dominance, but steadiness. You learn who you are by showing up consistently.

Challenges arise when guilt, fear of failure, or emotional obligation keeps you small. Life may repeatedly place you in situations that require you to choose responsibility over comfort.

Your purpose unfolds when you trust yourself to lead your life with integrity. When you claim your authority without hardening your heart, alignment becomes deeply empowering.`,
    reflection: 'Where are you avoiding responsibility because it feels heavy? What would self-leadership look like if it came with compassion?',
    affirmation: 'I can lead with both strength and heart. My authority is earned through integrity.',
  },
  Aquarius: {
    content: `Your soul's purpose is rooted in authenticity, innovation, and contribution to the collective. In this lifetime, you are learning how to belong — not by fitting in, but by being real.

This path can feel isolating at times. You may be familiar with seeking approval, emotional intensity, or personal validation. Your growth calls you toward objectivity, vision, and shared purpose beyond the self.

You are meant to contribute something unique to the world. Community, social change, and future-oriented thinking support your alignment. You thrive when your individuality serves something larger.

Challenges arise when you cling to personal drama or fear standing apart. Life may push you toward detachment from emotional entanglements that limit your broader vision.

Your purpose unfolds when you trust that your uniqueness is needed. When you align with the collective without abandoning yourself, belonging becomes expansive rather than restrictive.`,
    reflection: 'What would it look like to contribute your uniqueness without needing approval? Where can your individuality serve something larger?',
    affirmation: 'I belong by being real. My uniqueness serves the whole.',
  },
  Pisces: {
    content: `Your soul's purpose centers on compassion, surrender, and spiritual alignment. In this lifetime, you are learning how to trust life rather than control it.

This path can feel frightening if you're accustomed to precision, certainty, or constant problem-solving. Letting go may feel like losing yourself — but it's actually how you find your deeper truth.

You are meant to cultivate empathy, creativity, and faith. Healing, spirituality, art, and service often play a role in your evolution. Your soul grows when you soften into life rather than resist it.

Challenges arise when fear drives over-analysis or rigid self-control. Life may repeatedly dissolve plans to teach you trust.

Your purpose unfolds when you allow yourself to flow with intuition while staying gently grounded. When you release the need to have everything figured out, alignment reveals itself naturally.`,
    reflection: 'What are you trying to control that life is asking you to release? What would trust feel like in your body?',
    affirmation: 'I can trust life without losing myself. Surrender is how I find my truth.',
  },
};

const SHADOW_WORK_CONTENT: Record<string, { content: string; reflection: string; affirmation: string }> = {
  Aries: {
    content: `Your shadow work centers on control, anger, and survival through action. At a deep level, you may carry an unconscious fear of being powerless — of being unable to act, choose, or defend yourself.

This pattern forms through experiences where strength or assertiveness felt necessary for survival. You may have learned early that hesitation led to harm, or that waiting for others meant being overlooked or overridden. Action became protection.

In shadow, this can show up as reactivity, impatience, or difficulty sitting with vulnerability. Anger may surface quickly when you feel blocked, ignored, or restrained. Beneath it is often fear — fear of losing agency or being unable to protect yourself.

You may struggle with letting others lead, slowing down, or trusting that things will unfold without force. Power becomes something you feel you must hold tightly.

Your shadow work asks you to redefine strength. True power doesn't disappear when you soften — it stabilizes. When you allow vulnerability without equating it to weakness, anger transforms into grounded self-trust.`,
    reflection: 'When anger arises, what fear lives beneath it? What would strength look like if it didn\'t require force?',
    affirmation: 'I can be powerful and soft at the same time. Vulnerability is not the opposite of strength.',
  },
  Taurus: {
    content: `Your shadow work centers on attachment, control through stability, and fear of loss. At a deep level, you may equate safety with possession — of people, resources, or routines.

This pattern forms through experiences where loss felt destabilizing or traumatic. You may have learned that holding on tightly was the only way to remain safe. Change became synonymous with danger.

In shadow, this can show up as resistance to change, emotional stagnation, or clinging to what feels familiar even when it no longer serves you. Letting go may feel like risking collapse.

You may struggle with surrender, especially in emotional or material realms. Security can become rigid rather than supportive.

Your shadow work asks you to trust impermanence. Release does not equal destruction — it creates space. When you learn to loosen your grip without fear, stability becomes internal rather than conditional.`,
    reflection: 'What are you holding onto because letting go feels like losing yourself? What would trust look like without control?',
    affirmation: 'I can release without collapsing. My safety lives inside me, not in what I hold.',
  },
  Gemini: {
    content: `Your shadow work centers on mental control, information, and fear of the unknown. At a deep level, silence may feel unsafe — as if not knowing or not speaking leaves you exposed.

This pattern forms through environments where understanding equaled safety. You may have learned that staying mentally alert, informed, and communicative helped you survive unpredictability.

In shadow, this can show up as overthinking, compulsive communication, or avoidance of emotional depth. You may intellectualize pain rather than feel it, keeping things moving to avoid stillness.

You may fear being misunderstood or not having the "right" words. Silence can feel like loss of control.

Your shadow work asks you to sit with what cannot be explained. Not everything needs language to be real. When you allow silence without panic, wisdom emerges beneath thought.`,
    reflection: 'What are you afraid of finding in silence? What truth lives beneath your need to understand everything?',
    affirmation: 'I don\'t need to explain everything to be safe. Silence holds its own wisdom.',
  },
  Cancer: {
    content: `Your shadow work centers on attachment, emotional safety, and fear of loss through vulnerability. At a deep level, you may carry an unconscious belief that emotional closeness is fragile — that it can be taken away without warning.

This pattern often forms through early experiences where emotional security felt inconsistent or conditional. You may have learned to protect yourself by becoming self-sufficient, emotionally guarded, or overly attuned to others' moods. Love became something to monitor rather than trust.

In shadow, this can show up as emotional defensiveness, withdrawal, or clinging behaviors. You may oscillate between craving deep connection and protecting yourself from it. Fear of abandonment can quietly influence your reactions, even when no real threat exists.

You may struggle to express needs directly, hoping others will sense them instead. When emotional safety feels threatened, you retreat inward, building protective walls around your heart.

Your shadow work asks you to learn that vulnerability does not guarantee loss. Emotional openness doesn't invite abandonment — it invites authenticity. When you allow yourself to need without fear, attachment becomes nourishment rather than anxiety.`,
    reflection: 'When do you withdraw to protect yourself from loss? What would it feel like to trust that love can hold steady?',
    affirmation: 'Vulnerability does not invite abandonment. I can need others and still be safe.',
  },
  Leo: {
    content: `Your shadow work centers on visibility, self-worth, and fear of insignificance. At a deep level, you may fear that without recognition, love, or admiration, you will disappear.

This pattern forms through experiences where attention felt conditional — earned through performance, success, or emotional expression. You may have learned that being noticed equaled being valued, and that invisibility equaled loss.

In shadow, this can show up as over-identifying with achievement, seeking validation, or feeling deeply wounded by perceived neglect. You may struggle with shame when you're not seen, or react strongly to being overlooked.

You may alternate between craving attention and rejecting it, unsure whether visibility is safe. Pride becomes armor, protecting a tender sense of self-worth.

Your shadow work asks you to separate being seen from being worthy. Your existence is meaningful even in quiet moments. When you root your worth internally, expression becomes joyful rather than desperate.`,
    reflection: 'What happens inside you when you feel unseen? Where did you learn that visibility equals worth?',
    affirmation: 'My worth does not depend on being noticed. I matter even in quiet moments.',
  },
  Virgo: {
    content: `Your shadow work centers on control through correction, self-criticism, and fear of being flawed. At a deep level, you may believe that mistakes threaten safety or belonging.

This pattern often forms through environments where criticism outweighed reassurance, or where being "good" meant being precise, helpful, or correct. You learned to manage anxiety by fixing, organizing, or improving yourself and others.

In shadow, this can show up as harsh inner dialogue, obsessive self-monitoring, or difficulty resting. You may feel responsible for preventing problems before they arise, carrying pressure that never fully lifts.

You may struggle to accept help, softness, or uncertainty. Imperfection feels dangerous rather than human.

Your shadow work asks you to release the belief that worth is earned through flawlessness. You are allowed to exist without constant self-improvement. When you allow imperfection without judgment, healing replaces control.`,
    reflection: 'What would you do differently if mistakes weren\'t dangerous? What does your inner critic protect you from?',
    affirmation: 'I am allowed to be imperfect. My worth is not earned through flawlessness.',
  },
  Libra: {
    content: `Your shadow work centers on balance, approval, and fear of conflict. At a deep level, you may believe that disharmony threatens connection — that disagreement leads to rejection or loss.

This pattern often forms through environments where peace was prioritized over honesty, or where emotional tension felt unsafe. You may have learned to monitor others' reactions closely, adjusting yourself to maintain harmony. Conflict became something to avoid rather than navigate.

In shadow, this can show up as people-pleasing, indecision, or suppressing your own needs to keep relationships intact. You may struggle to name anger or dissatisfaction, fearing it will disrupt connection. Over time, unspoken resentment can quietly build.

You may also feel anxious when forced to choose sides or assert a clear position. Pleasing others can feel safer than choosing yourself, even when it costs you authenticity.

Your shadow work asks you to learn that harmony built on silence is not peace — it's avoidance. True balance includes honesty. When you allow yourself to speak truth even when it creates tension, connection becomes real rather than fragile.`,
    reflection: 'What truth are you withholding to keep the peace? What relationship would deepen if you were fully honest?',
    affirmation: 'True peace includes my truth. I can be honest and still be loved.',
  },
  Scorpio: {
    content: `Your shadow work centers on power, trust, and fear of vulnerability. At a deep level, you may believe that letting go — emotionally or psychologically — leaves you exposed to harm.

This pattern forms through experiences of betrayal, loss, or emotional intensity that felt overwhelming. You may have learned that control was necessary for survival. Trust became something earned slowly, if at all.

In shadow, this can show up as emotional guardedness, testing loyalty, or engaging in power struggles. You may fear being overtaken by emotion or losing yourself in connection. Intimacy feels both magnetic and dangerous.

You may struggle with letting others see your true feelings, keeping emotional leverage as protection. Vulnerability can feel like giving away power.

Your shadow work asks you to redefine strength. True power doesn't come from control — it comes from resilience. When you allow yourself to surrender without self-abandonment, intimacy becomes transformative rather than threatening.`,
    reflection: 'Who have you been testing, and what would happen if you trusted them instead? What does surrender feel like without fear?',
    affirmation: 'I can surrender without losing myself. True power comes from resilience, not control.',
  },
  Sagittarius: {
    content: `Your shadow work centers on freedom, belief, and fear of limitation. At a deep level, you may believe that being confined — emotionally, mentally, or physically — threatens your survival.

This pattern forms through experiences where restriction felt suffocating or truth was limited. You may have learned to escape discomfort by seeking meaning elsewhere, keeping your spirit moving forward at all costs.

In shadow, this can show up as avoidance of emotional depth, resistance to commitment, or using philosophy to bypass pain. You may distance yourself from situations that feel heavy or limiting, even when growth is possible there.

You may struggle to stay present when emotions feel intense, preferring to reframe, rationalize, or move on quickly. Freedom becomes armor rather than expansion.

Your shadow work asks you to learn that presence does not equal imprisonment. Staying with discomfort does not erase freedom — it deepens it. When you allow yourself to remain instead of escape, wisdom becomes embodied rather than abstract.`,
    reflection: 'What are you running from by seeking the next horizon? What would staying with discomfort reveal?',
    affirmation: 'Presence is not imprisonment. I can stay and still be free.',
  },
  Capricorn: {
    content: `Your shadow work centers on authority, responsibility, and fear of inadequacy. At a deep level, you may believe that failure threatens safety, respect, or survival.

This pattern often forms through early pressure to perform, succeed, or grow up quickly. You may have learned that being capable was the only way to earn security or approval. Vulnerability felt risky when strength was expected.

In shadow, this can show up as overworking, emotional suppression, or equating worth with achievement. You may struggle to rest, ask for help, or admit uncertainty. Failure can feel catastrophic rather than instructional.

You may also carry guilt around slowing down, believing that ease must be earned. Authority becomes something you feel you must prove, not embody.

Your shadow work asks you to redefine success. Worth is not measured by endurance alone. When you allow yourself to be human — imperfect, learning, and supported — strength becomes sustainable rather than exhausting.`,
    reflection: 'What would you allow yourself to feel if achievement didn\'t define your worth? When did rest start feeling like failure?',
    affirmation: 'I don\'t have to earn my rest. My worth exists beyond what I produce.',
  },
  Aquarius: {
    content: `Your shadow work centers on individuality, detachment, and fear of emotional entanglement. At a deep level, you may believe that belonging requires self-erasure — that closeness threatens autonomy.

This pattern often forms through feeling different, misunderstood, or emotionally overwhelmed in early environments. You may have learned that detachment was safer than intimacy, and that logic protected you from emotional chaos.

In shadow, this can show up as emotional distance, intellectualizing pain, or resisting vulnerability. You may value independence so strongly that connection feels threatening. Being needed can feel like being trapped.

You may struggle to let others see your emotional interior, maintaining distance even when closeness is desired. Isolation can feel safer than dependence.

Your shadow work asks you to learn that connection does not erase individuality. You don't lose yourself by being close — you expand. When you allow interdependence without fear, belonging becomes liberating rather than restrictive.`,
    reflection: 'What would closeness look like if it didn\'t threaten your freedom? What are you protecting by staying distant?',
    affirmation: 'Connection does not erase me. I can belong and still be fully myself.',
  },
  Pisces: {
    content: `Your shadow work centers on escapism, emotional overwhelm, and fear of grounded presence. At a deep level, you may believe that reality is too harsh to face directly.

This pattern often forms through heightened sensitivity. You may have absorbed emotional pain, chaos, or suffering that felt unbearable. Escaping — into fantasy, compassion, or dissociation — became a form of survival.

In shadow, this can show up as avoidance, self-sacrifice, or blurring boundaries. You may disappear into others' needs or into imagined worlds when life feels too sharp. Grounding can feel frightening rather than stabilizing.

You may struggle to hold structure, boundaries, or accountability, fearing they'll cut you off from compassion. Pain may feel endless when uncontained.

Your shadow work asks you to learn that grounding does not destroy sensitivity — it protects it. Reality does not have to be endured alone. When you stay present without absorbing everything, compassion becomes healing rather than draining.`,
    reflection: 'What reality are you avoiding? What would it feel like to be present without absorbing everyone else\'s pain?',
    affirmation: 'Grounding does not destroy my sensitivity. I can be present and still be gentle.',
  },
};

// ── Element Overlays (How this pattern expresses through your element) ──
// Only for Ch4 (Love/Venus), Ch5 (Fight/Mars), Ch6 (Protection/Moon)

const ELEMENT_OVERLAY: Record<string, Record<string, string>> = {
  'how-you-love': {
    fire: `Your element adds passion, immediacy, and visibility to how you love. You experience love as something alive — it needs energy, movement, and emotional engagement to feel real. Attraction grows when love feels exciting and expressive.\n\nFire emphasizes initiative in love. You may fall quickly, love boldly, and feel most connected when affection is openly shared. Emotional stagnation or lack of enthusiasm can feel like rejection. You need love to be active, not passive.\n\nGrowth comes from learning that consistency doesn't extinguish passion — it sustains it. The flame burns longer when it's tended gently.`,
    earth: `Your element adds stability, reliability, and presence to how you love. You experience love as something built — through trust, effort, and consistency over time. Attraction deepens when love feels secure and grounded.\n\nEarth emphasizes devotion and commitment. You show love through actions more than words and value relationships that feel dependable and real. Emotional volatility or instability can feel threatening to connection.\n\nGrowth comes from allowing emotional expression alongside stability, rather than replacing feeling with function. Love needs both roots and warmth.`,
    air: `Your element adds communication, curiosity, and intellectual connection to how you love. You experience love as something that flows through conversation, shared ideas, and mutual understanding. Attraction grows when love feels mentally stimulating.\n\nAir emphasizes dialogue in love. You connect through words, humor, and shared perspective. You need to feel understood before you can feel safe. Emotional heaviness without communication can feel suffocating.\n\nGrowth comes from staying emotionally present rather than intellectualizing connection. Sometimes love asks you to feel before you understand.`,
    water: `Your element adds emotional depth, bonding, and intuition to how you love. You experience love as something felt deeply and often privately — a current that runs beneath the surface. Attraction grows when love feels emotionally honest and intimate.\n\nWater emphasizes merging in love. You connect through feeling, presence, and unspoken understanding. You need emotional safety before you can fully open. Surface-level connection can feel hollow or unsatisfying.\n\nGrowth comes from maintaining boundaries while staying open-hearted. Love doesn't require losing yourself to be real.`,
  },
  'how-you-fight': {
    fire: `Your element adds urgency, heat, and directness to how you handle conflict. Anger moves fast through your system — rising quickly and demanding expression. You tend to confront rather than avoid.\n\nFire makes conflict feel physical and immediate. You may experience anger as energy in your body that needs release. Suppressing it can feel unbearable. You fight to be heard, to assert, to clear the air.\n\nGrowth comes from learning to channel intensity without burning bridges. Your fire can illuminate truth — or it can scorch. The difference is awareness.`,
    earth: `Your element adds weight, endurance, and quiet stubbornness to how you handle conflict. Anger builds slowly but settles deep. You tend to hold your ground rather than escalate — until you reach a breaking point.\n\nEarth makes conflict feel like a boundary issue. You fight when your values, security, or stability are threatened. You may avoid confrontation until the cost of silence outweighs the discomfort of speaking up.\n\nGrowth comes from addressing tension before it calcifies. Your patience is a strength, but silence isn't always peace.`,
    air: `Your element adds logic, detachment, and verbal precision to how you handle conflict. Anger moves through your mind first — analyzing, strategizing, constructing arguments. You tend to debate rather than explode.\n\nAir makes conflict feel intellectual. You fight with words, reasoning, and perspective. Emotional intensity without logic can feel chaotic or unfair. You may withdraw into analysis to avoid the rawness of feeling.\n\nGrowth comes from letting yourself feel the anger beneath the argument. Not every conflict needs to be won — some need to be felt.`,
    water: `Your element adds emotional depth, sensitivity, and intensity to how you handle conflict. Anger often arrives mixed with hurt, fear, or sadness. You tend to absorb before you react.\n\nWater makes conflict feel deeply personal. You may struggle to separate the issue from the relationship, experiencing disagreement as emotional threat. Withdrawal, tears, or silence may precede any confrontation.\n\nGrowth comes from expressing anger directly rather than drowning in it. Your emotional intelligence is a strength in conflict — when you trust yourself to use it.`,
  },
  'protection-style': {
    fire: `Your element adds speed, reactivity, and outward expression to your self-protection. When emotions overwhelm you, your nervous system pushes toward action — movement, confrontation, or dramatic shifts in energy.\n\nFire protection looks active. You may get loud, push back, or create conflict as a way of regulating emotional intensity. Stillness feels dangerous; action feels like control.\n\nGrowth comes from learning that you can hold fire without throwing it. Pausing doesn't extinguish your power — it refines it.`,
    earth: `Your element adds containment, withdrawal, and sensory grounding to your self-protection. When emotions overwhelm you, your nervous system seeks physical comfort — routine, familiar spaces, or solitude.\n\nEarth protection looks still. You may shut down, go quiet, or retreat into practical tasks to avoid emotional exposure. Comfort eating, sleeping, or burrowing into safety are common responses.\n\nGrowth comes from allowing emotional movement while staying grounded. You don't have to freeze to feel safe — you can hold both stability and feeling.`,
    air: `Your element adds mental distancing, rationalization, and social deflection to your self-protection. When emotions overwhelm you, your nervous system moves into the mind — analyzing, explaining, or talking around the feeling.\n\nAir protection looks composed. You may intellectualize pain, change the subject, or use humor to deflect vulnerability. Silence or emotional directness can feel threatening.\n\nGrowth comes from allowing feelings to exist without explanation. You don't need to understand your emotions to honor them.`,
    water: `Your element adds emotional absorption, retreat, and boundary dissolution to your self-protection. When emotions overwhelm you, your nervous system may blur the line between your feelings and others' — taking on pain that isn't yours.\n\nWater protection looks invisible. You may merge with others' emotions, dissociate, or retreat into inner worlds. Emotional overwhelm can feel tidal — like you're being carried by forces you can't control.\n\nGrowth comes from learning where you end and others begin. Your sensitivity is a gift, not a liability — but it needs containment to stay healthy.`,
  },
};

// ── House Overlays (Where this pattern plays out in your life) ──
// For Ch4, Ch5, Ch6 (elements + houses), Ch8, Ch9 (houses only)

const HOUSE_OVERLAY: Record<string, Record<number, string>> = {
  'how-you-love': {
    1: `With Venus in your 1st house, love is tied to identity. You express affection naturally and visibly — warmth radiates from your presence. Relationships shape how you see yourself, and being loved helps you feel real. Growth comes from knowing you are lovable even when you're alone.`,
    2: `With Venus in your 2nd house, love is tied to security and self-worth. You value relationships that feel stable and reciprocal. You may show love through giving, providing, or creating comfort. Growth comes from separating your sense of worth from what you offer others.`,
    3: `With Venus in your 3rd house, love is tied to communication. You connect through words, conversation, and daily interaction. Small gestures of attention mean more to you than grand declarations. Growth comes from deepening conversation beyond the surface.`,
    4: `With Venus in your 4th house, love is tied to home and emotional roots. You crave deep emotional safety in relationships — the feeling of being truly known. Family patterns may influence how you love. Growth comes from creating the emotional home you needed, rather than seeking it from others.`,
    5: `With Venus in your 5th house, love is tied to joy, play, and creative expression. Romance feels essential — you thrive when love feels exciting and alive. You may idealize the early stages of connection. Growth comes from sustaining passion through intimacy, not just novelty.`,
    6: `With Venus in your 6th house, love is tied to service and daily care. You show love through acts of devotion — helping, supporting, and showing up consistently. Relationships feel most real in the everyday. Growth comes from allowing yourself to receive as much as you give.`,
    7: `With Venus in your 7th house, love is tied to partnership itself. Relationships are central to your life purpose — you learn who you are through others. You may struggle with independence when single. Growth comes from being whole before merging.`,
    8: `With Venus in your 8th house, love is tied to depth, intimacy, and transformation. Surface-level connection doesn't satisfy you — you crave emotional honesty and psychological closeness. Growth comes from trusting vulnerability without needing to control the outcome.`,
    9: `With Venus in your 9th house, love is tied to growth, adventure, and shared meaning. You need relationships that expand your world — partners who inspire curiosity and philosophical connection. Growth comes from finding depth within exploration rather than always seeking the next horizon.`,
    10: `With Venus in your 10th house, love is tied to ambition and public life. Relationships may intersect with career, reputation, or long-term goals. You may attract partners who admire your drive. Growth comes from showing your soft side, not just your capable one.`,
    11: `With Venus in your 11th house, love is tied to friendship and community. You may fall for friends, value intellectual compatibility, or need shared ideals. Freedom within relationship matters deeply. Growth comes from allowing intimacy alongside independence.`,
    12: `With Venus in your 12th house, love is tied to the unconscious and spiritual realms. You may love deeply but privately, fearing exposure. Secret longings or idealized love can shape your relationships. Growth comes from bringing hidden feelings into the light.`,
  },
  'how-you-fight': {
    1: `With Mars in your 1st house, conflict is tied to identity. You take things personally because challenges feel like attacks on who you are. Your anger is visible and direct — others always know where they stand. Growth comes from separating disagreement from identity threat.`,
    2: `With Mars in your 2nd house, conflict is triggered by threats to your security or values. You fight hardest when your resources, stability, or self-worth are challenged. You may become defensive about money, possessions, or personal boundaries. Growth comes from knowing your worth isn't negotiable.`,
    3: `With Mars in your 3rd house, conflict plays out through words. You fight with language — sharp observations, pointed questions, or cutting silence. Sibling dynamics or communication patterns may fuel recurring tension. Growth comes from speaking with intention rather than weaponizing insight.`,
    4: `With Mars in your 4th house, conflict is rooted in family and emotional safety. Home may have been a battleground, and you may carry unresolved anger from childhood. Emotional disputes can feel existentially threatening. Growth comes from creating internal safety that doesn't depend on external peace.`,
    5: `With Mars in your 5th house, conflict is tied to self-expression and pride. You fight when your creativity, joy, or identity feels suppressed. You may be competitive or dramatic in disagreements. Growth comes from expressing passion without needing to win.`,
    6: `With Mars in your 6th house, conflict shows up in daily routines, work, and health. You may experience tension with coworkers, frustration with systems, or channel anger into physical symptoms. Growth comes from addressing tension directly rather than absorbing it.`,
    7: `With Mars in your 7th house, conflict most often arises in close relationships and partnerships. You may attract confrontational partners or project your anger onto others. Disagreements with partners become mirrors for your own needs. Growth comes from owning your anger rather than externalizing it.`,
    8: `With Mars in your 8th house, conflict is tied to power, intimacy, and control. You fight about trust, shared resources, and emotional territory. Power struggles can feel magnetic — destructive and transformative at once. Growth comes from releasing the need to control what you cannot hold.`,
    9: `With Mars in your 9th house, conflict is tied to beliefs, truth, and moral conviction. You fight for what you believe is right — sometimes to the point of rigidity. Ideological disputes can feel deeply personal. Growth comes from defending truth without dismissing other perspectives.`,
    10: `With Mars in your 10th house, conflict is tied to authority, career, and public standing. You may clash with bosses, systems, or expectations. Power struggles around achievement are common. Growth comes from asserting yourself with integrity rather than control.`,
    11: `With Mars in your 11th house, conflict arises in groups, communities, and friendships. You may fight for collective causes or struggle with group dynamics. Disagreements around shared values or fairness can be intense. Growth comes from advocating without alienating.`,
    12: `With Mars in your 12th house, conflict lives beneath the surface. You may suppress anger, avoid confrontation, or turn frustration inward. Hidden resentments can build silently. Growth comes from learning that expressing anger directly is healthier than letting it fester in the unconscious.`,
  },
  'protection-style': {
    1: `With your Moon in the 1st house, emotional protection is tied to identity. You wear your feelings visibly — and defend yourself by controlling how you're perceived. Vulnerability feels like exposure. Growth comes from letting others see you before you've composed yourself.`,
    2: `With your Moon in the 2nd house, emotional protection is tied to material security. You self-soothe through comfort, stability, and control over your environment. Losing resources or routine can feel emotionally destabilizing. Growth comes from trusting your inner worth beyond what you have.`,
    3: `With your Moon in the 3rd house, emotional protection happens through the mind. You talk through feelings, rationalize, or seek information to feel safe. Silence can feel threatening. Growth comes from allowing emotions to exist without narration.`,
    4: `With your Moon in the 4th house, emotional protection is tied to home and family. You retreat to familiar spaces when overwhelmed — physically or emotionally. Family wounds may drive protective patterns. Growth comes from building safety within yourself, not just within your walls.`,
    5: `With your Moon in the 5th house, emotional protection happens through expression. You may use creativity, drama, or humor to deflect vulnerability. Performance can become a shield. Growth comes from sharing your real feelings, not just the ones that look good.`,
    6: `With your Moon in the 6th house, emotional protection happens through routine and usefulness. You cope by staying busy, organized, or helpful. Feeling needed is how you feel safe. Growth comes from resting without guilt — your worth isn't tied to productivity.`,
    7: `With your Moon in the 7th house, emotional protection is tied to relationships. You may seek safety through partnership or avoid emotional pain by focusing on others' needs. Growth comes from learning to hold yourself before reaching for someone else.`,
    8: `With your Moon in the 8th house, emotional protection is tied to control and secrecy. You guard your inner world carefully, revealing vulnerability only when you feel absolute safety. Growth comes from allowing trust to exist before all conditions are met.`,
    9: `With your Moon in the 9th house, emotional protection happens through meaning-making. You cope by reframing pain as growth, seeking philosophy or spiritual perspective. Growth comes from allowing yourself to grieve before you find the lesson.`,
    10: `With your Moon in the 10th house, emotional protection is tied to competence and public composure. You cope by staying capable, achieving, and maintaining control. Vulnerability in public feels unbearable. Growth comes from letting others see your humanity, not just your strength.`,
    11: `With your Moon in the 11th house, emotional protection happens through social distance. You may feel safest in groups rather than one-on-one intimacy. Emotional detachment masquerades as independence. Growth comes from allowing one person to see you fully.`,
    12: `With your Moon in the 12th house, emotional protection is deeply internalized. You may retreat into solitude, fantasy, or spiritual practice when overwhelmed. Your feelings may feel shapeless or overwhelming. Growth comes from grounding emotion in the body rather than dissolving into it.`,
  },
  'growth-arc': {
    1: `With Jupiter in your 1st house, growth happens through self-discovery and personal presence. You expand by showing up authentically. Life rewards you when you take initiative and trust your instincts. Your personality itself is a gateway to opportunity.`,
    2: `With Jupiter in your 2nd house, growth happens through building resources and self-worth. You expand through financial literacy, material stability, and honoring your values. Abundance arrives when you trust your own value.`,
    3: `With Jupiter in your 3rd house, growth happens through learning, communication, and community connection. You expand through writing, teaching, conversation, and intellectual curiosity. Sharing ideas opens doors.`,
    4: `With Jupiter in your 4th house, growth happens through emotional roots, family, and inner security. You expand when you create a stable foundation — literal or emotional. Home is where your growth begins.`,
    5: `With Jupiter in your 5th house, growth happens through creativity, joy, and self-expression. You expand when you follow what excites you. Play, romance, and creative projects are pathways to abundance.`,
    6: `With Jupiter in your 6th house, growth happens through service, health, and daily practice. You expand by refining your routines and contributing meaningfully through work. Consistent effort creates quiet abundance.`,
    7: `With Jupiter in your 7th house, growth happens through relationships and partnership. You expand through collaboration, commitment, and learning from others. Your greatest teachers are the people closest to you.`,
    8: `With Jupiter in your 8th house, growth happens through transformation, intimacy, and shared resources. You expand by going deep — emotionally, psychologically, and financially. Crisis becomes catalyst.`,
    9: `With Jupiter in your 9th house, growth happens through exploration, education, and expanded worldview. You expand through travel, philosophy, and higher learning. Following truth creates your path.`,
    10: `With Jupiter in your 10th house, growth happens through career, public contribution, and earned authority. You expand through professional commitment and visible leadership. Your reputation grows with integrity.`,
    11: `With Jupiter in your 11th house, growth happens through community, innovation, and collective vision. You expand by connecting with groups that share your values. Your network is your growth engine.`,
    12: `With Jupiter in your 12th house, growth happens through solitude, spirituality, and inner work. You expand by letting go, trusting intuition, and honoring the unseen. Quiet growth often runs deepest.`,
  },
  'souls-purpose': {
    1: `With your North Node in the 1st house, your soul's purpose plays out through self-development and personal identity. You are learning to define yourself on your own terms rather than through others' expectations. Life asks you to lead with your authentic self.`,
    2: `With your North Node in the 2nd house, your soul's purpose plays out through self-worth and material stability. You are learning to value yourself independently — building security from within rather than depending on external validation.`,
    3: `With your North Node in the 3rd house, your soul's purpose plays out through communication, learning, and connection. You are learning to listen, share ideas, and stay curious about the world immediately around you.`,
    4: `With your North Node in the 4th house, your soul's purpose plays out through emotional roots, home, and inner security. You are learning to create belonging from within — nurturing yourself and others with genuine emotional presence.`,
    5: `With your North Node in the 5th house, your soul's purpose plays out through creative expression, joy, and authentic self-expression. You are learning to follow your heart, take creative risks, and let yourself be seen.`,
    6: `With your North Node in the 6th house, your soul's purpose plays out through service, health, and meaningful daily practice. You are learning to show up consistently, contribute practically, and find purpose in the details.`,
    7: `With your North Node in the 7th house, your soul's purpose plays out through partnership, balance, and conscious relationship. You are learning to share your life — to compromise, collaborate, and grow through connection.`,
    8: `With your North Node in the 8th house, your soul's purpose plays out through depth, transformation, and emotional courage. You are learning to face what is hidden, trust the process of change, and allow vulnerability to become power.`,
    9: `With your North Node in the 9th house, your soul's purpose plays out through truth, exploration, and expanded understanding. You are learning to look beyond the familiar, follow meaning, and live according to what you believe.`,
    10: `With your North Node in the 10th house, your soul's purpose plays out through career, authority, and public contribution. You are learning to step into leadership, take responsibility, and build something that outlasts comfort.`,
    11: `With your North Node in the 11th house, your soul's purpose plays out through community, innovation, and collective contribution. You are learning to use your individuality in service of something larger than yourself.`,
    12: `With your North Node in the 12th house, your soul's purpose plays out through surrender, spirituality, and compassionate release. You are learning to trust what you cannot control and find meaning in letting go.`,
  },
};

export class FullNatalStoryGenerator {
  /**
   * Generate the complete natal story for premium users
   */
  static generateFullStory(chart: NatalChart, isPremium: boolean): FullNatalStory {
    let chapters: GeneratedChapter[];
    // All users get all 10 chapters with full content; chapters 4-10 locked for free users
    chapters = CHAPTER_DEFINITIONS.map(definition => {
      const { signLabel, sign } = FullNatalStoryGenerator.getChapterSignLabel(chart, definition.id);
      const contentObj = FullNatalStoryGenerator.getChapterContent(chart, definition.id, isPremium);
      let fullContent = signLabel + (contentObj.content || '');
      // Append Elemental Insight if relevant
      const signToElement: Record<string, string> = {
        Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
        Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
        Gemini: 'air', Libra: 'air', Aquarius: 'air',
        Cancer: 'water', Scorpio: 'water', Pisces: 'water',
      };
      const element = signToElement[sign];
      if (element && ELEMENTAL_INSIGHT_LIBRARY[element]?.[definition.id]) {
        const insight = ELEMENTAL_INSIGHT_LIBRARY[element][definition.id];
        fullContent += `\n\n${insight.label} ${insight.signList}\n\n${insight.text}`;
      }
      // Append Sun House Insight for Chapter 1 if house is available
      if (definition.id === 'core-self') {
        const sunHouse = chart.sun?.house;
        if (sunHouse && SUN_HOUSE_INSIGHT[sunHouse]) {
          const houseInsight = SUN_HOUSE_INSIGHT[sunHouse];
          fullContent += `\n\n${houseInsight.label}\n\n${houseInsight.text}`;
        }
      }
      // Append overlays for relevant chapters
      if (["how-you-love", "how-you-fight", "protection-style"].includes(definition.id)) {
        const elementOverlay = FullNatalStoryGenerator.getElementOverlay(chart, definition.id);
        if (elementOverlay) fullContent += '\n\n' + elementOverlay;
        const houseOverlay = FullNatalStoryGenerator.getHouseOverlay(chart, definition.id);
        if (houseOverlay) fullContent += '\n\n' + houseOverlay;
      } else if (["growth-arc", "souls-purpose", "shadow-work"].includes(definition.id)) {
        const houseOverlay = FullNatalStoryGenerator.getHouseOverlay(chart, definition.id);
        if (houseOverlay) fullContent += '\n\n' + houseOverlay;
        if (definition.id === 'growth-arc') {
          const jupiterHouse = chart.jupiter?.house;
          if (jupiterHouse && JUPITER_HOUSE_INSIGHT[jupiterHouse]) {
            fullContent += `\n\n${JUPITER_HOUSE_INSIGHT[jupiterHouse]}`;
          }
        }
        if (definition.id === 'souls-purpose') {
          const nn = chart.planets?.find((p: any) => p.planet?.toLowerCase() === 'north node');
          const nnHouse = nn?.house;
          if (nnHouse && NORTH_NODE_HOUSE_INSIGHT[nnHouse]) {
            fullContent += `\n\n${NORTH_NODE_HOUSE_INSIGHT[nnHouse]}`;
          }
        }
        if (definition.id === 'shadow-work') {
          const plutoHouse = chart.pluto?.house;
          if (plutoHouse && PLUTO_HOUSE_INSIGHT[plutoHouse]) {
            fullContent += `\n\n${PLUTO_HOUSE_INSIGHT[plutoHouse]}`;
          }
        }
      }
      return {
        id: definition.id,
        title: definition.title,
        subtitle: definition.subtitle,
        icon: definition.icon,
        isPremium: definition.isPremium,
        content: fullContent,
        reflection: contentObj.reflection,
        affirmation: contentObj.affirmation,
      };
    });
    const sunElement = this.getElement(chart.sunSign?.name || 'Aries');
    const moonElement = this.getElement(chart.moonSign?.name || 'Cancer');
    return {
      chapters,
      summary: this.generateSummary(chart, isPremium),
      affirmation: this.generateOverallAffirmation(sunElement, moonElement),
    };
  }

  // Returns { signLabel, sign } for a chapter id
  static getChapterSignLabel(chart: any, chapterId: string): { signLabel: string, sign: string } {
    let sign = '';
    let house: number | string | undefined = undefined;
    let signLabel = '';
    switch (chapterId) {
      case 'core-self':
        sign = chart.sunSign?.name || '';
        house = chart.sun?.house;
        break;
      case 'emotional-world':
        sign = chart.moonSign?.name || '';
        house = chart.moon?.house;
        break;
      case 'first-impression':
        sign = chart.risingSign?.name || '';
        house = chart.risingSign?.house;
        break;
      case 'how-you-love':
        sign = chart.venus?.sign?.name || '';
        house = chart.venus?.house;
        break;
      case 'how-you-fight':
        sign = chart.mars?.sign?.name || '';
        house = chart.mars?.house;
        break;
      case 'protection-style':
        sign = chart.moonSign?.name || '';
        house = chart.moon?.house;
        break;
      case 'inner-child':
        sign = chart.mercury?.sign?.name || '';
        house = chart.mercury?.house;
        break;
      case 'growth-arc':
        sign = chart.jupiter?.sign?.name || '';
        house = chart.jupiter?.house;
        break;
      case 'souls-purpose': {
        const nn = chart.planets?.find((p: any) => p.planet?.toLowerCase() === 'north node');
        sign = nn?.sign || '';
        house = nn?.house;
        break;
      }
      case 'shadow-work':
        sign = chart.pluto?.sign?.name || '';
        house = chart.pluto?.house;
        break;
      default:
        sign = '';
        house = undefined;
    }
    if (sign) {
      signLabel = `Your ${getChapterPlanetName(chapterId)} in ${sign}`;
      if (house) signLabel += ` · ${house}th House`;
      signLabel += `.\n\n`;
    }
    return { signLabel, sign };
    // Helper to get planet/point name for label
    function getChapterPlanetName(chapterId: string): string {
      switch (chapterId) {
        case 'core-self': return 'Sun';
        case 'emotional-world': return 'Moon';
        case 'first-impression': return 'Rising';
        case 'how-you-love': return 'Venus';
        case 'how-you-fight': return 'Mars';
        case 'protection-style': return 'Moon';
        case 'inner-child': return 'Mercury';
        case 'growth-arc': return 'Jupiter';
        case 'souls-purpose': return 'North Node';
        case 'shadow-work': return 'Pluto';
        default: return '';
      }
    }
  }
  
  /**
   * Generate a single chapter
   */
  private static generateChapter(
    chart: NatalChart, 
    definition: NatalChapter, 
    isPremium: boolean
  ): GeneratedChapter {
    // If not premium and chapter is premium, return teaser only (no summary or fallback)
    if (!isPremium && definition.isPremium) {
      return {
        id: definition.id,
        title: definition.title,
        subtitle: definition.subtitle,
        icon: definition.icon,
        isPremium: definition.isPremium,
        content: definition.freeContent.brief,
        reflection: definition.freeContent.teaser,
        affirmation: '',
      };
    }
    
    // Generate full content based on chart
    const content = this.getChapterContent(chart, definition.id, isPremium);

    // Only append overlays for relevant chapters if present and relevant
    let fullContent = content.content;
    // Ch4, Ch5, Ch6: element + house overlays
    if (["how-you-love", "how-you-fight", "protection-style"].includes(definition.id)) {
      const elementOverlay = this.getElementOverlay(chart, definition.id);
      if (elementOverlay) fullContent += '\n\n' + elementOverlay;
      const houseOverlay = this.getHouseOverlay(chart, definition.id);
      if (houseOverlay) fullContent += '\n\n' + houseOverlay;
    }
    // Ch8, Ch9: house overlays only
    else if (["growth-arc", "souls-purpose"].includes(definition.id)) {
      const houseOverlay = this.getHouseOverlay(chart, definition.id);
      if (houseOverlay) fullContent += '\n\n' + houseOverlay;
    }

    return {
      id: definition.id,
      title: definition.title,
      subtitle: definition.subtitle,
      icon: definition.icon,
      isPremium: definition.isPremium,
      content: fullContent,
      reflection: content.reflection,
      affirmation: content.affirmation,
    };
  }
  
  /**
   * Get the element for a planet by looking it up on the chart
   */
  private static getPlacementElement(chart: NatalChart, planetName: string): string {
    // Direct chart fields first (legacy PlanetPlacement with sign.element)
    const directMap: Record<string, keyof NatalChart> = {
      venus: 'venus', mars: 'mars', mercury: 'mercury',
      jupiter: 'jupiter', saturn: 'saturn', pluto: 'pluto',
    };
    const key = directMap[planetName];
    if (key) {
      const placement = chart[key] as any;
      if (placement?.sign?.element) return placement.sign.element.toLowerCase();
    }
    // Check planets array (for North Node, South Node, Chiron)
    const found = chart.planets?.find(p => p.planet.toLowerCase() === planetName.toLowerCase());
    if (found) return this.getElement(found.sign);
    // Fallback
    return this.getElement(chart.sunSign?.name || 'Aries');
  }

  /**
   * Get chapter content based on chart placements
   * Each chapter is tied to a specific planet:
   *   1. Core Self → Sun        6. Protection → Moon
   *   2. Emotional World → Moon  7. Inner Child → Mercury
  *   3. First Impression → ASC  8. Growth Arc → Jupiter
  *   4. How You Love → Venus    9. Soul's Purpose → North Node
  *   5. How You Fight → Mars   10. Shadow Work → Pluto
   */
  private static getChapterContent(
    chart: NatalChart,
    chapterId: string,
    isPremium: boolean
  ): { content: string; reflection: string; affirmation: string } {
    switch (chapterId) {
      case 'core-self': {
        const sunSign = chart.sunSign?.name || 'Aries';
        return CORE_SELF_CONTENT[sunSign] || CORE_SELF_CONTENT.Aries;
      }
      case 'emotional-world': {
        const moonSign = chart.moonSign?.name || 'Cancer';
        return EMOTIONAL_WORLD_CONTENT[moonSign] || EMOTIONAL_WORLD_CONTENT.Cancer;
      }
      case 'first-impression': {
        const risingName = chart.risingSign?.name || 'Aries';
        return FIRST_IMPRESSION_CONTENT[risingName] || FIRST_IMPRESSION_CONTENT.Aries;
      }
      case 'how-you-love': {
        const venusSign = chart.venus?.sign?.name || 'Taurus';
        return HOW_YOU_LOVE_CONTENT[venusSign] || HOW_YOU_LOVE_CONTENT.Taurus;
      }
      case 'how-you-fight': {
        const marsSign = chart.mars?.sign?.name || 'Aries';
        return HOW_YOU_FIGHT_CONTENT[marsSign] || HOW_YOU_FIGHT_CONTENT.Aries;
      }
      case 'protection-style': {
        const moonSign = chart.moonSign?.name || 'Cancer';
        return PROTECTION_STYLE_CONTENT[moonSign] || PROTECTION_STYLE_CONTENT.Cancer;
      }
      case 'inner-child': {
        const mercurySign = chart.mercury?.sign?.name || 'Gemini';
        return INNER_CHILD_CONTENT[mercurySign] || INNER_CHILD_CONTENT.Gemini;
      }
      case 'growth-arc': {
        const jupiterSign = chart.jupiter?.sign?.name || 'Sagittarius';
        return GROWTH_ARC_CONTENT[jupiterSign] || GROWTH_ARC_CONTENT.Sagittarius;
      }
      case 'souls-purpose': {
        const northNode = chart.planets?.find(p => p.planet.toLowerCase() === 'north node');
        const nnSign = northNode?.sign || 'Aries';
        return SOULS_PURPOSE_CONTENT[nnSign] || SOULS_PURPOSE_CONTENT.Aries;
      }
      case 'shadow-work': {
        const plutoSign = chart.pluto?.sign?.name || 'Scorpio';
        return SHADOW_WORK_CONTENT[plutoSign] || SHADOW_WORK_CONTENT.Scorpio;
      }
      default:
        // If a chapter is not mapped, return an empty string (never summarize or generate)
        return { content: '', reflection: '', affirmation: '' };
    }
  }
  
  /**
   * Fallback content for any chapter not yet mapped to sign-specific content.
   */
  private static getGenericPremiumContent(
    _chapterId: string,
    _element: string
  ): { content: string; reflection: string; affirmation: string } {
    return {
      content: 'Full content available for Deeper Sky members.',
      reflection: 'What resonates with you about this chapter?',
      affirmation: 'I am learning and growing every day.',
    };
  }

  /**
   * Get element overlay for applicable chapters (Ch4, Ch5, Ch6).
   * Returns a paragraph about how the planet's element shapes expression.
   */
  private static getElementOverlay(chart: NatalChart, chapterId: string): string | null {
    const chapterOverlays = ELEMENT_OVERLAY[chapterId];
    if (!chapterOverlays) return null;

    // Determine element based on the chapter's ruling planet
    let element: string;
    switch (chapterId) {
      case 'how-you-love':
        element = this.getPlacementElement(chart, 'venus');
        break;
      case 'how-you-fight':
        element = this.getPlacementElement(chart, 'mars');
        break;
      case 'protection-style':
        element = this.getElement(chart.moonSign?.name || 'Cancer');
        break;
      default:
        return null;
    }

    return chapterOverlays[element] || null;
  }

  /**
   * Get house overlay for applicable chapters (Ch4, Ch5, Ch6, Ch8, Ch9).
   * Returns a paragraph about where this pattern plays out in life.
   */
  private static getHouseOverlay(chart: NatalChart, chapterId: string): string | null {
    const chapterOverlays = HOUSE_OVERLAY[chapterId];
    if (!chapterOverlays) return null;

    // Determine house based on the chapter's ruling planet
    let house: number | undefined;
    switch (chapterId) {
      case 'how-you-love':
        house = chart.venus?.house;
        break;
      case 'how-you-fight':
        house = chart.mars?.house;
        break;
      case 'protection-style':
        house = chart.moon?.house;
        break;
      case 'growth-arc':
        house = chart.jupiter?.house;
        break;
      case 'souls-purpose': {
        const nn = chart.planets?.find(p => p.planet.toLowerCase() === 'north node');
        house = nn?.house;
        break;
      }
      default:
        return null;
    }

    if (!house) return null;
    return chapterOverlays[house] || null;
  }

  /**
   * Generate summary for the natal story
   */
  private static generateSummary(chart: NatalChart, isPremium: boolean): string {
    if (!isPremium) {
      return 'Unlock Deeper Sky to see your complete natal story summary.';
    }
    
    const sunSign = chart.sunSign?.name || 'Your Sun sign';
    const moonSign = chart.moonSign?.name || 'Your Moon sign';
    const risingSign = chart.risingSign?.name || 'Your Rising sign';
    
    return `You are a ${sunSign} Sun — ${this.getElementShorthand(sunSign)} at your core. Your ${moonSign} Moon gives you ${this.getMoonShorthand(moonSign)} emotional needs. And your ${risingSign} Rising means the world first sees you as ${this.getRisingShorthand(risingSign)}.\n\nThis combination makes you uniquely YOU. There's no one else with your exact cosmic blueprint. Your chart isn't a box to fit into — it's a map to understand yourself more deeply and compassionately.`;
  }
  
  /**
   * Generate overall affirmation
   */
  private static generateOverallAffirmation(sunElement: string, moonElement: string): string {
    const affirmations: Record<string, string> = {
      'fire-fire': 'I burn brightly without burning out. My passion is sustainable.',
      'fire-earth': 'I balance my fire with groundedness. I can dream AND build.',
      'fire-air': 'I combine vision with perspective. My ideas ignite connection.',
      'fire-water': 'I blend passion with depth. My emotions fuel my purpose.',
      'earth-fire': 'I build with passion. My foundations support big dreams.',
      'earth-earth': 'I am unshakeably grounded. My stability is my strength.',
      'earth-air': 'I think practically and dream freely. Ideas become reality through me.',
      'earth-water': 'I nurture what I build. My creations have soul.',
      'air-fire': 'I think boldly and act courageously. My mind lights the way.',
      'air-earth': 'I ground my ideas in reality. Thoughts become tangible.',
      'air-air': 'I connect ideas and people. Understanding is my superpower.',
      'air-water': 'I think with my heart and feel with my mind. Both are valid.',
      'water-fire': 'I feel passionately and act intuitively. My heart guides my fire.',
      'water-earth': 'I nurture and build. My emotions create lasting foundations.',
      'water-air': 'I feel AND think. My emotional intelligence is my gift.',
      'water-water': 'I feel deeply and that is my strength. My sensitivity is wisdom.',
    };
    
    return affirmations[`${sunElement}-${moonElement}`] || 'I am exactly who I was meant to be.';
  }
  
  private static getElement(sign: string): string {
    const fireSign = ['Aries', 'Leo', 'Sagittarius'].includes(sign);
    const earthSign = ['Taurus', 'Virgo', 'Capricorn'].includes(sign);
    const airSign = ['Gemini', 'Libra', 'Aquarius'].includes(sign);
    
    if (fireSign) return 'fire';
    if (earthSign) return 'earth';
    if (airSign) return 'air';
    return 'water';
  }
  
  private static getElementShorthand(sign: string): string {
    const element = this.getElement(sign);
    const descriptions: Record<string, string> = {
      fire: 'passionate and driven',
      earth: 'grounded and reliable',
      air: 'curious and communicative',
      water: 'intuitive and deep',
    };
    return descriptions[element] || 'unique';
  }
  
  private static getMoonShorthand(sign: string): string {
    const element = this.getElement(sign);
    const descriptions: Record<string, string> = {
      fire: 'passionate and expressive',
      earth: 'stable and practical',
      air: 'analytical and communicative',
      water: 'deep and nurturing',
    };
    return descriptions[element] || 'complex';
  }
  
  private static getRisingShorthand(sign: string): string {
    const element = this.getElement(sign);
    const descriptions: Record<string, string> = {
      fire: 'confident and warm',
      earth: 'composed and capable',
      air: 'friendly and approachable',
      water: 'mysterious and empathetic',
    };
    return descriptions[element] || 'interesting';
  }
}
