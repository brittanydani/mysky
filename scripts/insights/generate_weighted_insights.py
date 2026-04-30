from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


DEFAULT_INPUT_PATH = Path("scripts/insights/weighted_insight_specs.example.json")
DEFAULT_OUTPUT_PATH = Path("generated/insights/weighted_insight_drafts.json")
DEFAULT_TONE_EXAMPLES_PATH = Path("scripts/insights/favorite_tone_examples.json")
DEFAULT_PROFILE_LENSES_PATH = Path("scripts/insights/profile_lenses.json")
DEFAULT_PROFILE_EXAMPLES_PATH = Path("scripts/insights/profile_lens_examples.json")

SOURCE_WEIGHTS: dict[str, float] = {
    "daily_questions": 1.35,
    "daily_reflections": 1.35,
    "monthly_review": 1.2,
    "parts_work": 1.2,
    "journal_entries": 1.15,
    "dream_journal": 1.1,
    "relationship_patterns": 1.1,
    "app_building": 1.1,
    "parenting": 1.1,
    "somatic_map": 1.05,
    "trigger_log": 1.0,
    "glimmer_log": 1.0,
    "check_ins": 1.0,
    "astrology": 0.55,
}

SOURCE_LABELS: dict[str, str] = {
    "daily_questions": "daily questions",
    "daily_reflections": "daily reflections",
    "monthly_review": "monthly review",
    "parts_work": "parts work",
    "journal_entries": "journal entries",
    "dream_journal": "dream journal",
    "relationship_patterns": "relationship patterns",
    "app_building": "app-building notes",
    "parenting": "parenting entries",
    "somatic_map": "somatic map",
    "trigger_log": "trigger log",
    "glimmer_log": "glimmer log",
    "check_ins": "check-ins",
    "astrology": "astrology snapshots",
}

GENERIC_LENS_SOURCES = {"daily_questions", "daily_reflections", "journal_entries", "check_ins"}

OBSERVATION_TEMPLATES: dict[str, list[str]] = {
    "cognitiveStyle": [
        "One regulatory pattern keeps appearing: {pattern_name}.",
        "Again and again, clarity shows up as a form of care: {pattern_name}.",
        "Your archive shows that {pattern_name}.",
    ],
    "identity": [
        "At the identity level, this is the recurring signal: {pattern_name}.",
        "One of the deeper threads in the archive is this: {pattern_name}.",
        "Under the day-to-day entries, this keeps coming back: {pattern_name}.",
    ],
    "relationships": [
        "In relationships, this is the pattern that keeps returning: {pattern_name}.",
        "The relational archive points to one main question: {pattern_name}.",
        "Closeness seems to bring this forward: {pattern_name}.",
    ],
    "creation": [
        "When the work matters, this pattern gets louder: {pattern_name}.",
        "Your builder archive keeps circling this: {pattern_name}.",
        "The creative pattern is less about output and more about this: {pattern_name}.",
    ],
    "dreamsSymbols": [
        "The dream archive keeps picking up this thread: {pattern_name}.",
        "At night, the same material shifts into another form: {pattern_name}.",
        "The strongest dream signal is this: {pattern_name}.",
    ],
    "today": [
        "Today's signal is quiet but specific: {pattern_name}.",
        "The clearest read today is this: {pattern_name}.",
        "What stands out today is this: {pattern_name}.",
    ],
    "progress": [
        "A real change is starting to show: {pattern_name}.",
        "The progress marker is subtle but meaningful: {pattern_name}.",
        "Compared with older entries, this is the shift: {pattern_name}.",
    ],
    "shadow": [
        "One hard truth in the archive is this: {pattern_name}.",
        "The sharper edge of the pattern is this: {pattern_name}.",
        "The archive does not treat this as a small signal: {pattern_name}.",
    ],
    "monthlyReport": [
        "This {period} keeps returning to one central tension: {pattern_name}.",
        "The central thread this {period} is this: {pattern_name}.",
        "Across the {period}, the pattern keeps coming back to this: {pattern_name}.",
    ],
    "default": [
        "Your archive keeps pointing toward this pattern: {pattern_name}.",
        "A repeated thread is becoming visible: {pattern_name}.",
        "One thing is starting to stand out: {pattern_name}.",
        "The archive is beginning to separate this from the noise: {pattern_name}.",
    ],
}

