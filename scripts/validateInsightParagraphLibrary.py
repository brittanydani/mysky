#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
LIBRARY_PATH = ROOT / "services" / "insights" / "generated" / "generatedInsightParagraphs.ts"

BLOCKED_PHRASES = [
    "This is clear enough to track now",
    "The pattern is clear now",
    "This does not read as",
    "It reads as",
    "Seen across",
    "Detected in",
    "Based on",
    "The user",
]

SCAFFOLD_PHRASES = [
    "It tends to get loud",
    "The meaning is",
    "The clearer read is",
    "The useful move is",
    "The grounded conclusion is",
    "The practical shape matters",
    "The signal gathers",
    "The pattern appears",
    "The pattern around",
    "The shift often happens",
    "is where the signal becomes harder to ignore",
    "Some part of you may be asking",
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
]

VISIBLE_THEORY_PHRASES = [
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

VALID_CATEGORIES = {
    "emotionalWeather",
    "restCapacity",
    "bodySignals",
    "supportBelonging",
    "relationships",
    "boundariesSelfTrust",
    "valuesIntegrity",
    "cognitiveStyle",
    "dreamsSymbols",
    "glimmersRegulation",
    "creativityExpression",
    "identityGrowth",
    "familyHome",
    "scarcityAbundance",
    "natalChartReflection",
    "responsibilityCare",
    "workAmbition",
    "griefTransitions",
    "timeRhythms",
    "selfWorthReceiving",
    "communicationVoice",
    "spiritualMeaning",
    "safetyRegulation",
    "lifeDirection",
    "pleasurePlay",
}

EXCLUDED_PARAGRAPH_CATEGORIES = {"dreamsSymbols"}

VALID_WRITER_SHAPES = {
    "punch",
    "tender",
    "body",
    "patternAnalysis",
    "practicalCapacity",
    "poetic",
    "questionLed",
    "contrast",
    "threshold",
}

VALID_FLOW_NAMES = {
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
    "weeklyDeepDive",
}

VALID_PATTERN_TYPES = {
    "highTracking",
    "lowAccess",
    "pushPull",
    "delayedActivation",
}

VALID_SOURCES = {
    "goldStandard",
    "pythonGenerated",
}

REQUIRED_FIELDS = {
    "id",
    "category",
    "writerShape",
    "flowName",
    "patternType",
    "majorDomain",
    "theoryLens",
    "insightSubcategory",
    "anchors",
    "tone",
    "intensity",
    "signalTypes",
    "tags",
    "allowedSurfaces",
    "isCurated",
    "source",
    "body",
}

REQUIRED_DOMAIN_FIELDS = {
    "majorDomain",
    "key",
    "domainName",
    "theoryLens",
    "subcategories",
    "excludeFromDreamInsights",
    "includeInTodayInsights",
    "includeInPatternScreen",
    "patternTypes",
    "subcategoryGuidance",
    "microMoments",
    "actions",
    "validationStyle",
    "landings",
}

REQUIRED_TAXONOMY_FIELDS = {
    "id",
    "category",
    "majorDomain",
    "domainName",
    "subcategory",
    "theoryLens",
    "anchors",
    "signalTypes",
    "allowedSurfaces",
    "patternTypes",
    "patternTypeRules",
    "isLegacyDefault",
}

VALID_TAXONOMY_SURFACES = {
    "today",
    "patterns",
    "weeklyDeepDive",
    "thisWeek",
}


def sentence_count(text: str) -> int:
    return len(re.findall(r"[.!?](?=\s|$)", text))


def word_key(text: str, count: int, from_end: bool = False) -> str:
    words = re.findall(r"[a-z0-9]+", text.lower())
    selected = words[-count:] if from_end else words[:count]
    return " ".join(selected)


def question_opening_key(sentence: str) -> str:
    if not sentence.strip().endswith("?"):
        return ""
    return word_key(sentence, 3)


def contrast_opening_key(sentence: str) -> str:
    lowered = sentence.lower()
    prefixes = (
        "from the outside",
        "the surface story",
        "it may seem",
        "a harsher read",
        "the more honest read",
    )
    if lowered.startswith(prefixes):
        return word_key(sentence, 4)
    return ""


def contains_micro_or_action(body: str) -> bool:
    lowered = body.lower()
    markers = [
        "when ",
        "after ",
        "hours after",
        "later ",
        "you replay",
        "you measure",
        "you look",
        "you brace",
        "you go quiet",
        "you keep",
        "you give",
        "you move",
        "you let",
        "you reach",
        "you want",
        "you tell",
        "you realize",
        "you notice",
        "you scan",
        "you start",
        "you try",
        "you stay",
        "you soften",
        "you minimize",
        "you think",
        "you leave",
        "you hold",
        "you check",
    ]
    return any(marker in lowered for marker in markers)


def extract_array(source: str, export_name: str) -> list[dict[str, Any]]:
    pattern = re.compile(
        rf"export const {re.escape(export_name)}(?:\s*:\s*[^=]+)?\s*=\s*(\[.*?\]);",
        re.DOTALL,
    )
    match = pattern.search(source)
    if match:
        return json.loads(match.group(1))

    json_pattern = re.compile(
        rf"const {re.escape(export_name)}_JSON\s*=\s*(`(?:\\.|[^`\\])*`|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*');",
        re.DOTALL,
    )
    json_match = json_pattern.search(source)
    if json_match:
        literal = json_match.group(1)
        if literal.startswith("`"):
            return json.loads(literal[1:-1])
        return json.loads(json.loads(literal))

    raise ValueError(f"Could not find export {export_name}")


def validate_metadata(item: dict[str, Any], seen_ids: set[str], label: str) -> list[str]:
    errors: list[str] = []
    missing = sorted(REQUIRED_FIELDS - set(item))
    if missing:
        errors.append(f"{label}: missing fields {', '.join(missing)}")
    item_id = item.get("id")
    if not isinstance(item_id, str) or not item_id:
        errors.append(f"{label}: id must be a non-empty string")
    elif item_id in seen_ids:
        errors.append(f"{label}: duplicate id {item_id}")
    else:
        seen_ids.add(item_id)

    category = item.get("category")
    if category not in VALID_CATEGORIES:
        errors.append(f"{label}: invalid category {category!r}")
    elif category in EXCLUDED_PARAGRAPH_CATEGORIES:
        errors.append(f"{label}: {category} belongs to the separate dream engine and must not appear in the generated paragraph library")

    writer_shape = item.get("writerShape")
    if writer_shape not in VALID_WRITER_SHAPES:
        errors.append(f"{label}: invalid writerShape {writer_shape!r}")

    flow_name = item.get("flowName")
    if flow_name not in VALID_FLOW_NAMES:
        errors.append(f"{label}: invalid flowName {flow_name!r}")

    pattern_type = item.get("patternType")
    if pattern_type not in VALID_PATTERN_TYPES:
        errors.append(f"{label}: invalid patternType {pattern_type!r}")

    major_domain = item.get("majorDomain")
    if not isinstance(major_domain, str) or not major_domain:
        errors.append(f"{label}: majorDomain must be a non-empty string")

    theory_lens = item.get("theoryLens")
    if not isinstance(theory_lens, list) or not theory_lens or not all(isinstance(value, str) and value for value in theory_lens):
        errors.append(f"{label}: theoryLens must be a non-empty string array")

    insight_subcategory = item.get("insightSubcategory")
    if not isinstance(insight_subcategory, str) or not insight_subcategory:
        errors.append(f"{label}: insightSubcategory must be a non-empty string")

    source = item.get("source")
    if source not in VALID_SOURCES:
        errors.append(f"{label}: invalid source {source!r}")

    is_curated = item.get("isCurated")
    if not isinstance(is_curated, bool):
        errors.append(f"{label}: isCurated must be a boolean")
    elif source == "goldStandard" and not is_curated:
        errors.append(f"{label}: goldStandard source must have isCurated true")
    elif source == "pythonGenerated" and is_curated:
        errors.append(f"{label}: pythonGenerated source must have isCurated false")

    anchors = item.get("anchors")
    if not isinstance(anchors, list) or not anchors or not all(isinstance(value, str) and value for value in anchors):
        errors.append(f"{label}: anchors must be a non-empty string array")

    signal_types = item.get("signalTypes")
    if not isinstance(signal_types, list) or not signal_types or not all(isinstance(value, str) and value for value in signal_types):
        errors.append(f"{label}: signalTypes must be a non-empty string array")

    tags = item.get("tags")
    if not isinstance(tags, list) or not tags or not all(isinstance(value, str) and value for value in tags):
        errors.append(f"{label}: tags must be a non-empty string array")

    surfaces = item.get("allowedSurfaces")
    if not isinstance(surfaces, list) or not surfaces or not set(surfaces).issubset(VALID_TAXONOMY_SURFACES):
        errors.append(f"{label}: allowedSurfaces must be a non-empty valid surface array")

    return errors


def validate_blocked_phrases(body: str, label: str) -> list[str]:
    errors: list[str] = []
    lowered = body.lower()
    for phrase in [*BLOCKED_PHRASES, *SCAFFOLD_PHRASES, *VISIBLE_THEORY_PHRASES]:
        if phrase == "Based on":
            if phrase in body:
                errors.append(f"{label}: blocked phrase appears: {phrase}")
        elif phrase.lower() in lowered:
            errors.append(f"{label}: blocked phrase appears: {phrase}")
    for regex in BLOCKED_REGEXES:
        if regex.search(body):
            errors.append(f"{label}: blocked scaffold regex: {regex.pattern}")
    if "the user" in lowered:
        errors.append(f"{label}: body says 'the user'")
    if "{" in body or "}" in body:
        errors.append(f"{label}: body contains unresolved template braces")
    return errors


def validate_domain_definitions(domains: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    seen_keys: set[str] = set()
    seen_names: set[str] = set()

    if len(domains) != 50:
        errors.append(f"GENERATED_INSIGHT_DOMAINS: expected 50 domains, got {len(domains)}")

    for index, domain in enumerate(domains):
        label = f"GENERATED_INSIGHT_DOMAINS[{index}] {domain.get('key', '<missing key>')}"
        missing = sorted(REQUIRED_DOMAIN_FIELDS - set(domain))
        if missing:
            errors.append(f"{label}: missing fields {', '.join(missing)}")

        key = domain.get("key")
        if not isinstance(key, str) or not key:
            errors.append(f"{label}: key must be a non-empty string")
        elif key in seen_keys:
            errors.append(f"{label}: duplicate key {key}")
        else:
            seen_keys.add(key)

        if domain.get("majorDomain") != key:
            errors.append(f"{label}: majorDomain must match key")

        domain_name = domain.get("domainName")
        if not isinstance(domain_name, str) or not domain_name:
            errors.append(f"{label}: domainName must be a non-empty string")
        elif domain_name in seen_names:
            errors.append(f"{label}: duplicate domainName {domain_name}")
        else:
            seen_names.add(domain_name)

        theory_lens = domain.get("theoryLens")
        if not isinstance(theory_lens, list) or not theory_lens or not all(isinstance(value, str) and value for value in theory_lens):
            errors.append(f"{label}: theoryLens must be a non-empty string array")

        subcategories = domain.get("subcategories")
        if not isinstance(subcategories, list) or len(subcategories) != 8 or not all(isinstance(value, str) and value for value in subcategories):
            errors.append(f"{label}: subcategories must contain exactly 8 strings")

        for field in ("excludeFromDreamInsights", "includeInTodayInsights", "includeInPatternScreen"):
            if not isinstance(domain.get(field), bool):
                errors.append(f"{label}: {field} must be a boolean")

        pattern_types = domain.get("patternTypes")
        if not isinstance(pattern_types, list) or set(pattern_types) != VALID_PATTERN_TYPES:
            errors.append(f"{label}: patternTypes must contain {', '.join(sorted(VALID_PATTERN_TYPES))}")

        guidance = domain.get("subcategoryGuidance")
        if not isinstance(guidance, dict):
            errors.append(f"{label}: subcategoryGuidance must be an object")
        elif isinstance(subcategories, list):
            missing_guidance = sorted(set(subcategories) - set(guidance))
            if missing_guidance:
                errors.append(f"{label}: subcategoryGuidance missing {', '.join(missing_guidance)}")
            for subcategory in subcategories:
                entry = guidance.get(subcategory)
                if not isinstance(entry, dict):
                    errors.append(f"{label}: subcategoryGuidance.{subcategory} must be an object")
                    continue
                if not isinstance(entry.get("covers"), str) or not entry.get("covers"):
                    errors.append(f"{label}: subcategoryGuidance.{subcategory}.covers must be a non-empty string")
                entry_pattern_types = entry.get("patternTypes")
                if not isinstance(entry_pattern_types, dict) or set(entry_pattern_types) != VALID_PATTERN_TYPES:
                    errors.append(f"{label}: subcategoryGuidance.{subcategory}.patternTypes must describe all pattern types")
                elif not all(isinstance(value, str) and value for value in entry_pattern_types.values()):
                    errors.append(f"{label}: subcategoryGuidance.{subcategory}.patternTypes values must be non-empty strings")

        for field in ("microMoments", "actions", "validationStyle", "landings"):
            value = domain.get(field)
            if not isinstance(value, dict):
                errors.append(f"{label}: {field} must be a patternType-keyed object")
                continue
            missing_pattern_types = sorted(VALID_PATTERN_TYPES - set(value))
            if missing_pattern_types:
                errors.append(f"{label}: {field} missing pattern types {', '.join(missing_pattern_types)}")
            for pattern_type in VALID_PATTERN_TYPES:
                entries = value.get(pattern_type)
                if not isinstance(entries, list) or not entries or not all(isinstance(entry, str) and entry for entry in entries):
                    errors.append(f"{label}: {field}.{pattern_type} must be a non-empty string array")

    return errors


def validate_taxonomy_entries(
    entries: list[dict[str, Any]],
    domains: list[dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    domain_by_key = {
        domain.get("key"): domain
        for domain in domains
        if isinstance(domain.get("key"), str)
    }

    if len(entries) != 400:
        errors.append(f"GENERATED_INSIGHT_TAXONOMY: expected 400 entries, got {len(entries)}")

    coverage: dict[tuple[str, str], set[str]] = defaultdict(set)
    legacy_defaults: Counter[str] = Counter()

    for index, entry in enumerate(entries):
        label = f"GENERATED_INSIGHT_TAXONOMY[{index}] {entry.get('id', '<missing id>')}"
        missing = sorted(REQUIRED_TAXONOMY_FIELDS - set(entry))
        if missing:
            errors.append(f"{label}: missing fields {', '.join(missing)}")

        entry_id = entry.get("id")
        if not isinstance(entry_id, str) or not entry_id:
            errors.append(f"{label}: id must be a non-empty string")
        elif entry_id in seen_ids:
            errors.append(f"{label}: duplicate id {entry_id}")
        else:
            seen_ids.add(entry_id)

        category = entry.get("category")
        if category not in VALID_CATEGORIES:
            errors.append(f"{label}: invalid category {category!r}")
        elif category in EXCLUDED_PARAGRAPH_CATEGORIES:
            errors.append(f"{label}: dream category must not appear in normal insight taxonomy")

        major_domain = entry.get("majorDomain")
        domain = domain_by_key.get(major_domain)
        if not domain:
            errors.append(f"{label}: majorDomain is not declared in GENERATED_INSIGHT_DOMAINS")
            continue

        if entry.get("domainName") != domain.get("domainName"):
            errors.append(f"{label}: domainName does not match majorDomain")
        if entry.get("theoryLens") != domain.get("theoryLens"):
            errors.append(f"{label}: theoryLens does not match majorDomain")

        subcategory = entry.get("subcategory")
        if not isinstance(subcategory, str) or subcategory not in domain.get("subcategories", []):
            errors.append(f"{label}: subcategory is not declared for majorDomain")
        else:
            coverage[(str(major_domain), subcategory)].update(entry.get("patternTypes", []))

        anchors = entry.get("anchors")
        if not isinstance(anchors, list) or len(anchors) < 3 or not all(isinstance(value, str) and value for value in anchors):
            errors.append(f"{label}: anchors must contain at least 3 strings")

        signal_types = entry.get("signalTypes")
        if not isinstance(signal_types, list) or len(signal_types) < 4 or not all(isinstance(value, str) and value for value in signal_types):
            errors.append(f"{label}: signalTypes must contain at least 4 strings")

        surfaces = entry.get("allowedSurfaces")
        if not isinstance(surfaces, list) or not set(surfaces).issubset(VALID_TAXONOMY_SURFACES):
            errors.append(f"{label}: allowedSurfaces contains invalid values")
        elif not surfaces:
            errors.append(f"{label}: normal insight taxonomy entry must allow at least one surface")

        pattern_types = entry.get("patternTypes")
        if not isinstance(pattern_types, list) or set(pattern_types) != VALID_PATTERN_TYPES:
            errors.append(f"{label}: patternTypes must contain all pattern types")

        rules = entry.get("patternTypeRules")
        if not isinstance(rules, dict) or set(rules) != VALID_PATTERN_TYPES:
            errors.append(f"{label}: patternTypeRules must describe all pattern types")
        elif not all(isinstance(value, str) and value for value in rules.values()):
            errors.append(f"{label}: patternTypeRules values must be non-empty strings")

        if entry.get("isLegacyDefault") is True and isinstance(category, str):
            legacy_defaults[category] += 1

    for domain in domains:
        domain_key = str(domain.get("key"))
        for subcategory in domain.get("subcategories", []):
            key = (domain_key, str(subcategory))
            if coverage.get(key) != VALID_PATTERN_TYPES:
                errors.append(f"{domain_key}/{subcategory}: taxonomy entry does not cover all pattern types")

    for category in VALID_CATEGORIES - EXCLUDED_PARAGRAPH_CATEGORIES:
        if legacy_defaults[category] > 1:
            errors.append(f"{category}: expected at most one legacy default taxonomy entry, got {legacy_defaults[category]}")

    return errors


def validate_card_body(item: dict[str, Any], label: str) -> list[str]:
    errors: list[str] = []
    body = item.get("body")
    if not isinstance(body, str):
        return [f"{label}: body must be a string"]
    if "\n" in body.strip():
        errors.append(f"{label}: card body must be one complete paragraph")
    count = sentence_count(body)
    if count not in {4, 5}:
        errors.append(f"{label}: card body must be 4 or 5 sentences, got {count}")
    errors.extend(validate_blocked_phrases(body, label))
    if not item.get("isCurated") and "based on" in body.lower():
        errors.append(f"{label}: generated body contains blocked generic phrase: based on")
    if not item.get("isCurated") and not contains_micro_or_action(body):
        errors.append(f"{label}: generated body must include a micro-moment or action phrase")
    return errors


def validate_weekly_body(item: dict[str, Any], label: str) -> list[str]:
    errors: list[str] = []
    body = item.get("body")
    if not isinstance(body, str):
        return [f"{label}: body must be a string"]
    paragraphs = [part.strip() for part in body.split("\n\n") if part.strip()]
    if len(paragraphs) not in {2, 3, 4}:
        errors.append(f"{label}: weekly body must have 2 to 4 paragraphs, got {len(paragraphs)}")
    for index, paragraph in enumerate(paragraphs, start=1):
        count = sentence_count(paragraph)
        if count not in {4, 5}:
            errors.append(f"{label}: weekly paragraph {index} must be 4 or 5 sentences, got {count}")
    errors.extend(validate_blocked_phrases(body, label))
    return errors


def validate_variety(cards: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    shapes_by_category: dict[str, set[str]] = defaultdict(set)
    pattern_types_by_category: dict[str, set[str]] = defaultdict(set)
    anchor_counts_by_category: dict[str, Counter[str]] = defaultdict(Counter)
    openings: Counter[str] = Counter()
    opening_twos: Counter[str] = Counter()
    opening_threes: Counter[str] = Counter()
    closings: Counter[str] = Counter()
    closing_last_threes: Counter[str] = Counter()
    question_openings: Counter[str] = Counter()
    contrast_openings: Counter[str] = Counter()
    clustered_phrases: Counter[str] = Counter()
    nearby_openings: list[str] = []
    nearby_landings: list[str] = []

    for item in cards:
        category = item.get("category")
        if isinstance(category, str):
            shapes_by_category[category].add(str(item.get("writerShape")))
            pattern_type = item.get("patternType")
            if isinstance(pattern_type, str):
                pattern_types_by_category[category].add(pattern_type)
            for anchor in item.get("anchors", []):
                if isinstance(anchor, str):
                    anchor_counts_by_category[category][anchor] += 1
        body = item.get("body")
        if isinstance(body, str):
            lowered = body.lower()
            for phrase in ["your system", "this is not", "the old work", "the cost is"]:
                clustered_phrases[phrase] += lowered.count(phrase)
        if isinstance(body, str) and not item.get("isCurated"):
            sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", body.strip()) if part.strip()]
            if sentences:
                opening_key = word_key(sentences[0], 6)
                landing_key = word_key(sentences[-1], 6)
                openings[opening_key] += 1
                opening_twos[word_key(sentences[0], 2)] += 1
                opening_threes[word_key(sentences[0], 3)] += 1
                closings[landing_key] += 1
                closing_last_threes[word_key(sentences[-1], 3, from_end=True)] += 1
                nearby_openings.append(opening_key)
                nearby_landings.append(landing_key)
                question_key = question_opening_key(sentences[0])
                contrast_key = contrast_opening_key(sentences[0])
                if question_key:
                    question_openings[question_key] += 1
                if contrast_key:
                    contrast_openings[contrast_key] += 1

    for category in VALID_CATEGORIES - EXCLUDED_PARAGRAPH_CATEGORIES:
        shape_count = len(shapes_by_category[category])
        if shape_count < 6:
            errors.append(f"{category}: expected at least 6 writer shapes, got {shape_count}")
        if len(anchor_counts_by_category[category]) < 3:
            errors.append(f"{category}: expected at least 3 distinct anchors")
        missing_pattern_types = sorted(VALID_PATTERN_TYPES - pattern_types_by_category[category])
        if missing_pattern_types:
            errors.append(f"{category}: missing pattern types {', '.join(missing_pattern_types)}")

    card_count = max(1, len(cards))
    repeated_openings = [key for key, count in openings.items() if count > max(120, card_count // 12) and key]
    repeated_closings = [key for key, count in closings.items() if count > max(180, card_count // 8) and key]
    repeated_opening_twos = [key for key, count in opening_twos.items() if count > max(900, card_count // 3) and key]
    repeated_opening_threes = [key for key, count in opening_threes.items() if count > max(650, card_count // 4) and key]
    repeated_closing_last_threes = [key for key, count in closing_last_threes.items() if count > max(650, card_count // 4) and key]
    repeated_question_openings = [key for key, count in question_openings.items() if count > max(120, card_count // 16) and key]
    repeated_contrast_openings = [key for key, count in contrast_openings.items() if count > max(120, card_count // 16) and key]
    if repeated_openings:
        errors.append(f"opening sentence patterns repeat too often: {', '.join(repeated_openings[:5])}")
    if repeated_closings:
        errors.append(f"closing sentence patterns repeat too often: {', '.join(repeated_closings[:5])}")
    if repeated_opening_twos:
        errors.append(f"opening first-two-word rhythms repeat too often: {', '.join(repeated_opening_twos[:5])}")
    if repeated_opening_threes:
        errors.append(f"opening first-three-word rhythms repeat too often: {', '.join(repeated_opening_threes[:5])}")
    if repeated_closing_last_threes:
        errors.append(f"closing last-three-word rhythms repeat too often: {', '.join(repeated_closing_last_threes[:5])}")
    if repeated_question_openings:
        errors.append(f"question openings repeat too often: {', '.join(repeated_question_openings[:5])}")
    if repeated_contrast_openings:
        errors.append(f"contrast openings repeat too often: {', '.join(repeated_contrast_openings[:5])}")
    clustered = [phrase for phrase, count in clustered_phrases.items() if count > 8]
    if clustered:
        errors.append(f"clustered generic phrases repeat too often: {', '.join(clustered)}")

    for index in range(0, max(0, len(nearby_openings) - 8)):
        window = nearby_openings[index:index + 9]
        repeated = [key for key, count in Counter(window).items() if key and count >= 5]
        if repeated:
            errors.append(f"opening cadence repeats across nearby cards: {', '.join(repeated[:3])}")
            break

    for index in range(0, max(0, len(nearby_landings) - 8)):
        window = nearby_landings[index:index + 9]
        repeated = [key for key, count in Counter(window).items() if key and count >= 5]
        if repeated:
            errors.append(f"landing cadence repeats across nearby cards: {', '.join(repeated[:3])}")
            break

    return errors


def validate_paragraph_coverage(
    cards: list[dict[str, Any]],
    taxonomy: list[dict[str, Any]],
) -> list[str]:
    errors: list[str] = []
    counts: Counter[tuple[str, str, str]] = Counter()
    for item in cards:
        major_domain = item.get("majorDomain")
        subcategory = item.get("insightSubcategory")
        pattern_type = item.get("patternType")
        if all(isinstance(value, str) for value in [major_domain, subcategory, pattern_type]):
            counts[(str(major_domain), str(subcategory), str(pattern_type))] += 1

    for entry in taxonomy:
        major_domain = str(entry.get("majorDomain"))
        subcategory = str(entry.get("subcategory"))
        for pattern_type in VALID_PATTERN_TYPES:
            count = counts[(major_domain, subcategory, pattern_type)]
            if count < 3:
                errors.append(
                    f"{major_domain}/{subcategory}/{pattern_type}: expected at least 3 card paragraphs, got {count}"
                )
    return errors


def main() -> int:
    if not LIBRARY_PATH.exists():
        print(f"Missing generated library: {LIBRARY_PATH.relative_to(ROOT)}", file=sys.stderr)
        return 1

    source = LIBRARY_PATH.read_text(encoding="utf-8")
    try:
        domains = extract_array(source, "GENERATED_INSIGHT_DOMAINS")
        taxonomy = extract_array(source, "GENERATED_INSIGHT_TAXONOMY")
        cards = extract_array(source, "GENERATED_INSIGHT_PARAGRAPHS")
        weekly = extract_array(source, "GENERATED_WEEKLY_INSIGHT_PARAGRAPHS")
    except Exception as exc:
        print(f"Could not parse generated library: {exc}", file=sys.stderr)
        return 1

    errors: list[str] = []
    seen_ids: set[str] = set()
    errors.extend(validate_domain_definitions(domains))
    errors.extend(validate_taxonomy_entries(taxonomy, domains))
    domain_keys = {domain.get("key") for domain in domains if isinstance(domain.get("key"), str)}
    subcategories_by_domain = {
        domain.get("key"): set(domain.get("subcategories", []))
        for domain in domains
        if isinstance(domain.get("key"), str) and isinstance(domain.get("subcategories"), list)
    }

    for index, item in enumerate(cards):
        label = f"GENERATED_INSIGHT_PARAGRAPHS[{index}] {item.get('id', '<missing id>')}"
        errors.extend(validate_metadata(item, seen_ids, label))
        if item.get("majorDomain") not in domain_keys:
            errors.append(f"{label}: majorDomain is not declared in GENERATED_INSIGHT_DOMAINS")
        elif item.get("insightSubcategory") not in subcategories_by_domain.get(item.get("majorDomain"), set()):
            errors.append(f"{label}: insightSubcategory is not declared for majorDomain")
        errors.extend(validate_card_body(item, label))

    for index, item in enumerate(weekly):
        label = f"GENERATED_WEEKLY_INSIGHT_PARAGRAPHS[{index}] {item.get('id', '<missing id>')}"
        errors.extend(validate_metadata(item, seen_ids, label))
        if item.get("majorDomain") not in domain_keys:
            errors.append(f"{label}: majorDomain is not declared in GENERATED_INSIGHT_DOMAINS")
        elif item.get("insightSubcategory") not in subcategories_by_domain.get(item.get("majorDomain"), set()):
            errors.append(f"{label}: insightSubcategory is not declared for majorDomain")
        errors.extend(validate_weekly_body(item, label))

    errors.extend(validate_variety(cards))
    errors.extend(validate_paragraph_coverage(cards, taxonomy))

    if errors:
        print("Insight paragraph library validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(cards)} card paragraphs, {len(weekly)} weekly paragraph sets, "
        f"{len(domains)} domains, and {len(taxonomy)} taxonomy entries."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
