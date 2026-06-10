import { OcrError } from "../errors";
import { geminiSchemaToJsonDescription } from "../schemas";
import { validateOcrResult } from "../validate";
import type { OcrRequestInput, OcrResultPayload, OcrRunContext } from "../types";

function getColabConfig() {
  const timeoutMs = Number(process.env.COLAB_OCR_TIMEOUT_MS || "600000");
  return {
    baseUrl: (process.env.COLAB_OCR_URL || "").replace(/\/$/, ""),
    secret: (process.env.COLAB_OCR_SECRET || "").trim(),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 600000,
  };
}

export function getColabOcrUrl(): string {
  return getColabConfig().baseUrl;
}

export async function checkColabAvailable(): Promise<boolean> {
  const { baseUrl } = getColabConfig();
  if (!baseUrl) return false;
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { ollama?: { available?: boolean } };
    return Boolean(data.ollama?.available ?? true);
  } catch {
    return false;
  }
}

export async function runOcrColab(
  input: OcrRequestInput,
  ctx: OcrRunContext
): Promise<OcrResultPayload> {
  const { baseUrl, secret, timeoutMs } = getColabConfig();

  if (!baseUrl) {
    throw new OcrError(
      "COLAB_OCR_URL is not set. Start the Colab notebook, expose the API with ngrok, and paste the URL into .env.",
      500,
      "COLAB_NOT_CONFIGURED"
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/ocr`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        fileBase64: input.fileBase64,
        mimeType: input.mimeType,
        agentInstructions: input.agentInstructions,
        targetSchema: geminiSchemaToJsonDescription(ctx.targetSchema),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const hint =
      err instanceof Error && err.name === "TimeoutError"
        ? "Colab OCR request timed out."
        : "Could not reach Colab OCR API.";
    throw new OcrError(
      `${hint} Ensure the Colab notebook is running, ngrok tunnel is active, and COLAB_OCR_URL is correct (${baseUrl}).`,
      503,
      "COLAB_UNAVAILABLE"
    );
  }

  const errorBody = await response.json().catch(async () => ({
    detail: await response.text().catch(() => response.statusText),
  }));

  if (!response.ok) {
    const message =
      typeof errorBody === "object" && errorBody !== null && "detail" in errorBody
        ? String((errorBody as { detail: unknown }).detail)
        : `Colab OCR returned ${response.status}.`;
    throw new OcrError(message, response.status >= 500 ? 503 : response.status, "COLAB_ERROR");
  }

  try {
    return validateOcrResult(errorBody);
  } catch {
    throw new OcrError(
      "Colab OCR returned an invalid response shape.",
      502,
      "COLAB_INVALID_RESPONSE"
    );
  }
}
