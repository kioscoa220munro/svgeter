#!/usr/bin/env python3
"""Reproducible finite-prefix reversibility runner.

This tool studies only finite prefixes. It does not claim anything about
whether a reverse block appears somewhere later in an infinite expansion.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import pathlib
import time
from dataclasses import asdict, dataclass


@dataclass
class Result:
    constant: str
    n: int
    l: int
    windows: int
    distinct: int
    unilateral: int
    first_block: str
    first_reverse: str
    first_position: int | None
    status: str
    seconds: float


def clean_digits(path: pathlib.Path) -> tuple[str, str]:
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    digits = ''.join(chr(c) for c in raw if 48 <= c <= 57)
    return digits, digest


def analyze(data: str, constant: str, n: int, l: int) -> Result:
    prefix = data[:n]
    windows = len(prefix) - l + 1
    if windows <= 0:
        return Result(constant, n, l, 0, 0, 0, '', '', None, 'INSUFFICIENT_DATA', 0.0)

    started = time.perf_counter()
    blocks: dict[str, int] = {}
    for i in range(windows):
        block = prefix[i:i + l]
        if block not in blocks:
            blocks[block] = i

    unilateral = []
    for block, position in blocks.items():
        reverse = block[::-1]
        if reverse not in blocks:
            unilateral.append((block, reverse, position))

    unilateral.sort(key=lambda item: item[0])
    first = unilateral[0] if unilateral else ('', '', None)
    elapsed = time.perf_counter() - started

    return Result(
        constant=constant,
        n=n,
        l=l,
        windows=windows,
        distinct=len(blocks),
        unilateral=len(unilateral),
        first_block=first[0],
        first_reverse=first[1],
        first_position=first[2],
        status='UNILATERAL' if unilateral else 'CLOSED',
        seconds=elapsed,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', default='.')
    parser.add_argument('--output', default='research_results.csv')
    parser.add_argument('--n', type=int, nargs='+', required=True)
    parser.add_argument('--l-max', type=int, default=15)
    parser.add_argument('--all-lengths', action='store_true')
    args = parser.parse_args()

    data_dir = pathlib.Path(args.data_dir)
    rows: list[dict] = []

    for path in sorted(data_dir.glob('*_digits.txt')):
        name = path.name.removesuffix('_digits.txt')
        digits, raw_sha256 = clean_digits(path)
        cleaned_sha256 = hashlib.sha256(digits.encode('ascii')).hexdigest()

        for n in args.n:
            if len(digits) < n:
                continue
            for l in range(1, min(n, args.l_max) + 1):
                result = analyze(digits, name, n, l)
                row = asdict(result)
                row['raw_sha256'] = raw_sha256
                row['cleaned_sha256'] = cleaned_sha256
                rows.append(row)
                if result.status == 'UNILATERAL' and not args.all_lengths:
                    break

    if not rows:
        raise SystemExit('No usable *_digits.txt files or no valid N values.')

    with open(args.output, 'w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    metadata = {
        'n': args.n,
        'l_max': args.l_max,
        'all_lengths': args.all_lengths,
        'output': args.output,
        'rows': len(rows),
    }
    pathlib.Path(args.output + '.meta.json').write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding='utf-8',
    )
    print(f'Wrote {len(rows)} rows to {args.output}')


if __name__ == '__main__':
    main()
