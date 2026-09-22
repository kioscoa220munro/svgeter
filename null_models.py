#!/usr/bin/env python3
"""Null-model generators for the finite-prefix reversibility experiment."""

from __future__ import annotations

from collections import Counter, defaultdict
import random


def _choice(rng: random.Random, items: list[int], weights: list[float]) -> int:
    return rng.choices(items, weights=weights, k=1)[0]


def iid_uniform(rng: random.Random, n: int) -> str:
    return "".join(str(rng.randrange(10)) for _ in range(n))


def iid_marginal(rng: random.Random, source: str, n: int) -> str:
    counts = Counter(source)
    items = list(range(10))
    weights = [counts[str(d)] for d in items]
    if not any(weights):
        return iid_uniform(rng, n)
    return "".join(str(_choice(rng, items, weights)) for _ in range(n))


def markov1(rng: random.Random, source: str, n: int) -> str:
    if not source:
        return iid_uniform(rng, n)
    items = list(range(10))
    marginal = Counter(source)
    first = [marginal[str(d)] for d in items]

    transitions: dict[str, Counter[str]] = defaultdict(Counter)
    for a, b in zip(source, source[1:]):
        transitions[a][b] += 1

    out = [str(_choice(rng, items, first))]
    for _ in range(1, n):
        prev = out[-1]
        counts = transitions.get(prev)
        if not counts or not sum(counts.values()):
            weights = first
        else:
            weights = [counts[str(d)] for d in items]
        out.append(str(_choice(rng, items, weights)))
    return "".join(out)


def markov2(rng: random.Random, source: str, n: int) -> str:
    if len(source) < 3:
        return markov1(rng, source, n)

    items = list(range(10))
    marginal = Counter(source)
    first = [marginal[str(d)] for d in items]
    transitions: dict[str, Counter[str]] = defaultdict(Counter)
    triples: dict[str, Counter[str]] = defaultdict(Counter)

    for a, b in zip(source, source[1:]):
        transitions[a][b] += 1
    for i in range(len(source) - 2):
        triples[source[i:i + 2]][source[i + 2]] += 1

    out = [
        str(_choice(rng, items, first)),
        str(_choice(rng, items, first)),
    ]
    for _ in range(2, n):
        key = out[-2:]
        counts = triples.get(key)
        if not counts or not sum(counts.values()):
            counts = transitions.get(out[-1])
        if not counts or not sum(counts.values()):
            weights = first
        else:
            weights = [counts[str(d)] for d in items]
        out.append(str(_choice(rng, items, weights)))
    return "".join(out)


def generate(model: str, rng: random.Random, source: str, n: int) -> str:
    if model == "iid-uniform":
        return iid_uniform(rng, n)
    if model == "iid-marginal":
        return iid_marginal(rng, source, n)
    if model == "markov1":
        return markov1(rng, source, n)
    if model == "markov2":
        return markov2(rng, source, n)
    raise ValueError(f"Unknown null model: {model}")
