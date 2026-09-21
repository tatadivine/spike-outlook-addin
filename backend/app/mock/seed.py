"""Deterministic PRNG so mock data is stable across process restarts —
mirrors frontend/lib/mock/seed.ts (mulberry32) exactly so the two mock
datasets *could* line up if ever compared, though the frontend now gets
its data from this backend rather than generating its own."""
from __future__ import annotations

import random


def mulberry32(seed: int):
    state = {"a": seed & 0xFFFFFFFF}

    def next_float() -> float:
        a = state["a"]
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        state["a"] = a
        t = a
        t = (t ^ (t >> 15)) * (t | 1) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (t | 61) & 0xFFFFFFFF)) ^ t
        t &= 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return next_float


class Rng:
    """Small convenience wrapper around a mulberry32 generator with the
    same helper shapes used throughout the mock generator."""

    def __init__(self, seed: int):
        self._next = mulberry32(seed)

    def rand(self) -> float:
        return self._next()

    def randint(self, lo: int, hi: int) -> int:
        return lo + int(self.rand() * (hi - lo + 1))

    def pick(self, items: list):
        return items[self.randint(0, len(items) - 1)]

    def pick_weighted(self, items: list[tuple]):
        total = sum(w for _, w in items)
        r = self.rand() * total
        for item, w in items:
            if r < w:
                return item
            r -= w
        return items[-1][0]

    def chance(self, pct: float) -> bool:
        return self.rand() < pct


def hash_seed(identifier: str, salt: int = 0) -> int:
    """Turn an arbitrary id string into a stable positive int seed, so
    every employee/customer gets their own deterministic-but-independent
    random stream without needing a hand-authored seed table."""
    h = salt + 7
    for ch in identifier:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h or 1


def rng_for(identifier: str, salt: int = 0) -> Rng:
    return Rng(hash_seed(identifier, salt))


# A single, process-wide RNG for the initial data generation pass. Using
# Python's own `random` here (seeded) rather than Rng is fine because this
# only runs once at import time to build the base dataset.
random.seed(773107)
