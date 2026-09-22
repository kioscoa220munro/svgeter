#!/usr/bin/env python3
"""Command-line reproducible runner for Nazer π Lab."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
import os
from pathlib import Path
import platform
import random
import subprocess
import sys
import time

from research_engine import (
    analyze_digits,
    analyze_lengths,
    read_digit_file,
    summarize_null,
)
from null_models import generate


def git_commit() -> str | None:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return os.environ.get("GIT_COMMIT")


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def run_observed(
    data_dir: Path, ns: list[int], l_max: int, all_lengths: bool
) -> tuple[list[dict], list[dict]]:
    rows: list[dict] = []
    sources: list[dict] = []

    for path in sorted(data_dir.glob("*_digits.txt")):
        name = path.name.removesuffix("_digits.txt")
        digits, raw_sha, cleaned_sha, raw_bytes = read_digit_file(path)
        if not digits:
            continue

        sources.append({
            "constant": name,
            "file": str(path),
            "raw_bytes": raw_bytes,
            "available_digits": len(digits),
            "raw_sha256": raw_sha,
            "cleaned_sha256": cleaned_sha,
        })

        for n in ns:
            if len(digits) < n:
                rows.append({
                    "constant": name,
                    "n": n,
                    "l": None,
                    "status": "INSUFFICIENT_DATA",
                })
                continue

            for result in analyze_lengths(
                digits, name, n, l_max, all_lengths=all_lengths
            ):
                row = result.to_dict()
                row["raw_sha256"] = raw_sha
                row["cleaned_sha256"] = cleaned_sha
                rows.append(row)

    return rows, sources


def run_null_models(
    data_dir: Path,
    ns: list[int],
    l_max: int,
    reps: int,
    model: str,
    seed: int,
) -> tuple[list[dict], list[dict]]:
    rng = random.Random(seed)
    rows: list[dict] = []
    first_l_rows: list[dict] = []

    for path in sorted(data_dir.glob("*_digits.txt")):
        constant = path.name.removesuffix("_digits.txt")
        source, _, _, _ = read_digit_file(path)
        if not source:
            continue

        for n in ns:
            if len(source) < n:
                continue

            observed = {
                r.l: r
                for r in analyze_lengths(
                    source, constant, n, l_max, all_lengths=True
                )
            }
            limit = min(n, l_max)
            null_by_l: dict[int, list[float]] = {
                l: [] for l in range(1, limit + 1)
            }
            closed_by_l: dict[int, list[int]] = {
                l: [] for l in range(1, limit + 1)
            }
            first_l_values: list[int | None] = []

            for _rep in range(reps):
                sample = generate(model, rng, source[:n], n)
                first_l: int | None = None
                for l in range(1, limit + 1):
                    result = analyze_digits(sample, constant, n, l)
                    null_by_l[l].append(float(result.unilateral))
                    closed_by_l[l].append(
                        1 if result.status == "CLOSED" else 0
                    )
                    if first_l is None and result.status == "UNILATERAL":
                        first_l = l
                first_l_values.append(first_l)

            for l in range(1, limit + 1):
                summary = summarize_null(
                    null_by_l[l], float(observed[l].unilateral)
                )
                rows.append({
                    "constant": constant,
                    "n": n,
                    "l": l,
                    "model": model,
                    "seed": seed,
                    "reps": reps,
                    "observed_unilateral": observed[l].unilateral,
                    "observed_status": observed[l].status,
                    "null_mean_unilateral": summary["mean"],
                    "null_sd_unilateral": summary["sd"],
                    "p_ge_observed": summary["p_ge"],
                    "p_le_observed": summary["p_le"],
                    "null_q025": summary["q025"],
                    "null_q50": summary["q50"],
                    "null_q975": summary["q975"],
                    "null_closed_rate": (
                        sum(closed_by_l[l]) / reps if reps else None
                    ),
                })

            observed_first = next(
                (l for l in range(1, limit + 1)
                 if observed[l].status == "UNILATERAL"),
                None,
            )
            comparable_first = [
                value for value in first_l_values if value is not None
            ]
            no_unilateral = sum(v is None for v in first_l_values)
            first_l_rows.append({
                "constant": constant,
                "n": n,
                "model": model,
                "seed": seed,
                "reps": reps,
                "l_max": limit,
                "observed_first_unilateral_l": observed_first,
                "null_mean_first_unilateral_l": (
                    sum(comparable_first) / len(comparable_first)
                    if comparable_first else None
                ),
                "null_no_unilateral_rate": (
                    no_unilateral / reps if reps else None
                ),
                "null_first_l_q025": (
                    sorted(comparable_first)[max(0, int(0.025 * (len(comparable_first) - 1))]
                    if comparable_first else None
                ),
                "null_first_l_q50": (
                    sorted(comparable_first)[int(0.5 * (len(comparable_first) - 1))]
                    if comparable_first else None
                ),
                "null_first_l_q975": (
                    sorted(comparable_first)[int(0.975 * (len(comparable_first) - 1))]
                    if comparable_first else None
                ),
            })

    return rows, first_l_rows


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Nazer π Lab — finite-prefix reversibility research runner"
    )
    parser.add_argument("--data-dir", default=".")
    parser.add_argument("--output", default="research_results.csv")
    parser.add_argument("--n", type=int, nargs="+", required=True)
    parser.add_argument("--l-max", type=int, default=15)
    parser.add_argument("--all-lengths", action="store_true")
    parser.add_argument(
        "--null-reps",
        type=int,
        default=0,
        help="Monte Carlo repetitions; 0 disables null-model generation.",
    )
    parser.add_argument(
        "--null-model",
        choices=["iid-uniform", "iid-marginal", "markov1", "markov2"],
        default="iid-uniform",
    )
    parser.add_argument("--seed", type=int, default=220)
    args = parser.parse_args()

    if any(n < 1 for n in args.n) or args.l_max < 1:
        raise SystemExit("N y L_MAX deben ser >= 1.")
    if args.null_reps < 0:
        raise SystemExit("--null-reps debe ser >= 0.")

    data_dir = Path(args.data_dir)
    started = time.perf_counter()
    observed_rows, sources = run_observed(
        data_dir, args.n, args.l_max, args.all_lengths
    )
    if not observed_rows:
        raise SystemExit("No hay archivos *_digits.txt utilizables.")

    output = Path(args.output)
    write_csv(output, observed_rows)

    null_rows: list[dict] = []
    first_l_rows: list[dict] = []
    if args.null_reps:
        null_rows, first_l_rows = run_null_models(
            data_dir,
            args.n,
            args.l_max,
            args.null_reps,
            args.null_model,
            args.seed,
        )
        write_csv(
            output.with_name(output.stem + "_null.csv"), null_rows
        )
        write_csv(
            output.with_name(output.stem + "_first_l_null.csv"),
            first_l_rows,
        )

    metadata = {
        "schema_version": "1.1",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "git_commit": git_commit(),
        "python": sys.version,
        "platform": platform.platform(),
        "parameters": {
            "n": args.n,
            "l_max": args.l_max,
            "all_lengths": args.all_lengths,
            "null_reps": args.null_reps,
            "null_model": args.null_model,
            "seed": args.seed,
        },
        "sources": sources,
        "observed_rows": len(observed_rows),
        "null_rows": len(null_rows),
        "first_l_null_rows": len(first_l_rows),
        "elapsed_seconds": time.perf_counter() - started,
    }
    output.with_name(output.name + ".meta.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"OK: {len(observed_rows)} resultados -> {output}")
    if null_rows:
        print(
            "OK: "
            f"{len(null_rows)} filas nulas -> "
            f"{output.with_name(output.stem + '_null.csv')}"
        )


if __name__ == "__main__":
    main()
