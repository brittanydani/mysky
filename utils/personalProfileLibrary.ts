/**
 * Personal Profile Insight Library
 * 
 * Premium narrative variations for personal profile insights.
 * Replaces generic trait descriptions with deeply personal, data-grounded language.
 * 
 * This library contains 500+ variations across all trait categories,
 * making insights feel uniquely tailored to each user's actual patterns.
 */

import type { PersonalTrait, RecoveryStyle, StressPattern, PersonalStrength, Anticipation, ProgressMarker } from './personalProfile';

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Sensitivity Traits (50 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateSleepSensitivityTrait(strength: number, goodAvg: number, poorAvg: number): string {
  const diff = (goodAvg - poorAvg).toFixed(1);
  
  const variations = [
    `Sleep quality shifts your emotional steadiness more than most tracked factors. On nights you sleep well, your stability averages ${goodAvg.toFixed(1)} — after poor sleep, it drops to ${poorAvg.toFixed(1)}. That ${diff}-point difference suggests your nervous system relies on rest to stay regulated.`,
    `Your data shows a ${diff}-point stability gap between good sleep nights (${goodAvg.toFixed(1)}) and poor ones (${poorAvg.toFixed(1)}). Sleep isn't just recovery for you — it's emotional infrastructure.`,
    `Poor sleep has measurable downstream effects on your steadiness. The ${diff}-point drop from ${goodAvg.toFixed(1)} to ${poorAvg.toFixed(1)} suggests your system doesn't just feel tired — it becomes genuinely less stable when rest is compromised.`,
    `Sleep appears to be one of your most reliable emotional levers. After good rest, your stability averages ${goodAvg.toFixed(1)}. After fragmented or short sleep, it falls to ${poorAvg.toFixed(1)}. That pattern has held across multiple weeks.`,
    `You seem highly sensitive to sleep quality in a way that goes beyond feeling tired. The data shows a ${diff}-point stability difference, which means poor sleep doesn't just drain you — it destabilizes your emotional baseline.`,
    `Your nervous system appears to depend on sleep more than average. When rest is solid, you average ${goodAvg.toFixed(1)} stability. When it's not, you drop to ${poorAvg.toFixed(1)}. That's not weakness — it's how your particular system is wired.`,
    `Sleep quality predicts your emotional steadiness more reliably than most other factors. The ${diff}-point gap between good nights (${goodAvg.toFixed(1)}) and poor ones (${poorAvg.toFixed(1)}) suggests rest is foundational for you, not optional.`,
    `After poor sleep, your stability drops by ${diff} points on average. That's significant enough to affect how you meet the day, how much capacity you have, and how easily small stressors compound.`,
    `Your system shows clear sleep sensitivity: ${goodAvg.toFixed(1)} stability after good rest, ${poorAvg.toFixed(1)} after poor. This means treating sleep as support rather than something you earn may be more important for you than for others.`,
    `The data confirms what you may already sense: sleep isn't just about energy for you. It's about emotional regulation. The ${diff}-point stability difference between rested and unrested days is too consistent to ignore.`,
    `Sleep appears to function as emotional scaffolding for your system. When it's solid (${goodAvg.toFixed(1)} avg stability), you hold steady. When it's not (${poorAvg.toFixed(1)} avg), things feel harder to contain.`,
    `You're more sleep-sensitive than the average person. That ${diff}-point stability gap means poor sleep doesn't just make you tired — it makes everything feel heavier, more overwhelming, harder to process.`,
    `Your emotional steadiness tracks closely with sleep quality. After good nights, you average ${goodAvg.toFixed(1)}. After poor ones, ${poorAvg.toFixed(1)}. That pattern suggests your nervous system needs rest to stay regulated, not just to feel awake.`,
    `Sleep quality has an outsized effect on your stability — a ${diff}-point average difference. This isn't about willpower or resilience. It's about how your particular nervous system recovers and regulates.`,
    `The ${diff}-point stability drop after poor sleep (from ${goodAvg.toFixed(1)} to ${poorAvg.toFixed(1)}) suggests sleep is one of your most reliable emotional predictors. Protecting it may matter more for you than productivity advice would suggest.`,
    `When you sleep well, your stability holds at ${goodAvg.toFixed(1)}. When you don't, it drops to ${poorAvg.toFixed(1)}. That ${diff}-point swing suggests sleep quality shapes your emotional day more than most other variables.`,
    `Your system shows pronounced sleep dependency. The ${diff}-point difference between rested (${goodAvg.toFixed(1)}) and unrested (${poorAvg.toFixed(1)}) states suggests your nervous system uses sleep to reset its regulatory capacity.`,
    `Sleep quality appears to be your most consistent emotional predictor. After good rest, you average ${goodAvg.toFixed(1)} stability. After poor rest, ${poorAvg.toFixed(1)}. That ${diff}-point gap has held steady across weeks of data.`,
    `The data shows sleep affects you more than it might affect others. A ${diff}-point stability difference means poor sleep doesn't just make you groggy — it fundamentally shifts how your system handles emotion and stress.`,
    `Your emotional regulation appears tightly coupled to sleep quality. When rest is good (${goodAvg.toFixed(1)} avg), you maintain steadiness. When it's compromised (${poorAvg.toFixed(1)} avg), your capacity drops measurably.`,
    `Sleep sensitivity shows up clearly: ${goodAvg.toFixed(1)} stability after good nights, ${poorAvg.toFixed(1)} after poor ones. This ${diff}-point pattern suggests your system needs rest to maintain its regulatory baseline.`,
    `Poor sleep doesn't just affect your energy — it affects your emotional infrastructure. The ${diff}-point drop from ${goodAvg.toFixed(1)} to ${poorAvg.toFixed(1)} suggests your nervous system relies on rest to stay organized.`,
    `Your stability averages ${goodAvg.toFixed(1)} after good sleep and ${poorAvg.toFixed(1)} after poor sleep. That ${diff}-point difference is large enough to shape your entire day — how you respond to stress, how much you can hold, how quickly you recover.`,
    `Sleep appears to be regulatory for you, not just restorative. The ${diff}-point stability gap suggests your system uses rest to recalibrate its emotional baseline, not just to recharge energy.`,
    `When sleep is solid, you average ${goodAvg.toFixed(1)} stability. When it's not, you drop to ${poorAvg.toFixed(1)}. That ${diff}-point difference suggests sleep quality may be your most reliable lever for emotional steadiness.`,
    `Your data shows sleep sensitivity that goes beyond typical tiredness. A ${diff}-point stability swing means poor rest doesn't just drain you — it makes your system less able to regulate emotion and handle complexity.`,
    `Sleep quality has a ${diff}-point effect on your stability (${goodAvg.toFixed(1)} vs ${poorAvg.toFixed(1)}). This suggests your nervous system depends on rest to maintain its regulatory capacity, not just to feel awake.`,
    `The ${diff}-point gap between rested and unrested days suggests sleep is foundational for your emotional regulation. When it's compromised, your entire system becomes less stable.`,
    `Your system shows clear sleep dependency: ${goodAvg.toFixed(1)} stability after good rest, ${poorAvg.toFixed(1)} after poor. This pattern suggests rest is regulatory infrastructure for you, not just recovery time.`,
    `Sleep quality predicts your emotional day more reliably than most other factors. The ${diff}-point difference (${goodAvg.toFixed(1)} vs ${poorAvg.toFixed(1)}) suggests your system needs rest to stay organized and regulated.`,
    `After poor sleep, your stability drops by ${diff} points on average. That's enough to affect your capacity, your resilience, and how easily small stressors compound into larger ones.`,
    `Your nervous system appears to use sleep as its primary regulatory reset. When rest is good (${goodAvg.toFixed(1)} avg), you maintain steadiness. When it's not (${poorAvg.toFixed(1)} avg), your baseline shifts measurably.`,
    `The data confirms sleep sensitivity: a ${diff}-point stability difference between good and poor rest nights. This suggests your system doesn't just need sleep to function — it needs it to regulate.`,
    `Sleep quality shapes your emotional steadiness more than most tracked variables. The ${diff}-point gap (${goodAvg.toFixed(1)} vs ${poorAvg.toFixed(1)}) suggests rest is foundational for your nervous system's regulatory capacity.`,
    `Your stability averages ${goodAvg.toFixed(1)} after good sleep and ${poorAvg.toFixed(1)} after poor sleep. That ${diff}-point swing is significant enough to shape how you experience your entire day.`,
    `Sleep appears to be your most reliable emotional lever. When it's solid, you average ${goodAvg.toFixed(1)} stability. When it's compromised, you drop to ${poorAvg.toFixed(1)}. That pattern has held consistently.`,
    `The ${diff}-point stability drop after poor sleep suggests your nervous system relies on rest more than average. Poor sleep doesn't just make you tired — it makes everything harder to hold.`,
    `Your system shows pronounced sleep sensitivity. The ${diff}-point difference between rested (${goodAvg.toFixed(1)}) and unrested (${poorAvg.toFixed(1)}) states suggests sleep is regulatory infrastructure, not just recovery.`,
    `Sleep quality has a ${diff}-point effect on your emotional steadiness. This suggests your nervous system uses rest to maintain its baseline, not just to recharge energy.`,
    `When you sleep well, stability holds at ${goodAvg.toFixed(1)}. When you don't, it drops to ${poorAvg.toFixed(1)}. That ${diff}-point pattern suggests sleep shapes your emotional day more than most other factors.`,
    `Your data shows clear sleep dependency: ${goodAvg.toFixed(1)} after good rest, ${poorAvg.toFixed(1)} after poor. This means protecting sleep may be more important for your emotional regulation than productivity culture would suggest.`,
    `Sleep quality predicts your stability more reliably than most other variables. The ${diff}-point gap suggests your system needs rest to stay regulated, not just to feel awake.`,
    `The ${diff}-point stability difference between good and poor sleep nights suggests your nervous system depends on rest to maintain its regulatory capacity. Poor sleep doesn't just drain you — it destabilizes you.`,
    `Your system shows sleep sensitivity that goes beyond typical tiredness. A ${diff}-point drop (from ${goodAvg.toFixed(1)} to ${poorAvg.toFixed(1)}) means poor rest fundamentally shifts how you handle emotion and stress.`,
    `Sleep appears to function as emotional infrastructure for you. When it's solid (${goodAvg.toFixed(1)} avg), you hold steady. When it's not (${poorAvg.toFixed(1)} avg), your capacity drops measurably.`,
    `After poor sleep, your stability drops by ${diff} points. That's significant enough to affect how much you can hold, how easily you recover, and how quickly small stressors compound.`,
    `Your nervous system appears to rely on sleep more than average. The ${diff}-point stability gap (${goodAvg.toFixed(1)} vs ${poorAvg.toFixed(1)}) suggests rest is foundational for your emotional regulation.`,
    `Sleep quality has an outsized effect on your steadiness. The ${diff}-point difference suggests your system uses rest to recalibrate its regulatory baseline, not just to recharge.`,
    `The data shows sleep affects you more than it might affect others. A ${diff}-point stability swing means poor rest doesn't just make you groggy — it makes your entire system less able to regulate.`,
    `Your stability tracks closely with sleep quality: ${goodAvg.toFixed(1)} after good nights, ${poorAvg.toFixed(1)} after poor ones. That ${diff}-point pattern suggests rest is regulatory for you, not just restorative.`,
  ];
  
  const index = Math.floor(strength / 2) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection Sensitivity Traits (50 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateConnectionSensitivityTrait(strength: number, connectedAvg: number, disconnectedAvg: number): string {
  const spread = (connectedAvg - disconnectedAvg).toFixed(1);
  
  const variations = [
    `Connection appears to deeply affect your emotional state. On days you feel supported, your stability averages ${connectedAvg.toFixed(1)}. When disconnected, it drops to ${disconnectedAvg.toFixed(1)}. That ${spread}-point difference suggests relational quality regulates you more than solitude does.`,
    `Your data shows a ${spread}-point stability gap between connected days (${connectedAvg.toFixed(1)}) and disconnected ones (${disconnectedAvg.toFixed(1)}). Feeling understood seems to steady you in ways that productivity or achievement may not.`,
    `Disconnection lingers for you. The ${spread}-point drop from ${connectedAvg.toFixed(1)} to ${disconnectedAvg.toFixed(1)} suggests that feeling unsupported or misunderstood doesn't just hurt — it destabilizes your baseline.`,
    `You seem to be someone for whom connection is regulatory, not just nice to have. When you feel supported, stability averages ${connectedAvg.toFixed(1)}. When you don't, it falls to ${disconnectedAvg.toFixed(1)}. That's a meaningful difference.`,
    `Relational quality affects your steadiness more than most tracked factors. The ${spread}-point gap suggests that for you, feeling understood may be closer to a need than a preference.`,
    `Your system appears to regulate through connection. On days you feel supported, you average ${connectedAvg.toFixed(1)} stability. On days you feel alone or misunderstood, you drop to ${disconnectedAvg.toFixed(1)}. That pattern has held consistently.`,
    `Connection sensitivity shows up clearly in your data: ${connectedAvg.toFixed(1)} stability when you feel supported, ${disconnectedAvg.toFixed(1)} when you don't. This suggests relational safety may be one of your core emotional needs.`,
    `The ${spread}-point stability difference between connected and disconnected days suggests you're wired to co-regulate. Solitude may restore you, but feeling understood steadies you in a way nothing else quite does.`,
    `Feeling supported or misunderstood has a ${spread}-point effect on your stability. That's significant enough to shape how you experience your days, how much capacity you have, and how easily you recover from difficulty.`,
    `Your data confirms what you may already know: connection isn't just about loneliness for you. It's about regulation. The ${spread}-point gap between supported (${connectedAvg.toFixed(1)}) and unsupported (${disconnectedAvg.toFixed(1)}) days is too consistent to dismiss.`,
    `You appear to be someone who steadies through relational attunement. When you feel understood, stability averages ${connectedAvg.toFixed(1)}. When you don't, it drops to ${disconnectedAvg.toFixed(1)}. That's not neediness — it's how your nervous system is built.`,
    `Connection quality predicts your emotional steadiness more reliably than most other factors. The ${spread}-point difference suggests that for you, feeling seen may be as foundational as sleep or rest.`,
    `Your system shows clear connection sensitivity: ${connectedAvg.toFixed(1)} stability on supported days, ${disconnectedAvg.toFixed(1)} on disconnected ones. This means protecting relational safety may be more important for you than pushing through alone.`,
    `The data shows a ${spread}-point stability gap based on connection quality. This suggests that for you, feeling understood isn't just emotionally nice — it's regulatory. It helps you hold steady when things get hard.`,
    `Relational disconnection affects you more than it might for others. That ${spread}-point drop (from ${connectedAvg.toFixed(1)} to ${disconnectedAvg.toFixed(1)}) means feeling misunderstood or alone doesn't just hurt — it makes everything else harder to manage.`,
    `When you feel connected, your stability averages ${connectedAvg.toFixed(1)}. When disconnected, it drops to ${disconnectedAvg.toFixed(1)}. That ${spread}-point difference suggests connection isn't just nice to have — it's structurally regulating for your nervous system.`,
    `Your system appears to co-regulate more than self-regulate. The ${spread}-point stability gap between supported (${connectedAvg.toFixed(1)}) and unsupported (${disconnectedAvg.toFixed(1)}) days suggests relational attunement steadies you in ways solitude may not.`,
    `Connection quality has a ${spread}-point effect on your emotional steadiness. This suggests feeling understood may be as foundational for your regulation as sleep or rest.`,
    `The data shows you're wired for relational regulation. When you feel supported, stability holds at ${connectedAvg.toFixed(1)}. When you don't, it drops to ${disconnectedAvg.toFixed(1)}. That ${spread}-point pattern is too consistent to ignore.`,
    `Feeling misunderstood or alone has a ${spread}-point effect on your stability. This suggests disconnection doesn't just hurt emotionally — it destabilizes your nervous system's baseline.`,
    `Your stability averages ${connectedAvg.toFixed(1)} on connected days and ${disconnectedAvg.toFixed(1)} on disconnected ones. That ${spread}-point difference suggests relational quality shapes your emotional day more than most other factors.`,
    `Connection appears to be regulatory for you, not just comforting. The ${spread}-point stability gap suggests your system uses relational attunement to maintain its baseline, not just to feel less lonely.`,
    `When you feel understood, you average ${connectedAvg.toFixed(1)} stability. When you don't, you drop to ${disconnectedAvg.toFixed(1)}. That ${spread}-point difference suggests connection may be closer to a need than a preference for you.`,
    `Your data shows connection sensitivity that goes beyond typical social needs. A ${spread}-point stability swing means feeling misunderstood doesn't just hurt — it makes your entire system less able to regulate.`,
    `Relational quality predicts your emotional steadiness more reliably than most tracked variables. The ${spread}-point gap (${connectedAvg.toFixed(1)} vs ${disconnectedAvg.toFixed(1)}) suggests feeling seen is foundational for your nervous system.`,
    `The ${spread}-point stability difference between connected and disconnected days suggests you're wired to co-regulate. Feeling understood steadies you in ways that solitude or productivity may not.`,
    `Your system shows clear connection dependency: ${connectedAvg.toFixed(1)} stability when supported, ${disconnectedAvg.toFixed(1)} when not. This pattern suggests relational safety is regulatory infrastructure for you.`,
    `Connection quality has a ${spread}-point effect on your stability (${connectedAvg.toFixed(1)} vs ${disconnectedAvg.toFixed(1)}). This suggests your nervous system uses relational attunement to maintain its regulatory capacity.`,
    `After disconnected days, your stability drops by ${spread} points on average. That's enough to affect your capacity, your resilience, and how easily small stressors compound.`,
    `Your nervous system appears to regulate through connection more than through solitude. When you feel supported (${connectedAvg.toFixed(1)} avg), you maintain steadiness. When you don't (${disconnectedAvg.toFixed(1)} avg), your baseline shifts measurably.`,
    `The data confirms connection sensitivity: a ${spread}-point stability difference between supported and unsupported days. This suggests your system doesn't just want connection — it needs it to regulate.`,
    `Relational quality shapes your emotional steadiness more than most tracked variables. The ${spread}-point gap (${connectedAvg.toFixed(1)} vs ${disconnectedAvg.toFixed(1)}) suggests feeling understood is foundational for your regulatory capacity.`,
    `Your stability averages ${connectedAvg.toFixed(1)} when you feel supported and ${disconnectedAvg.toFixed(1)} when you don't. That ${spread}-point swing is significant enough to shape how you experience your entire day.`,
    `Connection appears to be your most reliable emotional lever. When you feel understood, you average ${connectedAvg.toFixed(1)} stability. When you don't, you drop to ${disconnectedAvg.toFixed(1)}. That pattern has held consistently.`,
    `The ${spread}-point stability drop on disconnected days suggests your nervous system relies on relational attunement more than average. Feeling misunderstood doesn't just hurt — it makes everything harder to hold.`,
    `Your system shows pronounced connection sensitivity. The ${spread}-point difference between supported (${connectedAvg.toFixed(1)}) and unsupported (${disconnectedAvg.toFixed(1)}) states suggests connection is regulatory infrastructure, not just comfort.`,
    `Relational quality has a ${spread}-point effect on your emotional steadiness. This suggests your nervous system uses connection to maintain its baseline, not just to feel less alone.`,
    `When you feel understood, stability holds at ${connectedAvg.toFixed(1)}. When you don't, it drops to ${disconnectedAvg.toFixed(1)}. That ${spread}-point pattern suggests connection shapes your emotional day more than most other factors.`,
    `Your data shows clear connection dependency: ${connectedAvg.toFixed(1)} when supported, ${disconnectedAvg.toFixed(1)} when not. This means protecting relational safety may be more important for your emotional regulation than independence culture would suggest.`,
    `Connection quality predicts your stability more reliably than most other variables. The ${spread}-point gap suggests your system needs relational attunement to stay regulated, not just to feel connected.`,
    `The ${spread}-point stability difference between supported and unsupported days suggests your nervous system depends on connection to maintain its regulatory capacity. Disconnection doesn't just hurt — it destabilizes you.`,
    `Your system shows connection sensitivity that goes beyond typical social needs. A ${spread}-point drop (from ${connectedAvg.toFixed(1)} to ${disconnectedAvg.toFixed(1)}) means feeling misunderstood fundamentally shifts how you handle emotion and stress.`,
    `Connection appears to function as emotional infrastructure for you. When you feel supported (${connectedAvg.toFixed(1)} avg), you hold steady. When you don't (${disconnectedAvg.toFixed(1)} avg), your capacity drops measurably.`,
    `On disconnected days, your stability drops by ${spread} points. That's significant enough to affect how much you can hold, how easily you recover, and how quickly small stressors compound.`,
    `Your nervous system appears to rely on connection more than average. The ${spread}-point stability gap (${connectedAvg.toFixed(1)} vs ${disconnectedAvg.toFixed(1)}) suggests relational attunement is foundational for your emotional regulation.`,
    `Relational quality has an outsized effect on your steadiness. The ${spread}-point difference suggests your system uses connection to recalibrate its regulatory baseline, not just to feel less lonely.`,
    `The data shows connection affects you more than it might affect others. A ${spread}-point stability swing means feeling misunderstood doesn't just hurt — it makes your entire system less able to regulate.`,
    `Your stability tracks closely with connection quality: ${connectedAvg.toFixed(1)} on supported days, ${disconnectedAvg.toFixed(1)} on disconnected ones. That ${spread}-point pattern suggests relational attunement is regulatory for you, not just comforting.`,
    `Feeling understood or misunderstood has a ${spread}-point effect on your stability. This suggests connection quality is one of your most reliable emotional predictors — as foundational as sleep or rest.`,
    `Your system appears wired for co-regulation. The ${spread}-point gap between connected (${connectedAvg.toFixed(1)}) and disconnected (${disconnectedAvg.toFixed(1)}) days suggests you steady through relational attunement more than through solitude.`,
  ];
  
  const index = Math.floor(strength / 2) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Emotional Crowding Sensitivity (40 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateCrowdingSensitivityTrait(strength: number, lowIntensityAvg: number, highIntensityAvg: number): string {
  const diff = (lowIntensityAvg - highIntensityAvg).toFixed(1);
  
  const variations = [
    `You seem especially affected by emotional crowding — too many feelings or demands at once. When emotional intensity is high, your stability drops by ${diff} points on average. Single stressors may be manageable, but multiple overlapping ones destabilize you more quickly.`,
    `Your data suggests you're sensitive to emotional overwhelm in a specific way: not just intensity, but crowding. When too much is happening at once, stability drops by ${diff} points. You may need more space between demands than others do.`,
    `Emotional crowding — multiple feelings, demands, or stressors at once — lowers your stability by ${diff} points on average. This suggests your system needs time to process one thing before taking on the next.`,
    `When emotional intensity is high, your stability averages ${highIntensityAvg.toFixed(1)}. When it's lower, you average ${lowIntensityAvg.toFixed(1)}. That ${diff}-point difference suggests you're more affected by emotional crowding than by single difficult moments.`,
    `You appear to destabilize more from emotional crowding than from single stressors. The ${diff}-point drop when intensity is high suggests your system needs space to process, not just strength to endure.`,
    `Too many feelings or demands at once affects you more than sustained difficulty. The ${diff}-point stability drop during high-intensity periods suggests you may need to protect against overwhelm, not just stress.`,
    `Your system shows sensitivity to emotional crowding: ${lowIntensityAvg.toFixed(1)} stability when things are calmer, ${highIntensityAvg.toFixed(1)} when multiple demands overlap. That pattern suggests you need more processing time than others might.`,
    `Emotional intensity — especially when multiple things are happening at once — drops your stability by ${diff} points. This isn't about being weak. It's about how your nervous system handles complexity.`,
    `The data shows a ${diff}-point stability gap between calm periods (${lowIntensityAvg.toFixed(1)}) and emotionally crowded ones (${highIntensityAvg.toFixed(1)}). You may be someone who needs to sequence demands rather than stack them.`,
    `You seem to be affected more by emotional crowding than by single difficult moments. When too much is happening at once, stability drops by ${diff} points. Protecting space between demands may matter more for you than pushing through.`,
    `Emotional crowding — overlapping feelings, demands, or stressors — has a ${diff}-point effect on your stability. This suggests your system processes sequentially, not in parallel. That's not a flaw — it's how you're wired.`,
    `When emotional intensity is high, your stability drops to ${highIntensityAvg.toFixed(1)} from a baseline of ${lowIntensityAvg.toFixed(1)}. That ${diff}-point difference suggests you need more recovery time between intense moments than others might.`,
    `Your stability averages ${lowIntensityAvg.toFixed(1)} during calmer periods and ${highIntensityAvg.toFixed(1)} when emotional intensity is high. That ${diff}-point drop suggests you're more affected by crowding than by single stressors.`,
    `Multiple overlapping demands or feelings drop your stability by ${diff} points on average. This suggests your system needs space to process one thing before taking on the next — stacking demands may overwhelm you more quickly.`,
    `The data shows you're sensitive to emotional crowding in a specific way. A ${diff}-point stability drop when intensity is high suggests your system handles single stressors better than multiple simultaneous ones.`,
    `When too much is happening at once, your stability drops by ${diff} points. This suggests your nervous system processes sequentially — it needs time between demands, not just capacity to handle them.`,
    `Emotional crowding affects you more than sustained difficulty. The ${diff}-point drop (from ${lowIntensityAvg.toFixed(1)} to ${highIntensityAvg.toFixed(1)}) suggests you may need to protect against overwhelm by spacing demands, not just reducing them.`,
    `Your system shows clear sensitivity to emotional crowding: ${lowIntensityAvg.toFixed(1)} stability when things are calmer, ${highIntensityAvg.toFixed(1)} when multiple demands overlap. This pattern suggests you need more processing time than others.`,
    `Multiple feelings or demands at once drop your stability by ${diff} points. This isn't about weakness — it's about how your particular nervous system handles complexity and simultaneous inputs.`,
    `The ${diff}-point stability gap between calm and crowded periods suggests you're wired to process sequentially. Stacking demands may overwhelm you more quickly than single difficult moments.`,
    `You appear to be someone who needs space between emotional demands. When intensity is high, stability drops by ${diff} points. This suggests your system processes one thing at a time, not multiple things in parallel.`,
    `Emotional crowding has a ${diff}-point effect on your stability (${lowIntensityAvg.toFixed(1)} vs ${highIntensityAvg.toFixed(1)}). This suggests your nervous system needs time to process each demand before taking on the next.`,
    `When multiple things are happening at once, your stability drops by ${diff} points. This suggests you may need to sequence demands rather than stack them — your system handles complexity better when it's spread out.`,
    `Your data shows sensitivity to emotional crowding more than to single stressors. The ${diff}-point drop when intensity is high suggests your system needs space to process, not just strength to endure.`,
    `Emotional intensity — especially when multiple demands overlap — drops your stability by ${diff} points. This suggests your nervous system processes sequentially, which means spacing demands may matter more than reducing them.`,
    `The data shows a ${diff}-point stability gap between calm (${lowIntensityAvg.toFixed(1)}) and crowded (${highIntensityAvg.toFixed(1)}) periods. You may be someone who needs to protect against overwhelm by spacing demands, not just managing them.`,
    `You seem affected more by emotional crowding than by sustained difficulty. When too much is happening at once, stability drops by ${diff} points. This suggests your system needs time between demands.`,
    `Emotional crowding — overlapping feelings or demands — has a ${diff}-point effect on your stability. This suggests your system processes one thing at a time, which means stacking demands may overwhelm you more quickly.`,
    `When emotional intensity is high, your stability drops to ${highIntensityAvg.toFixed(1)} from ${lowIntensityAvg.toFixed(1)}. That ${diff}-point difference suggests you need more recovery time between intense moments than others might.`,
    `Your stability averages ${lowIntensityAvg.toFixed(1)} during calmer periods and ${highIntensityAvg.toFixed(1)} when multiple demands overlap. That ${diff}-point drop suggests you're wired to process sequentially, not in parallel.`,
    `Multiple overlapping demands drop your stability by ${diff} points. This suggests your system needs space between emotional inputs — crowding may overwhelm you more quickly than single stressors.`,
    `The data shows you're sensitive to emotional crowding. A ${diff}-point stability drop when intensity is high suggests your system handles single stressors better than multiple simultaneous ones.`,
    `When too much is happening at once, your stability drops by ${diff} points. This suggests your nervous system needs time to process each demand before taking on the next — stacking may overwhelm you.`,
    `Emotional crowding affects you more than sustained difficulty. The ${diff}-point drop suggests you may need to protect against overwhelm by spacing demands, not just reducing their intensity.`,
    `Your system shows sensitivity to emotional crowding: ${lowIntensityAvg.toFixed(1)} when calmer, ${highIntensityAvg.toFixed(1)} when crowded. This pattern suggests you need more processing time between demands than others might.`,
    `Multiple feelings or demands at once drop your stability by ${diff} points. This suggests your system processes sequentially — it needs space between inputs, not just capacity to handle them.`,
    `The ${diff}-point stability gap between calm and crowded periods suggests you're wired to process one thing at a time. Stacking demands may overwhelm you more quickly than single difficult moments.`,
    `You appear to need space between emotional demands. When intensity is high, stability drops by ${diff} points. This suggests your system handles complexity better when it's sequenced, not stacked.`,
    `Emotional crowding has a ${diff}-point effect on your stability. This suggests your nervous system processes one demand at a time, which means spacing them may matter more than reducing them.`,
    `When multiple things are happening at once, your stability drops by ${diff} points. This suggests you may need to sequence demands rather than stack them — your system handles complexity better when it's spread out over time.`,
  ];
  
  const index = Math.floor(strength / 2.5) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Gradual Accumulator (Push-Through Pattern) (40 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateGradualAccumulatorTrait(strength: number, maxStreak: number): string {
  const variations = [
    `You tend to accumulate stress gradually rather than crashing suddenly. Your data shows strain building over ${maxStreak}+ consecutive days before you notice it's too much. By the time you feel depleted, your system has often been carrying more than it should for a while.`,
    `Stress builds slowly for you — often over ${maxStreak} days or more. This means you may not realize you're overwhelmed until you're already well past your capacity. Early warning signs may be subtle for you.`,
    `Your pattern shows gradual accumulation: strain rises steadily over ${maxStreak}+ days before peaking. This suggests you push through longer than your system wants you to, and by the time you stop, you're already depleted.`,
    `You appear to be someone who keeps going well past the point where your body is asking for care. Strain builds over ${maxStreak} consecutive days on average before you hit a wall. That delay makes recovery harder.`,
    `The data shows a ${maxStreak}-day buildup pattern. You don't crash suddenly — you accumulate strain gradually, often without noticing. By the time you feel it, you've been carrying too much for days.`,
    `You tend to push through rather than pause early. Strain builds over ${maxStreak}+ days before you acknowledge it's too much. This pattern suggests you may need to trust earlier signals, not just the breaking point.`,
    `Stress accumulates slowly for you — over ${maxStreak} days on average. This means the moment you feel depleted is usually not the moment the problem started. It started days earlier, when the signals were quieter.`,
    `Your system shows a gradual accumulation pattern: ${maxStreak} consecutive days of rising strain before you stop. This suggests you're wired to endure, but that endurance often costs more than you realize in the moment.`,
    `You don't crash suddenly — you build up slowly. Strain rises over ${maxStreak}+ days before peaking. This means by the time you feel overwhelmed, your system has been asking for care for a while.`,
    `The data shows you tend to carry strain for ${maxStreak} days or more before it becomes unbearable. This pattern suggests you may need to respond to earlier, quieter signals rather than waiting for the breaking point.`,
    `You appear to accumulate stress gradually over ${maxStreak}+ days. This isn't resilience — it's delayed recognition. By the time you feel depleted, you've been running on fumes longer than you thought.`,
    `Strain builds over ${maxStreak} consecutive days on average before you acknowledge it. This suggests you push through longer than your system wants you to, and recovery takes longer as a result.`,
    `Your pattern shows ${maxStreak}-day strain buildups. You don't collapse suddenly — you erode gradually. This means the moment you feel overwhelmed is usually not the start of the problem. It's the culmination.`,
    `You tend to keep going for ${maxStreak}+ days even as strain rises. This pattern suggests you may need to treat early discomfort as information, not something to push through until it becomes unbearable.`,
    `The data shows gradual accumulation: strain rises steadily over ${maxStreak} days before you stop. This suggests your breaking point is not when the problem started — it's when your system finally forced you to listen.`,
    `Stress builds over ${maxStreak} consecutive days before you notice it's too much. This suggests you may not recognize overwhelm until you're already well past capacity. Earlier signals may be quieter for you.`,
    `Your system shows a ${maxStreak}-day accumulation pattern. You don't crash suddenly — you carry strain gradually, often without realizing how much you're holding until it becomes unbearable.`,
    `You tend to push through for ${maxStreak}+ days even as strain rises. This suggests you may need to respond to earlier signals — the quiet discomfort, not just the breaking point.`,
    `The data shows strain building over ${maxStreak} consecutive days on average. This means by the time you feel depleted, your system has been asking for care for a while. The breaking point is not the start.`,
    `You appear to accumulate stress gradually rather than crashing suddenly. Strain rises over ${maxStreak}+ days before you stop. This pattern suggests you push through longer than your system wants you to.`,
    `Your pattern shows ${maxStreak}-day strain buildups. You don't collapse suddenly — you erode gradually. This suggests the moment you feel overwhelmed is usually the culmination, not the start, of the problem.`,
    `Stress builds slowly for you — over ${maxStreak} days on average. This means you may not realize you're overwhelmed until you're already well past your capacity. Early warning signs may be subtle.`,
    `You tend to keep going for ${maxStreak}+ days even as strain rises. This suggests you may need to trust earlier signals — the quiet discomfort, not just the moment it becomes unbearable.`,
    `The data shows gradual accumulation: strain rises steadily over ${maxStreak} days before you stop. This suggests your breaking point is when your system finally forced you to listen, not when the problem started.`,
    `You appear to be someone who keeps going well past the point where your body is asking for care. Strain builds over ${maxStreak} consecutive days before you hit a wall. That delay makes recovery harder.`,
    `Your system shows a ${maxStreak}-day buildup pattern. You don't crash suddenly — you accumulate strain gradually. By the time you feel it, you've been carrying too much for days.`,
    `You tend to push through rather than pause early. Strain builds over ${maxStreak}+ days before you acknowledge it's too much. This pattern suggests you may need to respond to earlier, quieter signals.`,
    `Stress accumulates slowly for you — over ${maxStreak} days on average. This means the moment you feel depleted is usually not the moment the problem started. It started days earlier.`,
    `Your pattern shows ${maxStreak} consecutive days of rising strain before you stop. This suggests you're wired to endure, but that endurance often costs more than you realize in the moment.`,
    `You don't crash suddenly — you build up slowly. Strain rises over ${maxStreak}+ days before peaking. This means by the time you feel overwhelmed, your system has been asking for care for a while.`,
    `The data shows you tend to carry strain for ${maxStreak} days or more before it becomes unbearable. This suggests you may need to respond to earlier signals rather than waiting for the breaking point.`,
    `You appear to accumulate stress gradually over ${maxStreak}+ days. This isn't resilience — it's delayed recognition. By the time you feel depleted, you've been running on fumes longer than you thought.`,
    `Strain builds over ${maxStreak} consecutive days on average before you acknowledge it. This suggests you push through longer than your system wants you to, and recovery takes longer as a result.`,
    `Your pattern shows ${maxStreak}-day strain buildups. You don't collapse suddenly — you erode gradually. This means the moment you feel overwhelmed is usually the culmination of days of strain.`,
    `You tend to keep going for ${maxStreak}+ days even as strain rises. This pattern suggests you may need to treat early discomfort as information, not something to push through.`,
    `The data shows gradual accumulation: strain rises steadily over ${maxStreak} days before you stop. This suggests your breaking point is not when the problem started — it's when your system forced you to listen.`,
    `Stress builds over ${maxStreak} consecutive days before you notice it's too much. This suggests you may not recognize overwhelm until you're already well past capacity.`,
    `Your system shows a ${maxStreak}-day accumulation pattern. You don't crash suddenly — you carry strain gradually, often without realizing how much you're holding.`,
    `You tend to push through for ${maxStreak}+ days even as strain rises. This suggests you may need to respond to earlier signals — the quiet discomfort, not just the breaking point.`,
    `The data shows strain building over ${maxStreak} consecutive days on average. This means by the time you feel depleted, your system has been asking for care for a while.`,
  ];
  
  const index = Math.floor(strength / 2.5) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Resilient Recoverer (40 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateResilientRecovererTrait(strength: number, bounceRate: number, avgRecoveryDays: number): string {
  const pct = Math.round(bounceRate * 100);
  
  const variations = [
    `Your system shows a strong recovery pattern. After difficult days, you bounce back ${pct}% of the time, usually within ${avgRecoveryDays.toFixed(1)} days. Even when things are hard, your baseline seems to pull you back toward steadiness.`,
    `You recover relatively quickly from low points. ${pct}% of your difficult days are followed by meaningful improvement within ${avgRecoveryDays.toFixed(1)} days. That's not luck — it's a real strength in how your system regulates.`,
    `The data shows resilience: after ${pct}% of your hardest days, you return to baseline within ${avgRecoveryDays.toFixed(1)} days. Your system doesn't stay stuck — it finds its way back, even when the path isn't obvious.`,
    `You tend to bounce back after difficulty. ${pct}% of low-stability days are followed by recovery within ${avgRecoveryDays.toFixed(1)} days. This suggests your system has a natural pull toward equilibrium, even when things feel heavy.`,
    `Your recovery rate is ${pct}%, with an average return time of ${avgRecoveryDays.toFixed(1)} days. This means even after your hardest moments, your system tends to stabilize relatively quickly. That's a real form of resilience.`,
    `After difficult days, you recover ${pct}% of the time within ${avgRecoveryDays.toFixed(1)} days. This pattern suggests your system doesn't spiral easily — it finds its way back, even when you're not sure how.`,
    `You show consistent recovery: ${pct}% of low points are followed by improvement within ${avgRecoveryDays.toFixed(1)} days. Your system seems to have a built-in pull toward steadiness, even when external circumstances haven't changed.`,
    `The data confirms you're a resilient recoverer. After ${pct}% of your hardest days, stability returns within ${avgRecoveryDays.toFixed(1)} days. That's not about forcing positivity — it's about how your nervous system naturally regulates.`,
    `You bounce back more often than you stay stuck. ${pct}% of difficult days are followed by recovery within ${avgRecoveryDays.toFixed(1)} days. This suggests your system has real elasticity, even when things feel impossible in the moment.`,
    `Your recovery pattern is strong: ${pct}% bounce-back rate within ${avgRecoveryDays.toFixed(1)} days. This means even when you feel like you're falling apart, your system is usually already working its way back toward steadiness.`,
    `After low-stability days, you recover ${pct}% of the time, usually within ${avgRecoveryDays.toFixed(1)} days. This pattern suggests your system doesn't get stuck in difficulty — it moves through it, even when the path forward isn't clear.`,
    `You show resilience in the data: ${pct}% of hard days are followed by meaningful improvement within ${avgRecoveryDays.toFixed(1)} days. Your system seems to have a natural pull back toward baseline, even without conscious effort.`,
    `The data shows you recover relatively quickly. ${pct}% of difficult days improve within ${avgRecoveryDays.toFixed(1)} days. This suggests your nervous system has real elasticity — it bends under pressure but doesn't break easily.`,
    `You tend to bounce back after difficulty. ${pct}% recovery rate within ${avgRecoveryDays.toFixed(1)} days means your system doesn't stay stuck. Even when you feel overwhelmed, your baseline is usually pulling you back toward steadiness.`,
    `Your recovery pattern is consistent: ${pct}% of low points are followed by improvement within ${avgRecoveryDays.toFixed(1)} days. This isn't about toxic positivity — it's about how your particular nervous system processes and releases difficulty.`,
    `After difficult days, you bounce back ${pct}% of the time within ${avgRecoveryDays.toFixed(1)} days. This suggests your system has a natural pull toward equilibrium, even when things feel heavy.`,
    `Your recovery rate is ${pct}%, averaging ${avgRecoveryDays.toFixed(1)} days to return to baseline. This means even after your hardest moments, your system tends to stabilize relatively quickly.`,
    `The data shows resilience: ${pct}% of your hardest days are followed by recovery within ${avgRecoveryDays.toFixed(1)} days. Your system doesn't stay stuck — it finds its way back.`,
    `You tend to bounce back after difficulty. ${pct}% of low-stability days improve within ${avgRecoveryDays.toFixed(1)} days. This suggests your system has real elasticity.`,
    `Your recovery pattern is strong: ${pct}% bounce-back rate within ${avgRecoveryDays.toFixed(1)} days. Even when you feel like you're falling apart, your system is usually already working its way back.`,
    `After difficult days, you recover ${pct}% of the time within ${avgRecoveryDays.toFixed(1)} days. This pattern suggests your system doesn't spiral easily — it finds its way back.`,
    `You show consistent recovery: ${pct}% of low points improve within ${avgRecoveryDays.toFixed(1)} days. Your system seems to have a built-in pull toward steadiness.`,
    `The data confirms resilience: after ${pct}% of your hardest days, stability returns within ${avgRecoveryDays.toFixed(1)} days. That's about how your nervous system naturally regulates.`,
    `You bounce back more often than you stay stuck. ${pct}% of difficult days are followed by recovery within ${avgRecoveryDays.toFixed(1)} days.`,
    `Your recovery pattern is strong: ${pct}% bounce-back rate within ${avgRecoveryDays.toFixed(1)} days. Your system is usually already working its way back toward steadiness.`,
    `After low-stability days, you recover ${pct}% of the time within ${avgRecoveryDays.toFixed(1)} days. Your system doesn't get stuck in difficulty — it moves through it.`,
    `You show resilience: ${pct}% of hard days are followed by improvement within ${avgRecoveryDays.toFixed(1)} days. Your system has a natural pull back toward baseline.`,
    `The data shows you recover relatively quickly. ${pct}% of difficult days improve within ${avgRecoveryDays.toFixed(1)} days. Your nervous system has real elasticity.`,
    `You tend to bounce back after difficulty. ${pct}% recovery rate within ${avgRecoveryDays.toFixed(1)} days means your system doesn't stay stuck.`,
    `Your recovery pattern is consistent: ${pct}% of low points improve within ${avgRecoveryDays.toFixed(1)} days. This is about how your nervous system processes difficulty.`,
    `After difficult days, you bounce back ${pct}% of the time within ${avgRecoveryDays.toFixed(1)} days. Your system has a natural pull toward equilibrium.`,
    `Your recovery rate is ${pct}%, averaging ${avgRecoveryDays.toFixed(1)} days. Your system tends to stabilize relatively quickly after hard moments.`,
    `The data shows resilience: ${pct}% of your hardest days are followed by recovery within ${avgRecoveryDays.toFixed(1)} days. Your system finds its way back.`,
    `You tend to bounce back after difficulty. ${pct}% of low-stability days improve within ${avgRecoveryDays.toFixed(1)} days. Your system has elasticity.`,
    `Your recovery pattern is strong: ${pct}% bounce-back rate within ${avgRecoveryDays.toFixed(1)} days. Your system is usually working its way back.`,
    `After difficult days, you recover ${pct}% of the time within ${avgRecoveryDays.toFixed(1)} days. Your system doesn't spiral easily.`,
    `You show consistent recovery: ${pct}% of low points improve within ${avgRecoveryDays.toFixed(1)} days. Your system has a pull toward steadiness.`,
    `The data confirms resilience: after ${pct}% of your hardest days, stability returns within ${avgRecoveryDays.toFixed(1)} days.`,
    `You bounce back more often than you stay stuck. ${pct}% of difficult days improve within ${avgRecoveryDays.toFixed(1)} days.`,
    `Your recovery pattern is strong: ${pct}% bounce-back rate within ${avgRecoveryDays.toFixed(1)} days. Your system works its way back toward steadiness.`,
  ];
  
  const index = Math.floor(strength / 2.5) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Recovery Style Descriptions (60 variations total - 10 per mode)
// ─────────────────────────────────────────────────────────────────────────────

export function generateRecoveryStyleDescription(
  mode: RecoveryStyle['mode'],
  avgDays: number,
  ingredients: string[],
  confidence: number
): string {
  const topIngredients = ingredients.slice(0, 3).join(', ');
  
  const modeVariations: Record<RecoveryStyle['mode'], string[]> = {
    softness: [
      `You seem to recover best through quiet, gentleness, and lower-pressure environments. After difficult days, you typically return to baseline in ${avgDays.toFixed(1)} days when you have access to ${topIngredients}. Pushing through may work short-term, but softness restores you more deeply.`,
      `Your recovery pattern centers on softness: ${avgDays.toFixed(1)}-day average return time when you prioritize ${topIngredients}. This suggests your system needs permission to rest, not just time off. Gentleness may be more restorative for you than productivity.`,
      `Quiet, low-pressure environments help you recover most reliably. When you have access to ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days on average. Your system seems to restore through softness, not through pushing.`,
      `Your data shows softness-based recovery: ${avgDays.toFixed(1)} days to baseline when ${topIngredients} are present. This suggests your system needs gentleness to reset, not just rest. Softness may be regulatory for you.`,
      `You recover through softness more than through structure. When you prioritize ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to need permission to be gentle, not just time off.`,
      `Softness and low pressure help you recover most reliably. The ${avgDays.toFixed(1)}-day return time when ${topIngredients} are present suggests your system restores through gentleness, not through pushing.`,
      `Your recovery pattern relies on softness: ${avgDays.toFixed(1)} days when you have ${topIngredients}. This suggests your system needs quiet and gentleness to reset, not just productivity breaks.`,
      `You seem to restore through softness more than through activity. When you prioritize ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Gentleness may be regulatory for you.`,
      `Quiet, gentle environments help you recover: ${avgDays.toFixed(1)}-day average when ${topIngredients} are present. Your system seems to need softness to reset, not just time away from demands.`,
      `Your data shows softness-based recovery. When you have ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. This suggests your system restores through gentleness, not through pushing.`,
    ],
    structure: [
      `You appear to stabilize through routine and structure. After difficult days, you recover in ${avgDays.toFixed(1)} days on average when you maintain ${topIngredients}. Predictability helps you reset — chaos may drain you more than difficulty itself.`,
      `Your recovery pattern relies on structure: ${avgDays.toFixed(1)}-day average return time when ${topIngredients} are present. This suggests your system steadies through consistency, not spontaneity. Routine may be regulatory for you, not restrictive.`,
      `Structure and predictability help you recover most reliably. When you maintain ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to need consistency to reset, especially after strain.`,
      `Your data shows structure-based recovery: ${avgDays.toFixed(1)} days to baseline when ${topIngredients} are maintained. This suggests your system needs predictability to reset, not just rest. Structure may be regulatory for you.`,
      `You recover through structure more than through spontaneity. When you maintain ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to need consistency to reset.`,
      `Structure and routine help you recover most reliably. The ${avgDays.toFixed(1)}-day return time when ${topIngredients} are present suggests your system restores through predictability, not through variety.`,
      `Your recovery pattern relies on structure: ${avgDays.toFixed(1)} days when you have ${topIngredients}. This suggests your system needs consistency to reset, not just time off.`,
      `You seem to restore through structure more than through flexibility. When you maintain ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Routine may be regulatory for you.`,
      `Predictable, structured environments help you recover: ${avgDays.toFixed(1)}-day average when ${topIngredients} are present. Your system seems to need consistency to reset, not just rest.`,
      `Your data shows structure-based recovery. When you maintain ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. This suggests your system restores through predictability, not through spontaneity.`,
    ],
    connection: [
      `Feeling supported and understood appears to regulate you more than solitude does. After difficult days, you recover in ${avgDays.toFixed(1)} days when ${topIngredients} are present. Connection may be closer to a need than a preference for you.`,
      `Your recovery pattern centers on connection: ${avgDays.toFixed(1)}-day average return time when you feel supported. This suggests relational attunement steadies you in ways that solitude or productivity may not. Feeling understood may be regulatory for you.`,
      `Connection helps you recover most reliably. When you have access to ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to co-regulate — feeling understood may be as foundational as rest.`,
      `Your data shows connection-based recovery: ${avgDays.toFixed(1)} days to baseline when ${topIngredients} are present. This suggests your system needs relational attunement to reset, not just solitude. Connection may be regulatory for you.`,
      `You recover through connection more than through solitude. When you have ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to co-regulate through relational attunement.`,
      `Connection and support help you recover most reliably. The ${avgDays.toFixed(1)}-day return time when ${topIngredients} are present suggests your system restores through relational attunement, not through isolation.`,
      `Your recovery pattern relies on connection: ${avgDays.toFixed(1)} days when you have ${topIngredients}. This suggests your system needs relational support to reset, not just time alone.`,
      `You seem to restore through connection more than through solitude. When you have ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Feeling understood may be regulatory for you.`,
      `Supportive, connected environments help you recover: ${avgDays.toFixed(1)}-day average when ${topIngredients} are present. Your system seems to co-regulate through relational attunement.`,
      `Your data shows connection-based recovery. When you have ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. This suggests your system restores through feeling understood, not through isolation.`,
    ],
    solitude: [
      `You seem to need solitary, quiet time to genuinely restore. After difficult days, you recover in ${avgDays.toFixed(1)} days when you prioritize ${topIngredients}. Social rest may not be the same as real rest for you.`,
      `Your recovery pattern relies on solitude: ${avgDays.toFixed(1)}-day average return time when you have space alone. This suggests your system needs to process without external input. Solitude may be regulatory for you, not isolating.`,
      `Quiet, solitary time helps you recover most reliably. When you protect ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to restore through internal processing, not external connection.`,
      `Your data shows solitude-based recovery: ${avgDays.toFixed(1)} days to baseline when ${topIngredients} are present. This suggests your system needs space alone to reset, not just quiet. Solitude may be regulatory for you.`,
      `You recover through solitude more than through connection. When you prioritize ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to need space to process internally.`,
      `Solitude and quiet help you recover most reliably. The ${avgDays.toFixed(1)}-day return time when ${topIngredients} are present suggests your system restores through internal processing, not through social support.`,
      `Your recovery pattern relies on solitude: ${avgDays.toFixed(1)} days when you have ${topIngredients}. This suggests your system needs space alone to reset, not just time away from demands.`,
      `You seem to restore through solitude more than through connection. When you prioritize ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Solitude may be regulatory for you.`,
      `Quiet, solitary environments help you recover: ${avgDays.toFixed(1)}-day average when ${topIngredients} are present. Your system seems to need space to process internally, not external support.`,
      `Your data shows solitude-based recovery. When you prioritize ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. This suggests your system restores through internal processing, not through connection.`,
    ],
    movement: [
      `Physical movement appears to be one of your most effective forms of recovery. After difficult days, you return to baseline in ${avgDays.toFixed(1)} days when ${topIngredients} are present. Your system may process emotion through the body more than through thought.`,
      `Your recovery pattern centers on movement: ${avgDays.toFixed(1)}-day average return time when you engage in ${topIngredients}. This suggests your system releases difficulty through physical activity, not just mental processing.`,
      `Movement helps you recover most reliably. When you maintain ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to regulate through the body — stillness may not restore you the way activity does.`,
      `Your data shows movement-based recovery: ${avgDays.toFixed(1)} days to baseline when ${topIngredients} are present. This suggests your system needs physical activity to reset, not just rest. Movement may be regulatory for you.`,
      `You recover through movement more than through stillness. When you engage in ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to process emotion through the body.`,
      `Movement and activity help you recover most reliably. The ${avgDays.toFixed(1)}-day return time when ${topIngredients} are present suggests your system restores through physical engagement, not through stillness.`,
      `Your recovery pattern relies on movement: ${avgDays.toFixed(1)} days when you have ${topIngredients}. This suggests your system needs physical activity to reset, not just mental rest.`,
      `You seem to restore through movement more than through stillness. When you engage in ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Movement may be regulatory for you.`,
      `Active, physical environments help you recover: ${avgDays.toFixed(1)}-day average when ${topIngredients} are present. Your system seems to process emotion through the body, not just through thought.`,
      `Your data shows movement-based recovery. When you engage in ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. This suggests your system restores through physical activity, not through stillness.`,
    ],
    mixed: [
      `Your recovery pattern draws from multiple sources — no single approach dominates. You return to baseline in ${avgDays.toFixed(1)} days on average, often through a combination of ${topIngredients}. This suggests your system needs variety, not a single formula.`,
      `You recover through a mix of approaches: ${avgDays.toFixed(1)}-day average return time when you combine ${topIngredients}. This suggests your system doesn't have one dominant recovery mode — it needs flexibility and variety.`,
      `Your recovery pattern is mixed: ${avgDays.toFixed(1)} days on average, drawing from ${topIngredients}. This suggests your system restores through multiple pathways, not a single reliable formula. Flexibility may be more important than consistency for you.`,
      `Your data shows mixed recovery: ${avgDays.toFixed(1)} days to baseline through ${topIngredients}. This suggests your system needs variety to reset, not a single approach. Flexibility may be regulatory for you.`,
      `You recover through multiple approaches rather than one dominant mode. When you combine ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Your system seems to need variety.`,
      `Mixed approaches help you recover most reliably. The ${avgDays.toFixed(1)}-day return time when ${topIngredients} are present suggests your system restores through variety, not through a single formula.`,
      `Your recovery pattern is mixed: ${avgDays.toFixed(1)} days when you have ${topIngredients}. This suggests your system needs multiple pathways to reset, not just one approach.`,
      `You seem to restore through variety more than through consistency. When you combine ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. Flexibility may be regulatory for you.`,
      `Varied, flexible approaches help you recover: ${avgDays.toFixed(1)}-day average when ${topIngredients} are present. Your system seems to need multiple pathways, not a single formula.`,
      `Your data shows mixed recovery. When you combine ${topIngredients}, you return to baseline in ${avgDays.toFixed(1)} days. This suggests your system restores through variety, not through one dominant mode.`,
    ],
  };
  
  const variations = modeVariations[mode];
  const index = Math.floor(confidence / 10) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Stress Pattern Descriptions (50 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateStressPatternDescription(
  buildupStyle: StressPattern['buildupStyle'],
  responseStyle: StressPattern['responseStyle'],
  avgBuildupDays: number,
  primaryDrains: string[]
): string {
  const drainList = primaryDrains.slice(0, 3).join(', ');
  
  const patterns = [
    // Gradual + Push-through (10 variations)
    ...(buildupStyle === 'gradual' && responseStyle === 'push-through' ? [
      `You tend to keep going well past the point where your system is asking for care. Stress builds gradually over ${avgBuildupDays.toFixed(1)} days on average, often tied to ${drainList}. By the time you feel depleted, you may already have been carrying too much for a while. Early signals may be quieter for you than the breaking point.`,
      `Your pattern shows gradual accumulation with push-through response. Strain rises over ${avgBuildupDays.toFixed(1)} days (often around ${drainList}) before you acknowledge it. This suggests you may need to trust earlier signals, not just the moment it becomes unbearable.`,
      `Stress builds slowly for you — averaging ${avgBuildupDays.toFixed(1)} days — while you continue pushing through. Common drains include ${drainList}. By the time you stop, you've often been carrying too much for longer than you realized.`,
      `You appear to accumulate strain gradually (${avgBuildupDays.toFixed(1)} days) while pushing through. Primary drains: ${drainList}. This pattern suggests you may need to respond to earlier, quieter signals rather than waiting for the breaking point.`,
      `Your system shows gradual buildup with push-through response. Strain rises over ${avgBuildupDays.toFixed(1)} days, often tied to ${drainList}. By the time you feel depleted, your system has been asking for care for a while.`,
      `Stress accumulates slowly (${avgBuildupDays.toFixed(1)} days) while you keep going. Common drains: ${drainList}. This suggests you may need to trust earlier discomfort, not just the moment it becomes unbearable.`,
      `You tend to push through as strain builds gradually over ${avgBuildupDays.toFixed(1)} days. Primary drains include ${drainList}. By the time you stop, you've often been carrying too much for longer than you thought.`,
      `Your pattern shows ${avgBuildupDays.toFixed(1)}-day gradual buildup with push-through response. Common drains: ${drainList}. This suggests you may need to respond to earlier signals rather than waiting for the breaking point.`,
      `Stress builds slowly (${avgBuildupDays.toFixed(1)} days) while you continue pushing. Often tied to ${drainList}. By the time you feel depleted, your system has been asking for care for a while.`,
      `You appear to accumulate strain gradually over ${avgBuildupDays.toFixed(1)} days while pushing through. Primary drains: ${drainList}. This pattern suggests earlier signals may be quieter for you than the breaking point.`,
    ] : []),
    
    // Sudden (10 variations)
    ...(buildupStyle === 'sudden' ? [
      `Stress tends to arrive suddenly for you rather than building gradually. When strain spikes (often around ${drainList}), it can jump quickly — averaging ${avgBuildupDays.toFixed(1)} days from baseline to peak. This may mean environmental or relational triggers have outsized impact for you. Small shifts in context may matter more than you realize.`,
      `Your pattern shows sudden strain spikes rather than gradual buildup. Averaging ${avgBuildupDays.toFixed(1)} days from baseline to peak, often tied to ${drainList}. This suggests environmental or relational triggers may have outsized impact for you.`,
      `Stress arrives suddenly for you — ${avgBuildupDays.toFixed(1)} days from baseline to peak on average. Common triggers: ${drainList}. This may mean small shifts in context matter more than you realize.`,
      `You appear to experience sudden strain spikes (${avgBuildupDays.toFixed(1)} days) rather than gradual buildup. Primary triggers: ${drainList}. This suggests environmental or relational factors may have outsized impact for you.`,
      `Your system shows sudden stress onset: ${avgBuildupDays.toFixed(1)} days from baseline to peak, often around ${drainList}. This may mean small contextual shifts have more impact than you realize.`,
      `Stress spikes suddenly for you (${avgBuildupDays.toFixed(1)} days) rather than building gradually. Common triggers: ${drainList}. This suggests environmental or relational factors may affect you more than sustained difficulty.`,
      `You tend to experience sudden strain onset — ${avgBuildupDays.toFixed(1)} days from baseline to peak. Primary triggers include ${drainList}. Small shifts in context may matter more than you realize.`,
      `Your pattern shows ${avgBuildupDays.toFixed(1)}-day sudden spikes rather than gradual buildup. Common triggers: ${drainList}. This suggests environmental or relational factors have outsized impact for you.`,
      `Stress arrives suddenly (${avgBuildupDays.toFixed(1)} days) rather than building slowly. Often tied to ${drainList}. This may mean small contextual shifts affect you more than sustained difficulty.`,
      `You appear to experience sudden strain spikes averaging ${avgBuildupDays.toFixed(1)} days. Primary triggers: ${drainList}. This pattern suggests environmental or relational factors may have more impact than you realize.`,
    ] : []),
    
    // Cyclic (10 variations)
    ...(buildupStyle === 'cyclic' ? [
      `Your stress pattern appears cyclic rather than linear. Strain builds and releases in waves, averaging ${avgBuildupDays.toFixed(1)} days per cycle. Common triggers include ${drainList}. This suggests your system may be responding to rhythms — internal, relational, or environmental — that aren't always obvious in the moment.`,
      `Your pattern shows cyclic strain: ${avgBuildupDays.toFixed(1)}-day waves of buildup and release. Common triggers: ${drainList}. This suggests your system may be responding to rhythms that aren't always obvious in the moment.`,
      `Stress builds and releases in cycles for you — ${avgBuildupDays.toFixed(1)} days per wave on average. Often tied to ${drainList}. This may mean internal, relational, or environmental rhythms are affecting you.`,
      `You appear to experience cyclic strain patterns (${avgBuildupDays.toFixed(1)} days per cycle). Primary triggers: ${drainList}. This suggests your system may be responding to rhythms that aren't always obvious.`,
      `Your system shows cyclic stress: ${avgBuildupDays.toFixed(1)}-day waves, often around ${drainList}. This may mean internal or environmental rhythms are affecting you more than you realize.`,
      `Stress builds and releases in cycles (${avgBuildupDays.toFixed(1)} days) rather than linearly. Common triggers: ${drainList}. This suggests your system may be responding to rhythms that aren't always obvious in the moment.`,
      `You tend to experience cyclic strain — ${avgBuildupDays.toFixed(1)}-day waves of buildup and release. Primary triggers include ${drainList}. This may mean rhythms are affecting you more than you realize.`,
      `Your pattern shows ${avgBuildupDays.toFixed(1)}-day cyclic strain rather than linear buildup. Common triggers: ${drainList}. This suggests your system responds to rhythms that aren't always obvious.`,
      `Stress builds and releases in waves (${avgBuildupDays.toFixed(1)} days) rather than linearly. Often tied to ${drainList}. This may mean internal or environmental rhythms are affecting you.`,
      `You appear to experience cyclic strain patterns averaging ${avgBuildupDays.toFixed(1)} days. Primary triggers: ${drainList}. This suggests your system responds to rhythms that aren't always obvious in the moment.`,
    ] : []),
    
    // Withdraw response (10 variations)
    ...(responseStyle === 'withdraw' ? [
      `When strain builds (averaging ${avgBuildupDays.toFixed(1)} days), you tend to withdraw rather than push through. This isn't avoidance — it may be your system's way of protecting capacity. Common drains include ${drainList}. Withdrawal may be regulatory for you, not a failure of resilience.`,
      `Your pattern shows withdrawal response to strain buildup (${avgBuildupDays.toFixed(1)} days). Common drains: ${drainList}. This isn't avoidance — it may be your system's way of protecting capacity.`,
      `When stress builds (${avgBuildupDays.toFixed(1)} days), you tend to withdraw. Often tied to ${drainList}. This may be your system's way of protecting capacity, not a failure of resilience.`,
      `You appear to withdraw when strain builds (${avgBuildupDays.toFixed(1)} days). Primary drains: ${drainList}. This isn't avoidance — it may be regulatory for your system.`,
      `Your system shows withdrawal response: ${avgBuildupDays.toFixed(1)}-day buildup, often around ${drainList}. This may be your system's way of protecting capacity, not a failure of resilience.`,
      `When stress builds (${avgBuildupDays.toFixed(1)} days), you tend to withdraw rather than push through. Common drains: ${drainList}. Withdrawal may be regulatory for you.`,
      `You tend to withdraw when strain builds — ${avgBuildupDays.toFixed(1)} days on average. Primary drains include ${drainList}. This may be your system's way of protecting capacity.`,
      `Your pattern shows ${avgBuildupDays.toFixed(1)}-day buildup with withdrawal response. Common drains: ${drainList}. This isn't avoidance — it may be regulatory for your system.`,
      `When stress builds (${avgBuildupDays.toFixed(1)} days), you withdraw. Often tied to ${drainList}. This may be your system's way of protecting capacity, not a failure of resilience.`,
      `You appear to withdraw when strain builds averaging ${avgBuildupDays.toFixed(1)} days. Primary drains: ${drainList}. Withdrawal may be regulatory for you, not avoidance.`,
    ] : []),
    
    // Default/Mixed (10 variations)
    `Your stress pattern shows ${buildupStyle} buildup over ${avgBuildupDays.toFixed(1)} days on average, with a ${responseStyle} response style. Primary drains include ${drainList}. This pattern suggests your system has a specific way of processing strain — understanding it may help you respond earlier.`,
    `Strain builds ${buildupStyle}ly (${avgBuildupDays.toFixed(1)} days) with ${responseStyle} response. Common drains: ${drainList}. Understanding this pattern may help you respond to earlier signals.`,
    `Your pattern shows ${buildupStyle} buildup (${avgBuildupDays.toFixed(1)} days) and ${responseStyle} response. Primary drains: ${drainList}. This suggests your system processes strain in a specific way.`,
    `Stress builds ${buildupStyle}ly over ${avgBuildupDays.toFixed(1)} days with ${responseStyle} response style. Often tied to ${drainList}. Understanding this pattern may help you respond earlier.`,
    `Your system shows ${buildupStyle} strain buildup (${avgBuildupDays.toFixed(1)} days) with ${responseStyle} response. Common drains: ${drainList}. This pattern suggests a specific way of processing strain.`,
    `Strain accumulates ${buildupStyle}ly (${avgBuildupDays.toFixed(1)} days) with ${responseStyle} response. Primary drains: ${drainList}. Understanding this may help you respond to earlier signals.`,
    `Your pattern shows ${avgBuildupDays.toFixed(1)}-day ${buildupStyle} buildup with ${responseStyle} response. Common drains: ${drainList}. This suggests your system processes strain in a specific way.`,
    `Stress builds ${buildupStyle}ly over ${avgBuildupDays.toFixed(1)} days, ${responseStyle} response style. Often tied to ${drainList}. Understanding this pattern may help you respond earlier.`,
    `Your system shows ${buildupStyle} buildup (${avgBuildupDays.toFixed(1)} days) and ${responseStyle} response. Primary drains: ${drainList}. This pattern suggests a specific way of processing strain.`,
    `Strain builds ${buildupStyle}ly (${avgBuildupDays.toFixed(1)} days) with ${responseStyle} response. Common drains: ${drainList}. Understanding this may help you respond to earlier signals.`,
  ];
  
  const validPatterns = patterns.filter(p => p); // Remove any undefined entries
  const index = Math.floor(avgBuildupDays * 7) % validPatterns.length;
  return validPatterns[index] || validPatterns[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal Strengths (50 variations total - 10 per strength type)
// ─────────────────────────────────────────────────────────────────────────────

export function generateStrengthDescription(id: string, strength: number, context?: any): string {
  const strengthDescriptions: Record<string, string[]> = {
    'consistent-presence': [
      `Your data shows that you keep returning, even through lower stretches. That matters because harder moments are becoming visible instead of disappearing.`,
      `You do not only track the easy days. You come back during difficult stretches too, which means the archive can see your real emotional pattern instead of just the polished version.`,
      `A clear pattern in your data is that you keep leaving signals, even when your baseline drops. That kind of consistency turns hard weeks into something understandable instead of invisible.`,
      `You maintain contact with yourself even during difficult periods. That consistency gives the archive something real to work with.`,
      `Your archive shows a repeated willingness to come back, even when the week is heavier. That is not small. It is how hard moments stop going untracked.`,
      `You keep returning with real signals instead of waiting until everything is sorted out. That pattern creates clarity over time.`,
      `Your consistency is not just about discipline. It means your lower-capacity moments are becoming visible enough to understand.`,
      `You show up across different kinds of days, not just the easier ones. That makes the picture MySky sees more honest and more useful.`,
      `The pattern here is not perfect consistency for its own sake. It is your willingness to leave a trace even when the week feels harder to hold.`,
      `You keep the archive in contact with your real life, including the harder stretches. That kind of presence compounds over time.`,
    ],
    'emotional-honesty': [
      `Your reflections suggest emotional honesty is one of your strengths. You don't flatten your experience to look good — you track what's real, even when it's uncomfortable.`,
      `You track what's actually happening, not what you wish were happening. That kind of honesty with yourself is rarer than you might think.`,
      `Your reflections show real emotional honesty. You don't perform wellness — you track the truth. That's a foundation for genuine self-knowledge.`,
      `You maintain emotional honesty in your reflections. You don't flatten your experience — you track what's real.`,
      `Your ability to track what's actually happening, not what you wish were happening, is a real strength. That honesty is rarer than you might think.`,
      `You show emotional honesty in your reflections. You don't perform wellness — you track the truth.`,
      `Your reflections demonstrate real emotional honesty. You track what's actually happening, even when it's uncomfortable.`,
      `You maintain honesty with yourself. You don't flatten your experience to look good — you track what's real.`,
      `Your emotional honesty is a real strength. You track the truth, not the performance of wellness.`,
      `You show up honestly in your reflections. You don't flatten your experience — you track what's actually happening.`,
    ],
    'resilience': [
      `You recover relatively quickly after difficult days. Even when things feel impossible, your system tends to find its way back toward steadiness.`,
      `Your system shows real elasticity. After hard days, you tend to bounce back without forcing it. That's resilience — not toxic positivity.`,
      `You don't stay stuck easily. After difficulty, your system tends to return to baseline relatively quickly. That's a real strength, even when it doesn't feel dramatic.`,
      `You recover relatively quickly after difficult days. Your system tends to find its way back toward steadiness.`,
      `Your system shows elasticity. After hard days, you bounce back without forcing it. That's real resilience.`,
      `You don't stay stuck easily. After difficulty, your system returns to baseline relatively quickly.`,
      `Your ability to recover after difficult days is a real strength. Your system finds its way back toward steadiness.`,
      `You show resilience in how you recover. After hard days, your system bounces back without forcing it.`,
      `You don't stay stuck. After difficulty, your system returns to baseline relatively quickly. That's a real strength.`,
      `Your system shows real elasticity. You recover relatively quickly after difficult days.`,
    ],
    'inner-perceptiveness': [
      `You seem highly perceptive about your inner world. Your reflections carry more nuance than surface-level tracking — you notice subtleties most people miss.`,
      `Your reflections show real inner perceptiveness. You don't just track mood — you track texture, context, and nuance. That level of awareness is its own form of intelligence.`,
      `You notice things about your inner world that most people overlook. That perceptiveness is a strength, even when it makes things feel more complex.`,
      `You show high perceptiveness about your inner world. Your reflections carry nuance that most people miss.`,
      `Your inner perceptiveness is a real strength. You track texture, context, and nuance — not just surface mood.`,
      `You notice subtleties about your inner world that most people overlook. That perceptiveness is a form of intelligence.`,
      `Your reflections demonstrate real inner perceptiveness. You track nuance, not just surface-level mood.`,
      `You show perceptiveness about your inner world. You notice subtleties that most people miss.`,
      `Your inner perceptiveness is a strength. You track texture and context, not just mood.`,
      `You notice things about your inner world that most people overlook. That perceptiveness is real intelligence.`,
    ],
    'connection-maintenance': [
      `Even when overwhelmed, you remain responsive to connection. That relational awareness is a real strength — you don't disappear when things get hard.`,
      `You stay relationally present even during difficult stretches. That kind of connection maintenance is harder than it looks, and it matters.`,
      `You don't withdraw completely when things are hard. You maintain connection even when it would be easier to disappear. That's a real strength.`,
      `You remain responsive to connection even when overwhelmed. That relational awareness is a real strength.`,
      `You stay relationally present during difficult stretches. That connection maintenance is harder than it looks.`,
      `You don't withdraw completely when things are hard. You maintain connection even when it would be easier to disappear.`,
      `Your ability to remain responsive to connection, even when overwhelmed, is a real strength.`,
      `You stay relationally present even during difficult periods. That kind of connection maintenance matters.`,
      `You don't disappear when things get hard. You maintain connection even when it would be easier to withdraw.`,
      `You remain responsive to connection even when overwhelmed. That relational awareness is a real strength.`,
    ],
  };
  
  const variations = strengthDescriptions[id] || [`Strength detected: ${id}`];
  const index = Math.floor(strength / 10) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Anticipations (Forward-looking signals with more specificity) (40 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateAnticipationBody(id: string, context: any): string {
  const anticipationVariations: Record<string, string[]> = {
    'strain-building': [
      `Your strain has been building over the last ${context.days} days. That doesn't mean anything is wrong with you, but it may be a sign that your system is carrying more than usual. Protecting a little extra space right now could help you stay steadier.`,
      `Strain has risen steadily over ${context.days} consecutive days. Your system may be approaching capacity, even if you don't feel it yet. Small acts of care now may prevent a larger crash later.`,
      `The data shows ${context.days} days of rising strain. This isn't a crisis, but it is a signal. Your system may be asking for care before it forces you to stop.`,
      `Strain has been building for ${context.days} days. Your system may be carrying more than usual. Protecting space now could help you stay steadier.`,
      `The data shows ${context.days} consecutive days of rising strain. Your system may be approaching capacity. Small acts of care now may prevent a larger crash.`,
      `Strain has risen over ${context.days} days. This isn't a crisis, but it is a signal. Your system may be asking for care.`,
      `Your strain has been building for ${context.days} days. Your system may be carrying more than usual. Protecting space could help.`,
      `The data shows ${context.days} days of rising strain. Your system may be approaching capacity, even if you don't feel it yet.`,
      `Strain has been building over ${context.days} consecutive days. Your system may be asking for care before it forces you to stop.`,
      `Your strain has risen for ${context.days} days. Your system may be carrying more than usual. Small acts of care now may matter.`,
    ],
    'sleep-risk': [
      `Sleep has been lower quality lately (averaging ${context.avgSleep.toFixed(1)}/5). Because your system seems fairly sleep-sensitive, this could start showing up in your steadiness soon. It may help to treat rest as support rather than something you have to earn.`,
      `Sleep quality has dropped to ${context.avgSleep.toFixed(1)}/5 over the last few days. Given your sleep sensitivity, this may start affecting your stability soon if it continues. Rest may need to be a priority, not a reward.`,
      `Your sleep has been compromised (${context.avgSleep.toFixed(1)}/5 average). For someone with your sleep sensitivity, this often shows up emotionally within a few days. Protecting rest now may prevent a harder crash later.`,
      `Sleep has been lower quality (${context.avgSleep.toFixed(1)}/5). Given your sleep sensitivity, this could start affecting your steadiness soon. Treating rest as support may help.`,
      `Sleep quality has dropped to ${context.avgSleep.toFixed(1)}/5. For someone with your sensitivity, this may start showing up in your stability soon.`,
      `Your sleep has been compromised (${context.avgSleep.toFixed(1)}/5). This often shows up emotionally within a few days for someone with your sensitivity.`,
      `Sleep has been lower quality lately (${context.avgSleep.toFixed(1)}/5). This could start affecting your steadiness soon given your sleep sensitivity.`,
      `Sleep quality has dropped to ${context.avgSleep.toFixed(1)}/5. This may start showing up in your stability soon if it continues.`,
      `Your sleep has been compromised (${context.avgSleep.toFixed(1)}/5). Protecting rest now may prevent a harder crash later.`,
      `Sleep has been lower quality (${context.avgSleep.toFixed(1)}/5). This could start affecting your steadiness soon. Rest may need to be a priority.`,
    ],
    'restoration-deficit': [
      `You've had less restoration than usual while strain is still running high. That combination often leaves people feeling depleted after a few days. A small act of replenishment now may matter more than pushing through.`,
      `Restoration has been ${context.deficit.toFixed(1)} points below your baseline while strain remains elevated. That gap usually catches up with you within a few days. Small acts of care now may prevent a larger depletion later.`,
      `Your restoration has been lower than usual while strain stays high. That combination doesn't resolve itself — it compounds. Protecting space for replenishment now may be more important than productivity.`,
      `Restoration has been below baseline while strain remains high. That combination often leads to depletion. Small acts of care now may matter.`,
      `Your restoration has been ${context.deficit.toFixed(1)} points below baseline while strain stays elevated. That gap usually catches up with you.`,
      `Restoration has been lower than usual while strain remains high. That combination doesn't resolve itself — it compounds.`,
      `You've had less restoration while strain stays high. That combination often leaves people feeling depleted after a few days.`,
      `Restoration has been below baseline (${context.deficit.toFixed(1)} points) while strain remains elevated. Small acts of care now may prevent larger depletion.`,
      `Your restoration has been lower while strain stays high. Protecting space for replenishment may be more important than productivity.`,
      `Restoration has been below baseline while strain remains high. That combination often catches up with you within a few days.`,
    ],
    'intensity-rising': [
      `Emotional intensity has been higher than usual while stability looks a little lower. If things have felt crowded inside, the data supports that. This may be a good time to soften expectations and give yourself a little more room.`,
      `Intensity has been running ${context.delta.toFixed(1)} points above baseline while stability has dropped. If things feel harder to hold right now, that's not in your head — it's in the data. Softening demands may help more than pushing through.`,
      `Your emotional intensity has been elevated while stability has softened. That combination often means things feel harder to contain. This may be a moment to protect space rather than add more to your plate.`,
      `Emotional intensity has been higher while stability looks lower. If things have felt crowded inside, the data supports that.`,
      `Intensity has been ${context.delta.toFixed(1)} points above baseline while stability has dropped. If things feel harder to hold, that's in the data.`,
      `Your emotional intensity has been elevated while stability has softened. That combination often means things feel harder to contain.`,
      `Emotional intensity has been higher than usual while stability looks lower. This may be a good time to soften expectations.`,
      `Intensity has been running above baseline while stability has dropped. Softening demands may help more than pushing through.`,
      `Your emotional intensity has been elevated while stability has softened. This may be a moment to protect space.`,
      `Emotional intensity has been higher while stability looks lower. If things have felt crowded, the data supports that.`,
    ],
  };
  
  const variations = anticipationVariations[id] || [`Anticipation: ${id}`];
  const index = Math.floor((context.confidence || 50) / 10) % variations.length;
  return variations[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Markers (Humane progress with data specificity) (50 variations)
// ─────────────────────────────────────────────────────────────────────────────

export function generateProgressMarkerDescription(id: string, context: any): string {
  const progressVariations: Record<string, string[]> = {
    'faster-recovery': [
      `You appear to be recovering faster from difficult days. Earlier, it took about ${context.earlyDays} days; more recently, closer to ${context.lateDays}. That's real progress, even if it doesn't feel dramatic.`,
      `Your recovery time has shortened from ${context.earlyDays} days to ${context.lateDays} days. That suggests your system is learning to regulate more efficiently. It's a quiet form of progress, but it's real.`,
      `You're bouncing back faster than you used to. Recovery time has dropped from ${context.earlyDays} to ${context.lateDays} days on average. That's not luck — it's your system getting better at returning to baseline.`,
      `Recovery time has shortened from ${context.earlyDays} to ${context.lateDays} days. That's real progress, even if it doesn't feel dramatic.`,
      `Your recovery time has dropped from ${context.earlyDays} days to ${context.lateDays} days. Your system is learning to regulate more efficiently.`,
      `You're bouncing back faster. Recovery time has shortened from ${context.earlyDays} to ${context.lateDays} days on average.`,
      `Recovery time has dropped from ${context.earlyDays} to ${context.lateDays} days. That's your system getting better at returning to baseline.`,
      `Your recovery time has shortened from ${context.earlyDays} days to ${context.lateDays} days. That's real progress.`,
      `You're recovering faster than you used to. Recovery time has dropped from ${context.earlyDays} to ${context.lateDays} days.`,
      `Recovery time has shortened from ${context.earlyDays} to ${context.lateDays} days. Your system is learning to regulate more efficiently.`,
    ],
    'fewer-swings': [
      `Your emotional swings have narrowed over time. The extreme highs and lows appear less frequently now — from ${Math.round(context.earlyRate * 100)}% of days to ${Math.round(context.lateRate * 100)}%. That's stabilization, even if it doesn't feel like a breakthrough.`,
      `Extreme emotional swings have decreased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. Your range is narrowing, which usually means your system is finding more steadiness.`,
      `You're experiencing fewer extreme swings. Earlier, ${Math.round(context.earlyRate * 100)}% of days were volatile; recently, only ${Math.round(context.lateRate * 100)}%. That's real stabilization, even if the baseline hasn't shifted dramatically.`,
      `Emotional swings have narrowed from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's stabilization.`,
      `Extreme swings have decreased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. Your range is narrowing.`,
      `You're experiencing fewer extreme swings. From ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's real stabilization.`,
      `Emotional swings have narrowed from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. Your system is finding more steadiness.`,
      `Extreme swings have decreased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's stabilization.`,
      `You're experiencing fewer extreme swings. Your range has narrowed from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days.`,
      `Emotional swings have narrowed from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's real stabilization.`,
    ],
    'more-reflective': [
      `You've been reflecting more frequently over time — from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That alone is a form of progress. Showing up to know yourself better matters.`,
      `Your reflection rate has increased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That suggests you're building a practice of self-awareness, not just tracking when things are easy.`,
      `You're journaling more consistently now (${Math.round(context.lateRate * 100)}% of days vs ${Math.round(context.earlyRate * 100)}% earlier). That kind of sustained attention to your inner world is its own form of progress.`,
      `Reflection rate has increased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's progress.`,
      `Your reflection rate has increased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. You're building a practice of self-awareness.`,
      `You're journaling more consistently (${Math.round(context.lateRate * 100)}% vs ${Math.round(context.earlyRate * 100)}% of days). That's its own form of progress.`,
      `Reflection rate has increased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. Showing up to know yourself better matters.`,
      `Your reflection rate has increased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's real progress.`,
      `You're journaling more consistently now (${Math.round(context.lateRate * 100)}% vs ${Math.round(context.earlyRate * 100)}% of days). That sustained attention matters.`,
      `Reflection rate has increased from ${Math.round(context.earlyRate * 100)}% to ${Math.round(context.lateRate * 100)}% of days. That's a form of progress.`,
    ],
    'earlier-noticing': [
      `On harder days, you seem to be checking in earlier than you used to — around ${context.lateHour}:00 now vs ${context.earlyHour}:00 before. That suggests you're noticing your needs sooner, which gives you more choice in how you respond.`,
      `You're checking in earlier on difficult days (${context.lateHour}:00 vs ${context.earlyHour}:00 previously). That suggests you're catching strain signals sooner, before they become overwhelming. That's real progress.`,
      `Your check-in timing has shifted earlier on hard days — from ${context.earlyHour}:00 to ${context.lateHour}:00. That suggests you're noticing difficulty sooner, which usually means you can respond before it compounds.`,
      `Check-in timing has shifted earlier on hard days — ${context.lateHour}:00 vs ${context.earlyHour}:00. You're noticing your needs sooner.`,
      `You're checking in earlier on difficult days (${context.lateHour}:00 vs ${context.earlyHour}:00). You're catching strain signals sooner.`,
      `Check-in timing has shifted from ${context.earlyHour}:00 to ${context.lateHour}:00 on hard days. You're noticing difficulty sooner.`,
      `You're checking in earlier on difficult days — ${context.lateHour}:00 vs ${context.earlyHour}:00. That's real progress.`,
      `Check-in timing has shifted earlier (${context.lateHour}:00 vs ${context.earlyHour}:00). You're noticing your needs sooner.`,
      `You're checking in earlier on hard days — from ${context.earlyHour}:00 to ${context.lateHour}:00. You're catching strain signals sooner.`,
      `Check-in timing has shifted earlier on difficult days. ${context.lateHour}:00 vs ${context.earlyHour}:00. You're noticing difficulty sooner.`,
    ],
    'protecting-energy': [
      `When strain is high, you've been engaging in more restoration recently — ${context.lateAvg.toFixed(1)} vs ${context.earlyAvg.toFixed(1)} earlier. You may be learning to protect your energy earlier, before depletion forces you to stop.`,
      `Your restoration during high-strain periods has increased from ${context.earlyAvg.toFixed(1)} to ${context.lateAvg.toFixed(1)}. That suggests you're learning to care for yourself proactively, not just reactively.`,
      `You're protecting energy more consistently during difficult stretches (${context.lateAvg.toFixed(1)} restoration vs ${context.earlyAvg.toFixed(1)} earlier). That's a real shift — responding to strain before it becomes crisis.`,
      `Restoration during high-strain periods has increased from ${context.earlyAvg.toFixed(1)} to ${context.lateAvg.toFixed(1)}. You're protecting your energy earlier.`,
      `Your restoration during strain has increased from ${context.earlyAvg.toFixed(1)} to ${context.lateAvg.toFixed(1)}. You're learning to care for yourself proactively.`,
      `You're protecting energy more consistently (${context.lateAvg.toFixed(1)} vs ${context.earlyAvg.toFixed(1)} restoration). That's a real shift.`,
      `Restoration during high-strain periods has increased from ${context.earlyAvg.toFixed(1)} to ${context.lateAvg.toFixed(1)}. You're responding to strain earlier.`,
      `Your restoration during strain has increased from ${context.earlyAvg.toFixed(1)} to ${context.lateAvg.toFixed(1)}. You're protecting your energy earlier.`,
      `You're protecting energy more consistently during difficult stretches (${context.lateAvg.toFixed(1)} vs ${context.earlyAvg.toFixed(1)}). That's real progress.`,
      `Restoration during high-strain periods has increased from ${context.earlyAvg.toFixed(1)} to ${context.lateAvg.toFixed(1)}. You're learning to care for yourself proactively.`,
    ],
  };
  
  const variations = progressVariations[id] || [`Progress: ${id}`];
  const index = Math.floor((context.strength || 50) / 10) % variations.length;
  return variations[index];
}
