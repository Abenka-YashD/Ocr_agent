import { OcrError } from "./errors";
import type { OcrResultPayload } from "./types";

export function parseModelJson(text: string): unknown {
  let cleaned = text.trim();
  const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    cleaned = codeBlock[1].trim();
  }
  return JSON.parse(cleaned);
}

export function validateOcrResult(payload: unknown): OcrResultPayload {
  if (!payload || typeof payload !== "object") {
    throw new OcrError("Invalid OCR response: expected a JSON object.", 502, "INVALID_RESPONSE");
  }

  const result = payload as Record<string, unknown>;

  if (!Array.isArray(result.thinkingSteps)) {
    throw new OcrError("OCR response missing 'thinkingSteps' array.", 502, "INVALID_RESPONSE");
  }
  if (typeof result.rawOcrText !== "string") {
    throw new OcrError("OCR response missing 'rawOcrText' string.", 502, "INVALID_RESPONSE");
  }
  if (!result.structuredData || typeof result.structuredData !== "object") {
    throw new OcrError("OCR response missing 'structuredData' object.", 502, "INVALID_RESPONSE");
  }

  return {
    thinkingSteps: result.thinkingSteps as string[],
    rawOcrText: result.rawOcrText,
    structuredData: result.structuredData as Record<string, unknown>,
  };
}
