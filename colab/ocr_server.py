"""
Dedicated Colab GPU API for Extractory (OCR + RAG via Ollama).
Run from Google Colab after installing Ollama + pulling models.
Expose with ngrok; set COLAB_OCR_URL in your local .env to the public URL.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Optional

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "moondream")
RAG_EMBEDDING_MODEL = os.environ.get("RAG_EMBEDDING_MODEL", "nomic-embed-text")
RAG_CHAT_MODEL = os.environ.get("RAG_CHAT_MODEL", "llama3.2:3b")
COLAB_OCR_SECRET = os.environ.get("COLAB_OCR_SECRET", "").strip()
OCR_TIMEOUT_SEC = float(os.environ.get("COLAB_OCR_TIMEOUT_SEC", "600"))
RAG_TIMEOUT_SEC = float(os.environ.get("RAG_TIMEOUT_SEC", "600"))
EMBED_BATCH_SIZE = int(os.environ.get("RAG_EMBED_BATCH_SIZE", "32"))

app = FastAPI(title="Extractory Colab GPU (OCR + RAG)", version="1.1.0")


class OcrRequest(BaseModel):
    fileBase64: str
    mimeType: str
    agentInstructions: Optional[str] = None
    targetSchema: dict[str, Any] = Field(default_factory=dict)


class RagEmbedRequest(BaseModel):
    texts: list[str]


class RagContextBlock(BaseModel):
    index: int
    text: str


class RagChatRequest(BaseModel):
    question: str
    contextBlocks: list[RagContextBlock] = Field(default_factory=list)


def clean_base64(payload: str) -> str:
    if ";base64," in payload:
        return payload.split(";base64,", 1)[1]
    return payload


def build_ocr_prompt(agent_instructions: Optional[str]) -> str:
    extra = f"Additional User Agent Rules: {agent_instructions}" if agent_instructions else ""
    return f"""You are an expert AI Document OCR Agent designed to transcribe documents with absolute accuracy and parse relevant data points into structured schemas.

Instructions:
1. Scan the whole document, transcribe the full readable text in its natural layout (OCR), and assign it to the 'rawOcrText' output field.
2. Carefully follow your step-by-step cognitive extraction details (such as reading the company details, invoice lines, totals, numbers or custom fields) and document those step-by-step strings in 'thinkingSteps'.
3. Formulate the categorized values into the structure specified in the schema output and populate 'structuredData'.
{extra}"""


def parse_model_json(text: str) -> dict[str, Any]:
    trimmed = text.strip()
    fence = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", trimmed, re.IGNORECASE)
    if fence:
        trimmed = fence.group(1).strip()
    return json.loads(trimmed)


def validate_ocr_result(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("OCR output must be a JSON object.")
    thinking = raw.get("thinkingSteps")
    raw_text = raw.get("rawOcrText")
    structured = raw.get("structuredData")
    if not isinstance(thinking, list) or not all(isinstance(s, str) for s in thinking):
        raise ValueError("thinkingSteps must be an array of strings.")
    if not isinstance(raw_text, str):
        raise ValueError("rawOcrText must be a string.")
    if not isinstance(structured, dict):
        raise ValueError("structuredData must be an object.")
    return {
        "thinkingSteps": thinking,
        "rawOcrText": raw_text,
        "structuredData": structured,
    }


def verify_secret(authorization: Optional[str]) -> None:
    if not COLAB_OCR_SECRET:
        return
    expected = f"Bearer {COLAB_OCR_SECRET}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing COLAB_OCR_SECRET.")


@app.get("/health")
async def health() -> dict[str, Any]:
    gpu = "unknown"
    try:
        import subprocess

        out = subprocess.check_output(["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"], text=True)
        gpu = out.strip().split("\n")[0]
    except Exception:
        gpu = "cpu"

    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_ok = res.is_success
    except Exception:
        ollama_ok = False

    return {
        "status": "ok" if ollama_ok else "degraded",
        "provider": "colab-gpu",
        "gpu": gpu,
        "ollama": {"available": ollama_ok, "model": OLLAMA_MODEL, "baseUrl": OLLAMA_BASE_URL},
        "rag": {
            "available": ollama_ok,
            "embeddingModel": RAG_EMBEDDING_MODEL,
            "chatModel": RAG_CHAT_MODEL,
        },
    }


@app.post("/api/ocr")
async def run_ocr(
    body: OcrRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    verify_secret(authorization)

    if not body.fileBase64:
        raise HTTPException(status_code=400, detail="fileBase64 is required.")
    if not body.mimeType:
        raise HTTPException(status_code=400, detail="mimeType is required.")

    mime = body.mimeType.lower()
    if mime == "application/pdf" or mime == "image/svg+xml":
        raise HTTPException(
            status_code=400,
            detail="Colab GPU OCR accepts raster images only (PNG/JPG/WebP/GIF/BMP).",
        )

    schema_desc = json.dumps(body.targetSchema or {}, indent=2)
    prompt = f"""{build_ocr_prompt(body.agentInstructions)}

