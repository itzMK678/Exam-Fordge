import os
import logging
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from extractors.pdf import extract_pdf
from extractors.docx import extract_docx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("examforge-worker")

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit
INTERNAL_WORKER_SECRET = os.getenv("INTERNAL_WORKER_SECRET", "").strip()

app = FastAPI(
    title="ExamForge Document Worker",
    version="1.1.0",
    description="High-performance extraction microservice for PDF and DOCX educational documents"
)

# Safe CORS configuration (disallows wildcard with credentials)
cors_origins_env = os.getenv("CORS_ORIGIN", "http://localhost:5000,http://127.0.0.1:5000")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in cors_origins_env.split(",")
    if origin.strip() and origin.strip() != "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "ExamForge Python Worker",
        "status": "running",
        "version": "1.1.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/extract")
async def extract_document(
    file: UploadFile = File(...),
    x_internal_secret: str = Header(default=None)
):
    if INTERNAL_WORKER_SECRET and x_internal_secret != INTERNAL_WORKER_SECRET:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid internal worker secret."
        )
    filename = file.filename or "uploaded_file"
    filename_lower = filename.lower()

    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only .pdf and .docx files are supported."
        )

    try:
        file_bytes = await file.read()
    except Exception as read_err:
        logger.error(f"Failed to read stream for {filename}: {read_err}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file: {str(read_err)}"
        )

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty (0 bytes)."
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    logger.info(f"Extracting {filename} ({len(file_bytes)} bytes)...")

    try:
        if filename_lower.endswith(".pdf"):
            result = await asyncio.to_thread(extract_pdf, file_bytes)
            file_type = "pdf"
        else:
            result = await asyncio.to_thread(extract_docx, file_bytes)
            file_type = "docx"

        logger.info(f"Successfully extracted {filename}: {result['page_count']} pages, {result['word_count']} words.")

        return {
            "success": True,
            "filename": filename,
            "file_type": file_type,
            **result
        }

    except ValueError as val_err:
        logger.warning(f"Validation error extracting {filename}: {val_err}")
        raise HTTPException(
            status_code=400,
            detail=str(val_err)
        )
    except Exception as error:
        logger.error(f"Unexpected error extracting {filename}: {error}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Extraction failed: {str(error)}"
        )