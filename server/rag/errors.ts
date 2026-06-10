export class RagError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = "RagError";
  }
}

export function sendRagError(res: import("express").Response, error: unknown) {
  if (error instanceof RagError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred during RAG processing.";

  console.error("RAG API processing error:", error);
  return res.status(500).json({ error: message });
}
