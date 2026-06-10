import { RagError } from "./errors";

function getColabConfig() {
  const timeoutMs = Number(process.env.RAG_TIMEOUT_MS || process.env.COLAB_OCR_TIMEOUT_MS || "600000");
  const baseUrl = (process.env.COLAB_OLLAMA_URL || process.env.COLAB_OCR_URL || "").replace(/\/$/, "");
  return {
    baseUrl,
    secret: (process.env.COLAB_OCR_SECRET || process.env.COLAB_OLLAMA_SECRET || "").trim(),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 600000,
    embeddingModel: process.env.RAG_EMBEDDING_MODEL || "nomic-embed-text",
    chatModel: process.env.RAG_CHAT_MODEL || "llama3.2:3b",
  };
}

export function getColabRagUrl(): string {
  return getColabConfig().baseUrl;
}

export function getEmbeddingModel(): string {
  return getColabConfig().embeddingModel;
}

export function getChatModel(): string {
  return getColabConfig().chatModel;
}

function buildHeaders(): Record<string, string> {
  const { secret } = getColabConfig();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }
  return headers;
}

export async function checkColabRagAvailable(): Promise<boolean> {
  const { baseUrl } = getColabConfig();
  if (!baseUrl) return false;
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      ollama?: { available?: boolean };
      rag?: { available?: boolean };
    };
    return Boolean(data.rag?.available ?? data.ollama?.available);
  } catch {
    return false;
  }
}

export function isColabRagConfigured(): boolean {
  return Boolean(getColabConfig().baseUrl);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const { baseUrl, timeoutMs } = getColabConfig();
  if (!baseUrl) {
    throw new RagError(
      "COLAB_OCR_URL is not set. Start test.ipynb in Colab, expose ngrok, and paste the URL into .env.",
      500,
      "COLAB_NOT_CONFIGURED"
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/rag/embed`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const hint =
      err instanceof Error && err.name === "TimeoutError"
        ? "Colab RAG embed timed out."
        : "Could not reach Colab RAG API.";
    throw new RagError(
      `${hint} Ensure the Colab notebook is running and COLAB_OCR_URL is correct.`,
      503,
      "COLAB_RAG_UNAVAILABLE"
    );
  }

  const data = await response.json().catch(async () => ({
    detail: await response.text().catch(() => response.statusText),
  }));

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Colab RAG embed failed (${response.status}).`;
    throw new RagError(message, response.status >= 500 ? 503 : response.status, "EMBEDDING_FAILED");
  }

  const embeddings = (data as { embeddings?: number[][] }).embeddings;
  if (!embeddings || embeddings.length !== texts.length) {
    throw new RagError(
      "Colab returned incomplete embeddings.",
      502,
      "EMBEDDING_FAILED"
    );
  }

  return embeddings;
}

export async function generateRagAnswer(
  question: string,
  contextBlocks: { index: number; text: string }[]
): Promise<string> {
  const { baseUrl, timeoutMs } = getColabConfig();
  if (!baseUrl) {
    throw new RagError(
      "COLAB_OCR_URL is not set for RAG.",
      500,
      "COLAB_NOT_CONFIGURED"
    );
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/rag/chat`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ question, contextBlocks }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const hint =
      err instanceof Error && err.name === "TimeoutError"
        ? "Colab RAG chat timed out."
        : "Could not reach Colab RAG API.";
    throw new RagError(`${hint} Check Colab notebook and ngrok tunnel.`, 503, "COLAB_RAG_UNAVAILABLE");
  }

  const data = await response.json().catch(async () => ({
    detail: await response.text().catch(() => response.statusText),
  }));

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Colab RAG chat failed (${response.status}).`;
    throw new RagError(message, response.status >= 500 ? 503 : response.status, "GENERATION_FAILED");
  }

  const answer = (data as { answer?: string }).answer?.trim();
  if (!answer) {
    throw new RagError("Colab returned an empty RAG answer.", 502, "GENERATION_FAILED");
  }

  return answer;
}
