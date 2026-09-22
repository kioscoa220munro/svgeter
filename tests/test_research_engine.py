import unittest

from research_engine import (
    analyze_digits,
    analyze_lengths,
    clean_digits,
    first_unilateral_length,
)


class ResearchEngineTests(unittest.TestCase):
    def test_clean_digits_ascii_only(self):
        self.assertEqual(clean_digits("3.14159\nabc"), "314159")
        self.assertEqual(clean_digits(b"01\xff23"), "0123")

    def test_single_digits_are_always_closed(self):
        result = analyze_digits("0123456789", "toy", 10, 1)
        self.assertEqual(result.status, "CLOSED")
        self.assertEqual(result.unilateral, 0)
        self.assertEqual(result.palindromic, 10)
        self.assertEqual(result.coverage_pairs, 1.0)

    def test_reverse_pair_is_closed(self):
        result = analyze_digits("0110", "toy", 4, 2)
        self.assertEqual(result.status, "CLOSED")
        self.assertEqual(result.unilateral, 0)
        self.assertEqual(result.closed_pairs, 1)
        self.assertEqual(result.reversal_pairs, 1)
        self.assertAlmostEqual(result.coverage_blocks, 1.0)

    def test_unilateral_block_is_found(self):
        result = analyze_digits("012", "toy", 3, 2)
        self.assertEqual(result.status, "UNILATERAL")
        self.assertEqual(result.unilateral, 2)
        self.assertEqual(result.first_block, "01")
        self.assertEqual(result.first_reverse, "10")
        self.assertEqual(result.first_position, 0)

    def test_leading_zero_is_preserved(self):
        result = analyze_digits("001", "toy", 3, 2)
        self.assertEqual(result.first_block, "00")  # palindrome is not unilateral
        self.assertEqual(result.first_reverse, "")
        self.assertEqual(result.status, "UNILATERAL")
        self.assertEqual(result.unilateral, 1)

    def test_length_scan_stops_at_first_unilateral(self):
        results = analyze_lengths("012", "toy", 3, 3)
        self.assertEqual([r.l for r in results], [1, 2])
        self.assertEqual(results[-1].status, "UNILATERAL")

    def test_first_unilateral_length(self):
        self.assertEqual(first_unilateral_length("012", "toy", 3, 3), 2)
        self.assertIsNone(first_unilateral_length("1111", "toy", 4, 4))

    def test_insufficient_data(self):
        result = analyze_digits("123", "toy", 4, 2)
        self.assertEqual(result.status, "INSUFFICIENT_DATA")
        self.assertEqual(result.windows, 0)


if __name__ == "__main__":
    unittest.main()