PATTERN_TEMPLATES: dict[str, list[str]] = {
    "cognitiveStyle": [
        "{receipt}, you return often to {signal_phrase}. The pattern suggests that {interpretation}.",
        "Across recent entries, you return often to {signal_phrase}. The pattern suggests that {interpretation}.",
        "When something hurts, language becomes part of the regulation: {signal_phrase}. The deeper read is that {interpretation}.",
    ],
    "identity": [
        "{receipt}, the same inner material keeps showing up around {signal_phrase}. What keeps surfacing is that {interpretation}.",
        "This shows up through {signal_phrase}. The deeper read is that {interpretation}.",
        "{receipt}, it is not one clean feeling. The recurring shape is {signal_phrase}, and the signal underneath is that {interpretation}.",
    ],
    "relationships": [
        "The strongest receipts are around {signal_phrase}. That points toward this: {interpretation}.",
        "{receipt}, the important signal is not one conversation; it is the repetition around {signal_phrase}. The signal underneath is that {interpretation}.",
        "What keeps mattering is {signal_phrase}. The deeper read is that {interpretation}.",
    ],
    "creation": [
        "{receipt}, the friction gathers around {signal_phrase}. Taken together, this suggests that {interpretation}.",
        "The evidence is practical, but the need underneath is emotional: {signal_phrase}. The deeper read is that {interpretation}.",
        "Again and again, the work gets evaluated through {signal_phrase}. What keeps surfacing is that {interpretation}.",
    ],
    "dreamsSymbols": [
        "{receipt}, the plot changes, but the emotional material keeps returning through {signal_phrase}. What this keeps showing is that {interpretation}.",
        "The dream signal is less about a single image and more about {signal_phrase}. The deeper read is that {interpretation}.",
        "What lingers is {signal_phrase}. That points toward this: {interpretation}.",
    ],
    "today": [
        "The supporting evidence is small but pointed: {signal_phrase}. Taken together, this suggests that {interpretation}.",
        "{receipt}, the day seems organized around {signal_phrase}. The deeper read is that {interpretation}.",
        "The signal is not dramatic. It is the repetition of {signal_phrase}, suggesting that {interpretation}.",
    ],
    "progress": [
        "The shift appears in {signal_phrase}. The signal underneath is that {interpretation}.",
        "{receipt}, there is less old reflex and more new interpretation around {signal_phrase}. The deeper read is that {interpretation}.",
        "What has changed is not the absence of pain; it is the way the archive now makes room for {signal_phrase}. The signal underneath is that {interpretation}.",
    ],
    "shadow": [
        "The activation gathers around {signal_phrase}. Taken together, this suggests that {interpretation}.",
        "{receipt}, the charge is strongest near {signal_phrase}. The deeper read is that {interpretation}.",
        "This is not a decorative insight. The archive keeps marking {signal_phrase}, and the signal underneath is that {interpretation}.",
    ],
    "monthlyReport": [
        "{receipt}, the repeated thread is {signal_phrase}. Underneath that is this: {interpretation}.",
        "The month does not point to one isolated moment. It keeps returning to {signal_phrase}. The deeper pattern is this: {interpretation}.",
        "The strongest through-line is {signal_phrase}. What it keeps showing is this: {interpretation}.",
    ],
    "default": [
        "{receipt}, the repeated material gathers around {signal_phrase}. Taken together, this suggests that {interpretation}.",
        "What keeps showing up is {signal_phrase}. The deeper read is that {interpretation}.",
        "{receipt}, this is less about one isolated entry and more about {signal_phrase}. That points toward this: {interpretation}.",
    ],
}

FORBIDDEN_PHRASES = [
    "navigating complex emotions",
    "holding space",
    "self-care journey",
    "trauma response",
    "diagnosis",
    "disorder",
    "pathology",
    "you always",
    "this proves",
    "journey",
    "authentic self",
    "deeply complex",
    "multi-faceted",
    "it is important to",
]

PROFILE_EXAMPLE_RED_FLAGS = [
    "as an ai",
    "navigating",
    "holding space",
    "self-care journey",
    "authentic self",
    "deeply complex",
    "multi-faceted",
    "empower",
    "at the end of the day",
]

GRAMMAR_RED_FLAGS = [
    re.compile(r"\s{2,}"),
    re.compile(r"\s+[,.!?;:]"),
    re.compile(r"\b(that|the|and|or|but|may|is|are|was|were)\s+\1\b", re.IGNORECASE),
    re.compile(r"\b(a)\s+\1\b", re.IGNORECASE),
    re.compile(r"\b(an)\s+\1\b", re.IGNORECASE),
]


