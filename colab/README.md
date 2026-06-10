# Colab GPU API (OCR + RAG)

Ollama on Colab T4 GPU for **vision OCR** and **RAG** (embeddings + chat). One ngrok URL powers both.

## Models (pull in notebook)

| Model | Purpose |
|-------|---------|
| `moondream` | Document OCR (vision) |
| `nomic-embed-text` | RAG embeddings |
| `llama3.2:3b` | RAG Q&A |

## Quick start (Option 1: Cursor + Colab)

See **[`COLAB_SETUP.md`](../COLAB_SETUP.md)** for the full hybrid workflow.

1. In Cursor: `.\scripts\create-colab-upload.ps1`
2. In Colab browser: upload [`test.ipynb`](../test.ipynb), **T4 GPU**, run all cells
3. Copy the **ngrok URL** into Cursor `.env`
4. Local `.env`:
   ```env
   OCR_PROVIDER=colab
   COLAB_OCR_URL=https://xxxx.ngrok-free.app
   RAG_PROVIDER=ollama
   RAG_EMBEDDING_MODEL=nomic-embed-text
   RAG_CHAT_MODEL=llama3.2:3b
   ```
5. Start Chroma locally: `chroma run`
6. `npm run dev` → use **Colab GPU** for OCR and **Ask (RAG)** for Q&A.

## API endpoints (on Colab)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | GPU, OCR, and RAG status |
| `POST` | `/api/ocr` | Structured document OCR |
| `POST` | `/api/rag/embed` | Batch text embeddings |
| `POST` | `/api/rag/chat` | RAG answer with context |

Optional: `Authorization: Bearer <COLAB_OCR_SECRET>`

## Notes

- Re-index documents after switching embedding models (Chroma vectors must match).
- Colab sessions expire — restart notebook + ngrok when disconnected.
