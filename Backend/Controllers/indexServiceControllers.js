import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import {
  VectorStoreIndex,
  Document,
  Settings,
  storageContextFromDefaults,
} from "llamaindex";
import { OpenAIEmbedding, OpenAI } from "@llamaindex/openai";
import { log } from "../logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path so indexing works no matter what directory the server
// process was started from (relative paths broke on some setups).
const PERSIST_DIR = path.join(__dirname, "..", "vectorstore");

Settings.embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
  // OpenAI accepts large batches per request; the SDK default of 10 means
  // lots of sequential round-trips for bigger PDFs. Batching more chunks
  // per request cuts that network overhead and speeds up indexing.
  embedBatchSize: 100,
  // The underlying SDK defaults to a 60s timeout AND up to 10 retries per
  // request — a single flaky/slow call can silently retry for 10+ minutes
  // with no feedback. Kept short so a genuine problem (bad network,
  // invalid key, rate limit) surfaces quickly, well inside the hard
  // INDEXING_TIMEOUT_MS budget below.
  timeout: 10_000,
  maxRetries: 1,
});

Settings.llm = new OpenAI({
  model: "gpt-4o-mini",
  temperature: 0.2,
  timeout: 10_000,
  maxRetries: 1,
});

// Hard ceiling on how long indexing is allowed to run. If parsing/embedding
// hasn't finished by then, we stop waiting and report a timeout error —
// the UI is never left spinning past this no matter what the network does.
const INDEXING_TIMEOUT_MS = 30_000;

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

let index;

// Simple in-memory job status so the frontend can show real progress
// instead of a static "uploading..." message. Fine for a single-user/
// single-PDF app; would need a real job store for multi-user use.
let status = {
  state: "idle", // idle | processing | ready | error
  fileName: null,
  startedAt: null,
  finishedAt: null,
  tookMs: null,
  error: null,
};

export function getStatus() {
  return status;
}

async function runIngestPipeline(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  log("  · PDF buffer loaded", `(${dataBuffer.length} bytes)`);

  const pdfData = await pdfParse(dataBuffer);
  log("  · PDF parsed successfully", `(${pdfData.text?.length ?? 0} chars, ${pdfData.numpages ?? "?"} pages)`);

  if (!pdfData.text || !pdfData.text.trim()) {
    throw new Error(
      "No extractable text found in this PDF (it may be a scanned/image-only document)."
    );
  }

  const document = new Document({
    text: pdfData.text,
    metadata: { source: filePath },
  });
  log("  · Document created");

  // Local, file-based vector store — no external database server
  // required. Everything persists as JSON under PERSIST_DIR and is
  // reloaded automatically the next time the server starts.
  const storageContext = await storageContextFromDefaults({
    persistDir: PERSIST_DIR,
  });
  log("  · Storage context ready");

  log("  · Starting embedding call to OpenAI...");
  const embedStart = Date.now();
  const newIndex = await VectorStoreIndex.fromDocuments([document], {
    storageContext,
    logProgress: true, // logs per-batch embedding progress to the console
  });
  log(`  · Embedding completed in ${Date.now() - embedStart}ms`);

  return newIndex;
}

export async function ingestPDF(filePath, fileName) {
  const startedAt = Date.now();
  status = {
    state: "processing",
    fileName,
    startedAt,
    finishedAt: null,
    tookMs: null,
    error: null,
  };

  log("ingestPDF started for", fileName, "at", filePath);

  try {
    const newIndex = await Promise.race([
      runIngestPipeline(filePath),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Indexing timed out after ${
                  INDEXING_TIMEOUT_MS / 1000
                }s. Your connection to OpenAI may be slow or unreachable — check your network and try again.`
              )
            ),
          INDEXING_TIMEOUT_MS
        )
      ),
    ]);

    index = newIndex;

    const finishedAt = Date.now();
    status = {
      state: "ready",
      fileName,
      startedAt,
      finishedAt,
      tookMs: finishedAt - startedAt,
      error: null,
    };
    log("✅ Vector index created successfully in", finishedAt - startedAt, "ms");
  } catch (err) {
    const finishedAt = Date.now();
    status = {
      state: "error",
      fileName,
      startedAt,
      finishedAt,
      tookMs: finishedAt - startedAt,
      error: err.message,
    };
    log("❌ Indexing failed:", err?.stack || String(err));
    throw err;
  }
}

export function getIndex() {
  return index;
}

export async function loadIndexIfExists() {
  try {
    if (!fs.existsSync(PERSIST_DIR)) {
      log("ℹ️ No existing index yet — upload a PDF to get started.");
      return;
    }

    const storageContext = await storageContextFromDefaults({
      persistDir: PERSIST_DIR,
    });

    index = await VectorStoreIndex.init({ storageContext });
    status = {
      state: "ready",
      fileName: null,
      startedAt: null,
      finishedAt: Date.now(),
      tookMs: null,
      error: null,
    };
    log("✅ Index reloaded from disk");
  } catch (err) {
    log("ℹ️ No existing index found yet — upload a PDF to get started.");
  }
}
