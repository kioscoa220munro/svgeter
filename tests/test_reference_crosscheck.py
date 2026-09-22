import random
import unittest

from research_engine import analyze_digits


def reference(data: str, n: int, l: int) -> dict:
    prefix = data[:n]
    blocks = {}
    for i in range(len(prefix) - l + 1):
        blocks.setdefault(prefix[i:i + l], i)
    if len(prefix) < n or l > len(prefix):
        return {"status": "INSUFFICIENT_DATA", "windows": 0}

    pal = sum(block == block[::-1] for block in blocks)
    unilateral = [
        (block, block[::-1], pos)
        for block, pos in blocks.items()
        if block != block[::-1] and block[::-1] not in blocks
    ]
    unilateral.sort(key=lambda x: x[0])

    keys = set()
    closed = 0
    for block in blocks:
        rev = block[::-1]
        if block == rev:
            continue
        key = min(block, rev)
        if key in keys:
            continue
        keys.add(key)
        if rev in blocks:
            closed += 1

    nonpal = len(blocks) - pal
    pairs = closed + len(unilateral)
    return {
        "status": "UNILATERAL" if unilateral else "CLOSED",
        "windows": len(prefix) - l + 1,
        "distinct": len(blocks),
        "palindromic": pal,
        "unilateral": len(unilateral),
        "closed_pairs": closed,
        "reversal_pairs": pairs,
        "first_block": unilateral[0][0] if unilateral else "",
        "first_reverse": unilateral[0][1] if unilateral else "",
        "first_position": unilateral[0][2] if unilateral else None,
        "coverage_blocks": (2 * closed / nonpal) if nonpal else 1.0,
        "coverage_pairs": (closed / pairs) if pairs else 1.0,
    }


class ReferenceCrosscheckTests(unittest.TestCase):
    def test_optimized_engine_matches_reference_on_random_small_inputs(self):
        rng = random.Random(220)
        for _ in range(300):
            n = rng.randint(1, 40)
            data = "".join(str(rng.randrange(10)) for _ in range(n))
            for l in range(1, min(n, 8) + 1):
                got = analyze_digits(data, "random", n, l).to_dict()
                want = reference(data, n, l)
                for key, value in want.items():
                    self.assertEqual(got[key], value, (data, n, l, key))
                self.assertAlmostEqual(
                    got["coverage_blocks"], want["coverage_blocks"], places=15
                )
                self.assertAlmostEqual(
                    got["coverage_pairs"], want["coverage_pairs"], places=15
                )


if __name__ == "__main__":
    unittest.main()
