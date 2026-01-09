import express from "express";
import multer from "multer";
import { ingestPDF } from "../Controllers/indexServiceControllers.js";

// Creates a modular router ,behaves like a mini Express app
const router = express.Router();
//Uploaded files are stored in uploads/ Files get temporary random names
const upload = multer({ dest: "upload/" });

router.post("/", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF uploaded" });
  }

  const filePath = req.file.path;

  // ✅ Respond IMMEDIATELY
  res.status(202).json({
    message: "PDF uploaded successfully. Indexing started in background.",
  });

  // ✅ Fully detach indexing
  setImmediate(() => {
    ingestPDF(filePath)
      .then(() => console.log("✅ Indexing completed"))
      .catch((err) => console.error("❌ Indexing failed:", err));
  });
});

export default router;
