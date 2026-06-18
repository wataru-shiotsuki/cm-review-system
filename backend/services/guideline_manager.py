import os
import threading
from pathlib import Path
from .pdf_extractor import build_full_text
class GuidelineManager:
    def __init__(self, guidelines_dir: Path):
        self.guidelines_dir = guidelines_dir
        self._cache: dict[str, dict] = {}
        self._root_mtime: float | None = None
        self._pdf_mtimes: dict[str, float] = {}
        self._lock = threading.Lock()
    def _needs_refresh(self) -> bool:
        if not self._cache and self.guidelines_dir.exists():
            return True
        if not self.guidelines_dir.exists():
            return False
        root_mtime = os.path.getmtime(self.guidelines_dir)
        if self._root_mtime != root_mtime:
            return True
        for pdf_path in self.guidelines_dir.glob("*.pdf"):
            if self._pdf_mtimes.get(pdf_path.name) != os.path.getmtime(pdf_path):
                return True
        return False
    def _refresh_cache(self):
        cache: dict[str, dict] = {}
        pdf_mtimes: dict[str, float] = {}
        if not self.guidelines_dir.exists():
            print(f"[WARN] Guidelines directory not found: {self.guidelines_dir}")
            self._cache = cache
            self._pdf_mtimes = pdf_mtimes
            self._root_mtime = None
            return
        self._root_mtime = os.path.getmtime(self.guidelines_dir)
        for pdf_path in sorted(self.guidelines_dir.glob("*.pdf")):
            try:
                text = build_full_text(pdf_path)
                cache[pdf_path.name] = {"filename": pdf_path.name, "text": text}
                pdf_mtimes[pdf_path.name] = os.path.getmtime(pdf_path)
                print(f"[OK] {pdf_path.name}: Load complete")
            except Exception as e:
                print(f"[ERROR] Failed to load {pdf_path.name}: {e}")
        self._cache = cache
        self._pdf_mtimes = pdf_mtimes
    def get_cache(self) -> dict[str, dict]:
        with self._lock:
            if self._needs_refresh():
                print("[INFO] Updating guideline cache...")
                self._refresh_cache()
            return self._cache
    def get_pdf_list(self) -> list[dict]:
        cache = self.get_cache()
        return [
            {
                "id": name,
                "filename": name,
                "char_count": len(entry.get("text", "")),
            }
            for name, entry in cache.items()
        ]
    def get_pdfs_by_ids(self, ids: list[str]) -> list[dict]:
        cache = self.get_cache()
        return [cache[i] for i in ids if i in cache]
    def pdf_count(self) -> int:
        return len(self.get_cache())