@dataclass(frozen=True)
class EvidenceSignal:
    source: str
    label: str
    count: int = 1
    weight: float = 1.0


@dataclass(frozen=True)
class InsightSpec:
    id: str
    category: str
    mode: str
    title: str
    pattern_name: str
    signal_phrase: str
    interpretation: str
    shame_label: str
    clarity_reframe: str
    question: str
    evidence: list[EvidenceSignal]
    affirmation: str = ""
    report_period: str = "month"


@dataclass(frozen=True)
class ProfileLens:
    id: str
    name: str
    summary: str
    insight_angle: str
    sources: list[str]
    keywords: list[str]


@dataclass(frozen=True)
class MatchedLens:
    id: str
    name: str
    score: float
    insight_angle: str


@dataclass(frozen=True)
class ProfileLensExample:
    id: str
    lens_id: str
    title: str
    observation: str
    pattern: str
    reframe: str


@dataclass(frozen=True)
class GeneratedWeightedInsight:
    id: str
    category: str
    mode: str
    title: str
    body: str
    observation: str
    pattern: str
    reframe: str
    question: str
    source_score: float
    primary_sources: list[str]
    internal_lenses: list[MatchedLens]
    lens_blend: list[str]
    lens_example_ids: list[str]
    tone_reference_ids: list[str]


