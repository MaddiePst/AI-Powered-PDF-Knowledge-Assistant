import express from "express";
import multer from "multer";
import { ingestPDF } from "../Controllers/indexServiceControllers.js";

const router = express.Router();

/* Store uploaded files temporarily */
const upload = multer({ dest: "upload/" });

/* ✅ Handle preflight explicitly */
router.options("/", (req, res) => {
  res.sendStatus(200);
});

/* ✅ POST upload */
router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    console.log("📄 File received:", req.file.originalname);

    const filePath = req.file.path;

    /* Respond immediately */
    res.status(202).json({
      message: "PDF uploaded successfully. Indexing started in background.",
    });

    /* Background processing */
    setImmediate(async () => {
      try {
        await ingestPDF(filePath);
        console.log("✅ Indexing completed");
      } catch (err) {
        console.error("❌ Indexing failed:", err);
      }
    });
  } catch (err) {
    console.error("❌ Upload route error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
