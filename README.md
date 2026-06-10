<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ad327dd2-0633-4505-bffe-d34d40635a29

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env` and configure your OCR provider:
   - **Gemini (cloud):** set `GEMINI_API_KEY` and `OCR_PROVIDER=gemini`
   - **Ollama (local):** install with `winget install Ollama.Ollama`, pull `moondream` (`ollama pull moondream`), set `OCR_PROVIDER=ollama`. On Windows, Ollama usually runs as a background app after install (API at `http://localhost:11434`).
3. Run the app:
   `npm run dev`

The UI lets you switch between Gemini and Ollama per extraction. Structured OCR runs server-side via `POST /api/ocr`.
For fully local OCR (no cloud), set `OCR_PROVIDER=ollama` and `OCR_FALLBACK_TO_GEMINI=false`. If fallback is `true`, Ollama failures retry with Gemini.

## Option 1: Cursor + Colab GPU (recommended)

**Cursor** runs the app; **Google Colab** runs GPU (OCR + RAG). Full guide: [`COLAB_SETUP.md`](COLAB_SETUP.md)

1. In Cursor: `.\scripts\create-colab-upload.ps1` → creates `colab-upload.zip`
2. In Colab: upload `test.ipynb` + run cells (upload the zip when prompted)
3. Copy ngrok URL into `COLAB_OCR_URL` in `.env`, set `OCR_PROVIDER=colab`
4. In Cursor: `chroma run` + `npm run dev`

## RAG (Chroma + Ollama on Colab GPU)

Default: **Chroma** (local vectors) + **Ollama on Colab GPU** (embeddings + Q&A via the same `COLAB_OCR_URL` tunnel).

1. Start Chroma locally: `chroma run`
2. Run `test.ipynb` in Colab (pulls `nomic-embed-text` + `llama3.2:3b` for RAG)
3. Set in `.env`:
   ```env
   RAG_PROVIDER=ollama
   COLAB_OCR_URL=https://your-ngrok-url.ngrok-free.app
   ```
4. Run `npm run dev` — after OCR, text is auto-indexed; use **Ask (RAG)** tab.

For cloud RAG instead, set `RAG_PROVIDER=gemini` and `GEMINI_API_KEY`.

API endpoints:

- `GET /api/rag/config` — Chroma/Gemini RAG status
- `POST /api/rag/ingest` — index document text
- `POST /api/rag/query` — ask a question with citations
- `DELETE /api/rag/documents/:documentId` — remove indexed chunks
