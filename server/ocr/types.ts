import { Type } from "@google/genai";

export type OcrProvider = "gemini" | "ollama" | "colab";

export interface CustomSchemaField {
  key?: string;
  type?: "string" | "number" | "boolean" | "array";
  description?: string;
}

export interface OcrRequestInput {
  fileBase64: string;
  mimeType: string;
  schemaPreset?: string;
  customSchema?: CustomSchemaField[] | null;
  agentInstructions?: string;
  provider?: OcrProvider;
}

export interface OcrResultPayload {
  thinkingSteps: string[];
  rawOcrText: string;
  structuredData: Record<string, unknown>;
}

export interface OcrRunContext {
  cleanBase64: string;
  mimeType: string;
  rootSchema: GeminiSchema;
  targetSchema: GeminiSchema;
  agentInstructions?: string;
}

/** Gemini SDK schema object shape used for responseSchema */
export type GeminiSchema = {
  type: typeof Type.OBJECT | typeof Type.ARRAY | typeof Type.STRING | typeof Type.NUMBER | typeof Type.BOOLEAN;
  properties?: Record<string, GeminiSchema & { description?: string }>;
  items?: GeminiSchema;
  required?: string[];
  description?: string;
};
