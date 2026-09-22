#!/usr/bin/env python3
"""Core exact finite-prefix reversibility engine.

The engine works only on the supplied finite digit sequence. It never treats
absence inside a prefix as evidence of absence in an infinite expansion.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, asdict
import hashlib
import math
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class AnalysisResult:
    constant: str
    n: int
    l: int
    windows: int
    distinct: int
    palindromic: int
    nonpalindromic: int
    unilateral: int
    closed_pairs: int
    reversal_pairs: int
    coverage_blocks: float
    coverage_pairs: float
    first_block: str
    first_reverse: str
    first_position: int | None
    status: str
    seconds: float

    def to_dict(self) -> dict:
        return asdict(self)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clean_digits(raw: str | bytes) -> str:
    """Keep ASCII decimal digits only, matching the historical project rule."""
    if isinstance(raw, bytes):
        return "".join(chr(b) for b in raw if 48 <= b <= 57)
    return "".join(ch for ch in raw if "0" <= ch <= "9")


def read_digit_file(path: Path) -> tuple[str, str, str, int]:
    raw = path.read_bytes()
    digits = clean_digits(raw)
    return digits, sha256_bytes(raw), sha256_text(digits), len(raw)


def _encode_first(data: str, length: int) -> tuple[int, int]:
    code = 0
    for ch in data[:length]:
        code = code * 10 + (ord(ch) - 48)
    return code, 10 ** (length - 1)


def _reverse_code(code: int, length: int) -> int:
    out = 0
    for _ in range(length):
        out = out * 10 + (code % 10)
        code //= 10
    return out


def _format_code(code: int, length: int) -> str:
    return f"{code:0{length}d}"


def analyze_digits(data: str, constant: str, n: int, length: int) -> AnalysisResult:
    """Exact analysis of one (N, L) finite-prefix condition.

    Blocks are encoded as integers, so leading-zero blocks remain exact while
    avoiding one Python string object per sliding window.
    """
    prefix = data[:n]
    actual_n = len(prefix)
    windows = actual_n - length + 1

    if actual_n < n:
        return AnalysisResult(
            constant, n, length, 0, 0, 0, 0, 0, 0, 0,
            0.0, 0.0, "", "", None, "INSUFFICIENT_DATA", 0.0
        )
    if length < 1:
        raise ValueError("length must be >= 1")

    if windows <= 0:
        return AnalysisResult(
            constant, n, length, 0, 0, 0, 0, 0, 0, 0,
            0.0, 0.0, "", "", None, "INSUFFICIENT_DATA", 0.0
        )

    import time
    started = time.perf_counter()

    first_code, power = _encode_first(prefix, length)
    blocks: dict[int, int] = {first_code: 0}
    code = first_code

    for i in range(1, windows):
        digit = ord(prefix[i + length - 1]) - 48
        code = (code % power) * 10 + digit
        blocks.setdefault(code, i)

    palindromic = 0
    unilateral_items: list[tuple[int, int, int]] = []
    closed_pairs = 0
    paired_keys: set[int] = set()

    for block, position in blocks.items():
        reverse = _reverse_code(block, length)
        if reverse == block:
            palindromic += 1
            continue
        key = min(block, reverse)
        if key not in paired_keys:
            paired_keys.add(key)
            if reverse in blocks:
                closed_pairs += 1
            else:
                unilateral_items.append((block, reverse, position))

    unilateral = len(unilateral_items)
    nonpalindromic = len(blocks) - palindromic
    reversal_pairs = closed_pairs + unilateral
    coverage_blocks = (
        (2 * closed_pairs) / nonpalindromic if nonpalindromic else 1.0
    )
    coverage_pairs = (
        closed_pairs / reversal_pairs if reversal_pairs else 1.0
    )

    unilateral_items.sort(key=lambda item: _format_code(item[0], length))
    if unilateral_items:
        first_code_u, reverse_u, first_pos = unilateral_items[0]
        first_block = _format_code(first_code_u, length)
        first_reverse = _format_code(reverse_u, length)
        status = "UNILATERAL"
    else:
        first_block = first_reverse = ""
        first_pos = None
        status = "CLOSED"

    elapsed = time.perf_counter() - started

    return AnalysisResult(
        constant=constant,
        n=n,
        l=length,
        windows=windows,
        distinct=len(blocks),
        palindromic=palindromic,
        nonpalindromic=nonpalindromic,
        unilateral=unilateral,
        closed_pairs=closed_pairs,
        reversal_pairs=reversal_pairs,
        coverage_blocks=coverage_blocks,
        coverage_pairs=coverage_pairs,
        first_block=first_block,
        first_reverse=first_reverse,
        first_position=first_pos,
        status=status,
        seconds=elapsed,
    )


def analyze_lengths(
    data: str,
    constant: str,
    n: int,
    l_max: int,
    all_lengths: bool = False,
) -> list[AnalysisResult]:
    """Run L=1..Lmax, stopping at the first unilateral L unless requested."""
    if n < 1 or l_max < 1:
        raise ValueError("n and l_max must be >= 1")
    if len(data) < n:
        return [
            analyze_digits(data, constant, n, min(l_max, n))
        ] if l_max >= 1 else []

    limit = min(n, l_max)
    out: list[AnalysisResult] = []
    for length in range(1, limit + 1):
        result = analyze_digits(data, constant, n, length)
        out.append(result)
        if result.status == "UNILATERAL" and not all_lengths:
            break
    return out


def first_unilateral_length(
    data: str, constant: str, n: int, l_max: int
) -> int | None:
    for result in analyze_lengths(data, constant, n, l_max, all_lengths=False):
        if result.status == "UNILATERAL":
            return result.l
    return None


def empirical_percentile(values: Iterable[float], q: float) -> float:
    vals = sorted(values)
    if not vals:
        return math.nan
    if q <= 0:
        return vals[0]
    if q >= 1:
        return vals[-1]
    index = q * (len(vals) - 1)
    lo = int(math.floor(index))
    hi = int(math.ceil(index))
    if lo == hi:
        return vals[lo]
    fraction = index - lo
    return vals[lo] + (vals[hi] - vals[lo]) * fraction


def summarize_null(values: list[float], observed: float) -> dict:
    if not values:
        return {
            "reps": 0, "mean": None, "sd": None,
            "p_ge": None, "p_le": None, "q025": None, "q50": None, "q975": None
        }
    mean = sum(values) / len(values)
    variance = (
        sum((v - mean) ** 2 for v in values) / (len(values) - 1)
        if len(values) > 1 else 0.0
    )
    ge = sum(v >= observed for v in values)
    le = sum(v <= observed for v in values)
    return {
        "reps": len(values),
        "mean": mean,
        "sd": math.sqrt(variance),
        "p_ge": (1 + ge) / (len(values) + 1),
        "p_le": (1 + le) / (len(values) + 1),
        "q025": empirical_percentile(values, 0.025),
        "q50": empirical_percentile(values, 0.5),
        "q975": empirical_percentile(values, 0.975),
    }


def count_windows(data: str, length: int) -> int:
    return max(0, len(data) - length + 1)


def marginal_distribution(data: str) -> tuple[list[int], list[float]]:
    counts = Counter(data)
    digits = list(range(10))
    total = max(1, len(data))
    probs = [counts[str(d)] / total for d in digits]
    return digits, probs
