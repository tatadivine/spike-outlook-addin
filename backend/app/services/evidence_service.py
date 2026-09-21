from __future__ import annotations

from app.mock import generator as gen


def list_evidence() -> list[dict]:
    return gen.evidence_entries
