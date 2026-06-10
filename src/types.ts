export type OcrPreset = 'invoice' | 'receipt' | 'business_card' | 'id_card' | 'custom';

export type OcrProvider = 'gemini' | 'ollama' | 'colab';

export type RagLlmProvider = 'ollama' | 'gemini';

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

export interface OcrConfig {
  defaultProvider: OcrProvider;
  providers: OcrProvider[];
  ollama: {
    baseUrl: string;
    model: string;
    available: boolean;
  };
  gemini: {
    model: string;
    configured: boolean;
  };
  colab?: {
    url: string;
    model: string;
    timeoutMs: number;
    available: boolean;
    configured: boolean;
  };
  rag?: RagConfig;
}

export interface RagCitation {
  chunkIndex: number;
  text: string;
  distance?: number;
}

export interface RagQueryResult {
  answer: string;
  citations: RagCitation[];
  documentId: string;
}

export interface FieldDefinition {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
}

export interface OcrResult {
  thinkingSteps: string[];
  rawOcrText: string;
  structuredData: Record<string, any>;
  provider?: OcrProvider;
}

export interface DocumentSample {
  id: string;
  name: string;
  preset: OcrPreset;
  mimeType: string;
  description: string;
  // A clean synthetic preview image (SVG/canvas description or dataurl) to let the user simulate
  dataUrl: string;
  customFields?: FieldDefinition[];
}
