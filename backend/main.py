import os
import asyncio
import traceback
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from google import genai
from services.guideline_manager import GuidelineManager
from services.gemini_reviewer import build_review_prompt, review_storyboard
from services.response_parser import parse_review_response
from services.reference_corrector import correct_issue_references
load_dotenv()
app = FastAPI(title="CM Compliance System", version="2.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
PROJECT_ROOT = Path(__file__).parent.parent
GUIDELINES_DIR = PROJECT_ROOT / "guidelines"
guideline_mgr = GuidelineManager(GUIDELINES_DIR)
@app.get("/guidelines/{filename:path}")
async def serve_guideline_pdf(filename: str):
    pdf_path = (GUIDELINES_DIR / filename).resolve()
    try:
        if not pdf_path.is_relative_to(GUIDELINES_DIR.resolve()):
            raise HTTPException(status_code=400, detail="Invalid Access")
    except AttributeError:
        if not str(pdf_path).startswith(str(GUIDELINES_DIR.resolve())):
            raise HTTPException(status_code=400, detail="Invalid Access")
    if not pdf_path.exists() or pdf_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(str(pdf_path), media_type="application/pdf")
@app.get("/api/health")
async def health_check():
    api_key = os.getenv("GEMINI_API_KEY", "")
    has_key = api_key != "" and api_key != "YOUR_API_KEY_HERE"
    return {
        "status": "ok",
        "api_key_configured": has_key,
        "pdf_count": guideline_mgr.pdf_count(),
    }
@app.get("/api/guidelines")
async def get_available_guidelines():
    return {"pdfs": guideline_mgr.get_pdf_list()}
@app.post("/api/review")
async def review(
    files: list[UploadFile] = File(...),
    pdf_ids: list[str] = Form(...),
):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is not configured.",
        )
    if not pdf_ids:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one guideline PDF.",
        )
    allowed_types = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]
    for f in files:
        if f.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {f.filename} ({f.content_type})",
            )
    try:
        file_contents = []
        filenames = []
        MAX_FILE_SIZE = 20 * 1024 * 1024  
        for f in files:
            content = await f.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413, 
                    detail=f"File size is too large (max 20MB): {f.filename}"
                )
            from google.genai import types as genai_types
            file_contents.append(
                genai_types.Part.from_bytes(data=content, mime_type=f.content_type)
            )
            filenames.append(f.filename)
        selected = guideline_mgr.get_pdfs_by_ids(pdf_ids)
        if len(selected) != len(pdf_ids):
            raise HTTPException(
                status_code=400,
                detail="Selected PDF not found. Please reload.",
            )
        pdf_names = [p["filename"] for p in selected]
        client = genai.Client(api_key=api_key)
        sem = asyncio.Semaphore(2)
        async def review_one(pdf_entry: dict) -> dict:
            fname = pdf_entry["filename"]
            async with sem:
                try:
                    prompt = build_review_prompt(pdf_entry["text"], [fname])
                    response_text = await review_storyboard(prompt, file_contents, client)
                    parsed = parse_review_response(response_text)
                    return {"filename": fname, "ok": True, "result": parsed}
                except Exception as e:
                    traceback.print_exc()
                    return {"filename": fname, "ok": False, "error": str(e)}
        per_pdf_results = await asyncio.gather(*[review_one(p) for p in selected])
        successful = [r for r in per_pdf_results if r["ok"]]
        failed = [r for r in per_pdf_results if not r["ok"]]
        if not successful:
            err_detail = "; ".join(f"{r['filename']}: {r['error']}" for r in failed)
            raise HTTPException(
                status_code=500,
                detail=f"Compliance check failed for all PDFs: {err_detail}",
            )
        merged_issues: list = []
        merged_positives: list[str] = []
        summaries: list[str] = []
        for r in successful:
            res = r["result"]
            if not isinstance(res, dict):
                continue
            issues = res.get("issues") or []
            if isinstance(issues, list):
                for iss in issues:
                    if isinstance(iss, dict):
                        merged_issues.append(iss)
            positives = res.get("positive_points") or []
            if isinstance(positives, list):
                for pp in positives:
                    if isinstance(pp, str):
                        merged_positives.append(pp)
            s = res.get("summary") or ""
            if isinstance(s, str) and s.strip():
                summaries.append(s.strip())
        merged_positives = list(dict.fromkeys(merged_positives))
        for i, iss in enumerate(merged_issues, 1):
            iss["id"] = i
        pdf_texts_map = {p["filename"]: p["text"] for p in selected}
        correct_issue_references(merged_issues, pdf_texts_map)
        if len(summaries) == 1:
            final_summary = summaries[0]
        elif len(summaries) > 1:
            final_summary = f"Compliance check completed based on selected guidelines. Multiple issues/warnings were found."
        else:
            final_summary = ""
        merged_result = {
            "summary": final_summary,
            "total_issues": len(merged_issues),
            "issues": merged_issues,
            "positive_points": merged_positives,
        }
        response_payload = {
            "success": True,
            "result": merged_result,
            "filenames": filenames,
            "applied_pdfs": pdf_names,
        }
        if failed:
            response_payload["failed_pdfs"] = [
                {"filename": r["filename"], "error": r["error"]} for r in failed
            ]
        return JSONResponse(content=response_payload)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error during compliance check: {str(e)}")
if __name__ == "__main__":
    import uvicorn
    import threading
    def _preload():
        print("Loading guideline PDFs in background...")
        guideline_mgr.get_cache()
        print("Guideline cache complete")
    threading.Thread(target=_preload, daemon=True).start()
    print("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))