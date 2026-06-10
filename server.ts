import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  checkColabAvailable,
  checkOllamaAvailable,
  resolveDefaultProvider,
  runOcr,
  sendOcrError,
} from "./server/ocr/index";
import {
  deleteDocument,
  getRagConfig,
  ingestDocument,
  queryDocument,
  sendRagError,
} from "./server/rag/index";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/config", async (_req, res) => {
  const defaultProvider = resolveDefaultProvider();
  const ollamaAvailable = await checkOllamaAvailable();
  const colabAvailable = await checkColabAvailable();
  const rag = await getRagConfig();
  res.json({
    defaultProvider,
    providers: ["gemini", "ollama", "colab"],
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "moondream",
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || "300000"),
      available: ollamaAvailable,
    },
    colab: {
      url: process.env.COLAB_OCR_URL || "",
      model: process.env.COLAB_OCR_MODEL || process.env.OLLAMA_MODEL || "moondream",
      timeoutMs: Number(process.env.COLAB_OCR_TIMEOUT_MS || "600000"),
      available: colabAvailable,
      configured: Boolean(process.env.COLAB_OCR_URL),
    },
    gemini: {
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      configured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
      ),
    },
    fallbackToGemini: (process.env.OCR_FALLBACK_TO_GEMINI || "true").toLowerCase() !== "false",
    rag,
  });
});

app.get("/api/rag/config", async (_req, res) => {
  try {
    const rag = await getRagConfig();
    return res.json(rag);
  } catch (error) {
    return sendRagError(res, error);
  }
});

app.post("/api/rag/ingest", async (req, res) => {
  try {
    const result = await ingestDocument(req.body);
    return res.json(result);
  } catch (error) {
    return sendRagError(res, error);
  }
});

app.post("/api/rag/query", async (req, res) => {
  try {
    const result = await queryDocument(req.body);
    return res.json(result);
  } catch (error) {
    return sendRagError(res, error);
  }
});

app.delete("/api/rag/documents/:documentId", async (req, res) => {
  try {
    const result = await deleteDocument(req.params.documentId);
    return res.json(result);
  } catch (error) {
    return sendRagError(res, error);
  }
});

app.post("/api/ocr", async (req, res) => {
  try {
    const { result, provider } = await runOcr(req.body);
    return res.json({ ...result, provider });
  } catch (error) {
    return sendOcrError(res, error);
  }
});

async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const provider = resolveDefaultProvider();
    console.log(`AI Document OCR server running at http://localhost:${PORT}`);
    console.log(`Default OCR provider: ${provider}`);
  });
}

initServer();
