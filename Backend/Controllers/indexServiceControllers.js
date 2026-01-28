
import fs from "fs";
import { createRequire } from "module";
import { VectorStoreIndex, Document, Settings } from "llamaindex";
import { ChromaVectorStore } from "@llamaindex/chroma";
import { OpenAIEmbedding, OpenAI } from "@llamaindex/openai";

Settings.embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
});

Settings.llm = new OpenAI({
  model: "gpt-4o-mini",
  temperature: 0.2,
});

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

let index;

export async function ingestPDF(filePath) {
  console.log("FilePath:", filePath);

  const dataBuffer = fs.readFileSync(filePath);
  console.log("PDF buffer loaded");

  try {
    // ✅ NOW THIS IS GUARANTEED TO WORK
    const pdfData = await pdfParse(dataBuffer);
    console.log("PDF parsed successfully");

    const document = new Document({
      text: pdfData.text,
      metadata: { source: filePath },
    });
    console.log("Document created");

    const vectorStore = new ChromaVectorStore({
      collectionName: "pdf-knowledge",
      persistDir: "./vectorstore",
    });
    console.log("Vector store created");

    console.log("Starting embedding...");
    index = await VectorStoreIndex.fromDocuments([document], {
      vectorStore,
    });
    console.log("Embedding completed");

    console.log("Vector index created successfully");
  } catch (err) {
    console.error("❌ PDF parsing failed:", err);
    throw err;
  }
}

export function getIndex() {
  return index;
}

export async function loadIndexIfExists() {
  const vectorStore = new ChromaVectorStore({
    collectionName: "pdf-knowledge",
    persistDir: "./vectorstore",
  });

  index = await VectorStoreIndex.fromVectorStore(vectorStore);
  console.log("✅ Index reloaded from disk");
};
