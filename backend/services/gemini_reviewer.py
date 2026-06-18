import asyncio
from google import genai
from google.genai import types
def build_review_prompt(guideline_text: str, pdf_names: list[str]) -> str:
    pdf_list_str = "、".join(f"『{n}』" for n in pdf_names)
    return f"""You are an expert in TV commercial (CM) compliance review.
You will receive storyboard images of a TV commercial.
Please review the contents of this storyboard based on the following guideline documents: {pdf_list_str}.
[Guideline Documents (Full Text)]
Reference Documents: {pdf_list_str}
---
{guideline_text}
---
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT: You MUST perform your review in a "4-step process", executing each step internally.
Skimming or summarizing is strictly prohibited. This is a critical task directly tied to the user's business.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Review Process (To be executed as internal thoughts)]
Thought Step 1 - Careful Reading of Guidelines (CRITICAL / DO NOT SKIP):
- Read the above [Guideline Documents (Full Text)] **sequentially from the very first character to the last**.
- Each page is marked in the following format:
  `--- filename.pdf (PDF N/Total Page) ---` followed by [Top], [Middle], and [Bottom] sections.
- "PDF N" is the absolute sequential page number displayed in a PDF viewer (including covers and tables of contents).
- **Internally list all** clauses regarding prohibitions, restrictions, obligations, and conditionally permitted items (do not omit even if there are many).
- For each clause, record: PDF filename / Sequential PDF page number / Position on page (Top/Middle/Bottom) / Chapter/Clause number / Intent of the clause / The original text itself.
- Treat tables, examples, notes, footnotes, and appendices equally; do not skip them.
- ABSOLUTELY DO NOT: summarize with "I roughly understand" or "The main clauses are..." and move on. You must cover ALL clauses.
Thought Step 2 - Checking against the Storyboard:
- Thoroughly read the video, dialogue, telops, numbers, sound effects, background, logos, and text of each cut.
- Check against **all clauses** listed in Thought Step 1 one by one, and identify all applicable ones.
- Do not judge by intuition ("This cut doesn't seem related to the guidelines"); mechanically check against all clauses.
Thought Step 3 - Deduplication and Consolidation (MUST EXECUTE):
- Review the candidate issues extracted in Step 2 and consolidate them according to the following rules:
  a) If there are multiple issues for **Same Cut x Same Clause** -> Consolidate into 1 issue, adopting the most severe severity.
  b) For **Different Cuts x Same Clause x Same Violation Reason** -> Consolidate into 1 issue, listing multiple cut numbers in `scene` (e.g., "Cut 2, Cut 4").
  c) **Issues expressing the same event from a different angle** (only phrasing differs) -> Must be consolidated into 1 issue.
  d) The description after consolidation must contain more information than any single description before consolidation.
- Failing to consolidate and listing similar issues is prohibited. Prioritize user readability.
Thought Step 4 - Final Judgment:
- "Clear Violation": Directly conflicts with prohibitions. Only if clearly readable from the original clause text.
- "Needs Confirmation": May conflict due to lack of information / Cannot confirm from the storyboard if the condition for conditional permission is met.
- Issues must be based strictly on what is explicitly stated in the original guideline text. Analogies from general knowledge, guessing, or other CM cases are prohibited.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Output Format] Output ONLY the following JSON. Do not include code fences or explanatory text.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{ 
  "summary": "Write a specific summary of the issues in one sentence (40-80 chars). Avoid generic phrases like 'Please fix' or 'No major problems'. List exactly what is caught, like 'Manufacturer name display on OO'. If 0 issues, leave empty (\"\").",
  "total_issues": total number of issues (number),
  "issues": [
    { 
      "id": 1,
      "category": "Classification of the violation category",
      "severity": "Clear Violation or Needs Confirmation",
      "scene": "Applicable cut number(s)",
      "description": "Specific reason for the issue",
      "guideline_reference": "GuidelineName.pdf (PDF Page N・Top|Middle|Bottom) Chapter/Clause",
      "guideline_quote": "Copy a 'short unique phrase (15-40 characters)' word-for-word from the original guideline text that can identify the clause. Do not quote the entire sentence; choose a characteristic part that distinguishes the clause.",
      "suggestion": "Specific improvement suggestion"
    } 
  ],
  "positive_points": [
    "The exterior hospital shot in Cut 1 is acceptable",
    "The hospital name display in Cut 4 is acceptable"
  ]
} 
* Strict rules for positive_points: Only use the format "OO in Cut X is acceptable" like the example above. ABSOLUTELY DO NOT include PDF filenames, page numbers, clause numbers, or quotation phrases like "based on" or "guideline".
[Strict Rules to Follow]
Rule 1 (Location Info - CRITICAL): guideline_reference must be output in the following format:
"filename.pdf (PDF Page N・Top|Middle|Bottom) Chapter/Clause (if any)"
- **N**: Use the N value from the marker `--- filename.pdf (PDF N/Total Page) ---` in the text.
  This is the **physical page number** identical to the N in "N/Total" displayed in PDF viewers.
  It is an absolute position including covers and TOC, so there will be no misalignment.
  ❌ NEVER use: "Printed page numbers", "Footer numbers", or notations like "- 12 -" printed at the bottom of the PDF.
- **Top/Middle/Bottom**: Output the section marker [Top], [Middle], or [Bottom] that the quote belongs to. You must choose exactly one of the three.
- **Chapter/Clause**: Append the chapter, article, or item number before/after the quote ONLY when it is clear (e.g., "Article 3 Paragraph 2").
  May be omitted for unstructured documents (Q&A, tables, lists). Do not force it.
Output Example:
- With Chapter/Clause: `"medical_guideline.pdf (PDF Page 15・Middle) Article 3 Paragraph 2"`
- Without Chapter/Clause: `"premium_law.pdf (PDF Page 8・Bottom)"`
Rule 2 (Accuracy): Judge based on facts. Pointing out issues based on guesses or general knowledge is prohibited. Base your logic ONLY on what is clearly stated in the original guideline text.
Rule 3 (Output Format): Output is JSON "ONLY". Markdown formatting, code fences, and explanatory text are strictly prohibited.
Rule 4 (Reproducibility): Always return the same result for the same input. Issue order should be fixed: page number ascending -> clause number ascending.
Rule 5 (No Duplicates): Do not list similar contents in the issues array. You must apply the consolidation rules of Thought Step 3. If two or more items with similar suggestions are output, consolidation has failed.
Rule 6 (Duty of Careful Reading): Even if the guideline document is lengthy, read through all clauses without skipping pages. Outputting "only major clauses" or "only typical violations" is prohibited. Output all violations applicable to the clauses without omission. However, you must always apply the duplicate consolidation from Rule 5.
Rule 7 (Maximize guideline_quote Search Hit Rate - CRITICAL):
The user will copy this quote and Ctrl+F search it in the PDF. To ensure a guaranteed hit, follow these:
- ALWAYS choose a short unique phrase of **15-40 characters** (Long quotes fail search due to line break/space shifts).
- Include **characteristic keywords** that distinguish the clause from others (Prioritize numbers, proper nouns, clause-specific phrasing).
- **Do not cross lines**. Choose a continuous string on a single line within the guideline document (Ctrl+F fails if there is a line break).
- Do not place punctuation like "、", "。", "　" at the beginning or end.
- Do not include brackets themselves like "〜", "『〜』" (Only the continuous text inside).
- Do not reuse the same quote string across multiple indications; choose the optimal phrase for each issue."""
async def review_storyboard(
    prompt: str,
    file_contents: list,
    client: genai.Client,
) -> str:
    contents = [prompt] + file_contents
    def _call_sync() -> str:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=16384,
                thinking_config=types.ThinkingConfig(thinking_budget=16384),
            ),
        )
        return response.text.strip()
    return await asyncio.to_thread(_call_sync)