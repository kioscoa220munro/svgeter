#!/usr/bin/env python3
"""Create verified digit files for pi, e, sqrt(2), and phi.

This utility is intentionally explicit about the requested precision. It is
suitable for reproducible pilot datasets; for very large N, use a dedicated
high-performance digit source and preserve its provenance/hash.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import mpmath as mp


def clean_decimal(value: str, n: int) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) < n:
        raise RuntimeError(f"Solo se obtuvieron {len(digits)} dígitos; se pidieron {n}")
    return digits[:n]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=100_000)
    parser.add_argument("--output-dir", default="data")
    args = parser.parse_args()
    if args.n < 1:
        raise SystemExit("--n debe ser >= 1")

    # Extra guard digits reduce rounding risk in the textual conversion.
    mp.mp.dps = args.n + 25
    constants = {
        "pi": mp.pi,
        "e": mp.e,
        "sqrt2": mp.sqrt(2),
        "phi": (1 + mp.sqrt(5)) / 2,
    }
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema_version": "1.0",
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "digits_requested": args.n,
        "library": "mpmath",
        "mpmath_version": getattr(mp, "__version__", "unknown"),
        "files": [],
    }

    for name, value in constants.items():
        text = mp.nstr(value, n=args.n + 5)
        digits = clean_decimal(text, args.n)
        path = out / f"{name}_digits.txt"
        path.write_text(digits + "\n", encoding="ascii")
        manifest["files"].append({
            "constant": name,
            "path": str(path),
            "digits": len(digits),
            "sha256": hashlib.sha256(digits.encode("ascii")).hexdigest(),
        })

    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
