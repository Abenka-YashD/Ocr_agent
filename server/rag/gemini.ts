import { GoogleGenAI } from "@google/genai";
import { RagError } from "./errors";

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new RagError(
      "GEMINI_API_KEY is not configured. Set it in your .env file for RAG.",
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

export function getEmbeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
}

export function getChatModel(): string {
  return process.env.GEMINI_MODEL || "gemini-3.5-flash";
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const ai = getGeminiClient();
  const model = getEmbeddingModel();

  const response = await ai.models.embedContent({
    model,
    contents: texts,
  });

  const vectors = (response.embeddings || []).map((item) => item.values || []);
  if (vectors.length !== texts.length || vectors.some((v) => v.length === 0)) {
    throw new RagError(
      "Gemini returned an incomplete embedding response.",
      502,
      "EMBEDDING_FAILED"
    );
  }

  return vectors;
}

export async function generateRagAnswer(
  question: string,
  contextBlocks: { index: number; text: string }[]
): Promise<string> {
  const ai = getGeminiClient();
  const model = getChatModel();

  const context = contextBlocks
    .map((block) => `[Chunk ${block.index}]\n${block.text}`)
    .join("\n\n");

  const prompt = `You are a document Q&A assistant. Answer ONLY using the context below.
If the answer is not in the context, say you cannot find it in the document.
Be concise and factual. When you use information from a chunk, mention the chunk number in parentheses, e.g. (Chunk 2).

CONTEXT:
${context}

QUESTION:
${question}`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ text: prompt }],
    config: {
      temperature: 0.2,
    },
  });

  const answer = response.text?.trim();
  if (!answer) {
    throw new RagError("Gemini returned an empty answer.", 502, "GENERATION_FAILED");
  }

  return answer;
}
