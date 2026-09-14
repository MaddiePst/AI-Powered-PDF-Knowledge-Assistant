import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import {
  ingestPDF,
  getStatus,
} from "../Controllers/indexServiceControllers.js";
import { log } from "../logger.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path so this works regardless of the directory the server
// process happens to be started from, and create it if it's missing
// instead of letting multer crash with ENOENT.
const UPLOAD_DIR = path.join(__dirname, "..", "upload");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

/* ✅ Handle preflight explicitly */
router.options("/", (req, res) => {
  res.sendStatus(200);
});

/* ✅ Poll this while a PDF is indexing to show real progress in the UI */
router.get("/status", (req, res) => {
  // Belt-and-suspenders alongside app.disable("etag") in server.js — make
  // it explicit that this endpoint must never be served from cache, in
  // case a proxy/CDN in front of this (e.g. on Render) adds its own.
  res.set("Cache-Control", "no-store");
  res.json(getStatus());
});

/* ✅ POST upload */
router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      log("⚠️ POST /upload with no file attached");
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    log("📄 File received:", req.file.originalname, `(${req.file.size} bytes)`);

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Reject a second upload while one is still indexing instead of
    // letting two pipelines race to write the same vector store files —
    // that race is what was corrupting the store on Render.
    if (getStatus().state === "processing") {
      log("⚠️ Rejecting upload — indexing already in progress");
      fs.unlink(filePath, () => {});
      return res.status(409).json({
        error: "Another PDF is already being indexed. Please wait for it to finish.",
      });
    }

    /* Respond immediately */
    res.status(202).json({
      message: "PDF uploaded successfully. Indexing started in background.",
    });

    /* Background processing */
    setImmediate(async () => {
      log("🚀 Background indexing starting for", fileName);
      try {
        await ingestPDF(filePath, fileName);
        log("✅ Indexing completed for", fileName);
      } catch (err) {
        log("❌ Indexing failed:", err?.stack || String(err));
      } finally {
        // Clean up the temp upload so the folder doesn't grow forever.
        fs.unlink(filePath, () => {});
      }
    });
  } catch (err) {
    log("❌ Upload route error:", err?.stack || String(err));
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
