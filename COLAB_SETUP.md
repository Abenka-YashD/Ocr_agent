# Option 1: Cursor + Google Colab (hybrid)

Use **Cursor** for the app and **Colab in the browser** for GPU (OCR + RAG). You do not run the full notebook in Cursor on Windows.

## Part A — In Cursor (your PC)

### 1. Create the Colab upload zip

In Cursor terminal (project root):

```powershell
.\scripts\create-colab-upload.ps1
```

This creates `colab-upload.zip` (only the `colab/` server files).

### 2. Start Chroma (local vectors)

```powershell
chroma run --path ".chroma-data"
```

Leave this terminal open.

### 3. After Colab gives you a URL — edit `.env`

```env
OCR_PROVIDER=colab
COLAB_OCR_URL=https://YOUR-NGROK-URL.ngrok-free.app
COLAB_OCR_SECRET=          # optional, same as notebook
RAG_PROVIDER=ollama
```

### 4. Run the app

```powershell
npm run dev
```

Open http://localhost:3000 → **Colab GPU** for OCR → **Ask (RAG)** for Q&A.

---

## Part B — In Google Colab (browser)

1. Go to https://colab.research.google.com
2. **File → Upload notebook** → select `test.ipynb` from this project
3. **Runtime → Change runtime type → T4 GPU**
4. **Run All** (or run cells top to bottom)

### Cell 2 — Upload zip

When prompted, choose `colab-upload.zip` from your PC.

### Cell 6 — ngrok token

1. Get a free token: https://dashboard.ngrok.com/get-started/your-authtoken
2. Paste into `NGROK_AUTHTOKEN = "..."` in that cell, re-run the cell

### Copy the URL

The notebook prints:

```text
Colab OCR public URL (set as COLAB_OCR_URL in local .env):
https://xxxx.ngrok-free.app
```

Paste into `.env` in Cursor, restart `npm run dev`.

---

## Part C — Verify

1. Browser: `https://YOUR-URL/health` → JSON with `"gpu": "Tesla T4"`
2. App: **Colab GPU** provider shows no amber warning
3. Run OCR on a PNG/JPG → then **Ask (RAG)**

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `colab/ocr_server.py not found` | Re-run cell 2; upload `colab-upload.zip` |
| ngrok fails | Set `NGROK_AUTHTOKEN` in cell 6 |
| URL stops working | Colab disconnected — re-run notebook, update `.env` |
| RAG not ready | `chroma run` on PC + valid `COLAB_OCR_URL` |

---

## What stays where

| Component | Where it runs |
|-----------|----------------|
| React UI + Express | Cursor / your PC |
| Chroma vector DB | Your PC |
| Ollama + models + FastAPI | Colab GPU |
| ngrok tunnel | Colab → your PC app |
