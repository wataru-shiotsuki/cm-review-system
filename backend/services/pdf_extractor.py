import io
from pathlib import Path
from pdfminer.layout import LAParams
def extract_pdf_pages(pdf_path: Path) -> list[dict]:
    from pdfminer.pdfpage import PDFPage
    from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
    from pdfminer.converter import TextConverter
    laparams = LAParams(
        detect_vertical=True,
        all_texts=True,
    )
    pages = []
    with open(pdf_path, "rb") as f:
        for i, page in enumerate(PDFPage.get_pages(f)):
            rsrcmgr = PDFResourceManager()
            output = io.StringIO()
            device = TextConverter(rsrcmgr, output, laparams=laparams)
            interpreter = PDFPageInterpreter(rsrcmgr, device)
            interpreter.process_page(page)
            text = output.getvalue().strip()
            device.close()
            output.close()
            pages.append({"page": i + 1, "text": text})
    return pages
def _find_near_newline(text: str, target: int) -> int:
    n = len(text)
    if target >= n:
        return n
    forward = text.find("\n", target)
    backward = text.rfind("\n", 0, target)
    if forward == -1 and backward == -1:
        return target
    if forward == -1:
        return backward + 1
    if backward == -1:
        return forward + 1
    return (forward + 1) if (forward - target) < (target - backward) else (backward + 1)
def _split_into_thirds(text: str) -> tuple[str, str, str]:
    n = len(text)
    if n == 0:
        return "", "", ""
    first = _find_near_newline(text, n // 3)
    second = _find_near_newline(text, (n * 2) // 3)
    return text[:first].strip(), text[first:second].strip(), text[second:].strip()
def build_full_text(pdf_path: Path) -> str:
    pages = extract_pdf_pages(pdf_path)
    filename = pdf_path.name
    total = len(pages)
    sections = []
    total_chars = 0
    for p in pages:
        header = f"--- {filename} (PDF {p['page']}/{total} Page) ---"
        upper, middle, lower = _split_into_thirds(p["text"])
        parts = [header]
        if upper:
            parts.append("【Top】")
            parts.append(upper)
        if middle:
            parts.append("【Middle】")
            parts.append(middle)
        if lower:
            parts.append("【Bottom】")
            parts.append(lower)
        sections.append("\n".join(parts))
        total_chars += len(p["text"])
    avg_chars = total_chars / max(len(pages), 1)
    if avg_chars < 50 and len(pages) > 0:
        print(f"[WARN] {filename}: Low average characters ({avg_chars:.0f} chars/page). May be a scanned PDF.")
    return "\n\n".join(sections)