def clean_sentence(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return ""
    if cleaned.endswith((".", "?", "!")):
        return cleaned
    return f"{cleaned}."


def clean_fragment(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().rstrip(".")


def lowercase_first(text: str) -> str:
    text = clean_fragment(text)
    if not text:
        return text
    return text[0].lower() + text[1:]


def display_pattern_name(text: str) -> str:
    value = lowercase_first(text)
    clunky_prefixes = [
        r"^there is\s+",
        r"^today's strongest signal is\s+",
        r"^today's clearest signal is\s+",
        r"^the strongest signal is\s+",
        r"^a central tension:\s+",
        r"^central tension:\s+",
    ]
    for prefix in clunky_prefixes:
        value = re.sub(prefix, "", value, flags=re.IGNORECASE)
    return value


def stable_index(seed: str, size: int) -> int:
    if size <= 0:
        return 0
    return sum(ord(ch) for ch in seed) % size


def pick_template(templates: dict[str, list[str]], category: str, seed: str) -> str:
    options = templates.get(category) or templates["default"]
    return options[stable_index(seed, len(options))]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_specs(raw_specs: Any) -> list[InsightSpec]:
    if not isinstance(raw_specs, list):
        raise ValueError("Insight specs must be a JSON array.")

    specs: list[InsightSpec] = []
    for raw in raw_specs:
        evidence = [
            EvidenceSignal(
                source=str(item["source"]),
                label=str(item.get("label", item["source"])),
                count=int(item.get("count", 1)),
                weight=float(item.get("weight", 1.0)),
            )
            for item in raw.get("evidence", [])
        ]
        specs.append(
            InsightSpec(
                id=str(raw["id"]),
                category=str(raw["category"]),
                mode=str(raw.get("mode", "standard")),
                title=str(raw["title"]),
                pattern_name=str(raw["pattern_name"]),
                signal_phrase=str(raw["signal_phrase"]),
                interpretation=str(raw["interpretation"]),
                shame_label=str(raw["shame_label"]),
                clarity_reframe=str(raw["clarity_reframe"]),
                question=str(raw["question"]),
                evidence=evidence,
                affirmation=str(raw.get("affirmation", "")),
                report_period=str(raw.get("report_period", "month")),
            )
        )
    return specs


def parse_profile_lenses(raw_lenses: Any) -> list[ProfileLens]:
    if not isinstance(raw_lenses, list):
        raise ValueError("Profile lenses must be a JSON array.")

    lenses: list[ProfileLens] = []
    for raw in raw_lenses:
        lenses.append(
            ProfileLens(
                id=str(raw["id"]),
                name=str(raw["name"]),
                summary=str(raw.get("summary", "")),
                insight_angle=str(raw.get("insight_angle", "")),
                sources=[str(item) for item in raw.get("sources", [])],
                keywords=[str(item).lower() for item in raw.get("keywords", [])],
            )
        )
    return lenses


def parse_profile_examples(raw_examples: Any) -> list[ProfileLensExample]:
    if not isinstance(raw_examples, list):
        raise ValueError("Profile examples must be a JSON array.")

    examples: list[ProfileLensExample] = []
    for raw in raw_examples:
        examples.append(
            ProfileLensExample(
                id=str(raw["id"]),
                lens_id=str(raw["lens_id"]),
                title=str(raw["title"]),
                observation=str(raw["observation"]),
                pattern=str(raw["pattern"]),
                reframe=str(raw["reframe"]),
            )
        )
    return examples


def assert_clean_human_copy(identifier: str, text: str) -> None:
    for pattern in GRAMMAR_RED_FLAGS:
        if pattern.search(text):
            raise ValueError(f"{identifier}: grammar red flag: {pattern.pattern}")

    lowered = text.lower()
    for phrase in PROFILE_EXAMPLE_RED_FLAGS:
        if phrase in lowered:
            raise ValueError(f"{identifier}: unnatural phrase: {phrase}")


def validate_profile_examples(examples: list[ProfileLensExample], lenses: list[ProfileLens]) -> None:
    known_lens_ids = {lens.id for lens in lenses}
    seen_ids: set[str] = set()
    seen_lens_ids: set[str] = set()

    for example in examples:
        if example.id in seen_ids:
            raise ValueError(f"{example.id}: duplicate profile example id")
        seen_ids.add(example.id)

        if example.lens_id not in known_lens_ids:
            raise ValueError(f"{example.id}: unknown lens id: {example.lens_id}")
        if example.lens_id in seen_lens_ids:
            raise ValueError(f"{example.id}: duplicate example for lens id: {example.lens_id}")
        seen_lens_ids.add(example.lens_id)

        fields = {
            "title": example.title,
            "observation": example.observation,
            "pattern": example.pattern,
            "reframe": example.reframe,
        }
        for field_name, value in fields.items():
            if not value.strip():
                raise ValueError(f"{example.id}: missing {field_name}")
            assert_clean_human_copy(f"{example.id}.{field_name}", value)

        if not example.observation.startswith("Your archive"):
            raise ValueError(f"{example.id}: observation should begin with 'Your archive'")
        if "The pattern suggests" not in example.pattern:
            raise ValueError(f"{example.id}: pattern must include 'The pattern suggests'")
        if "This does not read as" not in example.reframe:
            raise ValueError(f"{example.id}: reframe missing 'This does not read as'")
        if "It reads as" not in example.reframe:
            raise ValueError(f"{example.id}: reframe missing 'It reads as'")


def source_score(evidence: list[EvidenceSignal]) -> float:
    return round(
        sum(SOURCE_WEIGHTS.get(item.source, 0.8) * item.count * item.weight for item in evidence),
        3,
    )


def primary_sources(evidence: list[EvidenceSignal]) -> list[str]:
    ranked = sorted(
        evidence,
        key=lambda item: SOURCE_WEIGHTS.get(item.source, 0.8) * item.count * item.weight,
        reverse=True,
    )
    return [item.source for item in ranked[:3]]


def readable_source(source: str) -> str:
    return SOURCE_LABELS.get(source, source.replace("_", " "))


def join_readable(items: list[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def source_receipt(evidence: list[EvidenceSignal], mode: str = "standard") -> str:
    if not evidence:
        return "Across recent entries"

    sources = primary_sources(evidence)
    labels = [readable_source(source) for source in sources[:3]]
    if mode == "monthly_report":
        return f"Across this month's {join_readable(labels)}"
    if sources[0] in {"daily_questions", "daily_reflections"}:
        return "Across your daily questions and recent entries"
    return f"Across your {join_readable(labels[:2])}"


def tone_reference_ids_for_category(tone_examples: list[dict[str, Any]], category: str) -> list[str]:
    exact = [str(item["id"]) for item in tone_examples if item.get("category") == category]
    if exact:
        return exact[:6]
    return [str(item["id"]) for item in tone_examples[:4]]


def source_weight_map(evidence: list[EvidenceSignal]) -> dict[str, float]:
    scores: dict[str, float] = {}
    for item in evidence:
        scores[item.source] = scores.get(item.source, 0.0) + (
            SOURCE_WEIGHTS.get(item.source, 0.8) * item.count * item.weight
        )
    return scores


def spec_search_text(spec: InsightSpec) -> str:
    evidence_text = " ".join(f"{item.source} {item.label}" for item in spec.evidence)
    return " ".join(
        [
            spec.id,
            spec.category,
            spec.title,
            spec.pattern_name,
            spec.signal_phrase,
            spec.interpretation,
            spec.shame_label,
            spec.clarity_reframe,
            spec.question,
            evidence_text,
        ]
    ).lower()


def keyword_matches(search_text: str, keywords: list[str]) -> int:
    matches = 0
    for keyword in keywords:
        if not keyword:
            continue
        if re.search(r"[\s-]", keyword):
            if keyword in search_text:
                matches += 1
            continue
        if re.search(rf"\b{re.escape(keyword)}\b", search_text):
            matches += 1
    return matches


def match_profile_lenses(
    spec: InsightSpec,
    lenses: list[ProfileLens],
    max_lenses: int = 5,
) -> list[MatchedLens]:
    if not lenses:
        return []

    source_scores = source_weight_map(spec.evidence)
    search_text = spec_search_text(spec)
    ranked: list[MatchedLens] = []
    for lens in lenses:
        specific_source_points = sum(
            source_scores.get(source, 0.0)
            for source in lens.sources
            if source not in GENERIC_LENS_SOURCES
        )
        generic_source_points = sum(
            source_scores.get(source, 0.0)
            for source in lens.sources
            if source in GENERIC_LENS_SOURCES
        )
        hit_count = keyword_matches(search_text, lens.keywords)
        if specific_source_points == 0 and hit_count == 0:
            continue
        score = round(
            (specific_source_points * 0.45)
            + (generic_source_points * 0.08)
            + min(hit_count * 2.0, 10.0),
            3,
        )
        ranked.append(
            MatchedLens(
                id=lens.id,
                name=lens.name,
                score=score,
                insight_angle=lens.insight_angle,
            )
        )

    ranked.sort(key=lambda item: (-item.score, item.id))
    return ranked[:max_lenses]


def lens_blend_angles(matched_lenses: list[MatchedLens]) -> list[str]:
    angles: list[str] = []
    for lens in matched_lenses:
        if lens.insight_angle and lens.insight_angle not in angles:
            angles.append(lens.insight_angle)
    return angles[:5]


def lens_example_ids(
    matched_lenses: list[MatchedLens],
    profile_examples: list[ProfileLensExample],
) -> list[str]:
    examples_by_lens = {example.lens_id: example.id for example in profile_examples}
    return [
        examples_by_lens[lens.id]
        for lens in matched_lenses
        if lens.id in examples_by_lens
    ]


def generate(
    spec: InsightSpec,
    tone_reference_ids: list[str],
    profile_lenses: list[ProfileLens],
    profile_examples: list[ProfileLensExample],
) -> GeneratedWeightedInsight:
    receipt = source_receipt(spec.evidence, spec.mode)
    reframe = ""
    body = ""
    pattern_name = display_pattern_name(spec.pattern_name)
    signal_phrase = clean_fragment(spec.signal_phrase)
    interpretation = lowercase_first(spec.interpretation)
    period = clean_fragment(spec.report_period)

    if spec.mode == "affirmation":
        body = clean_sentence(spec.affirmation or spec.pattern_name)
        observation = ""
        pattern = ""
        question = ""
    elif spec.mode == "monthly_report":
        observation_template = pick_template(
            OBSERVATION_TEMPLATES,
            spec.category,
            f"{spec.id}:observation",
        )
        pattern_template = pick_template(
            PATTERN_TEMPLATES,
            spec.category,
            f"{spec.id}:pattern",
        )
        observation = clean_sentence(observation_template.format(pattern_name=pattern_name, period=period))
        pattern = clean_sentence(
            pattern_template.format(
                receipt=receipt,
                signal_phrase=signal_phrase,
                interpretation=interpretation,
            )
        )
        reframe = clean_sentence(
            f"This does not read as {clean_fragment(spec.shame_label)}. "
            f"It reads as {clean_fragment(spec.clarity_reframe)}"
        )
        question = clean_sentence(spec.question)
    else:
        observation_template = pick_template(
            OBSERVATION_TEMPLATES,
            spec.category,
            f"{spec.id}:observation",
        )
        pattern_template = pick_template(
            PATTERN_TEMPLATES,
            spec.category,
            f"{spec.id}:pattern",
        )
        observation = clean_sentence(observation_template.format(pattern_name=pattern_name, period=period))
        pattern = clean_sentence(
            pattern_template.format(
                receipt=receipt,
                signal_phrase=signal_phrase,
                interpretation=interpretation,
            )
        )
        reframe = clean_sentence(
            f"This does not read as {clean_fragment(spec.shame_label)}. "
            f"It reads as {clean_fragment(spec.clarity_reframe)}"
        )
        question = clean_sentence(spec.question)

    matched_lenses = match_profile_lenses(spec, profile_lenses)
    draft = GeneratedWeightedInsight(
        id=spec.id,
        category=spec.category,
        mode=spec.mode,
        title=spec.title,
        body=body,
        observation=observation,
        pattern=pattern,
        reframe=reframe,
        question=question,
        source_score=source_score(spec.evidence),
        primary_sources=primary_sources(spec.evidence),
        internal_lenses=matched_lenses,
        lens_blend=lens_blend_angles(matched_lenses),
        lens_example_ids=lens_example_ids(matched_lenses, profile_examples),
        tone_reference_ids=tone_reference_ids,
    )
    assert_tone(draft)
    return draft


def assert_tone(draft: GeneratedWeightedInsight) -> None:
    combined = " ".join(
        [draft.title, draft.body, draft.observation, draft.pattern, draft.reframe, draft.question]
    ).lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase in combined:
            raise ValueError(f"{draft.id}: forbidden phrase: {phrase}")

    if draft.mode == "affirmation":
        if not draft.body:
            raise ValueError(f"{draft.id}: affirmation is empty")
        return

    if "this does not read as" not in draft.reframe.lower():
        raise ValueError(f"{draft.id}: missing 'This does not read as' reframe")
    if "it reads as" not in draft.reframe.lower():
        raise ValueError(f"{draft.id}: missing 'It reads as' reframe")
    if "you are " in draft.observation.lower():
        raise ValueError(f"{draft.id}: observation should lead with pattern, not identity")


def first_words(text: str, count: int = 3) -> str:
    words = re.findall(r"[A-Za-z']+", text)
    return " ".join(words[:count]).lower()


def audit_variety(drafts: list[GeneratedWeightedInsight]) -> None:
    starts: dict[str, list[str]] = {}
    for draft in drafts:
        for field_name in ("observation", "pattern"):
            value = getattr(draft, field_name)
            if not value:
                continue
            key = f"{field_name}:{first_words(value)}"
            starts.setdefault(key, []).append(draft.id)

    limit = max(3, len(drafts) // 3)
    repeated = {
        key: ids
        for key, ids in starts.items()
        if len(ids) > limit
    }
    if repeated:
        lines = [
            f"{key} -> {', '.join(ids[:6])}"
            for key, ids in sorted(repeated.items())
        ]
        raise ValueError("Too many drafts share the same sentence start:\n" + "\n".join(lines))


def write_outputs(drafts: list[GeneratedWeightedInsight], output_path: Path) -> None:
    audit_variety(drafts)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = [asdict(draft) for draft in drafts]
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    ts_path = output_path.with_suffix(".ts")
    ts_body = json.dumps(payload, indent=2, ensure_ascii=False)
    ts_path.write_text(
        "// Auto-generated by scripts/insights/generate_weighted_insights.py\n"
        f"export const WEIGHTED_INSIGHT_DRAFTS = {ts_body} as const;\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(drafts)} drafts to {output_path}")
    print(f"Wrote {len(drafts)} drafts to {ts_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate MySky insight drafts from weighted source specs."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--tone-examples", type=Path, default=DEFAULT_TONE_EXAMPLES_PATH)
    parser.add_argument("--profile-lenses", type=Path, default=DEFAULT_PROFILE_LENSES_PATH)
    parser.add_argument("--profile-examples", type=Path, default=DEFAULT_PROFILE_EXAMPLES_PATH)
    args = parser.parse_args()

    tone_examples = read_json(args.tone_examples)
    specs = parse_specs(read_json(args.input))
    profile_lenses = parse_profile_lenses(read_json(args.profile_lenses))
    profile_examples = parse_profile_examples(read_json(args.profile_examples))
    validate_profile_examples(profile_examples, profile_lenses)
    drafts = [
        generate(
            spec,
            tone_reference_ids_for_category(tone_examples, spec.category),
            profile_lenses,
            profile_examples,
        )
        for spec in specs
    ]
    write_outputs(drafts, args.output)

    print()
    for draft in drafts[:5]:
        print("=" * 90)
        print(draft.title)
        print()
        if draft.mode == "affirmation":
            print(draft.body)
        else:
            print(draft.observation)
            print()
            print(draft.pattern)
            print()
            print(draft.reframe)
            if draft.question:
                print()
                print(f"Question to keep: {draft.question}")


if __name__ == "__main__":
    main()
