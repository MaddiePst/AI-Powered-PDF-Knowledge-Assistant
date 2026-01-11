import express from "express";
import multer from "multer";
import { ingestPDF } from "../Controllers/indexServiceControllers.js";

// Creates a modular router ,behaves like a mini Express app
const router = express.Router();
//Uploaded files are stored in uploads/ Files get temporary random names
const upload = multer({ dest: "upload/" });

router.post("/", (req, res) => {
  upload.single("pdf")(req, res, async (err) => {
    if (err) {
      console.error(" Multer error:", err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    console.log(" File received:", req.file.originalname);

    const filePath = req.file.path;

    // respond immediately
    res.status(202).json({
      message: "PDF uploaded successfully. Indexing started in background.",
    });

    // run indexing after response
    setImmediate(async () => {
      try {
        await ingestPDF(filePath);
        console.log(" Indexing completed");
      } catch (err) {
        console.error("❌Indexing failed:", err);
      }
    });
  });
});

export default router;
