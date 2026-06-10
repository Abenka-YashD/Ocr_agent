import { OcrError } from "../errors";
import { buildOcrPrompt, geminiSchemaToJsonDescription } from "../schemas";
import { parseModelJson, validateOcrResult } from "../validate";
import type { OcrResultPayload, OcrRunContext } from "../types";

function getOllamaConfig() {
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || "300000");
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, ""),
    model: process.env.OLLAMA_MODEL || "moondream",
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 300000,
  };
}

export async function checkOllamaAvailable(): Promise<boolean> {
  const { baseUrl } = getOllamaConfig();
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runOcrOllama(ctx: OcrRunContext): Promise<OcrResultPayload> {
  const { baseUrl, model, timeoutMs } = getOllamaConfig();

  const structuredSchemaDesc = JSON.stringify(
    geminiSchemaToJsonDescription(ctx.targetSchema),
    null,
    2
  );

  const prompt = `${buildOcrPrompt(ctx.agentInstructions)}

Return ONLY valid JSON (no markdown) with exactly this top-level shape:
{
  "thinkingSteps": ["step 1", "step 2", ...],
  "rawOcrText": "full document transcript preserving layout",
  "structuredData": { ... }
}

The structuredData object must follow this JSON schema:
${structuredSchemaDesc}`;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          {
            role: "user",
            content: prompt,
            images: [ctx.cleanBase64],
          },
        ],
        options: { temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const hint =
      err instanceof Error && err.name === "TimeoutError"
        ? "Request timed out."
        : "Could not reach Ollama.";
    throw new OcrError(
      `${hint} Ensure Ollama is running (ollama serve) at ${baseUrl} and model "${model}" is pulled (ollama pull ${model}).`,
      503,
      "OLLAMA_UNAVAILABLE"
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    const lowerErr = errText.toLowerCase();
    if (
      lowerErr.includes("unknown format") ||
      lowerErr.includes("invalid format") ||
      lowerErr.includes("failed to process inputs")
    ) {
      throw new OcrError(
        "Ollama could not decode the uploaded file as an image. Use PNG/JPG/WebP/GIF/BMP, or use Gemini for PDF/SVG files.",
        400,
        "OLLAMA_UNSUPPORTED_IMAGE"
      );
    }
    throw new OcrError(
      `Ollama returned ${response.status}: ${errText || response.statusText}. Is model "${model}" installed?`,
      502,
      "OLLAMA_ERROR"
    );
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const text = data.message?.content;
  if (!text) {
    throw new OcrError("Ollama returned an empty response.", 502, "OLLAMA_EMPTY");
  }

  try {
    const raw = parseModelJson(text);
    return validateOcrResult(raw);
  } catch {
    throw new OcrError(
      "Ollama returned invalid JSON. Try a lighter vision model (e.g. moondream) or re-run extraction.",
      502,
      "OLLAMA_INVALID_JSON"
    );
  }
}
