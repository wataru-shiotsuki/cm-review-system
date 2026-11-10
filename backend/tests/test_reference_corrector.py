import unittest

from backend.services.reference_corrector import correct_issue_references


class ReferenceCorrectorTest(unittest.TestCase):
    def test_corrects_page_from_quote_and_leaves_unmatched_quote(self):
        pdf_text = (
            "--- sample_guideline.pdf (PDF 1/2 Page) ---\n"
            "【Top】\n別の項目\n"
            "--- sample_guideline.pdf (PDF 2/2 Page) ---\n"
            "【Middle】\n架空の商品について根拠を確認する\n"
        )
        issues = [
            {
                "guideline_quote": "架空の商品について根拠を確認する",
                "guideline_reference": "sample_guideline.pdf (PDF Page 99・Top) 第1項",
            },
            {
                "guideline_quote": "この文は資料に存在しない",
                "guideline_reference": "sample_guideline.pdf (PDF Page 99・Top)",
            },
        ]

        correct_issue_references(issues, {"sample_guideline.pdf": pdf_text})

        self.assertEqual(
            issues[0]["guideline_reference"],
            "sample_guideline.pdf (PDF Page 2・Middle) 第1項",
        )
        self.assertEqual(
            issues[1]["guideline_reference"],
            "sample_guideline.pdf (PDF Page 99・Top)",
        )


if __name__ == "__main__":
    unittest.main()
