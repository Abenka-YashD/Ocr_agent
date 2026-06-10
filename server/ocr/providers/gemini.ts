import { GoogleGenAI } from "@google/genai";
import { OcrError } from "../errors";
import { buildOcrPrompt } from "../schemas";
import { parseModelJson, validateOcrResult } from "../validate";
import type { OcrResultPayload, OcrRunContext } from "../types";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new OcrError(
      "GEMINI_API_KEY environment variable is not configured. Set it in your .env file.",
      500,
      "MISSING_API_KEY"
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function runOcrGemini(ctx: OcrRunContext): Promise<OcrResultPayload> {
  const ai = getGeminiClient();
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  const documentPart = {
    inlineData: {
      mimeType: ctx.mimeType,
      data: ctx.cleanBase64,
    },
  };

  const textPart = {
    text: buildOcrPrompt(ctx.agentInstructions),
  };

  const response = await ai.models.generateContent({
    model,
    contents: [documentPart, textPart],
    config: {
      responseMimeType: "application/json",
      responseSchema: ctx.rootSchema,
      temperature: 0.1,
    },
  });

  const parsedJsonString = response.text || "{}";
  const raw = parseModelJson(parsedJsonString);
  return validateOcrResult(raw);
}
