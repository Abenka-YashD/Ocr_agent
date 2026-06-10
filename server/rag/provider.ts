export type RagLlmProvider = "ollama" | "gemini";

export function resolveRagProvider(): RagLlmProvider {
  const env = (process.env.RAG_PROVIDER || "ollama").toLowerCase();
  if (env === "gemini") return "gemini";
  return "ollama";
}
