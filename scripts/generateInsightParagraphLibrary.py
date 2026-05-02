#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Callable


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "services" / "insights" / "generatedInsightParagraphs.ts"

BLOCKED_PHRASES = [
    "This is clear enough to track now",
    "The pattern is clear now",
    "This does not read as",
    "It reads as",
    "Seen across",
    "Detected in",
    "Based on",
    "The user",
    "It tends to get loud",
    "The meaning is",
    "The clearer read is",
    "The pattern around",
    "The practical shape matters",
    "pattern indicates",
    "reflects a need",
    "emotional safety",
    "nervous system seeking",
    "regulation",
    "capacity strain",
    "signalTypes",
    "detected",
    "evidence",
    "user-facing",
    "attachment theory",
    "social baseline theory",
    "repair/rupture theory",
    "repair rupture theory",
    "connection safety",
    "proximity seeking",
    "attachment activation",
    "attachment deactivation",
    "attachment activation/deactivation",
    "autonomy support",
    "self efficacy",
    "self-efficacy",
    "mastery orientation",
    "belongingness theory",
    "sociometer theory",
    "threat detection",
    "predictive processing",
    "operant conditioning",
    "behavioral economics",
    "shame theory",
    "self discrepancy theory",
    "self-discrepancy theory",
    "self criticism research",
    "self-criticism research",
    "psychodynamic superego",
    "defense mechanisms",
    "adaptive defense",
    "mentalization",
    "emotion regulation",
    "affect tolerance",
    "cognitive behavioral theory",
    "cognitive-behavioral theory",
    "executive function",
    "activation energy",
    "time perception",
    "scarcity cognition",
    "social learning theory",
    "role modeling",
    "learned helplessness",
    "family systems theory",
    "schema theory",
    "moral psychology",
    "equity theory",
    "values theory",
    "self concordance",
    "self-concordance",
    "identity development",
    "self concept",
    "self-concept",
    "psychosocial development",
    "transition theory",
    "self actualization",
    "self-actualization",
    "growth mindset",
    "humanistic psychology",
    "basic needs",
    "client centered therapy",
    "client-centered therapy",
    "unconditional positive regard",
    "conditions of worth",
    "self worth theory",
    "self-worth theory",
    "big five personality",
    "trait psychology",
    "temperament research",
    "arousal theory",
    "openness to experience",
    "imagination research",
    "conscientiousness",
    "goal systems theory",
    "agreeableness",
    "differential susceptibility",
    "cognitive style",
    "information processing",
    "strengths psychology",
    "multiple intelligences",
    "temperament theory",
    "behavioral activation",
    "behavioral inhibition",
    "behavioral activation/inhibition",
    "core belief model",
    "developmental learning",
    "social identity theory",
    "belonging research",
    "empowerment theory",
    "voice behavior",
    "boundary theory",
    "exchange theory",
    "reciprocity norms",
    "reward systems",
    "recovery theory",
    "allostatic load",
    "creative process",
    "expressive therapies",
    "existential psychology",
    "hope theory",
    "big five",
    "psychoanalysis",
    "psychoanalytic",
    "self-determination theory",
    "cognitive appraisal",
    "family systems",
    "social exchange theory",
    "schema therapy",
    "trait neuroticism",
    "interoception",
    "somatic psychology",
]

BLOCKED_REGEXES = [
    re.compile(r"\bInside [a-zA-Z\- ]+, there is\b", re.I),
]

WRITER_SHAPES = [
    "punch",
    "tender",
    "body",
    "patternAnalysis",
    "practicalCapacity",
    "poetic",
    "questionLed",
    "contrast",
    "threshold",
]

FLOW_NAMES = [
    "directNaming",
    "livedMomentFirst",
    "bodyFirst",
    "questionFlow",
    "contrastFlow",
    "thresholdFlow",
    "poeticGrounding",
    "unfinishedEnding",
    "livedProtectionCost",
    "goldStandard",
    "microMoment",
]

SHAPE_TONES = {
    "punch": "direct",
    "tender": "tender",
    "body": "grounded",
    "patternAnalysis": "direct",
    "practicalCapacity": "practical",
    "poetic": "poetic",
    "questionLed": "reflective",
    "contrast": "direct",
    "threshold": "grounded",
}

SHAPE_INTENSITIES = {
    "punch": "medium",
    "tender": "low",
    "body": "medium",
    "patternAnalysis": "medium",
    "practicalCapacity": "low",
    "poetic": "medium",
    "questionLed": "low",
    "contrast": "medium",
    "threshold": "medium",
}


@dataclass(frozen=True)
class CategoryBank:
    category: str
    theme: str
    pattern: str
    moment: str
    meaning: str
    need: str
    reframe: str
    landing: str
    body_cue: str
    metaphor: str
    tags: list[str]
    signal_types: list[str]
    anchors: list[str]
    anchor_phrases: list[str]
    vocabulary: list[str]


CATEGORY_ALIASES = {
    "timeScarcity": "timeRhythms",
    "dreams": "dreamsSymbols",
}

EXCLUDED_PARAGRAPH_CATEGORIES = {"dreamsSymbols"}


PATTERN_TYPES = [
    "highTracking",
    "lowAccess",
    "pushPull",
    "delayedActivation",
]

PARAGRAPHS_PER_TAXONOMY_PATTERN = 3


def make_subcategory_guidance(
    covers: str,
    entries: dict[str, tuple[str, str, str, str]],
) -> dict[str, dict[str, object]]:
    return {
        subcategory: {
            "covers": covers,
            "patternTypes": {
                "highTracking": values[0],
                "lowAccess": values[1],
                "pushPull": values[2],
                "delayedActivation": values[3],
            },
        }
        for subcategory, values in entries.items()
    }


ATTACHMENT_CONNECTION_SUBCATEGORY_GUIDANCE: dict[str, dict[str, object]] = {
    "toneShiftSensitivity": {
        "covers": "Noticing changes in tone, pauses, reply timing, facial expression, or emotional energy.",
        "patternTypes": {
            "highTracking": "When someone’s tone shifts, you notice immediately and start looking for what changed.",
            "lowAccess": "When someone’s tone shifts, you distance from it or tell yourself it does not matter.",
            "pushPull": "You notice the shift and want repair, but the closeness of addressing it feels like too much.",
            "delayedActivation": "You seem fine in the moment, then replay the tone shift later when things are quiet.",
        },
    },
    "repairSeeking": {
        "covers": "Needing closure, reassurance, repair, or a bridge back after tension.",
        "patternTypes": {
            "highTracking": "You look for repair quickly, sometimes before the other person even realizes something shifted.",
            "lowAccess": "You avoid repair conversations because getting into it feels heavier than letting it pass.",
            "pushPull": "You want repair badly, but you also dread the vulnerability it requires.",
            "delayedActivation": "You say it is okay first, then realize later that something still feels unfinished.",
        },
    },
    "closenessFear": {
        "covers": "Wanting connection but feeling exposed when someone gets emotionally close.",
        "patternTypes": {
            "highTracking": "You monitor closeness carefully, watching for the moment it starts to feel unsafe.",
            "lowAccess": "You keep connection surface-level so closeness does not ask too much from you.",
            "pushPull": "You want to be close, then pull back once being seen starts to feel real.",
            "delayedActivation": "You enjoy closeness in the moment, then feel exposed or uneasy afterward.",
        },
    },
    "abandonmentAlarm": {
        "covers": "Fear of being left, replaced, forgotten, ignored, or emotionally dropped.",
        "patternTypes": {
            "highTracking": "You notice distance early and start trying to prevent the connection from slipping.",
            "lowAccess": "You detach before the possibility of being left can fully reach you.",
            "pushPull": "You want reassurance, but needing it makes you feel too exposed.",
            "delayedActivation": "You act like the distance did not matter, then feel the ache of it later.",
        },
    },
    "trustTesting": {
        "covers": "Watching whether care is consistent, safe, reliable, and real.",
        "patternTypes": {
            "highTracking": "You track small signs of consistency to figure out whether trust is safe.",
            "lowAccess": "You avoid depending on consistency because needing it feels risky.",
            "pushPull": "You want to trust the care, but part of you keeps checking for the catch.",
            "delayedActivation": "You accept care in the moment, then question later whether it was real or lasting.",
        },
    },
    "emotionalAvailability": {
        "covers": "Noticing whether someone is present, responsive, attuned, distracted, or emotionally reachable.",
        "patternTypes": {
            "highTracking": "You notice quickly when someone feels less emotionally available.",
            "lowAccess": "You stop reaching when someone feels unavailable instead of trying to name it.",
            "pushPull": "You want more presence, but asking for it feels too needy or exposed.",
            "delayedActivation": "You do not register the absence fully until later, when the loneliness catches up.",
        },
    },
    "conflictConnectionThreat": {
        "covers": "Conflict feeling like danger to the bond, not just disagreement.",
        "patternTypes": {
            "highTracking": "During conflict, you track whether the relationship still feels intact.",
            "lowAccess": "During conflict, you shut down, go quiet, or minimize so the moment does not escalate.",
            "pushPull": "You want to resolve it, but the conflict makes you want to retreat at the same time.",
            "delayedActivation": "You stay composed during conflict, then feel the rupture later.",
        },
    },
    "connectionWorth": {
        "covers": "Feeling chosen, wanted, prioritized, remembered, included, or easy to love.",
        "patternTypes": {
            "highTracking": "You look for signs that you still matter in the connection.",
            "lowAccess": "You act like being chosen does not matter so you do not have to feel the risk of wanting it.",
            "pushPull": "You want to feel chosen, but needing that reassurance feels uncomfortable.",
            "delayedActivation": "You dismiss the need in the moment, then later realize you wanted to feel more considered.",
        },
    },
}


AUTONOMY_SELF_DETERMINATION_SUBCATEGORY_GUIDANCE: dict[str, dict[str, object]] = {
    "pressureDetection": {
        "covers": "Pressure, control, choice, resistance, loss of agency, and needing room to decide.",
        "patternTypes": {
            "highTracking": "You feel the moment a request starts turning into pressure.",
            "lowAccess": "You disengage when something feels like it is no longer your choice.",
            "pushPull": "You want to help, but pressure makes you pull back.",
            "delayedActivation": "You agree in the moment, then feel the pressure later.",
        },
    },
    "lossOfChoice": {
        "covers": "Moments where options feel limited, pre-decided, narrowed, or no longer yours.",
        "patternTypes": {
            "highTracking": "You notice when options feel limited or pre-decided.",
            "lowAccess": "You stop engaging when it feels like your choice does not matter.",
            "pushPull": "You want direction, but resist feeling controlled.",
            "delayedActivation": "You accept it at first, then realize you had no real choice.",
        },
    },
    "resistanceResponse": {
        "covers": "Resistance that appears before language, motivation, or clear explanation arrives.",
        "patternTypes": {
            "highTracking": "You feel resistance early, even if you cannot explain it yet.",
            "lowAccess": "You avoid the task instead of naming the resistance.",
            "pushPull": "You start, then pull away once resistance builds.",
            "delayedActivation": "You follow through, then feel resentment afterward.",
        },
    },
    "internalVsExternalMotivation": {
        "covers": "The difference between self-led desire and motivation weakened by outside pressure.",
        "patternTypes": {
            "highTracking": "You notice when something stops feeling internally driven.",
            "lowAccess": "You disconnect when motivation is not immediate or clear.",
            "pushPull": "You want to care, but external pressure weakens your motivation.",
            "delayedActivation": "Motivation shows up after you have already committed.",
        },
    },
    "obligationWeight": {
        "covers": "The weight of obligations, claimed time, and commitments that start costing more than expected.",
        "patternTypes": {
            "highTracking": "You track how much of your time is being claimed by others.",
            "lowAccess": "You disengage from obligations that feel too heavy.",
            "pushPull": "You take on obligations, then feel overwhelmed by them.",
            "delayedActivation": "You say yes easily, then feel the weight later.",
        },
    },
    "selfDirection": {
        "covers": "Choosing direction, checking alignment, and feeling whether a path belongs to you.",
        "patternTypes": {
            "highTracking": "You think carefully about whether something aligns with you.",
            "lowAccess": "You drift instead of actively choosing direction.",
            "pushPull": "You want direction but hesitate to fully commit to it.",
            "delayedActivation": "Direction becomes clear after you have already moved.",
        },
    },
    "permissionToChoose": {
        "covers": "Looking for internal permission, external approval, or enough clarity to choose.",
        "patternTypes": {
            "highTracking": "You look for internal permission before deciding.",
            "lowAccess": "You avoid deciding when permission does not feel clear.",
            "pushPull": "You want autonomy but still look for approval.",
            "delayedActivation": "You act first, then question whether it was your choice.",
        },
    },
    "autonomyRecovery": {
        "covers": "Reclaiming say, control, agency, or participation after autonomy feels lost.",
        "patternTypes": {
            "highTracking": "You try to reclaim control quickly when it feels lost.",
            "lowAccess": "You withdraw instead of actively reclaiming autonomy.",
            "pushPull": "You push for control, then second-guess it.",
            "delayedActivation": "You realize later where you needed more say.",
        },
    },
}


COMPETENCE_MASTERY_SUBCATEGORY_GUIDANCE: dict[str, dict[str, object]] = {
    "fearOfFailure": {
        "covers": "Confidence, skill, performance, fear of failure, and proving ability.",
        "patternTypes": {
            "highTracking": "You anticipate where something could go wrong before starting.",
            "lowAccess": "You avoid starting when failure feels possible.",
            "pushPull": "You want to try, but fear slows you down.",
            "delayedActivation": "You feel the failure after the attempt is over.",
        },
    },
    "performancePressure": {
        "covers": "Pressure to perform correctly, quickly, visibly, or without a learning curve.",
        "patternTypes": {
            "highTracking": "You feel pressure to do things correctly from the start.",
            "lowAccess": "You disengage when expectations feel too high.",
            "pushPull": "You want to perform well, but pressure disrupts your focus.",
            "delayedActivation": "Pressure hits after you have already begun.",
        },
    },
    "skillDoubt": {
        "covers": "Questioning ability, readiness, competence, or whether your skills will hold.",
        "patternTypes": {
            "highTracking": "You question your ability even when you are capable.",
            "lowAccess": "You avoid situations where skill is uncertain.",
            "pushPull": "You want to prove yourself, but doubt interrupts you.",
            "delayedActivation": "Doubt shows up after you reflect on your performance.",
        },
    },
    "masteryDrive": {
        "covers": "Refining, improving, practicing, and wanting something to become genuinely solid.",
        "patternTypes": {
            "highTracking": "You refine and improve even when it is not required.",
            "lowAccess": "You stop once something is “good enough.”",
            "pushPull": "You aim for mastery, then lose energy midway.",
            "delayedActivation": "You recognize the need to improve after finishing.",
        },
    },
    "comparison": {
        "covers": "Tracking performance against others, visible progress, and where you stand.",
        "patternTypes": {
            "highTracking": "You notice how your performance compares to others.",
            "lowAccess": "You avoid comparison by staying out of the arena.",
            "pushPull": "You compare, then pull back from the pressure it creates.",
            "delayedActivation": "Comparison shows up after seeing others’ results.",
        },
    },
    "avoidanceOfEvaluation": {
        "covers": "Avoiding judgment, feedback, exposure, grading, review, or being measured.",
        "patternTypes": {
            "highTracking": "You prepare heavily to avoid negative evaluation.",
            "lowAccess": "You avoid situations where you could be evaluated.",
            "pushPull": "You seek feedback but feel exposed receiving it.",
            "delayedActivation": "Feedback lands more strongly later.",
        },
    },
    "competenceValidation": {
        "covers": "Looking for evidence that you are doing it right or that your ability is recognized.",
        "patternTypes": {
            "highTracking": "You look for signs that you are doing it right.",
            "lowAccess": "You downplay the need for validation.",
            "pushPull": "You want validation but feel uneasy relying on it.",
            "delayedActivation": "Validation matters more after the moment.",
        },
    },
    "rebuildingConfidence": {
        "covers": "Repairing confidence after mistakes, setbacks, criticism, or uncertain performance.",
        "patternTypes": {
            "highTracking": "You try to correct quickly after mistakes.",
            "lowAccess": "You step back after confidence drops.",
            "pushPull": "You re-engage, then hesitate again.",
            "delayedActivation": "Confidence rebuilds slowly after reflection.",
        },
    },
}


BELONGING_SOCIAL_SAFETY_SUBCATEGORY_GUIDANCE: dict[str, dict[str, object]] = {
    "fittingInScan": {
        "covers": "Fitting in, being accepted, group safety, and feeling different.",
        "patternTypes": {
            "highTracking": "You read the room before deciding how to show up.",
            "lowAccess": "You stay outside the group instead of adapting.",
            "pushPull": "You adjust to fit in, then feel disconnected.",
            "delayedActivation": "You notice how you fit in after leaving.",
        },
    },
    "fearOfExclusion": {
        "covers": "Watching for signs of being left out, forgotten, excluded, or not included.",
        "patternTypes": {
            "highTracking": "You notice early signs of being left out.",
            "lowAccess": "You detach before exclusion can happen.",
            "pushPull": "You want inclusion but guard against rejection.",
            "delayedActivation": "You feel exclusion later.",
        },
    },
    "maskingAdaptation": {
        "covers": "Adjusting, masking, softening, or reshaping yourself to match the group.",
        "patternTypes": {
            "highTracking": "You adjust yourself to match the group.",
            "lowAccess": "You avoid adapting and stay neutral.",
            "pushPull": "You shift between adapting and pulling back.",
            "delayedActivation": "You realize afterward how much you adjusted.",
        },
    },
    "groupEnergySensitivity": {
        "covers": "Feeling shifts in group energy, emotional weather, attention, or room dynamics.",
        "patternTypes": {
            "highTracking": "You feel shifts in group energy quickly.",
            "lowAccess": "You tune out group dynamics.",
            "pushPull": "You notice energy but feel unsure how to respond.",
            "delayedActivation": "Energy shifts register later.",
        },
    },
    "socialComparison": {
        "covers": "Comparing belonging, ease, status, performance, or social position inside a group.",
        "patternTypes": {
            "highTracking": "You track your place in the group.",
            "lowAccess": "You avoid comparison by disengaging.",
            "pushPull": "You compare, then distance yourself.",
            "delayedActivation": "Comparison happens after the event.",
        },
    },
    "inclusionNeed": {
        "covers": "Wanting to be invited, included, remembered, accepted, or part of the circle.",
        "patternTypes": {
            "highTracking": "You look for signs you are included.",
            "lowAccess": "You minimize the need to belong.",
            "pushPull": "You want inclusion but resist needing it.",
            "delayedActivation": "The need shows up later.",
        },
    },
    "rejectionProcessing": {
        "covers": "Taking in rejection, dismissal, social pain, or the feeling of not being wanted.",
        "patternTypes": {
            "highTracking": "You process rejection quickly.",
            "lowAccess": "You suppress or dismiss rejection.",
            "pushPull": "You feel it, then push it away.",
            "delayedActivation": "Rejection lands later.",
        },
    },
    "socialSafetyCalibration": {
        "covers": "Calibrating whether a group, room, or social setting feels safe enough to enter.",
        "patternTypes": {
            "highTracking": "You actively monitor social safety.",
            "lowAccess": "You disengage from unsafe environments.",
            "pushPull": "You approach and withdraw repeatedly.",
            "delayedActivation": "Safety becomes clear after.",
        },
    },
}


SAFETY_THREAT_DETECTION_SUBCATEGORY_GUIDANCE: dict[str, dict[str, object]] = {
    "earlyThreatDetection": {
        "covers": "Bracing, scanning, danger detection, and feeling safe or unsafe.",
        "patternTypes": {
            "highTracking": "You notice potential threats early.",
            "lowAccess": "You disconnect from threat signals.",
            "pushPull": "You want calm but stay alert.",
            "delayedActivation": "Threat registers later.",
        },
    },
    "bodyBracing": {
        "covers": "Tension, bracing, tightening, holding breath, and body-level readiness.",
        "patternTypes": {
            "highTracking": "Your body braces quickly.",
            "lowAccess": "You numb instead of bracing.",
            "pushPull": "You alternate between tension and release.",
            "delayedActivation": "Tension builds later.",
        },
    },
    "safetyChecking": {
        "covers": "Looking for reassurance, stable cues, safe exits, or proof that the moment is okay.",
        "patternTypes": {
            "highTracking": "You look for reassurance signals.",
            "lowAccess": "You avoid checking for safety.",
            "pushPull": "You check, then doubt the signals.",
            "delayedActivation": "You question safety later.",
        },
    },
    "hypervigilance": {
        "covers": "Constant scanning, alertness, monitoring, and readiness for what could change.",
        "patternTypes": {
            "highTracking": "You scan constantly.",
            "lowAccess": "You tune out instead of scanning.",
            "pushPull": "You scan, then disengage.",
            "delayedActivation": "Awareness increases later.",
        },
    },
    "unpredictabilityResponse": {
        "covers": "Responding to uncertainty, sudden change, unclear expectations, or unstable pacing.",
        "patternTypes": {
            "highTracking": "Uncertainty increases alertness.",
            "lowAccess": "You withdraw from unpredictability.",
            "pushPull": "You want certainty but resist structure.",
            "delayedActivation": "Uncertainty hits later.",
        },
    },
    "relaxationDifficulty": {
        "covers": "Difficulty letting down, resting, unclenching, or believing ease is safe.",
        "patternTypes": {
            "highTracking": "It is hard to fully relax.",
            "lowAccess": "You disconnect rather than relax.",
            "pushPull": "You relax, then tense again.",
            "delayedActivation": "Tension appears after.",
        },
    },
    "safePeopleDetection": {
        "covers": "Evaluating people, reading trustworthiness, and deciding who feels safe enough.",
        "patternTypes": {
            "highTracking": "You evaluate people quickly.",
            "lowAccess": "You avoid evaluating deeply.",
            "pushPull": "You want trust but hesitate.",
            "delayedActivation": "Trust or distrust forms later.",
        },
    },
    "safetyRecovery": {
        "covers": "Recovering steadiness after alarm, threat, uncertainty, or social tension.",
        "patternTypes": {
            "highTracking": "You try to restore safety quickly.",
            "lowAccess": "You withdraw to recover.",
            "pushPull": "You oscillate between engagement and retreat.",
            "delayedActivation": "Recovery happens after reflection.",
        },
    },
}


AVOIDANCE_RELIEF_LOOPS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Avoidance, short-term relief, delay, escape, relief that creates long-term pressure.",
    {
        "avoidingTheStart": (
            "You notice the task early and feel the weight of beginning.",
            "You drift away from starting without fully deciding to.",
            "You want to begin, then pull back when it feels too loaded.",
            "You realize later how long you stayed outside of it.",
        ),
        "reliefAfterAvoiding": (
            "You notice the relief that comes from not doing it yet.",
            "You choose distance because relief arrives fastest there.",
            "You avoid, feel better, then feel uneasy about avoiding.",
            "The cost of avoidance shows up later.",
        ),
        "emotionalAvoidance": (
            "You sense the feeling and move around it carefully.",
            "You disconnect before the feeling fully forms.",
            "You want to understand it but move away when it gets close.",
            "The feeling catches up after you thought it passed.",
        ),
        "decisionAvoidance": (
            "You see the decision coming and start weighing every outcome.",
            "You let the decision sit until time decides for you.",
            "You want choice but avoid the pressure of choosing.",
            "You recognize later what you actually wanted.",
        ),
        "conflictAvoidance": (
            "You sense conflict early and try to prevent it.",
            "You go quiet so the conflict does not grow.",
            "You want honesty but avoid the conversation.",
            "The conflict feels bigger later.",
        ),
        "avoidanceByBusyness": (
            "You notice yourself staying busy to avoid what is waiting.",
            "You fill the day and never look directly at the thing.",
            "You use busyness to cope, then resent how much it hides.",
            "The avoided thing returns once everything gets quiet.",
        ),
        "avoidanceShame": (
            "You notice avoidance and judge yourself quickly.",
            "You avoid noticing the shame too.",
            "You want to be kind to yourself but still feel disappointed.",
            "Shame appears after the avoidance has already happened.",
        ),
        "returningToTheThing": (
            "You plan the return before you are ready.",
            "You wait until the pressure forces you back.",
            "You approach, retreat, and approach again.",
            "You return once the emotional charge lowers.",
        ),
    },
)


SHAME_SELF_EVALUATION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Feeling wrong, self-judgment, embarrassment, harsh inner standards, being seen as flawed.",
    {
        "selfCriticismSpike": (
            "You catch mistakes quickly and turn them inward.",
            "You block out self-criticism until it leaks through later.",
            "You defend yourself and blame yourself at the same time.",
            "The criticism arrives after the moment ends.",
        ),
        "embarrassmentSensitivity": (
            "You notice embarrassment before anyone else reacts.",
            "You act like embarrassment does not matter.",
            "You want to laugh it off but still feel exposed.",
            "Embarrassment grows later when you replay it.",
        ),
        "feelingWrong": (
            "You scan for signs that you did something wrong.",
            "You disconnect from the possibility of being wrong.",
            "You want reassurance but hate needing it.",
            "The feeling of wrongness arrives later.",
        ),
        "innerCriticPressure": (
            "You hear the inner critic quickly.",
            "You numb out from the critic until it becomes background pressure.",
            "You fight the critic but still believe parts of it.",
            "The critic gets louder afterward.",
        ),
        "visibilityShame": (
            "You monitor how you are being perceived.",
            "You avoid visibility to avoid shame.",
            "You want to be seen but fear what being seen will expose.",
            "The shame appears after being visible.",
        ),
        "mistakeRecovery": (
            "You try to repair mistakes immediately.",
            "You avoid thinking about the mistake.",
            "You want to fix it but feel too ashamed to engage.",
            "Recovery starts after the shame settles.",
        ),
        "worthQuestioning": (
            "You question your worth when something goes wrong.",
            "You keep worth questions buried.",
            "You know your worth logically but do not feel it consistently.",
            "Worth questions show up later in quieter moments.",
        ),
        "comparisonShame": (
            "You compare yourself and quickly feel behind.",
            "You avoid comparison spaces altogether.",
            "You compare, then try to talk yourself out of caring.",
            "Comparison lands after the interaction or event.",
        ),
    },
)


INNER_CRITIC_SUPEREGO_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Internal pressure, shoulds, moral self-monitoring, harsh standards, guilt.",
    {
        "shouldPressure": (
            "You notice what you should be doing before what you need.",
            "You tune out the shoulds until they pile up.",
            "You resist the pressure but still feel ruled by it.",
            "The shoulds arrive after you stop moving.",
        ),
        "guiltMonitoring": (
            "You detect guilt quickly, even over small things.",
            "You avoid guilt by not looking too closely.",
            "You want freedom but keep checking whether you are wrong.",
            "Guilt shows up later.",
        ),
        "moralResponsibility": (
            "You ask whether you did the right thing immediately.",
            "You avoid moral weight when it feels too heavy.",
            "You want to trust yourself but keep reopening the question.",
            "The responsibility feels clearer afterward.",
        ),
        "harshStandards": (
            "You hold yourself to standards before anyone else does.",
            "You disengage when standards feel impossible.",
            "You chase the standard, then resent it.",
            "The standard feels heavy after the work is done.",
        ),
        "selfPunishment": (
            "You punish yourself mentally when you fall short.",
            "You avoid the feeling of falling short.",
            "You want compassion but keep returning to punishment.",
            "Self-punishment appears later.",
        ),
        "perfectionisticCorrection": (
            "You correct quickly to avoid being wrong.",
            "You avoid correction because it feels exposing.",
            "You want to improve but hate feeling corrected.",
            "The correction lands later.",
        ),
        "guiltAfterRest": (
            "You feel guilty when you stop.",
            "You avoid noticing the guilt and keep distracted.",
            "You want rest but feel undeserving of it.",
            "Guilt appears after resting.",
        ),
        "impossibleGoodness": (
            "You monitor whether you are being good enough.",
            "You detach from the pressure to be good.",
            "You want to be good without being consumed by it.",
            "The question of goodness returns later.",
        ),
    },
)


DEFENSE_PATTERNS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Protection strategies, distancing, humor, intellectualizing, control, minimization.",
    {
        "intellectualizing": (
            "You explain the feeling before you feel it.",
            "You stay in analysis so emotion stays distant.",
            "You want to feel it but keep turning it into an explanation.",
            "The feeling arrives after the explanation is done.",
        ),
        "minimizing": (
            "You notice the impact and immediately try to shrink it.",
            "You minimize before you register the impact.",
            "You say it is fine while part of you knows it is not.",
            "The real impact shows up later.",
        ),
        "humorAsProtection": (
            "You use humor when things get emotionally close.",
            "You joke so the moment stays light.",
            "You want to be honest but turn it into humor first.",
            "The seriousness returns later.",
        ),
        "controlAsProtection": (
            "You organize quickly when vulnerability rises.",
            "You avoid vulnerability by staying practical.",
            "You want softness but reach for control.",
            "You notice later how much control you used.",
        ),
        "distancing": (
            "You feel yourself stepping back when something gets close.",
            "Distance happens before you notice.",
            "You move toward and away in the same moment.",
            "You realize later that you had pulled back.",
        ),
        "shutdownProtection": (
            "You notice the shutdown beginning.",
            "You go blank before you can name it.",
            "You want to stay present but feel yourself leaving.",
            "You understand the shutdown after it passes.",
        ),
        "overFunctioning": (
            "You start doing more when feeling more would be too much.",
            "You stay busy to avoid vulnerability.",
            "You function hard, then collapse privately.",
            "You see the over-functioning afterward.",
        ),
        "deflection": (
            "You notice yourself redirecting attention.",
            "You deflect automatically.",
            "You want to be known but redirect when it gets too close.",
            "You realize later what you avoided saying.",
        ),
    },
)


PROJECTION_INTERPRETATION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Reading meaning into others, assuming motives, expecting rejection, interpreting ambiguity.",
    {
        "motiveReading": (
            "You try to understand what someone really meant quickly.",
            "You avoid thinking about motives at all.",
            "You interpret, then doubt your interpretation.",
            "Motives become a question later.",
        ),
        "rejectionExpectation": (
            "You see possible rejection before it is confirmed.",
            "You detach so rejection cannot fully land.",
            "You want reassurance but expect rejection anyway.",
            "Rejection fear arrives later.",
        ),
        "ambiguityFilling": (
            "You fill in missing information quickly.",
            "You leave ambiguity untouched.",
            "You fill it in, then question if you made it up.",
            "The ambiguity bothers you afterward.",
        ),
        "assumingDisappointment": (
            "You look for signs that someone is disappointed.",
            "You avoid checking whether disappointment is there.",
            "You want to know but fear confirmation.",
            "The possibility of disappointment lands later.",
        ),
        "interpretingDistance": (
            "You assign meaning to distance quickly.",
            "You ignore distance until it becomes obvious.",
            "You notice distance but resist needing it clarified.",
            "Distance feels meaningful later.",
        ),
        "oldStoryOverlay": (
            "You recognize when an old story is coloring the present.",
            "You stay unaware of the old story.",
            "You see the overlay but still react from it.",
            "The old story becomes clear afterward.",
        ),
        "trustInterpretation": (
            "You analyze whether trust is safe.",
            "You avoid trusting enough for it to matter.",
            "You want trust but interpret for signs of danger.",
            "Trust questions show up later.",
        ),
        "meaningCorrection": (
            "You try to correct interpretations quickly.",
            "You let interpretations stay vague.",
            "You want clarity but fear what clarity will reveal.",
            "Correction feels possible later.",
        ),
    },
)


EMOTIONAL_REGULATION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Feeling intensity, soothing, escalation, containment, emotional recovery.",
    {
        "emotionalEscalation": (
            "You notice emotion rising quickly.",
            "You disconnect before emotion peaks.",
            "You feel it rise, then try to shut it down.",
            "The emotion peaks later.",
        ),
        "soothingNeed": (
            "You know you need soothing early.",
            "You avoid the need to be soothed.",
            "You want comfort but resist receiving it.",
            "The need for soothing shows up later.",
        ),
        "containment": (
            "You work to contain emotion before it spills out.",
            "You contain by disconnecting.",
            "You contain it, then resent having to.",
            "Containment breaks later.",
        ),
        "emotionalFlooding": (
            "You sense flooding before it takes over.",
            "You go numb instead of feeling flooded.",
            "You feel flooded, then try to escape it.",
            "Flooding happens after the event.",
        ),
        "recoveryAfterEmotion": (
            "You try to recover quickly after strong emotion.",
            "You move on without recovery.",
            "You recover briefly, then get pulled back in.",
            "Recovery starts later.",
        ),
        "emotionalControl": (
            "You monitor how much emotion shows.",
            "Emotion stays hidden by default.",
            "You want expression but fear losing control.",
            "Emotion emerges once control drops.",
        ),
        "calmingStrategies": (
            "You reach for calming strategies quickly.",
            "You do not notice you need calming.",
            "You try calming, then abandon it.",
            "Calming becomes possible later.",
        ),
        "intensityMeaning": (
            "You search for what the intensity means.",
            "You avoid assigning meaning to intensity.",
            "You want to understand it but fear making it bigger.",
            "Meaning arrives after intensity fades.",
        ),
    },
)


COGNITIVE_APPRAISAL_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "How a person evaluates a situation, threat, meaning, difficulty, and possibility.",
    {
        "threatAppraisal": (
            "You evaluate risk before anything fully happens.",
            "You avoid evaluating risk until it is unavoidable.",
            "You see risk but do not know whether to trust the read.",
            "The risk feels clearer afterward.",
        ),
        "difficultyAppraisal": (
            "You measure how hard something will be right away.",
            "You avoid thinking about difficulty.",
            "You want to try but get stuck assessing the difficulty.",
            "The difficulty registers after you begin.",
        ),
        "resourceAppraisal": (
            "You check whether you have enough energy, time, or support.",
            "You ignore resource limits until they are obvious.",
            "You see the limit but push anyway.",
            "The lack of resources hits later.",
        ),
        "meaningAppraisal": (
            "You decide quickly what the moment means.",
            "You avoid meaning because it complicates things.",
            "You assign meaning, then question it.",
            "Meaning becomes clear after distance.",
        ),
        "controlAppraisal": (
            "You track what is and is not in your control.",
            "You disengage when control feels unclear.",
            "You want control but feel unsure where it belongs.",
            "Control becomes visible afterward.",
        ),
        "blameAppraisal": (
            "You check whether blame belongs to you.",
            "You avoid blame completely.",
            "You blame yourself, then resist the blame.",
            "Blame appears later.",
        ),
        "opportunityAppraisal": (
            "You look for what the situation could become.",
            "You do not see opportunity until later.",
            "You see possibility but hesitate to move toward it.",
            "Opportunity feels real afterward.",
        ),
        "emotionalAppraisal": (
            "You evaluate whether your feeling makes sense.",
            "You avoid checking the feeling.",
            "You validate and doubt your feeling at the same time.",
            "The feeling makes sense later.",
        ),
    },
)


EXECUTIVE_FUNCTION_TASK_INITIATION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Starting, planning, sequencing, follow-through, task overwhelm, mental load.",
    {
        "taskInitiation": (
            "You feel the weight of starting before the task begins.",
            "You stay outside the task until pressure forces movement.",
            "You begin, pause, and restart repeatedly.",
            "Starting becomes easier after a delay.",
        ),
        "sequencingSteps": (
            "You map the steps before moving.",
            "You avoid the task when the steps are unclear.",
            "You plan the steps, then get overwhelmed by them.",
            "The sequence becomes clearer later.",
        ),
        "mentalLoad": (
            "You track all the moving pieces at once.",
            "You disconnect from the load until something slips.",
            "You hold the load, then resent how much is in your head.",
            "The load becomes visible after the fact.",
        ),
        "followThroughDrop": (
            "You notice when follow-through starts weakening.",
            "You stop without fully noticing the drop.",
            "You return to it in bursts.",
            "You see the drop later.",
        ),
        "planningPressure": (
            "You over-plan to make the task feel safe.",
            "You avoid planning because it feels heavy.",
            "You plan, then resist the plan.",
            "The need for planning shows up later.",
        ),
        "overwhelmBeforeStarting": (
            "You feel overwhelmed before anything begins.",
            "You avoid the task because the entry point is unclear.",
            "You want to start but freeze at the first step.",
            "Overwhelm appears once you try.",
        ),
        "completionDifficulty": (
            "You track what remains unfinished.",
            "You leave things unfinished without fully registering it.",
            "You finish some parts and avoid the final push.",
            "The unfinished piece matters later.",
        ),
        "attentionSwitching": (
            "You notice every shift in attention.",
            "Your attention drifts before you catch it.",
            "You try to focus, then bounce away.",
            "You recognize the attention pattern afterward.",
        ),
    },
)


