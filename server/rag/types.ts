export interface RagChunkMetadata {
  documentId: string;
  chunkIndex: number;
  sourceName: string;
  preset?: string;
}

export interface RagIngestRequest {
  documentId: string;
  text: string;
  sourceName?: string;
  preset?: string;
}

export interface RagIngestResult {
  documentId: string;
  chunksIngested: number;
  collection: string;
}

export interface RagCitation {
  chunkIndex: number;
  text: string;
  distance?: number;
}

export interface RagQueryRequest {
  documentId: string;
  question: string;
  topK?: number;
}

export interface RagQueryResult {
  answer: string;
  citations: RagCitation[];
  documentId: string;
}

export type RagLlmProvider = "ollama" | "gemini";

export interface RagConfig {
  enabled: boolean;
  provider: RagLlmProvider;
  chroma: {
    host: string;
    port: number;
    available: boolean;
    collection: string;
  };
  ollama?: {
    colabUrl: string;
    embeddingModel: string;
    chatModel: string;
    configured: boolean;
    available: boolean;
  };
  gemini?: {
    chatModel: string;
    embeddingModel: string;
    configured: boolean;
  };
  chunkSize: number;
  chunkOverlap: number;
  defaultTopK: number;
}
