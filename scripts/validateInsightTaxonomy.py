#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from typing import Any

from validateInsightParagraphLibrary import (
    LIBRARY_PATH,
    ROOT,
    extract_array,
    validate_domain_definitions,
    validate_paragraph_taxonomy_alignment,
    validate_taxonomy_entries,
)


def extract_json_string_constant(source: str, constant_name: str) -> str:
    pattern = re.compile(
        rf"const\s+{re.escape(constant_name)}\s*=\s*(?P<literal>.+?);\n",
        re.S,
    )
    match = pattern.search(source)
    if not match:
        raise ValueError(f"Could not find string constant {constant_name}")

    literal = match.group("literal").strip()
    value = json.loads(literal)
    if not isinstance(value, str):
        raise ValueError(f"{constant_name} did not parse to a JSON string")

    return value


def extract_generated_paragraphs(source: str) -> list[dict[str, Any]]:
    try:
        encoded_json = extract_json_string_constant(source, "GENERATED_INSIGHT_PARAGRAPHS_JSON")
        paragraphs = json.loads(encoded_json)
    except Exception:
        paragraphs = extract_array(source, "GENERATED_INSIGHT_PARAGRAPHS")

    if not isinstance(paragraphs, list):
        raise ValueError("GENERATED_INSIGHT_PARAGRAPHS did not parse to a list")

    return paragraphs


def main() -> int:
    if not LIBRARY_PATH.exists():
        print(f"Missing generated library: {LIBRARY_PATH.relative_to(ROOT)}", file=sys.stderr)
        return 1

    source = LIBRARY_PATH.read_text(encoding="utf-8")
    try:
        domains = extract_array(source, "GENERATED_INSIGHT_DOMAINS")
        taxonomy = extract_array(source, "GENERATED_INSIGHT_TAXONOMY")
        cards = extract_generated_paragraphs(source)
        weekly = extract_array(source, "GENERATED_WEEKLY_INSIGHT_PARAGRAPHS")
    except Exception as exc:
        print(f"Could not parse generated insight library: {exc}", file=sys.stderr)
        return 1

    errors = [
        *validate_domain_definitions(domains),
        *validate_taxonomy_entries(taxonomy, domains),
        *validate_paragraph_taxonomy_alignment([*cards, *weekly], taxonomy),
    ]
    if errors:
        print("Insight taxonomy validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(domains)} domains, {len(taxonomy)} taxonomy entries, "
        f"{len(cards)} card paragraphs, and {len(weekly)} weekly paragraphs."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