TIME_PERCEPTION_CAPACITY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Time pressure, pacing, urgency, margin, transitions, capacity mismatch.",
    {
        "timeCompression": (
            "You feel time shrinking before anything is late.",
            "You avoid noticing time until it becomes urgent.",
            "You want more time but keep filling the space.",
            "Time pressure lands after the day has already tightened.",
        ),
        "transitionStress": (
            "You feel the transition before it starts.",
            "You ignore transition needs and rush through.",
            "You want smoother transitions but resist slowing down.",
            "The transition stress hits later.",
        ),
        "marginAwareness": (
            "You notice when the day has no margin.",
            "You move through the day without tracking margin.",
            "You know you need margin but keep giving it away.",
            "The lack of margin becomes clear afterward.",
        ),
        "urgencyLoop": (
            "You sense urgency rising and try to outrun it.",
            "You tune out urgency until it becomes unavoidable.",
            "You respond to urgency, then resent being ruled by it.",
            "Urgency shows up after delay creates pressure.",
        ),
        "pacingMismatch": (
            "You notice when your pace and the day’s pace do not match.",
            "You disconnect from pace until you feel drained.",
            "You speed up, then crash.",
            "The mismatch becomes obvious after the day ends.",
        ),
        "waitingDifficulty": (
            "Waiting feels charged because your mind stays active.",
            "You check out while waiting.",
            "You want patience but feel restless.",
            "The waiting affects you after it is over.",
        ),
        "overcommittedTime": (
            "You know the schedule is too full before it breaks.",
            "You do not register overcommitment until it is too late.",
            "You say yes, then resent the schedule.",
            "The overcommitment becomes clear later.",
        ),
        "recoverySpacing": (
            "You notice when there is not enough space to recover.",
            "You skip recovery space without registering it.",
            "You try to rest, then fill the space again.",
            "The need for spacing arrives later.",
        ),
    },
)


SOCIAL_LEARNING_MODELED_ROLES_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Learned roles, copied coping, family scripts, modeled behavior, early relational templates.",
    {
        "learnedCaretaking": (
            "You notice needs quickly because caretaking was modeled or expected.",
            "You avoid caretaking roles because they feel consuming.",
            "You care deeply, then resent being needed.",
            "You realize later you slipped into caretaking.",
        ),
        "conflictScripts": (
            "You anticipate conflict based on what you learned to expect.",
            "You avoid conflict because old scripts say it will not go well.",
            "You want a new response but fall into the old script.",
            "The old script becomes obvious afterward.",
        ),
        "emotionalExpressionModeling": (
            "You monitor how emotion should be shown.",
            "You hide emotion because that was the safer model.",
            "You want to express emotion but feel unsure how.",
            "The emotion comes out later.",
        ),
        "independenceScript": (
            "You notice when needing help feels uncomfortable.",
            "You handle things alone by default.",
            "You want help but distrust relying on it.",
            "You realize later you needed support.",
        ),
        "responsibilityRole": (
            "You step into responsibility before anyone asks.",
            "You avoid responsibility roles because they feel trapping.",
            "You take responsibility, then feel angry that you did.",
            "You notice later that you carried too much.",
        ),
        "emotionalToneLearning": (
            "You read emotional tone because you learned it mattered.",
            "You tune out tone because engaging it feels unsafe.",
            "You notice tone but try not to care.",
            "Tone affects you later.",
        ),
        "approvalLearning": (
            "You look for approval cues quickly.",
            "You act like approval does not matter.",
            "You want approval but resent needing it.",
            "Approval or disapproval lands later.",
        ),
        "inheritedCoping": (
            "You recognize coping patterns you learned from others.",
            "You repeat learned coping without noticing.",
            "You want to change the pattern but return to it under stress.",
            "The inherited pattern becomes clear afterward.",
        ),
    },
)


FAMILY_ROLES_EARLY_SCRIPTS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Old roles, family expectations, childhood scripts, being the responsible one, being invisible, being the problem, being the fixer.",
    {
        "fixerRole": (
            "You notice what needs fixing before anyone asks.",
            "You avoid fixing because the role feels too familiar.",
            "You step in, then resent being the one who always does.",
            "You realize later that you became the fixer again.",
        ),
        "invisibleRole": (
            "You monitor whether your needs are taking up too much space.",
            "You stay invisible because being seen feels complicated.",
            "You want to be noticed, then pull back when attention arrives.",
            "You feel the loneliness of being unseen later.",
        ),
        "scapegoatRole": (
            "You watch for signs that blame is landing on you.",
            "You detach before blame can fully reach you.",
            "You defend yourself, then wonder if you really are at fault.",
            "The blame affects you after the moment ends.",
        ),
        "peacekeeperRole": (
            "You sense tension early and try to smooth it.",
            "You avoid tension by staying out of it.",
            "You want peace but feel angry that you have to manage it.",
            "You realize later how much tension you absorbed.",
        ),
        "parentifiedRole": (
            "You step into adult responsibility quickly.",
            "You avoid responsibility when it feels like losing yourself again.",
            "You take charge, then feel trapped by being needed.",
            "You notice later that you carried more than your share.",
        ),
        "goldenChildPressure": (
            "You monitor whether you are meeting expectations.",
            "You disengage when expectations feel too loaded.",
            "You want approval but resent the performance.",
            "The pressure lands after you have already performed.",
        ),
        "emotionalCaretaker": (
            "You track everyone’s emotional state before your own.",
            "You stop checking because it feels too consuming.",
            "You care deeply, then pull away from the weight of it.",
            "You feel the emotional labor later.",
        ),
        "oldFamilyScriptActivation": (
            "You recognize the old script starting in real time.",
            "You fall into the script without naming it.",
            "You want to respond differently but feel pulled into the old role.",
            "You understand later that the present touched an old script.",
        ),
    },
)


MORAL_RESPONSIBILITY_FAIRNESS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Fairness, justice, guilt, responsibility, right/wrong, moral pressure, ethical repair.",
    {
        "fairnessSensitivity": (
            "You notice unfairness quickly and feel it strongly.",
            "You disconnect from unfairness when it feels too exhausting.",
            "You want to speak up but fear what it will cost.",
            "The unfairness lands later, after the moment has passed.",
        ),
        "responsibilityQuestion": (
            "You ask whether something is yours to fix immediately.",
            "You avoid the responsibility question altogether.",
            "You want to help but fear being trapped by obligation.",
            "You realize later where responsibility actually belonged.",
        ),
        "guiltAfterChoice": (
            "You feel guilt as soon as you choose yourself.",
            "You push guilt away and keep moving.",
            "You choose yourself, then question whether you were selfish.",
            "Guilt appears after the relief wears off.",
        ),
        "moralOverload": (
            "You feel every choice as if it carries moral weight.",
            "You numb out when too many things feel morally loaded.",
            "You care deeply, then shut down because caring feels endless.",
            "The moral weight shows up later.",
        ),
        "repairObligation": (
            "You look for what needs repair before anyone asks.",
            "You avoid repair when the moral weight feels too heavy.",
            "You want to repair but resent always being responsible for it.",
            "The need for repair becomes clear after distance.",
        ),
        "justiceAnger": (
            "You feel anger quickly when something is unfair.",
            "You suppress anger because it feels too disruptive.",
            "You want to act on the anger but fear becoming too much.",
            "The anger arrives later, stronger than expected.",
        ),
        "selfForgiveness": (
            "You track your mistakes longer than others do.",
            "You avoid the mistake instead of forgiving yourself.",
            "You want forgiveness but keep reopening the case.",
            "Forgiveness becomes possible after time passes.",
        ),
        "ethicalClarity": (
            "You search for the cleanest right answer.",
            "You avoid the question when the right answer is unclear.",
            "You want clarity but struggle when no option feels clean.",
            "The ethical shape becomes clearer afterward.",
        ),
    },
)


VALUES_INTEGRITY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Alignment, truth, values, integrity, compromise, inner yes/no, living in line with what matters.",
    {
        "alignmentSignal": (
            "You notice quickly when something feels out of alignment.",
            "You ignore misalignment until it becomes harder to avoid.",
            "You want alignment but resist what it asks you to change.",
            "The misalignment becomes obvious later.",
        ),
        "innerYesNo": (
            "You feel your inner yes or no early.",
            "You disconnect from the yes or no and keep going.",
            "You hear the no but try to talk yourself into yes.",
            "The real answer appears after the moment passes.",
        ),
        "compromiseCost": (
            "You notice the cost of compromise immediately.",
            "You compromise without checking what it costs.",
            "You compromise, then feel resentment or grief.",
            "The cost becomes clear later.",
        ),
        "truthPressure": (
            "You feel pressure when something true is not being named.",
            "You avoid naming the truth because it would complicate things.",
            "You want to tell the truth but fear what it will change.",
            "The truth returns later when things quiet down.",
        ),
        "valueConflict": (
            "You notice when two values are competing.",
            "You avoid the conflict by choosing whatever is easiest.",
            "You try to honor both values and feel split.",
            "The value conflict becomes clear afterward.",
        ),
        "integrityRepair": (
            "You try to correct quickly when you feel out of integrity.",
            "You avoid looking at the integrity gap.",
            "You want repair but feel ashamed of needing it.",
            "Repair becomes possible after you understand the gap.",
        ),
        "authenticityRisk": (
            "You notice where being authentic might cost you.",
            "You stay neutral so authenticity does not expose you.",
            "You want to be real but fear what being real will require.",
            "You realize later where you were not fully yourself.",
        ),
        "valuesAsDirection": (
            "You use values to orient quickly.",
            "You drift when values are not clearly connected to action.",
            "You want values to guide you but resist the pressure of living them.",
            "Values become clearer after experience gives them shape.",
        ),
    },
)


IDENTITY_DEVELOPMENT_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Changing identity, self-concept, old versions, becoming, roles, personal evolution.",
    {
        "oldSelfLoosening": (
            "You notice when an old version of you no longer fits.",
            "You keep living from the old version because it is familiar.",
            "You want to outgrow it but still reach for what you know.",
            "You realize later that the old version had already loosened.",
        ),
        "newSelfEmerging": (
            "You sense the new version before it is visible.",
            "You avoid naming the new version because it feels unstable.",
            "You move toward it, then doubt whether it is real.",
            "The new self becomes clearer after you act.",
        ),
        "roleConfusion": (
            "You feel tension when roles no longer match who you are.",
            "You stay in the role because questioning it feels heavy.",
            "You perform the role while resenting how small it feels.",
            "The role conflict shows up later.",
        ),
        "selfDefinition": (
            "You keep trying to define who you are becoming.",
            "You avoid defining yourself and let identity stay vague.",
            "You want a clear identity but fear being boxed in.",
            "Definition arrives after repeated choices.",
        ),
        "identityVisibility": (
            "You notice what parts of you are visible to others.",
            "You hide identity shifts until they feel safer.",
            "You want to be seen but fear being misunderstood.",
            "You realize later what you wished people had seen.",
        ),
        "belongingToSelf": (
            "You check whether your choices still feel like yours.",
            "You lose track of yourself inside routine or expectation.",
            "You want self-belonging but keep adapting to others.",
            "You feel the distance from yourself later.",
        ),
        "becomingDiscomfort": (
            "You feel the discomfort of becoming in real time.",
            "You avoid the discomfort by staying where you are.",
            "You move forward, then miss the familiar.",
            "The discomfort shows up after change begins.",
        ),
        "selfContinuity": (
            "You look for the thread between who you were and who you are becoming.",
            "You disconnect from past versions of yourself.",
            "You want continuity but also want a clean break.",
            "The thread becomes visible after time passes.",
        ),
    },
)


PSYCHOSOCIAL_TRANSITIONS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Life stages, role changes, maturity, belonging in a new phase, developmental shifts.",
    {
        "lifeStageShift": (
            "You sense when a life stage is changing before it is official.",
            "You avoid naming the shift because it feels too big.",
            "You want the next stage but miss the old one.",
            "The shift becomes real after it has already begun.",
        ),
        "roleTransition": (
            "You notice when a role starts changing around you.",
            "You keep acting from the old role.",
            "You try the new role, then retreat into the familiar one.",
            "The role change lands later.",
        ),
        "maturityPressure": (
            "You feel pressure to be ready before you are.",
            "You avoid readiness expectations.",
            "You want growth but resist being forced into it.",
            "The pressure appears after others expect more from you.",
        ),
        "thresholdAnxiety": (
            "You feel anxiety as soon as you approach a threshold.",
            "You avoid thresholds until they are unavoidable.",
            "You move toward the threshold, then pull back.",
            "Anxiety rises after crossing.",
        ),
        "oldLifeGrief": (
            "You notice grief for the life phase that is ending.",
            "You minimize the grief and keep moving.",
            "You want the new life but grieve the old one.",
            "The grief arrives after the change.",
        ),
        "newResponsibility": (
            "You feel the weight of new responsibility early.",
            "You avoid registering the responsibility.",
            "You accept responsibility, then feel trapped by it.",
            "The responsibility feels real later.",
        ),
        "belongingInNewPhase": (
            "You check whether you belong in the new phase.",
            "You stay emotionally outside the new phase.",
            "You want to belong but feel like an impostor.",
            "Belonging develops after repeated experience.",
        ),
        "developmentalIntegration": (
            "You try to understand what the transition means.",
            "You move through it without reflection.",
            "You want meaning but resist how much is changing.",
            "Integration happens after distance.",
        ),
    },
)


SELF_ACTUALIZATION_GROWTH_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Potential, growth edges, becoming more fully yourself, purpose, expansion.",
    {
        "growthEdge": (
            "You notice the edge where growth is asking for more.",
            "You avoid the edge because it feels exposing.",
            "You want growth but resist what it demands.",
            "The growth edge becomes clear after experience.",
        ),
        "potentialFear": (
            "You sense your potential and feel pressure around it.",
            "You downplay potential so it does not ask anything from you.",
            "You want to expand but fear being responsible for what you can become.",
            "Potential feels real after someone or something reflects it back.",
        ),
        "authenticExpansion": (
            "You notice where life feels too small.",
            "You stay inside what is familiar.",
            "You reach for more, then retreat from visibility.",
            "The need for expansion appears later.",
        ),
        "purposeEmergence": (
            "You look for purpose in what keeps pulling your attention.",
            "You avoid purpose questions because they feel too large.",
            "You want purpose but fear committing to one direction.",
            "Purpose becomes visible after repeated patterns.",
        ),
        "growthResistance": (
            "You notice the resistance as soon as growth gets close.",
            "You avoid growth without naming it.",
            "You move forward, then sabotage or stall.",
            "Resistance becomes obvious after the stall.",
        ),
        "becomingVisible": (
            "You feel exposed when growth becomes visible.",
            "You hide growth until it feels safer.",
            "You want recognition but fear attention.",
            "The visibility lands afterward.",
        ),
        "innerPermissionToGrow": (
            "You check whether you are allowed to want more.",
            "You avoid wanting more because it complicates things.",
            "You want more but feel guilty for wanting it.",
            "Permission appears after the desire keeps returning.",
        ),
        "expansionPacing": (
            "You try to pace growth carefully.",
            "You stay still until change pushes you.",
            "You rush forward, then pull back to recover.",
            "The right pace becomes clear later.",
        ),
    },
)


HUMANISTIC_NEEDS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Safety, belonging, esteem, meaning, growth, dignity, unconditional worth.",
    {
        "unmetNeedRecognition": (
            "You notice the need as soon as it starts pressing.",
            "You ignore needs until they become hard to avoid.",
            "You feel the need but judge yourself for having it.",
            "The need becomes clear later.",
        ),
        "dignityNeed": (
            "You notice when your dignity feels compromised.",
            "You minimize dignity violations to keep moving.",
            "You want to protect dignity but fear making a scene.",
            "The dignity cost lands afterward.",
        ),
        "esteemNeed": (
            "You look for signs that your effort or presence matters.",
            "You act like esteem does not matter.",
            "You want recognition but distrust needing it.",
            "Recognition matters more after the moment.",
        ),
        "belongingNeed": (
            "You feel the need to belong clearly.",
            "You disconnect from belonging before it can hurt.",
            "You want belonging but guard against dependence.",
            "The need for belonging arrives later.",
        ),
        "safetyNeed": (
            "You track whether the environment feels safe enough.",
            "You detach from safety cues.",
            "You want safety but stay suspicious of it.",
            "Safety or lack of safety registers afterward.",
        ),
        "growthNeed": (
            "You notice when growth is being blocked.",
            "You avoid growth needs because they create pressure.",
            "You want growth but fear disruption.",
            "The need for growth appears after stagnation.",
        ),
        "unconditionalWorth": (
            "You notice when worth feels conditional.",
            "You avoid thinking about worth.",
            "You want unconditional care but struggle to receive it.",
            "Conditional worth hurts later.",
        ),
        "needHierarchyConflict": (
            "You notice when one need is competing with another.",
            "You ignore the conflict and keep functioning.",
            "You try to meet one need while sacrificing another.",
            "The conflict becomes obvious afterward.",
        ),
    },
)


CLIENT_CENTERED_SELF_TRUST_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Inner knowing, self-acceptance, congruence, unconditional positive regard, trusting your own experience.",
    {
        "innerKnowing": (
            "You notice your inner knowing quickly.",
            "You dismiss inner knowing before it becomes clear.",
            "You trust it briefly, then doubt it.",
            "Inner knowing becomes clearer later.",
        ),
        "selfAcceptance": (
            "You notice where you are fighting yourself.",
            "You avoid the parts that feel hard to accept.",
            "You want acceptance but keep negotiating with shame.",
            "Acceptance becomes possible after time.",
        ),
        "congruenceGap": (
            "You feel when your outside does not match your inside.",
            "You disconnect from the mismatch.",
            "You want to live congruently but fear what it will change.",
            "The mismatch becomes clear afterward.",
        ),
        "trustingExperience": (
            "You check whether your experience is valid.",
            "You downplay your experience.",
            "You believe yourself, then second-guess it.",
            "Trust in your experience arrives later.",
        ),
        "selfCompassionAccess": (
            "You notice when compassion is missing.",
            "You avoid compassion because it feels unfamiliar.",
            "You want compassion but do not know how to let it land.",
            "Compassion becomes available after the harshness fades.",
        ),
        "internalPermission": (
            "You look for permission inside yourself.",
            "You wait for outside permission or avoid deciding.",
            "You want inner permission but still seek external confirmation.",
            "Permission becomes clear after acting.",
        ),
        "emotionalHonesty": (
            "You know when you are not being honest with yourself.",
            "You avoid emotional honesty because it feels too disruptive.",
            "You want honesty but fear what it will reveal.",
            "Honesty arrives later.",
        ),
        "selfValidation": (
            "You try to validate yourself quickly.",
            "You skip self-validation and keep going.",
            "You self-validate, then look for outside proof.",
            "Validation becomes possible after reflection.",
        ),
    },
)


CONDITIONAL_WORTH_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Earning love, proving value, usefulness, performance-based worth, being enough without producing.",
    {
        "earningCare": (
            "You notice when care feels like something you have to earn.",
            "You avoid needing care so you do not have to earn it.",
            "You want care but feel pressure to deserve it first.",
            "The earning pattern becomes clear later.",
        ),
        "usefulnessWorth": (
            "You track whether you are being useful.",
            "You detach from usefulness when it feels too loaded.",
            "You want to rest but feel useless when you do.",
            "The usefulness question returns afterward.",
        ),
        "performanceWorth": (
            "You connect performance to worth quickly.",
            "You avoid performance spaces to avoid worth pressure.",
            "You want to succeed but fear what failure would say about you.",
            "Performance affects worth later.",
        ),
        "provingEnough": (
            "You look for ways to prove you are enough.",
            "You avoid trying because proving feels impossible.",
            "You try to prove enoughness, then resent the test.",
            "The need to prove yourself appears later.",
        ),
        "loveAsApproval": (
            "You read approval as a sign of love.",
            "You act like approval does not matter.",
            "You want approval but fear depending on it.",
            "Approval or disapproval lands later.",
        ),
        "restWithoutEarning": (
            "You feel uneasy resting before everything is done.",
            "You rest by disconnecting from the guilt.",
            "You rest, then feel the pressure to justify it.",
            "The guilt appears after rest.",
        ),
        "receivingWithoutDebt": (
            "You measure what care might cost.",
            "You avoid receiving so debt does not form.",
            "You want to receive but start calculating what you owe.",
            "The debt feeling appears after care lands.",
        ),
        "beingEnough": (
            "You question enoughness quickly.",
            "You avoid the question of enoughness.",
            "You want to believe you are enough but keep checking for proof.",
            "Enoughness becomes tender later.",
        ),
    },
)


BIG_FIVE_TEMPERAMENT_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Broad personality patterns: openness, conscientiousness, extraversion, agreeableness, emotional sensitivity, flexibility.",
    {
        "opennessToExperience": (
            "You notice new possibilities quickly.",
            "You stay with the familiar because novelty feels effortful.",
            "You want novelty but also want predictability.",
            "Interest in something new develops later.",
        ),
        "conscientiousStandards": (
            "You track details, duties, and expectations closely.",
            "You disengage from standards when they feel too heavy.",
            "You want to meet the standard but resist being ruled by it.",
            "The standard matters after the deadline or moment passes.",
        ),
        "extraversionEnergy": (
            "You notice how social energy affects you in real time.",
            "You disconnect from social energy and just get through it.",
            "You want connection but tire faster than expected.",
            "The social impact lands after you are alone.",
        ),
        "agreeablenessHarmony": (
            "You track harmony and adjust to protect it.",
            "You detach from harmony concerns.",
            "You want peace but resent over-accommodating.",
            "The cost of keeping peace appears later.",
        ),
        "emotionalSensitivity": (
            "You notice emotional shifts intensely and quickly.",
            "You mute emotional sensitivity to function.",
            "You feel deeply but try to contain it.",
            "Sensitivity shows up after the moment.",
        ),
        "flexibilityRigidity": (
            "You notice when plans or expectations shift.",
            "You avoid adapting until necessary.",
            "You want flexibility but feel safer with structure.",
            "The need to adapt becomes clear afterward.",
        ),
        "noveltyCaution": (
            "You assess risk before trying something new.",
            "You avoid novelty without fully exploring why.",
            "You want the new thing and fear the disruption.",
            "Curiosity appears after the pressure lowers.",
        ),
        "temperamentFit": (
            "You notice when an environment fits or clashes with your temperament.",
            "You tolerate mismatch without checking in.",
            "You adapt to the environment, then feel unlike yourself.",
            "The mismatch becomes clear later.",
        ),
    },
)


INTROVERSION_EXTRAVERSION_ENERGY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Social energy, solitude, stimulation, connection needs, recovery after interaction.",
    {
        "socialEnergyTracking": (
            "You notice social energy rising or dropping in real time.",
            "You push through social situations without checking your energy.",
            "You want connection but start needing space sooner than expected.",
            "The social drain or lift lands after you are alone.",
        ),
        "solitudeNeed": (
            "You know when you need quiet before you fully hit your limit.",
            "You ignore the need for solitude until you feel checked out.",
            "You want alone time but feel guilty stepping away.",
            "The need for solitude becomes clear after overstimulation.",
        ),
        "stimulationThreshold": (
            "You feel when noise, people, or activity starts becoming too much.",
            "You stay in stimulation until your body or mood drops.",
            "You seek stimulation, then get overwhelmed by it.",
            "The overstimulation shows up later.",
        ),
        "connectionRecharge": (
            "You notice quickly when connection gives you energy.",
            "You miss the effect of connection because you stay detached from it.",
            "You enjoy connection but need recovery afterward.",
            "You realize later that being around someone helped.",
        ),
        "socialWithdrawal": (
            "You notice the urge to withdraw as soon as your energy shifts.",
            "You disappear or go quiet without naming why.",
            "You want to stay engaged but start pulling away.",
            "You realize later that you had already withdrawn.",
        ),
        "performanceSocializing": (
            "You track how you are coming across socially.",
            "You stay present physically but not emotionally engaged.",
            "You perform socially, then feel disconnected from yourself.",
            "The effort of performing lands after the interaction.",
        ),
        "groupVsOneOnOne": (
            "You notice the difference between group energy and one-on-one energy.",
            "You avoid noticing what kind of connection actually fits you.",
            "You want the group but feel safer one-on-one.",
            "You realize later which setting drained or nourished you.",
        ),
        "socialRecovery": (
            "You plan recovery around social demand.",
            "You skip recovery and wonder why you feel flat later.",
            "You want to recover but keep saying yes.",
            "Recovery needs show up after the social window closes.",
        ),
    },
)


OPENNESS_IMAGINATION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Curiosity, imagination, possibility, novelty, inner world, creativity, meaning-making.",
    {
        "curiositySpark": (
            "You notice curiosity as soon as something starts pulling your attention.",
            "You dismiss curiosity before it becomes worth following.",
            "You want to follow curiosity but hesitate when it asks for time or risk.",
            "Curiosity becomes clear after the moment has passed.",
        ),
        "innerWorldDepth": (
            "You track your inner world with detail and intensity.",
            "You keep the inner world tucked away and stay practical.",
            "You want to explore what is inside but pull back when it feels too big.",
            "The inner world opens later, once the day quiets.",
        ),
        "noveltyPull": (
            "You feel drawn to what is new, layered, or unusual.",
            "You stay with what is familiar because novelty asks for energy.",
            "You want novelty and predictability at the same time.",
            "Novelty becomes appealing after pressure lowers.",
        ),
        "imaginativeProcessing": (
            "You use images, stories, or metaphors to understand experience.",
            "You avoid imaginative processing because practical answers feel safer.",
            "You want meaning but worry you are making too much of it.",
            "The image or metaphor makes sense later.",
        ),
        "possibilityExpansion": (
            "You see several possible meanings or directions quickly.",
            "You keep possibility narrow so choices feel manageable.",
            "You want expansion but feel overwhelmed by too many doors.",
            "Possibility opens after distance.",
        ),
        "creativeRisk": (
            "You notice when expression wants to become visible.",
            "You keep creative impulses private or unfinished.",
            "You want to create but hesitate when it could be seen.",
            "The need to express returns later.",
        ),
        "wonderAccess": (
            "You notice small moments of wonder or beauty quickly.",
            "You pass over wonder because the day feels too practical.",
            "You feel wonder but struggle to let it matter.",
            "The beauty of the moment lands after it is gone.",
        ),
        "meaningThroughImage": (
            "You understand emotion through image, symbol, or atmosphere.",
            "You avoid image-based meaning when it feels too abstract.",
            "You are drawn to symbols but doubt whether they mean anything.",
            "The image becomes meaningful later.",
        ),
    },
)


CONSCIENTIOUSNESS_STANDARDS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Responsibility, detail, follow-through, standards, order, duty, performance pressure.",
    {
        "detailTracking": (
            "You notice details quickly and feel responsible for them.",
            "You tune out details when they feel too demanding.",
            "You care about details but resent how much they ask from you.",
            "Details matter more after something is finished.",
        ),
        "dutyPressure": (
            "You feel duty before anyone has to remind you.",
            "You avoid duty when it feels like it will swallow your energy.",
            "You want to do the right thing but feel trapped by obligation.",
            "Duty lands after the moment of choice.",
        ),
        "orderNeed": (
            "You notice when things feel disorganized or unfinished.",
            "You tolerate disorder until it starts affecting you.",
            "You want order but resist the work of maintaining it.",
            "The need for order becomes clear afterward.",
        ),
        "followThroughStandards": (
            "You track whether you are following through.",
            "You let follow-through drift when pressure feels too heavy.",
            "You start strong, then struggle to stay connected to the standard.",
            "Follow-through matters more after the deadline or result.",
        ),
        "responsibilityIdentity": (
            "You connect responsibility with who you are.",
            "You disconnect from responsibility when it feels too defining.",
            "You want to be dependable but resent being depended on.",
            "The identity pressure appears later.",
        ),
        "preparationNeed": (
            "You prepare early to reduce uncertainty.",
            "You avoid preparation until pressure forces it.",
            "You prepare, then feel annoyed by how much preparation requires.",
            "The need for preparation becomes obvious afterward.",
        ),
        "mistakePrevention": (
            "You work to prevent mistakes before they happen.",
            "You avoid thinking about mistakes until they appear.",
            "You want to prevent mistakes but get exhausted by vigilance.",
            "Mistakes feel heavier after the fact.",
        ),
        "completionRelief": (
            "You feel relief only when the thing is fully done.",
            "You leave completion loose and move on.",
            "You want closure but avoid the final steps.",
            "The need for completion catches up later.",
        ),
    },
)


AGREEABLENESS_HARMONY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Harmony, cooperation, people-pleasing, conflict avoidance, kindness, resentment.",
    {
        "harmonyTracking": (
            "You notice tension quickly and adjust to keep harmony.",
            "You disconnect from harmony concerns and let things be.",
            "You want peace but resent being the one who preserves it.",
            "The cost of keeping harmony appears later.",
        ),
        "peoplePleasing": (
            "You anticipate what others want before they ask.",
            "You avoid pleasing others by staying detached.",
            "You say yes for peace, then feel crowded by the yes.",
            "The yes feels heavier later.",
        ),
        "kindnessOverextension": (
            "You notice others’ needs and offer more than you planned.",
            "You withhold kindness when it feels like it will become expected.",
            "You want to be kind but fear being used.",
            "Overextension becomes clear after you have already given.",
        ),
        "resentmentSignal": (
            "You notice resentment early and try to understand it.",
            "You ignore resentment until it becomes distance.",
            "You care, give, and then feel resentful.",
            "Resentment arrives after the interaction is over.",
        ),
        "conflictSoftening": (
            "You soften conflict before it gets sharper.",
            "You avoid engaging with conflict at all.",
            "You want honesty but soften it until the truth gets diluted.",
            "The truth you softened returns later.",
        ),
        "cooperationNeed": (
            "You look for ways to keep cooperation moving.",
            "You disengage when cooperation feels too effortful.",
            "You cooperate, then feel unseen in the process.",
            "The need for mutual effort becomes clear afterward.",
        ),
        "emotionalAccommodation": (
            "You adjust to others’ emotions quickly.",
            "You avoid accommodating because it feels draining.",
            "You accommodate, then feel like you disappeared.",
            "The accommodation cost lands later.",
        ),
        "sayingNoDifficulty": (
            "You know the no early but feel the pressure to soften it.",
            "You avoid the request instead of saying no.",
            "You say yes and resent not saying no.",
            "The no becomes clear after the yes.",
        ),
    },
)


NEUROTICISM_SENSITIVITY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Emotional reactivity, worry, sensitivity, threat perception, mood shifts, intensity.",
    {
        "worryLoop": (
            "You notice worry starting and try to solve it quickly.",
            "You push worry down until it shows up physically or later.",
            "You want reassurance but also distrust it.",
            "Worry arrives after the moment has passed.",
        ),
        "moodShiftSensitivity": (
            "You feel mood shifts quickly and intensely.",
            "You disconnect from mood shifts and keep going.",
            "You feel the shift but try to talk yourself out of it.",
            "The mood shift lands later.",
        ),
        "threatSensitivity": (
            "You detect possible threat before it is clear.",
            "You avoid registering threat until it becomes obvious.",
            "You see threat and doubt whether you are overreading it.",
            "The threat read becomes clear afterward.",
        ),
        "emotionalIntensity": (
            "You feel intensity rising and track what it means.",
            "You numb intensity before it peaks.",
            "You feel deeply, then try to shut it down.",
            "Intensity catches up later.",
        ),
        "reassuranceNeed": (
            "You know when reassurance would help.",
            "You avoid needing reassurance.",
            "You want reassurance but feel embarrassed by wanting it.",
            "The need for reassurance appears later.",
        ),
        "sensitivityShame": (
            "You notice your sensitivity and judge it quickly.",
            "You minimize sensitivity so it does not have to be felt.",
            "You value your sensitivity but wish it were easier to carry.",
            "Shame about sensitivity appears afterward.",
        ),
        "emotionalForecasting": (
            "You forecast how something might feel before it happens.",
            "You avoid thinking about how it might feel.",
            "You prepare emotionally, then resist the preparation.",
            "The emotional impact becomes clear later.",
        ),
        "intensityRecovery": (
            "You look for ways to come down from intensity quickly.",
            "You ignore the need to recover.",
            "You recover briefly, then get pulled back into the feeling.",
            "Recovery starts after the intensity has passed.",
        ),
    },
)


COGNITIVE_STYLE_PROCESSING_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Thinking patterns, analysis, clarity, language, processing speed, mental organization.",
    {
        "analyticalProcessing": (
            "You analyze quickly and deeply.",
            "You avoid analysis when it feels too heavy.",
            "You want clarity but get overwhelmed by too much analysis.",
            "Analysis happens after the moment.",
        ),
        "verbalProcessing": (
            "You need words to organize what is happening.",
            "You stay vague because words feel hard to access.",
            "You want to talk it through but fear saying too much.",
            "The words arrive later.",
        ),
        "contextBuilding": (
            "You add context so the full picture is understood.",
            "You skip context and keep things brief.",
            "You want to explain but worry the context is too much.",
            "The missing context matters later.",
        ),
        "mentalOrganization": (
            "You try to organize thoughts before acting.",
            "You act or avoid without organizing the thoughts first.",
            "You organize, then get stuck reorganizing.",
            "Organization becomes possible after distance.",
        ),
        "processingDelay": (
            "You notice when you need more time to process.",
            "You do not register the delay until later.",
            "You want to respond now but need more time.",
            "Processing happens long after the moment.",
        ),
        "clarityPressure": (
            "You feel pressure to make things clear quickly.",
            "You avoid clarity when it feels demanding.",
            "You want clarity but fear what clarity will require.",
            "Clarity arrives after uncertainty has been sitting awhile.",
        ),
        "thoughtSpirals": (
            "You notice thoughts looping and try to solve them.",
            "You disconnect from spirals by distracting.",
            "You engage the spiral, then try to escape it.",
            "The spiral starts later.",
        ),
        "meaningThroughLanguage": (
            "You find meaning by naming it.",
            "You avoid naming because language makes it feel real.",
            "You want the words but fear their weight.",
            "The right words come later.",
        ),
    },
)


APTITUDE_STRENGTH_PATTERNS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Natural strengths, learning style, skill expression, confidence in ability, hidden aptitude.",
    {
        "naturalStrengthRecognition": (
            "You notice where you are naturally strong.",
            "You overlook strengths because they feel ordinary to you.",
            "You recognize the strength but hesitate to claim it.",
            "The strength becomes visible after others reflect it back.",
        ),
        "learningStyle": (
            "You notice how you learn best.",
            "You push through methods that do not fit.",
            "You know what helps but hesitate to ask for it.",
            "The learning pattern becomes clear afterward.",
        ),
        "skillConfidence": (
            "You track confidence while using a skill.",
            "You disconnect from confidence and just do the thing.",
            "You feel capable and doubtful at the same time.",
            "Confidence lands after completion.",
        ),
        "hiddenAptitude": (
            "You sense potential before it is proven.",
            "You miss aptitude because it comes easily.",
            "You want to explore the strength but fear expectation.",
            "Aptitude becomes clear through repetition.",
        ),
        "underusedStrength": (
            "You notice when a strength is not being used.",
            "You leave strengths dormant without thinking about them.",
            "You want to use the strength but fear visibility.",
            "The underuse becomes obvious later.",
        ),
        "masteryPath": (
            "You see the path from skill to mastery.",
            "You stop before mastery becomes possible.",
            "You pursue mastery, then resist the pressure.",
            "The mastery path appears after practice.",
        ),
        "feedbackIntegration": (
            "You integrate feedback quickly.",
            "You avoid feedback or let it pass by.",
            "You want feedback but feel exposed by it.",
            "Feedback becomes useful later.",
        ),
        "strengthOwnership": (
            "You notice when you are ready to claim a strength.",
            "You downplay strengths so they do not create pressure.",
            "You claim it, then feel uncomfortable being seen in it.",
            "Ownership develops over time.",
        ),
    },
)


