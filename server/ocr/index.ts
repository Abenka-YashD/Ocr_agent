import { OcrError } from "./errors";
import { runOcrColab } from "./providers/colab";
import { runOcrGemini } from "./providers/gemini";
import { runOcrOllama } from "./providers/ollama";
import {
  buildRootSchema,
  buildTargetSchema,
  cleanBase64Payload,
} from "./schemas";
import type { OcrProvider, OcrRequestInput, OcrResultPayload } from "./types";

export function resolveDefaultProvider(): OcrProvider {
  const env = (process.env.OCR_PROVIDER || "gemini").toLowerCase();
  if (env === "ollama") return "ollama";
  if (env === "colab") return "colab";
  return "gemini";
}

export function resolveProvider(requested?: string): OcrProvider {
  if (requested === "ollama" || requested === "gemini" || requested === "colab") {
    return requested;
  }
  return resolveDefaultProvider();
}

export async function runOcr(input: OcrRequestInput): Promise<{
  result: OcrResultPayload;
  provider: OcrProvider;
}> {
  if (!input.fileBase64) {
    throw new OcrError("Missing required 'fileBase64' payload.", 400, "MISSING_FILE");
  }
  if (!input.mimeType) {
    throw new OcrError("Missing required 'mimeType' metadata.", 400, "MISSING_MIME");
  }

  const provider = resolveProvider(input.provider);
  const cleanBase64 = cleanBase64Payload(input.fileBase64);
  const targetSchema = buildTargetSchema(input.schemaPreset, input.customSchema);
  const rootSchema = buildRootSchema(targetSchema);

  const ctx = {
    cleanBase64,
    mimeType: input.mimeType,
    rootSchema,
    targetSchema,
    agentInstructions: input.agentInstructions,
  };

  if (provider === "colab") {
    const result = await runOcrColab(input, ctx);
    return { result, provider: "colab" };
  }

  if (provider === "ollama") {
    try {
      const result = await runOcrOllama(ctx);
      return { result, provider: "ollama" };
    } catch (error) {
      const fallbackEnabled = (process.env.OCR_FALLBACK_TO_GEMINI || "true").toLowerCase() !== "false";
      const shouldFallback =
        fallbackEnabled &&
        error instanceof OcrError &&
        (error.code === "OLLAMA_UNAVAILABLE" || error.code === "OLLAMA_INVALID_JSON");

      if (!shouldFallback) {
        throw error;
      }

      const result = await runOcrGemini(ctx);
      return { result, provider: "gemini" };
    }
  }

  const result = await runOcrGemini(ctx);
  return { result, provider: "gemini" };
}

export { checkColabAvailable } from "./providers/colab";
export { checkOllamaAvailable } from "./providers/ollama";
export { sendOcrError } from "./errors";