Return ONLY valid JSON (no markdown) with exactly this top-level shape:
{{
  "thinkingSteps": ["step 1", "step 2", ...],
  "rawOcrText": "full document transcript preserving layout",
  "structuredData": {{ ... }}
}}

The structuredData object must follow this JSON schema:
{schema_desc}"""

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "format": "json",
        "messages": [
            {
                "role": "user",
                "content": prompt,
                "images": [clean_base64(body.fileBase64)],
            }
        ],
        "options": {"temperature": 0.1},
    }

    try:
        async with httpx.AsyncClient(timeout=OCR_TIMEOUT_SEC) as client:
            res = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Colab OCR timed out. Retry or use a lighter model.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Could not reach Ollama on Colab: {exc}")

    if not res.is_success:
        err = res.text
        lower = err.lower()
        if "unknown format" in lower or "invalid format" in lower:
            raise HTTPException(status_code=400, detail="Ollama could not decode the image. Use PNG/JPG/WebP.")
        raise HTTPException(status_code=502, detail=f"Ollama error {res.status_code}: {err}")

    data = res.json()
    text = (data.get("message") or {}).get("content")
    if not text:
        raise HTTPException(status_code=502, detail="Ollama returned an empty response.")

    try:
        raw = parse_model_json(text)
        return validate_ocr_result(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=f"Invalid JSON from vision model: {exc}")


@app.post("/api/rag/embed")
async def rag_embed(
    body: RagEmbedRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    verify_secret(authorization)

    if not body.texts:
        raise HTTPException(status_code=400, detail="texts array is required.")

    all_embeddings: list[list[float]] = []
    try:
        async with httpx.AsyncClient(timeout=RAG_TIMEOUT_SEC) as client:
            for i in range(0, len(body.texts), EMBED_BATCH_SIZE):
                batch = body.texts[i : i + EMBED_BATCH_SIZE]
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/embed",
                    json={"model": RAG_EMBEDDING_MODEL, "input": batch},
                )
                if not res.is_success:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Ollama embed error {res.status_code}: {res.text}",
                    )
                data = res.json()
                batch_embeddings = data.get("embeddings") or []
                if len(batch_embeddings) != len(batch):
                    raise HTTPException(status_code=502, detail="Incomplete embedding batch from Ollama.")
                all_embeddings.extend(batch_embeddings)
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="RAG embedding timed out on Colab GPU.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Could not reach Ollama for embeddings: {exc}")

    return {"embeddings": all_embeddings, "model": RAG_EMBEDDING_MODEL}


@app.post("/api/rag/chat")
async def rag_chat(
    body: RagChatRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, str]:
    verify_secret(authorization)

    if not body.question.strip():
        raise HTTPException(status_code=400, detail="question is required.")

    context = "\n\n".join(
        f"[Chunk {block.index}]\n{block.text}" for block in body.contextBlocks
    )
    prompt = f"""You are a document Q&A assistant. Answer ONLY using the context below.
If the answer is not in the context, say you cannot find it in the document.
Be concise and factual. When you use information from a chunk, mention the chunk number in parentheses, e.g. (Chunk 2).

CONTEXT:
{context}

QUESTION:
{body.question.strip()}"""

    payload = {
        "model": RAG_CHAT_MODEL,
        "stream": False,
        "messages": [{"role": "user", "content": prompt}],
        "options": {"temperature": 0.2},
    }

    try:
        async with httpx.AsyncClient(timeout=RAG_TIMEOUT_SEC) as client:
            res = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="RAG chat timed out on Colab GPU.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Could not reach Ollama for chat: {exc}")

    if not res.is_success:
        raise HTTPException(status_code=502, detail=f"Ollama chat error {res.status_code}: {res.text}")

    data = res.json()
    answer = (data.get("message") or {}).get("content", "").strip()
    if not answer:
        raise HTTPException(status_code=502, detail="Ollama returned an empty RAG answer.")

    return {"answer": answer}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