BEHAVIORAL_TEMPERAMENT_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Approach/withdrawal, persistence, adaptability, intensity, inhibition, rhythm of behavior.",
    {
        "approachTendency": (
            "You notice when you move toward something quickly.",
            "You hesitate or stay back by default.",
            "You approach, then retreat when it feels too close.",
            "The desire to approach appears later.",
        ),
        "withdrawalTendency": (
            "You notice the urge to pull away early.",
            "You withdraw automatically without naming it.",
            "You want to stay but feel yourself leaving.",
            "You realize afterward that you had pulled away.",
        ),
        "persistenceStyle": (
            "You track whether you are persisting or forcing.",
            "You stop when persistence feels too effortful.",
            "You persist in bursts, then lose contact.",
            "Persistence returns after pressure lowers.",
        ),
        "adaptability": (
            "You notice what adaptation costs you.",
            "You adapt without checking the cost.",
            "You adapt, then feel unlike yourself.",
            "The adaptation cost lands later.",
        ),
        "intensityStyle": (
            "You notice intensity in how you respond.",
            "You dampen intensity before it shows.",
            "You feel intensity but try to contain it.",
            "Intensity appears afterward.",
        ),
        "inhibition": (
            "You notice when inhibition stops you.",
            "You stay inhibited without fully recognizing it.",
            "You want to act but hold yourself back.",
            "You realize later what you wanted to do.",
        ),
        "rhythmConsistency": (
            "You monitor your internal rhythm closely.",
            "You lose rhythm without noticing.",
            "You build rhythm, then break it under pressure.",
            "Rhythm becomes clear after disruption.",
        ),
        "reactivityThreshold": (
            "You notice what crosses your reaction threshold.",
            "You miss the threshold until the reaction is obvious.",
            "You react, then try to pull it back.",
            "The reaction makes sense afterward.",
        ),
    },
)


CORE_BELIEFS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Deep assumptions about self, others, safety, worth, love, effort, and possibility.",
    {
        "beliefAboutSelf": (
            "You notice when an old belief about yourself gets activated.",
            "You live from the belief without naming it.",
            "You challenge the belief but still feel pulled by it.",
            "The belief becomes visible afterward.",
        ),
        "beliefAboutOthers": (
            "You watch for proof of what others will do.",
            "You avoid depending on others enough for beliefs to be tested.",
            "You want to believe differently but keep expecting the old outcome.",
            "The belief shows up later in reflection.",
        ),
        "beliefAboutSafety": (
            "You check whether safety is real.",
            "You disconnect from safety questions.",
            "You want safety but distrust it when it appears.",
            "Safety beliefs become clear after the moment.",
        ),
        "beliefAboutWorth": (
            "You notice when worth feels conditional.",
            "You avoid worth questions because they feel too tender.",
            "You want to believe you are enough but still look for proof.",
            "Worth beliefs surface later.",
        ),
        "beliefAboutLove": (
            "You look for signs of whether love is steady.",
            "You keep love at a distance so beliefs do not get tested.",
            "You want love to be safe but fear needing it.",
            "Love beliefs appear after closeness or distance.",
        ),
        "beliefAboutEffort": (
            "You ask whether effort will actually matter.",
            "You avoid effort when belief is low.",
            "You try, then doubt the point of trying.",
            "Effort beliefs shift after seeing results.",
        ),
        "beliefAboutChange": (
            "You evaluate whether change is possible.",
            "You assume change is unlikely and disengage.",
            "You want change but distrust its stability.",
            "Change feels possible later.",
        ),
        "beliefRevision": (
            "You notice when evidence challenges an old belief.",
            "You avoid revising beliefs because it feels destabilizing.",
            "You want the new belief but keep returning to the old one.",
            "Revision happens slowly after repeated evidence.",
        ),
    },
)


LIFE_EXPERIENCES_ADAPTATION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "How past experiences shape present responses, adaptation, survival patterns, learned strategies.",
    {
        "pastPresentEcho": (
            "You notice when the present echoes something old.",
            "You miss the echo and react automatically.",
            "You recognize the echo but still feel pulled into it.",
            "The echo becomes clear afterward.",
        ),
        "adaptiveStrategy": (
            "You see the strategy you are using in real time.",
            "You use the strategy without naming it.",
            "You want a new strategy but return to the familiar one.",
            "The strategy becomes visible after it has already worked or cost you.",
        ),
        "survivalSkillCost": (
            "You notice when an old skill is costing you now.",
            "You keep using the skill because it feels normal.",
            "You appreciate the skill but resent needing it.",
            "The cost appears later.",
        ),
        "adaptationToPressure": (
            "You adjust quickly when pressure rises.",
            "You adapt without noticing how much you are changing.",
            "You adapt, then feel angry about the adjustment.",
            "The pressure’s effect becomes clear after.",
        ),
        "learnedSelfProtection": (
            "You recognize self-protection as it activates.",
            "You protect yourself automatically.",
            "You want openness but keep choosing protection.",
            "The protection becomes obvious later.",
        ),
        "normalizingTheHardThing": (
            "You notice when you are treating something hard as normal.",
            "You normalize it without questioning it.",
            "You know it is hard but still minimize it.",
            "The hardness lands later.",
        ),
        "resourcefulness": (
            "You notice how quickly you look for a way through.",
            "You use resourcefulness without recognizing it as strength.",
            "You rely on resourcefulness but wish you did not have to.",
            "The strength becomes visible afterward.",
        ),
        "changingOldAdaptations": (
            "You notice when an old adaptation is ready to change.",
            "You keep the adaptation because change feels unnecessary or unclear.",
            "You want to change it but feel exposed without it.",
            "Change becomes possible after repeated awareness.",
        ),
    },
)


SOCIAL_IDENTITY_BELONGING_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Group identity, belonging, difference, membership, being understood by a community, feeling outside or included.",
    {
        "groupBelonging": (
            "You notice quickly whether you feel included in a group.",
            "You stay emotionally outside the group before belonging can matter.",
            "You want to belong but distrust what belonging might cost.",
            "Belonging or exclusion lands after the group moment ends.",
        ),
        "differenceAwareness": (
            "You notice what makes you different before others mention it.",
            "You downplay difference so it does not have to be felt.",
            "You want your difference recognized but fear being reduced to it.",
            "The feeling of difference becomes clearer later.",
        ),
        "identityMembership": (
            "You track whether a space actually has room for your identity.",
            "You avoid claiming membership because it feels exposing.",
            "You want the belonging of membership but resist being defined by it.",
            "The meaning of membership lands after distance.",
        ),
        "outsiderFeeling": (
            "You sense when you are standing slightly outside the circle.",
            "You detach before the outsider feeling can hurt.",
            "You want to enter the circle but stay near the edge.",
            "The outsider feeling shows up later, when you are alone.",
        ),
        "communitySafety": (
            "You read whether a community feels safe enough to be real in.",
            "You stay guarded in community spaces by default.",
            "You want community but pull back when it starts asking for openness.",
            "Safety or unsafety becomes clear after the interaction.",
        ),
        "sharedLanguage": (
            "You notice when people understand your language or miss it.",
            "You stop trying to explain when shared language is not there.",
            "You want to be understood but fear translating too much of yourself.",
            "The loneliness of not being understood lands later.",
        ),
        "belongingAfterExclusion": (
            "You look for signs that exclusion might happen again.",
            "You avoid belonging so exclusion cannot repeat.",
            "You want to try again but guard the parts that were hurt before.",
            "Old exclusion colors the moment after it is over.",
        ),
        "chosenCommunity": (
            "You notice when chosen belonging feels more honest than assigned belonging.",
            "You avoid investing in community because attachment feels risky.",
            "You want chosen community but hesitate to need it.",
            "The importance of chosen community becomes clear later.",
        ),
    },
)


POWER_VOICE_AGENCY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Speaking up, being heard, influence, personal power, agency, asserting needs, powerlessness.",
    {
        "speakingUp": (
            "You notice the moment something in you wants to speak.",
            "You stay quiet because speaking feels like too much access.",
            "You want to speak up but fear what your voice will change.",
            "The words arrive after the chance to say them has passed.",
        ),
        "voiceSuppression": (
            "You notice yourself editing your voice in real time.",
            "You suppress your voice before you fully know what you think.",
            "You start to say it, then soften it until it loses shape.",
            "You realize later what you actually wanted to say.",
        ),
        "agencyClaiming": (
            "You look for where your choice still exists.",
            "You detach when choice feels unavailable.",
            "You want agency but feel uneasy taking up that much space.",
            "You recognize later where you did have a choice.",
        ),
        "beingHeard": (
            "You track whether your words are actually landing.",
            "You stop trying when it feels like you will not be heard.",
            "You want to be heard but fear needing someone to listen.",
            "Not being heard hurts later.",
        ),
        "powerlessness": (
            "You notice powerlessness as soon as it enters the room.",
            "You numb out when powerlessness feels too familiar.",
            "You want to push back but doubt it will matter.",
            "The powerlessness lands after the moment passes.",
        ),
        "assertiveNeed": (
            "You feel the need to be direct before you can act on it.",
            "You avoid directness so things stay manageable.",
            "You want to be direct but soften yourself to stay safe.",
            "The need for directness becomes obvious afterward.",
        ),
        "influenceAwareness": (
            "You notice whether your presence changes anything.",
            "You assume your influence is limited and stay back.",
            "You want to matter but feel uncomfortable owning your impact.",
            "Your influence becomes clearer after reflection.",
        ),
        "reclaimingVoice": (
            "You recognize where your voice has been missing.",
            "You keep adapting to silence because it feels familiar.",
            "You want to reclaim your voice but fear being too much.",
            "Reclaiming your voice feels possible later.",
        ),
    },
)


BOUNDARIES_EXCHANGE_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Give-and-take, reciprocity, limits, fairness, saying yes/no, energy exchange.",
    {
        "reciprocityTracking": (
            "You notice quickly when giving and receiving feel uneven.",
            "You stop tracking reciprocity and detach from the imbalance.",
            "You want fairness but feel guilty naming the imbalance.",
            "The imbalance becomes clear later.",
        ),
        "overGiving": (
            "You feel yourself giving more than you planned.",
            "You avoid giving when it feels like it will become expected.",
            "You give, then resent how much left you.",
            "Over-giving registers after the interaction ends.",
        ),
        "receivingDifficulty": (
            "You notice when receiving feels loaded.",
            "You avoid receiving so nothing is owed.",
            "You want to receive but start calculating the exchange.",
            "The meaning of receiving lands later.",
        ),
        "limitRecognition": (
            "You feel your limit before you say anything.",
            "You miss the limit until you are already past it.",
            "You know the limit but struggle to honor it.",
            "The limit becomes clear after overextension.",
        ),
        "unequalExchange": (
            "You notice when the exchange stops feeling mutual.",
            "You detach instead of naming the imbalance.",
            "You want mutuality but fear sounding demanding.",
            "The unfairness of the exchange lands later.",
        ),
        "sayingYesCost": (
            "You know the cost of yes before you give it.",
            "You say yes or avoid answering without checking the cost.",
            "You say yes for peace, then feel the no underneath it.",
            "The cost of yes shows up afterward.",
        ),
        "boundaryRepair": (
            "You try to repair the boundary as soon as you feel it bend.",
            "You avoid the boundary conversation.",
            "You want the boundary but fear the reaction to it.",
            "The need for boundary repair becomes obvious later.",
        ),
        "energyAccounting": (
            "You track where your energy is going.",
            "You lose track of energy until depletion arrives.",
            "You want to spend energy freely but worry about running out.",
            "The energy cost lands after the day ends.",
        ),
    },
)


SOCIAL_EXCHANGE_RECIPROCITY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Mutuality, emotional debt, fairness in care, relational effort, give/take calculations.",
    {
        "emotionalDebt": (
            "You notice when care starts to feel like something you owe back.",
            "You avoid accepting care so debt cannot form.",
            "You want care but start calculating what it will require.",
            "The debt feeling shows up after the care lands.",
        ),
        "effortBalance": (
            "You track who is making effort and who is not.",
            "You stop tracking effort because the imbalance feels tiring.",
            "You want effort to be mutual but fear keeping score.",
            "The imbalance in effort becomes clear later.",
        ),
        "mutualCare": (
            "You notice whether care moves both directions.",
            "You avoid depending on mutual care.",
            "You want mutual care but distrust it when it appears.",
            "Mutuality feels real or missing afterward.",
        ),
        "fairnessInSupport": (
            "You notice when support feels uneven.",
            "You dismiss uneven support to keep things simple.",
            "You want support but feel guilty expecting it.",
            "The unfairness lands later.",
        ),
        "relationalInvestment": (
            "You measure how invested someone seems.",
            "You avoid investing deeply so mismatch hurts less.",
            "You want investment but fear needing it.",
            "Investment becomes clearer after time passes.",
        ),
        "obligationAfterCare": (
            "You feel obligation quickly after receiving care.",
            "You avoid care so obligation does not attach.",
            "You receive it, then feel pressure to repay it.",
            "Obligation appears after the relief fades.",
        ),
        "careWithoutTransaction": (
            "You notice when care feels unusually free.",
            "You distrust care that does not have obvious terms.",
            "You want to trust free care but keep looking for the catch.",
            "The freedom of the care lands later.",
        ),
        "reciprocityRepair": (
            "You try to correct imbalance quickly.",
            "You let imbalance sit because naming it feels heavy.",
            "You want repair but fear sounding like you are keeping score.",
            "The need for reciprocity repair becomes clear afterward.",
        ),
    },
)


PLEASURE_DESIRE_PERMISSION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Desire, enjoyment, sensuality, pleasure, guilt, permission, wanting without justification.",
    {
        "desireRecognition": (
            "You notice desire as soon as it appears.",
            "You dismiss desire before it becomes clear.",
            "You want the thing and immediately question whether you should.",
            "Desire becomes clear after the moment has passed.",
        ),
        "pleasurePermission": (
            "You check whether pleasure is allowed before you enter it.",
            "You avoid pleasure because it feels unnecessary or unsafe.",
            "You want pleasure but feel guilty receiving it.",
            "The pleasure matters more after it is gone.",
        ),
        "sensualComfort": (
            "You notice what feels good or uncomfortable in your body.",
            "You disconnect from sensual signals.",
            "You want to feel present but pull away from sensation.",
            "Sensual comfort or discomfort registers afterward.",
        ),
        "wantingWithoutEarning": (
            "You notice when wanting brings up guilt.",
            "You avoid wanting so you do not have to justify it.",
            "You want freely, then feel pressure to earn it.",
            "The guilt around wanting appears later.",
        ),
        "pleasureAfterPressure": (
            "You struggle to relax into pleasure when pressure is nearby.",
            "You disconnect from pleasure until pressure is gone.",
            "You enter pleasure briefly, then get pulled back into responsibility.",
            "Pleasure becomes available after the pressure lifts.",
        ),
        "shameAroundDesire": (
            "You notice shame as soon as desire becomes visible.",
            "You bury desire so shame does not activate.",
            "You want to own desire but fear being judged for it.",
            "Shame around desire appears after exposure.",
        ),
        "joyInTheBody": (
            "You feel joy through your body quickly.",
            "You miss body joy because you stay in your head.",
            "You feel joy, then pull back from how vulnerable it feels.",
            "Body joy lands after the moment.",
        ),
        "easeWithoutProductivity": (
            "You notice the guilt of ease before you settle into it.",
            "You avoid ease unless it has a practical reason.",
            "You want ease but turn it into something productive.",
            "The need for ease arrives after depletion.",
        ),
    },
)


EMBODIMENT_SOMATIC_SIGNALS_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Body awareness, sensation, body memory, tension, breath, gut feelings, embodied knowing.",
    {
        "chestSignal": (
            "You notice chest tightness as soon as it arrives.",
            "You ignore chest tightness and keep moving.",
            "You notice it, then distract from it.",
            "The chest signal becomes clear later.",
        ),
        "gutDrop": (
            "You feel your stomach drop and start looking for why.",
            "You push past the drop without checking it.",
            "You trust the gut feeling briefly, then doubt it.",
            "The gut feeling makes sense afterward.",
        ),
        "breathChange": (
            "You notice when your breath shifts.",
            "You do not register breath changes until tension builds.",
            "You try to breathe through it, then leave the feeling.",
            "The breath change is easier to notice later.",
        ),
        "bodyMemory": (
            "You recognize when your body is reacting to something old.",
            "You disconnect from body memory.",
            "You sense the oldness of it but do not want to go near it.",
            "The body memory becomes clear after distance.",
        ),
        "embodiedKnowing": (
            "You trust the body’s early read.",
            "You override body knowing with logic.",
            "You believe the body and question it at the same time.",
            "The body’s knowing becomes obvious later.",
        ),
        "tensionPattern": (
            "You notice where tension collects.",
            "You normalize tension until it becomes painful or exhausting.",
            "You notice tension, then keep doing the thing anyway.",
            "Tension makes sense after the stress is over.",
        ),
        "sensationAvoidance": (
            "You notice sensation and quickly decide whether it feels safe.",
            "You avoid sensation by staying busy or detached.",
            "You want to feel present but fear what sensation will open.",
            "Sensation returns when the day quiets.",
        ),
        "bodyReturn": (
            "You notice when you come back into your body.",
            "You stay disconnected from the body longer than you realize.",
            "You return briefly, then leave again when it feels intense.",
            "Body return happens after the moment has passed.",
        ),
    },
)


REST_RECOVERY_DEPLETION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Fatigue, burnout, recovery, sleep, restoration, depletion, rest guilt.",
    {
        "depletionAwareness": (
            "You notice depletion before it becomes full burnout.",
            "You miss depletion until your body forces a stop.",
            "You know you are depleted but keep pushing anyway.",
            "Depletion lands after the demand is over.",
        ),
        "restResistance": (
            "You notice the guilt or restlessness that appears around rest.",
            "You avoid rest by staying busy or checked out.",
            "You want rest but feel uneasy receiving it.",
            "The need for rest becomes obvious later.",
        ),
        "recoveryWindow": (
            "You track when recovery is actually possible.",
            "You skip recovery windows without noticing.",
            "You protect recovery briefly, then give it away.",
            "The missed recovery window becomes clear afterward.",
        ),
        "sleepDebt": (
            "You notice how low sleep changes your capacity.",
            "You push through low sleep as if it should not matter.",
            "You know sleep matters but still override it.",
            "Sleep debt hits after you have already spent the day.",
        ),
        "burnoutSignals": (
            "You recognize burnout signals early.",
            "You normalize burnout until it becomes your baseline.",
            "You want to slow down but keep proving you can handle it.",
            "Burnout becomes undeniable after the push ends.",
        ),
        "restorationNeed": (
            "You know what restores you and when it is missing.",
            "You lose touch with what restoration feels like.",
            "You want restoration but struggle to prioritize it.",
            "Restoration needs become clear after depletion.",
        ),
        "restWorthiness": (
            "You question whether you have done enough to rest.",
            "You detach from worthiness questions and collapse instead.",
            "You rest, then feel the need to justify it.",
            "Worthiness questions show up after rest.",
        ),
        "postStressCrash": (
            "You anticipate the crash after sustained stress.",
            "You do not notice the crash until you are in it.",
            "You hold it together, then drop hard.",
            "The crash arrives once the pressure finally lifts.",
        ),
    },
)


CREATIVITY_EXPRESSION_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Creative pressure, voice, expression, visibility, unfinished ideas, making something real.",
    {
        "creativePressure": (
            "You notice when an idea starts asking for form.",
            "You push creative pressure aside and stay practical.",
            "You want to create but feel exposed by the idea becoming real.",
            "The creative pressure returns later.",
        ),
        "expressionBlock": (
            "You know when expression is blocked.",
            "You avoid expression before the block can be felt.",
            "You want to express something but pull back from visibility.",
            "The need to express appears after the moment passes.",
        ),
        "unfinishedIdeas": (
            "You track unfinished ideas and feel their pull.",
            "You leave ideas unfinished without engaging the feeling.",
            "You start ideas, then retreat when they ask for completion.",
            "The unfinished idea starts mattering again later.",
        ),
        "visibilityOfWork": (
            "You notice the vulnerability of sharing your work.",
            "You keep work private so visibility does not become real.",
            "You want your work seen but fear what being seen will bring.",
            "Visibility lands after sharing.",
        ),
        "creativeIdentity": (
            "You notice when creativity feels connected to identity.",
            "You downplay creative identity so it does not ask anything from you.",
            "You want to claim creativity but fear pressure or judgment.",
            "Creative identity becomes clearer through repetition.",
        ),
        "makingMeaning": (
            "You turn experience into meaning quickly.",
            "You avoid meaning-making and keep things practical.",
            "You want meaning but worry you are making too much of it.",
            "Meaning emerges after distance.",
        ),
        "creativeRisk": (
            "You feel the risk before making something visible.",
            "You avoid the risk by not finishing or not sharing.",
            "You move toward the risk, then pull back.",
            "The risk feels meaningful after the fact.",
        ),
        "voiceFinding": (
            "You notice when your real voice is close.",
            "You stay with a safer voice.",
            "You want your real voice but fear it will be too much.",
            "Your real voice becomes clearer later.",
        ),
    },
)


MEANING_PURPOSE_CALLING_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Purpose, calling, meaning, direction, contribution, larger questions, spiritual or existential orientation.",
    {
        "purposePull": (
            "You notice what keeps pulling your attention.",
            "You avoid purpose questions because they feel too big.",
            "You want purpose but fear the responsibility of naming it.",
            "Purpose becomes clearer after repeated signs.",
        ),
        "meaningGap": (
            "You feel when the practical answer is not enough.",
            "You avoid meaning when it complicates life.",
            "You want meaning but resist what it may ask of you.",
            "Meaning arrives after the facts have settled.",
        ),
        "callingPressure": (
            "You feel pressure around what you are meant to do.",
            "You dismiss calling so it does not become a demand.",
            "You feel called and trapped by the call at the same time.",
            "The call feels real later.",
        ),
        "contributionNeed": (
            "You notice whether your effort contributes to something meaningful.",
            "You disconnect from contribution and just get through the task.",
            "You want impact but fear committing to a purpose.",
            "Contribution becomes visible afterward.",
        ),
        "existentialQuestion": (
            "You feel large questions entering ordinary moments.",
            "You avoid existential questions because they feel destabilizing.",
            "You want depth but fear getting lost in it.",
            "The larger question returns later.",
        ),
        "spiritualOrientation": (
            "You notice what feels spiritually grounding or misaligned.",
            "You avoid spiritual meaning when it feels too vulnerable.",
            "You want a larger frame but distrust easy answers.",
            "Spiritual meaning becomes clearer after reflection.",
        ),
        "directionThroughMeaning": (
            "You use meaning to choose direction.",
            "You drift when meaning is unclear.",
            "You want meaning to guide you but fear limiting your options.",
            "Direction appears after meaning settles.",
        ),
        "purposeAndCapacity": (
            "You notice when purpose asks more than your capacity can hold.",
            "You avoid purpose when it feels exhausting.",
            "You want to live purposefully but need it to stop consuming you.",
            "Capacity around purpose becomes clear after strain.",
        ),
    },
)


HOPE_FUTURE_POSSIBILITY_SUBCATEGORY_GUIDANCE = make_subcategory_guidance(
    "Hope, future self, possibility, optimism, fear of disappointment, imagining change.",
    {
        "hopeAccess": (
            "You notice when hope appears and how fragile it feels.",
            "You avoid hope so disappointment has less to take.",
            "You want to hope but brace against wanting too much.",
            "Hope shows up later, after the pressure lowers.",
        ),
        "futureSelf": (
            "You sense a future version of yourself before it is stable.",
            "You avoid imagining a future self because it feels unreal.",
            "You want to become that version but fear losing what is familiar.",
            "The future self becomes clearer through action.",
        ),
        "possibilityFear": (
            "You feel fear as soon as possibility opens.",
            "You keep possibility small so it cannot disappoint you.",
            "You want possibility but distrust the hope it brings.",
            "Possibility feels safer after distance.",
        ),
        "disappointmentProtection": (
            "You protect yourself from disappointment before hope grows.",
            "You avoid wanting enough for disappointment to matter.",
            "You hope, then pull back so it will hurt less.",
            "Disappointment fear appears after hope has already started.",
        ),
        "imaginingChange": (
            "You imagine change in detail.",
            "You avoid imagining change because it feels too far away.",
            "You picture change, then doubt whether it can last.",
            "The image of change becomes stronger later.",
        ),
        "futurePlanning": (
            "You start planning as soon as the future feels possible.",
            "You avoid planning because the future feels abstract.",
            "You plan, then resist being tied to the plan.",
            "Planning becomes easier after the future feels more real.",
        ),
        "optimismSuspicion": (
            "You notice when optimism feels risky.",
            "You dismiss optimism before it can land.",
            "You want optimism but keep checking for what could go wrong.",
            "Optimism becomes believable later.",
        ),
        "nextChapter": (
            "You sense the next chapter before you know what it is.",
            "You stay in the current chapter because the next one feels unclear.",
            "You move toward the next chapter and grieve the current one.",
            "The next chapter becomes visible after repeated small steps.",
        ),
    },
)


