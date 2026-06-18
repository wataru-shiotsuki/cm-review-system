import re
from typing import Optional
_PAGE_MARKER_RE_TMPL = r"---\s*{fname}\s*\(PDF\s+(\d+)/(\d+)\s*Page\)\s*---"
_FILENAME_IN_REF_RE = re.compile(r"([^\s(（]+\.pdf)", re.IGNORECASE)
def _strip_whitespace(s: str) -> str:
    return re.sub(r"\s+", "", s)
def _find_quote_position(text: str, quote: str) -> Optional[int]:
    q = quote.strip().strip("「」『』\"'")
    if not q:
        return None
    idx = text.find(q)
    if idx >= 0:
        return idx
    stripped = []
    pos_map: list[int] = []  
    for i, ch in enumerate(text):
        if not ch.isspace():
            stripped.append(ch)
            pos_map.append(i)
    stripped_text = "".join(stripped)
    stripped_quote = _strip_whitespace(q)
    if not stripped_quote:
        return None
    idx2 = stripped_text.find(stripped_quote)
    if idx2 >= 0:
        return pos_map[idx2]
    import difflib
    window_size = int(len(stripped_quote) * 1.5)
    step = max(1, len(stripped_quote) // 4)
    best_ratio = 0
    best_idx = -1
    for i in range(0, max(1, len(stripped_text) - len(stripped_quote) + 1), step):
        window = stripped_text[i:i+window_size]
        ratio = difflib.SequenceMatcher(None, stripped_quote, window).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_idx = i
    if best_ratio > 0.7 and best_idx >= 0:
        window = stripped_text[best_idx:best_idx+window_size]
        matcher = difflib.SequenceMatcher(None, stripped_quote, window)
        match = matcher.find_longest_match(0, len(stripped_quote), 0, len(window))
        if match.size > 0:
            final_idx = best_idx + match.b
            if final_idx < len(pos_map):
                return pos_map[final_idx]
        if best_idx < len(pos_map):
            return pos_map[best_idx]
    return None
def _page_and_section_at(text: str, filename: str, pos: int) -> tuple[Optional[int], Optional[str]]:
    fname_escaped = re.escape(filename)
    marker_re = re.compile(_PAGE_MARKER_RE_TMPL.format(fname=fname_escaped))
    last_marker = None
    for m in marker_re.finditer(text, 0, pos):
        last_marker = m
    if last_marker is None:
        return None, None
    page_num = int(last_marker.group(1))
    section_area = text[last_marker.end():pos]
    last_section: Optional[str] = None
    last_section_pos = -1
    for sec_full, sec_label in [("【Top】", "Top"), ("【Middle】", "Middle"), ("【Bottom】", "Bottom")]:
        p = section_area.rfind(sec_full)
        if p > last_section_pos:
            last_section_pos = p
            last_section = sec_label
    return page_num, last_section
def _extract_filename_from_ref(ref: str) -> Optional[str]:
    m = _FILENAME_IN_REF_RE.search(ref)
    return m.group(1) if m else None
def _extract_chapter_part(ref: str) -> str:
    m = re.search(r"\([^)]*Page[^)]*\)\s*(.*)$", ref)
    if m:
        return m.group(1).strip()
    return ""
def correct_issue_references(
    issues: list[dict], pdf_texts: dict[str, str]
) -> list[dict]:
    for issue in issues:
        if not isinstance(issue, dict):
            continue
        quote = issue.get("guideline_quote", "") or ""
        ref = issue.get("guideline_reference", "") or ""
        if not quote or not ref:
            continue
        filename = _extract_filename_from_ref(ref)
        if not filename:
            continue
        text = pdf_texts.get(filename)
        if not text:
            continue
        pos = _find_quote_position(text, quote)
        if pos is None:
            continue
        page_num, section = _page_and_section_at(text, filename, pos)
        if page_num is None:
            continue
        chapter = _extract_chapter_part(ref)
        new_ref = f"{filename} (PDF Page {page_num}"
        if section:
            new_ref += f"・{section}"
        new_ref += ")"
        if chapter:
            new_ref += f" {chapter}"
        issue["guideline_reference"] = new_ref
    return issues