import { chunkText } from "./chunker";
import {
  checkChromaAvailable,
  getCollection,
  getCollectionName,
  getChromaHost,
  getChromaPort,
} from "./chroma";
import { RagError, sendRagError } from "./errors";
import * as geminiRag from "./gemini";
import * as ollamaRag from "./ollama";
import { resolveRagProvider } from "./provider";
import type {
  RagConfig,
  RagIngestRequest,
  RagIngestResult,
  RagQueryRequest,
  RagQueryResult,
} from "./types";

function getChunkSize(): number {
  return Number(process.env.RAG_CHUNK_SIZE || "1000");
}

function getChunkOverlap(): number {
  return Number(process.env.RAG_CHUNK_OVERLAP || "200");
}

function getDefaultTopK(): number {
  return Number(process.env.RAG_TOP_K || "5");
}

function assertDocumentId(documentId: unknown): string {
  if (typeof documentId !== "string" || !documentId.trim()) {
    throw new RagError("documentId is required.", 400, "INVALID_REQUEST");
  }
  const id = documentId.trim();
  if (id.length > 128) {
    throw new RagError("documentId is too long (max 128 characters).", 400, "INVALID_REQUEST");
  }
  return id;
}

function assertQuestion(question: unknown): string {
  if (typeof question !== "string" || !question.trim()) {
    throw new RagError("question is required.", 400, "INVALID_REQUEST");
  }
  return question.trim();
}

function assertText(text: unknown): string {
  if (typeof text !== "string" || !text.trim()) {
    throw new RagError("text is required for ingestion.", 400, "INVALID_REQUEST");
  }
  return text.trim();
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  if (resolveRagProvider() === "gemini") {
    return geminiRag.embedTexts(texts);
  }
  return ollamaRag.embedTexts(texts);
}

async function generateRagAnswer(
  question: string,
  contextBlocks: { index: number; text: string }[]
): Promise<string> {
  if (resolveRagProvider() === "gemini") {
    return geminiRag.generateRagAnswer(question, contextBlocks);
  }
  return ollamaRag.generateRagAnswer(question, contextBlocks);
}

export async function getRagConfig(): Promise<RagConfig> {
  const chromaAvailable = await checkChromaAvailable();
  const provider = resolveRagProvider();

  if (provider === "gemini") {
    let geminiConfigured = false;
    try {
      geminiRag.getGeminiClient();
      geminiConfigured = true;
    } catch {
      geminiConfigured = false;
    }

    return {
      enabled: chromaAvailable && geminiConfigured,
      provider: "gemini",
      chroma: {
        host: getChromaHost(),
        port: getChromaPort(),
        available: chromaAvailable,
        collection: getCollectionName(),
      },
      gemini: {
        chatModel: geminiRag.getChatModel(),
        embeddingModel: geminiRag.getEmbeddingModel(),
        configured: geminiConfigured,
      },
      chunkSize: getChunkSize(),
      chunkOverlap: getChunkOverlap(),
      defaultTopK: getDefaultTopK(),
    };
  }

  const colabConfigured = ollamaRag.isColabRagConfigured();
  const colabAvailable = colabConfigured ? await ollamaRag.checkColabRagAvailable() : false;

  return {
    enabled: chromaAvailable && colabConfigured && colabAvailable,
    provider: "ollama",
    chroma: {
      host: getChromaHost(),
      port: getChromaPort(),
      available: chromaAvailable,
      collection: getCollectionName(),
    },
    ollama: {
      colabUrl: ollamaRag.getColabRagUrl(),
      embeddingModel: ollamaRag.getEmbeddingModel(),
      chatModel: ollamaRag.getChatModel(),
      configured: colabConfigured,
      available: colabAvailable,
    },
    chunkSize: getChunkSize(),
    chunkOverlap: getChunkOverlap(),
    defaultTopK: getDefaultTopK(),
  };
}

export async function ingestDocument(body: RagIngestRequest): Promise<RagIngestResult> {
  const documentId = assertDocumentId(body.documentId);
  const text = assertText(body.text);
  const sourceName =
    typeof body.sourceName === "string" && body.sourceName.trim()
      ? body.sourceName.trim()
      : documentId;
  const preset = typeof body.preset === "string" ? body.preset : undefined;

  const collection = await getCollection();

  await collection.delete({
    where: { documentId },
  });

  const chunks = chunkText(text, getChunkSize(), getChunkOverlap());
  if (chunks.length === 0) {
    throw new RagError("No text chunks produced for ingestion.", 400, "EMPTY_TEXT");
  }

  const embeddings = await embedTexts(chunks);
  const ids = chunks.map((_, i) => `${documentId}::${i}`);
  const metadatas = chunks.map((_, i) => ({
    documentId,
    chunkIndex: i,
    sourceName,
    ...(preset ? { preset } : {}),
  }));

  await collection.add({
    ids,
    embeddings,
    documents: chunks,
    metadatas,
  });

  return {
    documentId,
    chunksIngested: chunks.length,
    collection: getCollectionName(),
  };
}

export async function queryDocument(body: RagQueryRequest): Promise<RagQueryResult> {
  const documentId = assertDocumentId(body.documentId);
  const question = assertQuestion(body.question);
  const topK = Math.min(
    Math.max(Number(body.topK || getDefaultTopK()), 1),
    20
  );

  const collection = await getCollection();
  const [queryEmbedding] = await embedTexts([question]);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: { documentId },
    include: ["documents", "metadatas", "distances"],
  });

  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  if (documents.length === 0) {
    throw new RagError(
      "No indexed chunks found for this document. Run OCR and ingest the document first.",
      404,
      "DOCUMENT_NOT_INDEXED"
    );
  }

  const contextBlocks = documents.map((doc, i) => {
    const meta = metadatas[i] as Record<string, unknown> | null;
    const chunkIndex =
      typeof meta?.chunkIndex === "number" ? meta.chunkIndex : i;
    return {
      index: chunkIndex,
      text: doc || "",
    };
  });

  const answer = await generateRagAnswer(question, contextBlocks);

  const citations = documents.map((doc, i) => {
    const meta = metadatas[i] as Record<string, unknown> | null;
    return {
      chunkIndex:
        typeof meta?.chunkIndex === "number" ? meta.chunkIndex : i,
      text: doc || "",
      distance: typeof distances[i] === "number" ? distances[i] : undefined,
    };
  });

  return {
    answer,
    citations,
    documentId,
  };
}

export async function deleteDocument(documentIdRaw: unknown): Promise<{ deleted: boolean }> {
  const documentId = assertDocumentId(documentIdRaw);
  const collection = await getCollection();
  await collection.delete({ where: { documentId } });
  return { deleted: true };
}

export { sendRagError, RagError };