DOMAIN_DEFINITIONS: list[dict[str, object]] = [
    {
        "key": "attachmentConnection",
        "domainName": "Attachment & Connection",
        "theoryLens": [
            "attachmentTheory",
            "socialBaselineTheory",
            "repairRuptureTheory",
            "connectionSafety",
            "proximitySeeking",
            "attachmentActivationDeactivation",
        ],
        "subcategories": [
            "toneShiftSensitivity",
            "repairSeeking",
            "closenessFear",
            "abandonmentAlarm",
            "trustTesting",
            "emotionalAvailability",
            "conflictConnectionThreat",
            "connectionWorth",
        ],
        "subcategoryGuidance": ATTACHMENT_CONNECTION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "autonomySelfDetermination",
        "domainName": "Autonomy & Self-Determination",
        "theoryLens": ["selfDeterminationTheory", "autonomySupport"],
        "subcategories": [
            "pressureDetection",
            "lossOfChoice",
            "resistanceResponse",
            "internalVsExternalMotivation",
            "obligationWeight",
            "selfDirection",
            "permissionToChoose",
            "autonomyRecovery",
        ],
        "subcategoryGuidance": AUTONOMY_SELF_DETERMINATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "competenceMastery",
        "domainName": "Competence & Mastery",
        "theoryLens": ["selfEfficacy", "masteryOrientation"],
        "subcategories": [
            "fearOfFailure",
            "performancePressure",
            "skillDoubt",
            "masteryDrive",
            "comparison",
            "avoidanceOfEvaluation",
            "competenceValidation",
            "rebuildingConfidence",
        ],
        "subcategoryGuidance": COMPETENCE_MASTERY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "belongingSocialSafety",
        "domainName": "Belonging & Social Safety",
        "theoryLens": ["belongingnessTheory", "sociometerTheory"],
        "subcategories": [
            "fittingInScan",
            "fearOfExclusion",
            "maskingAdaptation",
            "groupEnergySensitivity",
            "socialComparison",
            "inclusionNeed",
            "rejectionProcessing",
            "socialSafetyCalibration",
        ],
        "subcategoryGuidance": BELONGING_SOCIAL_SAFETY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "safetyThreatDetection",
        "domainName": "Safety & Threat Detection",
        "theoryLens": ["threatDetection", "predictiveProcessing"],
        "subcategories": [
            "earlyThreatDetection",
            "bodyBracing",
            "safetyChecking",
            "hypervigilance",
            "unpredictabilityResponse",
            "relaxationDifficulty",
            "safePeopleDetection",
            "safetyRecovery",
        ],
        "subcategoryGuidance": SAFETY_THREAT_DETECTION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {"key": "stressCoping", "domainName": "Stress & Coping", "theoryLens": ["stressAppraisal", "copingTheory"], "subcategories": ["pressureBuild", "copingStyle", "overloadResponse", "functioningUnderStress", "resourceTracking", "shutdownUnderDemand", "adaptivePacing", "stressCarryover"]},
    {"key": "learnedAgency", "domainName": "Learned Helplessness vs Agency", "theoryLens": ["learnedHelplessness", "agencyTheory"], "subcategories": ["stuckness", "agencyReturn", "choiceNarrowing", "effortDoubt", "reversibleStep", "powerlessHabit", "actionRecovery", "controlAfterUncertainty"]},
    {"key": "attributionMeaningMaking", "domainName": "Attribution & Meaning-Making", "theoryLens": ["attributionTheory", "meaningMaking"], "subcategories": ["causeSearching", "storyMaking", "selfBlame", "interpretationLoops", "meaningGap", "explanationNeed", "symbolUse", "narrativeRepair"]},
    {"key": "rewardMotivationExpectancy", "domainName": "Reward, Motivation & Expectancy", "theoryLens": ["expectancyTheory", "rewardPrediction"], "subcategories": ["motivationDip", "expectedCost", "startFriction", "rewardDistance", "effortOutcomeGap", "futurePull", "desirePermission", "activationEnergy"]},
    {"key": "reinforcementPatterns", "domainName": "Reinforcement Patterns", "theoryLens": ["reinforcementLearning", "habitFormation"], "subcategories": ["habitLoop", "rewardHistory", "avoidanceReward", "responsePattern", "cueRoutine", "reliefLearning", "repeatBehavior", "behaviorMomentum"]},
    {
        "key": "avoidanceReliefLoops",
        "domainName": "Avoidance & Relief Loops",
        "theoryLens": ["operantConditioning", "behavioralEconomics"],
        "subcategories": [
            "avoidingTheStart",
            "reliefAfterAvoiding",
            "emotionalAvoidance",
            "decisionAvoidance",
            "conflictAvoidance",
            "avoidanceByBusyness",
            "avoidanceShame",
            "returningToTheThing",
        ],
        "subcategoryGuidance": AVOIDANCE_RELIEF_LOOPS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "shameSelfEvaluation",
        "domainName": "Shame & Self-Evaluation",
        "theoryLens": ["shameTheory", "selfDiscrepancyTheory"],
        "subcategories": [
            "selfCriticismSpike",
            "embarrassmentSensitivity",
            "feelingWrong",
            "innerCriticPressure",
            "visibilityShame",
            "mistakeRecovery",
            "worthQuestioning",
            "comparisonShame",
        ],
        "subcategoryGuidance": SHAME_SELF_EVALUATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "innerCriticSuperego",
        "domainName": "Inner Critic & Superego Pressure",
        "theoryLens": ["selfCriticismResearch", "psychodynamicSuperego"],
        "subcategories": [
            "shouldPressure",
            "guiltMonitoring",
            "moralResponsibility",
            "harshStandards",
            "selfPunishment",
            "perfectionisticCorrection",
            "guiltAfterRest",
            "impossibleGoodness",
        ],
        "subcategoryGuidance": INNER_CRITIC_SUPEREGO_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "defensePatterns",
        "domainName": "Defense Patterns",
        "theoryLens": ["defenseMechanisms", "adaptiveDefense"],
        "subcategories": [
            "intellectualizing",
            "minimizing",
            "humorAsProtection",
            "controlAsProtection",
            "distancing",
            "shutdownProtection",
            "overFunctioning",
            "deflection",
        ],
        "subcategoryGuidance": DEFENSE_PATTERNS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "projectionInterpretation",
        "domainName": "Projection & Interpretation",
        "theoryLens": ["projection", "mentalization"],
        "subcategories": [
            "motiveReading",
            "rejectionExpectation",
            "ambiguityFilling",
            "assumingDisappointment",
            "interpretingDistance",
            "oldStoryOverlay",
            "trustInterpretation",
            "meaningCorrection",
        ],
        "subcategoryGuidance": PROJECTION_INTERPRETATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "emotionalRegulation",
        "domainName": "Emotional Regulation",
        "theoryLens": ["emotionRegulation", "affectTolerance"],
        "subcategories": [
            "emotionalEscalation",
            "soothingNeed",
            "containment",
            "emotionalFlooding",
            "recoveryAfterEmotion",
            "emotionalControl",
            "calmingStrategies",
            "intensityMeaning",
        ],
        "subcategoryGuidance": EMOTIONAL_REGULATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "cognitiveAppraisal",
        "domainName": "Cognitive Appraisal",
        "theoryLens": ["cognitiveAppraisalTheory", "cognitiveBehavioralTheory"],
        "subcategories": [
            "threatAppraisal",
            "difficultyAppraisal",
            "resourceAppraisal",
            "meaningAppraisal",
            "controlAppraisal",
            "blameAppraisal",
            "opportunityAppraisal",
            "emotionalAppraisal",
        ],
        "subcategoryGuidance": COGNITIVE_APPRAISAL_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "executiveFunctionTaskInitiation",
        "domainName": "Executive Function & Task Initiation",
        "theoryLens": ["executiveFunction", "activationEnergy"],
        "subcategories": [
            "taskInitiation",
            "sequencingSteps",
            "mentalLoad",
            "followThroughDrop",
            "planningPressure",
            "overwhelmBeforeStarting",
            "completionDifficulty",
            "attentionSwitching",
        ],
        "subcategoryGuidance": EXECUTIVE_FUNCTION_TASK_INITIATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "timePerceptionCapacity",
        "domainName": "Time Perception & Capacity",
        "theoryLens": ["timePerception", "scarcityCognition"],
        "subcategories": [
            "timeCompression",
            "transitionStress",
            "marginAwareness",
            "urgencyLoop",
            "pacingMismatch",
            "waitingDifficulty",
            "overcommittedTime",
            "recoverySpacing",
        ],
        "subcategoryGuidance": TIME_PERCEPTION_CAPACITY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "socialLearningModeledRoles",
        "domainName": "Social Learning & Modeled Roles",
        "theoryLens": ["socialLearningTheory", "roleModeling"],
        "subcategories": [
            "learnedCaretaking",
            "conflictScripts",
            "emotionalExpressionModeling",
            "independenceScript",
            "responsibilityRole",
            "emotionalToneLearning",
            "approvalLearning",
            "inheritedCoping",
        ],
        "subcategoryGuidance": SOCIAL_LEARNING_MODELED_ROLES_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "familyRolesEarlyScripts",
        "domainName": "Family Roles & Early Scripts",
        "theoryLens": ["familySystemsTheory", "schemaTheory"],
        "subcategories": [
            "fixerRole",
            "invisibleRole",
            "scapegoatRole",
            "peacekeeperRole",
            "parentifiedRole",
            "goldenChildPressure",
            "emotionalCaretaker",
            "oldFamilyScriptActivation",
        ],
        "subcategoryGuidance": FAMILY_ROLES_EARLY_SCRIPTS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "moralResponsibilityFairness",
        "domainName": "Moral Responsibility & Fairness",
        "theoryLens": ["moralPsychology", "equityTheory"],
        "subcategories": [
            "fairnessSensitivity",
            "responsibilityQuestion",
            "guiltAfterChoice",
            "moralOverload",
            "repairObligation",
            "justiceAnger",
            "selfForgiveness",
            "ethicalClarity",
        ],
        "subcategoryGuidance": MORAL_RESPONSIBILITY_FAIRNESS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "valuesIntegrity",
        "domainName": "Values & Integrity",
        "theoryLens": ["valuesTheory", "selfConcordance"],
        "subcategories": [
            "alignmentSignal",
            "innerYesNo",
            "compromiseCost",
            "truthPressure",
            "valueConflict",
            "integrityRepair",
            "authenticityRisk",
            "valuesAsDirection",
        ],
        "subcategoryGuidance": VALUES_INTEGRITY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "identityDevelopment",
        "domainName": "Identity Development",
        "theoryLens": ["identityDevelopment", "selfConcept"],
        "subcategories": [
            "oldSelfLoosening",
            "newSelfEmerging",
            "roleConfusion",
            "selfDefinition",
            "identityVisibility",
            "belongingToSelf",
            "becomingDiscomfort",
            "selfContinuity",
        ],
        "subcategoryGuidance": IDENTITY_DEVELOPMENT_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "psychosocialTransitions",
        "domainName": "Psychosocial Transitions",
        "theoryLens": ["psychosocialDevelopment", "transitionTheory"],
        "subcategories": [
            "lifeStageShift",
            "roleTransition",
            "maturityPressure",
            "thresholdAnxiety",
            "oldLifeGrief",
            "newResponsibility",
            "belongingInNewPhase",
            "developmentalIntegration",
        ],
        "subcategoryGuidance": PSYCHOSOCIAL_TRANSITIONS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "selfActualizationGrowth",
        "domainName": "Self-Actualization & Growth",
        "theoryLens": ["selfActualization", "growthMindset"],
        "subcategories": [
            "growthEdge",
            "potentialFear",
            "authenticExpansion",
            "purposeEmergence",
            "growthResistance",
            "becomingVisible",
            "innerPermissionToGrow",
            "expansionPacing",
        ],
        "subcategoryGuidance": SELF_ACTUALIZATION_GROWTH_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "humanisticNeeds",
        "domainName": "Humanistic Needs",
        "theoryLens": ["humanisticPsychology", "basicNeeds"],
        "subcategories": [
            "unmetNeedRecognition",
            "dignityNeed",
            "esteemNeed",
            "belongingNeed",
            "safetyNeed",
            "growthNeed",
            "unconditionalWorth",
            "needHierarchyConflict",
        ],
        "subcategoryGuidance": HUMANISTIC_NEEDS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "clientCenteredSelfTrust",
        "domainName": "Client-Centered Self-Trust",
        "theoryLens": ["clientCenteredTherapy", "unconditionalPositiveRegard"],
        "subcategories": [
            "innerKnowing",
            "selfAcceptance",
            "congruenceGap",
            "trustingExperience",
            "selfCompassionAccess",
            "internalPermission",
            "emotionalHonesty",
            "selfValidation",
        ],
        "subcategoryGuidance": CLIENT_CENTERED_SELF_TRUST_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "conditionalWorth",
        "domainName": "Conditional Worth",
        "theoryLens": ["conditionsOfWorth", "selfWorthTheory"],
        "subcategories": [
            "earningCare",
            "usefulnessWorth",
            "performanceWorth",
            "provingEnough",
            "loveAsApproval",
            "restWithoutEarning",
            "receivingWithoutDebt",
            "beingEnough",
        ],
        "subcategoryGuidance": CONDITIONAL_WORTH_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "bigFiveTemperament",
        "domainName": "Big Five Temperament",
        "theoryLens": ["bigFivePersonality", "traitPsychology"],
        "subcategories": [
            "opennessToExperience",
            "conscientiousStandards",
            "extraversionEnergy",
            "agreeablenessHarmony",
            "emotionalSensitivity",
            "flexibilityRigidity",
            "noveltyCaution",
            "temperamentFit",
        ],
        "subcategoryGuidance": BIG_FIVE_TEMPERAMENT_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "introversionExtraversionEnergy",
        "domainName": "Introversion / Extraversion Energy",
        "theoryLens": ["temperamentResearch", "arousalTheory"],
        "subcategories": [
            "socialEnergyTracking",
            "solitudeNeed",
            "stimulationThreshold",
            "connectionRecharge",
            "socialWithdrawal",
            "performanceSocializing",
            "groupVsOneOnOne",
            "socialRecovery",
        ],
        "subcategoryGuidance": INTROVERSION_EXTRAVERSION_ENERGY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "opennessImagination",
        "domainName": "Openness & Imagination",
        "theoryLens": ["opennessToExperience", "imaginationResearch"],
        "subcategories": [
            "curiositySpark",
            "innerWorldDepth",
            "noveltyPull",
            "imaginativeProcessing",
            "possibilityExpansion",
            "creativeRisk",
            "wonderAccess",
            "meaningThroughImage",
        ],
        "subcategoryGuidance": OPENNESS_IMAGINATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "conscientiousnessStandards",
        "domainName": "Conscientiousness & Standards",
        "theoryLens": ["conscientiousness", "goalSystemsTheory"],
        "subcategories": [
            "detailTracking",
            "dutyPressure",
            "orderNeed",
            "followThroughStandards",
            "responsibilityIdentity",
            "preparationNeed",
            "mistakePrevention",
            "completionRelief",
        ],
        "subcategoryGuidance": CONSCIENTIOUSNESS_STANDARDS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "agreeablenessHarmony",
        "domainName": "Agreeableness & Harmony",
        "theoryLens": ["agreeableness", "conflictAvoidance"],
        "subcategories": [
            "harmonyTracking",
            "peoplePleasing",
            "kindnessOverextension",
            "resentmentSignal",
            "conflictSoftening",
            "cooperationNeed",
            "emotionalAccommodation",
            "sayingNoDifficulty",
        ],
        "subcategoryGuidance": AGREEABLENESS_HARMONY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "neuroticismSensitivity",
        "domainName": "Neuroticism / Sensitivity",
        "theoryLens": ["traitNeuroticism", "differentialSusceptibility"],
        "subcategories": [
            "worryLoop",
            "moodShiftSensitivity",
            "threatSensitivity",
            "emotionalIntensity",
            "reassuranceNeed",
            "sensitivityShame",
            "emotionalForecasting",
            "intensityRecovery",
        ],
        "subcategoryGuidance": NEUROTICISM_SENSITIVITY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "cognitiveStyleProcessing",
        "domainName": "Cognitive Style & Processing",
        "theoryLens": ["cognitiveStyle", "informationProcessing"],
        "subcategories": [
            "analyticalProcessing",
            "verbalProcessing",
            "contextBuilding",
            "mentalOrganization",
            "processingDelay",
            "clarityPressure",
            "thoughtSpirals",
            "meaningThroughLanguage",
        ],
        "subcategoryGuidance": COGNITIVE_STYLE_PROCESSING_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "aptitudeStrengthPatterns",
        "domainName": "Aptitude & Strength Patterns",
        "theoryLens": ["strengthsPsychology", "multipleIntelligences"],
        "subcategories": [
            "naturalStrengthRecognition",
            "learningStyle",
            "skillConfidence",
            "hiddenAptitude",
            "underusedStrength",
            "masteryPath",
            "feedbackIntegration",
            "strengthOwnership",
        ],
        "subcategoryGuidance": APTITUDE_STRENGTH_PATTERNS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "behavioralTemperament",
        "domainName": "Behavioral Temperament",
        "theoryLens": ["temperamentTheory", "behavioralActivationInhibition"],
        "subcategories": [
            "approachTendency",
            "withdrawalTendency",
            "persistenceStyle",
            "adaptability",
            "intensityStyle",
            "inhibition",
            "rhythmConsistency",
            "reactivityThreshold",
        ],
        "subcategoryGuidance": BEHAVIORAL_TEMPERAMENT_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "coreBeliefs",
        "domainName": "Core Beliefs",
        "theoryLens": ["schemaTherapy", "coreBeliefModel"],
        "subcategories": [
            "beliefAboutSelf",
            "beliefAboutOthers",
            "beliefAboutSafety",
            "beliefAboutWorth",
            "beliefAboutLove",
            "beliefAboutEffort",
            "beliefAboutChange",
            "beliefRevision",
        ],
        "subcategoryGuidance": CORE_BELIEFS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "lifeExperiencesAdaptation",
        "domainName": "Life Experiences & Adaptation",
        "theoryLens": ["adaptation", "developmentalLearning"],
        "subcategories": [
            "pastPresentEcho",
            "adaptiveStrategy",
            "survivalSkillCost",
            "adaptationToPressure",
            "learnedSelfProtection",
            "normalizingTheHardThing",
            "resourcefulness",
            "changingOldAdaptations",
        ],
        "subcategoryGuidance": LIFE_EXPERIENCES_ADAPTATION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "socialIdentityBelonging",
        "domainName": "Social Identity & Belonging",
        "theoryLens": ["socialIdentityTheory", "belongingResearch"],
        "subcategories": [
            "groupBelonging",
            "differenceAwareness",
            "identityMembership",
            "outsiderFeeling",
            "communitySafety",
            "sharedLanguage",
            "belongingAfterExclusion",
            "chosenCommunity",
        ],
        "subcategoryGuidance": SOCIAL_IDENTITY_BELONGING_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "powerVoiceAgency",
        "domainName": "Power, Voice & Agency",
        "theoryLens": ["empowermentTheory", "voiceBehavior"],
        "subcategories": [
            "speakingUp",
            "voiceSuppression",
            "agencyClaiming",
            "beingHeard",
            "powerlessness",
            "assertiveNeed",
            "influenceAwareness",
            "reclaimingVoice",
        ],
        "subcategoryGuidance": POWER_VOICE_AGENCY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "boundariesExchange",
        "domainName": "Boundaries & Exchange",
        "theoryLens": ["boundaryTheory", "exchangeTheory"],
        "subcategories": [
            "reciprocityTracking",
            "overGiving",
            "receivingDifficulty",
            "limitRecognition",
            "unequalExchange",
            "sayingYesCost",
            "boundaryRepair",
            "energyAccounting",
        ],
        "subcategoryGuidance": BOUNDARIES_EXCHANGE_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "socialExchangeReciprocity",
        "domainName": "Social Exchange & Reciprocity",
        "theoryLens": ["socialExchangeTheory", "reciprocityNorms"],
        "subcategories": [
            "emotionalDebt",
            "effortBalance",
            "mutualCare",
            "fairnessInSupport",
            "relationalInvestment",
            "obligationAfterCare",
            "careWithoutTransaction",
            "reciprocityRepair",
        ],
        "subcategoryGuidance": SOCIAL_EXCHANGE_RECIPROCITY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "pleasureDesirePermission",
        "domainName": "Pleasure, Desire & Permission",
        "theoryLens": ["selfDeterminationTheory", "rewardSystems"],
        "subcategories": [
            "desireRecognition",
            "pleasurePermission",
            "sensualComfort",
            "wantingWithoutEarning",
            "pleasureAfterPressure",
            "shameAroundDesire",
            "joyInTheBody",
            "easeWithoutProductivity",
        ],
        "subcategoryGuidance": PLEASURE_DESIRE_PERMISSION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "embodimentSomaticSignals",
        "domainName": "Embodiment & Somatic Signals",
        "theoryLens": ["interoception", "somaticPsychology"],
        "subcategories": [
            "chestSignal",
            "gutDrop",
            "breathChange",
            "bodyMemory",
            "embodiedKnowing",
            "tensionPattern",
            "sensationAvoidance",
            "bodyReturn",
        ],
        "subcategoryGuidance": EMBODIMENT_SOMATIC_SIGNALS_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "restRecoveryDepletion",
        "domainName": "Rest, Recovery & Depletion",
        "theoryLens": ["recoveryTheory", "allostaticLoad"],
        "subcategories": [
            "depletionAwareness",
            "restResistance",
            "recoveryWindow",
            "sleepDebt",
            "burnoutSignals",
            "restorationNeed",
            "restWorthiness",
            "postStressCrash",
        ],
        "subcategoryGuidance": REST_RECOVERY_DEPLETION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "creativityExpression",
        "domainName": "Creativity & Expression",
        "theoryLens": ["creativeProcess", "expressiveTherapies"],
        "subcategories": [
            "creativePressure",
            "expressionBlock",
            "unfinishedIdeas",
            "visibilityOfWork",
            "creativeIdentity",
            "makingMeaning",
            "creativeRisk",
            "voiceFinding",
        ],
        "subcategoryGuidance": CREATIVITY_EXPRESSION_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "meaningPurposeCalling",
        "domainName": "Meaning, Purpose & Calling",
        "theoryLens": ["existentialPsychology", "meaningMaking"],
        "subcategories": [
            "purposePull",
            "meaningGap",
            "callingPressure",
            "contributionNeed",
            "existentialQuestion",
            "spiritualOrientation",
            "directionThroughMeaning",
            "purposeAndCapacity",
        ],
        "subcategoryGuidance": MEANING_PURPOSE_CALLING_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
    {
        "key": "hopeFuturePossibility",
        "domainName": "Hope, Future & Possibility",
        "theoryLens": ["hopeTheory", "futureSelf"],
        "subcategories": [
            "hopeAccess",
            "futureSelf",
            "possibilityFear",
            "disappointmentProtection",
            "imaginingChange",
            "futurePlanning",
            "optimismSuspicion",
            "nextChapter",
        ],
        "subcategoryGuidance": HOPE_FUTURE_POSSIBILITY_SUBCATEGORY_GUIDANCE,
        "excludeFromDreamInsights": False,
        "includeInTodayInsights": True,
        "includeInPatternScreen": True,
    },
]


def domain_field_values(field: str) -> list[str]:
    return [str(domain[field]) for domain in DOMAIN_DEFINITIONS]


DOMAIN_BY_KEY = {str(domain["key"]): domain for domain in DOMAIN_DEFINITIONS}


CATEGORY_DOMAIN_MAP = {
    "emotionalWeather": ("emotionalRegulation", "recoveryAfterEmotion"),
    "restCapacity": ("restRecoveryDepletion", "depletionAwareness"),
    "bodySignals": ("embodimentSomaticSignals", "embodiedKnowing"),
    "supportBelonging": ("belongingSocialSafety", "inclusionNeed"),
    "relationships": ("attachmentConnection", "toneShiftSensitivity"),
    "boundariesSelfTrust": ("boundariesExchange", "limitRecognition"),
    "valuesIntegrity": ("valuesIntegrity", "alignmentSignal"),
    "cognitiveStyle": ("cognitiveStyleProcessing", "clarityPressure"),
    "dreamsSymbols": ("opennessImagination", "meaningThroughImage"),
    "glimmersRegulation": ("emotionalRegulation", "calmingStrategies"),
    "creativityExpression": ("creativityExpression", "expressionBlock"),
    "identityGrowth": ("identityDevelopment", "newSelfEmerging"),
    "familyHome": ("familyRolesEarlyScripts", "oldFamilyScriptActivation"),
    "scarcityAbundance": ("stressCoping", "resourceTracking"),
    "natalChartReflection": ("meaningPurposeCalling", "meaningGap"),
    "responsibilityCare": ("moralResponsibilityFairness", "responsibilityQuestion"),
    "workAmbition": ("competenceMastery", "performancePressure"),
    "griefTransitions": ("psychosocialTransitions", "oldLifeGrief"),
    "timeRhythms": ("timePerceptionCapacity", "timeCompression"),
    "selfWorthReceiving": ("conditionalWorth", "receivingWithoutDebt"),
    "communicationVoice": ("powerVoiceAgency", "beingHeard"),
    "spiritualMeaning": ("meaningPurposeCalling", "spiritualOrientation"),
    "safetyRegulation": ("safetyThreatDetection", "bodyBracing"),
    "lifeDirection": ("hopeFuturePossibility", "nextChapter"),
    "pleasurePlay": ("pleasureDesirePermission", "joyInTheBody"),
}

DOMAIN_LEGACY_CATEGORY_MAP = {
    "attachmentConnection": "relationships",
    "autonomySelfDetermination": "boundariesSelfTrust",
    "competenceMastery": "workAmbition",
    "belongingSocialSafety": "supportBelonging",
    "safetyThreatDetection": "safetyRegulation",
    "stressCoping": "scarcityAbundance",
    "learnedAgency": "lifeDirection",
    "attributionMeaningMaking": "spiritualMeaning",
    "rewardMotivationExpectancy": "lifeDirection",
    "reinforcementPatterns": "cognitiveStyle",
    "avoidanceReliefLoops": "cognitiveStyle",
    "shameSelfEvaluation": "selfWorthReceiving",
    "innerCriticSuperego": "selfWorthReceiving",
    "defensePatterns": "safetyRegulation",
    "projectionInterpretation": "relationships",
    "emotionalRegulation": "emotionalWeather",
    "cognitiveAppraisal": "cognitiveStyle",
    "executiveFunctionTaskInitiation": "workAmbition",
    "timePerceptionCapacity": "timeRhythms",
    "socialLearningModeledRoles": "familyHome",
    "familyRolesEarlyScripts": "familyHome",
    "moralResponsibilityFairness": "responsibilityCare",
    "valuesIntegrity": "valuesIntegrity",
    "identityDevelopment": "identityGrowth",
    "psychosocialTransitions": "griefTransitions",
    "selfActualizationGrowth": "identityGrowth",
    "humanisticNeeds": "supportBelonging",
    "clientCenteredSelfTrust": "cognitiveStyle",
    "conditionalWorth": "selfWorthReceiving",
    "bigFiveTemperament": "cognitiveStyle",
    "introversionExtraversionEnergy": "restCapacity",
    "opennessImagination": "creativityExpression",
    "conscientiousnessStandards": "workAmbition",
    "agreeablenessHarmony": "relationships",
    "neuroticismSensitivity": "emotionalWeather",
    "cognitiveStyleProcessing": "cognitiveStyle",
    "aptitudeStrengthPatterns": "workAmbition",
    "behavioralTemperament": "bodySignals",
    "coreBeliefs": "selfWorthReceiving",
    "lifeExperiencesAdaptation": "familyHome",
    "socialIdentityBelonging": "supportBelonging",
    "powerVoiceAgency": "communicationVoice",
    "boundariesExchange": "boundariesSelfTrust",
    "socialExchangeReciprocity": "supportBelonging",
    "pleasureDesirePermission": "pleasurePlay",
    "embodimentSomaticSignals": "bodySignals",
    "restRecoveryDepletion": "restCapacity",
    "creativityExpression": "creativityExpression",
    "meaningPurposeCalling": "spiritualMeaning",
    "hopeFuturePossibility": "lifeDirection",
}

DOMAIN_SOURCE_BANKS = {
    "attachmentConnection": ["relationshipMirror", "triggerLog", "journal"],
    "autonomySelfDetermination": ["journal", "reflectionBank", "triggerLog"],
    "competenceMastery": ["dailyCheckIn", "journal", "reflectionBank"],
    "belongingSocialSafety": ["relationshipMirror", "journal", "dailyCheckIn"],
    "safetyThreatDetection": ["bodyMap", "triggerLog", "dailyCheckIn"],
    "stressCoping": ["dailyCheckIn", "bodyMap", "journal"],
    "learnedAgency": ["journal", "reflectionBank", "dailyCheckIn"],
    "attributionMeaningMaking": ["journal", "reflectionBank", "dailyCheckIn"],
    "rewardMotivationExpectancy": ["dailyCheckIn", "journal", "glimmerLog"],
    "reinforcementPatterns": ["dailyCheckIn", "journal", "triggerLog"],
    "avoidanceReliefLoops": ["dailyCheckIn", "journal", "triggerLog"],
    "shameSelfEvaluation": ["journal", "triggerLog", "relationshipMirror"],
    "innerCriticSuperego": ["journal", "dailyCheckIn", "reflectionBank"],
    "defensePatterns": ["triggerLog", "journal", "bodyMap"],
    "projectionInterpretation": ["relationshipMirror", "journal", "triggerLog"],
    "emotionalRegulation": ["dailyCheckIn", "triggerLog", "bodyMap"],
    "cognitiveAppraisal": ["journal", "triggerLog", "reflectionBank"],
    "executiveFunctionTaskInitiation": ["dailyCheckIn", "journal", "sleep"],
    "timePerceptionCapacity": ["dailyCheckIn", "journal", "sleep"],
    "socialLearningModeledRoles": ["relationshipMirror", "journal", "reflectionBank"],
    "familyRolesEarlyScripts": ["relationshipMirror", "journal", "triggerLog"],
    "moralResponsibilityFairness": ["journal", "relationshipMirror", "triggerLog"],
    "valuesIntegrity": ["journal", "reflectionBank", "dailyCheckIn"],
    "identityDevelopment": ["journal", "reflectionBank", "dailyCheckIn"],
    "psychosocialTransitions": ["journal", "dailyCheckIn", "reflectionBank"],
    "selfActualizationGrowth": ["journal", "reflectionBank", "glimmerLog"],
    "humanisticNeeds": ["dailyCheckIn", "journal", "relationshipMirror"],
    "clientCenteredSelfTrust": ["journal", "reflectionBank", "dailyCheckIn"],
    "conditionalWorth": ["journal", "relationshipMirror", "reflectionBank"],
    "bigFiveTemperament": ["dailyCheckIn", "journal", "reflectionBank"],
    "introversionExtraversionEnergy": ["dailyCheckIn", "journal", "sleep"],
    "opennessImagination": ["journal", "glimmerLog", "reflectionBank"],
    "conscientiousnessStandards": ["dailyCheckIn", "journal", "reflectionBank"],
    "agreeablenessHarmony": ["relationshipMirror", "triggerLog", "journal"],
    "neuroticismSensitivity": ["dailyCheckIn", "triggerLog", "bodyMap"],
    "cognitiveStyleProcessing": ["journal", "reflectionBank", "dailyCheckIn"],
    "aptitudeStrengthPatterns": ["reflectionBank", "journal", "dailyCheckIn"],
    "behavioralTemperament": ["dailyCheckIn", "bodyMap", "journal"],
    "coreBeliefs": ["journal", "reflectionBank", "relationshipMirror"],
    "lifeExperiencesAdaptation": ["journal", "triggerLog", "reflectionBank"],
    "socialIdentityBelonging": ["relationshipMirror", "journal", "reflectionBank"],
    "powerVoiceAgency": ["journal", "relationshipMirror", "triggerLog"],
    "boundariesExchange": ["relationshipMirror", "triggerLog", "journal"],
    "socialExchangeReciprocity": ["relationshipMirror", "journal", "triggerLog"],
    "pleasureDesirePermission": ["glimmerLog", "dailyCheckIn", "journal"],
    "embodimentSomaticSignals": ["bodyMap", "triggerLog", "dailyCheckIn"],
    "restRecoveryDepletion": ["sleep", "dailyCheckIn", "bodyMap"],
    "creativityExpression": ["journal", "reflectionBank", "glimmerLog"],
    "meaningPurposeCalling": ["journal", "reflectionBank", "dailyCheckIn"],
    "hopeFuturePossibility": ["journal", "reflectionBank", "dailyCheckIn"],
}

SUBCATEGORY_SIGNAL_OVERRIDES = {
    "toneShiftSensitivity": ["tone_shift", "reply_delay", "pause_after_speaking", "emotional_energy_shift"],
    "taskInitiation": ["unfinished_task", "start_friction", "energy_low", "daily_stress"],
    "receivingWithoutDebt": ["support_offered", "care_debt", "receiving_support", "belonging_reflection"],
    "repairSeeking": ["repair_need", "closure_need", "reassurance_seeking"],
    "closenessFear": ["closeness_exposure", "pulling_back", "emotional_intimacy"],
    "abandonmentAlarm": ["distance_scan", "ignored_signal", "left_out_fear"],
    "trustTesting": ["consistency_check", "care_reliability", "trust_question"],
    "emotionalAvailability": ["presence_check", "attunement_gap", "distracted_connection"],
    "conflictConnectionThreat": ["conflict_threat", "rupture_scan", "bond_safety"],
    "connectionWorth": ["chosen_signal", "priority_check", "feeling_remembered"],
}

SUBCATEGORY_ANCHOR_OVERRIDES = {
    "toneShiftSensitivity": ["tone-shift", "repair", "connection-safety", "reply-delay"],
    "repairSeeking": ["repair", "reassurance", "closure"],
    "taskInitiation": ["unfinished-task", "start-friction", "low-energy"],
    "receivingWithoutDebt": ["receiving-care", "support", "emotional-debt"],
}

PATTERN_TYPE_BY_CURATED_ID = {
    "relationships_tone_shift_gold_001": "highTracking",
    "relationships_tone_shift_gold_002": "highTracking",
    "responsibilityCare_invisible_load_gold_001": "highTracking",
    "responsibilityCare_fall_apart_gold_002": "highTracking",
    "responsibilityCare_noticing_takeover_gold_003": "highTracking",
    "bodySignals_chest_alert_gold_001": "highTracking",
    "bodySignals_body_shift_gold_002": "highTracking",
    "bodySignals_alert_without_reason_gold_003": "highTracking",
    "timeRhythms_stacking_pressure_gold_001": "highTracking",
    "timeRhythms_next_thing_gold_002": "highTracking",
    "timeRhythms_stack_pace_gold_003": "highTracking",
    "communicationVoice_clarity_gold_001": "highTracking",
    "communicationVoice_landing_gold_002": "highTracking",
    "communicationVoice_misread_protection_gold_003": "highTracking",
    "selfWorthReceiving_support_gold_001": "pushPull",
    "selfWorthReceiving_genuine_offer_gold_002": "pushPull",
    "selfWorthReceiving_step_back_gold_003": "pushPull",
    "emotionalWeather_unresolved_replay_gold_001": "delayedActivation",
    "emotionalWeather_carryover_gold_001": "delayedActivation",
    "emotionalWeather_delayed_reactions_gold_001": "delayedActivation",
    "emotionalWeather_unresolved_quiet_return_gold_002": "delayedActivation",
    "boundariesSelfTrust_early_line_gold_001": "highTracking",
    "boundariesSelfTrust_cost_signal_gold_002": "highTracking",
    "boundariesSelfTrust_crossed_line_gold_003": "highTracking",
    "pleasurePlay_joy_check_gold_001": "pushPull",
    "pleasurePlay_ease_edge_gold_002": "pushPull",
    "pleasurePlay_outside_ease_gold_003": "pushPull",
    "identityGrowth_change_gold_001": "pushPull",
    "identityGrowth_visible_shift_gold_002": "pushPull",
    "identityGrowth_catching_up_gold_003": "pushPull",
    "relationships_unfinished_conversations_gold_001": "delayedActivation",
    "relationships_conversation_disconnection_gold_001": "lowAccess",
    "relationships_emotional_distance_gold_001": "lowAccess",
    "relationships_avoiding_conflict_gold_001": "lowAccess",
    "safetyRegulation_tighten_pullback_gold_001": "highTracking",
    "safetyRegulation_control_gold_001": "highTracking",
    "safetyRegulation_emotional_numbness_gold_001": "lowAccess",
    "safetyRegulation_zoning_out_gold_001": "lowAccess",
    "safetyRegulation_under_surface_stress_gold_001": "delayedActivation",
    "workAmbition_unseen_effort_gold_001": "highTracking",
    "workAmbition_pressure_build_gold_001": "highTracking",
    "cognitiveStyle_ambiguity_gold_001": "highTracking",
    "cognitiveStyle_anticipation_gold_001": "highTracking",
    "supportBelonging_independence_gold_001": "lowAccess",
    "supportBelonging_doing_it_yourself_gold_001": "lowAccess",
    "supportBelonging_letting_people_in_gold_001": "lowAccess",
    "emotionalWeather_subtle_shifts_gold_001": "highTracking",
    "emotionalWeather_letting_go_gold_001": "delayedActivation",
    "emotionalWeather_minimizing_problems_gold_001": "lowAccess",
    "emotionalWeather_surface_talk_gold_001": "lowAccess",
    "emotionalWeather_naming_feelings_gold_001": "lowAccess",
    "emotionalWeather_quiet_reactions_gold_001": "lowAccess",
    "lifeDirection_avoidance_gold_001": "lowAccess",
    "lifeDirection_procrastination_loop_gold_001": "lowAccess",
    "lifeDirection_indecision_gold_001": "lowAccess",
    "lifeDirection_disconnected_goals_gold_001": "lowAccess",
    "lifeDirection_drift_gold_001": "lowAccess",
}


GENERIC_MICRO_MOMENTS = {
    "highTracking": [
        "when the first small shift appears",
        "when something starts changing before anyone names it",
        "when a detail feels louder than it should",
        "when the moment begins asking more from you",
    ],
    "lowAccess": [
        "when the moment asks for more than you can reach",
        "when it feels easier to keep things simple",
        "when naming it would make it more real",
        "when staying on the surface helps you get through",
    ],
    "pushPull": [
        "when you want the thing and also need distance from it",
        "when one part of you leans in and another part holds back",
        "when both needs are true at the same time",
        "when closeness to the moment asks more than you expected",
    ],
    "delayedActivation": [
        "after you already moved on",
        "when the quiet later gives the feeling room",
        "hours after the moment ended",
        "when you realize afterward that it mattered",
    ],
}


GENERIC_ACTIONS = {
    "highTracking": [
        "you scan for what changed",
        "you start solving before anyone asks",
        "you brace before the moment is clear",
        "you try to catch the loose end early",
    ],
    "lowAccess": [
        "you keep the answer simple",
        "you move around the feeling instead of into it",
        "you let the moment pass without naming it",
        "you stay functional and leave the deeper part untouched",
    ],
    "pushPull": [
        "you reach forward and pull back in the same breath",
        "you want access but start guarding the door",
        "you soften toward it while preparing to step away",
        "you keep one part close and one part protected",
    ],
    "delayedActivation": [
        "you tell yourself it was fine and replay it later",
        "you move on first and feel it afterward",
        "you seem calm until the quiet gives it room",
        "you minimize it first and connect the dots later",
    ],
}


MICRO_MOMENT_BANKS = {
    "relationships": {
        "highTracking": ["when someone’s tone changes", "when the reply takes longer than expected", "when there is a pause after you speak", "when the energy between you shifts"],
        "lowAccess": ["when a conversation starts getting too personal", "when someone wants to talk before you are ready", "when conflict begins and you go quiet", "when closeness asks more from you than you expected"],
        "pushPull": ["when you want closeness but also need space", "when someone reaches for you and you tense before leaning in", "when repair matters but the conversation feels like too much", "when you want to be understood without being exposed"],
        "delayedActivation": ["after you said it was fine", "hours after the conversation ended", "when the room is quiet and the interaction comes back", "when you realize later that something bothered you"],
    },
    "communicationVoice": {
        "highTracking": ["when a sentence could be taken the wrong way", "when someone is waiting for your answer", "when the meaning matters and the words feel fragile", "when a small misunderstanding could change the whole conversation"],
        "lowAccess": ["when explaining it would take too much energy", "when you choose the shorter answer", "when the conversation asks for more clarity than you have", "when you leave the important part implied"],
        "pushPull": ["when you want to be honest but not exposed", "when you want clarity and also want the conversation to end", "when you need to say it but dread how it will land", "when being understood matters but explaining feels costly"],
        "delayedActivation": ["after you already sent the message", "later when the words replay in your head", "after the conversation ends and the better sentence appears", "when you realize afterward what you meant to say"],
    },
    "responsibilityCare": {
        "highTracking": ["when a loose end appears", "when care starts turning into a task", "when something might fall through", "when no one else notices what needs holding"],
        "lowAccess": ["when the need feels too large to touch", "when you step around the responsibility for a moment", "when helping would pull more from you than you have", "when you let the loose end sit because picking it up feels heavy"],
        "pushPull": ["when you want to help but resent being needed", "when care matters and you also want to be free", "when you start carrying it and hate how automatic it feels", "when support is needed but you do not want to become the support"],
        "delayedActivation": ["after you said yes too quickly", "later when you realize how much you took on", "after the room calms down and the weight catches up", "when the task is over and resentment finally appears"],
    },
    "bodySignals": {
        "highTracking": ["when your chest tightens before you understand why", "when your stomach drops without a clear reason", "when your breath changes before the story is clear", "when your body goes alert before your mind catches up"],
        "lowAccess": ["when the sensation is there but you keep moving", "when you try to think past what your body is saying", "when the feeling has no clean label yet", "when noticing the body would slow everything down"],
        "pushPull": ["when you want to ignore the sensation but keep checking it", "when part of you trusts the body and another part doubts it", "when the feeling asks for care and you want it to disappear", "when your body gets loud and you try to stay normal"],
        "delayedActivation": ["after the day quiets and the body finally speaks", "hours after you pushed through the sensation", "when you stop moving and realize you were tense", "when the body reports what you skipped earlier"],
    },
    "timeRhythms": {
        "highTracking": ["when the day starts stacking up", "during a rushed transition", "when the next thing is already pulling at you", "when too many tasks crowd the same hour"],
        "lowAccess": ["when starting feels heavier than waiting", "when the day drifts without a clear next step", "when time passes and the task stays untouched", "when the pace asks more than you can enter"],
        "pushPull": ["when you want structure but resist being boxed in", "when you crave rest and still chase the next task", "when you want to slow down but keep speeding up", "when the plan helps and also makes you feel trapped"],
        "delayedActivation": ["after the deadline has passed", "later when the skipped margin catches up", "when the rush ends and you feel how tired you are", "after you realize the whole day was spent catching up"],
    },
    "selfWorthReceiving": {
        "highTracking": ["when someone offers help before you ask", "when kindness arrives and you immediately measure it", "when support shows up and you look for the catch", "when receiving makes you visible"],
        "lowAccess": ["when care is offered and you deflect it", "when you keep the need smaller than it is", "when accepting help would feel too exposed", "when you make the moment easier by needing less"],
        "pushPull": ["when you want support but distrust how it arrives", "when part of you softens and another part checks the cost", "when care feels good and suspicious at the same time", "when you want to receive without owing anything back"],
        "delayedActivation": ["after you already minimized the help", "later when the kindness finally lands", "when you realize afterward that you wanted more support", "after you deflected and then felt the absence"],
    },
    "safetyRegulation": {
        "highTracking": ["when a room feels slightly different", "when something changes before anyone says why", "when your body tightens before there is a clear problem", "when uncertainty enters quickly"],
        "lowAccess": ["when everything feels muted", "when checking out feels easier than staying present", "when staying steady means feeling less", "when the moment gets too full and you go quiet inside"],
        "pushPull": ["when you want to settle but keep scanning", "when part of you feels safe and another part stays ready", "when you want to trust the room but your body holds back", "when calm is available but not believable yet"],
        "delayedActivation": ["after you leave the room", "when the quiet later shows how tense you were", "hours after you acted fine", "when your body softens and you realize how guarded you were"],
    },
    "pleasurePlay": {
        "highTracking": ["when ease appears and you check what is unfinished", "when joy shows up before everything is handled", "when a good moment asks to be trusted", "when lightness arrives and you scan for what could interrupt it"],
        "lowAccess": ["when pleasure feels easier to postpone", "when you stay near joy without entering it", "when ease feels unfamiliar enough to keep at a distance", "when wanting something simple feels oddly hard"],
        "pushPull": ["when you want the good thing and also watch it carefully", "when part of you enjoys it and another part waits for it to end", "when ease feels inviting and unsafe at the same time", "when joy asks you to stop proving your usefulness"],
        "delayedActivation": ["after the good moment has passed", "later when you realize you did not fully let it in", "when the memory feels warmer than the moment did", "after you notice how quickly you checked out of ease"],
    },
    "griefTransitions": {
        "highTracking": ["when a before-and-after moment appears", "when something familiar is missing", "when change shows up in a small ordinary detail", "when the old version of life is suddenly not there"],
        "lowAccess": ["when the loss feels too large to touch directly", "when you keep the day practical so the grief stays quiet", "when naming what changed would make it too real", "when you move around the goodbye instead of into it"],
        "pushPull": ["when you want to move forward but keep reaching back", "when part of you accepts the change and another part refuses it", "when the new life needs you and the old one still calls", "when you want closure but do not want to let go"],
        "delayedActivation": ["after the change has already happened", "later when an ordinary detail brings it back", "when everyone else has moved on and the loss gets louder", "when the quiet makes the goodbye real"],
    },
    "identityGrowth": {
        "highTracking": ["when you notice yourself acting differently", "when an old role no longer fits", "when a new version of you appears in a small choice", "when the future feels close but not stable"],
        "lowAccess": ["when change feels easier to delay", "when staying familiar feels simpler than naming what is shifting", "when the next step does not feel real yet", "when becoming asks more than you can access"],
        "pushPull": ["when you want the new life and miss the old shape", "when one part of you leans forward and another part holds back", "when growth feels exciting and destabilizing at once", "when becoming asks you to leave something known"],
        "delayedActivation": ["after the old role no longer works", "later when you realize you have already changed", "when the shift becomes obvious after the fact", "when you look back and see you were becoming all along"],
    },
}


ACTION_BANKS = {
    "relationships": {
        "highTracking": ["you replay the last few seconds", "you measure the distance", "you look for where repair might be needed", "you brace before the moment has broken"],
        "lowAccess": ["you go quiet before you know what you feel", "you keep the conversation on the surface", "you give a short answer so it does not go deeper", "you let the moment pass without naming what happened"],
        "pushPull": ["you reach for connection and then pull back from being seen", "you want repair but dread the conversation", "you soften toward them and guard yourself at the same time", "you keep one foot in closeness and one foot near the exit"],
        "delayedActivation": ["you tell yourself it was fine and then replay it later", "you move on in the moment and feel it hours afterward", "you realize later that your body never fully settled", "you seem calm until the quiet gives the feeling room"],
    },
    "communicationVoice": {
        "highTracking": ["you revise the sentence before it leaves your mouth", "you add context so the meaning cannot bend", "you hear the possible misunderstanding before it happens", "you try to make the words land cleanly"],
        "lowAccess": ["you keep the answer shorter than the truth", "you leave out the part that would take too much explaining", "you let the unclear thing stay unclear", "you move past the sentence before it asks for more"],
        "pushPull": ["you want to explain and then decide it is safer not to", "you reach for honesty and then soften it down", "you say enough to be understood but not enough to feel exposed", "you hold the truest sentence back while trying to stay connected"],
        "delayedActivation": ["you replay what you said after the room is quiet", "you think of the honest sentence later", "you realize afterward what you meant", "you feel the weight of the words after they are already gone"],
    },
    "responsibilityCare": {
        "highTracking": ["you notice the loose end before anyone asks", "you start filling the gap before it is named", "you prepare to hold what might fall through", "you take responsibility before checking if it belongs to you"],
        "lowAccess": ["you leave the task untouched because touching it would pull too much", "you step around the need and keep the day moving", "you let someone else notice first if they are going to", "you keep the care small so it does not become a job"],
        "pushPull": ["you pick it up and then resent how quickly it became yours", "you want to help and also want someone else to see the weight", "you take over while wishing you did not have to", "you care deeply and feel trapped by being useful"],
        "delayedActivation": ["you realize later how much you carried", "you feel the resentment after the task is done", "you say yes first and count the cost afterward", "you notice the weight once nobody needs you for a minute"],
    },
    "bodySignals": {
        "highTracking": ["you track the chest, the breath, and the shift", "you scan the sensation for what it knows", "you keep moving while your body stays alert", "you notice the body before the story has caught up"],
        "lowAccess": ["you keep functioning around the sensation", "you try to think past what your body is saying", "you leave the feeling unnamed because naming it would slow you down", "you stay busy enough not to feel it fully"],
        "pushPull": ["you check the sensation and then dismiss it", "you want to trust the body and also want it to be wrong", "you listen for a second and then push ahead", "you treat the signal as real and inconvenient at the same time"],
        "delayedActivation": ["you feel the tension once everything gets quiet", "you realize later that your body never relaxed", "you notice the ache after you stop moving", "you understand afterward what the sensation was carrying"],
    },
    "timeRhythms": {
        "highTracking": ["you move faster before anyone asks you to", "you skip the pause that would help you arrive", "you start planning the next thing before this one ends", "you try to outrun the pileup"],
        "lowAccess": ["you wait a little longer and the task stays where it is", "you let the day drift because starting feels too heavy", "you avoid the first step until the pressure grows", "you keep time moving without entering the thing"],
        "pushPull": ["you want a plan and resist the pressure it brings", "you crave space but keep filling it", "you slow down for a moment and then speed back up", "you want rest while tracking everything unfinished"],
        "delayedActivation": ["you feel the rush after the day is already over", "you notice later that you never landed", "you realize afterward how much margin was missing", "you catch the exhaustion once the next demand stops"],
    },
    "selfWorthReceiving": {
        "highTracking": ["you measure the offer before it can land", "you check what the kindness might cost", "you look for the expectation underneath the help", "you try to stay even before receiving too much"],
        "lowAccess": ["you minimize the need before anyone can meet it", "you deflect the care and keep the moment light", "you accept less than what was offered", "you make yourself easy to help by needing almost nothing"],
        "pushPull": ["you want the support and scan for the debt", "you soften toward the care and step back from needing it", "you let some of it in while guarding the rest", "you want to receive without being changed by it"],
        "delayedActivation": ["you feel the care after you have already deflected it", "you realize later that you wanted to let it in", "you notice the ache after the offer has passed", "you understand afterward how much support mattered"],
    },
    "safetyRegulation": {
        "highTracking": ["you scan the room before anything is named", "you tighten before there is a clear reason", "you track the small change and prepare for more", "you stay ready before the moment asks for it"],
        "lowAccess": ["you go muted so the moment stays manageable", "you step back inside yourself without announcing it", "you keep functioning while feeling less", "you let distance make the room simpler"],
        "pushPull": ["you want to settle and keep checking anyway", "you trust the room for a second and then pull back", "you soften slightly while staying ready", "you let calm come close without fully believing it"],
        "delayedActivation": ["you notice the tension after you leave", "you realize later how guarded you were", "you feel the shake once the room is quiet", "you understand afterward why your body stayed ready"],
    },
    "pleasurePlay": {
        "highTracking": ["you check what is unfinished before enjoying it", "you scan for what could interrupt the good moment", "you measure how long the ease might last", "you stay alert around something that wants to be simple"],
        "lowAccess": ["you stay near the good thing without entering it", "you postpone the desire until it gets quieter", "you keep joy small enough to control", "you let the moment pass before it can ask much from you"],
        "pushPull": ["you enjoy it and monitor it at the same time", "you want the ease and prepare for it to end", "you move toward joy while keeping one eye on the exit", "you let the good thing in only partway"],
        "delayedActivation": ["you realize later that the moment was good", "you feel the warmth after it has passed", "you notice afterward that you never fully relaxed", "you understand later how much you wanted to stay"],
    },
    "griefTransitions": {
        "highTracking": ["you look for what changed in the ordinary details", "you keep checking for what used to be there", "you track the before and after in small moments", "you notice the absence before anyone mentions it"],
        "lowAccess": ["you keep the day practical so the loss stays quiet", "you move around the goodbye instead of into it", "you talk about logistics because the feeling is too large", "you let the ache stay unnamed for now"],
        "pushPull": ["you reach for the new life and keep touching the old one", "you want to move forward and hold on at the same time", "you accept the change in one breath and resist it in the next", "you want closure without wanting the goodbye"],
        "delayedActivation": ["you feel the loss later in a small ordinary detail", "you realize afterward what the change took with it", "you move through the day and grieve when it gets quiet", "you notice the goodbye after the practical part is done"],
    },
    "identityGrowth": {
        "highTracking": ["you notice the old role stop fitting", "you track the small choices that feel different", "you sense the change before it has a name", "you start reading your own life for signs of what is next"],
        "lowAccess": ["you stay with the familiar shape because it is easier to hold", "you let the next step stay vague", "you avoid naming the change because naming it would ask something of you", "you keep moving without admitting what is shifting"],
        "pushPull": ["you lean toward the new life and reach back for the old one", "you want the change and miss the stability", "you move forward while checking what you might lose", "you try to become without leaving too quickly"],
        "delayedActivation": ["you realize later that you had already changed", "you see the shift after the old role stops working", "you notice afterward that the familiar thing no longer fits", "you understand the becoming after it has already begun"],
    },
}


HUMAN_VALIDATION_BANKS = {
    "highTracking": [
        "That kind of awareness didn’t come from nowhere.",
        "There is a reason your attention goes there first.",
        "You learned to catch the shift early.",
        "That kind of bracing makes sense.",
    ],
    "lowAccess": [
        "That distance has protected you before.",
        "There is a reason you step back before you sort it out.",
        "Going quiet can be how you keep the moment manageable.",
        "Not naming it right away does not mean nothing is there.",
    ],
    "pushPull": [
        "Of course it feels confusing when both needs are real.",
        "Both parts are trying to protect something important.",
        "Wanting closeness and needing space can exist at the same time.",
        "The push and pull makes sense when being close has not always felt simple.",
    ],
    "delayedActivation": [
        "Delayed feeling is still feeling.",
        "Some reactions wait until there is enough quiet to arrive.",
        "You did not miss it; it caught up later.",
        "Your body may need distance before it can tell the truth.",
    ],
}


STRONG_LANDING_BANKS = {
    "highTracking": [
        "It just means you can end up bracing inside moments that are still unfolding.",
        "You don’t have to pick it up every time you notice it.",
        "Not every loose end belongs in your hands.",
        "The moment may need more support, not more of you.",
    ],
    "lowAccess": [
        "The distance helps in the moment, even if it leaves things unresolved.",
        "Some things stay quiet because they have not felt safe enough to take shape.",
        "Avoiding the feeling does not make it disappear; it just delays when it asks to be heard.",
        "You can move slowly without pretending nothing is there.",
    ],
    "pushPull": [
        "You do not have to choose between connection and self-protection all at once.",
        "The goal is not to force closeness; it is to notice what makes closeness feel safer.",
        "Both needs deserve room before one gets blamed for ruining the other.",
        "You can want the relationship and still need a slower doorway into it.",
    ],
    "delayedActivation": [
        "Some things only become clear after the moment stops asking you to perform.",
        "The feeling was not late; it arrived when there was room.",
        "What comes up later still counts.",
        "The quiet afterward may be where the truth finally catches up.",
    ],
}


CURATED_PARAGRAPHS: list[dict[str, object]] = [
    {
        "id": "relationships_tone_shift_gold_001",
        "category": "relationships",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["tone-shift", "repair", "connection-safety"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "triggerLog"],
        "tags": ["relationship", "repair", "connection"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When someone’s tone shifts, your body notices before your mind has the full story. You start replaying what changed, measuring the distance, and wondering if you need to explain yourself differently to keep the connection safe. Somewhere in you, connection still feels like something that can disappear if you miss the signs. You are not making it up; you are trying to catch the break before it happens. That kind of bracing makes sense, but it can leave you living inside a rupture that has not actually arrived.",
    },
    {
        "id": "responsibilityCare_invisible_load_gold_001",
        "category": "responsibilityCare",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["care-turns-responsibility", "shared-load", "invisible-load"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "bodyMap", "mental_load", "responsibility_weight"],
        "tags": ["responsibility", "care", "load"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You notice what needs to be handled before anyone says it out loud. Your mind starts filling in the gaps, anticipating what could fall through if no one steps in. Somewhere in you, it feels easier to take it on than to wait and see if someone else will. Of course that pattern formed for a reason. It just means you can end up carrying things that were never fully yours.",
    },
    {
        "id": "bodySignals_chest_alert_gold_001",
        "category": "bodySignals",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "emotional-weight", "somatic-load"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "body_signal", "somatic_signal"],
        "tags": ["body", "capacity", "emotion"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Your chest tightens and something in you goes alert, even if you can’t explain why yet. You keep moving, trying to think your way through it, while your body stays a few steps ahead. That kind of reaction doesn’t come out of nowhere. It’s what happens when you’ve had to read a situation before it was fully clear. The feeling doesn’t need to be rushed past just because it’s uncomfortable.",
    },
    {
        "id": "timeRhythms_stacking_pressure_gold_001",
        "category": "timeRhythms",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["rushed-transitions", "demand-density", "too-much-too-little-room"],
        "tone": "practical",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "time_pressure", "rushing", "capacity_strain"],
        "tags": ["time", "rhythm", "urgency"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When things start stacking up, you feel it immediately. You begin moving faster, cutting corners, trying to stay ahead of what’s coming next. It makes sense that you’d try to keep control when everything starts to compress. But there’s a difference between moving quickly and feeling constantly chased. The pace itself can become the pressure.",
    },
    {
        "id": "communicationVoice_clarity_gold_001",
        "category": "communicationVoice",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["explaining-accurately", "being-heard", "hard-conversation"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "relationshipMirror", "communication", "misunderstood", "overexplaining"],
        "tags": ["voice", "communication", "language"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When something matters, you want to say it in a way that can’t be misunderstood. You go over your words, adjust them, try to make sure the meaning lands exactly right. There’s a reason that kind of precision matters to you. Being misunderstood hasn’t felt small in your life. It just means you can end up carrying more responsibility for clarity than the moment actually requires.",
    },
    {
        "id": "selfWorthReceiving_support_gold_001",
        "category": "selfWorthReceiving",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["receiving-care", "deserving", "support-uncertain"],
        "tone": "tender",
        "intensity": "medium",
        "signalTypes": ["journal", "relationshipMirror", "self_worth", "receiving", "care_earned"],
        "tags": ["self-worth", "receiving", "care"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When someone shows up for you, you feel it—and then you question it. You start thinking about what it means, what it might cost, or whether you’ve done enough to deserve it. No wonder it’s hard to just let it land. If care has felt conditional before, your guard doesn’t drop easily. It doesn’t mean the support isn’t real.",
    },
    {
        "id": "emotionalWeather_unresolved_replay_gold_001",
        "category": "emotionalWeather",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "unfinished-moment"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Some moments don’t close cleanly for you. Even after they’re over, part of you keeps going back, trying to find what didn’t quite land. That kind of replaying usually has a purpose. You’re trying to make sense of something that didn’t fully resolve. It just means your mind can stay in places your life has already moved past.",
    },
    {
        "id": "boundariesSelfTrust_early_line_gold_001",
        "category": "boundariesSelfTrust",
        "writerShape": "punch",
        "flowName": "goldStandard",
        "anchors": ["boundary-forming", "capacity-edge", "honest-no"],
        "tone": "direct",
        "intensity": "medium",
        "signalTypes": ["journal", "triggerLog", "boundary_need", "self_trust", "overextension"],
        "tags": ["boundary", "self-trust", "limit"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You feel it when something starts to cross a line. There’s a hesitation, a quiet pullback, a sense that saying yes might cost more than it seems. That signal is easy to ignore in the moment. Especially if keeping things smooth has felt important. But that early feeling is usually telling the truth.",
    },
    {
        "id": "pleasurePlay_joy_check_gold_001",
        "category": "pleasurePlay",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["joy-unfamiliar", "play-without-outcome", "small-relief"],
        "tone": "tender",
        "intensity": "low",
        "signalTypes": ["glimmerLog", "dailyCheckIn", "joy", "pleasure", "play"],
        "tags": ["pleasure", "play", "joy"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When something feels good, you notice it—and then you check it. Part of you wonders how long it will last or what might interrupt it. That kind of pause doesn’t come from nowhere. Staying prepared has probably felt safer than getting too comfortable. It just makes it harder to fully settle into what’s actually okay.",
    },
    {
        "id": "identityGrowth_change_gold_001",
        "category": "identityGrowth",
        "writerShape": "threshold",
        "flowName": "goldStandard",
        "anchors": ["future-self", "old-identity", "threshold"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "identity_shift", "future_self", "growth_edge"],
        "tags": ["identity", "growth", "becoming"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can feel things shifting, even if you can’t fully name where you’re going yet. Part of you leans forward, while another part holds back and tries to keep things familiar. That tension makes sense when change has real stakes. You’re not confused—you’re in the middle of becoming something new. It just doesn’t feel stable yet.",
    },
    {
        "id": "responsibilityCare_fall_apart_gold_002",
        "category": "responsibilityCare",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["care-turns-responsibility", "shared-load", "invisible-load"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "bodyMap", "mental_load", "responsibility_weight"],
        "tags": ["responsibility", "care", "load"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can feel the moment when something might fall apart, even if no one else is reacting yet. Your attention goes straight to what needs to be held together. It didn’t start as a choice; it started as a way to keep things from slipping. That kind of awareness is sharp, but it comes with weight. You don’t have to pick it up every time you notice it.",
    },
    {
        "id": "bodySignals_body_shift_gold_002",
        "category": "bodySignals",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "emotional-weight", "somatic-load"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "body_signal", "somatic_signal"],
        "tags": ["body", "capacity", "emotion"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There’s a point where your body shifts and you just know something isn’t sitting right. You might not have words yet, but the feeling is already there. You’ve learned to keep moving anyway, hoping it will settle on its own. It rarely does. The signal usually stays until it’s actually acknowledged.",
    },
    {
        "id": "timeRhythms_next_thing_gold_002",
        "category": "timeRhythms",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["rushed-transitions", "demand-density", "too-much-too-little-room"],
        "tone": "practical",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "time_pressure", "rushing", "capacity_strain"],
        "tags": ["time", "rhythm", "urgency"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You start thinking about the next thing before the current one is even finished. Your attention moves ahead, trying to stay on top of everything that’s coming. It’s a way of keeping things from piling up. But it also means you rarely feel like you’ve fully arrived anywhere. The day keeps moving, and you’re always catching up to it.",
    },
    {
        "id": "communicationVoice_landing_gold_002",
        "category": "communicationVoice",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["explaining-accurately", "being-heard", "hard-conversation"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "relationshipMirror", "communication", "misunderstood", "overexplaining"],
        "tags": ["voice", "communication", "language"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can hear how something might land before you even say it. You adjust, soften, or add more so it won’t be taken the wrong way. That kind of awareness didn’t come from nowhere. It formed in moments where being misunderstood had consequences. It just means you’re doing more emotional work in conversations than most people realize.",
    },
    {
        "id": "selfWorthReceiving_genuine_offer_gold_002",
        "category": "selfWorthReceiving",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["receiving-care", "deserving", "support-uncertain"],
        "tone": "tender",
        "intensity": "medium",
        "signalTypes": ["journal", "relationshipMirror", "self_worth", "receiving", "care_earned"],
        "tags": ["self-worth", "receiving", "care"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Someone offers something genuine, and part of you immediately questions it. You look for what’s behind it, what it might mean, or what you’re expected to give back. That reflex has protected you before. It kept you from depending on something that might not last. It just makes it harder to recognize when something real is actually being offered.",
    },
    {
        "id": "relationships_unfinished_conversations_gold_001",
        "category": "relationships",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "repair", "hard-conversation"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "triggerLog", "repair_need", "connection"],
        "tags": ["relationship", "repair", "connection"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There are moments that don’t sit right, even if they seem small from the outside. You find yourself circling back, trying to figure out what didn’t land. That doesn’t happen by accident. You’re picking up on something that didn’t fully resolve. It just keeps you connected to things that no one else is thinking about anymore.",
    },
    {
        "id": "boundariesSelfTrust_cost_signal_gold_002",
        "category": "boundariesSelfTrust",
        "writerShape": "punch",
        "flowName": "goldStandard",
        "anchors": ["boundary-forming", "capacity-edge", "honest-no"],
        "tone": "direct",
        "intensity": "medium",
        "signalTypes": ["journal", "triggerLog", "boundary_need", "self_trust", "overextension"],
        "tags": ["boundary", "self-trust", "limit"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You feel it when something is about to cost you more than you want to give. It shows up quietly, before anything is said out loud. You can override it if you need to, especially to keep things moving smoothly. But that feeling doesn’t disappear just because you ignore it. It usually comes back stronger later.",
    },
    {
        "id": "pleasurePlay_ease_edge_gold_002",
        "category": "pleasurePlay",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["joy-unfamiliar", "play-without-outcome", "small-relief"],
        "tone": "tender",
        "intensity": "low",
        "signalTypes": ["glimmerLog", "dailyCheckIn", "joy", "pleasure", "play"],
        "tags": ["pleasure", "play", "joy"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Things can be going well, and you still feel a slight edge underneath it. Not enough to ruin the moment, but enough to keep you from fully relaxing. That edge has a purpose. It’s kept you from being caught off guard before. It just makes it hard to fully trust when things are actually okay.",
    },
    {
        "id": "identityGrowth_visible_shift_gold_002",
        "category": "identityGrowth",
        "writerShape": "threshold",
        "flowName": "goldStandard",
        "anchors": ["future-self", "old-identity", "threshold"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "identity_shift", "future_self", "growth_edge"],
        "tags": ["identity", "growth", "becoming"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can tell when something in your life is shifting, even before it’s visible on the surface. There’s a sense of movement that doesn’t have a clear direction yet. That space can feel unsteady. You’re not who you were, but you’re not fully who you’re becoming either. That in-between feeling is part of the process, even if it feels uncertain.",
    },
    {
        "id": "safetyRegulation_tighten_pullback_gold_001",
        "category": "safetyRegulation",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "safety-scan", "nervous-system"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "safety", "bracing", "hypervigilance"],
        "tags": ["safety", "regulation", "bracing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can feel yourself tighten or pull back before anything has clearly gone wrong. It happens fast, almost automatic. That response has kept you aware of changes that weren’t always obvious. It just means your body stays ready, even when the situation might not require it. Letting that readiness soften takes time.",
    },
    {
        "id": "workAmbition_unseen_effort_gold_001",
        "category": "workAmbition",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["output-pressure", "performance-safety", "burnout-risk"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "dailyCheckIn", "ambition", "performance", "burnout_risk"],
        "tags": ["work", "ambition", "output"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You put in more effort than people usually see. Not just in what you do, but in how you think through things, anticipate, and adjust. That level of effort became normal for you. It’s part of how you keep things steady. It just means you’re carrying more internally than it looks like on the outside.",
    },
    {
        "id": "cognitiveStyle_ambiguity_gold_001",
        "category": "cognitiveStyle",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["explaining-accurately", "unfinished-thought", "clarity-before-movement"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "analysis", "overexplaining", "clarity_need"],
        "tags": ["clarity", "thinking", "processing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You don’t like leaving things unclear. Even small misunderstandings can stay with you longer than you expect. You go back over what was said, trying to make sure it lines up. That kind of attention to detail has a purpose. It just means ambiguity can feel heavier for you than it does for others.",
    },
    {
        "id": "supportBelonging_independence_gold_001",
        "category": "supportBelonging",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["support-uncertain", "receiving-care", "not-alone"],
        "tone": "tender",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "journal", "support", "belonging", "receiving"],
        "tags": ["support", "belonging", "receiving"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You’re used to being the one who figures things out. Even when help is available, part of you leans toward handling it yourself. That independence didn’t come from nowhere. It formed when relying on others didn’t feel consistent. It just makes it harder to fully lean on something, even when it’s there.",
    },
    {
        "id": "emotionalWeather_carryover_gold_001",
        "category": "emotionalWeather",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Something happens, and it stays with you longer than expected. You move on with your day, but part of your attention stays behind. That doesn’t mean you’re stuck. It means you process things more deeply. It just takes time for your system to fully let go.",
    },
    {
        "id": "cognitiveStyle_anticipation_gold_001",
        "category": "cognitiveStyle",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["clarity-before-movement", "unfinished-thought", "future-pressure"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "analysis", "clarity_need"],
        "tags": ["clarity", "thinking", "processing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You think ahead to what could happen, not just what is happening. Your mind runs through possibilities, preparing for different outcomes. That kind of anticipation has helped you before. It just means you’re rarely only in the present moment. You’re also in what might come next.",
    },
    {
        "id": "safetyRegulation_control_gold_001",
        "category": "safetyRegulation",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["safety-scan", "nervous-system", "support-uncertain"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "safety", "bracing", "hypervigilance"],
        "tags": ["safety", "regulation", "bracing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You feel better when you know what’s coming. When things are uncertain, your mind starts trying to organize or predict what might happen. That response makes sense. It’s a way of creating stability when it’s not naturally there. It just means uncertainty can feel heavier than it does for other people.",
    },
    {
        "id": "emotionalWeather_subtle_shifts_gold_001",
        "category": "emotionalWeather",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness", "mixed_emotions"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You pick up on emotional shifts quickly, even when they’re subtle. It’s not always something you can explain, but you can feel it. That kind of awareness didn’t come out of nowhere. It developed because those shifts mattered at some point. It just means you’re tuned in at a level others aren’t.",
    },
    {
        "id": "emotionalWeather_letting_go_gold_001",
        "category": "emotionalWeather",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "unfinished-moment"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Even when something is over, part of you holds onto it a little longer. You think it through, revisit it, try to understand it more completely. That doesn’t mean you can’t move on. It means you like things to make sense before you leave them behind. It just takes a little more time.",
    },
    {
        "id": "workAmbition_pressure_build_gold_001",
        "category": "workAmbition",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["output-pressure", "performance-safety", "burnout-risk"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "dailyCheckIn", "ambition", "performance", "burnout_risk"],
        "tags": ["work", "ambition", "output"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can feel pressure build even before anything is fully happening. It starts as a sense of needing to stay ahead or get it right. That feeling has helped you stay prepared. It just means your baseline includes a level of tension that others might not notice. Letting that ease doesn’t always come naturally.",
    },
    {
        "id": "lifeDirection_avoidance_gold_001",
        "category": "lifeDirection",
        "writerShape": "threshold",
        "flowName": "goldStandard",
        "anchors": ["future-pressure", "choice-cost", "clarity-before-movement"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "future_self", "direction", "next_step"],
        "tags": ["direction", "future", "choice"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There are things you keep meaning to start, but you don’t quite move toward them. You think about them, circle them, and then let the moment pass. It’s not that they don’t matter. It’s that getting into them feels heavier than it should, so you stay just outside. That distance makes it easier to get through the day, even if it leaves things unresolved.",
    },
    {
        "id": "safetyRegulation_emotional_numbness_gold_001",
        "category": "safetyRegulation",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "safety-scan", "nervous-system"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "safety", "bracing", "hypervigilance"],
        "tags": ["safety", "regulation", "bracing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There are stretches where everything feels muted, like nothing fully lands. You respond, you move through things, but it doesn’t hit the way you expect it to. That doesn’t mean nothing is there. It usually means something got turned down so you could keep going. Feeling less can be a way of not getting overwhelmed.",
    },
    {
        "id": "relationships_conversation_disconnection_gold_001",
        "category": "relationships",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["connection-safety", "distance", "repair"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "triggerLog", "connection", "repair_need"],
        "tags": ["relationship", "repair", "connection"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can be talking with someone and still feel slightly removed from it. You hear them, you answer, but part of you isn’t fully engaged. It’s subtle enough that no one notices. That kind of distance keeps things simple. It also keeps things from getting too close.",
    },
    {
        "id": "emotionalWeather_delayed_reactions_gold_001",
        "category": "emotionalWeather",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Something happens, and in the moment, it doesn’t seem like a big deal. Later, it comes back with more weight than you expected. You replay it, rethink it, and feel more than you did at the time. Your reactions don’t always show up when things are happening. They show up when everything else quiets down.",
    },
    {
        "id": "restCapacity_low_motivation_gold_001",
        "category": "restCapacity",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["low-sleep", "rest-hard-to-receive", "demand-density"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "sleep", "low_sleep", "recovery_gap", "capacity_strain"],
        "tags": ["rest", "capacity", "fatigue"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There are times when even simple things feel harder to start than they should. You know what needs to be done, but the energy to begin isn’t there. It’s not a lack of awareness. It’s more like the connection between intention and action isn’t fully clicking. So things stay where they are longer than you want.",
    },
    {
        "id": "emotionalWeather_surface_talk_gold_001",
        "category": "emotionalWeather",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "low",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can talk about your life without really getting into it. You keep things clear, simple, and easy to move through. That works most of the time. Going deeper doesn’t always feel necessary. It just means some things stay unspoken, even when they matter.",
    },
    {
        "id": "emotionalWeather_naming_feelings_gold_001",
        "category": "emotionalWeather",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness", "mixed_emotions"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When you try to explain how you feel, the words don’t always come easily. You know something is off, but it’s not clear what to call it. It sits there without a label. That doesn’t mean it isn’t real. It just hasn’t taken a clear shape yet.",
    },
    {
        "id": "lifeDirection_procrastination_loop_gold_001",
        "category": "lifeDirection",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["future-pressure", "choice-cost", "clarity-before-movement"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "future_self", "direction", "next_step"],
        "tags": ["direction", "future", "choice"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You think about doing something, then decide to wait a little longer. Then you think about the fact that you waited. That loop can repeat without much changing. It’s not that you don’t notice it. It just doesn’t shift as quickly as you expect it to.",
    },
    {
        "id": "supportBelonging_doing_it_yourself_gold_001",
        "category": "supportBelonging",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["support-uncertain", "receiving-care", "not-alone"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "journal", "support", "belonging", "receiving"],
        "tags": ["support", "belonging", "receiving"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You tend to handle things on your own without thinking much about it. Even when help is available, it feels easier to just take care of it yourself. There’s less explaining, less waiting, less uncertainty. It works. It just means everything stays on you.",
    },
    {
        "id": "relationships_emotional_distance_gold_001",
        "category": "relationships",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["connection-safety", "distance", "repair"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "triggerLog", "connection", "repair_need"],
        "tags": ["relationship", "repair", "connection"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You care about people, but there’s still some space between you and them. It’s not something you talk about. It’s just there in how close things feel. You don’t fully lean in, even when things are good. That distance keeps things steady, but also a little out of reach.",
    },
    {
        "id": "emotionalWeather_minimizing_problems_gold_001",
        "category": "emotionalWeather",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When something goes wrong, you move past it quickly. You tell yourself it’s not a big deal and keep going. That keeps things manageable. But it also means some things don’t get dealt with. They just fade into the background.",
    },
    {
        "id": "restCapacity_routine_gold_001",
        "category": "restCapacity",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["low-sleep", "rest-hard-to-receive", "demand-density"],
        "tone": "practical",
        "intensity": "low",
        "signalTypes": ["dailyCheckIn", "sleep", "low_sleep", "recovery_gap", "capacity_strain"],
        "tags": ["rest", "capacity", "fatigue"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You move through your day based on what needs to get done. There isn’t always a pause to check in with yourself. It keeps things efficient. It also means you don’t always notice how you’re actually feeling until later.",
    },
    {
        "id": "relationships_avoiding_conflict_gold_001",
        "category": "relationships",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["after-conflict", "repair", "connection-safety"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "triggerLog", "repair_need", "connection"],
        "tags": ["relationship", "repair", "connection"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "If something could turn into a bigger conversation, you’re more likely to let it go. Even when it bothers you, it can feel easier not to get into it. That keeps things calm in the moment. It just leaves some things sitting unresolved.",
    },
    {
        "id": "supportBelonging_letting_people_in_gold_001",
        "category": "supportBelonging",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["support-uncertain", "receiving-care", "not-alone"],
        "tone": "tender",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "journal", "support", "belonging", "receiving"],
        "tags": ["support", "belonging", "receiving"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You don’t open up quickly, even with people you trust. You share what’s needed, but not much more. It’s not something you actively think about. It just feels more natural to keep certain things to yourself. That way, nothing gets too exposed.",
    },
    {
        "id": "safetyRegulation_zoning_out_gold_001",
        "category": "safetyRegulation",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "safety-scan", "nervous-system"],
        "tone": "grounded",
        "intensity": "low",
        "signalTypes": ["bodyMap", "triggerLog", "safety", "bracing", "hypervigilance"],
        "tags": ["safety", "regulation", "bracing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There are moments where your attention drifts without you trying to make it happen. You’re still there, but your focus pulls away. It tends to happen when things feel repetitive or too much at once. Your mind just steps back a little. It gives you space without you having to ask for it.",
    },
    {
        "id": "emotionalWeather_quiet_reactions_gold_001",
        "category": "emotionalWeather",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "mixed-feelings"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness", "mixed_emotions"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Even when something affects you, it doesn’t always show. Your reactions stay steady, regardless of what’s happening. That makes things easier to manage on the outside. But it also means people don’t always see what’s actually going on for you.",
    },
    {
        "id": "lifeDirection_indecision_gold_001",
        "category": "lifeDirection",
        "writerShape": "questionLed",
        "flowName": "goldStandard",
        "anchors": ["future-pressure", "choice-cost", "clarity-before-movement"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "future_self", "direction", "next_step"],
        "tags": ["direction", "future", "choice"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can sit with a decision longer than you expect. It’s not always clear what you want, so you wait. Sometimes the choice gets made just because time passes. It’s not about avoiding it. It’s more like nothing is pulling strongly enough either way.",
    },
    {
        "id": "lifeDirection_disconnected_goals_gold_001",
        "category": "lifeDirection",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["future-pressure", "choice-cost", "clarity-before-movement"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "future_self", "direction", "next_step"],
        "tags": ["direction", "future", "choice"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "There are things you think you should be working toward, but they don’t fully land. The idea makes sense, but it doesn’t feel urgent or real. So progress comes in bursts or not at all. It’s hard to move toward something that doesn’t feel connected to you.",
    },
    {
        "id": "lifeDirection_drift_gold_001",
        "category": "lifeDirection",
        "writerShape": "threshold",
        "flowName": "goldStandard",
        "anchors": ["future-pressure", "choice-cost", "clarity-before-movement"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "future_self", "direction", "next_step"],
        "tags": ["direction", "future", "choice"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Some parts of your life continue without much direction. You’re not pushing them forward or pulling them back. They just keep going as they are. It feels fine until you notice how long it’s been. Then it starts to stand out.",
    },
    {
        "id": "safetyRegulation_under_surface_stress_gold_001",
        "category": "safetyRegulation",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "safety-scan", "nervous-system"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "safety", "bracing", "hypervigilance"],
        "tags": ["safety", "regulation", "bracing"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Stress doesn’t always show up clearly for you. It builds quietly, without a strong reaction. You keep functioning, keep doing what needs to be done. On the outside, things look steady. Underneath, there’s more pressure than it seems.",
    },
    {
        "id": "relationships_tone_shift_gold_002",
        "category": "relationships",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["tone-shift", "repair", "connection-safety"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["relationshipMirror", "triggerLog"],
        "tags": ["relationship", "repair", "connection"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "When someone’s tone shifts, you feel it immediately—even if nothing has been said outright. You start replaying the last few seconds, scanning for what changed, wondering if you missed something small that mattered. There’s a part of you that doesn’t wait for things to break; it tries to get there first. That habit didn’t come from nowhere. It just means you can end up bracing inside moments that are still unfolding.",
    },
    {
        "id": "responsibilityCare_noticing_takeover_gold_003",
        "category": "responsibilityCare",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["care-turns-responsibility", "shared-load", "invisible-load"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "bodyMap", "mental_load", "responsibility_weight"],
        "tags": ["responsibility", "care", "load"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You catch the thing that’s about to fall before anyone else even sees it. Your attention goes straight to what’s unfinished, unspoken, or quietly depending on someone stepping in. It doesn’t feel like pressure at first—it feels automatic. Somewhere along the way, noticing turned into taking over. Now it’s hard to tell the difference.",
    },
    {
        "id": "bodySignals_alert_without_reason_gold_003",
        "category": "bodySignals",
        "writerShape": "body",
        "flowName": "goldStandard",
        "anchors": ["body-before-words", "emotional-weight", "somatic-load"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["bodyMap", "triggerLog", "body_signal", "somatic_signal"],
        "tags": ["body", "capacity", "emotion"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Your body shifts before anything makes sense. A tight chest, a drop in your stomach, something in you going alert without a clear reason. You keep moving like nothing happened, but part of you stays there. That reaction has been useful for you. It just doesn’t turn off on command.",
    },
    {
        "id": "timeRhythms_stack_pace_gold_003",
        "category": "timeRhythms",
        "writerShape": "practicalCapacity",
        "flowName": "goldStandard",
        "anchors": ["rushed-transitions", "demand-density", "too-much-too-little-room"],
        "tone": "practical",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "time_pressure", "rushing", "capacity_strain"],
        "tags": ["time", "rhythm", "urgency"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "The moment things start stacking up, your pace changes. You move faster, think ahead, skip over the parts that would normally slow you down. It feels like staying on top of things. But it also means you don’t really arrive anywhere—you’re always already moving to the next thing. The day keeps going, and you never quite land in it.",
    },
    {
        "id": "communicationVoice_misread_protection_gold_003",
        "category": "communicationVoice",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["explaining-accurately", "being-heard", "hard-conversation"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "relationshipMirror", "communication", "misunderstood", "overexplaining"],
        "tags": ["voice", "communication", "language"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can hear how something might be taken before you even say it. So you adjust, add context, soften certain parts, make sure it can’t be misunderstood. That level of care didn’t just appear. It came from moments where being misread actually mattered. Now it shows up even when the situation doesn’t require that much protection.",
    },
    {
        "id": "selfWorthReceiving_step_back_gold_003",
        "category": "selfWorthReceiving",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["receiving-care", "deserving", "support-uncertain"],
        "tone": "tender",
        "intensity": "medium",
        "signalTypes": ["journal", "relationshipMirror", "self_worth", "receiving", "care_earned"],
        "tags": ["self-worth", "receiving", "care"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Someone offers something real, and you feel the instinct to step back just slightly. Not enough to refuse it—just enough to not fully take it in. You start thinking about what it means, what’s expected, how it balances out. That reflex has kept things safe before. It just makes it harder to recognize when something is simply being given.",
    },
    {
        "id": "emotionalWeather_unresolved_quiet_return_gold_002",
        "category": "emotionalWeather",
        "writerShape": "patternAnalysis",
        "flowName": "goldStandard",
        "anchors": ["unresolved", "emotional-load", "unfinished-moment"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness"],
        "tags": ["emotion", "mood", "returning-feeling"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "A moment ends, but it doesn’t leave you. You keep returning to it, not dramatically—just in small, quiet ways. Something didn’t quite settle, and your mind keeps trying to place it. It’s not about overthinking. It’s about something that didn’t fully land the first time.",
    },
    {
        "id": "boundariesSelfTrust_crossed_line_gold_003",
        "category": "boundariesSelfTrust",
        "writerShape": "punch",
        "flowName": "goldStandard",
        "anchors": ["boundary-forming", "capacity-edge", "honest-no"],
        "tone": "direct",
        "intensity": "medium",
        "signalTypes": ["journal", "triggerLog", "boundary_need", "self_trust", "overextension"],
        "tags": ["boundary", "self-trust", "limit"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You feel the moment something crosses a line, even if you don’t say anything about it. It’s subtle—a pause, a shift, a quiet sense that this is more than you want to give. You can move past it if you need to. But that feeling doesn’t disappear just because you didn’t act on it.",
    },
    {
        "id": "pleasurePlay_outside_ease_gold_003",
        "category": "pleasurePlay",
        "writerShape": "tender",
        "flowName": "goldStandard",
        "anchors": ["joy-unfamiliar", "play-without-outcome", "small-relief"],
        "tone": "tender",
        "intensity": "low",
        "signalTypes": ["glimmerLog", "dailyCheckIn", "joy", "pleasure", "play"],
        "tags": ["pleasure", "play", "joy"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "Something feels good, and part of you stays just outside of it. You notice it, but you don’t fully drop into it. There’s a slight distance, like you’re keeping an eye on how long it will last. That kind of awareness has protected you before. It just makes it harder to let things be easy while they’re actually here.",
    },
    {
        "id": "identityGrowth_catching_up_gold_003",
        "category": "identityGrowth",
        "writerShape": "threshold",
        "flowName": "goldStandard",
        "anchors": ["future-self", "old-identity", "threshold"],
        "tone": "grounded",
        "intensity": "medium",
        "signalTypes": ["journal", "reflectionBank", "identity_shift", "future_self", "growth_edge"],
        "tags": ["identity", "growth", "becoming"],
        "avoidIfRecentlyUsed": True,
        "isCurated": True,
        "source": "goldStandard",
        "body": "You can feel yourself shifting before anything in your life has fully caught up. There’s a sense that something is ending, but not enough clarity about what’s replacing it. You’re not lost—you’re just not settled. That space can feel uncomfortable because there’s nothing solid to stand on yet. But you’re already further along than it feels.",
    },
]

CATEGORY_BANKS: dict[str, CategoryBank] = {
    "emotionalWeather": CategoryBank(
        category="emotionalWeather",
        theme="the returning emotional tone",
        pattern="a feeling keeps asking for room after the practical moment has moved on",
        moment="the day leaves something unresolved or quietly loaded",
        meaning="a need for care, language, or closure",
        need="emotional space",
        reframe="The feeling is information about what still needs tending, not proof that you are too much.",
        landing="Let the emotion point toward care before you ask it to disappear.",
        body_cue="heaviness in your chest or a shift in your breath",
        metaphor="weather",
        tags=["emotion", "mood", "returning-feeling"],
        signal_types=["dailyCheckIn", "journal", "triggerLog", "emotional_heaviness", "mixed_emotions"],
        anchors=["unresolved", "emotional-load", "mixed-feelings"],
        anchor_phrases=["when something feels unresolved", "after a charged moment has technically passed", "when too much is happening at once"],
        vocabulary=["feeling", "mood", "heaviness", "pressure", "softening", "emotional load"],
    ),
    "restCapacity": CategoryBank(
        category="restCapacity",
        theme="rest and capacity",
        pattern="your standards keep asking for more than your recovery has restored",
        moment="after low sleep or a stretch of overextension",
        meaning="available energy running low rather than laziness",
        need="honest pacing",
        reframe="Lower capacity is not a verdict on your character; it is the body reporting available energy.",
        landing="Build the day around real capacity before urgency spends what is not there.",
        body_cue="fatigue, heaviness, or a body that will not fully start",
        metaphor="battery",
        tags=["rest", "capacity", "fatigue"],
        signal_types=["dailyCheckIn", "sleep", "low_sleep", "recovery_gap", "capacity_strain"],
        anchors=["low-sleep", "rest-hard-to-receive", "demand-density"],
        anchor_phrases=["after low sleep", "when rest feels hard to receive", "when too much is happening at once"],
        vocabulary=["space", "capacity", "recovery", "fatigue", "demand density", "rest"],
    ),
    "bodySignals": CategoryBank(
        category="bodySignals",
        theme="the body signal",
        pattern="your body starts telling the truth before your thoughts can organize it",
        moment="when your body reacts before you have words",
        meaning="emotional load becoming visible through sensation",
        need="gentle attention",
        reframe="The sensation is not drama; it is information arriving through the body.",
        landing="Let the body become a doorway into care, not a courtroom for self-judgment.",
        body_cue="chest tightness, breath changes, heaviness, or tension",
        metaphor="doorway",
        tags=["body", "capacity", "emotion"],
        signal_types=["bodyMap", "triggerLog", "body_signal", "somatic_signal", "emotional_load"],
        anchors=["body-before-words", "emotional-weight", "somatic-load"],
        anchor_phrases=["when your body reacts before you have words", "when something feels unresolved", "when too much is happening at once"],
        vocabulary=["chest", "breath", "heaviness", "tension", "sensation", "body-before-words", "emotional load"],
    ),
    "supportBelonging": CategoryBank(
        category="supportBelonging",
        theme="support and belonging",
        pattern="care matters most where you are tired of being self-contained",
        moment="when support feels uncertain or hard to receive",
        meaning="a need for reliable care rather than neediness",
        need="support without debt",
        reframe="Wanting steadiness from other people is not weakness; it is part of how safety becomes real.",
        landing="Let support count before you turn it into proof that you owe something back.",
        body_cue="a softening or tightening when help is offered",
        metaphor="shelter",
        tags=["support", "belonging", "receiving"],
        signal_types=["relationshipMirror", "journal", "support", "belonging", "receiving"],
        anchors=["support-uncertain", "receiving-care", "not-alone"],
        anchor_phrases=["when support feels uncertain", "when care is offered and you cannot quite let it land", "after a moment where you felt alone with too much"],
        vocabulary=["support", "belonging", "receiving", "care", "mutuality", "not alone"],
    ),
    "relationships": CategoryBank(
        category="relationships",
        theme="relationship safety",
        pattern="connection changes the whole room when tone, distance, or repair feels uncertain",
        moment="when someone’s tone shifts or after conflict",
        meaning="a need for repair and clarity, not proof that you are too sensitive",
        need="repair and clarity",
        reframe="The reaction points to the importance of repair, not to a failure to be easygoing.",
        landing="Notice whether the connection has a way back before you blame yourself for needing one.",
        body_cue="a tight chest, alertness, or a quick scan for what changed",
        metaphor="thread",
        tags=["relationship", "repair", "connection"],
        signal_types=["relationshipMirror", "triggerLog", "tone_shift", "repair_need", "connection"],
        anchors=["tone-shift", "after-conflict", "repair"],
        anchor_phrases=["when someone’s tone shifts", "after conflict", "when something feels unresolved between you and someone else"],
        vocabulary=["tone", "repair", "connection", "distance", "boundaries", "being understood"],
    ),
    "boundariesSelfTrust": CategoryBank(
        category="boundariesSelfTrust",
        theme="boundaries and self-trust",
        pattern="your first internal no arrives before resentment has to do the talking",
        moment="when a request starts to press past your capacity",
        meaning="self-trust forming at the edge of overextension",
        need="permission to pause",
        reframe="A boundary is not a rejection of care; it is a cleaner shape for care to move through.",
        landing="Trust the early edge before it has to become exhaustion.",
        body_cue="dread, tightness, or a quiet pulling back",
        metaphor="line",
        tags=["boundary", "self-trust", "limit"],
        signal_types=["journal", "triggerLog", "boundary_need", "self_trust", "overextension"],
        anchors=["boundary-forming", "capacity-edge", "honest-no"],
        anchor_phrases=["when care turns into responsibility", "when too much is happening at once", "when a yes would cost more than it first appears"],
        vocabulary=["boundary", "limit", "autonomy", "self-trust", "resentment", "capacity"],
    ),
    "valuesIntegrity": CategoryBank(
        category="valuesIntegrity",
        theme="values and integrity",
        pattern="friction rises when a practical answer starts pulling you away from what is true",
        moment="when a choice makes sense on paper but not in your body",
        meaning="integrity asking to be included",
        need="protection for the deeper value",
        reframe="The discomfort is not inconvenience; it is a value asking not to be negotiated away.",
        landing="Let the deeper value have a vote before the easier answer takes over.",
        body_cue="tension, hesitation, or a feeling that something is off",
        metaphor="compass",
        tags=["values", "integrity", "alignment"],
        signal_types=["journal", "reflectionBank", "alignment", "integrity", "truth_telling"],
        anchors=["alignment", "hard-choice", "values-pressure"],
        anchor_phrases=["when something feels misaligned", "when a choice carries a quiet cost", "when the practical answer still feels incomplete"],
        vocabulary=["alignment", "truth", "integrity", "choice", "meaning", "values"],
    ),
    "cognitiveStyle": CategoryBank(
        category="cognitiveStyle",
        theme="your thinking pattern",
        pattern="precision becomes protection when the stakes feel high",
        moment="when you are trying to explain yourself accurately",
        meaning="a need for language and safety around being understood",
        need="one honest sentence",
        reframe="Careful thinking is not the problem; the cost appears when clarity becomes the only way to feel safe.",
        landing="Let the next true sentence be enough to move one step.",
        body_cue="a busy mind with a body that cannot fully settle",
        metaphor="bridge",
        tags=["clarity", "thinking", "processing"],
        signal_types=["journal", "reflectionBank", "analysis", "overexplaining", "clarity_need"],
        anchors=["explaining-accurately", "unfinished-thought", "clarity-before-movement"],
        anchor_phrases=["when you are trying to explain yourself accurately", "when something feels unresolved", "after a conversation that could be misunderstood"],
        vocabulary=["accuracy", "being heard", "distortion", "pressure to explain", "clarity", "context"],
    ),
    "dreamsSymbols": CategoryBank(
        category="dreamsSymbols",
        theme="dream material",
        pattern="the night gives shape to emotion the day has not fully organized",
        moment="when an image or atmosphere follows you into the day",
        meaning="processing that is symbolic rather than literal",
        need="space for the feeling",
        reframe="A dream does not have to predict anything to show what your system is still carrying.",
        landing="Start with the feeling that lingered, then let the symbol become useful slowly.",
        body_cue="an emotional aftertaste in the body after waking",
        metaphor="image",
        tags=["dream", "symbol", "meaning"],
        signal_types=["dream", "journal", "dream_symbol", "dream_emotion", "subconscious_theme"],
        anchors=["dream-residue", "symbolic-processing", "night-aftershock"],
        anchor_phrases=["after a dream follows you into the day", "when something feels unresolved", "when the atmosphere matters more than the plot"],
        vocabulary=["image", "atmosphere", "weather", "symbol", "inner climate", "processing"],
    ),
    "glimmersRegulation": CategoryBank(
        category="glimmersRegulation",
        theme="glimmers and settling",
        pattern="small relief shows your system where it can come back to itself",
        moment="when your body unclenches for even a few seconds",
        meaning="recovery becoming visible in ordinary life",
        need="protection for what helps",
        reframe="Relief does not have to be dramatic to be real regulation.",
        landing="Let the small good thing count before the hard thing asks for all the attention again.",
        body_cue="a breath, warmth, softening, or slight return of steadiness",
        metaphor="light",
        tags=["glimmer", "regulation", "relief"],
        signal_types=["glimmerLog", "dailyCheckIn", "glimmer", "relief", "grounded"],
        anchors=["small-relief", "body-unclench", "recovery-signal"],
        anchor_phrases=["when your body unclenches", "after a moment of small relief", "when joy or steadiness appears briefly"],
        vocabulary=["relief", "steadiness", "softening", "glimmer", "calm", "return"],
    ),
    "creativityExpression": CategoryBank(
        category="creativityExpression",
        theme="creative expression",
        pattern="inner material gathers pressure when it wants form but visibility still feels risky",
        moment="when you want to make or say something before it feels safe to be seen",
        meaning="expression seeking a channel, not a demand for perfection",
        need="a small honest channel",
        reframe="The block may be about safety around visibility, not a lack of voice.",
        landing="Give the feeling one small door instead of waiting for the whole room to be ready.",
        body_cue="restlessness, pressure, or a body that wants movement",
        metaphor="door",
        tags=["creativity", "expression", "visibility"],
        signal_types=["journal", "reflectionBank", "creative_expression", "blocked_expression", "visibility"],
        anchors=["expression-block", "visibility", "inner-world"],
        anchor_phrases=["when something inside wants form", "when being visible feels risky", "when too much is happening inside at once"],
        vocabulary=["expression", "form", "visibility", "creative pressure", "voice", "inner world"],
    ),
    "identityGrowth": CategoryBank(
        category="identityGrowth",
        theme="identity growth",
        pattern="an older version of you still knows how to survive while a newer one asks for practice",
        moment="when the next version of your life is close but not fully stable",
        meaning="a threshold rather than a failure to be clear",
        need="room to practice becoming",
        reframe="The in-between is a real stage, not proof that you are behind.",
        landing="Let becoming be awkward before it becomes familiar.",
        body_cue="unease, anticipation, or a body that cannot find its old shape",
        metaphor="threshold",
        tags=["identity", "growth", "becoming"],
        signal_types=["journal", "reflectionBank", "identity_shift", "future_self", "growth_edge"],
        anchors=["future-self", "old-identity", "threshold"],
        anchor_phrases=["when you are between an old identity and a new one", "when a next chapter feels close", "when movement changes more than the plan"],
        vocabulary=["identity", "future self", "becoming", "change", "old role", "threshold"],
    ),
    "familyHome": CategoryBank(
        category="familyHome",
        theme="family and home patterns",
        pattern="old roles can pull you into responsibility before the present moment has been checked",
        moment="when home or family tension starts to feel familiar",
        meaning="an old role being activated rather than a fresh obligation",
        need="a pause before automatic labor",
        reframe="What feels familiar is not always what belongs to you now.",
        landing="Notice the role before you step all the way back into it.",
        body_cue="a quick readiness, tightness, or sense that you need to manage the room",
        metaphor="fingerprint",
        tags=["family", "home", "role"],
        signal_types=["journal", "relationshipMirror", "family_role", "home_tension", "responsibility_weight"],
        anchors=["old-role", "home-tension", "family-responsibility"],
        anchor_phrases=["when care turns into responsibility", "when an old family role gets activated", "when support feels uncertain at home"],
        vocabulary=["family", "home", "role", "belonging", "responsibility", "old pattern"],
    ),
    "scarcityAbundance": CategoryBank(
        category="scarcityAbundance",
        theme="scarcity and enoughness",
        pattern="your system starts scanning for what could run out before the present has been measured",
        moment="when support, time, money, care, or energy feels uncertain",
        meaning="an old alarm about enoughness",
        need="a steadier read of what is actually here",
        reframe="The scarcity scan is trying to protect you, but it does not get to define the whole moment.",
        landing="Let the present give its actual numbers before fear writes the story.",
        body_cue="tightness, urgency, or a quick need to ration everything",
        metaphor="ledger",
        tags=["scarcity", "enoughness", "resources"],
        signal_types=["journal", "dailyCheckIn", "scarcity", "enoughness", "resource_fear"],
        anchors=["scarcity-scan", "enoughness", "support-uncertain"],
        anchor_phrases=["when support feels uncertain", "when too much is happening at once", "when resources start to feel fragile"],
        vocabulary=["space", "resources", "enoughness", "support", "loss", "scarcity"],
    ),
    "natalChartReflection": CategoryBank(
        category="natalChartReflection",
        theme="symbolic self-recognition",
        pattern="a symbolic mirror gives language to something you already sensed",
        moment="when a reflection lands in the body instead of staying abstract",
        meaning="recognition that returns you to choice",
        need="meaning that leaves room for choice",
        reframe="The symbol is useful only where it helps you recognize yourself more honestly.",
        landing="Keep the meaning that opens choice and leave the rest loose.",
        body_cue="a quiet click of recognition or a softening in the chest",
        metaphor="mirror",
        tags=["chart", "reflection", "symbolic-mirror"],
        signal_types=["natalChart", "reflectionBank", "symbolic_identity", "self_recognition", "meaning_making"],
        anchors=["symbolic-mirror", "meaning-gap", "self-recognition"],
        anchor_phrases=["when a symbol gives language to something you already felt", "when meaning needs to stay grounded", "when a reflection brings you closer to yourself"],
        vocabulary=["symbol", "mirror", "recognition", "meaning", "choice", "self-knowledge"],
    ),
    "responsibilityCare": CategoryBank(
        category="responsibilityCare",
        theme="care and responsibility",
        pattern="you notice what needs holding before you notice whether it should be yours",
        moment="when care turns into responsibility",
        meaning="private load becoming visible",
        need="shared support",
        reframe="The weight is not proof that you care too much; it shows how quickly care can become private labor.",
        landing="Let capacity and support enter before the loose end lands entirely in your hands.",
        body_cue="heaviness, fatigue, or a sense that you are already carrying the room",
        metaphor="load",
        tags=["responsibility", "care", "load"],
        signal_types=["journal", "bodyMap", "mental_load", "responsibility_weight", "emotional_labor"],
        anchors=["care-turns-responsibility", "shared-load", "invisible-load"],
        anchor_phrases=["when care turns into responsibility", "when support feels uncertain", "when too much is happening at once"],
        vocabulary=["carrying", "support", "responsibility", "repair", "shared load", "care"],
    ),
    "workAmbition": CategoryBank(
        category="workAmbition",
        theme="work and ambition",
        pattern="progress starts standing in for safety when uncertainty is high",
        moment="when output pressure rises faster than recovery can meet it",
        meaning="a drive for proof, steadiness, or control",
        need="a goal with recovery inside it",
        reframe="Ambition is not the problem; the cost appears when output becomes the only way to feel okay.",
        landing="Do not spend the builder to finish the proof.",
        body_cue="tightness, irritability, fatigue, or a body that cannot fully land",
        metaphor="scaffold",
        tags=["work", "ambition", "output"],
        signal_types=["journal", "dailyCheckIn", "ambition", "performance", "burnout_risk"],
        anchors=["output-pressure", "performance-safety", "burnout-risk"],
        anchor_phrases=["when too much is happening at once", "when progress starts to feel like safety", "after a push that leaves your body behind"],
        vocabulary=["standards", "output", "pressure", "progress", "performance", "capacity"],
    ),
    "griefTransitions": CategoryBank(
        category="griefTransitions",
        theme="grief and transition",
        pattern="the outside change moves faster than the inner goodbye",
        moment="when an ending feels unfinished or a before-and-after keeps echoing",
        meaning="grief moving at its own honest speed",
        need="a form for what remains",
        reframe="The returning ache is not regression; it is the part of you still integrating the change.",
        landing="Give the goodbye a place to land before you ask yourself to be done.",
        body_cue="heaviness, ache, tenderness, or sudden tiredness",
        metaphor="echo",
        tags=["grief", "transition", "ending"],
        signal_types=["journal", "dailyCheckIn", "grief", "loss", "transition"],
        anchors=["unfinished-ending", "grief-aftershock", "transition-space"],
        anchor_phrases=["when something feels unresolved", "after a change that split life into before and after", "when what remains feels hard to name"],
        vocabulary=["loss", "change", "continuity", "before/after", "what remains", "transition"],
    ),
    "timeRhythms": CategoryBank(
        category="timeRhythms",
        theme="time and rhythm",
        pattern="too much tries to fit into too little room",
        moment="during rushed transitions or when the day has no margin",
        meaning="demand density rather than a discipline problem",
        need="more space around transitions",
        reframe="That strain may be about the shape of demand, not a personal failure to keep up.",
        landing="Widen one doorway in the day before you ask yourself to sprint harder.",
        body_cue="tension, urgency, or a body that braces before the next thing begins",
        metaphor="doorway",
        tags=["time", "rhythm", "urgency"],
        signal_types=["dailyCheckIn", "journal", "time_pressure", "rushing", "capacity_strain"],
        anchors=["rushed-transitions", "demand-density", "too-much-too-little-room"],
        anchor_phrases=["during rushed transitions", "when too much is happening at once", "after low sleep"],
        vocabulary=["space", "capacity", "rushing", "rhythm", "too much in too little room", "demand density"],
    ),
    "selfWorthReceiving": CategoryBank(
        category="selfWorthReceiving",
        theme="self-worth and receiving",
        pattern="care feels exposed when part of you still expects to earn it",
        moment="when receiving support touches the question of deserving",
        meaning="worth separating from usefulness",
        need="care that can land",
        reframe="Care does not become real only after you have earned it.",
        landing="Let one kind thing arrive without turning it into debt.",
        body_cue="softening, deflecting, tightening, or a quick move to minimize the need",
        metaphor="account",
        tags=["self-worth", "receiving", "care"],
        signal_types=["journal", "relationshipMirror", "self_worth", "receiving", "care_earned"],
        anchors=["receiving-care", "deserving", "enoughness"],
        anchor_phrases=["when support feels uncertain", "when care is offered and you want to deflect it", "when being visible feels risky"],
        vocabulary=["receiving", "deserving", "visibility", "being allowed", "enoughness", "care"],
    ),
    "communicationVoice": CategoryBank(
        category="communicationVoice",
        theme="communication and voice",
        pattern="accuracy becomes protection when being misunderstood would cost too much",
        moment="when you are trying to explain yourself accurately",
        meaning="a need to be heard without distortion",
        need="the truest short sentence",
        reframe="Precision can be care, but it does not have to become armor every time.",
        landing="Start with the sentence that is most alive, then decide whether more explanation is actually needed.",
        body_cue="tightness in the throat, jaw, or chest",
        metaphor="signal",
        tags=["voice", "communication", "language"],
        signal_types=["journal", "relationshipMirror", "communication", "misunderstood", "overexplaining"],
        anchors=["explaining-accurately", "tone-shift", "hard-conversation"],
        anchor_phrases=["when you are trying to explain yourself accurately", "when someone’s tone shifts", "after conflict"],
        vocabulary=["accuracy", "being heard", "distortion", "pressure to explain", "voice", "clarity"],
    ),
    "spiritualMeaning": CategoryBank(
        category="spiritualMeaning",
        theme="meaning and purpose",
        pattern="the practical answer is not enough when a deeper question is still open",
        moment="when facts explain what happened but not what it means",
        meaning="orientation rather than escape",
        need="grounded meaning",
        reframe="A larger frame is useful when it helps you care for what is real.",
        landing="Let mystery steady you without pulling you away from the present.",
        body_cue="a sense of weight, warmth, or quiet recognition",
        metaphor="thread",
        tags=["meaning", "purpose", "spiritual"],
        signal_types=["journal", "reflectionBank", "meaning_making", "purpose", "faith"],
        anchors=["meaning-gap", "larger-question", "purpose-thread"],
        anchor_phrases=["when the practical answer still feels incomplete", "when something feels unresolved", "when a larger question keeps returning"],
        vocabulary=["meaning", "purpose", "faith", "larger question", "truth", "ground"],
    ),
    "safetyRegulation": CategoryBank(
        category="safetyRegulation",
        theme="safety and steadiness",
        pattern="your system starts scanning for what changed before calm can become believable",
        moment="when your body reacts before you have words",
        meaning="preparedness asking for proof of safety",
        need="concrete cues of safety",
        reframe="Bracing is not failure; it is the body asking for enough safety to soften.",
        landing="Give the nervous system something real to hold in the room you are actually in.",
        body_cue="bracing, alertness, numbness, or a body that cannot fully settle",
        metaphor="gate",
        tags=["safety", "regulation", "bracing"],
        signal_types=["bodyMap", "triggerLog", "safety", "bracing", "hypervigilance"],
        anchors=["body-before-words", "safety-scan", "nervous-system"],
        anchor_phrases=["when your body reacts before you have words", "when support feels uncertain", "when something feels unresolved"],
        vocabulary=["bracing", "threat", "settling", "nervous system", "safety", "body"],
    ),
    "lifeDirection": CategoryBank(
        category="lifeDirection",
        theme="life direction",
        pattern="the next step feels heavy because it changes more than the plan",
        moment="when the future is close enough to feel but not clear enough to trust",
        meaning="a choice asking for honesty before certainty",
        need="one small reversible step",
        reframe="You may not need the whole map before you move; you may need one honest test.",
        landing="Follow the next true step before demanding the entire future.",
        body_cue="pressure, stuckness, anticipation, or a pull toward and away from change",
        metaphor="map",
        tags=["direction", "future", "choice"],
        signal_types=["journal", "reflectionBank", "future_self", "direction", "next_step"],
        anchors=["future-pressure", "choice-cost", "clarity-before-movement"],
        anchor_phrases=["when a next step carries real cost", "when something feels unresolved", "when movement changes more than the plan"],
        vocabulary=["direction", "future", "choice", "stability", "movement", "next step"],
    ),
    "pleasurePlay": CategoryBank(
        category="pleasurePlay",
        theme="pleasure and play",
        pattern="joy asks to count before every responsibility is finished",
        moment="when joy feels unfamiliar or hard to receive",
        meaning="aliveness returning to the body",
        need="enjoyment without an outcome",
        reframe="Pleasure is not a reward for being done; it is part of how life becomes livable.",
        landing="Let one moment of ease exist without making it prove its usefulness.",
        body_cue="lightness, warmth, curiosity, or a quick unclenching",
        metaphor="color",
        tags=["pleasure", "play", "joy"],
        signal_types=["glimmerLog", "dailyCheckIn", "joy", "pleasure", "play"],
        anchors=["joy-unfamiliar", "play-without-outcome", "small-relief"],
        anchor_phrases=["when joy feels unfamiliar", "when rest feels hard to receive", "when a small desire appears before everything is handled"],
        vocabulary=["ease", "aliveness", "permission", "joy", "lightness", "desire"],
    ),
}


def sentence_count(text: str) -> int:
    return len(re.findall(r"[.!?](?=\s|$)", text))


def split_sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text.strip()) if part.strip()]


def normalize_key(text: str, words: int = 5) -> str:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return " ".join(tokens[:words])


def token_set(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 3 and token not in {"that", "this", "when", "your", "with", "from", "into", "before", "after"}
    }


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def choose(values: list[str], index: int) -> str:
    return values[index % len(values)]


def title_theme(bank: CategoryBank) -> str:
    return bank.theme[0].upper() + bank.theme[1:]


def especially_moment(bank: CategoryBank) -> str:
    lowered = bank.moment.lower()
    if lowered.startswith(("when ", "after ", "during ")):
        return bank.moment
    return f"when {bank.moment}"


def normalize_phrase(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def clause(text: str) -> str:
    stripped = text.strip()
    return stripped[0].upper() + stripped[1:] if stripped else stripped


def risk_tail(index: int) -> str:
    return choose([
        "before anyone asks you to",
        "before you check whether it is yours",
        "before support has a chance to exist",
        "before the feeling has somewhere to land",
        "before your body has agreed to the pace",
        "before the room has offered anything back",
    ], index)


def sentence_direct(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"With {bank.theme}, {bank.pattern}.",
        f"{clause(bank.pattern)}.",
        f"Here, {bank.theme} shows one specific move: {bank.pattern}.",
        f"The signal in {bank.theme} gets sharper where {bank.pattern}.",
    ], index)


def sentence_anchor(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"{clause(anchor)}, the old strategy can arrive {risk_tail(index)}.",
        f"{clause(anchor)}, you may already be managing more than the moment admits.",
        f"{clause(anchor)}, the signal can become harder to ignore.",
        f"{clause(anchor)}, the moment may carry more than it admits.",
    ], index)


def sentence_body(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"{clause(bank.body_cue)} can be the first clue.",
        f"Your body may register this as {bank.body_cue}.",
        f"Before {bank.theme} has a clean story, the body may answer with {bank.body_cue}.",
        f"For {bank.theme}, {bank.body_cue} matters because it arrives before the explanation is finished.",
    ], index)


def sentence_meaning(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"Underneath it, {bank.meaning} is trying to get your attention.",
        f"What looks like intensity may be {bank.meaning} asking for a cleaner response.",
        f"That points toward {bank.meaning}, not a reason to turn on yourself.",
        f"The signal is carrying {bank.meaning} in a form you can actually notice.",
    ], index)


def sentence_reframe(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        bank.reframe,
        f"That does not make the signal too much; it makes it worth listening to.",
        f"It is asking for {bank.need}, not another round of self-pressure.",
        f"What needs care here is not the performance of calm, but the part of you tracking {bank.meaning}.",
    ], index)


def sentence_cost(bank: CategoryBank, anchor: str, index: int) -> str:
    noun = choose(bank.vocabulary, index)
    return choose([
        f"The cost is carrying {noun} before you know whether it belongs to you.",
        f"That can leave you managing the moment instead of being supported inside it.",
        f"It can make the present feel heavier than the facts alone explain.",
        f"You may end up solving for the alarm while the need waits underneath it.",
    ], index)


def sentence_need(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"{clause(bank.need)} would change the whole shape of this.",
        f"The next honest move may be {bank.need}, not more proof that the signal is reasonable.",
        f"Bring {bank.need} in earlier, before the pattern has to become louder to be believed.",
        f"If {bank.need} were allowed sooner, the moment would not have to carry so much charge.",
    ], index)


def sentence_question(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"What would change {anchor}?",
        f"What would become easier if {bank.need} arrived earlier?",
        f"Where does the strain around {bank.theme} start asking more from you than the moment has earned?",
        f"What are you already carrying {anchor}?",
    ], index)


def sentence_answer(bank: CategoryBank, anchor: str, index: int) -> str:
    noun = choose(bank.vocabulary, index)
    return choose([
        f"The answer may be in the way {noun} shifts before the situation fully explains itself.",
        f"It may be the place where {bank.need} has been delayed too long.",
        f"It may be the moment you start adapting before anyone else has named the weight.",
        f"It may be where {bank.meaning} stops being abstract and starts changing your body.",
    ], index)


def sentence_metaphor(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"{clause(bank.theme)} can move like {bank.metaphor}, quiet until the room changes.",
        f"The {bank.metaphor} here is not decoration; it is how {bank.meaning} becomes noticeable.",
        f"The image points back to {bank.need}.",
        f"The image works only if it brings you closer to the lived moment.",
    ], index)


def sentence_translation(bank: CategoryBank, anchor: str, index: int) -> str:
    noun = choose(bank.vocabulary, index)
    return choose([
        f"In real life, that may look like {noun} changing {anchor}.",
        f"Translated back into the day, it means {bank.need} has been missing from the moment.",
        f"This is not an abstract symbol; it is {bank.meaning} moving through ordinary experience.",
        f"The image becomes useful when it helps you notice what changes {anchor}.",
    ], index)


def sentence_contrast(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"A simple shame story is too small for {bank.theme}.",
        f"The old explanation shrinks this into personality when the moment is asking for context.",
        f"Calling it too much would miss the part that learned to move early.",
        f"The surface story is easier to blame than the need underneath it.",
    ], index)


def sentence_practical(bank: CategoryBank, anchor: str, index: int) -> str:
    noun = choose(bank.vocabulary, index)
    return choose([
        f"Start smaller: name {noun}, check capacity, and let {bank.need} into the room.",
        f"The practical move is to slow the handoff before the whole thing becomes yours.",
        f"Look at the moment before the reaction, especially {anchor}.",
        f"One cleaner next step is enough; the whole pattern does not need to be solved at once.",
    ], index)


def sentence_threshold(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"This is a threshold, not a final verdict.",
        f"Something changes at the edge where {bank.pattern}.",
        f"The threshold is the second before the old response becomes automatic.",
        f"You are closest to choice right before the pattern takes over.",
    ], index)


def sentence_tender(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"There is a tender part of {bank.theme} that does not need to be rushed.",
        f"Something in you is trying to stay careful {anchor}.",
        f"The softer truth is that {bank.need} may have been missing for longer than you realized.",
        f"That part of you deserves care before it has to become louder.",
    ], index)


def sentence_risky(bank: CategoryBank, anchor: str, index: int) -> str:
    options = [
        f"Some of this may not be yours to carry around {bank.theme}.",
        "Support may not have had a chance to exist yet.",
        f"The room around {bank.theme} may be asking more from you than it has offered back.",
        f"Calling it sensitivity may be easier than naming what {bank.theme} needs.",
        "Asking for help may still feel slower than the old strategy.",
        "Not everything you can hold should become your assignment.",
    ]
    if bank.category in {"familyHome", "responsibilityCare"}:
        options.append("The hardest part may be admitting that the old role still knows your name.")
    return choose(options, index)


def sentence_closing(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        bank.landing,
        f"{clause(bank.need)} belongs here too.",
        f"Around {bank.theme}, some of this may not be yours to carry.",
        "That is enough to listen to.",
        f"The pattern softens when {bank.need} stops needing permission.",
        f"For {bank.theme}, no extra proof is required.",
    ], index)


def sentence_soft_closing(bank: CategoryBank, anchor: str, index: int) -> str:
    return choose([
        f"Stay close to {bank.need} before the moment hardens into self-blame.",
        f"Let the signal around {bank.theme} stay specific instead of turning it into a verdict.",
        f"You do not have to make the need inside {bank.theme} smaller to make it valid.",
        f"Let this part of {bank.theme} be met with care before it becomes another task.",
    ], index)


SENTENCE_BUILDERS = {
    "direct": sentence_direct,
    "anchor": sentence_anchor,
    "body": sentence_body,
    "meaning": sentence_meaning,
    "reframe": sentence_reframe,
    "cost": sentence_cost,
    "need": sentence_need,
    "question": sentence_question,
    "answer": sentence_answer,
    "metaphor": sentence_metaphor,
    "translation": sentence_translation,
    "contrast": sentence_contrast,
    "practical": sentence_practical,
    "threshold": sentence_threshold,
    "tender": sentence_tender,
    "risky": sentence_risky,
    "closing": sentence_closing,
    "softClosing": sentence_soft_closing,
}

SHAPE_FLOWS: dict[str, list[list[str]]] = {
    "punch": [
        ["direct", "risky", "anchor", "reframe"],
        ["anchor", "direct", "cost", "closing"],
        ["direct", "contrast", "anchor", "need", "risky"],
    ],
    "tender": [
        ["tender", "anchor", "need", "softClosing"],
        ["question", "tender", "reframe", "body", "closing"],
        ["anchor", "tender", "meaning", "softClosing"],
    ],
    "body": [
        ["body", "anchor", "meaning", "reframe"],
        ["anchor", "body", "cost", "need", "closing"],
        ["body", "translation", "risky", "softClosing"],
    ],
    "patternAnalysis": [
        ["direct", "anchor", "cost", "need"],
        ["anchor", "meaning", "contrast", "closing"],
        ["question", "answer", "direct", "reframe", "closing"],
    ],
    "practicalCapacity": [
        ["anchor", "practical", "need", "closing"],
        ["question", "direct", "practical", "reframe", "softClosing"],
        ["practical", "body", "cost", "risky"],
    ],
    "poetic": [
        ["metaphor", "anchor", "translation", "closing"],
        ["anchor", "metaphor", "body", "reframe", "softClosing"],
        ["translation", "metaphor", "meaning", "risky"],
    ],
    "questionLed": [
        ["question", "answer", "anchor", "closing"],
        ["question", "body", "meaning", "need", "softClosing"],
        ["anchor", "question", "contrast", "reframe"],
    ],
    "contrast": [
        ["contrast", "direct", "anchor", "risky"],
        ["anchor", "contrast", "reframe", "closing"],
        ["risky", "contrast", "meaning", "softClosing"],
    ],
    "threshold": [
        ["threshold", "anchor", "cost", "need"],
        ["body", "threshold", "question", "closing"],
        ["anchor", "threshold", "risky", "reframe", "softClosing"],
    ],
}


def render_flow(
    bank: CategoryBank,
    shape: str,
    anchor: str,
    index: int,
    attempt: int,
) -> tuple[list[str], str]:
    flows = SHAPE_FLOWS[shape]
    flow_index = (index + attempt) % len(flows)
    flow = flows[flow_index]
    sentences = [
        SENTENCE_BUILDERS[role](bank, anchor, index + offset + attempt)
        for offset, role in enumerate(flow)
    ]
    return sentences, f"{shape}:{flow_index}:{'>'.join(flow)}"


WEEKLY_FLOWS: list[tuple[list[str], list[str]]] = [
    (
        ["anchor", "direct", "risky", "reframe"],
        ["question", "practical", "need", "closing"],
    ),
    (
        ["body", "anchor", "meaning", "softClosing"],
        ["direct", "cost", "question", "closing"],
    ),
    (
        ["metaphor", "translation", "anchor", "reframe"],
        ["threshold", "need", "practical", "softClosing"],
    ),
    (
        ["question", "answer", "direct", "risky", "closing"],
        ["anchor", "body", "meaning", "need"],
    ),
]


def render_weekly_paragraph(
    bank: CategoryBank,
    flow: list[str],
    anchor: str,
    index: int,
) -> str:
    return " ".join(
        SENTENCE_BUILDERS[role](bank, anchor, index + offset)
        for offset, role in enumerate(flow)
    )


def render_weekly(bank: CategoryBank, variant_index: int) -> str:
    first_flow, second_flow = choose(WEEKLY_FLOWS, variant_index)
    anchor_one = choose(bank.anchor_phrases, variant_index)
    anchor_two = choose(bank.anchor_phrases, variant_index + 1)
    first = render_weekly_paragraph(bank, first_flow, anchor_one, variant_index)
    second = render_weekly_paragraph(bank, second_flow, anchor_two, variant_index + 7)
    return f"{first}\n\n{second}"


class GenerationState:
    def __init__(self) -> None:
        self.opening_counts: Counter[str] = Counter()
        self.closing_counts: Counter[str] = Counter()
        self.metaphor_counts: Counter[str] = Counter()
        self.anchor_counts: Counter[str] = Counter()
        self.flow_counts: Counter[str] = Counter()
        self.shape_counts_by_category: dict[str, Counter[str]] = defaultdict(Counter)
        self.body_tokens: list[set[str]] = []

    def too_repetitive(
        self,
        body: str,
        bank: CategoryBank,
        anchor: str,
        shape: str,
        flow_key: str,
        attempt: int,
    ) -> bool:
        sentences = split_sentences(body)
        opening_key = normalize_key(sentences[0], 6)
        closing_key = normalize_key(sentences[-1], 6)
        body_token_set = token_set(body)
        too_similar = any(jaccard(body_token_set, existing) > 0.72 for existing in self.body_tokens[-80:])
        if too_similar and attempt < 80:
            return True
        if self.opening_counts[opening_key] >= 2 and attempt < 60:
            return True
        if self.closing_counts[closing_key] >= 2 and attempt < 60:
            return True
        if self.metaphor_counts[bank.metaphor] >= 24 and shape == "poetic" and attempt < 40:
            return True
        if self.anchor_counts[anchor] >= 24 and attempt < 30:
            return True
        if self.flow_counts[flow_key] >= 10 and attempt < 50:
            return True
        return False

    def record(self, body: str, bank: CategoryBank, anchor: str, shape: str, flow_key: str) -> None:
        sentences = split_sentences(body)
        self.opening_counts[normalize_key(sentences[0], 6)] += 1
        self.closing_counts[normalize_key(sentences[-1], 6)] += 1
        self.metaphor_counts[bank.metaphor] += 1
        self.anchor_counts[anchor] += 1
        self.flow_counts[flow_key] += 1
        self.shape_counts_by_category[bank.category][shape] += 1
        self.body_tokens.append(token_set(body))


def validate_card_body(body: str) -> list[str]:
    errors: list[str] = []
    if not isinstance(body, str):
        return ["body must be a string"]
    if "\n" in body.strip():
        errors.append("card body must be one paragraph")
    count = sentence_count(body)
    if count not in {4, 5}:
        errors.append(f"card body must be 4 or 5 sentences, got {count}")
    lowered = body.lower()
    for phrase in [*BLOCKED_PHRASES, *SCAFFOLD_PHRASES]:
        if phrase.lower() in lowered:
            errors.append(f"blocked phrase: {phrase}")
    if "{" in body or "}" in body:
        errors.append("body contains unresolved template braces")
    return errors


def paragraph_metadata(bank: CategoryBank, body: str, shape: str, index: int, anchor: str) -> dict[str, object]:
    return {
        "id": f"{bank.category}_{shape}_{index + 1:03d}",
        "category": bank.category,
        "writerShape": shape,
        "anchors": sorted(set([*bank.anchors, slug(anchor)])),
        "tone": SHAPE_TONES[shape],
        "intensity": SHAPE_INTENSITIES[shape],
        "signalTypes": bank.signal_types,
        "tags": bank.tags,
        "avoidIfRecentlyUsed": True,
        "body": body,
    }


def generate_card_paragraphs() -> list[dict[str, object]]:
    state = GenerationState()
    items: list[dict[str, object]] = []

    for category_index, bank in enumerate(CATEGORY_BANKS.values()):
        for shape_index, shape in enumerate(WRITER_SHAPES):
            selected: dict[str, object] | None = None
            for attempt in range(120):
                anchor = choose(bank.anchor_phrases, category_index + shape_index + attempt)
                sentences, flow_key = render_flow(
                    bank,
                    shape,
                    anchor,
                    category_index + shape_index,
                    attempt,
                )
                body = " ".join(sentences)
                errors = validate_card_body(body)
                if errors:
                    continue
                if state.too_repetitive(body, bank, anchor, shape, flow_key, attempt):
                    continue
                selected = paragraph_metadata(bank, body, shape, shape_index, anchor)
                state.record(body, bank, anchor, shape, flow_key)
                break
            if selected is None:
                raise RuntimeError(f"Could not generate paragraph for {bank.category}/{shape}")
            items.append(selected)

    return items


def validate_weekly_body(body: str) -> list[str]:
    errors: list[str] = []
    paragraphs = [part.strip() for part in body.split("\n\n") if part.strip()]
    if len(paragraphs) not in {2, 3, 4}:
        errors.append(f"weekly body must have 2 to 4 paragraphs, got {len(paragraphs)}")
    for index, paragraph in enumerate(paragraphs, start=1):
        count = sentence_count(paragraph)
        if count not in {4, 5}:
            errors.append(f"weekly paragraph {index} must be 4 or 5 sentences, got {count}")
    lowered = body.lower()
    for phrase in [*BLOCKED_PHRASES, *SCAFFOLD_PHRASES]:
        if phrase.lower() in lowered:
            errors.append(f"blocked phrase: {phrase}")
    if "{" in body or "}" in body:
        errors.append("body contains unresolved template braces")
    return errors


def generate_weekly_paragraphs() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for category_index, bank in enumerate(CATEGORY_BANKS.values()):
        for variant_index, shape in enumerate(["patternAnalysis", "tender"]):
            body = render_weekly(bank, category_index + variant_index)
            errors = validate_weekly_body(body)
            if errors:
                raise RuntimeError(f"Invalid weekly body for {bank.category}/{variant_index}: {errors}")
            items.append(
                {
                    "id": f"{bank.category}_weekly_{variant_index + 1:03d}",
                    "category": bank.category,
                    "writerShape": shape,
                    "anchors": sorted(set([*bank.anchors, slug(choose(bank.anchor_phrases, category_index + variant_index))])),
                    "tone": SHAPE_TONES[shape],
                    "intensity": "medium",
                    "signalTypes": bank.signal_types,
                    "tags": bank.tags,
                    "avoidIfRecentlyUsed": True,
                    "body": body,
                }
            )
    return items


def ts_string(items: list[dict[str, object]], weekly_items: list[dict[str, object]]) -> str:
    domain_json = json.dumps(generated_domain_definitions(), indent=2, ensure_ascii=False)
    taxonomy_json = json.dumps(generated_taxonomy_entries(), indent=2, ensure_ascii=False)
    card_json = json.dumps(items, indent=2, ensure_ascii=False)
    weekly_json = json.dumps(weekly_items, indent=2, ensure_ascii=False)
    card_json_literal = json.dumps(card_json, ensure_ascii=False)
    card_json_literal = json.dumps(card_json, ensure_ascii=False)
    domain_json = json.dumps(generated_domain_definitions(), indent=2, ensure_ascii=False)
    return f"""// AUTO-GENERATED by scripts/generateInsightParagraphLibrary.py.
// Do not edit by hand. Run `python3 scripts/generateInsightParagraphLibrary.py`.

import type {{ InsightCategory }} from '../insightsV2/types';

export type GeneratedInsightWriterShape =
  | 'punch'
  | 'tender'
  | 'body'
  | 'patternAnalysis'
  | 'practicalCapacity'
  | 'poetic'
  | 'questionLed'
  | 'contrast'
  | 'threshold';

export type GeneratedInsightTone =
  | 'direct'
  | 'tender'
  | 'grounded'
  | 'practical'
  | 'poetic'
  | 'reflective';

export type GeneratedInsightIntensity = 'low' | 'medium' | 'high';

export interface GeneratedInsightParagraph {{
  id: string;
  category: InsightCategory;
  writerShape: GeneratedInsightWriterShape;
  anchors: readonly string[];
  tone: GeneratedInsightTone;
  intensity: GeneratedInsightIntensity;
  signalTypes: readonly string[];
  tags: readonly string[];
  avoidIfRecentlyUsed: boolean;
  body: string;
}}

export const GENERATED_INSIGHT_PARAGRAPHS = {card_json} as const satisfies readonly GeneratedInsightParagraph[];

export const GENERATED_WEEKLY_INSIGHT_PARAGRAPHS = {weekly_json} as const satisfies readonly GeneratedInsightParagraph[];
"""


def normalize_key(text: str, words: int = 6) -> str:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return " ".join(tokens[:words])


def normalize_last_key(text: str, words: int = 3) -> str:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return " ".join(tokens[-words:])


def anchored_clause(anchor: str) -> str:
    anchor = clean_anchor(anchor)
    if anchor.lower().startswith(("when ", "after ", "during ")):
        return anchor
    return f"when {anchor}"


def question_opening_key(sentence: str) -> str:
    if not sentence.strip().endswith("?"):
        return ""
    return normalize_key(sentence, 3)


def contrast_opening_key(sentence: str) -> str:
    lowered = sentence.lower()
    prefixes = [
        "from the outside",
        "the surface story",
        "it may seem",
        "a harsher read",
        "the more honest read",
    ]
    if any(lowered.startswith(prefix) for prefix in prefixes):
        return normalize_key(sentence, 4)
    return ""


def token_set(text: str) -> set[str]:
    ignored = {"that", "this", "when", "your", "with", "from", "into", "before", "after", "what", "where", "more"}
    return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) > 3 and token not in ignored}


def theme_without_article(bank: CategoryBank) -> str:
    return re.sub(r"^(the|your)\s+", "", bank.theme, flags=re.I)


def clean_anchor(anchor: str) -> str:
    return anchor.strip().rstrip(".")


def capitalize_anchor(anchor: str) -> str:
    anchor = clean_anchor(anchor)
    return anchor[0].upper() + anchor[1:]


def join_body(sentences: list[str]) -> str:
    return " ".join(sentence.strip() for sentence in sentences if sentence.strip())


def pattern_type_for_curated(item: dict[str, object]) -> str:
    item_id = str(item.get("id", ""))
    if item_id in PATTERN_TYPE_BY_CURATED_ID:
        return PATTERN_TYPE_BY_CURATED_ID[item_id]
    body = str(item.get("body", "")).lower()
    if any(term in body for term in ["later", "afterward", "hours after", "comes back", "quiet"]):
        return "delayedActivation"
    if any(term in body for term in ["part of you", "pull back", "step back", "both", "while another"]):
        return "pushPull"
    if any(term in body for term in ["surface", "quiet", "avoid", "drift", "doesn’t fully", "doesn't fully"]):
        return "lowAccess"
    return "highTracking"


def with_pattern_type(item: dict[str, object]) -> dict[str, object]:
    next_item = dict(item)
    next_item["patternType"] = str(next_item.get("patternType") or pattern_type_for_curated(next_item))
    return next_item


def domain_metadata_for_category(category: str) -> dict[str, object]:
    domain_key, subcategory = CATEGORY_DOMAIN_MAP.get(category, ("humanisticNeeds", "unmetNeedRecognition"))
    domain = DOMAIN_BY_KEY[domain_key]
    return {
        "majorDomain": domain["key"],
        "theoryLens": domain["theoryLens"],
        "insightSubcategory": subcategory,
    }


def with_full_metadata(item: dict[str, object]) -> dict[str, object]:
    next_item = with_pattern_type(item)
    next_item.update(domain_metadata_for_category(str(next_item.get("category", ""))))
    return next_item


def default_subcategory_guidance(domain: dict[str, object]) -> dict[str, object]:
    domain_name = str(domain["domainName"])
    guidance: dict[str, object] = {}
    for subcategory in domain["subcategories"]:
        key = str(subcategory)
        readable = user_facing_taxonomy_phrase(key)
        guidance[key] = {
            "covers": f"How {readable} shows up inside {domain_name}.",
            "patternTypes": {
                "highTracking": f"You track early signs around {readable} and respond quickly.",
                "lowAccess": f"You distance from {readable} or keep it less named.",
                "pushPull": f"You want what {readable} offers while also protecting against its cost.",
                "delayedActivation": f"You register {readable} after the moment has already passed.",
            },
        }
    return guidance


def generated_domain_definitions() -> list[dict[str, object]]:
    domains: list[dict[str, object]] = []
    for domain in DOMAIN_DEFINITIONS:
        domains.append(
            {
                "majorDomain": domain["key"],
                **domain,
                "excludeFromDreamInsights": bool(domain.get("excludeFromDreamInsights", False)),
                "includeInTodayInsights": bool(domain.get("includeInTodayInsights", True)),
                "includeInPatternScreen": bool(domain.get("includeInPatternScreen", True)),
                "patternTypes": PATTERN_TYPES,
                "subcategoryGuidance": domain.get("subcategoryGuidance") or default_subcategory_guidance(domain),
                "microMoments": GENERIC_MICRO_MOMENTS,
                "actions": GENERIC_ACTIONS,
                "validationStyle": HUMAN_VALIDATION_BANKS,
                "landings": STRONG_LANDING_BANKS,
            }
        )
    return domains


def humanize_key(value: str) -> str:
    spaced = re.sub(r"(?<!^)(?=[A-Z])", " ", value).replace("_", " ").replace("-", " ")
    return re.sub(r"\s+", " ", spaced).strip().lower()


def user_facing_taxonomy_phrase(value: str) -> str:
    phrase = humanize_key(value)
    replacements = {
        "threat detection": "early risk sensing",
        "early threat detection": "early risk sensing",
        "threat appraisal": "risk reading",
        "openness to experience": "openness to what is new",
        "conscientiousness": "standards and follow-through",
        "agreeableness": "harmony",
        "cognitive appraisal": "how the situation gets read",
        "executive function": "task organization",
        "activation energy": "energy to begin",
        "time perception": "felt time",
        "self actualization": "growth toward yourself",
        "self-actualization": "growth toward yourself",
        "emotional regulation": "emotional steadiness",
        "social learning": "learned relational patterns",
        "learned helplessness": "old stuckness",
        "family systems": "family patterns",
        "interoception": "body awareness",
        "somatic psychology": "body signals",
    }
    for blocked, replacement in replacements.items():
        phrase = phrase.replace(blocked, replacement)
    phrase = phrase.replace("early early risk sensing", "early risk sensing")
    return phrase


def subcategory_guidance(domain: dict[str, object], subcategory: str) -> dict[str, object]:
    guidance = domain.get("subcategoryGuidance") or default_subcategory_guidance(domain)
    return dict(guidance.get(subcategory, default_subcategory_guidance(domain)[subcategory]))  # type: ignore[union-attr]


def taxonomy_anchor_bank(domain: dict[str, object], subcategory: str) -> list[str]:
    domain_key = str(domain["key"])
    readable = humanize_key(subcategory)
    words = [word for word in re.findall(r"[a-z]+", readable) if len(word) > 2]
    anchors = [
        slug(subcategory),
        slug(readable),
        slug(str(domain["domainName"])),
        slug(domain_key),
    ]
    anchors.extend(slug(word) for word in words[:4])
    anchors.extend(slug(value) for value in DOMAIN_SOURCE_BANKS.get(domain_key, [])[:2])
    anchors.extend(SUBCATEGORY_ANCHOR_OVERRIDES.get(subcategory, []))
    return sorted(set(anchor for anchor in anchors if anchor))


def taxonomy_signal_types(domain: dict[str, object], subcategory: str) -> list[str]:
    domain_key = str(domain["key"])
    readable = humanize_key(subcategory)
    base = list(DOMAIN_SOURCE_BANKS.get(domain_key, ["journal", "dailyCheckIn", "reflectionBank"]))
    signals = [
        slug(subcategory).replace("-", "_"),
        slug(readable).replace("-", "_"),
        f"{domain_key}_signal",
    ]
    signals.extend(SUBCATEGORY_SIGNAL_OVERRIDES.get(subcategory, []))
    return sorted(set([*base, *signals]))


def taxonomy_allowed_surfaces(domain: dict[str, object]) -> list[str]:
    if bool(domain.get("excludeFromDreamInsights", False)):
        return []
    surfaces: list[str] = []
    if bool(domain.get("includeInTodayInsights", True)):
        surfaces.append("today")
    if bool(domain.get("includeInPatternScreen", True)):
        surfaces.extend(["patterns", "weeklyDeepDive", "thisWeek"])
    return surfaces


def generated_taxonomy_entries() -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    legacy_defaults = {value: key for key, value in CATEGORY_DOMAIN_MAP.items()}

    for domain in DOMAIN_DEFINITIONS:
        domain_key = str(domain["key"])
        category = DOMAIN_LEGACY_CATEGORY_MAP[domain_key]
        subcategories = [str(value) for value in domain["subcategories"]]
        for subcategory in subcategories:
            guidance = subcategory_guidance(domain, subcategory)
            pattern_type_rules = dict(guidance["patternTypes"])  # type: ignore[index]
            entries.append(
                {
                    "id": f"{domain_key}_{subcategory}",
                    "category": category,
                    "majorDomain": domain_key,
                    "domainName": domain["domainName"],
                    "subcategory": subcategory,
                    "theoryLens": domain["theoryLens"],
                    "anchors": taxonomy_anchor_bank(domain, subcategory),
                    "signalTypes": taxonomy_signal_types(domain, subcategory),
                    "allowedSurfaces": taxonomy_allowed_surfaces(domain),
                    "patternTypes": PATTERN_TYPES,
                    "patternTypeRules": pattern_type_rules,
                    "isLegacyDefault": legacy_defaults.get((domain_key, subcategory)) == category,
                }
            )
    return entries


def category_phrase(bank: CategoryBank) -> str:
    return theme_without_article(bank)


def prose_meaning(bank: CategoryBank) -> str:
    return re.split(r",\s*not\b|\s+rather than\b", bank.meaning, maxsplit=1)[0].strip()


def is_plural_phrase(value: str) -> bool:
    lowered = value.lower()
    return " and " in lowered or lowered.endswith("s")


def has_verb(value: str) -> str:
    return "have" if is_plural_phrase(value) else "has"


def is_verb(value: str) -> str:
    return "are" if is_plural_phrase(value) else "is"


def belongs_verb(value: str) -> str:
    return "belong" if is_plural_phrase(value) else "belongs"


def pattern_truth(bank: CategoryBank, i: int) -> str:
    theme = category_phrase(bank)
    meaning = prose_meaning(bank)
    options = [
        f"In {theme}, you may be noticing how {bank.pattern}.",
        f"Around {theme}, the returning shape may be how {bank.pattern}.",
        f"With {theme}, something keeps returning to {meaning}.",
        f"For {theme}, the strongest signal is not random; {bank.pattern}.",
        f"Near {theme}, the repeated pressure is the way {bank.pattern}.",
        f"Through {theme}, one truth keeps surfacing: {bank.pattern}.",
        f"Under {theme}, the day may be showing how {bank.pattern}.",
        f"At the center of {theme}, {meaning} may be asking for more room.",
    ]
    return choose(options, i)


def lived_anchor_sentence(bank: CategoryBank, anchor: str, i: int) -> str:
    anchor = clean_anchor(anchor)
    noun = choose(bank.vocabulary, i)
    options = [
        f"{capitalize_anchor(anchor)}, the moment may ask more from you than your system has had time to sort.",
        f"{capitalize_anchor(anchor)}, {noun} can become charged before the situation fully explains itself.",
        f"{capitalize_anchor(anchor)}, the outside moment may look smaller than what your body is tracking.",
        f"{capitalize_anchor(anchor)}, pressure can arrive before choice has enough room.",
        f"{capitalize_anchor(anchor)}, your system may keep working after everyone else thinks the moment has passed.",
    ]
    return choose(options, i)


def protection_sentence(bank: CategoryBank, i: int) -> str:
    meaning = prose_meaning(bank)
    options = [
        f"It may be trying to protect {bank.need} before the old pressure takes over.",
        f"Part of you may be trying to keep {meaning} from becoming too much to hold alone.",
        f"The response may be less about the surface situation and more about keeping {bank.need} within reach.",
        f"Something in you may be guarding {bank.need} because the moment feels too easy to lose.",
        f"The signal may be trying to make sure {meaning} does not get ignored again.",
    ]
    return choose(options, i)


def reframe_sentence(bank: CategoryBank, i: int) -> str:
    options = [
        bank.reframe,
        f"This is not something to shame out of yourself; it is a signal asking for gentler contact.",
        f"The signal makes more sense when it is treated as protection, not a flaw.",
        f"What looks excessive from the outside may be your system trying to stay close to what matters.",
        f"The reaction deserves curiosity before it gets turned into criticism.",
    ]
    return choose(options, i)


def cost_sentence(bank: CategoryBank, i: int) -> str:
    options = [
        f"The cost is that {bank.need} can become harder to feel right when you need it most.",
        f"The hard part is that the strategy can keep you braced even after the danger has passed.",
        f"The pattern may protect something real, but it can also make the moment heavier than it has to be.",
        f"The protection makes sense, even when it leaves you carrying more than the present requires.",
        f"The signal is useful, but it should not have to do all the work alone.",
    ]
    return choose(options, i)


def body_sentence(bank: CategoryBank, i: int) -> str:
    theme = category_phrase(bank)
    options = [
        f"In {theme}, {bank.body_cue} may be the first place this becomes visible.",
        f"Around {theme}, your body may register {bank.body_cue} before your thoughts can organize the story.",
        f"With {theme}, the body may speak through {bank.body_cue}, especially when words arrive late.",
        f"Near {theme}, {bank.body_cue} can be the early signal that something in the moment needs care.",
        f"Before {theme} has a clean explanation, the body may already be holding {bank.body_cue}.",
        f"Under {theme}, the first clue may be {bank.body_cue} rather than a finished thought.",
        f"Through {theme}, sensation may arrive as {bank.body_cue} before language catches up.",
        f"At the edge of {theme}, {bank.body_cue} may be the part telling the truth first.",
    ]
    return choose(options, i)


def practical_sentence(bank: CategoryBank, i: int) -> str:
    options = [
        f"The next useful move may be to bring {bank.need} into the moment sooner.",
        f"Instead of pushing harder, the pattern may need {bank.need} built into the shape of the day.",
        f"The work is not to erase the signal; it is to give {bank.need} somewhere real to land.",
        f"A smaller, steadier response may help more than another demand for self-control.",
        f"Capacity changes when {bank.need} {is_verb(bank.need)} treated as part of the plan, not an afterthought.",
    ]
    return choose(options, i)


def poetic_sentence(bank: CategoryBank, i: int) -> str:
    noun = choose(bank.vocabulary, i)
    theme = category_phrase(bank)
    meaning = prose_meaning(bank)
    options = [
        f"In {theme}, the {bank.metaphor} is not decoration; it is how {noun} becomes visible.",
        f"Around {theme}, this can move like {bank.metaphor}, changing the emotional air before you can name it.",
        f"With {theme}, the image matters because it gives shape to {meaning}.",
        f"Near {theme}, the pattern can feel like {bank.metaphor}: quiet, present, and hard to ignore.",
        f"Through {theme}, the {bank.metaphor} points toward what the ordinary explanation keeps missing.",
        f"Under {theme}, the symbol is useful because it gives {noun} somewhere to stand.",
        f"At the center of {theme}, the image gives the feeling a shape you can approach.",
        f"Inside {theme}, metaphor becomes practical when it helps {bank.meaning} become nameable.",
    ]
    return choose(options, i)


def question_sentence(bank: CategoryBank, anchor: str, i: int) -> str:
    anchor = anchored_clause(anchor)
    theme = category_phrase(bank)
    options = [
        f"In {theme}, where does pressure first enter?",
        f"Around {theme}, what keeps becoming yours too quickly?",
        f"{capitalize_anchor(anchor)}, what does your system start protecting?",
        f"Where does {bank.need} disappear first?",
        f"Within {theme}, what feels harder to name {anchor}?",
        f"Which part of {theme} starts asking for support before you notice it?",
        f"How does your body know {anchor} before your mind catches up?",
        f"Where does the load become real in {theme}?",
        f"At the edge of {theme}, what starts asking for steadier care?",
        f"Under {theme}, which responsibility arrives before consent?",
        f"Through {theme}, what gets protected before it gets understood?",
        f"Near {theme}, where does the moment begin to cost more than it gives?",
    ]
    return choose(options, i)


def contrast_sentence(bank: CategoryBank, i: int) -> str:
    theme = category_phrase(bank)
    meaning = prose_meaning(bank)
    options = [
        f"From the outside, this can look like overreaction around {theme}.",
        f"The surface story may call this resistance, but {bank.need} is closer to the truth.",
        f"It may seem like too much feeling until {meaning} is allowed into the room.",
        f"A harsher read would say this is delay, but the body may be asking for more room.",
        f"The more honest read is that {meaning} has been carrying too much alone.",
        f"Around {theme}, the outside can call this intensity while the inside is reading risk.",
        f"Within {theme}, the surface story may call this a problem, but it is also information about {bank.need}.",
        f"Near {theme}, it may seem like the moment is small, but {meaning} gives it weight.",
        f"Under {theme}, a harsher read would miss how much protection is happening.",
        f"Through {theme}, the more honest read is that the signal has a reason for arriving fast.",
        f"In {theme}, what appears excessive may be your system trying to preserve {bank.need}.",
        f"At the edge of {theme}, what seems like resistance may be the first honest limit.",
    ]
    return choose(options, i)


def notice_before_story_sentence(bank: CategoryBank, anchor: str, i: int) -> str:
    anchor = clean_anchor(anchor)
    theme = category_phrase(bank)
    options = [
        f"{capitalize_anchor(anchor)}, your body notices before your mind has the full story.",
        f"{capitalize_anchor(anchor)}, your system registers the shift before you can explain why it matters.",
        f"Inside {theme}, the signal can arrive before the story has organized itself.",
        f"Around {theme}, something in you starts tracking the change before the moment has named itself.",
        f"{capitalize_anchor(anchor)}, your body may know the moment has weight before your thoughts know what to do with it.",
        f"Near {theme}, the first clue may be a reaction that arrives before language does.",
    ]
    return choose(options, i)


def behavior_chain_sentence(bank: CategoryBank, i: int) -> str:
    category_options = {
        "relationships": [
            "You start replaying what changed, measuring the distance, and wondering if you need to explain yourself differently to keep the connection safe.",
            "You may start scanning tone, timing, and silence for clues about whether repair is still available.",
        ],
        "communicationVoice": [
            "You start revising the sentence, adding context, and trying to keep the truth from being bent into something else.",
            "You may begin measuring every word for accuracy because being misunderstood would cost too much.",
        ],
        "bodySignals": [
            "You start tracking the chest, the breath, and the tension because the body is already carrying what has not found words.",
            "You may begin checking the sensation for meaning before the mind has a clean explanation.",
        ],
        "timeRhythms": [
            "You start counting the tasks, shrinking the margins, and trying to move faster than your capacity can follow.",
            "You may begin treating every transition like a test of whether you can keep the whole day from spilling over.",
        ],
        "responsibilityCare": [
            "You start noticing the loose end, calculating the need, and preparing to hold it before anyone asks whether it should be yours.",
            "You may begin carrying the repair in your mind before support has a chance to become real.",
        ],
        "safetyRegulation": [
            "You start checking the room, reading the cues, and preparing your body before safety has had time to prove itself.",
            "You may begin bracing before anything has actually happened because the nervous system wants proof it can settle.",
        ],
        "selfWorthReceiving": [
            "You start minimizing the need, deflecting the care, and wondering whether receiving it will create a debt.",
            "You may begin turning kindness into something you have to earn before it has a chance to land.",
        ],
        "griefTransitions": [
            "You start touching the before and after, looking for what remains, and trying to make the change less final by understanding it.",
            "You may begin carrying the unfinished goodbye through ordinary moments that seem too small to explain the ache.",
        ],
        "pleasurePlay": [
            "You start checking whether ease is allowed, whether joy has a cost, and whether the lightness will ask too much of you later.",
            "You may begin making pleasure justify itself before it has a chance to become real.",
        ],
    }
    fallback = [
        f"You start measuring the weight, checking the cues, and trying to keep {bank.need} from slipping out of reach.",
        f"You may begin tracking what changed, what it costs, and whether {bank.need} is still available.",
        f"Part of you starts organizing the moment around {bank.meaning} before anyone else can see the load.",
        f"Before the moment is fully named, you may already be working to protect {bank.need}.",
    ]
    return choose(category_options.get(bank.category, fallback), i)


def inner_stakes_sentence(bank: CategoryBank, i: int) -> str:
    meaning = prose_meaning(bank)
    if bank.category == "relationships":
        relationship_options = [
            "Somewhere in you, connection still feels like something that can disappear if you miss the signs.",
            "Part of you may still believe repair has to be protected before the moment proves itself.",
            "The hidden fear may be that closeness can vanish before anyone admits it is leaving.",
            "Somewhere in you, connection still feels like something that can disappear if you miss the signs.",
            "A younger alarm may still treat distance as something that has to be caught before it becomes loss.",
        ]
        return choose(relationship_options, i)
    options = [
        f"Somewhere in you, {bank.need} still feels like something that can disappear if you miss the signs.",
        "Somewhere in you, the important thing still feels like it can disappear if you miss the signs.",
        f"Part of you may still believe {bank.need} has to be protected before the moment proves itself.",
        "The hidden fear may be that what you need can disappear without warning.",
        f"A younger alarm may still treat {bank.need} as something that has to be guarded before it is gone.",
        f"Somewhere inside, {meaning} still feels easier to protect early than repair later.",
        "Under the surface, the old lesson may be that missing the sign is how you lose the thing that matters.",
        f"The tender part is how quickly {bank.need} can start to feel conditional.",
    ]
    return choose(options, i)


def not_making_up_sentence(bank: CategoryBank, i: int) -> str:
    if bank.category == "relationships":
        relationship_options = [
            "You are not making it up; you are trying to catch the break before it happens.",
            "You are not inventing the distance; you are trying to understand whether the connection is still safe.",
            "You are not being dramatic; you are trying to reach the sign before the break does.",
            "You are not wrong for noticing; you are trying to understand whether the moment is about to change shape.",
            "You are not making it up; you are trying to catch the break before it happens.",
        ]
        return choose(relationship_options, i)
    options = [
        "You are not making it up; you are trying to catch the break before it happens.",
        "You are not inventing the weight; you are trying to notice the rupture before it becomes real.",
        "You are not being dramatic; you are trying to reach the sign before the break does.",
        "You are not wrong for noticing; you are trying to understand whether the moment is about to change shape.",
        "You are not creating the alarm from nothing; you are trying to protect the part that learned to watch closely.",
        "You are not overcomplicating the moment; you are trying to find the point where it might turn.",
    ]
    return choose(options, i)


def bracing_cost_sentence(bank: CategoryBank, i: int) -> str:
    meaning = prose_meaning(bank)
    if bank.category == "relationships":
        relationship_options = [
            "That kind of bracing makes sense, but it can leave you living inside a rupture that has not actually arrived.",
            "Early watchfulness makes sense, but it can make you inhabit a danger the present has not confirmed.",
            "That protection is understandable, but it can pull your body into a loss the moment has not asked you to carry.",
            "The bracing has logic, but it can make the possible break feel like it is already happening.",
            "The care underneath it is real, but waiting for impact can become its own kind of rupture.",
            "That kind of bracing makes sense, but it can leave you living inside a rupture that has not actually arrived.",
        ]
        return choose(relationship_options, i)
    options = [
        "That kind of bracing makes sense, but it can leave you living inside a rupture that has not actually arrived.",
        "Early watchfulness makes sense, but it can make you inhabit a danger the present has not confirmed.",
        "That protection is understandable, but it can pull your body into a loss the moment has not asked you to carry.",
        "The bracing has logic, but it can make the possible break feel like it is already happening.",
        "The care underneath it is real, but waiting for impact can become its own kind of rupture.",
        f"A response like that deserves respect, but {bank.need} should not have to live under constant threat.",
        f"The signal is trying to help, but {meaning} can become heavier when every shift feels final.",
        "The risk is that you start surviving the break before you know whether anything has broken.",
        "The body can end up responding to a rupture the present has not actually confirmed.",
        f"By then, {bank.need} may be living inside the possible break instead of the moment in front of you.",
        f"The hardest part is that protecting {bank.need} can start to feel like staying ready for loss.",
        "Sometimes the cost is not the feeling itself, but how long you have to brace around it.",
    ]
    return choose(options, i)


def landing_sentence(bank: CategoryBank, shape: str, flow: str, i: int) -> str:
    theme = category_phrase(bank)
    options = [
        bank.landing,
        f"Inside {theme}, that is the signal worth respecting.",
        f"That is where the next honest step begins around {bank.need}.",
        f"The pressure may not need more force around {bank.need}.",
        f"Inside {theme}, the room may need more support, not more of you.",
        f"In {theme}, start where the load becomes real.",
        f"Inside {theme}, nothing gets softer when you disappear into it.",
        f"{bank.need.capitalize()} {belongs_verb(bank.need)} in the room before {theme} gets louder.",
        f"For {theme}, the signal can be honored without becoming the whole story.",
        f"Around {bank.need}, the next step can be smaller than the whole repair.",
        f"Before {theme} takes over, that is the place to slow down.",
        f"Around {bank.need}, the truer move may be acting before the demand expands.",
        f"In {theme}, you do not have to become smaller for the pattern to make sense.",
        f"Where {theme} becomes heavy, support belongs at the exact point.",
        f"The honest beginning is wherever {bank.need} stops being theoretical.",
        f"Around {bank.need}, the next response can respect both the signal and the person carrying it.",
        f"What changes things is making room for {bank.need} before the moment hardens.",
        f"Stay with the first place {theme} becomes specific.",
        f"Enough changes when {bank.need} is allowed to count early.",
    ]
    if flow == "unfinishedEnding":
        options = [
            f"Some of this may not be yours to carry in {theme}.",
            f"That is worth noticing before you pick up {bank.need}.",
            f"The signal can stop being the only one working for {bank.need}.",
            f"Not everything heavy belongs inside {theme}.",
            f"Inside {theme}, the room may need more support, not more of you.",
            f"Inside {theme}, nothing gets softer when you disappear into it.",
            f"In {theme}, start where the load becomes real.",
            f"Inside {theme}, that is the signal worth respecting.",
            f"The pressure may not need more force around {bank.need}.",
            f"The next honest step may be naming {bank.need}.",
        ]
    return choose(options, i)


def bank_values(source: dict[str, dict[str, list[str]]], bank: CategoryBank, pattern_type: str) -> list[str]:
    category_values = source.get(bank.category, {})
    return category_values.get(pattern_type) or GENERIC_MICRO_MOMENTS[pattern_type]


def action_values(bank: CategoryBank, pattern_type: str) -> list[str]:
    category_values = ACTION_BANKS.get(bank.category, {})
    return category_values.get(pattern_type) or GENERIC_ACTIONS[pattern_type]


def micro_moment(bank: CategoryBank, pattern_type: str, i: int) -> str:
    return choose(bank_values(MICRO_MOMENT_BANKS, bank, pattern_type), i)


def micro_action(bank: CategoryBank, pattern_type: str, i: int) -> str:
    return choose(action_values(bank, pattern_type), i)


def human_validation(pattern_type: str, i: int) -> str:
    return choose(HUMAN_VALIDATION_BANKS[pattern_type], i)


def strong_landing(pattern_type: str, i: int) -> str:
    return choose(STRONG_LANDING_BANKS[pattern_type], i)


def ensure_sentence(text: str) -> str:
    text = text.strip()
    text = text[:1].upper() + text[1:] if text else text
    if text.endswith((".", "!", "?")):
        return text
    return f"{text}."


def lower_first(value: str) -> str:
    return value[:1].lower() + value[1:] if value else value


def contextual_landing(bank: CategoryBank, landing: str, shape: str, i: int) -> str:
    return landing


def render_micro_pattern(bank: CategoryBank, pattern_type: str, shape: str, i: int) -> list[str]:
    category_offset = len(bank.category) + len(shape)
    moment = micro_moment(bank, pattern_type, i + category_offset)
    action = micro_action(bank, pattern_type, i + 1 + category_offset)
    validation = human_validation(pattern_type, i + 2 + category_offset)
    landing = contextual_landing(bank, strong_landing(pattern_type, i + 3 + category_offset), shape, i + category_offset)
    theme = category_phrase(bank)

    setups = {
        "highTracking": [
            f"{capitalize_anchor(moment)}, you notice before the moment has fully explained itself.",
            f"{capitalize_anchor(moment)}, your attention goes there before anyone says it out loud.",
            f"The first thing you catch is {moment}.",
            f"{capitalize_anchor(moment)}, something in you starts reading the room quickly.",
        ],
        "lowAccess": [
            f"{capitalize_anchor(moment)}, it can feel easier to stay just outside the feeling.",
            f"{capitalize_anchor(moment)}, you may keep the moment simple before you know what you feel.",
            f"The distance often begins {moment}.",
            f"{capitalize_anchor(moment)}, the deeper part can stay unnamed for a while.",
        ],
        "pushPull": [
            f"{capitalize_anchor(moment)}, both directions can feel true at once.",
            f"{capitalize_anchor(moment)}, one part of you moves closer while another part protects the edge.",
            f"The split often shows up {moment}.",
            f"{capitalize_anchor(moment)}, the want and the guard can arrive together.",
        ],
        "delayedActivation": [
            f"{capitalize_anchor(moment)}, the first reaction may look smaller than what comes later.",
            f"{capitalize_anchor(moment)}, you may not feel the whole thing right away.",
            f"The delayed part often begins {moment}.",
            f"{capitalize_anchor(moment)}, the feeling can wait until there is room to arrive.",
        ],
    }
    action_sentences = [
        f"Before you have a full explanation, {action}.",
        f"In that moment, {action}.",
        f"What you do next is specific: {action}.",
        f"The move is small but exact: {action}.",
    ]
    bridge_sentences = {
        "highTracking": [
            f"The detail may be small, but your response treats it like something that could matter.",
            f"You are not waiting for the pattern to announce itself before you begin responding.",
            f"That early read can make {theme} feel urgent before the moment is settled.",
        ],
        "lowAccess": [
            f"The quiet can look like indifference from the outside, but it is often a way to keep things manageable.",
            f"The feeling is still there; it just has not become reachable yet.",
            f"Staying surface-level can buy time when {theme} asks more than you have available.",
        ],
        "pushPull": [
            f"The tension is not random; one need is reaching while another need is keeping watch.",
            f"The movement can look inconsistent, but both sides are trying to keep something intact.",
            f"You may be negotiating access and protection at the same time.",
        ],
        "delayedActivation": [
            f"The moment may pass before your body has enough quiet to tell the truth.",
            f"What seemed manageable at first can gather shape once there is less to perform.",
            f"The later replay is often where the feeling becomes specific.",
        ],
    }

    variants = [
        [
            choose(setups[pattern_type], i),
            choose(action_sentences, i + 1),
            validation,
            choose(bridge_sentences[pattern_type], i + 2),
            landing,
        ],
        [
            choose(setups[pattern_type], i + 1),
            choose(bridge_sentences[pattern_type], i + 2),
            ensure_sentence(action),
            validation,
            landing,
        ],
        [
            choose(action_sentences, i + 2),
            choose(setups[pattern_type], i + 3),
            validation,
            choose(bridge_sentences[pattern_type], i + 4),
            landing,
        ],
        [
            choose(setups[pattern_type], i + 3),
            ensure_sentence(action),
            choose(bridge_sentences[pattern_type], i + 5),
            validation,
            landing,
        ],
    ]
    return choose(variants, i + len(shape))


def taxonomy_bank(entry: dict[str, object]) -> CategoryBank:
    category = str(entry["category"])
    base = CATEGORY_BANKS[category]
    subcategory = str(entry["subcategory"])
    readable = user_facing_taxonomy_phrase(subcategory)
    return CategoryBank(
        category=category,
        theme=readable,
        pattern=f"{readable} starts shaping the moment before it is fully named",
        moment=f"when {readable} becomes active in ordinary life",
        meaning=f"{readable} asking for attention in a specific moment",
        need=base.need,
        reframe=f"There is a reason {readable} takes this shape; it is trying to protect something that mattered before.",
        landing=f"Start where {readable} becomes specific enough to meet honestly.",
        body_cue=base.body_cue,
        metaphor=base.metaphor,
        tags=sorted(set([*base.tags, slug(subcategory), slug(str(entry["majorDomain"]))])),
        signal_types=[str(value) for value in entry["signalTypes"]],
        anchors=[str(value) for value in entry["anchors"]],
        anchor_phrases=[
            f"when {readable} shows up",
            f"after {readable} has been quietly active",
            f"when something around {readable} feels unresolved",
        ],
        vocabulary=sorted(set([*base.vocabulary, *user_facing_taxonomy_phrase(subcategory).split()])),
    )


def taxonomy_rule(entry: dict[str, object], pattern_type: str) -> str:
    rules = entry["patternTypeRules"]  # type: ignore[index]
    return str(rules[pattern_type])  # type: ignore[index]


def taxonomy_micro_moment(entry: dict[str, object], pattern_type: str, i: int) -> str:
    readable = user_facing_taxonomy_phrase(str(entry["subcategory"]))
    options = {
        "highTracking": [
            f"when the first sign of {readable} appears",
            f"when {readable} starts before anyone names it",
            f"when a small cue around {readable} changes the room",
            f"when {readable} begins to ask for attention",
        ],
        "lowAccess": [
            f"when {readable} asks for more access than you have",
            f"when it feels easier to stay outside {readable}",
            f"when {readable} stays quiet under the surface",
            f"when {readable} would make the moment too complicated",
        ],
        "pushPull": [
            f"when you want {readable} and also want distance from it",
            f"when {readable} pulls you closer and asks for protection",
            f"when one part of you moves toward {readable} while another holds back",
            f"when {readable} feels wanted and risky at the same time",
        ],
        "delayedActivation": [
            f"after {readable} seemed smaller than it was",
            f"when {readable} returns later in the quiet",
            f"after the moment has passed and {readable} starts making sense",
            f"when the truth of {readable} arrives after the room settles",
        ],
    }
    return choose(options[pattern_type], i)


def taxonomy_action_sentence(entry: dict[str, object], pattern_type: str, i: int) -> str:
    rule = taxonomy_rule(entry, pattern_type)
    readable = user_facing_taxonomy_phrase(str(entry["subcategory"]))
    rule = rule.replace("The person ", "You ").replace("the person ", "you ")
    rule = rule.replace("evidence", "new information").replace("Evidence", "New information")
    rule = rule.replace("based on", "from").replace("Based on", "From")
    if rule.lower().startswith("you "):
        return ensure_sentence(rule)
    options = [
        f"You start organizing the moment around {readable} before it is easy to explain.",
        f"You adjust around {readable}, even if the adjustment stays private.",
        f"You track what {readable} might cost before anyone else sees the calculation.",
        f"You move with {readable} in mind, even when the moment looks simple from the outside.",
    ]
    return choose(options, i)


def taxonomy_bridge_sentence(bank: CategoryBank, pattern_type: str, i: int) -> str:
    readable = category_phrase(bank)
    options = {
        "highTracking": [
            f"That early attention can be sharp, but it can make {readable} feel urgent before the moment is settled.",
            f"The detail may be small, but part of you treats it like something worth catching early.",
            f"That kind of awareness often forms where missing the cue once carried a real cost.",
        ],
        "lowAccess": [
            f"Keeping distance can make {readable} manageable at first, especially when naming it would ask for more than you have.",
            f"The quiet does not mean nothing is there; it may mean the feeling has not felt safe enough to take shape.",
            f"Staying on the surface can buy time, even when it leaves something waiting underneath.",
        ],
        "pushPull": [
            f"The mixed signal makes sense when {readable} holds both a want and a risk.",
            f"Both directions are trying to protect something real, even if they pull against each other.",
            f"The movement can look inconsistent from the outside, but inside it is a negotiation between access and protection.",
        ],
        "delayedActivation": [
            f"The later reaction still counts, even if the moment looked manageable while it was happening.",
            f"Some feelings need distance before they can tell the truth clearly.",
            f"The quiet afterward may be where {readable} finally gets enough room to become specific.",
        ],
    }
    return choose(options[pattern_type], i)


def taxonomy_landing_sentence(entry: dict[str, object], bank: CategoryBank, pattern_type: str, i: int) -> str:
    readable = user_facing_taxonomy_phrase(str(entry["subcategory"]))
    options = {
        "highTracking": [
            "You do not have to pick it up every time you notice it.",
            "Not every early signal needs to become your whole responsibility.",
            f"Start where {readable} becomes real, then check what actually belongs to you.",
        ],
        "lowAccess": [
            "You can move slowly without pretending nothing is there.",
            "The distance helps in the moment, even if it leaves something unresolved.",
            f"Let {readable} take shape at a pace your body can actually stay with.",
        ],
        "pushPull": [
            "Both needs deserve room before one gets blamed for ruining the other.",
            "You do not have to choose between wanting it and protecting yourself all at once.",
            f"The next honest step may be giving {readable} a slower doorway.",
        ],
        "delayedActivation": [
            "What comes up later still counts.",
            "The feeling was not late; it arrived when there was room.",
            f"Let the later clarity around {readable} matter without turning it into self-blame.",
        ],
    }
    return choose(options[pattern_type], i)


def render_taxonomy_pattern(entry: dict[str, object], pattern_type: str, shape: str, i: int) -> list[str]:
    bank = taxonomy_bank(entry)
    moment = taxonomy_micro_moment(entry, pattern_type, i)
    action = taxonomy_action_sentence(entry, pattern_type, i + 1)
    validation = human_validation(pattern_type, i + 2)
    bridge = taxonomy_bridge_sentence(bank, pattern_type, i + 3)
    landing = taxonomy_landing_sentence(entry, bank, pattern_type, i + 4)
    readable = user_facing_taxonomy_phrase(str(entry["subcategory"]))
    questions = {
        "highTracking": f"Where does {readable} first become real for you?",
        "lowAccess": f"What makes {readable} go quiet first?",
        "pushPull": f"When does {readable} start pulling in two directions?",
        "delayedActivation": f"What brings {readable} back later?",
    }

    variants = [
        [
            f"{capitalize_anchor(moment)}, {lower_first(action).rstrip('.')}.",
            validation,
            bridge,
            landing,
        ],
        [
            action,
            f"That often becomes noticeable {moment}.",
            bridge,
            validation,
            landing,
        ],
        [
            questions[pattern_type],
            f"Often, it is {moment}.",
            action,
            validation,
            landing,
        ],
        [
            f"{capitalize_anchor(moment)}, the moment can look ordinary from the outside.",
            action,
            bridge,
            validation,
            landing,
        ],
    ]
    return choose(variants, i + len(shape))


def direct_naming_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        pattern_truth(bank, i),
        lived_anchor_sentence(bank, anchor, i + 1),
        protection_sentence(bank, i + 2),
        reframe_sentence(bank, i + 3),
        landing_sentence(bank, shape, "directNaming", i + 4),
    ]


def lived_moment_first_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        lived_anchor_sentence(bank, anchor, i),
        f"The inner response may move faster than the outside moment seems to justify.",
        protection_sentence(bank, i + 2),
        reframe_sentence(bank, i + 3),
        landing_sentence(bank, shape, "livedMomentFirst", i + 4),
    ]


def body_first_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        body_sentence(bank, i),
        f"It may be carrying {prose_meaning(bank)} before the story becomes clear.",
        lived_anchor_sentence(bank, anchor, i + 2),
        reframe_sentence(bank, i + 3),
        landing_sentence(bank, shape, "bodyFirst", i + 4),
    ]


def question_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        question_sentence(bank, anchor, i),
        f"The answer may be connected to how {bank.pattern}.",
        protection_sentence(bank, i + 2),
        practical_sentence(bank, i + 3),
        landing_sentence(bank, shape, "questionFlow", i + 4),
    ]


def contrast_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        contrast_sentence(bank, i),
        lived_anchor_sentence(bank, anchor, i + 1),
        f"That response makes sense when {bank.need} {has_verb(bank.need)} not had enough room.",
        cost_sentence(bank, i + 3),
        landing_sentence(bank, shape, "contrastFlow", i + 4),
    ]


def threshold_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        f"In {category_phrase(bank)}, the threshold arrives {clean_anchor(anchor)}.",
        f"Your system may start working before the moment has fully declared what it needs.",
        protection_sentence(bank, i + 2),
        cost_sentence(bank, i + 3),
        landing_sentence(bank, shape, "thresholdFlow", i + 4),
    ]


def poetic_grounding_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        poetic_sentence(bank, i),
        f"In ordinary language, this may be {prose_meaning(bank)} asking for space.",
        lived_anchor_sentence(bank, anchor, i + 2),
        reframe_sentence(bank, i + 3),
        landing_sentence(bank, shape, "poeticGrounding", i + 4),
    ]


def unfinished_ending_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        pattern_truth(bank, i),
        lived_anchor_sentence(bank, anchor, i + 1),
        protection_sentence(bank, i + 2),
        landing_sentence(bank, shape, "unfinishedEnding", i + 3),
    ]


def lived_protection_cost_flow(bank: CategoryBank, anchor: str, shape: str, i: int) -> list[str]:
    return [
        notice_before_story_sentence(bank, anchor, i),
        behavior_chain_sentence(bank, i + 1),
        inner_stakes_sentence(bank, i + 2),
        not_making_up_sentence(bank, i + 3),
        bracing_cost_sentence(bank, i + 4),
    ]


FLOW_RENDERERS: dict[str, Callable[[CategoryBank, str, str, int], list[str]]] = {
    "directNaming": direct_naming_flow,
    "livedMomentFirst": lived_moment_first_flow,
    "bodyFirst": body_first_flow,
    "questionFlow": question_flow,
    "contrastFlow": contrast_flow,
    "thresholdFlow": threshold_flow,
    "poeticGrounding": poetic_grounding_flow,
    "unfinishedEnding": unfinished_ending_flow,
    "livedProtectionCost": lived_protection_cost_flow,
}


SHAPE_FLOW_PREFERENCES = {
    "punch": ["livedProtectionCost", "directNaming", "contrastFlow", "unfinishedEnding", "thresholdFlow"],
    "tender": ["livedProtectionCost", "livedMomentFirst", "questionFlow", "unfinishedEnding", "directNaming"],
    "body": ["bodyFirst", "livedProtectionCost", "livedMomentFirst", "thresholdFlow", "poeticGrounding"],
    "patternAnalysis": ["directNaming", "livedProtectionCost", "contrastFlow", "questionFlow", "thresholdFlow"],
    "practicalCapacity": ["questionFlow", "livedProtectionCost", "livedMomentFirst", "contrastFlow", "directNaming"],
    "poetic": ["poeticGrounding", "bodyFirst", "livedProtectionCost", "unfinishedEnding", "livedMomentFirst"],
    "questionLed": ["questionFlow", "livedMomentFirst", "livedProtectionCost", "contrastFlow", "unfinishedEnding"],
    "contrast": ["contrastFlow", "livedProtectionCost", "directNaming", "thresholdFlow", "questionFlow"],
    "threshold": ["thresholdFlow", "bodyFirst", "livedProtectionCost", "livedMomentFirst", "unfinishedEnding"],
}


def validate_card_body(body: str) -> list[str]:
    errors: list[str] = []
    if not isinstance(body, str):
        return ["body must be a string"]
    if "\n" in body.strip():
        errors.append("card body must be one paragraph")
    count = sentence_count(body)
    if count not in {4, 5}:
        errors.append(f"card body must be 4 or 5 sentences, got {count}")
    lowered = body.lower()
    for phrase in BLOCKED_PHRASES:
        if phrase == "Based on":
            if phrase in body:
                errors.append(f"blocked phrase: {phrase}")
        elif phrase.lower() in lowered:
            errors.append(f"blocked phrase: {phrase}")
    for regex in BLOCKED_REGEXES:
        if regex.search(body):
            errors.append(f"blocked scaffold regex: {regex.pattern}")
    if "{" in body or "}" in body:
        errors.append("body contains unresolved template braces")
    if "  " in body:
        errors.append("body contains double spaces")
    return errors


def validate_weekly_body(body: str) -> list[str]:
    errors: list[str] = []
    paragraphs = [part.strip() for part in body.split("\n\n") if part.strip()]
    if len(paragraphs) not in {2, 3, 4}:
        errors.append(f"weekly body must have 2 to 4 paragraphs, got {len(paragraphs)}")
    for index, paragraph in enumerate(paragraphs, start=1):
        count = sentence_count(paragraph)
        if count not in {4, 5}:
            errors.append(f"weekly paragraph {index} must be 4 or 5 sentences, got {count}")
    lowered = body.lower()
    for phrase in BLOCKED_PHRASES:
        if phrase == "Based on":
            if phrase in body:
                errors.append(f"blocked phrase: {phrase}")
        elif phrase.lower() in lowered:
            errors.append(f"blocked phrase: {phrase}")
    for regex in BLOCKED_REGEXES:
        if regex.search(body):
            errors.append(f"blocked scaffold regex: {regex.pattern}")
    if "{" in body or "}" in body:
        errors.append("body contains unresolved template braces")
    return errors


class GenerationState:
    def __init__(self) -> None:
        self.opening_counts: Counter[str] = Counter()
        self.opening_two_counts: Counter[str] = Counter()
        self.opening_three_counts: Counter[str] = Counter()
        self.closing_counts: Counter[str] = Counter()
        self.closing_last_three_counts: Counter[str] = Counter()
        self.question_opening_counts: Counter[str] = Counter()
        self.contrast_opening_counts: Counter[str] = Counter()
        self.metaphor_counts: Counter[str] = Counter()
        self.anchor_counts: Counter[str] = Counter()
        self.flow_counts_by_category: dict[str, Counter[str]] = defaultdict(Counter)
        self.shape_counts_by_category: dict[str, Counter[str]] = defaultdict(Counter)
        self.body_tokens: list[set[str]] = []

    def too_repetitive(self, body: str, bank: CategoryBank, anchor: str, shape: str, flow: str, attempt: int) -> bool:
        sentences = split_sentences(body)
        opening_key = normalize_key(sentences[0], 6)
        opening_two_key = normalize_key(sentences[0], 2)
        opening_three_key = normalize_key(sentences[0], 3)
        closing_key = normalize_key(sentences[-1], 6)
        closing_last_three_key = normalize_last_key(sentences[-1], 3)
        question_key = question_opening_key(sentences[0])
        contrast_key = contrast_opening_key(sentences[0])
        body_token_set = token_set(body)

        too_similar = any(jaccard(body_token_set, existing) > 0.70 for existing in self.body_tokens[-100:])
        if too_similar and attempt < 90:
            return True
        if self.opening_counts[opening_key] >= 2 and attempt < 70:
            return True
        if self.closing_counts[closing_key] >= 2 and attempt < 70:
            return True
        if self.opening_two_counts[opening_two_key] >= 16 and attempt < 80:
            return True
        if self.opening_three_counts[opening_three_key] >= 8 and attempt < 80:
            return True
        if self.closing_last_three_counts[closing_last_three_key] >= 6 and attempt < 80:
            return True
        if question_key and self.question_opening_counts[question_key] >= 5 and attempt < 80:
            return True
        if contrast_key and self.contrast_opening_counts[contrast_key] >= 5 and attempt < 80:
            return True
        if self.metaphor_counts[bank.metaphor] >= 24 and flow == "poeticGrounding" and attempt < 50:
            return True
        if self.anchor_counts[anchor] >= 24 and attempt < 40:
            return True
        if self.flow_counts_by_category[bank.category][flow] >= 2 and attempt < 30:
            return True
        if self.shape_counts_by_category[bank.category][shape] >= 2 and attempt < 30:
            return True
        return False

    def record(self, body: str, bank: CategoryBank, anchor: str, shape: str, flow: str) -> None:
        sentences = split_sentences(body)
        self.opening_counts[normalize_key(sentences[0], 6)] += 1
        self.opening_two_counts[normalize_key(sentences[0], 2)] += 1
        self.opening_three_counts[normalize_key(sentences[0], 3)] += 1
        self.closing_counts[normalize_key(sentences[-1], 6)] += 1
        self.closing_last_three_counts[normalize_last_key(sentences[-1], 3)] += 1
        question_key = question_opening_key(sentences[0])
        contrast_key = contrast_opening_key(sentences[0])
        if question_key:
            self.question_opening_counts[question_key] += 1
        if contrast_key:
            self.contrast_opening_counts[contrast_key] += 1
        self.metaphor_counts[bank.metaphor] += 1
        self.anchor_counts[anchor] += 1
        self.flow_counts_by_category[bank.category][flow] += 1
        self.shape_counts_by_category[bank.category][shape] += 1
        self.body_tokens.append(token_set(body))


def paragraph_metadata(bank: CategoryBank, body: str, shape: str, flow: str, pattern_type: str, index: int, anchor: str) -> dict[str, object]:
    return {
        "id": f"{bank.category}_{pattern_type}_{shape}_{flow}_{index + 1:03d}",
        "category": bank.category,
        "writerShape": shape,
        "flowName": flow,
        "patternType": pattern_type,
        **domain_metadata_for_category(bank.category),
        "anchors": sorted(set([*bank.anchors, slug(anchor)])),
        "tone": SHAPE_TONES[shape],
        "intensity": SHAPE_INTENSITIES[shape],
        "signalTypes": bank.signal_types,
        "tags": bank.tags,
        "avoidIfRecentlyUsed": True,
        "isCurated": False,
        "source": "pythonGenerated",
        "body": body,
    }


def taxonomy_paragraph_metadata(
    entry: dict[str, object],
    bank: CategoryBank,
    body: str,
    shape: str,
    pattern_type: str,
    variant_index: int,
) -> dict[str, object]:
    return {
        "id": f"{entry['majorDomain']}_{entry['subcategory']}_{pattern_type}_{shape}_{variant_index + 1:03d}",
        "category": entry["category"],
        "writerShape": shape,
        "flowName": "microMoment",
        "patternType": pattern_type,
        "majorDomain": entry["majorDomain"],
        "theoryLens": entry["theoryLens"],
        "insightSubcategory": entry["subcategory"],
        "anchors": entry["anchors"],
        "tone": SHAPE_TONES[shape],
        "intensity": SHAPE_INTENSITIES[shape],
        "signalTypes": entry["signalTypes"],
        "tags": sorted(set([*bank.tags, slug(str(entry["subcategory"])), slug(str(entry["majorDomain"]))])),
        "avoidIfRecentlyUsed": True,
        "isCurated": False,
        "source": "pythonGenerated",
        "body": body,
    }


def generate_card_paragraphs() -> list[dict[str, object]]:
    state = GenerationState()
    items: list[dict[str, object]] = [
        with_full_metadata(item)
        for item in CURATED_PARAGRAPHS
        if item.get("category") not in EXCLUDED_PARAGRAPH_CATEGORIES
    ]
    for curated in CURATED_PARAGRAPHS:
        if curated.get("category") in EXCLUDED_PARAGRAPH_CATEGORIES:
            continue
        curated_with_type = with_full_metadata(curated)
        errors = validate_card_body(str(curated["body"]))
        if errors:
            raise RuntimeError(f"Invalid curated paragraph {curated['id']}: {errors}")
        state.record(
            str(curated["body"]),
            CATEGORY_BANKS[str(curated["category"])],
            choose(CATEGORY_BANKS[str(curated["category"])].anchor_phrases, 0),
            str(curated["writerShape"]),
            str(curated_with_type["flowName"]),
        )

    for category_index, bank in enumerate(CATEGORY_BANKS.values()):
        if bank.category in EXCLUDED_PARAGRAPH_CATEGORIES:
            continue
        for shape_index, shape in enumerate(WRITER_SHAPES):
            selected: dict[str, object] | None = None
            pattern_type = choose(PATTERN_TYPES, category_index + shape_index)
            flow = "microMoment"

            for attempt in range(160):
                anchor = choose(bank.anchor_phrases, category_index + shape_index + attempt)
                pattern_repeat_index = shape_index // len(PATTERN_TYPES)
                render_index = category_index * 19 + shape_index + pattern_repeat_index + attempt
                sentences = render_micro_pattern(bank, pattern_type, shape, render_index)
                body = join_body(sentences)
                errors = validate_card_body(body)
                if errors:
                    continue
                if state.too_repetitive(body, bank, anchor, shape, flow, attempt):
                    continue
                selected = paragraph_metadata(bank, body, shape, flow, pattern_type, shape_index, anchor)
                state.record(body, bank, anchor, shape, flow)
                break

            if selected is None:
                raise RuntimeError(f"Could not generate paragraph for {bank.category}/{shape}/{pattern_type}")

            items.append(selected)

    body_keys = {normalize_key(str(item["body"]), 32) for item in items}
    taxonomy_entries = generated_taxonomy_entries()
    for entry_index, entry in enumerate(taxonomy_entries):
        bank = taxonomy_bank(entry)
        for pattern_type_index, pattern_type in enumerate(PATTERN_TYPES):
            for variant_index in range(PARAGRAPHS_PER_TAXONOMY_PATTERN):
                selected: dict[str, object] | None = None
                for attempt in range(120):
                    shape = choose(
                        WRITER_SHAPES,
                        entry_index + pattern_type_index + variant_index + attempt,
                    )
                    render_index = entry_index * 31 + pattern_type_index * 7 + variant_index + attempt
                    body = join_body(render_taxonomy_pattern(entry, pattern_type, shape, render_index))
                    errors = validate_card_body(body)
                    if errors:
                        continue
                    body_key = normalize_key(body, 32)
                    if body_key in body_keys:
                        continue
                    selected = taxonomy_paragraph_metadata(
                        entry,
                        bank,
                        body,
                        shape,
                        pattern_type,
                        variant_index,
                    )
                    body_keys.add(body_key)
                    break

                if selected is None:
                    raise RuntimeError(
                        f"Could not generate taxonomy paragraph for {entry['majorDomain']}/{entry['subcategory']}/{pattern_type}/{variant_index}"
                    )
                items.append(selected)

    return items


def weekly_paragraph_one(bank: CategoryBank, anchor: str, i: int) -> list[str]:
    return [
        f"This week, {category_phrase(bank)} may be shaping more than one moment.",
        lived_anchor_sentence(bank, anchor, i + 1),
        f"The signal may be connected to how {bank.pattern}.",
        reframe_sentence(bank, i + 3),
    ]


def weekly_paragraph_two(bank: CategoryBank, anchor: str, i: int) -> list[str]:
    return [
        protection_sentence(bank, i),
        f"That protection makes sense, especially {clean_anchor(anchor)}.",
        cost_sentence(bank, i + 2),
        practical_sentence(bank, i + 3),
    ]


def weekly_paragraph_three(bank: CategoryBank, anchor: str, i: int) -> list[str]:
    return [
        question_sentence(bank, anchor, i),
        f"The answer does not have to become a full life overhaul.",
        f"It may begin with one place where {bank.need} becomes real.",
        landing_sentence(bank, "patternAnalysis", "unfinishedEnding", i + 3),
    ]


def render_weekly(bank: CategoryBank, variant_index: int) -> str:
    anchor_one = choose(bank.anchor_phrases, variant_index)
    anchor_two = choose(bank.anchor_phrases, variant_index + 1)
    anchor_three = choose(bank.anchor_phrases, variant_index + 2)

    paragraphs = [
        join_body(weekly_paragraph_one(bank, anchor_one, variant_index)),
        join_body(weekly_paragraph_two(bank, anchor_two, variant_index + 3)),
        join_body(weekly_paragraph_three(bank, anchor_three, variant_index + 6)),
    ]

    return "\n\n".join(paragraphs)


def generate_weekly_paragraphs() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []

    for category_index, bank in enumerate(CATEGORY_BANKS.values()):
        if bank.category in EXCLUDED_PARAGRAPH_CATEGORIES:
            continue
        for variant_index, shape in enumerate(["patternAnalysis", "tender"]):
            body = render_weekly(bank, category_index + variant_index)
            errors = validate_weekly_body(body)
            if errors:
                raise RuntimeError(f"Invalid weekly body for {bank.category}/{variant_index}: {errors}")

            anchor = choose(bank.anchor_phrases, category_index + variant_index)
            items.append(
                {
                    "id": f"{bank.category}_weekly_{variant_index + 1:03d}",
                    "category": bank.category,
                    "writerShape": shape,
                    "flowName": "weeklyDeepDive",
                    "patternType": choose(PATTERN_TYPES, category_index + variant_index),
                    **domain_metadata_for_category(bank.category),
                    "anchors": sorted(set([*bank.anchors, slug(anchor)])),
                    "tone": SHAPE_TONES[shape],
                    "intensity": "medium",
                    "signalTypes": bank.signal_types,
                    "tags": bank.tags,
                    "avoidIfRecentlyUsed": True,
                    "isCurated": False,
                    "source": "pythonGenerated",
                    "body": body,
                }
            )

    return items


def ts_string(items: list[dict[str, object]], weekly_items: list[dict[str, object]]) -> str:
    domain_json = json.dumps(generated_domain_definitions(), indent=2, ensure_ascii=False)
    taxonomy_json = json.dumps(generated_taxonomy_entries(), indent=2, ensure_ascii=False)
    card_json = json.dumps(items, indent=2, ensure_ascii=False)
    weekly_json = json.dumps(weekly_items, indent=2, ensure_ascii=False)
    card_json_literal = json.dumps(card_json, ensure_ascii=False)

    return f"""// AUTO-GENERATED by scripts/generateInsightParagraphLibrary.py.
// Do not edit by hand. Run `python3 scripts/generateInsightParagraphLibrary.py`.

import type {{ InsightCategory }} from '../insightsV2/types';

export type GeneratedInsightWriterShape =
  | 'punch'
  | 'tender'
  | 'body'
  | 'patternAnalysis'
  | 'practicalCapacity'
  | 'poetic'
  | 'questionLed'
  | 'contrast'
  | 'threshold';

export type GeneratedInsightFlowName =
  | 'directNaming'
  | 'livedMomentFirst'
  | 'bodyFirst'
  | 'questionFlow'
  | 'contrastFlow'
  | 'thresholdFlow'
  | 'poeticGrounding'
  | 'unfinishedEnding'
  | 'livedProtectionCost'
  | 'goldStandard'
  | 'microMoment'
  | 'weeklyDeepDive';

export type GeneratedInsightTone =
  | 'direct'
  | 'tender'
  | 'grounded'
  | 'practical'
  | 'poetic'
  | 'reflective';

export type GeneratedInsightIntensity = 'low' | 'medium' | 'high';

export type GeneratedInsightSource = 'goldStandard' | 'pythonGenerated';

export type GeneratedInsightPatternType =
  | 'highTracking'
  | 'lowAccess'
  | 'pushPull'
  | 'delayedActivation';

export interface GeneratedInsightSubcategoryGuidance {{
  covers: string;
  patternTypes: Readonly<Record<GeneratedInsightPatternType, string>>;
}}

export interface GeneratedInsightDomain {{
  majorDomain: string;
  key: string;
  domainName: string;
  theoryLens: readonly string[];
  subcategories: readonly string[];
  excludeFromDreamInsights: boolean;
  includeInTodayInsights: boolean;
  includeInPatternScreen: boolean;
  patternTypes: readonly GeneratedInsightPatternType[];
  subcategoryGuidance: Readonly<Record<string, GeneratedInsightSubcategoryGuidance>>;
  microMoments: Readonly<Record<GeneratedInsightPatternType, readonly string[]>>;
  actions: Readonly<Record<GeneratedInsightPatternType, readonly string[]>>;
  validationStyle: Readonly<Record<GeneratedInsightPatternType, readonly string[]>>;
  landings: Readonly<Record<GeneratedInsightPatternType, readonly string[]>>;
}}

export type GeneratedInsightSurface =
  | 'today'
  | 'patterns'
  | 'weeklyDeepDive'
  | 'thisWeek';

export interface GeneratedInsightTaxonomyEntry {{
  id: string;
  category: InsightCategory;
  majorDomain: string;
  domainName: string;
  subcategory: string;
  theoryLens: readonly string[];
  anchors: readonly string[];
  signalTypes: readonly string[];
  allowedSurfaces: readonly GeneratedInsightSurface[];
  patternTypes: readonly GeneratedInsightPatternType[];
  patternTypeRules: Readonly<Record<GeneratedInsightPatternType, string>>;
  isLegacyDefault: boolean;
}}

export interface GeneratedInsightParagraph {{
  id: string;
  category: InsightCategory;
  writerShape: GeneratedInsightWriterShape;
  flowName: GeneratedInsightFlowName;
  patternType: GeneratedInsightPatternType;
  majorDomain: string;
  theoryLens: readonly string[];
  insightSubcategory: string;
  anchors: readonly string[];
  tone: GeneratedInsightTone;
  intensity: GeneratedInsightIntensity;
  signalTypes: readonly string[];
  tags: readonly string[];
  avoidIfRecentlyUsed: boolean;
  isCurated: boolean;
  source: GeneratedInsightSource;
  body: string;
}}

export const GENERATED_INSIGHT_DOMAINS: readonly GeneratedInsightDomain[] = {domain_json};

export const GENERATED_INSIGHT_TAXONOMY: readonly GeneratedInsightTaxonomyEntry[] = {taxonomy_json};

const GENERATED_INSIGHT_PARAGRAPHS_JSON = {card_json_literal};

export const GENERATED_INSIGHT_PARAGRAPHS: readonly GeneratedInsightParagraph[] = JSON.parse(
  GENERATED_INSIGHT_PARAGRAPHS_JSON,
) as GeneratedInsightParagraph[];

export const GENERATED_WEEKLY_INSIGHT_PARAGRAPHS: readonly GeneratedInsightParagraph[] = {weekly_json};
"""


def main() -> None:
    cards = generate_card_paragraphs()
    weekly = generate_weekly_paragraphs()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(ts_string(cards, weekly), encoding="utf-8")
    print(f"Wrote {len(cards)} card paragraphs and {len(weekly)} weekly paragraphs to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
