import { ChromaClient, type Collection } from "chromadb";
import { RagError } from "./errors";

const COLLECTION_NAME =
  process.env.CHROMA_COLLECTION || "ocr_document_chunks";

let client: ChromaClient | null = null;
let collectionPromise: Promise<Collection> | null = null;

export function getChromaHost(): string {
  return process.env.CHROMA_HOST || "localhost";
}

export function getChromaPort(): number {
  return Number(process.env.CHROMA_PORT || "8000");
}

function getChromaClient(): ChromaClient {
  if (!client) {
    client = new ChromaClient({
      host: getChromaHost(),
      port: getChromaPort(),
      ssl: (process.env.CHROMA_SSL || "false").toLowerCase() === "true",
    });
  }
  return client;
}

export async function checkChromaAvailable(): Promise<boolean> {
  try {
    const chroma = getChromaClient();
    await chroma.heartbeat();
    return true;
  } catch {
    return false;
  }
}

export async function getCollection(): Promise<Collection> {
  if (!collectionPromise) {
    collectionPromise = (async () => {
      const chroma = getChromaClient();
      try {
        return await chroma.getOrCreateCollection({
          name: COLLECTION_NAME,
          embeddingFunction: null,
          metadata: { source: "extractory-ocr-rag" },
        });
      } catch (error) {
        collectionPromise = null;
        const message =
          error instanceof Error ? error.message : "Failed to connect to Chroma.";
        throw new RagError(
          `Chroma is unavailable at ${getChromaHost()}:${getChromaPort()}. Start it with: chroma run. (${message})`,
          503,
          "CHROMA_UNAVAILABLE"
        );
      }
    })();
  }
  return collectionPromise;
}

export function getCollectionName(): string {
  return COLLECTION_NAME;
}
