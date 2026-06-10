export class OcrError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = "OcrError";
  }
}

export function sendOcrError(res: import("express").Response, error: unknown) {
  if (error instanceof OcrError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
  }

  const message =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred during OCR structured extraction.";

  console.error("OCR API processing error:", error);
  return res.status(500).json({ error: message });
}
