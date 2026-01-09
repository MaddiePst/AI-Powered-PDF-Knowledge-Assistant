import fs from "fs";
import { createRequire } from "module";

import { VectorStoreIndex, Document } from "llamaindex";
import { ChromaVectorStore } from "@llamaindex/chroma";
import { Settings } from "llamaindex";
import { OpenAIEmbedding } from "@llamaindex/openai";
import { HuggingFaceEmbedding } from "@llamaindex/huggingface";

//  REQUIRED CONFIG
Settings.embedModel = new HuggingFaceEmbedding({
  modelType: "sentence-transformers",
  model: "all-MiniLM-L6-v2",
});

// Settings.embedModel = new OpenAIEmbedding({
//   model: "text-embedding-3-small",
// });

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // ✅ NOW A FUNCTION

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
